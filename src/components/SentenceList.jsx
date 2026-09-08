// src/components/SentenceList.jsx
import React, { useState } from 'react';
import { CheckCircle2, Play, Lock, Unlock, ChevronRight, Volume2, Award, HelpCircle } from 'lucide-react';

function formatTime(seconds = 0) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function SentenceList({
  sentences,
  activeIndex,
  onSelectSentence,
  completedMap = {},
}) {
  const [isFreeMode, setIsFreeMode] = useState(true);

  return (
    <div className="space-y-2 mt-3">
      {/* Thanh tùy chọn chế độ luyện tập */}
      <div className="flex items-center justify-between py-1.5 px-1 text-xs text-slate-400">
        <span className="text-[11px] text-slate-400">
          💡 Click vào bất kỳ câu nào để phát và luyện nghe
        </span>

        <button
          onClick={() => setIsFreeMode(!isFreeMode)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition cursor-pointer font-medium text-[11px] ${
            isFreeMode
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
              : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
          }`}
          title={
            isFreeMode
              ? 'Đang mở tất cả các câu (Chế độ tự do). Bấm để chuyển sang chế độ khóa tuần tự.'
              : 'Đang khóa theo tiến độ tuần tự. Bấm để mở tự do chọn câu bất kỳ.'
          }
        >
          {isFreeMode ? (
            <>
              <Unlock className="w-3 h-3 text-emerald-400" />
              <span>Chế độ tự do</span>
            </>
          ) : (
            <>
              <Lock className="w-3 h-3 text-amber-400" />
              <span>Chế độ tuần tự</span>
            </>
          )}
        </button>
      </div>

      {/* Danh sách các câu */}
      <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
        {sentences.map((sentence, idx) => {
          const isActive = idx === activeIndex;
          const isDone = !!completedMap[sentence.id];
          const progressInfo = completedMap[sentence.id];
          const isAccessible = isDone || isFreeMode || isActive;

          const timeLabel = `${formatTime(sentence.start)} - ${formatTime(sentence.end)}`;

          if (isActive) {
            // Câu đang được chọn làm: Cho phép click để nghe lại tức thì
            return (
              <div
                key={sentence.id}
                onClick={() => onSelectSentence(idx)}
                className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/15 border-2 border-emerald-500/50 text-emerald-300 font-medium text-xs shadow-md cursor-pointer hover:bg-emerald-500/20 transition group"
                title="Bấm để phát lại câu này (hoặc phím tắt Ctrl+Space)"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-bold flex items-center justify-center text-xs shrink-0 group-hover:scale-105 transition shadow-sm">
                    <Play className="w-3 h-3 fill-current ml-0.5" />
                  </span>
                  <div>
                    <span className="font-semibold text-slate-100 group-hover:text-emerald-300 transition">
                      Đang luyện chép câu {sentence.id}
                    </span>
                    <span className="text-[10px] text-emerald-400/80 block font-mono">
                      {timeLabel}
                    </span>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[11px] shrink-0 flex items-center gap-1.5 shadow-sm">
                  <Volume2 className="w-3 h-3 animate-pulse" />
                  Bấm để nghe lại
                </span>
              </div>
            );
          }

          if (isAccessible) {
            // Câu đã hoàn thành hoặc đang ở chế độ tự do
            return (
              <div
                key={sentence.id}
                onClick={() => onSelectSentence(idx)}
                className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition group ${
                  isDone
                    ? 'bg-slate-900/80 hover:bg-slate-800/90 border-slate-800/80'
                    : 'bg-slate-900/40 hover:bg-slate-800/60 border-slate-800/50'
                }`}
                title={`Click để nghe và luyện chép câu ${sentence.id}`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {isDone ? (
                    progressInfo?.givenUp ? (
                      <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center border border-amber-500/30 shrink-0">
                        <HelpCircle className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center border border-emerald-500/30 shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </span>
                    )
                  ) : (
                    <span className="w-6 h-6 rounded-full bg-slate-800 group-hover:bg-slate-700 text-slate-400 font-semibold text-xs flex items-center justify-center border border-slate-700 shrink-0 transition">
                      {sentence.id}
                    </span>
                  )}

                  <div className="text-left min-w-0 flex-1">
                    <p className="font-jp text-sm text-slate-200 group-hover:text-white transition truncate">
                      {sentence.text}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-slate-500 font-mono">
                        {timeLabel}
                      </span>
                      {sentence.vietnamese && (
                        <span className="text-[11px] text-slate-400 truncate hidden sm:inline">
                          • {sentence.vietnamese}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {isDone && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        progressInfo?.givenUp
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}
                    >
                      {progressInfo?.givenUp
                        ? 'Đáp án'
                        : `${progressInfo?.accuracy || 100}%`}
                    </span>
                  )}
                  <span className="w-6 h-6 rounded-lg bg-slate-800/70 group-hover:bg-emerald-500 group-hover:text-slate-950 text-slate-400 flex items-center justify-center transition shadow-sm">
                    <Play className="w-3 h-3 fill-current ml-0.5" />
                  </span>
                </div>
              </div>
            );
          }

          // Câu sắp tới bị khóa theo mô hình Khóa tiến độ
          return (
            <div
              key={sentence.id}
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/30 border border-slate-800/40 opacity-50 cursor-not-allowed select-none group"
              title="Hãy hoàn thành câu hiện tại để mở khóa câu này"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-slate-600 font-bold text-xs flex items-center justify-center border border-slate-800 shrink-0">
                  <Lock className="w-3 h-3" />
                </span>

                {/* Dải placeholder pills */}
                <div className="flex items-center gap-1.5 opacity-30">
                  {Array.from({
                    length: Math.min(Math.ceil((sentence.charCount || 10) / 2), 8),
                  }).map((_, pIdx) => (
                    <span
                      key={pIdx}
                      className="h-2 rounded-full bg-slate-600"
                      style={{ width: `${12 + (pIdx % 3) * 6}px` }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-600 font-mono">
                  {timeLabel}
                </span>
                <span className="text-[10px] text-slate-600 bg-slate-950/40 px-1.5 py-0.5 rounded border border-slate-900">
                  {sentence.charCount || sentence.text.length} từ
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
