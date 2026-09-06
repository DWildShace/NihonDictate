// src/components/SubtitlesTab.jsx
import React, { useState } from 'react';
import { Play, Search, Copy, Check } from 'lucide-react';

export function SubtitlesTab({ sentences, activeIndex, onSelectSentence, onPlaySentence }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const filtered = sentences.filter((s) => {
    const term = searchTerm.toLowerCase();
    return (
      s.text.toLowerCase().includes(term) ||
      (s.vietnamese && s.vietnamese.toLowerCase().includes(term))
    );
  });

  const handleCopy = (sentence) => {
    navigator.clipboard.writeText(`${sentence.text}\n${sentence.vietnamese || ''}`);
    setCopiedId(sentence.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-3">
      {/* Ô tìm kiếm câu */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm từ khóa tiếng Nhật hoặc tiếng Việt..."
          className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Danh sách toàn bộ kịch bản song ngữ */}
      <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
        {filtered.map((s, idx) => {
          const isCurrent = s.id === (sentences[activeIndex]?.id);
          return (
            <div
              key={s.id}
              className={`p-3 rounded-xl border transition-all ${
                isCurrent
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800/80 text-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                    {Math.floor(s.start / 60)}:{(Math.floor(s.start % 60)).toString().padStart(2, '0')}
                  </span>
                  <span className="text-xs font-bold text-slate-400">Câu {s.id}</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleCopy(s)}
                    className="p-1 text-slate-500 hover:text-slate-300 transition"
                    title="Sao chép câu"
                  >
                    {copiedId === s.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => {
                      const actualIdx = sentences.findIndex(item => item.id === s.id);
                      onSelectSentence(actualIdx);
                      onPlaySentence(s);
                    }}
                    className="p-1 text-slate-400 hover:text-emerald-400 transition cursor-pointer"
                    title="Phát câu này"
                  >
                    <Play className="w-4 h-4 fill-current" />
                  </button>
                </div>
              </div>

              {/* Văn bản tiếng Nhật */}
              <p className="font-jp text-base font-medium mt-1.5 text-slate-100">
                {s.furigana || s.text}
              </p>

              {/* Bản dịch tiếng Việt */}
              {s.vietnamese && (
                <p className="text-xs text-slate-400 mt-1">
                  🇻🇳 {s.vietnamese}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
