# NihonDictate (語 - Luyện Nghe Gõ Phụ Đề Song Ngữ Nhật - Việt)

Ứng dụng web cá nhân hỗ trợ luyện nghe chép chính tả (Dictation) và luyện nói phản xạ (Shadowing) tiếng Nhật từ luồng video YouTube, tự động bóc tách và phân đoạn từng câu kèm dấu ngắt câu (`。`).

---

## ✨ Tính năng nổi bật

- 🎥 **Tích hợp YouTube IFrame Player API:**
  - Nhập bất kỳ link YouTube hoặc Video ID để học.
  - Tự động bóc tách phụ đề tiếng Nhật và bản dịch tiếng Việt song ngữ.
- ✂️ **Phân đoạn câu thông minh (Sentence Segmentation):**
  - Tách câu tự động theo ký tự ngắt (`。`).
  - **Mốc thời gian tương đối (Relative Timestamps):** Tự động tính toán khe nghỉ an toàn (`SAFE_GAP ~ 0.22s`) giữa đuôi câu trước và đầu câu sau, triệt tiêu hoàn toàn tình trạng dính âm thanh câu tiếp theo.
  - Tự động tạm dừng (Auto-Pause) chính xác ngay khi dứt câu.
- ⌨️ **Giao diện Dictation & Shadowing:**
  - So sánh đối chiếu câu gõ với đáp án theo thời gian thực (Visual Diff - đúng xanh lá, sai đỏ, thiếu gạch chân).
  - Khóa chuyển câu (Strict Gate - Hướng A): Chỉ cho phép chuyển câu kế tiếp khi đã gõ đúng 100% hoặc chủ động chọn "Bỏ qua / Xem đáp án".
  - Chế độ Shadowing: Cho phép ghi âm giọng đọc trực tiếp qua Microphone và đối chiếu với giọng người bản xứ.
- ⚡ **Phím tắt tiện lợi:**
  - `Ctrl + Space`: Tua và nghe lại câu hiện tại tức thì.
  - `Enter`: Lần 1: Kiểm tra đáp án; Lần 2: Chuyển sang câu tiếp theo (khi đã hoàn thành).
  - `Ctrl + N`: Chuyển sang câu tiếp theo (có kiểm tra ràng buộc).

---

## 🚀 Cài đặt & Chạy ứng dụng

### Yêu cầu hệ thống
- **Node.js**: v18+ trở lên
- **NPM**

### Cách 1: Khởi động nhanh trên Windows
Chạy trực tiếp file script:
```cmd
start.bat
```

### Cách 2: Chạy bằng dòng lệnh

1. **Cài đặt các thư viện phụ thuộc:**
```bash
npm install
```

2. **Khởi chạy đồng thời Backend và Frontend:**
```bash
npm run dev
```

3. Mở trình duyệt và truy cập:
```
http://localhost:5173
```

---

## 🛠️ Công nghệ sử dụng
- **Frontend**: React 19, Vite 6, TailwindCSS v4, Lucide Icons, Wanakana.
- **Backend API**: Express.js, Node.js, `youtube-transcript`, MyMemory API (Dịch song ngữ).
- **Video Integration**: YouTube IFrame Player API.
