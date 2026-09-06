// src/components/ShadowingTab.jsx
import React, { useState, useRef } from 'react';
import { Mic, Square, Play, RotateCcw, Volume2, CheckCircle } from 'lucide-react';

export function ShadowingTab({ sentence, onPlayNativeAudio }) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      alert('Không thể truy cập Microphone trên trình duyệt của bạn.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <h3 className="font-semibold text-sm text-slate-200">
          Luyện phát âm theo ngữ điệu (Shadowing)
        </h3>
        <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
          Câu {sentence?.id}
        </span>
      </div>

      {/* Câu mẫu */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-center space-y-2">
        <p className="text-xs text-slate-400">Câu cần luyện đọc:</p>
        <p className="font-jp text-xl font-bold text-emerald-300">
          {sentence?.furigana || sentence?.text}
        </p>
        {sentence?.vietnamese && (
          <p className="text-xs text-slate-300">🇻🇳 {sentence.vietnamese}</p>
        )}
      </div>

      {/* Bộ nút điều khiển: Nghe bản xứ & Thu âm */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        {/* Nghe người bản xứ */}
        <button
          onClick={() => onPlayNativeAudio(sentence)}
          className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 flex items-center justify-center gap-2 font-medium text-xs transition cursor-pointer border border-slate-700"
        >
          <Volume2 className="w-4 h-4 text-emerald-400" />
          <span>Nghe giọng bản xứ</span>
        </button>

        {/* Nút Bắt đầu / Dừng thu âm */}
        {!isRecording ? (
          <button
            onClick={startRecording}
            className="p-3 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white flex items-center justify-center gap-2 font-medium text-xs transition cursor-pointer shadow-lg shadow-rose-600/20"
          >
            <Mic className="w-4 h-4" />
            <span>Bấm để thu âm giọng đọc</span>
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="p-3 rounded-xl bg-slate-950 text-rose-400 border border-rose-500/50 flex items-center justify-center gap-2 font-medium text-xs transition cursor-pointer animate-pulse"
          >
            <Square className="w-4 h-4 fill-current" />
            <span>Đang thu... Bấm để dừng</span>
          </button>
        )}
      </div>

      {/* Nghe lại giọng người dùng đã ghi âm */}
      {audioUrl && (
        <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
          <span className="text-xs text-slate-300 font-medium">Bản ghi âm của bạn:</span>
          <audio controls src={audioUrl} className="h-8 max-w-[200px]" />
        </div>
      )}
    </div>
  );
}
