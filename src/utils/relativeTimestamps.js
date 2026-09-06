// src/utils/relativeTimestamps.js

/**
 * Tính toán tương đối mốc thời gian giữa các câu liên tiếp:
 * - Đảm bảo đuôi của câu trước (sentence[i].end) luôn kết thúc trước đầu câu sau (sentence[i+1].start)
 *   một khoảng đệm an toàn (safeGap ~0.22s).
 * - Triệt tiêu hoàn toàn khả năng bị nghe dính âm tiết đầu của câu kế tiếp do độ trễ dừng của YouTube Iframe.
 * - Đảm bảo độ dài mỗi câu vẫn hợp lý (không bị co ngắn dưới minDuration).
 *
 * @param {Array} sentences - Danh sách câu với các trường { id, start, end, duration, ... }
 * @param {number} safeGap - Khoảng cách an toàn tối thiểu giữa đuôi câu trước và đầu câu sau (mặc định 0.22s)
 * @param {number} minDuration - Thời lượng tối thiểu một câu (mặc định 0.6s)
 * @returns {Array} Danh sách câu đã được chuẩn hóa mốc thời gian tương đối
 */
export function sanitizeRelativeTimestamps(sentences = [], safeGap = 0.22, minDuration = 0.6) {
  if (!Array.isArray(sentences) || sentences.length === 0) return [];

  const result = [];

  for (let i = 0; i < sentences.length; i++) {
    const cur = sentences[i];
    const curStart = parseFloat(Number(cur.start || 0).toFixed(2));
    let curEnd = parseFloat(Number(cur.end || (curStart + (cur.duration || 2.0))).toFixed(2));

    // Nếu có câu kế tiếp, tính toán tương đối khoảng cách giữa đuôi câu này và đầu câu sau
    if (i < sentences.length - 1) {
      const next = sentences[i + 1];
      const nextStart = parseFloat(Number(next.start || 0).toFixed(2));

      // Nếu đuôi câu hiện tại sát hoặc lấn qua đầu câu sau (khoảng cách < safeGap)
      if (curEnd > nextStart - safeGap) {
        const adjustedEnd = parseFloat((nextStart - safeGap).toFixed(2));

        // Nếu sau khi lùi lại vẫn đảm bảo độ dài tối thiểu của câu
        if (adjustedEnd >= curStart + minDuration) {
          curEnd = adjustedEnd;
        } else if (nextStart > curStart + 0.3) {
          // Trường hợp câu ngắn, lấy điểm dừng trước câu sau ít nhất 0.08s
          curEnd = parseFloat((nextStart - 0.08).toFixed(2));
        }
      }
    }

    // Đảm bảo end luôn lớn hơn start
    if (curEnd <= curStart) {
      curEnd = parseFloat((curStart + minDuration).toFixed(2));
    }

    const finalDuration = parseFloat((curEnd - curStart).toFixed(2));

    result.push({
      ...cur,
      start: curStart,
      end: curEnd,
      duration: finalDuration,
    });
  }

  return result;
}
