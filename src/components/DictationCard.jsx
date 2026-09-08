// src/components/DictationCard.jsx
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import {
  Play,
  Check,
  HelpCircle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Volume2,
  AlertCircle,
  AlertTriangle,
  PartyPopper,
  Repeat,
  Gauge,
  Type,
  Lightbulb,
  BookmarkPlus,
  BookMarked,
  Layers,
} from 'lucide-react';
import * as wanakana from 'wanakana';
import { compareJapaneseSentence } from '../utils/japaneseDiff';
import { saveFlashcard } from '../utils/storage';

export function DictationCard({
  sentence,
  onPlaySentence,
  isPlaying,
  onSentenceCompleted,
  onNextSentence,
  isLastSentence,
  playbackRate = 1.0,
  onChangePlaybackRate,
  isLooping = false,
  onToggleLoop,
  audioBuffer = 0.25,
  onChangeAudioBuffer,
  onOpenFlashcards,
  onCardAdded,
  lessonTitle = '',
  videoId = '',
}) {
  const [userInput, setUserInput] = useState('');
  const [checkResult, setCheckResult] = useState(null);
  const [showHintMeaning, setShowHintMeaning] = useState(false);
  const [showHintFurigana, setShowHintFurigana] = useState(false);
  const [showHintFirstChar, setShowHintFirstChar] = useState(false);
  const [hasGivenUp, setHasGivenUp] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [autoIme, setAutoIme] = useState(true); // Mặc định bật bộ gõ Romaji -> Kana
  const [dynamicTranslation, setDynamicTranslation] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [bufferSetting, setBufferSetting] = useState(audioBuffer);

  // Flashcard selection states
  const [selectedText, setSelectedText] = useState('');
  const [savedFlashcardToast, setSavedFlashcardToast] = useState('');

  const inputRef = useRef(null);
  const caretPosRef = useRef(null);

  // Cập nhật bufferSetting khi prop thay đổi
  useEffect(() => {
    setBufferSetting(audioBuffer);
  }, [audioBuffer]);

  // Kích hoạt hiệu ứng rung cảnh báo ràng buộc
  const triggerShake = (message) => {
    setValidationError(message);
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 450);
  };

  const isCompleted = !!(checkResult?.isCorrect || hasGivenUp);

  // Tự động gắn kết bộ gõ WanaKana IME trên thẻ Input nguyên bản
  // Giúp chuyển Romaji -> Hiragana chuẩn xác tại caret position mà không nhảy con trỏ về cuối câu
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;

    if (autoIme && !isCompleted) {
      try {
        wanakana.bind(el, { IMEMode: 'toHiragana' });
      } catch (err) {
        console.warn('[WanaKana bind error]:', err);
      }
    } else {
      try {
        wanakana.unbind(el);
      } catch (err) {}
    }

    return () => {
      if (el) {
        try {
          wanakana.unbind(el);
        } catch (e) {}
      }
    };
  }, [autoIme, isCompleted, sentence?.id]);

  // Reset trạng thái khi chuyển câu mới
  useEffect(() => {
    setUserInput('');
    setCheckResult(null);
    setShowHintMeaning(false);
    setShowHintFurigana(false);
    setShowHintFirstChar(false);
    setHasGivenUp(false);
    setValidationError('');
    setIsShaking(false);
    setDynamicTranslation('');
    setIsTranslating(false);
    setSelectedText('');
    setSavedFlashcardToast('');
    caretPosRef.current = null;

    // Tự động focus vào ô nhập liệu
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, [sentence?.id]);

  // Bảo toàn vị trí con trỏ (Caret) khi người dùng gõ / chỉnh sửa ở giữa câu
  // Đảm bảo sau khi React re-render, con trỏ không bao giờ bị văng về cuối câu
  useLayoutEffect(() => {
    if (caretPosRef.current && inputRef.current && document.activeElement === inputRef.current) {
      const { start, end } = caretPosRef.current;
      if (inputRef.current.selectionStart !== start || inputRef.current.selectionEnd !== end) {
        try {
          inputRef.current.setSelectionRange(start, end);
        } catch (e) {}
      }
    }
  }, [userInput]);

  // Phát câu hiện tại (kèm khoảng đệm buffer đã chọn)
  const handlePlayClick = () => {
    if (onPlaySentence) {
      onPlaySentence(sentence, bufferSetting);
    }
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  // Xử lý khi thay đổi nội dung ô gõ
  const handleInputChange = (e) => {
    const target = e.target;
    if (validationError) setValidationError('');

    // Ghi nhớ vị trí con trỏ trước khi React re-render
    caretPosRef.current = {
      start: target.selectionStart,
      end: target.selectionEnd,
    };

    setUserInput(target.value);
  };

  // Ràng buộc khi bấm nút Kiểm tra
  const handleCheck = () => {
    const trimmed = userInput.trim();

    if (!trimmed) {
      triggerShake('Vui lòng gõ những gì bạn nghe được trước khi bấm Kiểm tra!');
      inputRef.current?.focus();
      return;
    }

    setValidationError('');
    const result = compareJapaneseSentence(trimmed, sentence);
    setCheckResult(result);

    if (result.isCorrect) {
      onSentenceCompleted(sentence.id, {
        userAnswer: trimmed,
        accuracy: result.accuracy,
        phoneticMatch: result.phoneticMatch,
      });
    }
  };

  // Xem đáp án (Bỏ qua câu này để mở khóa câu kế)
  const handleGiveUp = () => {
    setHasGivenUp(true);
    setValidationError('');
    const result = compareJapaneseSentence(userInput || '', sentence);
    setCheckResult(result);
    onSentenceCompleted(sentence.id, {
      userAnswer: userInput || '[Đã xem đáp án]',
      accuracy: 0,
      givenUp: true,
    });
  };

  // Chuyển câu tiếp theo
  const handleAttemptNext = () => {
    if (!isCompleted) {
      triggerShake('Bạn chưa hoàn thành câu này! Hãy gõ đúng hoặc bấm "Bỏ qua câu này" trước khi sang câu tiếp theo.');
      return;
    }

    if (isLastSentence) {
      alert('Chúc mừng bạn đã hoàn thành tất cả các câu trong bài học này! 🎉');
      return;
    }

    onNextSentence();
  };

  // Bật/tắt gợi ý nghĩa tiếng Việt (Tự động dịch on-demand nếu câu chưa có sẵn tiếng Việt)
  const handleToggleMeaningHint = async () => {
    const nextState = !showHintMeaning;
    setShowHintMeaning(nextState);

    if (nextState && !sentence.vietnamese && !dynamicTranslation && !isTranslating) {
      setIsTranslating(true);
      try {
        const res = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: sentence.text }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.translation) {
            setDynamicTranslation(data.translation);
          }
        }
      } catch (err) {
        console.warn('[TRANSLATE ERROR]:', err);
      } finally {
        setIsTranslating(false);
      }
    }
  };

  // Lắng nghe sự kiện bôi đen (Text selection) trong khu vực đáp án
  const handleAnswerTextSelection = () => {
    const selection = window.getSelection();
    const text = selection ? selection.toString().trim() : '';
    if (text && text.length > 0 && text.length <= 120) {
      setSelectedText(text);
    } else {
      setSelectedText('');
    }
  };

  // Lưu từ vựng hoặc câu vào Flashcards
  const handleSaveToFlashcard = async (customText) => {
    const front = (customText || selectedText || sentence.text).trim();
    if (!front) return;

    const isFullSentence = front === sentence.text;
    const reading = isFullSentence
      ? (sentence.reading || sentence.furigana || '')
      : wanakana.toHiragana(front);

    let back = isFullSentence
      ? (sentence.vietnamese || dynamicTranslation || '')
      : '';

    // Nếu bôi đen 1 từ đơn lẻ và chưa có nghĩa riêng, thử gọi dịch nhanh từ đó
    if (!back && !isFullSentence) {
      try {
        const res = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: front }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.translation) {
            back = data.translation;
          }
        }
      } catch (e) {}
    }

    const card = {
      front,
      reading,
      back: back || (sentence.vietnamese || dynamicTranslation || 'Từ mới tiếng Nhật'),
      context: sentence.text,
      contextVi: sentence.vietnamese || dynamicTranslation || '',
      timestamp: `${sentence.start}s - ${sentence.end}s`,
      lessonTitle: lessonTitle || 'Luyện nghe chép tiếng Nhật',
      videoId,
    };

    saveFlashcard(card);
    setSavedFlashcardToast(`Đã lưu 「${front}」 vào Flashcards! ⭐`);
    setTimeout(() => setSavedFlashcardToast(''), 3500);

    if (onCardAdded) {
      onCardAdded();
    }

    setSelectedText('');
    try {
      window.getSelection()?.removeAllRanges();
    } catch (e) {}
  };

  // Xử lý phím tắt trong ô input
  const handleKeyDown = (e) => {
    // 1. Alt+N hoặc Alt+Mũi tên phải: Chuyển câu kế
    if (e.altKey && (e.key === 'n' || e.key === 'N' || e.key === 'ArrowRight')) {
      e.preventDefault();
      handleAttemptNext();
      return;
    }

    // 2. Ctrl+Space: Nghe lại câu hiện tại
    if (e.ctrlKey && e.code === 'Space') {
      e.preventDefault();
      handlePlayClick();
      return;
    }

    // 3. Alt+H hoặc Alt+G: Bật/tắt gợi ý nghĩa tiếng Việt
    if (e.altKey && (e.key === 'h' || e.key === 'H' || e.key === 'g' || e.key === 'G')) {
      e.preventDefault();
      handleToggleMeaningHint();
      return;
    }

    // 4. Alt+F: Bật/tắt gợi ý Furigana / Hiragana
    if (e.altKey && (e.key === 'f' || e.key === 'F')) {
      e.preventDefault();
      setShowHintFurigana((prev) => !prev);
      return;
    }

    // 5. Alt+L hoặc Alt+R: Bật/tắt lặp lại câu (Loop)
    if (e.altKey && (e.key === 'l' || e.key === 'L' || e.key === 'r' || e.key === 'R')) {
      e.preventDefault();
      if (onToggleLoop) onToggleLoop(!isLooping);
      return;
    }

    // 6. Alt+S: Bỏ qua câu này (Mở khóa câu kế)
    if (e.altKey && (e.key === 's' || e.key === 'S')) {
      e.preventDefault();
      if (!isCompleted) {
        handleGiveUp();
      }
      return;
    }

    // 7. Enter: Kiểm tra hoặc Sang câu kế
    if (e.key === 'Enter') {
      e.preventDefault();
      const isDone = checkResult?.isCorrect || hasGivenUp;
      if (isDone) {
        handleAttemptNext();
      } else {
        handleCheck();
      }
    }
  };

  if (!sentence) return null;

  // Lấy 1-2 ký tự đầu để làm gợi ý khởi động
  const firstCharHint = sentence.reading
    ? sentence.reading.slice(0, 2)
    : sentence.text.slice(0, 2);

  return (
    <div
      className={`bg-slate-900/90 rounded-2xl border border-slate-800 p-4 sm:p-5 shadow-2xl transition-all ${
        isShaking ? 'animate-shake ring-2 ring-rose-500/50' : ''
      }`}
    >
      {/* 1. Header Card: Số câu, Bộ chọn đệm âm thanh, Tốc độ & Lặp câu */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center border border-emerald-500/30">
            {sentence.id}
          </span>
          <span className="text-xs font-semibold text-slate-200">
            Luyện chép chính tả
          </span>
          <span className="text-[11px] text-slate-500">
            ({sentence.start}s - {sentence.end}s)
          </span>
        </div>

        {/* Thanh công cụ nghe: Đệm âm thanh, Lặp lại, Tốc độ */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Bộ chọn khoảng đệm đầu câu: 0s, 0.25s, 0.5s */}
          <div
            className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800 text-[11px]"
            title="Đệm đầu câu: Lùi nhẹ điểm bắt đầu để tránh nuốt âm đầu do trễ seek YouTube. Đuôi câu dừng chuẩn xác, không nới đuôi để không đọc lấn sang câu sau."
          >
            <span className="text-[10px] text-slate-500 px-1 font-sans">Đệm đầu:</span>
            {[
              { label: '0s', val: 0 },
              { label: '0.25s', val: 0.25 },
              { label: '0.5s', val: 0.5 },
            ].map((item) => (
              <button
                key={item.val}
                onClick={() => {
                  setBufferSetting(item.val);
                  if (onChangeAudioBuffer) onChangeAudioBuffer(item.val);
                }}
                className={`px-1.5 py-0.5 rounded transition cursor-pointer font-mono text-[10px] ${
                  bufferSetting === item.val
                    ? 'bg-teal-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title={`Đệm đầu: ${item.label}`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Nút bật/tắt lặp lại câu */}
          <button
            onClick={() => onToggleLoop && onToggleLoop(!isLooping)}
            className={`px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition cursor-pointer border ${
              isLooping
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border-slate-700/60'
            }`}
            title="Tự động phát lặp lại câu này liên tục để vừa nghe vừa chép (Phím tắt: Alt+L)"
          >
            <Repeat className={`w-3.5 h-3.5 ${isLooping ? 'text-emerald-400' : ''}`} />
            <span>Lặp</span>
          </button>

          {/* Bộ chọn tốc độ nghe 0.75x, 1.0x, 1.25x */}
          <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800 text-[11px]">
            {[0.75, 1.0, 1.25].map((rate) => (
              <button
                key={rate}
                onClick={() => onChangePlaybackRate && onChangePlaybackRate(rate)}
                className={`px-1.5 py-0.5 rounded transition cursor-pointer font-mono text-[10px] ${
                  playbackRate === rate
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title={`Tốc độ phát ${rate}x`}
              >
                {rate}x
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-400/90 font-medium ml-1 hidden sm:inline">
            {sentence.charCount || sentence.text.length} ký tự
          </span>
        </div>
      </div>

      {/* 2. Khung nhập liệu Dictation */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        {/* Nút Nghe câu trên giao diện */}
        <button
          onClick={handlePlayClick}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-lg relative ${
            isPlaying
              ? 'bg-emerald-500 text-slate-950 ring-4 ring-emerald-500/30'
              : 'bg-slate-800/90 hover:bg-slate-700 text-emerald-400 border border-slate-700 hover:border-emerald-500/40'
          }`}
          title={
            isPlaying
              ? 'Đang phát... Bấm để nghe lại từ đầu câu (Ctrl+Space)'
              : 'Bấm để nghe câu này (Ctrl+Space)'
          }
        >
          {isPlaying ? (
            <div className="flex items-center gap-0.5 h-5">
              <span className="w-1 bg-slate-950 rounded-full animate-bounce h-3"></span>
              <span className="w-1 bg-slate-950 rounded-full animate-bounce h-5 [animation-delay:0.15s]"></span>
              <span className="w-1 bg-slate-950 rounded-full animate-bounce h-4 [animation-delay:0.3s]"></span>
              <span className="w-1 bg-slate-950 rounded-full animate-bounce h-2 [animation-delay:0.45s]"></span>
            </div>
          ) : (
            <Play className="w-5 h-5 fill-current ml-0.5" />
          )}
        </button>

        {/* Ô Input gõ tiếng Nhật */}
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={userInput}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={isCompleted}
            placeholder={
              autoIme
                ? "Gõ tiếng Nhật (hoặc gõ Romaji: 'watashi' -> 'わたし')..."
                : "Gõ lại điều bạn nghe được..."
            }
            className={`w-full h-12 pl-4 pr-16 text-base font-jp rounded-2xl bg-slate-950 border-2 text-white placeholder-slate-500 focus:outline-none transition-all disabled:opacity-80 ${
              validationError
                ? 'border-rose-500 focus:ring-4 focus:ring-rose-500/20'
                : 'border-slate-700/80 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15'
            }`}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800 font-mono">
            {sentence.charCount || sentence.text.length} từ
          </div>
        </div>

        {/* Nút Kiểm tra hoặc Câu tiếp theo */}
        {isCompleted ? (
          <button
            onClick={handleAttemptNext}
            className="h-12 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-1.5 transition cursor-pointer shadow-lg shadow-emerald-500/20 whitespace-nowrap"
            title="Nhấn phím Enter hoặc Alt+N để sang câu tiếp theo"
          >
            {isLastSentence ? (
              <>
                <PartyPopper className="w-4 h-4" />
                <span>Hoàn thành bài</span>
              </>
            ) : (
              <>
                <span>Câu tiếp theo</span>
                <span className="text-[10px] bg-slate-950/30 text-slate-950 px-1.5 py-0.5 rounded font-mono font-bold">
                  Enter / Alt+N
                </span>
                <ArrowRight className="w-4 h-4 ml-0.5" />
              </>
            )}
          </button>
        ) : (
          <button
            onClick={handleCheck}
            className="h-12 px-6 rounded-2xl bg-teal-600/90 hover:bg-teal-500 text-white font-semibold text-sm flex items-center justify-center gap-1.5 transition cursor-pointer shadow-lg shadow-teal-700/20 whitespace-nowrap"
            title="Kiểm tra câu vừa gõ (Enter)"
          >
            <Check className="w-4 h-4" />
            <span>Kiểm tra</span>
            <span className="text-[10px] bg-teal-800/80 text-teal-200 px-1.5 py-0.5 rounded font-mono font-normal">
              Enter
            </span>
          </button>
        )}
      </div>

      {/* Toggle Bộ gõ Romaji -> Hiragana */}
      <div className="mt-2 flex items-center justify-between text-xs text-slate-400 px-1">
        <button
          onClick={() => setAutoIme(!autoIme)}
          className="flex items-center gap-1.5 text-slate-400 hover:text-emerald-400 transition cursor-pointer"
          title="Tự động đổi chữ cái Latin (Romaji) thành Hiragana khi gõ trực tiếp trong ô, hỗ trợ chèn sửa ở mọi vị trí"
        >
          <Type className={`w-3.5 h-3.5 ${autoIme ? 'text-emerald-400' : 'text-slate-500'}`} />
          <span>Bộ gõ Romaji ➔ Hiragana:</span>
          <span
            className={`font-semibold px-1.5 py-0.2 rounded text-[11px] ${
              autoIme
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-slate-800 text-slate-500'
            }`}
          >
            {autoIme ? 'BẬT' : 'TẮT'}
          </span>
        </button>

        {showHintFirstChar && !isCompleted && (
          <span className="text-amber-400 font-jp bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 animate-fadeIn">
            Gợi ý 2 ký tự đầu: <strong>{firstCharHint}...</strong>
          </span>
        )}
      </div>

      {/* Cảnh báo lỗi nhập liệu */}
      {validationError && (
        <div className="mt-2.5 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-fadeIn">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* 3. KẾT QUẢ HIỂN THỊ ĐÁP ÁN & TÍNH NĂNG BÔI ĐEN TỪ LƯU FLASHCARD */}
      {checkResult && (
        <div
          onMouseUp={handleAnswerTextSelection}
          onTouchEnd={handleAnswerTextSelection}
          className="mt-4 p-4 rounded-xl bg-slate-950/90 border border-slate-800/90 animate-fadeIn select-text"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {checkResult.isCorrect ? (
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  {checkResult.isExact
                    ? 'Chính xác 100%!'
                    : 'Chuẩn ngữ âm Hiragana 100%!'}
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-400 text-xs font-bold border border-rose-500/30 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Độ chính xác: {checkResult.accuracy}%
                </span>
              )}
              {checkResult.phoneticMatch && !checkResult.isExact && (
                <span className="text-[11px] text-teal-300 bg-teal-950/60 px-2 py-0.5 rounded border border-teal-800">
                  Khớp ngữ âm (Hiragana)
                </span>
              )}
            </div>

            <button
              onClick={handlePlayClick}
              className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Nghe lại câu này
            </button>
          </div>

          {/* Banner nổi khi người dùng BÔI ĐEN một từ / cụm từ */}
          {selectedText && (
            <div className="mb-3 p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs flex items-center justify-between gap-2 shadow-lg animate-fadeIn">
              <div className="flex items-center gap-2 overflow-hidden">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0 animate-spin" />
                <div className="truncate">
                  <span className="text-slate-300">Đã bôi đen: </span>
                  <strong className="font-jp text-white text-sm bg-slate-900 px-2 py-0.5 rounded border border-amber-500/30">
                    {selectedText}
                  </strong>
                </div>
              </div>
              <button
                onClick={() => handleSaveToFlashcard(selectedText)}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition cursor-pointer shrink-0 shadow"
                title="Lưu từ vừa bôi đen vào Flashcards để ném vào Anki / Quizlet"
              >
                <BookmarkPlus className="w-3.5 h-3.5" />
                <span>Lưu vào Flashcard</span>
              </button>
            </div>
          )}

          {/* Hiển thị phân tích ký tự Diff (Xanh: Đúng, Đỏ: Sai, Xám: Thiếu) */}
          <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 font-jp text-lg leading-relaxed flex flex-wrap gap-1 items-center">
            {checkResult.diff.map((item, index) => {
              if (item.status === 'correct') {
                return (
                  <span
                    key={index}
                    className="text-emerald-400 font-bold bg-emerald-500/10 px-1 rounded border border-emerald-500/20 cursor-text"
                    title={`Đúng: ${item.char}`}
                  >
                    {item.char}
                  </span>
                );
              }
              if (item.status === 'wrong') {
                return (
                  <span
                    key={index}
                    className="text-rose-400 font-bold bg-rose-500/10 px-1 rounded line-through border border-rose-500/30 cursor-text"
                    title={`Gõ sai: ${item.char}`}
                  >
                    {item.char}
                  </span>
                );
              }
              if (item.status === 'missing') {
                return (
                  <span
                    key={index}
                    className="text-slate-500 border-b-2 border-dashed border-amber-500/60 px-1 font-mono text-sm cursor-text"
                    title={`Còn thiếu: ${item.expected}`}
                  >
                    {item.expected}
                  </span>
                );
              }
              return null;
            })}
          </div>

          {/* Câu gốc chuẩn, Phiên âm Hiragana & Dịch nghĩa tiếng Việt */}
          <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1.5">
            <div className="text-xs text-slate-400 flex items-baseline gap-2">
              <span className="font-semibold text-slate-400 shrink-0">Câu chuẩn:</span>
              <span className="font-jp text-slate-100 font-semibold text-sm select-all">
                {sentence.text}
              </span>
            </div>

            {sentence.reading && (
              <div className="text-xs text-teal-400/90 font-jp flex items-baseline gap-2">
                <span className="font-semibold text-slate-500 font-sans shrink-0">Cách đọc:</span>
                <span>{sentence.reading}</span>
              </div>
            )}

            {(sentence.vietnamese || dynamicTranslation) && (
              <div className="text-xs text-emerald-400 font-medium">
                🇻🇳 Dịch nghĩa: {sentence.vietnamese || dynamicTranslation}
              </div>
            )}
          </div>

          {/* Thanh tác vụ Flashcard bên dưới câu trả lời */}
          <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleSaveToFlashcard(selectedText || sentence.text)}
                className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                title="Lưu từ đang bôi đen hoặc toàn bộ câu này vào sổ Flashcard để xuất Anki"
              >
                <BookmarkPlus className="w-4 h-4 text-amber-400" />
                <span>
                  {selectedText
                    ? `Lưu từ 「${selectedText}」 vào Flashcard`
                    : '⭐ Lưu câu này vào Flashcard'}
                </span>
              </button>

              {onOpenFlashcards && (
                <button
                  onClick={onOpenFlashcards}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer border border-slate-700"
                  title="Mở sổ quản lý Flashcards và xuất file Anki / Quizlet"
                >
                  <BookMarked className="w-3.5 h-3.5 text-teal-400" />
                  <span>Sổ Flashcard</span>
                </button>
              )}
            </div>

            {/* Thông báo Toast khi lưu thành công */}
            {savedFlashcardToast && (
              <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 animate-fadeIn">
                <Check className="w-3.5 h-3.5" />
                <span>{savedFlashcardToast}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Thanh gợi ý phụ (Hints) khi chưa hoàn thành */}
      {!isCompleted && (
        <div className="mt-3 pt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {/* Gợi ý ký tự đầu */}
            <button
              onClick={() => setShowHintFirstChar(!showHintFirstChar)}
              className="text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700/60 transition cursor-pointer flex items-center gap-1"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span>{showHintFirstChar ? 'Ẩn âm đầu' : 'Gợi ý âm đầu'}</span>
            </button>

            {/* Gợi ý Furigana / Hiragana */}
            <button
              onClick={() => setShowHintFurigana(!showHintFurigana)}
              className="text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700/60 transition cursor-pointer flex items-center gap-1"
              title="Gợi ý cách đọc Furigana / Hiragana (Phím tắt: Alt+F)"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span>{showHintFurigana ? 'Ẩn Furigana' : 'Gợi ý Furigana'}</span>
            </button>

            {/* Gợi ý nghĩa tiếng Việt */}
            <button
              onClick={handleToggleMeaningHint}
              className="text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700/60 transition cursor-pointer flex items-center gap-1"
              title="Xem bản dịch nghĩa tiếng Việt (Phím tắt: Alt+H)"
            >
              <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
              <span>
                {showHintMeaning
                  ? 'Ẩn nghĩa'
                  : isTranslating
                  ? 'Đang dịch...'
                  : 'Gợi ý nghĩa TV'}
              </span>
            </button>
          </div>

          {/* Bỏ qua câu (Xem đáp án để mở khóa câu kế) */}
          <button
            onClick={handleGiveUp}
            className="text-slate-500 hover:text-rose-400 transition cursor-pointer text-xs underline underline-offset-2"
            title="Bỏ qua câu này và xem đáp án để mở khóa câu tiếp theo (Phím tắt: Alt+S)"
          >
            Bỏ qua câu này (Mở khóa)
          </button>
        </div>
      )}

      {/* Khung nội dung gợi ý nếu người dùng bấm mở */}
      {(showHintMeaning || showHintFurigana) && (
        <div className="mt-2.5 p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-1.5 animate-fadeIn">
          {showHintMeaning && (
            <p className="text-blue-300">
              <span className="font-semibold text-slate-400">Nghĩa tiếng Việt: </span>
              {isTranslating ? (
                <span className="text-slate-400 italic">Đang dịch tự động...</span>
              ) : (
                sentence.vietnamese || dynamicTranslation || 'Chưa có bản dịch cho câu này'
              )}
            </p>
          )}
          {showHintFurigana && (
            <p className="text-teal-300 font-jp">
              <span className="font-semibold text-slate-400 font-sans">Phiên âm / Cách đọc: </span>
              {sentence.reading || sentence.furigana}
            </p>
          )}
        </div>
      )}

      {/* 5. Dải hướng dẫn phím tắt tiện dụng (Chuẩn công thái học, không xung đột trình duyệt) */}
      <div className="mt-3.5 pt-2.5 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-y-1.5 text-[11px] text-slate-400">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <span className="text-slate-400 font-medium">⌨️ Phím tắt:</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 font-mono text-[10px] border border-slate-700">Ctrl+Space</kbd> Nghe lại</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-mono text-[10px] border border-slate-700">Enter</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 font-mono text-[10px] border border-slate-700">Alt+N</kbd> Câu kế</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-blue-300 font-mono text-[10px] border border-slate-700">Alt+H</kbd> Nghĩa TV</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-teal-300 font-mono text-[10px] border border-slate-700">Alt+F</kbd> Furigana</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-emerald-300 font-mono text-[10px] border border-slate-700">Alt+L</kbd> Lặp câu</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-rose-300 font-mono text-[10px] border border-slate-700">Alt+S</kbd> Bỏ qua</span>
        </div>
      </div>
    </div>
  );
}
