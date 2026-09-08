// src/utils/japaneseDiff.js
import * as wanakana from 'wanakana';

/**
 * Chuẩn hóa số và chữ toàn giác (Full-width) sang bán giác (Half-width)
 */
export function normalizeFullWidth(str = '') {
  if (!str) return '';
  return str
    .replace(/[０-９]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0))
    .replace(/[Ａ-Ｚａ-ｚ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0))
    .replace(/（/g, '(')
    .replace(/）/g, ')');
}

/**
 * Chuyển đổi Romaji sang Hiragana thông minh với xử lý trợ từ (wa -> は, wo -> を)
 */
export function convertRomajiToHiragana(text = '') {
  if (!text) return '';
  // Xử lý trợ từ đứng rời trước khi ghép
  const spaced = text.replace(/\bwa\b/gi, ' は ').replace(/\bwo\b/gi, ' を ');
  return wanakana.toHiragana(spaced);
}

/**
 * Loại bỏ dấu câu, ghi chú phụ trong ngoặc, dấu sóng âm và khoảng trắng
 */
export function cleanJapaneseText(text = '') {
  if (!text) return '';
  let cleaned = normalizeFullWidth(String(text));

  // Loại bỏ các chú thích phụ bằng ngoặc đơn như (95F), (餌を)
  cleaned = cleaned.replace(/\([A-Za-z0-9\s°℃Ff]*\)/g, '');
  cleaned = cleaned.replace(/（[A-Za-z0-9\s°℃Ff]*）/g, '');

  // Loại bỏ dấu câu, ký tự đặc biệt, khoảng trắng
  return cleaned
    .replace(/[。、・「」『』（）()[\]{}"'.,!?！？\s\u3000〜～…℃]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Trích xuất cách đọc thuần Hiragana từ chuỗi Furigana
 */
export function extractKanaReading(furiganaOrText = '') {
  if (!furiganaOrText) return '';
  const normalized = normalizeFullWidth(String(furiganaOrText));
  const kanaOnly = normalized
    .replace(/[\u4e00-\u9faf]/g, '')
    .replace(/[。、・「」『』（）()[\]{}"'.,!?！？\s\u3000〜～…℃]/g, '');
  return wanakana.toHiragana(kanaOnly).trim();
}

/**
 * Chuẩn hóa các trợ từ đồng âm phổ biến để đối chiếu phát âm (わ/は, お/を)
 */
function normalizePhoneticParticles(kanaStr = '') {
  return kanaStr
    .replace(/わ/g, 'は')
    .replace(/お/g, 'を');
}

/**
 * Xây dựng ma trận LCS và mảng Diff trực quan
 */
function buildLcsDiff(userStr, targetStr) {
  const uLen = userStr.length;
  const tLen = targetStr.length;
  const dp = Array.from({ length: uLen + 1 }, () => Array(tLen + 1).fill(0));

  for (let i = 1; i <= uLen; i++) {
    for (let j = 1; j <= tLen; j++) {
      if (userStr[i - 1] === targetStr[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const lcsLength = dp[uLen][tLen];
  const maxLen = Math.max(uLen, tLen, 1);
  const accuracy = Math.round((lcsLength / maxLen) * 100);

  let i = uLen;
  let j = tLen;
  const diff = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && userStr[i - 1] === targetStr[j - 1]) {
      diff.unshift({
        char: userStr[i - 1],
        expected: targetStr[j - 1],
        status: 'correct',
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      diff.unshift({
        char: '',
        expected: targetStr[j - 1],
        status: 'missing',
      });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      diff.unshift({
        char: userStr[i - 1],
        expected: '',
        status: 'wrong',
      });
      i--;
    }
  }

  return { accuracy, diff };
}

/**
 * So sánh câu người dùng gõ với câu gốc (Hỗ trợ Kanji, Hiragana và Romaji)
 */
export function compareJapaneseSentence(userInput, target, furiganaText = '', readingText = '') {
  let targetSentence = '';
  let furigana = furiganaText;
  let reading = readingText;

  if (target && typeof target === 'object') {
    targetSentence = target.text || '';
    furigana = furigana || target.furigana || '';
    reading = reading || target.reading || '';
  } else {
    targetSentence = target || '';
  }

  const cleanUser = cleanJapaneseText(userInput);
  const cleanTarget = cleanJapaneseText(targetSentence);

  if (!cleanUser && !cleanTarget) {
    return {
      isCorrect: true,
      accuracy: 100,
      diff: [],
      phoneticMatch: true,
      isExact: true,
      userClean: '',
      targetClean: '',
    };
  }

  // 1. Khớp tuyệt đối Kanji / văn bản gốc
  if (cleanUser === cleanTarget) {
    const diff = cleanTarget.split('').map(char => ({
      char,
      expected: char,
      status: 'correct',
    }));
    return {
      isCorrect: true,
      accuracy: 100,
      diff,
      phoneticMatch: false,
      isExact: true,
      userClean: cleanUser,
      targetClean: cleanTarget,
    };
  }

  // 2. Chuyển đổi input của người dùng sang Hiragana
  // Dùng convertRomajiToHiragana để xử lý trợ từ wa/wo
  const convertedUserKana = convertRomajiToHiragana(userInput);
  const userHiragana = cleanJapaneseText(convertedUserKana);

  // Lấy chuỗi Hiragana chuẩn của câu gốc
  const targetKanaReading = cleanJapaneseText(
    reading || extractKanaReading(furigana || targetSentence)
  );

  // 3. Khớp ngữ âm Hiragana 100%
  const isExactPhonetic = targetKanaReading && userHiragana && (
    userHiragana === targetKanaReading ||
    normalizePhoneticParticles(userHiragana) === normalizePhoneticParticles(targetKanaReading)
  );

  if (isExactPhonetic) {
    const diff = cleanTarget.split('').map(char => ({
      char,
      expected: char,
      status: 'correct',
    }));
    return {
      isCorrect: true,
      accuracy: 100,
      diff,
      phoneticMatch: true,
      isExact: false,
      userClean: cleanUser,
      targetClean: cleanTarget,
      readingClean: targetKanaReading,
    };
  }

  // 4. Tính toán độ tương đồng chi tiết
  const kanjiMatch = buildLcsDiff(cleanUser, cleanTarget);

  let kanaMatch = { accuracy: 0, diff: [] };
  if (targetKanaReading) {
    kanaMatch = buildLcsDiff(userHiragana, targetKanaReading);
  }

  if (kanaMatch.accuracy > kanjiMatch.accuracy && targetKanaReading) {
    const isCorrect = kanaMatch.accuracy >= 90;
    return {
      isCorrect,
      accuracy: kanaMatch.accuracy,
      phoneticMatch: true,
      isExact: false,
      diff: kanaMatch.diff,
      userClean: userHiragana,
      targetClean: targetKanaReading,
    };
  }

  const isCorrect = kanjiMatch.accuracy >= 90;
  return {
    isCorrect,
    accuracy: kanjiMatch.accuracy,
    phoneticMatch: false,
    isExact: false,
    diff: kanjiMatch.diff,
    userClean: cleanUser,
    targetClean: cleanTarget,
  };
}
