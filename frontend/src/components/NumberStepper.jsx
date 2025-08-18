import React from 'react';

export default function NumberStepper({ value, min = 1, onChange }) {
  const toNum = (v) => Number.isNaN(Number(v)) ? min : Number(v);
  return (
    <div className="inline-flex items-stretch border rounded overflow-hidden">
      <button type="button" className="px-2 select-none" onClick={() => onChange(Math.max(min, toNum(value) - 1))}>−</button>
      <input
        type="number"
        min={min}
        value={value}
        onChange={(e) => onChange(toNum(e.target.value))}
        className="w-16 text-center outline-none"
      />
      <button type="button" className="px-2 select-none" onClick={() => onChange(toNum(value) + 1)}>+</button>
    </div>
  );
}
