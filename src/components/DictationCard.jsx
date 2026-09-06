// src/components/DictationCard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Play, Check, HelpCircle, ArrowRight, RotateCcw, Sparkles, Volume2, AlertCircle, AlertTriangle, PartyPopper } from 'lucide-react';
import { compareJapaneseSentence } from '../utils/japaneseDiff';

export function DictationCard({
  sentence,
  onPlaySentence,
  isPlaying,
  onSentenceCompleted,
  onNextSentence,
  isLastSentence,
}) {
  const [userInput, setUserInput] = useState('');
  const [checkResult, setCheckResult] = useState(null);
  const [showHintMeaning, setShowHintMeaning] = useState(false);
  const [showHintFurigana, setShowHintFurigana] = useState(false);
  const [hasGivenUp, setHasGivenUp] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const inputRef = useRef(null);

  // Kích hoạt hiệu ứng rung cảnh báo ràng buộc
  const triggerShake = (message) => {
    setValidationError(message);
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 450);
  };

  // Khi chuyển sang câu mới, reset hoàn toàn trạng thái
  useEffect(() => {
    setUserInput('');
    setCheckResult(null);
    setShowHintMeaning(false);
    setShowHintFurigana(false);
    setHasGivenUp(false);
    setValidationError('');
    setIsShaking(false);

    // Tự động đưa con trỏ chuột vào ô nhập liệu
    setTimeout(() => {
      inputRef.current?.focus();
    }, 150);
  }, [sentence?.id]);

  // Bấm nút Phát tự do, spam thoải mái bao nhiêu lần tùy thích
  const handlePlayClick = () => {
    onPlaySentence(sentence);

    // Luôn giữ con trỏ chuột ở ô gõ để gõ liền
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  // Ràng buộc khi bấm nút Kiểm tra
  const handleCheck = () => {
    const trimmed = userInput.trim();

    // Ràng buộc 1: Không cho kiểm tra khi ô gõ rỗng
    if (!trimmed) {
      triggerShake('Vui lòng gõ những gì bạn nghe được trước khi bấm Kiểm tra!');
      inputRef.current?.focus();
      return;
    }

    setValidationError('');
    const result = compareJapaneseSentence(trimmed, sentence.text, sentence.furigana);
    setCheckResult(result);

    if (result.isCorrect) {
      onSentenceCompleted(sentence.id, {
        userAnswer: trimmed,
        accuracy: result.accuracy,
      });
    }
  };

  // Xem đáp án (Bỏ qua câu này)
  const handleGiveUp = () => {
    setHasGivenUp(true);
    setValidationError('');
    setCheckResult(compareJapaneseSentence(userInput || '', sentence.text, sentence.furigana));
    onSentenceCompleted(sentence.id, {
      userAnswer: userInput || '[Đã xem đáp án]',
      accuracy: 0,
    });
  };

  // Ràng buộc khi bấm chuyển câu (Nút hoặc Phím tắt Ctrl+N)
  const handleAttemptNext = () => {
    const isCompleted = checkResult?.isCorrect || hasGivenUp;
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

  // Xử lý phím tắt trong ô input
  const handleKeyDown = (e) => {
    // Phím tắt Ctrl+N (hoặc Alt+N): Chuyển câu tiếp theo
    if ((e.ctrlKey || e.altKey) && (e.key === 'n' || e.key === 'N')) {
      e.preventDefault();
      handleAttemptNext();
      return;
    }

    // Phím tắt Enter:
    // - Lần 1: Kiểm tra đúng/sai (nếu chưa hoàn thành)
    // - Lần 2: Chuyển sang câu tiếp theo (nếu đã hoàn thành)
    if (e.key === 'Enter') {
      e.preventDefault();
      const isCompleted = checkResult?.isCorrect || hasGivenUp;
      if (isCompleted) {
        handleAttemptNext();
      } else {
        handleCheck();
      }
    }
  };

  if (!sentence) return null;

  const isCompleted = checkResult?.isCorrect || hasGivenUp;

  return (
    <div className={`bg-slate-900/90 rounded-2xl border border-slate-800 p-4 sm:p-5 shadow-2xl transition-all ${isShaking ? 'animate-shake ring-2 ring-rose-500/50' : ''}`}>
      {/* Tiêu đề & Thông số câu */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center border border-emerald-500/30">
            {sentence.id}
          </span>
          <span className="text-xs font-semibold text-slate-300">
            Gõ lại điều bạn nghe
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Thời lượng: {sentence.duration}s</span>
          <span className="text-slate-600">•</span>
          <span className="text-emerald-400/90 font-medium">Mục tiêu: {sentence.charCount || sentence.text.length} ký tự</span>
        </div>
      </div>

      {/* Khung nhập liệu Dictation theo đúng mẫu ảnh */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        {/* Nút Nghe câu trên giao diện (Kèm ràng buộc chống spam & phản hồi thị giác) */}
        <button
          onClick={handlePlayClick}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-lg ${
            isPlaying
              ? 'bg-emerald-500 text-slate-950 ring-4 ring-emerald-500/30 playing-pulse'
              : 'bg-slate-800/90 hover:bg-slate-700 text-emerald-400 border border-slate-700 hover:border-emerald-500/40'
          }`}
          title={isPlaying ? 'Đang phát... Bấm để nghe lại từ đầu câu (Ctrl+Space)' : 'Bấm để nghe câu này (Ctrl+Space)'}
        >
          {isPlaying ? <Volume2 className="w-5 h-5 animate-pulse" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
        </button>

        {/* Ô Input gõ tiếng Nhật */}
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={userInput}
            onChange={(e) => {
              setUserInput(e.target.value);
              if (validationError) setValidationError('');
            }}
            onKeyDown={handleKeyDown}
            disabled={isCompleted}
            placeholder="Gõ lại điều bạn nghe được (bằng tiếng Nhật)..."
            className={`w-full h-12 pl-4 pr-16 text-base font-jp rounded-2xl bg-slate-950 border-2 text-white placeholder-slate-500 focus:outline-none transition-all disabled:opacity-80 ${
              validationError
                ? 'border-rose-500 focus:ring-4 focus:ring-rose-500/20'
                : 'border-slate-700/80 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15'
            }`}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
            {sentence.charCount || sentence.text.length} từ
          </div>
        </div>

        {/* Nút Kiểm tra hoặc Câu tiếp theo */}
        {isCompleted ? (
          <button
            onClick={handleAttemptNext}
            className="h-12 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-1.5 transition cursor-pointer shadow-lg shadow-emerald-500/20 whitespace-nowrap"
            title="Nhấn phím tắt Ctrl+N hoặc Enter để sang câu tiếp theo"
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
                  Ctrl+N
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

      {/* Cảnh báo ràng buộc (nếu có lỗi) */}
      {validationError && (
        <div className="mt-2.5 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-fadeIn">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Kết quả chấm điểm Diff chi tiết */}
      {checkResult && (
        <div className="mt-4 p-4 rounded-xl bg-slate-950/90 border border-slate-800/90 animate-fadeIn">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {checkResult.isCorrect ? (
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  Chính xác 100%!
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-400 text-xs font-bold border border-rose-500/30 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Độ chính xác: {checkResult.accuracy}%
                </span>
              )}
              {checkResult.phoneticMatch && !checkResult.isExact && (
                <span className="text-[11px] text-teal-400 bg-teal-950/60 px-2 py-0.5 rounded border border-teal-800">
                  Chuẩn ngữ âm Hiragana!
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

          {/* Hiển thị phân tích ký tự Diff (Xanh: Đúng, Đỏ: Sai, Xám: Thiếu) */}
          <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 font-jp text-lg leading-relaxed flex flex-wrap gap-1 items-center">
            {checkResult.diff.map((item, index) => {
              if (item.status === 'correct') {
                return (
                  <span
                    key={index}
                    className="text-emerald-400 font-bold bg-emerald-500/10 px-1 rounded border border-emerald-500/20"
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
                    className="text-rose-400 font-bold bg-rose-500/10 px-1 rounded line-through border border-rose-500/30"
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
                    className="text-slate-500 border-b-2 border-dashed border-amber-500/60 px-1 font-mono text-sm"
                    title={`Còn thiếu: ${item.expected}`}
                  >
                    {item.expected}
                  </span>
                );
              }
              return null;
            })}
          </div>

          {/* Câu gốc chính thức & Dịch nghĩa tiếng Việt */}
          <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1.5">
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span>Câu gốc chuẩn:</span>
              <span className="font-jp text-slate-100 font-semibold text-sm">
                {sentence.furigana ? sentence.furigana : sentence.text}
              </span>
            </div>
            {sentence.vietnamese && (
              <div className="text-xs text-emerald-400/90 font-medium">
                🇻🇳 Dịch nghĩa: {sentence.vietnamese}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Thanh gợi ý phụ (Hints) */}
      {!isCompleted && (
        <div className="mt-3 pt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            {/* Gợi ý nghĩa tiếng Việt */}
            <button
              onClick={() => setShowHintMeaning(!showHintMeaning)}
              className="text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700/60 transition cursor-pointer flex items-center gap-1"
            >
              <HelpCircle className="w-3.5 h-3.5 text-teal-400" />
              <span>{showHintMeaning ? 'Ẩn nghĩa tiếng Việt' : 'Gợi ý nghĩa tiếng Việt'}</span>
            </button>

            {/* Gợi ý Furigana */}
            <button
              onClick={() => setShowHintFurigana(!showHintFurigana)}
              className="text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700/60 transition cursor-pointer flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{showHintFurigana ? 'Ẩn Furigana' : 'Gợi ý Furigana'}</span>
            </button>
          </div>

          {/* Bỏ qua câu (Xem đáp án để mở khóa câu kế) */}
          <button
            onClick={handleGiveUp}
            className="text-slate-500 hover:text-rose-400 transition cursor-pointer"
            title="Bỏ qua câu này và xem đáp án để mở khóa câu tiếp theo"
          >
            Bỏ qua câu này (Mở khóa)
          </button>
        </div>
      )}

      {/* Khung nội dung gợi ý nếu người dùng bấm mở */}
      {(showHintMeaning || showHintFurigana) && (
        <div className="mt-2.5 p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-1 animate-fadeIn">
          {showHintMeaning && sentence.vietnamese && (
            <p className="text-teal-300">
              <span className="font-semibold text-slate-400">Nghĩa tiếng Việt: </span>
              {sentence.vietnamese}
            </p>
          )}
          {showHintFurigana && sentence.furigana && (
            <p className="text-amber-300 font-jp">
              <span className="font-semibold text-slate-400 font-sans">Furigana: </span>
              {sentence.furigana}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
