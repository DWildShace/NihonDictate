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
