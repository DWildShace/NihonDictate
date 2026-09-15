# 🇯🇵 NihonDictate (日本語ディクテーション)
### Ứng Dụng Luyện Nghe Gõ Phụ Đề & Flashcard Tiếng Nhật Song Ngữ Thông Minh

[🇻🇳 Tiếng Việt](README.md) • [🇬🇧 English](README.en.md)

[![React](https://img.shields.io/badge/React-19-61dafb.svg?style=flat-square&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646cff.svg?style=flat-square&logo=vite)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8.svg?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-4.x-000000.svg?style=flat-square&logo=express)](https://expressjs.com/)
[![License](https://img.shields.io/badge/license-MIT-green.svg?style=flat-square)](LICENSE)

---

## 📖 Giới thiệu

**NihonDictate** là ứng dụng hỗ trợ tự học tiếng Nhật chuyên sâu thông qua phương pháp **Nghe Chép Chính Tả (Dictation)** và **Luyện Nói Phản Xạ (Shadowing)** trực tiếp từ bất kỳ video YouTube nào (Tin tức NHK, Anime, Phim ảnh, Vlog, J-Pop...).

Ứng dụng tự động bóc tách phụ đề tiếng Nhật, phân tích từ loại & âm đọc Furigana/Hiragana bằng Kuromoji, dịch nghĩa song ngữ tiếng Việt, tự động dừng phát theo từng câu và tích hợp bộ công cụ tạo Flashcard siêu tốc xuất sang **Anki, Quizlet, MochiMochi**.

---

## ✨ Tính năng nổi bật

### 1. 🎥 Tích hợp YouTube & Phân đoạn câu chuẩn xác
- **Nạp link YouTube linh hoạt**: Dán bất kỳ đường dẫn YouTube nào hoặc chọn nhanh từ danh sách bài học có sẵn.
- **Tách câu thông minh**: Nhận diện ngắt câu tự nhiên theo dấu `。` hoặc khoảng dừng hội thoại.
- **Ranh giới âm thanh an toàn (`Safe Gap ~0.22s`)**: Tự động dịch mốc dừng nghỉ giữa các câu, đảm bảo nghe trọn vẹn âm cuối của câu hiện tại mà không bị lẹm âm của câu tiếp theo.
- **Tự động dừng (Auto-pause)**: Video tự động dừng ngay khi hết câu để bạn tập trung gõ chính tả.

### 2. ⌨️ Luyện gõ chính tả (Dictation) chuyên nghiệp
- **Bộ gõ Hiragana tích hợp (Wanakana)**: Gõ Romaji tự chuyển sang Hiragana mượt mà ngay trên web, xử lý chuẩn xác phím `Backspace`, `Enter`, bộ đệm IME không bị nhảy giật con trỏ.
- **So sánh đối chiếu trực quan (Visual Diff)**:
  - 🟢 **Xanh lá**: Ký tự gõ chính xác 100%.
  - 🔴 **Đỏ**: Ký tự gõ sai lệch.
  - ⚪ **Gạch chân xám**: Ký tự còn thiếu.
- **Chế độ học linh hoạt**:
  - *Chế độ Chặt chẽ (Strict Gate)*: Yêu cầu gõ đúng 100% hoặc chủ động bấm xem đáp án mới được qua câu tiếp theo.
  - *Chế độ Tự do (Free Mode)*: Cho phép click vào bất kỳ câu nào trong danh sách để luyện tập.

### 3. ⭐ Thanh Quick Flashcard thông minh (Dưới Video)
- **Tạo Flashcard tức thì khi bôi đen**: Bôi đen bất kỳ từ vựng hoặc cụm từ nào trên phụ đề/câu bài học, thanh Quick Flashcard màu vàng nổi bật sẽ tự động xuất hiện.
- **Tự động dịch & tra âm đọc**: Hệ thống tự động phân tích Furigana/Hiragana và gọi API dịch nghĩa tiếng Việt cho từ được chọn.
- **Chỉnh sửa linh hoạt**: Cho phép gõ/sửa trực tiếp chữ Hán hoặc từ vựng trước khi lưu.
- **Lưu ngữ cảnh**: Tự động lưu kèm câu gốc, mốc thời gian và bài học liên quan.

### 4. 🗃️ Sổ tay Flashcard & Xuất file Anki / Quizlet
- Quản lý toàn bộ từ vựng đã lưu trong lúc học.
- Lọc từ vựng theo từng bài học hoặc tìm kiếm theo từ khóa.
- Chế độ lật thẻ Flashcard tương tác trực tiếp để ôn tập.
- **Xuất file 1-Click**:
  - 📦 **Anki (.txt)**: Định dạng chuẩn Tab-separated kèm Furigana, Nghĩa, Câu ngữ cảnh, sẵn sàng Import vào Anki Deck.
  - 📝 **Quizlet (.txt / CSV)**: Dán trực tiếp vào bộ thẻ Quizlet hoặc MochiMochi.
  - 💾 **Sao lưu JSON**: Xuất/nhập dữ liệu lưu trữ trên trình duyệt (LocalStorage).

### 5. 📑 Hỗ trợ Video dài & Phân chia phần học
- Server hỗ trợ trích xuất lên tới **2000 câu** cho các video dài 1–2 tiếng.
- Danh sách câu tự động chia nhỏ thành các **Phần 50 câu** (`Phần 1: 1-50`, `Phần 2: 51-100`,...) giúp giao diện siêu nhẹ, mượt mà và dễ dàng theo dõi tiến độ từng phần.

### 6. 🗄️ Quản lý Cache bài học trên máy chủ
- Dropdown thông minh ở thanh Header: Xem danh sách toàn bộ các video đã phân tích và lưu cache trên máy.
- Mở lại bài học ngay lập tức mà không cần tốn thời gian tải hay phân tích lại.
- Dễ dàng xóa bài học khỏi cache hoặc khôi phục khi cần.

### 7. 🗣️ Chế độ Shadowing (Luyện nói) & Danh sách phụ đề
- **Shadowing**: Bật Microphone thu âm giọng đọc của bạn và đối chiếu trực tiếp với cách phát âm của người bản xứ.
- **Subtitles Tab**: Xem toàn bộ kịch bản song ngữ với Furigana để đọc hiểu tổng quát toàn bộ video.

---

## ⌨️ Bảng Phím Tắt Nhanh

| Phím tắt | Chức năng |
| :--- | :--- |
| <kbd>Ctrl</kbd> + <kbd>Space</kbd> | Tua và phát lại câu hiện tại |
| <kbd>Enter</kbd> | Kiểm tra kết quả câu vừa gõ |
| <kbd>Alt</kbd> + <kbd>N</kbd> | Chuyển sang câu tiếp theo |
| <kbd>Alt</kbd> + <kbd>H</kbd> | Dịch câu sang tiếng Việt (hoặc ẩn/hiện nghĩa) |
| <kbd>Alt</kbd> + <kbd>F</kbd> | Bật / Tắt hiển thị Furigana (Hiragana trên đầu chữ Hán) |
| <kbd>Alt</kbd> + <kbd>L</kbd> | Bật / Tắt chế độ lặp lại câu hiện tại (Loop) |

---

## 🚀 Cài đặt & Hướng dẫn sử dụng

### Yêu cầu tiên quyết
- [Node.js](https://nodejs.org/) phiên bản **18.x** trở lên.
- Trình quản lý gói `npm` (đi kèm Node.js).

### Cách 1: Khởi chạy siêu tốc trên Windows
Chỉ cần nhấp đúp vào file:
```cmd
start.bat
```
*(Script sẽ tự kiểm tra và chạy cả Backend lẫn Frontend).*

### Cách 2: Khởi chạy thủ công bằng dòng lệnh

1. **Clone mã nguồn về máy:**
```bash
git clone https://github.com/DWildShace/NihonDictate.git
cd NihonDictate
```

2. **Cài đặt các gói phụ thuộc:**
```bash
npm install
```

3. **Chạy đồng thời cả Frontend và Backend server:**
```bash
npm run dev
```

> Hoặc nếu muốn chạy riêng từng phần:
> - Backend: `npm run dev:backend` (Cổng `http://localhost:3001`)
> - Frontend: `npm run dev:frontend` (Cổng `http://localhost:5173`)

4. **Mở trình duyệt:**
Truy cập: [http://localhost:5173](http://localhost:5173)

---

## 🏗️ Kiến trúc & Công nghệ sử dụng

```
NihonDictate/
├── server/                         # Backend Express Service
│   ├── cache/                      # Thư mục lưu trữ JSON phụ đề đã phân tích
│   ├── services/
│   │   ├── japaneseTokenizer.js    # Phân tích hình thái từ & Furigana (Kuromoji)
│   │   ├── subtitleNormalizer.js   # Chuẩn hóa ngắt câu & Safe Gap mốc thời gian
│   │   └── youtubeSubtitles.js     # Trích xuất transcript & dịch tự động
│   └── index.js                    # API Routes (Extract, Cache, Health)
├── src/                            # Frontend React Application
│   ├── components/
│   │   ├── DictationCard.jsx       # Thẻ gõ chính tả, diff trực quan, phím tắt
│   │   ├── QuickFlashcardBar.jsx   # Thanh bôi đen tạo Flashcard nhanh dưới video
│   │   ├── FlashcardModal.jsx      # Quản lý sổ flashcard, lật thẻ & xuất Anki
│   │   ├── Header.jsx              # URL input, menu bài học & quản lý cache
│   │   ├── SentenceList.jsx        # Danh sách câu, chia phần video dài (50 câu/phần)
│   │   ├── ShadowingTab.jsx        # Ghi âm giọng nói và luyện phản xạ
│   │   ├── SubtitlesTab.jsx        # Kịch bản phụ đề song ngữ đầy đủ
│   │   └── VideoPlayer.jsx         # YouTube IFrame API đồng bộ mốc thời gian
│   ├── utils/
│   │   ├── japaneseDiff.js         # Thuật toán so khớp ký tự tiếng Nhật
│   │   ├── relativeTimestamps.js   # Xử lý an toàn mốc thời gian audio
│   │   └── storage.js              # Quản lý LocalStorage (Flashcards, Tiến độ)
│   ├── App.jsx                     # Component chính, điều phối luồng dữ liệu
│   └── main.jsx                    # Điểm khởi động ứng dụng
├── start.bat                       # Script khởi chạy 1-click trên Windows
└── package.json                    # Cấu hình dự án & dependencies
```

### Công nghệ chính:
- **Frontend**: React 19, Vite 6, Tailwind CSS v4, Lucide React, Wanakana.
- **Backend**: Node.js, Express 4, `youtube-transcript`, `kuromoji` (phân tích từ vựng tiếng Nhật), Google/MyMemory Translation API.
- **Media**: YouTube IFrame Player API.

---

## 📝 Giấy phép (License)

Dự án được phát hành theo giấy phép [MIT License](LICENSE).
Tự do sử dụng, chỉnh sửa và phân phối phục vụ mục đích học tập cá nhân và phi thương mại.
