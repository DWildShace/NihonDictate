// src/components/SentenceList.jsx
import React from 'react';
import { CheckCircle2, Play, Lock, ChevronRight } from 'lucide-react';

export function SentenceList({
  sentences,
  activeIndex,
  onSelectSentence,
  completedMap = {},
}) {
  return (
    <div className="space-y-2 mt-4">
      {sentences.map((sentence, idx) => {
        const isActive = idx === activeIndex;
        const isDone = !!completedMap[sentence.id];
        const progressInfo = completedMap[sentence.id];

        if (isActive) {
          // Câu đang làm hiện đã có card lớn ở trên, ở danh sách ta highlight vị trí
          return (
            <div
              key={sentence.id}
              className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border-2 border-emerald-500/40 text-emerald-300 font-medium text-xs shadow-md"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-bold flex items-center justify-center text-xs">
                  {sentence.id}
                </span>
                <span className="font-semibold text-slate-200">Đang luyện chép câu này...</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                Câu {sentence.id} / {sentences.length}
              </span>
            </div>
          );
        }

        if (isDone) {
          // Câu đã hoàn thành
          return (
            <div
              key={sentence.id}
              onClick={() => onSelectSentence(idx)}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 cursor-pointer transition group"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </span>
                <div className="text-left">
                  <p className="font-jp text-sm text-slate-200 group-hover:text-white transition">
                    {sentence.text}
                  </p>
                  {sentence.vietnamese && (
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                      {sentence.vietnamese}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500 font-medium">
                  {sentence.charCount || sentence.text.length} từ
                </span>
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400" />
              </div>
            </div>
          );
        }

        // Câu sắp tới bị khóa theo mô hình Khóa tiến độ (Hướng A)
        return (
          <div
            key={sentence.id}
            className="flex items-center justify-between p-3 rounded-xl bg-slate-900/30 border border-slate-800/40 opacity-50 cursor-not-allowed select-none group"
            title="Hãy hoàn thành câu hiện tại để mở khóa câu này"
          >
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-slate-900 text-slate-600 font-bold text-xs flex items-center justify-center border border-slate-800">
                <Lock className="w-3 h-3" />
              </span>

              {/* Dải placeholder pills mô phỏng độ dài câu như trong ảnh mẫu */}
              <div className="flex items-center gap-1.5 opacity-30">
                {Array.from({ length: Math.min(Math.ceil((sentence.charCount || 10) / 2), 10) }).map((_, pIdx) => (
                  <span
                    key={pIdx}
                    className="h-2 rounded-full bg-slate-600"
                    style={{ width: `${14 + (pIdx % 3) * 6}px` }}
                  />
                ))}
              </div>
            </div>

            <span className="text-[11px] text-slate-600 bg-slate-950/40 px-2 py-0.5 rounded border border-slate-900">
              {sentence.charCount || sentence.text.length} từ
            </span>
          </div>
        );
      })}
    </div>
  );
}
