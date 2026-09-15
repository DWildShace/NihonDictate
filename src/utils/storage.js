// src/utils/storage.js

const STORAGE_KEY = 'nihon_dictate_progress';

export function getSavedProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error('Lỗi khi đọc LocalStorage:', e);
    return {};
  }
}

export function saveSentenceProgress(lessonId, sentenceId, resultData) {
  try {
    const current = getSavedProgress();
    if (!current[lessonId]) {
      current[lessonId] = {
        completedSentences: {},
        updatedAt: new Date().toISOString(),
      };
    }
    current[lessonId].completedSentences[sentenceId] = {
      isCompleted: true,
      userAnswer: resultData.userAnswer,
      accuracy: resultData.accuracy,
      timestamp: Date.now(),
    };
    current[lessonId].updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch (e) {
    console.error('Lỗi khi lưu LocalStorage:', e);
  }
}

export function getLessonProgress(lessonId) {
  const all = getSavedProgress();
  return all[lessonId] || { completedSentences: {} };
}

// -------------------------------------------------------------
// FLASHCARD STORAGE & EXPORT HELPERS
// -------------------------------------------------------------
const FLASHCARDS_KEY = 'nihon_dictate_flashcards';

export function getFlashcards() {
  try {
    const raw = localStorage.getItem(FLASHCARDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Lỗi khi đọc Flashcards từ LocalStorage:', e);
    return [];
  }
}

export function saveFlashcard(card) {
  try {
    const cards = getFlashcards();
    const cleanFront = (card.front || '').replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (!cleanFront) return null;

    const newCard = {
      id: card.id || `card_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      front: cleanFront,
      reading: (card.reading || '').replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim(),
      back: (card.back || '').replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim(),
      context: (card.context || '').replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim(),
      contextVi: (card.contextVi || '').replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim(),
      timestamp: card.timestamp || '',
      lessonTitle: card.lessonTitle || '',
      videoId: card.videoId || '',
      createdAt: new Date().toISOString(),
    };

    // Kiểm tra xem đã có thẻ với nội dung mặt trước trùng lặp trong bài này chưa
    const existingIndex = cards.findIndex(
      c => c.front === newCard.front && c.lessonTitle === newCard.lessonTitle
    );

    const isUpdated = existingIndex >= 0;
    if (isUpdated) {
      cards[existingIndex] = { ...cards[existingIndex], ...newCard, id: cards[existingIndex].id };
    } else {
      cards.unshift(newCard);
    }

    localStorage.setItem(FLASHCARDS_KEY, JSON.stringify(cards));
    return { card: newCard, isUpdated };
  } catch (e) {
    console.error('Lỗi khi lưu Flashcard:', e);
    return null;
  }
}

export function deleteFlashcard(cardId) {
  try {
    const cards = getFlashcards().filter(c => c.id !== cardId);
    localStorage.setItem(FLASHCARDS_KEY, JSON.stringify(cards));
    return cards;
  } catch (e) {
    console.error('Lỗi khi xóa Flashcard:', e);
    return [];
  }
}

export function clearAllFlashcards() {
  try {
    localStorage.removeItem(FLASHCARDS_KEY);
    return [];
  } catch (e) {
    console.error('Lỗi khi dọn dẹp Flashcards:', e);
    return [];
  }
}

/**
 * Xuất dữ liệu Flashcards dạng TSV tương thích 100% với Anki (Import File TSV)
 * Cấu trúc cột: Front \t Reading \t Back \t Context (Ví dụ) \t Timestamp
 */
export function generateAnkiTsv(cards = []) {
  const sanitize = (text) => (text || '').replace(/\t/g, ' ').replace(/\r?\n/g, '<br>');
  const rows = cards.map(c => {
    const front = sanitize(c.front);
    const reading = sanitize(c.reading);
    const back = sanitize(c.back);
    const context = sanitize(c.context ? `${c.context}${c.contextVi ? ` (${c.contextVi})` : ''}` : '');
    const meta = sanitize(c.timestamp ? `[${c.timestamp}] ${c.lessonTitle || ''}` : c.lessonTitle || '');
    return [front, reading, back, context, meta].join('\t');
  });

  return rows.join('\n');
}

/**
 * Tải một file về máy người dùng
 */
export function downloadFile(content, filename, mimeType = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

