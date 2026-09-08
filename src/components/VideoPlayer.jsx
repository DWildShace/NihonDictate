import React, { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Play, Pause, RotateCcw, Gauge, Eye, EyeOff, Volume2, Repeat } from 'lucide-react';

export const VideoPlayer = forwardRef(function VideoPlayer({
  videoId,
  activeSentence,
  sentences = [],
  onSentenceChange,
  isPlayingSegment,
  setIsPlayingSegment,
  autoPause = true,
  onSegmentFinished,
  showSubtitlesOnVideo = false,
  setShowSubtitlesOnVideo,
  audioBuffer = 0.25, // Khoảng đệm âm thanh mặc định 0.25s
}, ref) {
  const playerRef = useRef(null);
  const checkIntervalRef = useRef(null);
  const lastPausedIdRef = useRef(null);
  const currentSegmentSentenceRef = useRef(null);
  const isSeekingRef = useRef(false);
  const seekTargetRef = useRef(0);
  const seekStartTimeRef = useRef(0);

  const [isReady, setIsReady] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLooping, setIsLooping] = useState(false);
  const [activeBuffer, setActiveBuffer] = useState(audioBuffer);

  useEffect(() => {
    setActiveBuffer(audioBuffer);
  }, [audioBuffer]);

  // Khởi tạo YouTube IFrame Player
  useEffect(() => {
    if (!videoId) return;

    let playerInstance = null;

    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) return;

      // Xóa player cũ nếu đã có
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        try {
          playerRef.current.destroy();
        } catch (e) {
          // ignore
        }
      }

      playerInstance = new window.YT.Player('youtube-player-container', {
        videoId: videoId,
        playerVars: {
          autoplay: 0,
          controls: 1,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          cc_load_policy: 0, // Tắt mặc định phụ đề mặc định của YouTube để hiển thị qua app
        },
        events: {
          onReady: (event) => {
            playerRef.current = event.target;
            setIsReady(true);
            setDuration(event.target.getDuration() || 0);
          },
          onStateChange: (event) => {
            // YT.PlayerState.PLAYING = 1, PAUSED = 2, ENDED = 0
            if (event.data === 1) {
              // Đang phát
            } else if (event.data === 2) {
              setIsPlayingSegment(false);
            }
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      // Nạp script YouTube API nếu chưa có
      if (!document.getElementById('youtube-iframe-api-script')) {
        const tag = document.createElement('script');
        tag.id = 'youtube-iframe-api-script';
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      }
      window.onYouTubeIframeAPIReady = () => {
        initPlayer();
      };
    }

    return () => {
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
      if (playerInstance && typeof playerInstance.destroy === 'function') {
        try {
          playerInstance.destroy();
        } catch (e) {}
      }
    };
  }, [videoId]);

  const bufferRef = useRef(activeBuffer);
  bufferRef.current = activeBuffer;

  // Hook theo dõi thời gian và tự động dừng khi phát hết câu (Auto-Pause)
  useEffect(() => {
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
    }

    if (!isReady || !playerRef.current) return;

    checkIntervalRef.current = setInterval(() => {
      try {
        if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
          const time = playerRef.current.getCurrentTime();
          setCurrentTime(time);

          let playerState = 0;
          try {
            playerState = playerRef.current.getPlayerState();
          } catch (e) {}

          // Chỉ xử lý tự ngắt khi video ĐANG PHÁT (playerState === 1)
          if (playerState === 1) {
            // TRƯỜNG HỢP 1: Đang phát một câu được chỉ định (Segment Lock)
            if (currentSegmentSentenceRef.current) {
              const target = currentSegmentSentenceRef.current;
              const stopTime = target.stopTime || target.end;

              // Nếu đang trong quá trình tua (seek) đến mốc câu mới
              if (isSeekingRef.current) {
                const elapsed = Date.now() - seekStartTimeRef.current;
                const targetSeek = seekTargetRef.current;

                // Kiểm tra xem YouTube đã nhảy đến gần mốc seekTime chưa
                const hasArrived =
                  (targetSeek === 0 && time < 1.0) ||
                  Math.abs(time - targetSeek) < 0.6 ||
                  (time >= targetSeek && time < stopTime);

                if (hasArrived || elapsed > 1500) {
                  // Đã đến vị trí câu mới hoặc timeout an toàn 1.5s
                  isSeekingRef.current = false;
                } else {
                  // YouTube iframe vẫn đang tua ở mốc thời gian cũ -> Tuyệt đối không ngắt nhầm!
                  return;
                }
              }

              // Dừng an toàn tại ngưỡng stopTime (đã bao gồm lead-out buffer)
              if (time >= stopTime) {
                if (isLooping) {
                  const loopSeekTime = target.seekTime ?? Math.max(0, target.start);
                  isSeekingRef.current = true;
                  seekTargetRef.current = loopSeekTime;
                  seekStartTimeRef.current = Date.now();
                  playerRef.current.seekTo(loopSeekTime, true);
                  playerRef.current.playVideo();
                } else {
                  playerRef.current.pauseVideo();
                  lastPausedIdRef.current = target.id;
                  currentSegmentSentenceRef.current = null;
                  setIsPlayingSegment(false);
                  if (onSegmentFinished) {
                    onSegmentFinished(target);
                  }
                }
              }
              return;
            }

            // TRƯỜNG HỢP 2: Người dùng tua video tự do trên thanh tiến trình YouTube
            const matchedSentence = sentences.find(
              s => time >= s.start && time < s.end
            );

            if (matchedSentence) {
              // Đồng bộ sang câu tương ứng khi tua
              if (matchedSentence.id !== activeSentence?.id && onSentenceChange) {
                onSentenceChange(matchedSentence);
                lastPausedIdRef.current = null;
              }

              // Nếu bật tự động dừng (autoPause) và chạm đích kết thúc câu
              if (autoPause && time >= matchedSentence.end) {
                if (lastPausedIdRef.current !== matchedSentence.id) {
                  playerRef.current.pauseVideo();
                  lastPausedIdRef.current = matchedSentence.id;
                  setIsPlayingSegment(false);
                  if (onSegmentFinished) {
                    onSegmentFinished(matchedSentence);
                  }
                }
              } else if (time < matchedSentence.end - 0.05) {
                lastPausedIdRef.current = null;
              }
            }
          }
        }
      } catch (err) {
        // bỏ qua lỗi tạm thời khi player đang load
      }
    }, 30);

    return () => {
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
    };
  }, [isReady, sentences, activeSentence, isLooping, autoPause, onSegmentFinished, onSentenceChange]);

  // Hàm phát câu được chỉ định - Có khoảng đệm an toàn lead-in & lead-out
  const playSentence = useCallback((sentence, customBuffer) => {
    const target = sentence || activeSentence;
    if (!target) return;

    if (!playerRef.current || !isReady) {
      console.warn('[VideoPlayer] Player chưa sẵn sàng để tua.');
      return;
    }

    try {
      const buf = customBuffer !== undefined ? customBuffer : bufferRef.current;
      const leadIn = Math.max(0, Number(buf || 0));

      // Tua lùi một khoảng đệm an toàn ở đầu để tránh trễ âm YouTube và không nuốt âm đầu
      const seekTime = Math.max(0, parseFloat((target.start - leadIn).toFixed(2)));
      // Dừng chính xác tại mốc kết thúc câu target.end - Tuyệt đối không nới đuôi để tránh đọc lấn sang câu sau
      const stopTime = parseFloat(Number(target.end).toFixed(2));

      // Bật cờ kiểm soát seek để không bị ngắt nhầm bởi thời gian cũ
      isSeekingRef.current = true;
      seekTargetRef.current = seekTime;
      seekStartTimeRef.current = Date.now();

      // Khóa câu đang phát kèm các mốc đệm
      currentSegmentSentenceRef.current = {
        ...target,
        seekTime,
        stopTime,
      };
      lastPausedIdRef.current = null;

      playerRef.current.seekTo(seekTime, true);
      playerRef.current.playVideo();
      setIsPlayingSegment(true);
    } catch (e) {
      console.error('Lỗi điều khiển phát video:', e);
    }
  }, [activeSentence, isReady, setIsPlayingSegment]);

  // Xuất các phương thức điều khiển trực tiếp ra ref cho App.jsx
  useImperativeHandle(ref, () => ({
    playSentence: (target, customBuffer) => {
      playSentence(target, customBuffer);
    },
    setAudioBuffer: (val) => {
      setActiveBuffer(val);
      bufferRef.current = val;
    },
    seekTo: (time) => {
      if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
        playerRef.current.seekTo(time, true);
      }
    },
    pause: () => {
      currentSegmentSentenceRef.current = null;
      if (playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
        playerRef.current.pauseVideo();
      }
    },
    play: () => {
      if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
        playerRef.current.playVideo();
      }
    },
    setPlaybackRate: (rate) => {
      setPlaybackRate(rate);
      if (playerRef.current && typeof playerRef.current.setPlaybackRate === 'function') {
        playerRef.current.setPlaybackRate(rate);
      }
    },
    setLooping: (loop) => {
      setIsLooping(loop);
    },
  }), [playSentence]);

  // Điều chỉnh tốc độ phát
  const handleChangePlaybackRate = (rate) => {
    setPlaybackRate(rate);
    if (playerRef.current && typeof playerRef.current.setPlaybackRate === 'function') {
      playerRef.current.setPlaybackRate(rate);
    }
  };

  // Toggle Play / Pause thủ công
  const togglePlayPause = () => {
    if (!playerRef.current || !isReady) return;
    try {
      const state = playerRef.current.getPlayerState();
      if (state === 1) {
        currentSegmentSentenceRef.current = null;
        playerRef.current.pauseVideo();
        setIsPlayingSegment(false);
      } else {
        if (activeSentence) {
          playSentence(activeSentence);
        } else {
          playerRef.current.playVideo();
        }
      }
    } catch (e) {}
  };

  return (
    <div className="flex flex-col bg-slate-900/60 rounded-2xl border border-slate-800/80 overflow-hidden shadow-xl">
      {/* Video Container */}
      <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden group">
        <div id="youtube-player-container" className="w-full h-full" />

        {/* Lớp phủ phụ đề trực tiếp trên video (nếu bật chế độ hiển thị) */}
        {showSubtitlesOnVideo && activeSentence && (
          <div className="absolute bottom-4 inset-x-4 pointer-events-none flex flex-col items-center">
            <div className="bg-slate-950/85 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-emerald-500/30 text-center max-w-xl shadow-2xl transition-all">
              <p className="text-emerald-300 font-jp text-lg font-semibold tracking-wide">
                {activeSentence.text}
              </p>
              {activeSentence.vietnamese && (
                <p className="text-slate-300 text-xs mt-1">
                  {activeSentence.vietnamese}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Trạng thái Auto-Pause đang bật */}
        <div className="absolute top-3 right-3 flex items-center gap-2 pointer-events-none">
          {isPlayingSegment && (
            <span className="px-2.5 py-1 text-[11px] font-medium bg-emerald-500/90 text-slate-950 rounded-full flex items-center gap-1.5 shadow-lg shadow-emerald-500/30 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-slate-950"></span>
              Đang phát câu {activeSentence?.id}
            </span>
          )}
        </div>
      </div>

      {/* Thanh điều khiển nhanh dưới Video */}
      <div className="p-3 bg-slate-950/70 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2.5 text-xs text-slate-300">
        <div className="flex items-center gap-2">
          {/* Nút Nghe Lại Câu Này */}
          <button
            onClick={() => playSentence(activeSentence)}
            className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-emerald-500/20"
            title="Phát lại câu hiện tại (Phím tắt: Ctrl+Space)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Nghe lại câu này</span>
          </button>

          {/* Nút Lặp lại liên tục (Loop) */}
          <button
            onClick={() => setIsLooping(!isLooping)}
            className={`p-1.5 rounded-xl border transition cursor-pointer ${
              isLooping
                ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-800'
            }`}
            title={isLooping ? 'Đang bật lặp lại câu liên tục' : 'Bật lặp lại câu liên tục'}
          >
            <Repeat className="w-4 h-4" />
          </button>

          {/* Bật/Ẩn phụ đề trên màn hình video */}
          <button
            onClick={() => setShowSubtitlesOnVideo(!showSubtitlesOnVideo)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition cursor-pointer ${
              showSubtitlesOnVideo
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-800'
            }`}
            title="Bật/Tắt phụ đề xem trước trên video"
          >
            {showSubtitlesOnVideo ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{showSubtitlesOnVideo ? 'Hiện sub' : 'Ẩn sub'}</span>
          </button>
        </div>

        {/* Tùy chọn tốc độ phát âm (0.75x, 0.85x, 1x) */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800/80 p-1 rounded-xl">
          <Gauge className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-0.5" />
          {[0.75, 0.85, 1.0, 1.25].map((rate) => (
            <button
              key={rate}
              onClick={() => handleChangePlaybackRate(rate)}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition cursor-pointer ${
                playbackRate === rate
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {rate}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});
