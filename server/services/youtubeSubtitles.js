// server/services/youtubeSubtitles.js
import dns from 'node:dns';
import { YoutubeTranscript } from 'youtube-transcript';

// Ưu tiên IPv4 trên Windows để tránh lỗi timeout IPv6 của Google
dns.setDefaultResultOrder('ipv4first');

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
 * Dịch văn bản từ tiếng Nhật sang tiếng Việt sử dụng MyMemory API (miễn phí, không chặn IP)
 */
export async function translateJaToVi(text) {
  if (!text || !text.trim()) return '';
  try {
    const cleanText = text.replace(/[\n\r]/g, ' ').trim();
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanText)}&langpair=ja|vi`;
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return '';
    const data = await res.json();
    if (data && data.responseData && data.responseData.translatedText) {
      return data.responseData.translatedText.trim();
    }
    return '';
  } catch (err) {
    // Nếu timeout hoặc lỗi dịch, bỏ qua êm thấm không làm treo tiến trình
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
 * Lấy danh sách phụ đề từ YouTube theo Video ID hoặc URL
 */
export async function fetchYouTubeSubtitles(url) {
  const videoId = extractVideoId(url);
  if (!videoId) {
    throw new Error('Link YouTube không hợp lệ hoặc không tìm thấy Video ID.');
  }

  const videoTitle = await fetchVideoTitle(videoId);

  // 1. Lấy transcript tiếng Nhật
  let rawList = [];
  try {
    rawList = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'ja' });
  } catch (errJa) {
    console.warn('[SUBTITLES] Không tìm thấy track ja trực tiếp, thử lấy track mặc định...');
    try {
      rawList = await YoutubeTranscript.fetchTranscript(videoId);
    } catch (errDefault) {
      throw new Error('Video này không có phụ đề CC công khai hoặc bị tác giả vô hiệu hóa.');
    }
  }

  if (!rawList || rawList.length === 0) {
    throw new Error('Không thể tìm thấy nội dung phụ đề cho video này.');
  }

  // Tách câu theo ký tự ngắt (dấu 。) để mỗi câu là một đơn vị luyện gõ hoàn chỉnh
  const splittedList = [];
  for (const item of rawList) {
    const rawText = (item.text || '').replace(/\s+/g, ' ').trim();
    if (!rawText) continue;
    const start = item.offset / 1000;
    const duration = item.duration / 1000;
    const end = start + duration;

    // Nếu văn bản có chứa dấu 。
    if (rawText.includes('。')) {
      const parts = rawText.split(/(?<=。)/g).map(s => s.trim()).filter(Boolean);
      if (parts.length > 1) {
        const totalLen = parts.reduce((acc, p) => acc + p.length, 0);
        let curStart = start;
        for (let i = 0; i < parts.length; i++) {
          const p = parts[i];
          const pDur = (p.length / totalLen) * duration;
          const pEnd = i === parts.length - 1 ? end : curStart + pDur;
          splittedList.push({
            text: p,
            offset: curStart * 1000,
            duration: (pEnd - curStart) * 1000,
          });
          curStart = pEnd;
        }
        continue;
      }
    }
    splittedList.push(item);
  }

  // 2. Tính toán tương đối mốc thời gian: Tạo khe an toàn (Safe Gap ~0.22s) giữa 2 câu liên tiếp
  // Đảm bảo đuôi câu 1 không bao giờ bị dính vào đầu câu 2
  const SAFE_GAP = 0.22;
  const MIN_DURATION = 0.6;
  const adjustedList = [];

  for (let idx = 0; idx < splittedList.length; idx++) {
    const cur = splittedList[idx];
    const curStart = parseFloat((cur.offset / 1000).toFixed(2));
    let curEnd = parseFloat(((cur.offset + cur.duration) / 1000).toFixed(2));

    // Nếu có câu tiếp theo, tính toán tương đối khoảng cách giữa 2 câu
    if (idx < splittedList.length - 1) {
      const nextStart = parseFloat((splittedList[idx + 1].offset / 1000).toFixed(2));
      // Nếu đuôi câu này chạm hoặc đè sát vào đầu câu sau (khoảng cách < SAFE_GAP)
      if (curEnd > nextStart - SAFE_GAP) {
        // Thu gọn đuôi câu trước về trước đầu câu sau SAFE_GAP để tạo khoảng nghỉ sạch sẽ
        const safeEnd = parseFloat((nextStart - SAFE_GAP).toFixed(2));
        if (safeEnd >= curStart + MIN_DURATION) {
          curEnd = safeEnd;
        } else if (nextStart > curStart + 0.3) {
          curEnd = parseFloat((nextStart - 0.08).toFixed(2));
        }
      }
    }

    // Đảm bảo mốc kết thúc luôn lớn hơn mốc bắt đầu
    if (curEnd <= curStart) {
      curEnd = parseFloat((curStart + MIN_DURATION).toFixed(2));
    }

    adjustedList.push({
      ...cur,
      startSec: curStart,
      endSec: curEnd,
      durSec: parseFloat((curEnd - curStart).toFixed(2)),
    });
  }

  // 3. Chuyển đổi sang định dạng chuẩn của NihonDictate
  const limitCount = Math.min(adjustedList.length, 120); // Giới hạn tối đa 120 câu
  const initialSlice = adjustedList.slice(0, limitCount);

  // Dịch song song 8 câu đầu tiên để trả về tức thì dưới 1.5 giây
  const transPromises = initialSlice.slice(0, 8).map(item => {
    const cleanText = (item.text || '').replace(/\s+/g, ' ').trim();
    return cleanText ? translateJaToVi(cleanText) : Promise.resolve('');
  });
  const firstTranslations = await Promise.all(transPromises);

  const formattedSentences = initialSlice.map((item, idx) => {
    const cleanText = (item.text || '').replace(/\s+/g, ' ').trim();

    return {
      id: idx + 1,
      start: item.startSec,
      end: item.endSec,
      duration: item.durSec,
      text: cleanText,
      vietnamese: idx < 8 ? (firstTranslations[idx] || '') : '',
      charCount: cleanText.replace(/[\s。、・]/g, '').length,
    };
  });

  return {
    videoId,
    videoTitle,
    totalSentences: formattedSentences.length,
    sentences: formattedSentences,
  };
}
