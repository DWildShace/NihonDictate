// src/components/QuickFlashcardBar.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  BookmarkPlus,
  Check,
  X,
  Loader2,
  BookMarked,
  RotateCcw,
  Pencil,
} from 'lucide-react';
import * as wanakana from 'wanakana';

export function QuickFlashcardBar({
  selection,
  onSave,
  onClear,
  onOpenFlashcards,
  onSelectText,
  activeSentence,
  lessonTitle = '',
  videoId = '',
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [savedToast, setSavedToast] = useState('');
  const [autoTranslation, setAutoTranslation] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

  // Chế độ gõ / sửa tay từ vựng
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState('');

  const rawText = selection?.text?.trim() || '';
  const originalSentenceText = activeSentence?.text || selection?.originalSentenceText || '';
  const abortControllerRef = useRef(null);
  const editInputRef = useRef(null);

  useEffect(() => {
    setEditedText(rawText);
    setIsEditing(false);
  }, [rawText]);

  // Tự động lấy nghĩa dịch tiếng Việt khi từ bôi đen thay đổi
  useEffect(() => {
    if (!rawText) {
      setAutoTranslation('');
      setSavedToast('');
      return;
    }

    setSavedToast('');

    // Nếu từ bôi đen trùng với câu hiện tại thì lấy nghĩa của câu
    if (activeSentence && rawText === activeSentence.text.trim()) {
      setAutoTranslation(activeSentence.vietnamese || '');
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsTranslating(true);
    fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: rawText }),
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : { translation: '' }))
      .then((data) => {
        if (data.translation) {
          setAutoTranslation(data.translation);
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          console.warn('[TRANSLATE ERROR]:', err);
        }
      })
      .finally(() => {
        setIsTranslating(false);
      });

    return () => {
      controller.abort();
    };
  }, [rawText, activeSentence?.id]);

  if (!rawText && !savedToast) return null;

  // Tính toán cách đọc: nếu là Hiragana/Katakana thì giữ nguyên, nếu có kana thì chuyển sang Hiragana
  const reading = selection?.reading || wanakana.toHiragana(rawText);
  const translation = autoTranslation || selection?.vietnamese || activeSentence?.vietnamese || '';

  // Xử lý lưu thẻ
  const handleSave = async () => {
    if (isSaving || !rawText) return;
    setIsSaving(true);

    try {
      const cardData = {
        front: rawText,
        reading: reading || rawText,
        back: translation || 'Từ vựng tiếng Nhật',
        context: activeSentence?.text || selection?.context || rawText,
        contextVi: activeSentence?.vietnamese || selection?.contextVi || '',
        timestamp: activeSentence
          ? `${activeSentence.start}s - ${activeSentence.end}s`
          : selection?.timestamp || '',
        lessonTitle: lessonTitle || 'Luyện nghe chép tiếng Nhật',
        videoId,
      };

      if (onSave) {
        const result = await onSave(cardData);
        const msg = result?.isUpdated
          ? `Đã cập nhật thẻ 「${rawText}」! ⭐`
          : `Đã lưu 「${rawText}」 vào Flashcards! ⭐`;
        setSavedToast(msg);
      } else {
        setSavedToast(`Đã lưu 「${rawText}」 vào Flashcards! ⭐`);
      }

      setTimeout(() => {
        setSavedToast('');
      }, 4000);
    } catch (err) {
      console.error('Lỗi khi lưu Flashcard:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Xác nhận sửa chữ bằng tay
  const handleConfirmEdit = () => {
    const trimmed = editedText.trim();
    if (trimmed && onSelectText) {
      onSelectText(trimmed);
    }
    setIsEditing(false);
  };

  return (
    <div
      data-quick-flashcard-bar="true"
      className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/15 via-slate-900/90 to-amber-950/30 border border-amber-500/40 shadow-2xl backdrop-blur-md animate-fadeIn text-slate-100 space-y-3"
    >
      {/* Hàng 1: Tiêu đề trạng thái & Nút thao tác */}
      <div className="flex items-center justify-between gap-3 border-b border-amber-500/20 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </span>
          <span className="text-xs font-bold text-amber-300 tracking-wide uppercase">
            Bôi đen từ vựng & Tạo Flashcard nhanh
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Nút Mở sổ Flashcards */}
          {onOpenFlashcards && (
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={onOpenFlashcards}
              className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer border border-slate-700/80"
              title="Mở sổ quản lý Flashcards và xuất file Anki / Quizlet"
            >
              <BookMarked className="w-3.5 h-3.5 text-teal-400" />
              <span className="hidden sm:inline">Sổ thẻ</span>
            </button>
          )}

          {/* Nút Đóng / Bỏ chọn */}
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={() => {
              setSavedToast('');
              if (onClear) onClear();
            }}
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer border border-slate-700/60"
            title="Đóng thanh này"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Hàng 2: Nội dung từ vựng bôi đen (Hỗ trợ bôi đen tiếp bên trong) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-amber-400/90 font-medium select-none">Đã bôi đen:</span>

            {isEditing ? (
              <div className="flex flex-wrap items-center gap-1.5">
                <input
                  ref={editInputRef}
                  type="text"
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleConfirmEdit();
                    if (e.key === 'Escape') setIsEditing(false);
                  }}
                  autoFocus
                  className="font-jp text-base sm:text-lg font-bold text-white bg-slate-950 px-3 py-1 rounded-xl border border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 shadow-inner"
                />
                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={handleConfirmEdit}
                  className="p-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition cursor-pointer"
                  title="Xác nhận"
                >
                  <Check className="w-4 h-4" />
                </button>
                {originalSentenceText && editedText !== originalSentenceText && (
                  <button
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={() => setEditedText(originalSentenceText)}
                    className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-medium border border-amber-500/40 flex items-center gap-1 transition cursor-pointer"
                    title={`Khôi phục câu gốc: 「${originalSentenceText}」`}
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                    <span>Câu gốc</span>
                  </button>
                )}
                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={() => setIsEditing(false)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition cursor-pointer"
                  title="Hủy"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                {/* Vùng chữ tiếng Nhật cho phép bôi đen tiếp thoải mái */}
                <span
                  data-selectable-japanese="true"
                  className="font-jp text-lg sm:text-xl font-bold text-white bg-slate-950/90 px-3 py-1 rounded-xl border border-amber-500/40 shadow-inner break-words select-text cursor-text selection:bg-amber-500 selection:text-slate-950 hover:border-amber-400 transition"
                  title="Bạn có thể kéo chuột bôi đen tiếp một từ trong ô này để thu hẹp từ cần lưu!"
                >
                  {rawText}
                </span>

                {/* Nút sửa tay bằng bàn phím */}
                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={() => {
                    setEditedText(rawText);
                    setIsEditing(true);
                  }}
                  className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-amber-300 transition cursor-pointer border border-slate-700/60"
                  title="Sửa tay từ vựng này"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>

                {/* Nút chọn lại cả câu nếu đang bôi đen 1 phần hoặc đã sửa */}
                {originalSentenceText && rawText !== originalSentenceText && onSelectText && (
                  <button
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={() => onSelectText(originalSentenceText)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-amber-300 text-xs font-medium border border-amber-500/40 flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                    title={`Chọn lại toàn bộ câu gốc: 「${originalSentenceText}」`}
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                    <span>Cả câu gốc</span>
                  </button>
                )}

                {reading && reading !== rawText && (
                  <span className="text-xs text-teal-300 font-jp bg-teal-950/50 px-2 py-0.5 rounded-lg border border-teal-800/60 select-none">
                    【{reading}】
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Nghĩa tiếng Việt */}
          <div className="text-xs text-slate-300 flex items-center gap-2 pt-0.5 select-none">
            <span className="text-emerald-400 font-semibold shrink-0">🇻🇳 Nghĩa:</span>
            {isTranslating ? (
              <span className="flex items-center gap-1.5 text-slate-400 text-xs italic">
                <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
                <span>Đang dịch tự động...</span>
              </span>
            ) : (
              <span className="font-medium text-emerald-300 break-words">
                {translation || 'Chưa có bản dịch (nhấn Lưu để tạo thẻ)'}
              </span>
            )}
          </div>

          {/* Câu ngữ cảnh gốc (cũng cho phép bôi đen trực tiếp) */}
          {activeSentence?.text && (
            <div className="text-[11px] text-slate-400 pt-0.5 select-text">
              <span className="text-slate-500 font-semibold select-none">Ngữ cảnh: </span>
              <span
                className="font-jp text-slate-300 cursor-text selection:bg-amber-500 selection:text-slate-950 hover:text-white transition"
                title="Bạn cũng có thể bôi đen một từ trực tiếp từ câu ngữ cảnh này!"
              >
                {activeSentence.text}
              </span>
            </div>
          )}

          {/* Dòng hướng dẫn công thái học */}
          <div className="text-[11px] text-amber-400/80 flex items-center gap-1 pt-0.5 select-none">
            <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
            <span>
              Mẹo: Bạn có thể <strong>kéo chuột bôi đen tiếp chữ trong ô trên</strong> hoặc bấm nút <strong>✏️</strong> để chỉnh sửa từ mong muốn!
            </span>
          </div>
        </div>

        {/* Nút hành động Lưu vào Flashcard */}
        <div className="shrink-0 flex flex-col sm:items-end gap-1.5 select-none">
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={handleSave}
            disabled={isSaving || !rawText}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-lg ${
              isSaving
                ? 'bg-amber-600 text-slate-950 opacity-80 cursor-wait'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 active:scale-95 shadow-amber-500/20'
            }`}
            title="Lưu từ vừa bôi đen vào sổ Flashcards"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <BookmarkPlus className="w-4 h-4 fill-slate-950" />
                <span>Lưu vào Flashcard</span>
              </>
            )}
          </button>

          {/* Thông báo thành công */}
          {savedToast && (
            <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1 bg-emerald-950/70 border border-emerald-500/40 px-2 py-0.5 rounded-lg animate-fadeIn">
              <Check className="w-3 h-3 text-emerald-400" />
              <span>{savedToast}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
