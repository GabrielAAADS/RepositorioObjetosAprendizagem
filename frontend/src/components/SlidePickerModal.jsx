import React, { useState } from 'react';

export default function SlidePickerModal({ slides = [], current = 0, onSelect, onClose }) {
    
  const [idx, setIdx] = useState(Math.max(0, current));

  if (!slides.length) return null;

  const prev = () => setIdx(i => Math.max(0, i - 1));
  const next = () => setIdx(i => Math.min(slides.length - 1, i + 1));

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-lg w-[95%] max-w-5xl p-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Choose thumbnail slide</h3>
          <button onClick={onClose} className="text-xl font-bold">×</button>
        </div>
        <div className="flex gap-4">
          <div className="flex-1 flex flex-col items-center">
            <div className="w-full aspect-video bg-gray-100 rounded overflow-hidden flex items-center justify-center">
              <img src={slides[idx]} alt={`slide-${idx+1}`} className="max-w-full max-h-full" />
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={prev} className="px-3 py-1 bg-gray-200 rounded">← Prev</button>
              <button onClick={next} className="px-3 py-1 bg-gray-200 rounded">Next →</button>
              <button onClick={() => onSelect(idx)} className="px-4 py-1 bg-blue-600 text-white rounded">Use this slide</button>
            </div>
          </div>
          <div className="w-48 max-h-[60vh] overflow-auto space-y-2">
            {slides.map((s, i) => (
              <button
                key={s}
                onClick={() => setIdx(i)}
                className={`block w-full border rounded overflow-hidden ${i===idx ? 'ring-2 ring-blue-500' : ''}`}
                title={`Slide ${i+1}`}
              >
                <img src={s} alt={`thumb-${i+1}`} className="w-full" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
