// src/components/FlashcardModal.jsx
import React, { useState, useEffect } from 'react';
import {
  X,
  BookOpen,
  Download,
  Copy,
  Trash2,
  ExternalLink,
  RotateCw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Search,
  Check,
  FileSpreadsheet,
  FileCode,
  Layers,
  Pencil,
} from 'lucide-react';
import {
  getFlashcards,
  deleteFlashcard,
  clearAllFlashcards,
  generateAnkiTsv,
  downloadFile,
} from '../utils/storage';

export function FlashcardModal({ isOpen, onClose, onCardChange }) {
  const [cards, setCards] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [mode, setMode] = useState('list'); // 'list' | 'study'
  const [studyIndex, setStudyIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);

  // Trạng thái chỉnh sửa thẻ
  const [editingCardId, setEditingCardId] = useState(null);
  const [editFront, setEditFront] = useState('');
  const [editReading, setEditReading] = useState('');
  const [editBack, setEditBack] = useState('');

  // Nạp danh sách thẻ mỗi khi mở modal
  useEffect(() => {
    if (isOpen) {
      const list = getFlashcards();
      setCards(list);
      setStudyIndex(0);
      setIsFlipped(false);
      setEditingCardId(null);
    }
  }, [isOpen]);

  const handleStartEdit = (card) => {
    setEditingCardId(card.id);
    setEditFront(card.front || '');
    setEditReading(card.reading || '');
    setEditBack(card.back || '');
  };

  const handleSaveEdit = (id) => {
    const cleanFront = editFront.trim();
    if (!cleanFront) return;
    const updated = cards.map((c) =>
      c.id === id
        ? {
            ...c,
            front: cleanFront,
            reading: editReading.trim(),
            back: editBack.trim(),
          }
        : c
    );
    setCards(updated);
    try {
      localStorage.setItem('nihon_flashcards', JSON.stringify(updated));
    } catch (e) {
      console.error('Lỗi khi cập nhật thẻ:', e);
    }
    setEditingCardId(null);
  };

  if (!isOpen) return null;

  const filteredCards = cards.filter(
    (c) =>
      c.front?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.reading?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.back?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.context?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (id) => {
    const updated = deleteFlashcard(id);
    setCards(updated);
    if (onCardChange) onCardChange(updated.length);
    if (studyIndex >= updated.length) {
      setStudyIndex(Math.max(0, updated.length - 1));
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ thẻ Flashcard đã lưu không?')) {
      const updated = clearAllFlashcards();
      setCards(updated);
      if (onCardChange) onCardChange(0);
    }
  };

  // Xuất file Anki TSV
  const handleExportAnki = () => {
    if (cards.length === 0) return;
    const tsvContent = generateAnkiTsv(cards);
    downloadFile(tsvContent, `nihon_dictate_anki_${Date.now()}.tsv`, 'text/tab-separated-values;charset=utf-8');
  };

  // Sao chép cho Quizlet / Mochi
  const handleCopyForQuizlet = () => {
    if (cards.length === 0) return;
    const tsvContent = generateAnkiTsv(cards);
    navigator.clipboard.writeText(tsvContent).then(() => {
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2500);
    });
  };

  // Xuất file JSON dự phòng
  const handleExportJson = () => {
    if (cards.length === 0) return;
    const jsonContent = JSON.stringify(cards, null, 2);
    downloadFile(jsonContent, `nihon_dictate_flashcards_${Date.now()}.json`, 'application/json;charset=utf-8');
  };

  const currentStudyCard = filteredCards[studyIndex] || null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header Modal */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-slate-100 text-base sm:text-lg flex items-center gap-2">
                <span>Sổ Từ Vựng & Flashcards</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 border border-slate-700">
                  {cards.length} thẻ
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Xuất nhanh sang Anki, Quizlet, MochiMochi hoặc ôn tập trực tiếp
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Thanh công cụ: Chuyển tab chế độ (Danh sách vs Ôn tập) & Xuất File */}
        <div className="px-5 py-3 border-b border-slate-800/80 bg-slate-950/40 flex flex-wrap items-center justify-between gap-3">
          {/* Nút chuyển chế độ */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => {
                setMode('list');
                setIsFlipped(false);
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
                mode === 'list'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-teal-400" />
              <span>Danh sách ({filteredCards.length})</span>
            </button>
            <button
              onClick={() => {
                setMode('study');
                setIsFlipped(false);
              }}
              disabled={filteredCards.length === 0}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none ${
                mode === 'study'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <RotateCw className="w-3.5 h-3.5 text-amber-400" />
              <span>Lật thẻ ôn tập</span>
            </button>
          </div>

          {/* Nhóm nút xuất file sang Anki / Quizlet */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportAnki}
              disabled={cards.length === 0}
              className="px-2.5 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
              title="Tải file TSV chuẩn Anki: Mở Anki -> File -> Import -> Chọn file này"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Xuất Anki (.tsv)</span>
            </button>

            <button
              onClick={handleCopyForQuizlet}
              disabled={cards.length === 0}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
              title="Sao chép toàn bộ dữ liệu bảng để dán thẳng vào Quizlet, MochiMochi, AnkiWeb"
            >
              {copiedToast ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">Đã sao chép!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Chép cho Quizlet</span>
                </>
              )}
            </button>

            <button
              onClick={handleExportJson}
              disabled={cards.length === 0}
              className="px-2 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 transition cursor-pointer disabled:opacity-30"
              title="Xuất file JSON sao lưu toàn bộ thẻ"
            >
              <FileCode className="w-3.5 h-3.5 text-slate-400" />
              <span>JSON</span>
            </button>

            {cards.length > 0 && (
              <button
                onClick={handleClearAll}
                className="px-2 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-medium flex items-center gap-1 transition cursor-pointer"
                title="Xóa tất cả các thẻ"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Nội dung chính của Modal */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {cards.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-800/80 text-slate-500 flex items-center justify-center mx-auto border border-slate-700/60">
                <BookOpen className="w-7 h-7" />
              </div>
              <h3 className="font-semibold text-slate-300 text-base">Chưa có thẻ Flashcard nào</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                Ở phần <strong>Tập chép</strong>, sau khi kiểm tra hoặc xem đáp án, hãy bôi đen bất kỳ từ vựng nào hoặc bấm nút <strong>"Lưu vào Flashcard"</strong> để gom từ mới vào đây nhé!
              </p>
            </div>
          ) : mode === 'study' ? (
            /* CHẾ ĐỘ LẬT THẺ ÔN TẬP */
            <div className="max-w-lg mx-auto py-4 space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>
                  Thẻ <strong>{studyIndex + 1}</strong> / {filteredCards.length}
                </span>
                <span className="text-[11px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">
                  Bấm vào thẻ để lật mặt
                </span>
              </div>

              {currentStudyCard && (
                <div
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="min-h-[220px] p-6 rounded-3xl bg-slate-950 border-2 border-slate-800 hover:border-amber-500/50 flex flex-col items-center justify-center text-center cursor-pointer transition-all shadow-xl select-none group"
                >
                  {!isFlipped ? (
                    /* MẶT TRƯỚC: TỪ TIẾNG NHẬT */
                    <div className="space-y-3 animate-fadeIn">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        Mặt trước (Tiếng Nhật)
                      </span>
                      <h3 className="text-2xl sm:text-3xl font-bold font-jp text-white group-hover:text-amber-300 transition">
                        {currentStudyCard.front}
                      </h3>
                      {currentStudyCard.reading && (
                        <p className="text-xs text-teal-400/80 font-jp">
                          Gợi ý âm đọc: {currentStudyCard.reading}
                        </p>
                      )}
                      <p className="text-[11px] text-slate-500 pt-3">
                        👉 Bấm để xem nghĩa tiếng Việt & ngữ cảnh
                      </p>
                    </div>
                  ) : (
                    /* MẶT SAU: CÁCH ĐỌC & NGHĨA */
                    <div className="space-y-3 animate-fadeIn w-full">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                        Mặt sau (Bản dịch & Cách đọc)
                      </span>
                      <div className="text-lg sm:text-xl font-bold font-jp text-teal-300">
                        {currentStudyCard.reading || currentStudyCard.front}
                      </div>
                      <div className="text-base sm:text-lg font-medium text-emerald-300">
                        {currentStudyCard.back || 'Chưa có bản dịch nghĩa'}
                      </div>
                      {currentStudyCard.context && (
                        <div className="mt-3 pt-3 border-t border-slate-800/80 text-xs text-slate-400 text-left bg-slate-900/60 p-3 rounded-xl">
                          <span className="font-semibold text-slate-500 block mb-1">
                            Câu ví dụ ngữ cảnh:
                          </span>
                          <p className="font-jp text-slate-200">{currentStudyCard.context}</p>
                          {currentStudyCard.contextVi && (
                            <p className="text-slate-400 text-[11px] mt-0.5">
                              {currentStudyCard.contextVi}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Phím điều hướng lật thẻ */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  onClick={() => {
                    setIsFlipped(false);
                    setStudyIndex((prev) => Math.max(0, prev - 1));
                  }}
                  disabled={studyIndex === 0}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Thẻ trước</span>
                </button>

                <button
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border border-amber-500/30"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>{isFlipped ? 'Xem lại mặt trước' : 'Lật xem đáp án'}</span>
                </button>

                <button
                  onClick={() => {
                    setIsFlipped(false);
                    setStudyIndex((prev) => Math.min(filteredCards.length - 1, prev + 1));
                  }}
                  disabled={studyIndex === filteredCards.length - 1}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                >
                  <span>Thẻ sau</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* CHẾ ĐỘ DANH SÁCH THẺ */
            <div className="space-y-3">
              {/* Ô tìm kiếm thẻ */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm kiếm từ vựng, cách đọc hoặc nghĩa tiếng Việt..."
                  className="w-full h-10 pl-9 pr-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              {/* Lưới thẻ Flashcards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {filteredCards.map((card) => {
                  const isEditingThis = editingCardId === card.id;

                  if (isEditingThis) {
                    return (
                      <div
                        key={card.id}
                        className="p-3.5 rounded-xl bg-slate-900/95 border border-amber-500/60 shadow-xl space-y-2.5 animate-fadeIn"
                      >
                        <div className="space-y-1">
                          <label className="text-[10px] text-amber-400 font-semibold uppercase tracking-wide">
                            Từ vựng (Tiếng Nhật)
                          </label>
                          <input
                            type="text"
                            value={editFront}
                            onChange={(e) => setEditFront(e.target.value)}
                            className="w-full h-8 px-2.5 rounded-lg bg-slate-950 border border-slate-700 text-xs font-jp font-bold text-white focus:outline-none focus:border-amber-400"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-teal-400 font-semibold uppercase tracking-wide">
                            Cách đọc (Furigana / Hiragana)
                          </label>
                          <input
                            type="text"
                            value={editReading}
                            onChange={(e) => setEditReading(e.target.value)}
                            className="w-full h-8 px-2.5 rounded-lg bg-slate-950 border border-slate-700 text-xs font-jp text-teal-300 focus:outline-none focus:border-teal-400"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wide">
                            Nghĩa tiếng Việt
                          </label>
                          <input
                            type="text"
                            value={editBack}
                            onChange={(e) => setEditBack(e.target.value)}
                            placeholder="Nhập nghĩa tiếng Việt..."
                            className="w-full h-8 px-2.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-emerald-300 font-medium focus:outline-none focus:border-emerald-400"
                          />
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800">
                          <button
                            type="button"
                            onClick={() => setEditingCardId(null)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
                          >
                            Hủy
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(card.id)}
                            className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition cursor-pointer shadow-sm"
                          >
                            Lưu thay đổi
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={card.id}
                      className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/90 hover:border-slate-700 transition flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <span className="font-jp text-base font-bold text-white group-hover:text-amber-300 transition">
                            {card.front}
                          </span>
                          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                            <button
                              onClick={() => handleStartEdit(card)}
                              className="text-slate-500 hover:text-amber-300 transition cursor-pointer p-1"
                              title="Chỉnh sửa từ vựng & nghĩa tiếng Việt"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(card.id)}
                              className="text-slate-500 hover:text-rose-400 transition cursor-pointer p-1"
                              title="Xóa thẻ này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {card.reading && (
                          <p className="text-xs text-teal-400 font-jp mb-1">
                            {card.reading}
                          </p>
                        )}

                        <p className="text-xs text-emerald-300 font-medium">
                          {card.back || 'Chưa có bản dịch'}
                        </p>

                        {card.context && (
                          <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 bg-slate-900/40 p-2 rounded-lg">
                            <span className="text-slate-500 block">Ngữ cảnh câu:</span>
                            <span className="font-jp text-slate-300">{card.context}</span>
                            {card.contextVi && (
                              <span className="text-slate-500 block text-[10px] mt-0.5">
                                {card.contextVi}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500">
                        <span>{card.lessonTitle || 'Bài học'}</span>
                        <span>{card.timestamp}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer hướng dẫn import Anki */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="font-semibold text-slate-300">💡 Mẹo ném vào Anki:</span>
            <span>Tải file <strong>.tsv</strong> ➔ Mở Anki ➔ Bấm <strong>File &gt; Import</strong> ➔ Xong ngay!</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
