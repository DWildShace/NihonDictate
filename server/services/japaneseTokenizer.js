// server/services/japaneseTokenizer.js
import kuromoji from 'kuromoji';
import * as wanakana from 'wanakana';
import path from 'path';

let tokenizerInstance = null;
let tokenizerPromise = null;

/**
 * Lấy singleton tokenizer instance của Kuromoji
 */
export function getTokenizer() {
  if (tokenizerInstance) {
    return Promise.resolve(tokenizerInstance);
  }
  if (tokenizerPromise) {
    return tokenizerPromise;
  }

  tokenizerPromise = new Promise((resolve, reject) => {
    // Đường dẫn tương đối từ project root
    const dictPath = path.resolve('node_modules/kuromoji/dict');
    kuromoji.builder({ dicPath: dictPath }).build((err, tokenizer) => {
      if (err) {
        console.error('[TOKENIZER ERROR] Không thể khởi tạo Kuromoji:', err.message);
        tokenizerPromise = null;
        return reject(err);
      }
      tokenizerInstance = tokenizer;
      console.log('✅ [TOKENIZER] Kuromoji đã sẵn sàng phân tích ngữ pháp & âm đọc tiếng Nhật!');
      resolve(tokenizer);
    });
  });

  return tokenizerPromise;
}

/**
 * Phân tích và sinh cách đọc Hiragana & Furigana cho 1 câu tiếng Nhật bất kỳ
 *
 * @param {string} text - Câu tiếng Nhật cần phân tích
 * @returns {Promise<{ reading: string, furigana: string, charCount: number }>}
 */
export async function annotateJapaneseSentence(text = '') {
  if (!text || !text.trim()) {
    return { reading: '', furigana: '', charCount: 0 };
  }

  const cleanText = text.replace(/\s+/g, ' ').trim();
  const charCount = cleanText.replace(/[\s。、・「」『』（）()[\]{}"'.,!?！？〜～…\u3000]/g, '').length;

  try {
    const tokenizer = await getTokenizer();
    const tokens = tokenizer.tokenize(cleanText);

    // 1. Sinh cách đọc Hiragana thuần túy (dành cho so sánh ngữ âm Phonetic Match)
    const katakanaReading = tokens.map(t => t.reading || t.surface_form).join('');
    const reading = wanakana.toHiragana(katakanaReading);

    // 2. Sinh chuỗi Furigana gợi ý học từ: "cách_đọc Chữ_Hán"
    const furiganaParts = tokens.map(t => {
      // Nếu token có chứa chữ Hán (Kanji range: \u4e00-\u9faf) và có âm đọc khác mặt chữ
      if (t.reading && t.reading !== t.surface_form && /[\u4e00-\u9faf]/.test(t.surface_form)) {
        return `${wanakana.toHiragana(t.reading)} ${t.surface_form}`;
      }
      return t.surface_form;
    });

    const furigana = furiganaParts.join(' ');

    return {
      reading,
      furigana,
      charCount: charCount || cleanText.length,
    };
  } catch (err) {
    console.warn('[TOKENIZER] Phân tích thất bại cho câu:', cleanText, err.message);
    // Fallback nếu tokenizer gặp lỗi: dùng wanakana thuần
    return {
      reading: wanakana.toHiragana(cleanText),
      furigana: cleanText,
      charCount: charCount || cleanText.length,
    };
  }
}

/**
 * Phân tích hàng loạt danh sách câu
 */
export async function annotateJapaneseSentences(sentences = []) {
  if (!Array.isArray(sentences) || sentences.length === 0) return [];
  const tokenizer = await getTokenizer();

  return sentences.map((item) => {
    const rawText = (item.text || '').replace(/\s+/g, ' ').trim();
    if (!rawText) return item;

    const charCount = rawText.replace(/[\s。、・「」『』（）()[\]{}"'.,!?！？〜～…\u3000]/g, '').length;

    try {
      const tokens = tokenizer.tokenize(rawText);
      const katakanaReading = tokens.map(t => t.reading || t.surface_form).join('');
      const reading = wanakana.toHiragana(katakanaReading);

      const furiganaParts = tokens.map(t => {
        if (t.reading && t.reading !== t.surface_form && /[\u4e00-\u9faf]/.test(t.surface_form)) {
          return `${wanakana.toHiragana(t.reading)} ${t.surface_form}`;
        }
        return t.surface_form;
      });

      return {
        ...item,
        reading,
        furigana: furiganaParts.join(' '),
        charCount: charCount || rawText.length,
      };
    } catch (e) {
      return {
        ...item,
        reading: wanakana.toHiragana(rawText),
        furigana: rawText,
        charCount: charCount || rawText.length,
      };
    }
  });
}
