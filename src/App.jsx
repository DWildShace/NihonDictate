// src/App.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BookOpen, Mic, Keyboard, Layers, HelpCircle, CheckCircle2, Award, ChevronLeft, ChevronRight, AlertTriangle, PartyPopper } from 'lucide-react';
import { Header } from './components/Header';
import { VideoPlayer } from './components/VideoPlayer';
import { DictationCard } from './components/DictationCard';
import { SentenceList } from './components/SentenceList';
import { SubtitlesTab } from './components/SubtitlesTab';
import { ShadowingTab } from './components/ShadowingTab';
import { FlashcardModal } from './components/FlashcardModal';
import { QuickFlashcardBar } from './components/QuickFlashcardBar';
import { SAMPLE_LESSONS } from './data/sampleLessons';
import { getLessonProgress, saveSentenceProgress, getFlashcards, saveFlashcard } from './utils/storage';
import { sanitizeRelativeTimestamps } from './utils/relativeTimestamps';

export function App() {
  // Bài học hiện tại (Mặc định là bài Lái xe ngắm cảnh như trong ảnh của bạn)
  const [currentLesson, setCurrentLesson] = useState(() => ({
    ...SAMPLE_LESSONS[0],
    sentences: sanitizeRelativeTimestamps(SAMPLE_LESSONS[0].sentences),
  }));
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('dictation'); // 'subtitles' | 'shadowing' | 'dictation'

  // Trạng thái phát video
  const [isPlayingSegment, setIsPlayingSegment] = useState(false);
  const [showSubtitlesOnVideo, setShowSubtitlesOnVideo] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isLooping, setIsLooping] = useState(false);
  const [audioBuffer, setAudioBuffer] = useState(0.25); // Đệm âm thanh mặc định 0.25s

  // Trạng thái Flashcard Modal
  const [isFlashcardModalOpen, setIsFlashcardModalOpen] = useState(false);
  const [flashcardsCount, setFlashcardsCount] = useState(() => getFlashcards().length);

  // Trạng thái bôi đen từ vựng để tạo Flashcard nhanh ở thanh dưới Video
  const [quickSelection, setQuickSelection] = useState(null);

  // Lưu trữ tiến độ học
  const [completedMap, setCompletedMap] = useState({});
  const videoPlayerRef = useRef(null);

  const handleChangePlaybackRate = (rate) => {
    setPlaybackRate(rate);
    videoPlayerRef.current?.setPlaybackRate?.(rate);
  };

  const handleToggleLoop = (loop) => {
    setIsLooping(loop);
    videoPlayerRef.current?.setLooping?.(loop);
  };

  // Tải tiến độ từ LocalStorage khi đổi bài học
  useEffect(() => {
    if (currentLesson?.id) {
      const saved = getLessonProgress(currentLesson.id);
      setCompletedMap(saved.completedSentences || {});
      setActiveIndex(0);
      setErrorMessage('');
    }
  }, [currentLesson?.id]);

  const activeSentence = currentLesson?.sentences[activeIndex] || null;
  const completedCount = Object.keys(completedMap).length;
  const totalCount = currentLesson?.sentences?.length || 0;

  // Gọi phát câu hiện tại và tua video chính xác (hỗ trợ khoảng đệm âm thanh lead-in/lead-out)
  const handlePlaySentence = useCallback((sentence, customBuffer) => {
    const target = sentence || activeSentence;
    if (!target) return;
    setIsPlayingSegment(true);
    const buf = customBuffer !== undefined ? customBuffer : audioBuffer;
    videoPlayerRef.current?.playSentence(target, buf);
  }, [activeSentence, audioBuffer]);

  // Xử lý khi người dùng hoàn thành 1 câu
  const handleSentenceCompleted = (sentenceId, resultData) => {
    saveSentenceProgress(currentLesson.id, sentenceId, resultData);
    setCompletedMap((prev) => ({
      ...prev,
      [sentenceId]: {
        isCompleted: true,
        ...resultData,
      },
    }));
  };

  // Sang câu tiếp theo (Hướng A: người học chủ động bấm Nghe hoặc phím tắt Ctrl+Space khi đã sẵn sàng)
  const handleNextSentence = () => {
    if (activeIndex < currentLesson.sentences.length - 1) {
      setActiveIndex(prev => prev + 1);
      setIsPlayingSegment(false);
    }
  };

  // Về câu trước
  const handlePrevSentence = () => {
    if (activeIndex > 0) {
      setActiveIndex(prev => prev - 1);
    }
  };

  // Tải bài học từ link YouTube URL
  const handleLoadUrl = async (url) => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await fetch('/api/subtitles/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Không thể tải phụ đề cho video này.');
      }

      const data = await res.json();
      const sanitizedSentences = sanitizeRelativeTimestamps(data.sentences);
      const newLesson = {
        id: `yt_${data.videoId}`,
        title: data.videoTitle || 'Bài học YouTube',
        videoId: data.videoId,
        thumbnail: `https://img.youtube.com/vi/${data.videoId}/hqdefault.jpg`,
        description: `Bóc tách tự động ${data.totalSentences} câu tiếng Nhật từ YouTube`,
        sentences: sanitizedSentences,
      };

      setCurrentLesson(newLesson);
      setActiveIndex(0);
      setActiveTab('dictation');
    } catch (err) {
      setErrorMessage(err.message || 'Lỗi khi trích xuất phụ đề.');
    } finally {
      setIsLoading(false);
    }
  };

  // Trạng thái thông báo cảnh báo ràng buộc chuyển câu
  const [gateWarning, setGateWarning] = useState('');

  // Lắng nghe phím tắt toàn cục (Chuẩn công thái học, không xung đột phím tắt mặc định của trình duyệt)
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // 1. Ctrl + Space: Nghe lại câu hiện tại tức thì (Bỏ Alt+Space vì xung đột Windows system menu)
      if (e.ctrlKey && e.code === 'Space') {
        e.preventDefault();
        handlePlaySentence(activeSentence);
        return;
      }

      // 2. Alt + N hoặc Alt + ArrowRight hoặc Alt + ArrowDown: Chuyển câu tiếp theo (có ràng buộc hoàn thành)
      if (e.altKey && (e.key === 'n' || e.key === 'N' || e.key === 'ArrowRight' || e.key === 'ArrowDown')) {
        e.preventDefault();
        const isCurrentDone = !!completedMap[activeSentence?.id];
        if (isCurrentDone) {
          handleNextSentence();
        } else {
          setGateWarning(`⚠️ Hãy hoàn thành hoặc bấm "Bỏ qua" câu số ${activeSentence?.id || ''} trước khi sang câu tiếp theo (Alt+N)!`);
          setTimeout(() => setGateWarning(''), 3500);
        }
        return;
      }

      // 3. Alt + P hoặc Alt + ArrowLeft hoặc Alt + ArrowUp: Lùi về câu trước
      if (e.altKey && (e.key === 'p' || e.key === 'P' || e.key === 'ArrowLeft' || e.key === 'ArrowUp')) {
        e.preventDefault();
        handlePrevSentence();
        return;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [activeIndex, currentLesson, completedMap, activeSentence, handlePlaySentence]);

  // Lắng nghe sự kiện bôi đen (Text selection) toàn diện trên ứng dụng (cho phép bôi tiếp bên trong thanh QuickFlashcardBar)
  useEffect(() => {
    const handleMouseUp = (e) => {
      // Bỏ qua nếu click vào nút bấm (button) hoặc icon điều khiển
      if (e.target.closest && e.target.closest('button')) {
        return;
      }

      // Bỏ qua nếu bôi đen bên trong ô input / textarea gõ chính tả
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      const sel = window.getSelection();
      const raw = sel ? sel.toString() : '';
      const clean = raw.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim();

      // Nếu có bôi đen hợp lệ (kể cả bôi đen tiếp bên trong ô chữ của thanh QuickFlashcardBar)
      if (clean && clean.length > 0 && clean.length <= 250) {
        setQuickSelection({
          text: clean,
          sentence: activeSentence,
          originalSentenceText: activeSentence?.text || clean,
        });
        return;
      }

      // Nếu click bên trong thanh QuickFlashcardBar mà không có bôi đen mới -> Giữ nguyên, không đóng
      if (e.target.closest && e.target.closest('[data-quick-flashcard-bar="true"]')) {
        return;
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchend', handleMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchend', handleMouseUp);
    };
  }, [activeSentence]);

  // Khi chuyển sang câu khác, reset thanh bôi đen nhanh để tránh giữ bộ đệm của câu cũ
  useEffect(() => {
    setQuickSelection(null);
  }, [activeSentence?.id]);

  // Lưu thẻ từ thanh QuickFlashcardBar
  const handleSaveQuickFlashcard = async (cardData) => {
    const res = saveFlashcard(cardData);
    setFlashcardsCount(getFlashcards().length);
    return res;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100 selection:bg-emerald-500 selection:text-slate-950 font-sans">
      {/* Header thanh điều khiển URL & Tiến độ & Flashcard Button */}
      <Header
        onLoadUrl={handleLoadUrl}
        isLoading={isLoading}
        currentLesson={currentLesson}
        onSelectSample={(lesson) => setCurrentLesson({
          ...lesson,
          sentences: sanitizeRelativeTimestamps(lesson.sentences),
        })}
        completedCount={completedCount}
        totalCount={totalCount}
        onOpenFlashcards={() => setIsFlashcardModalOpen(true)}
        flashcardsCount={flashcardsCount}
      />

      {/* Thông báo lỗi nếu dán link không hợp lệ */}
      {errorMessage && (
        <div className="max-w-7xl mx-auto w-full px-4 pt-3">
          <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage('')}
              className="text-rose-400 hover:text-rose-200 font-bold px-2 py-0.5 rounded cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Cảnh báo ràng buộc chuyển câu theo Hướng A */}
      {gateWarning && (
        <div className="max-w-7xl mx-auto w-full px-4 pt-3 animate-fadeIn">
          <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="font-medium">{gateWarning}</span>
            </div>
            <button
              onClick={() => setGateWarning('')}
              className="text-amber-400 hover:text-amber-200 font-bold px-2 py-0.5 rounded cursor-pointer"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}

      {/* Thân ứng dụng - Bố cục Split View 2 cột */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* CỘT TRÁI: Video Player & Thông tin bài học */}
        <section className="lg:col-span-6 xl:col-span-7 space-y-4">
          <VideoPlayer
            ref={videoPlayerRef}
            videoId={currentLesson.videoId}
            activeSentence={activeSentence}
            sentences={currentLesson.sentences}
            onSentenceChange={(newSent) => {
              const idx = currentLesson.sentences.findIndex(s => s.id === newSent.id);
              if (idx !== -1) {
                setActiveIndex(idx);
              }
            }}
            isPlayingSegment={isPlayingSegment}
            setIsPlayingSegment={setIsPlayingSegment}
            autoPause={true}
            onSegmentFinished={() => setIsPlayingSegment(false)}
            showSubtitlesOnVideo={showSubtitlesOnVideo}
            setShowSubtitlesOnVideo={setShowSubtitlesOnVideo}
            audioBuffer={audioBuffer}
          />

          {/* Thanh Quick Flashcard màu vàng cao cấp đặt ở phần trống dưới Video theo đề xuất */}
          <QuickFlashcardBar
            selection={quickSelection}
            onSave={handleSaveQuickFlashcard}
            onClear={() => setQuickSelection(null)}
            onOpenFlashcards={() => setIsFlashcardModalOpen(true)}
            onSelectText={(newText) => {
              setQuickSelection((prev) => ({
                ...prev,
                text: newText,
                sentence: activeSentence,
                originalSentenceText: activeSentence?.text || '',
              }));
            }}
            activeSentence={activeSentence}
            lessonTitle={currentLesson.title}
            videoId={currentLesson.videoId}
          />

          {/* Tiêu đề & Thông tin bài học hiện tại */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2 shadow-lg">
            <div className="flex items-start justify-between gap-2">
              <h1 className="font-bold text-base sm:text-lg text-slate-100 tracking-tight">
                {currentLesson.title}
              </h1>
              <span className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 rounded-full border border-emerald-500/25 shrink-0">
                {currentLesson.sentences.length} câu
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {currentLesson.description}
            </p>

            {/* Hướng dẫn phím tắt tiện lợi */}
            <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
              <span className="font-semibold text-slate-300">Phím tắt:</span>
              <span className="flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 font-mono text-emerald-400">
                Ctrl + Space
              </span>
              <span>Nghe lại</span>
              <span className="flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 font-mono text-emerald-400">
                Enter
              </span>
              <span>Kiểm tra</span>
              <span className="flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 font-mono text-emerald-400">
                Alt + N
              </span>
              <span>Câu tiếp theo</span>
              <span className="flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 font-mono text-emerald-400">
                Alt + ↓ / ↑
              </span>
              <span>Đổi câu</span>
            </div>
          </div>
        </section>

        {/* CỘT PHẢI: Khung luyện tập theo thẻ (Tabs như ảnh mẫu) */}
        <section className="lg:col-span-6 xl:col-span-5 flex flex-col bg-slate-900/50 rounded-2xl border border-slate-800/80 overflow-hidden shadow-xl">
          {/* Thanh Tabs trên cùng (Phụ đề, Tập đọc theo, Tập chép...) */}
          <div className="flex items-center border-b border-slate-800/80 bg-slate-950/60 p-1.5 gap-1">
            <button
              onClick={() => setActiveTab('subtitles')}
              className={`flex-1 py-2.5 px-3 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                activeTab === 'subtitles'
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-teal-400" />
              <span>Phụ đề</span>
            </button>

            <button
              onClick={() => setActiveTab('shadowing')}
              className={`flex-1 py-2.5 px-3 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                activeTab === 'shadowing'
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <Mic className="w-3.5 h-3.5 text-rose-400" />
              <span>Tập đọc theo</span>
            </button>

            <button
              onClick={() => setActiveTab('dictation')}
              className={`flex-1 py-2.5 px-3 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition cursor-pointer relative ${
                activeTab === 'dictation'
                  ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <Keyboard className="w-3.5 h-3.5 text-emerald-400" />
              <span>Tập chép</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            </button>
          </div>

          {/* Nội dung Tab */}
          <div className="p-4 sm:p-5 flex-1 overflow-y-auto max-h-[calc(100vh-140px)]">
            {activeTab === 'dictation' && (
              <div>
                {/* Thanh điều hướng câu (Previous / Next) */}
                <div className="flex items-center justify-between pb-3 mb-3 text-xs text-slate-400 border-b border-slate-800/80">
                  <button
                    onClick={handlePrevSentence}
                    disabled={activeIndex === 0}
                    className="flex items-center gap-1 hover:text-slate-200 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Câu trước</span>
                  </button>

                  <span className="font-semibold text-slate-300">
                    Câu {activeIndex + 1} / {currentLesson.sentences.length}
                  </span>

                  <button
                    onClick={handleNextSentence}
                    disabled={!completedMap[activeSentence?.id] || activeIndex === currentLesson.sentences.length - 1}
                    className="flex items-center gap-1 hover:text-slate-200 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                    title={!completedMap[activeSentence?.id] ? 'Hãy hoàn thành câu hiện tại trước' : 'Sang câu tiếp theo'}
                  >
                    <span>Câu sau</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Thông báo chúc mừng khi hoàn thành tất cả câu */}
                {completedCount > 0 && completedCount === totalCount && (
                  <div className="mb-4 p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center justify-between gap-3 shadow-lg animate-fadeIn">
                    <div className="flex items-center gap-2.5">
                      <PartyPopper className="w-6 h-6 text-emerald-400 shrink-0" />
                      <div>
                        <p className="font-bold text-sm text-emerald-200">
                          Xuất sắc! Bạn đã hoàn thành toàn bộ {totalCount} câu trong bài học!
                        </p>
                        <p className="text-xs text-emerald-400/80">
                          Bạn có thể bấm vào danh sách bên dưới để chọn câu bất kỳ và ôn tập lại.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Card gõ chính tả câu hiện tại */}
                <DictationCard
                  sentence={activeSentence}
                  onPlaySentence={handlePlaySentence}
                  isPlaying={isPlayingSegment}
                  onSentenceCompleted={handleSentenceCompleted}
                  onNextSentence={handleNextSentence}
                  isLastSentence={activeIndex === currentLesson.sentences.length - 1}
                  playbackRate={playbackRate}
                  onChangePlaybackRate={handleChangePlaybackRate}
                  isLooping={isLooping}
                  onToggleLoop={handleToggleLoop}
                  audioBuffer={audioBuffer}
                  onChangeAudioBuffer={(buf) => {
                    setAudioBuffer(buf);
                    videoPlayerRef.current?.setAudioBuffer?.(buf);
                  }}
                  onOpenFlashcards={() => setIsFlashcardModalOpen(true)}
                  onCardAdded={() => setFlashcardsCount(getFlashcards().length)}
                  lessonTitle={currentLesson.title}
                  videoId={currentLesson.videoId}
                />

                {/* Danh sách hàng chờ các câu (phong cách pills placeholder như ảnh mẫu) */}
                <div className="mt-5 pt-4 border-t border-slate-800/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-300">
                      Danh sách các câu
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Đã chép {completedCount}/{totalCount}
                    </span>
                  </div>

                  <SentenceList
                    sentences={currentLesson.sentences}
                    activeIndex={activeIndex}
                    onSelectSentence={(idx) => {
                      const target = currentLesson.sentences[idx];
                      setActiveIndex(idx);
                      if (target) {
                        handlePlaySentence(target);
                      }
                    }}
                    completedMap={completedMap}
                  />
                </div>
              </div>
            )}

            {activeTab === 'subtitles' && (
              <SubtitlesTab
                sentences={currentLesson.sentences}
                activeIndex={activeIndex}
                onSelectSentence={setActiveIndex}
                onPlaySentence={handlePlaySentence}
              />
            )}

            {activeTab === 'shadowing' && (
              <ShadowingTab
                sentence={activeSentence}
                onPlayNativeAudio={handlePlaySentence}
              />
            )}
          </div>
        </section>
      </main>

      {/* Modal Sổ Flashcards & Xuất file Anki/Quizlet */}
      <FlashcardModal
        isOpen={isFlashcardModalOpen}
        onClose={() => setIsFlashcardModalOpen(false)}
        onCardChange={(count) => setFlashcardsCount(count)}
      />
    </div>
  );
}
export default App;
