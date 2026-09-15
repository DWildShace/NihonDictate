// server/index.js
import express from 'express';
import cors from 'cors';
import { fetchYouTubeSubtitles, translateJaToVi, extractVideoId, getCachedLessonsList, deleteCachedLesson } from './services/youtubeSubtitles.js';
import { getTokenizer } from './services/japaneseTokenizer.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API kiểm tra tình trạng server
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// API lấy danh sách bài học đã cache trên máy chủ
app.get('/api/lessons/cached', (req, res) => {
  try {
    const list = getCachedLessonsList();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: 'Không thể đọc danh sách cache.' });
  }
});

// API xóa bài học khỏi cache theo Video ID
app.delete('/api/lessons/cached/:videoId', (req, res) => {
  try {
    const { videoId } = req.params;
    if (!videoId) {
      return res.status(400).json({ error: 'Thiếu Video ID.' });
    }
    const success = deleteCachedLesson(videoId);
    res.json({ success, videoId });
  } catch (err) {
    res.status(500).json({ error: 'Không thể xóa cache.' });
  }
});


// API trích xuất phụ đề từ YouTube URL (Tổng quát hóa cho mọi video)
app.post('/api/subtitles/extract', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'Vui lòng cung cấp đường dẫn video YouTube.' });
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      return res.status(400).json({ error: 'Đường dẫn YouTube không hợp lệ.' });
    }

    console.log(`[SUBTITLES] Bắt đầu xử lý cho Video ID: ${videoId}...`);
    const data = await fetchYouTubeSubtitles(url);
    res.json(data);
  } catch (err) {
    console.error('[SUBTITLES ERROR]:', err.message);
    res.status(500).json({ error: err.message || 'Không thể tải phụ đề cho video này.' });
  }
});

// API dịch nghĩa câu Nhật -> Việt bổ sung (On-Demand)
app.post('/api/translate', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.json({ translation: '' });
    }
    const translation = await translateJaToVi(text);
    res.json({ translation });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi dịch thuật.' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 NihonDictate Backend đang chạy tại http://localhost:${PORT}`);
  // Nạp trước Kuromoji Tokenizer vào RAM
  getTokenizer().catch(err => console.error('[TOKENIZER INIT ERROR]:', err.message));
});
