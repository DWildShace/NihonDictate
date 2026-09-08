// src/utils/relativeTimestamps.js

/**
 * Tính toán tương đối mốc thời gian giữa các câu liên tiếp:
 * Chuyển 0.2s của cuối câu hiện tại sang đầu câu kế tiếp:
 * - Cuối câu hiện tại (cur.end) lùi lại 0.2s: Tuyệt đối không bị đọc lấn sang câu sau.
 * - Đầu câu kế tiếp (next.start) nhận 0.2s đó: Bắt đầu sớm hơn 0.2s để đón trọn âm đầu không bị nuốt chữ.
 *
 * @param {Array} sentences - Danh sách câu với các trường { id, start, end, duration, ... }
 * @param {number} shiftGap - Thời gian chuyển từ cuối câu này sang đầu câu kế tiếp (mặc định 0.2s)
 * @param {number} minDuration - Thời lượng tối thiểu một câu (mặc định 0.6s)
 * @returns {Array} Danh sách câu đã được chuẩn hóa mốc thời gian
 */
export function sanitizeRelativeTimestamps(sentences = [], shiftGap = 0.2, minDuration = 0.6) {
  if (!Array.isArray(sentences) || sentences.length === 0) return [];

  const list = sentences.map((s, idx) => ({
    ...s,
    id: s.id !== undefined ? s.id : idx + 1,
    start: parseFloat(Number(s.start || 0).toFixed(2)),
    end: parseFloat(Number(s.end || (Number(s.start || 0) + (s.duration || 2.0))).toFixed(2)),
  }));

  for (let i = 0; i < list.length - 1; i++) {
    const cur = list[i];
    const next = list[i + 1];

    const curStart = cur.start;
    const curEnd = cur.end;
    const nextStart = next.start;

    // Khoảng cách ban đầu giữa đuôi câu này và đầu câu kế tiếp
    const gap = nextStart - curEnd;

    if (gap < shiftGap) {
      // Hai câu liền kề hoặc rất sát nhau (< 0.5s)
      // Chuyển 0.5s từ đuôi câu hiện tại sang cho đầu câu kế tiếp
      const rawBoundary = Math.min(curEnd, nextStart);
      let newBoundary = parseFloat((rawBoundary - shiftGap).toFixed(2));

      // Giữ thời lượng tối thiểu cho câu hiện tại
      if (newBoundary < curStart + minDuration) {
        newBoundary = parseFloat(Math.min(rawBoundary, curStart + minDuration).toFixed(2));
      }

      // Giữ thời lượng tối thiểu cho câu kế tiếp
      if (newBoundary >= next.end - minDuration) {
        newBoundary = parseFloat(Math.max(curStart + minDuration, next.end - minDuration).toFixed(2));
      }

      // 1. Cuối câu hiện tại lùi lại newBoundary
      cur.end = newBoundary;
      // 2. Đầu câu kế tiếp nhận 0.5s bắt đầu từ newBoundary
      next.start = newBoundary;
    } else {
      // Có khoảng lặng giữa 2 câu (>= 0.5s)
      // Câu hiện tại giữ nguyên không bị lấn, câu sau lùi sớm hơn shiftGap để đón âm đầu
      next.start = parseFloat(Math.max(cur.end, next.start - shiftGap).toFixed(2));
    }

    cur.duration = parseFloat((cur.end - cur.start).toFixed(2));
    next.duration = parseFloat((next.end - next.start).toFixed(2));
  }

  if (list.length > 0) {
    const last = list[list.length - 1];
    last.duration = parseFloat((last.end - last.start).toFixed(2));
  }

  return list;
}
