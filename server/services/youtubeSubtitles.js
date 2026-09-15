// server/services/youtubeSubtitles.js
import dns from 'node:dns';
import fs from 'node:fs';
import path from 'node:path';
import { YoutubeTranscript } from 'youtube-transcript';
import { annotateJapaneseSentences } from './japaneseTokenizer.js';
import { normalizeSubtitles } from './subtitleNormalizer.js';

// Ưu tiên IPv4 trên Windows để tránh lỗi timeout IPv6 của Google
dns.setDefaultResultOrder('ipv4first');

const CACHE_DIR = path.resolve('server/cache');
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

/**
 * Trích xuất YouTube Video ID từ nhiều dạng URL
 */
export function extractVideoId(url) {
  if (!url) return null;
  const trimmed = url.trim();

  // Nếu người dùng chỉ dán trực tiếp ID 11 ký tự
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/ ]{11})/;
  const match = trimmed.match(regExp);
  return match ? match[1] : null;
}

/**
 * Dịch văn bản từ tiếng Nhật sang tiếng Việt sử dụng MyMemory API (miễn phí, có cache RAM)
 */
const translationMemoryCache = new Map();

export async function translateJaToVi(text) {
  if (!text || !text.trim()) return '';
  const cleanText = text.replace(/[\n\r]/g, ' ').trim();

  if (translationMemoryCache.has(cleanText)) {
    return translationMemoryCache.get(cleanText);
  }

  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanText)}&langpair=ja|vi`;
    const res = await fetch(url, { signal: AbortSignal.timeout(3500) });
    if (!res.ok) return '';
    const data = await res.json();
    if (data && data.responseData && data.responseData.translatedText) {
      const translated = data.responseData.translatedText.trim();
      // Loại bỏ nếu API trả về chuỗi báo lỗi hạn mức
      if (!translated.includes('MYMEMORY WARNING') && !translated.includes('QUERY LENGTH LIMIT')) {
        translationMemoryCache.set(cleanText, translated);
        return translated;
      }
    }
    return '';
  } catch (err) {
    return '';
  }
}

/**
 * Lấy tiêu đề video từ trang YouTube
 */
async function fetchVideoTitle(videoId) {
  try {
    const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      signal: AbortSignal.timeout(4000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'ja,vi,en;q=0.9',
      },
    });
    if (!res.ok) return 'Bài học tiếng Nhật YouTube';
    const html = await res.text();
    const titleMatch = html.match(/<title>(.*?)<\/title>/);
    return titleMatch ? titleMatch[1].replace(' - YouTube', '').trim() : 'Bài học tiếng Nhật';
  } catch (e) {
    return 'Bài học tiếng Nhật';
  }
}

/**
 * Lấy danh sách phụ đề từ YouTube theo Video ID hoặc URL (Tổng quát hóa cho mọi video)
 */
export async function fetchYouTubeSubtitles(url) {
  const videoId = extractVideoId(url);
  if (!videoId) {
    throw new Error('Đường dẫn YouTube không hợp lệ hoặc không tìm thấy Video ID.');
  }

  // 1. Kiểm tra bộ nhớ đệm cache trên đĩa cứng
  const cacheFile = path.join(CACHE_DIR, `${videoId}.json`);
  if (fs.existsSync(cacheFile)) {
    try {
      const cachedData = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
      console.log(`⚡ [SUBTITLES CACHE] Nạp tức thì từ cache cho video: ${videoId}`);
      return cachedData;
    } catch (e) {
      console.warn('[SUBTITLES CACHE] Lỗi đọc file cache, sẽ tải lại từ YouTube...');
    }
  }

  // Fast-path: Nếu là video mẫu Ken (lZifLIXWOPU), nạp trực tiếp bộ 153 câu đã hoàn thiện
  if (videoId === 'lZifLIXWOPU') {
    try {
      const fullLesson = await import('../../src/data/kenVlogFullLesson.js');
      if (fullLesson?.KEN_VLOG_FULL_LESSON) {
        const result = {
          videoId,
          videoTitle: fullLesson.KEN_VLOG_FULL_LESSON.title,
          totalSentences: fullLesson.KEN_VLOG_FULL_LESSON.totalSentences,
          sentences: fullLesson.KEN_VLOG_FULL_LESSON.sentences,
        };
        fs.writeFileSync(cacheFile, JSON.stringify(result, null, 2), 'utf-8');
        return result;
      }
    } catch (e) {
      // Tiếp tục tải thông thường
    }
  }

  const videoTitle = await fetchVideoTitle(videoId);

  // 2. Lấy phụ đề tiếng Nhật từ YouTube API
  let rawList = [];
  try {
    rawList = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'ja' });
  } catch (errJa) {
    console.warn('[SUBTITLES] Không tìm thấy track ja trực tiếp, thử lấy track phụ đề mặc định...');
    try {
      rawList = await YoutubeTranscript.fetchTranscript(videoId);
    } catch (errDefault) {
      throw new Error(
        'Video này không có phụ đề tiếng Nhật công khai (CC) hoặc đã bị người đăng tắt phụ đề. Hãy thử một video khác có bật phụ đề tiếng Nhật!'
      );
    }
  }

  if (!rawList || rawList.length === 0) {
    throw new Error('Không thể tìm thấy nội dung phụ đề cho video này.');
  }

  // Kiểm tra xem phụ đề có chứa ký tự tiếng Nhật (Hiragana, Katakana, Kanji) hay không
  const sampleCombinedText = rawList.slice(0, 15).map(i => i.text || '').join('');
  const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(sampleCombinedText);
  if (!hasJapanese) {
    throw new Error(
      'Video này không có phụ đề tiếng Nhật (CC). Ứng dụng chuyên dùng để luyện tiếng Nhật, vui lòng chọn một video tiếng Nhật có bật phụ đề!'
    );
  }

  console.log(`[SUBTITLES] Đã tải ${rawList.length} khối phụ đề tiếng Nhật thô. Đang chuẩn hóa nhịp câu...`);

  // 3. Chuẩn hóa nhịp câu và mốc thời gian an toàn (Safe Gap 0.22s)
  const normalizedSentences = normalizeSubtitles(rawList, 0.22, 0.8);

  // Nâng giới hạn tối đa lên 2000 câu để hỗ trợ trọn vẹn video dài ~1-2 tiếng
  const sliceLimit = Math.min(normalizedSentences.length, 2000);
  const slicedSentences = normalizedSentences.slice(0, sliceLimit);

  console.log(`[TOKENIZER] Đang phân tích âm đọc Hiragana & Furigana cho ${slicedSentences.length} câu...`);

  // 4. Phân tích ngữ pháp & sinh cách đọc Hiragana và Furigana qua Kuromoji
  const annotatedSentences = await annotateJapaneseSentences(slicedSentences);

  // 5. Dịch song song 8 câu đầu tiên để hiển thị tức thì
  console.log(`[TRANSLATE] Đang dịch trước các câu mở đầu...`);
  const initialTransPromises = annotatedSentences.slice(0, 8).map(item => {
    return translateJaToVi(item.text);
  });
  const firstTranslations = await Promise.all(initialTransPromises);

  const finalSentences = annotatedSentences.map((item, idx) => ({
    ...item,
    vietnamese: idx < 8 ? (firstTranslations[idx] || '') : '',
  }));

  const lessonData = {
    videoId,
    videoTitle,
    totalSentences: finalSentences.length,
    sentences: finalSentences,
  };

  // Lưu vào cache
  try {
    fs.writeFileSync(cacheFile, JSON.stringify(lessonData, null, 2), 'utf-8');
    console.log(`💾 [SUBTITLES CACHE] Đã lưu cache video ${videoId} (${finalSentences.length} câu)`);
  } catch (err) {
    console.warn('[SUBTITLES CACHE] Không thể ghi file cache:', err.message);
  }

  return lessonData;
}

/**
 * Lấy danh sách các bài học đã được cache trên máy chủ
 */
export function getCachedLessonsList() {
  try {
    if (!fs.existsSync(CACHE_DIR)) return [];
    const files = fs.readdirSync(CACHE_DIR).filter(f => f.endsWith('.json'));
    const list = [];
    for (const file of files) {
      try {
        const filePath = path.join(CACHE_DIR, file);
        const raw = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(raw);
        const videoId = data.videoId || file.replace('.json', '');
        const title = data.videoTitle || data.title || `Video ${videoId}`;
        const totalSentences = data.totalSentences || (Array.isArray(data.sentences) ? data.sentences.length : 0);
        list.push({ videoId, title, totalSentences });
      } catch (err) {}
    }
    return list;
  } catch (e) {
    return [];
  }
}

/**
 * Xóa một bài học khỏi cache theo videoId
 */
export function deleteCachedLesson(videoId) {
  try {
    if (!videoId) return false;
    const cacheFile = path.join(CACHE_DIR, `${videoId}.json`);
    if (fs.existsSync(cacheFile)) {
      fs.unlinkSync(cacheFile);
      console.log(`🗑️ [SUBTITLES CACHE] Đã xóa cache cho video: ${videoId}`);
      return true;
    }
    return false;
  } catch (err) {
    console.error(`[CACHE DELETE ERROR] Không thể xóa cache video ${videoId}:`, err.message);
    return false;
  }
}

