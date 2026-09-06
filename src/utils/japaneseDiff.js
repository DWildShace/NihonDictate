// src/utils/japaneseDiff.js
import * as wanakana from 'wanakana';

/**
 * Loại bỏ dấu câu và khoảng trắng tiếng Nhật/Việt/Anh để so sánh linh hoạt
 */
export function cleanJapaneseText(text) {
  if (!text) return '';
  return text
    .replace(/[。、・「」『』（）()[\]{}"'.,!?！？\s\u3000]/g, '')
    .trim();
}

/**
 * Trích xuất phiên âm thuần Kana từ chuỗi Furigana
 */
export function extractKanaReading(furiganaOrText) {
  if (!furiganaOrText) return '';
  // Loại bỏ các chữ Hán (Kanji range: \u4e00-\u9faf) và dấu câu để giữ lại thuần Kana
  const kanaOnly = furiganaOrText
    .replace(/[\u4e00-\u9faf]/g, '')
    .replace(/[。、・「」『』（）()[\]{}"'.,!?！？\s\u3000]/g, '');
  return wanakana.toHiragana(kanaOnly).trim();
}

/**
 * Thuật toán Longest Common Subsequence (LCS) để so sánh chi tiết từng ký tự
 * @param {string} userInput - Câu người dùng gõ
 * @param {string} targetSentence - Câu gốc chuẩn
 * @param {string} [furiganaText] - Chuỗi Furigana phiên âm (nếu có)
 */
export function compareJapaneseSentence(userInput, targetSentence, furiganaText = '') {
  const cleanUser = cleanJapaneseText(userInput);
  const cleanTarget = cleanJapaneseText(targetSentence);

  if (!cleanUser && !cleanTarget) {
    return {
      isCorrect: true,
      accuracy: 100,
      diff: [],
      phoneticMatch: true,
      userClean: '',
      targetClean: '',
    };
  }

  // 1. Kiểm tra khớp tuyệt đối văn bản gốc
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
      phoneticMatch: true,
      isExact: true,
      userClean: cleanUser,
      targetClean: cleanTarget,
    };
  }

  // 2. Kiểm tra khớp ngữ âm (Kana / Hiragana) thông qua Furigana hoặc Wanakana
  const userHiragana = cleanJapaneseText(wanakana.toHiragana(cleanUser));
  const targetKanaReading = extractKanaReading(furiganaText || targetSentence);
  const isPhoneticExact = targetKanaReading && userHiragana && userHiragana === targetKanaReading;

  if (isPhoneticExact) {
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
    };
  }

  // 3. Xây dựng ma trận LCS để tìm sự khác biệt từng ký tự
  const uLen = cleanUser.length;
  const tLen = cleanTarget.length;
  const dp = Array.from({ length: uLen + 1 }, () => Array(tLen + 1).fill(0));

  for (let i = 1; i <= uLen; i++) {
    for (let j = 1; j <= tLen; j++) {
      if (cleanUser[i - 1] === cleanTarget[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const lcsLength = dp[uLen][tLen];
  const maxLen = Math.max(uLen, tLen, 1);
  const rawAccuracy = Math.round((lcsLength / maxLen) * 100);

  // 4. Lần ngược (backtrack) để tạo mảng kết quả trực quan
  let i = uLen;
  let j = tLen;
  const diff = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && cleanUser[i - 1] === cleanTarget[j - 1]) {
      diff.unshift({
        char: cleanUser[i - 1],
        expected: cleanTarget[j - 1],
        status: 'correct',
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      // Ký tự trong câu gốc mà người dùng bỏ sót
      diff.unshift({
        char: '',
        expected: cleanTarget[j - 1],
        status: 'missing',
      });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      // Ký tự thừa hoặc gõ sai mà người dùng nhập vào
      diff.unshift({
        char: cleanUser[i - 1],
        expected: '',
        status: 'wrong',
      });
      i--;
    }
  }

  return {
    isCorrect: rawAccuracy >= 95,
    accuracy: rawAccuracy,
    phoneticMatch: false,
    isExact: false,
    diff,
    userClean: cleanUser,
    targetClean: cleanTarget,
  };
}
