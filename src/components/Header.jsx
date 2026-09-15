import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Sparkles,
  Video,
  CheckCircle2,
  BookmarkCheck,
  RefreshCw,
  ChevronDown,
  Trash2,
  Film,
  BookOpen,
} from 'lucide-react';
import { SAMPLE_LESSONS } from '../data/sampleLessons';

function decodeHtmlEntities(str = '') {
  if (!str) return '';
  return str
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec));
}

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
  const [cachedLessons, setCachedLessons] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Danh sách các bài học người dùng đã xóa / ẩn (lưu bền vững trong localStorage)
  const [deletedLessonIds, setDeletedLessonIds] = useState(() => {
    try {
      const saved = localStorage.getItem('nihon_deleted_lessons');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Tải danh sách video đã cache trên máy chủ
  const fetchCachedLessons = () => {
    fetch('/api/lessons/cached')
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (Array.isArray(data)) {
          setCachedLessons(data);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchCachedLessons();
  }, [currentLesson?.videoId]);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (urlInput.trim()) {
      onLoadUrl(urlInput.trim());
    }
  };

  // Hợp nhất bài học mẫu và video cache, loại bỏ hoàn toàn trùng lặp
  const unifiedLessons = useMemo(() => {
    const list = [];
    const seenVideoIds = new Set();
    const deletedSet = new Set(deletedLessonIds);

    // 1. Thêm các bài học mẫu có sẵn (nếu chưa bị xóa)
    SAMPLE_LESSONS.forEach(sample => {
      if (deletedSet.has(sample.videoId) || deletedSet.has(sample.id)) return;
      seenVideoIds.add(sample.videoId);
      list.push({
        id: sample.id,
        videoId: sample.videoId,
        title: decodeHtmlEntities(sample.title),
        totalSentences: sample.sentences?.length || 0,
        isSample: true,
        rawSample: sample,
      });
    });

    // 2. Thêm các video đã cache lưu (loại bỏ nếu trùng videoId hoặc đã bị xóa)
    cachedLessons.forEach(cached => {
      if (deletedSet.has(cached.videoId)) return;
      if (!seenVideoIds.has(cached.videoId)) {
        seenVideoIds.add(cached.videoId);
        list.push({
          id: `yt_${cached.videoId}`,
          videoId: cached.videoId,
          title: decodeHtmlEntities(cached.title),
          totalSentences: cached.totalSentences || 0,
          isSample: false,
        });
      }
    });

    return list;
  }, [cachedLessons, deletedLessonIds]);

  // Tự động chạy URL khi chọn một bài học trong danh sách
  const handleSelectLesson = (item) => {
    setIsDropdownOpen(false);
    const ytUrl = `https://www.youtube.com/watch?v=${item.videoId}`;
    setUrlInput(ytUrl);
    if (item.isSample && item.rawSample) {
      onSelectSample(item.rawSample);
    } else {
      onLoadUrl(ytUrl);
    }
  };

  // Xóa video khỏi cache và danh sách hiển thị
  const handleDeleteLesson = async (e, videoId) => {
    e.preventDefault();
    e.stopPropagation();

    // 1. Cập nhật state & lưu vào localStorage ngay lập tức
    setDeletedLessonIds(prev => {
      const next = [...new Set([...prev, videoId])];
      try {
        localStorage.setItem('nihon_deleted_lessons', JSON.stringify(next));
      } catch (err) {}
      return next;
    });

    setCachedLessons(prev => prev.filter(item => item.videoId !== videoId));

    // 2. Gửi lệnh xóa file vật lý trên server cache
    try {
      await fetch(`/api/lessons/cached/${videoId}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('Lỗi khi gọi API xóa cache:', err);
    }
  };


  // Xác định bài học đang chọn
  const activeItem = unifiedLessons.find(
    item => item.videoId === currentLesson?.videoId || item.id === currentLesson?.id
  );

  const displayTitle = activeItem
    ? `${activeItem.title} (${activeItem.totalSentences} câu)`
    : (currentLesson?.title
        ? `${decodeHtmlEntities(currentLesson.title)} (${currentLesson?.sentences?.length || 0} câu)`
        : '-- Chọn bài học --');

  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-3">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-start">
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
          <div className="lg:hidden flex items-center gap-1.5 text-xs text-slate-300 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{completedCount}/{totalCount}</span>
          </div>
        </div>

        {/* Input URL Form - Mở rộng tối đa không gian flex-1 */}
        <form onSubmit={handleSubmit} className="flex-1 max-w-2xl w-full flex items-center gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Video className="w-4 h-4 text-rose-400" />
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
            className="px-4 py-2 text-sm font-medium rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:pointer-events-none text-slate-950 flex items-center gap-1.5 transition shadow-lg shadow-emerald-500/20 whitespace-nowrap cursor-pointer shrink-0"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Đang tải...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Tải phụ đề</span>
              </>
            )}
          </button>
        </form>

        {/* Menu Chọn bài học hợp nhất & Flashcards & Progress */}
        <div className="flex items-center gap-2.5 w-full lg:w-auto justify-end">
          {/* Custom Dropdown hợp nhất bài học & cho phép xóa cache */}
          <div className="relative flex-1 sm:flex-initial" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(prev => !prev)}
              className="w-full sm:w-auto max-w-[280px] text-xs bg-slate-900/90 hover:bg-slate-850 border border-slate-700/80 text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer flex items-center justify-between gap-2 transition shadow-sm"
              title="Danh sách bài học & video đã lưu"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <Film className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate text-left font-medium">{displayTitle}</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${isDropdownOpen ? 'rotate-180 text-emerald-400' : ''}`} />
            </button>

            {/* Menu danh sách thả xuống */}
            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-slate-900/98 border border-slate-700/90 rounded-2xl shadow-2xl backdrop-blur-xl z-50 p-2 space-y-1 animate-fadeIn">
                <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-slate-800 text-[11px] text-slate-400 font-medium">
                  <div className="flex items-center gap-1.5">
                    <span>Danh sách bài học ({unifiedLessons.length})</span>
                    {deletedLessonIds.length > 0 && (
                      <button
                        type="button"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletedLessonIds([]);
                          try {
                            localStorage.removeItem('nihon_deleted_lessons');
                          } catch (err) {}
                          fetchCachedLessons();
                        }}
                        className="text-[10px] text-teal-400 hover:text-teal-300 hover:underline cursor-pointer"
                        title="Khôi phục lại các bài học đã xóa"
                      >
                        (Khôi phục {deletedLessonIds.length})
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500">Bấm để nạp bài tức thì</span>
                </div>

                <div className="max-h-72 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
                  {unifiedLessons.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500">
                      Chưa có bài học nào
                    </div>
                  ) : (
                    unifiedLessons.map((item) => {
                      const isCurrent = (activeItem?.videoId === item.videoId) || (activeItem?.id === item.id);
                      return (
                        <div
                          key={item.videoId || item.id}
                          onClick={() => handleSelectLesson(item)}
                          className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition group ${
                            isCurrent
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40'
                              : 'hover:bg-slate-800 text-slate-300 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                            {item.isSample ? (
                              <span className="w-5 h-5 rounded-md bg-teal-500/20 text-teal-300 flex items-center justify-center shrink-0 text-[10px] font-bold">
                                ✨
                              </span>
                            ) : (
                              <span className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 text-[10px] font-bold">
                                💾
                              </span>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="font-medium truncate group-hover:text-white transition">
                                {item.title}
                              </p>
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                                <span className="font-mono text-emerald-400/90">{item.totalSentences} câu</span>
                                <span>•</span>
                                <span className={item.isSample ? 'text-teal-400' : 'text-slate-400'}>
                                  {item.isSample ? 'Bài học mẫu' : 'Đã lưu cache'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Nút xóa video khỏi danh sách */}
                          <button
                            type="button"
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => handleDeleteLesson(e, item.videoId || item.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/15 transition cursor-pointer shrink-0 opacity-70 group-hover:opacity-100"
                            title="Xóa bài học này khỏi danh sách"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Nút mở Sổ Flashcard */}
          <button
            onClick={onOpenFlashcards}
            className="px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm shrink-0"
            title="Mở Sổ Flashcards & Từ vựng để ôn tập hoặc xuất file Anki/Quizlet"
          >
            <BookmarkCheck className="w-4 h-4 text-amber-400" />
            <span>Flashcards</span>
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500/30 text-amber-200 text-[11px] font-bold">
              {flashcardsCount}
            </span>
          </button>

          {/* Desktop Progress Indicator */}
          <div className="hidden xl:flex items-center gap-2.5 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5 shrink-0">
            <div className="text-right">
              <div className="text-[10px] text-slate-400 font-medium">Tiến độ</div>
              <div className="text-xs font-bold text-white">
                {completedCount} <span className="text-slate-500 font-normal">/ {totalCount}</span>
              </div>
            </div>
            <div className="w-10 h-2 bg-slate-800 rounded-full overflow-hidden">
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

