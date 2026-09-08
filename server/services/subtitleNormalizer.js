// server/services/subtitleNormalizer.js

/**
 * Chuẩn hóa danh sách phụ đề thô từ YouTube (Cả phụ đề thủ công và phụ đề tự động)
 *
 * @param {Array} rawList - Danh sách phụ đề thô { text, offset, duration }
 * @param {number} safeGap - Khoảng cách an toàn giữa 2 câu liên tiếp (mặc định 0.22s)
 * @param {number} minDuration - Thời lượng tối thiểu của một câu (mặc định 0.8s)
 * @returns {Array} Danh sách câu đã chuẩn hóa { text, start, end, duration }
 */
export function normalizeSubtitles(rawList = [], safeGap = 0.05, minDuration = 0.6) {
  if (!Array.isArray(rawList) || rawList.length === 0) return [];

  // Bước 1: Tách các đoạn chứa nhiều câu (theo dấu chấm, chấm than, chấm hỏi)
  const splittedList = [];
  for (const item of rawList) {
    const rawText = (item.text || '').replace(/\s+/g, ' ').trim();
    if (!rawText) continue;

    const start = item.offset / 1000;
    const duration = item.duration / 1000;
    const end = start + duration;

    // Kiểm tra các ký tự ngắt câu tiếng Nhật và quốc tế
    const hasPunctuation = /[。！？!?]/.test(rawText);

    if (hasPunctuation) {
      const parts = rawText.split(/(?<=[。！？!?])/g).map(s => s.trim()).filter(Boolean);
      if (parts.length > 1) {
        const totalLen = parts.reduce((acc, p) => acc + p.length, 0);
        let curStart = start;
        for (let i = 0; i < parts.length; i++) {
          const p = parts[i];
          const pDur = (p.length / totalLen) * duration;
          const pEnd = i === parts.length - 1 ? end : curStart + pDur;
          splittedList.push({
            text: p,
            start: parseFloat(curStart.toFixed(2)),
            end: parseFloat(pEnd.toFixed(2)),
            duration: parseFloat((pEnd - curStart).toFixed(2)),
          });
          curStart = pEnd;
        }
        continue;
      }
    }

    splittedList.push({
      text: rawText,
      start: parseFloat(start.toFixed(2)),
      end: parseFloat(end.toFixed(2)),
      duration: parseFloat(duration.toFixed(2)),
    });
  }

  // Bước 2: Gom các mẩu phụ đề quá vụn (< 1.2s) trong phụ đề tự động nếu khoảng cách liền kề
  const mergedList = [];
  let buffer = null;

  for (let i = 0; i < splittedList.length; i++) {
    const cur = splittedList[i];

    if (buffer) {
      // Nếu buffer và cur gần nhau (< 0.6s) và tổng thời lượng không vượt quá 6s
      const gap = cur.start - buffer.end;
      const combinedDuration = cur.end - buffer.start;

      if (gap < 0.6 && combinedDuration <= 6.0 && (buffer.duration < 1.4 || buffer.text.length < 5)) {
        buffer = {
          text: `${buffer.text} ${cur.text}`.trim(),
          start: buffer.start,
          end: cur.end,
          duration: parseFloat((cur.end - buffer.start).toFixed(2)),
        };
        continue;
      } else {
        mergedList.push(buffer);
        buffer = null;
      }
    }

    // Nếu câu hiện tại quá ngắn (< 1.2s) và chưa phải câu cuối cùng, đưa vào buffer gom
    if (cur.duration < 1.2 && i < splittedList.length - 1) {
      buffer = { ...cur };
    } else {
      mergedList.push(cur);
    }
  }

  if (buffer) {
    mergedList.push(buffer);
  }

  // Bước 3: Đảm bảo các câu liên tục tự nhiên, chỉ nắn lại nếu câu này thực sự lấn qua đầu câu sau
  const result = [];
  for (let i = 0; i < mergedList.length; i++) {
    const cur = mergedList[i];
    const curStart = cur.start;
    let curEnd = cur.end;

    if (i < mergedList.length - 1) {
      const nextStart = mergedList[i + 1].start;
      if (curEnd > nextStart) {
        curEnd = nextStart;
      }
    }

    if (curEnd <= curStart) {
      curEnd = parseFloat((curStart + minDuration).toFixed(2));
    }

    result.push({
      id: i + 1,
      text: cur.text,
      start: curStart,
      end: curEnd,
      duration: parseFloat((curEnd - curStart).toFixed(2)),
    });
  }

  return result;
}
