import React, { useState } from 'react';
import { Play, Sparkles, Video, CheckCircle2, BookmarkCheck, RefreshCw, Layers } from 'lucide-react';
import { SAMPLE_LESSONS } from '../data/sampleLessons';

export function Header({
  onLoadUrl,
  isLoading,
  currentLesson,
  onSelectSample,
  completedCount,
  totalCount,
  onOpenFlashcards,
  flashcardsCount = 0,
}) {
  const [urlInput, setUrlInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (urlInput.trim()) {
      onLoadUrl(urlInput.trim());
    }
  };

  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <header className="sticky top-0 z-50 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-emerald-950/50 text-white font-bold text-xl">
              語
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  NihonDictate
                </span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Việt - Nhật
                </span>
              </div>
              <p className="text-xs text-slate-400">Luyện nghe gõ phụ đề & Shadowing thông minh</p>
            </div>
          </div>

          {/* Mobile Progress Counter */}
          <div className="md:hidden flex items-center gap-1.5 text-xs text-slate-300 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{completedCount}/{totalCount}</span>
          </div>
        </div>

        {/* Input URL Form */}
        <form onSubmit={handleSubmit} className="flex-1 max-w-xl w-full flex items-center gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Video className="w-4 h-4 text-red-400" />
            </div>
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Dán link YouTube (ví dụ: https://www.youtube.com/watch?v=...)"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !urlInput.trim()}
            className="px-4 py-2 text-sm font-medium rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:pointer-events-none text-slate-950 flex items-center gap-1.5 transition shadow-lg shadow-emerald-500/20 whitespace-nowrap cursor-pointer"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Đang xử lý phụ đề...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Tải phụ đề</span>
              </>
            )}
          </button>
        </form>

        {/* Sample Lessons Dropdown & Progress */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="relative">
            <select
              onChange={(e) => {
                const found = SAMPLE_LESSONS.find(l => l.id === e.target.value);
                if (found) onSelectSample(found);
              }}
              value={currentLesson?.id || ''}
              className="text-xs bg-slate-900 border border-slate-700/80 text-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer pr-8"
            >
              <option value="" disabled>-- Chọn bài học mẫu --</option>
              {SAMPLE_LESSONS.map((sample) => (
                <option key={sample.id} value={sample.id}>
                  {sample.title}
                </option>
              ))}
            </select>
          </div>

          {/* Nút mở Sổ Flashcard */}
          <button
            onClick={onOpenFlashcards}
            className="px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            title="Mở Sổ Flashcards & Từ vựng để ôn tập hoặc xuất file Anki/Quizlet"
          >
            <BookmarkCheck className="w-4 h-4 text-amber-400" />
            <span>Flashcards</span>
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500/30 text-amber-200 text-[11px] font-bold">
              {flashcardsCount}
            </span>
          </button>

          {/* Desktop Progress Indicator */}
          <div className="hidden lg:flex items-center gap-2.5 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5">
            <div className="text-right">
              <div className="text-[11px] text-slate-400 font-medium">Tiến độ chép</div>
              <div className="text-xs font-bold text-white">
                {completedCount} <span className="text-slate-500 font-normal">/ {totalCount} câu</span>
              </div>
            </div>
            <div className="w-12 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 transition-all duration-500 rounded-full"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-emerald-400">{percentage}%</span>
          </div>
        </div>
      </div>
    </header>
  );
}
