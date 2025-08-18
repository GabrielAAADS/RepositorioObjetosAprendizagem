import React from 'react';

export default function TagCloud({ title, items = [], onPick }) {
  return (
    <section>
      <h2 className="text-2xl font-semibold mb-3">{title}</h2>
      <div className="flex flex-wrap gap-3">
        {items.map(it => (
          <button
            key={`${it.value}-${it.count}`}
            onClick={() => onPick?.(it)}
            className="rounded-full border px-4 py-2 bg-white hover:bg-gray-50 shadow-sm"
            title={`${it.count} resultados`}
          >
            {it.value} <span className="text-gray-400 ml-1">{it.count}</span>
          </button>
        ))}
        {items.length === 0 && <p className="text-sm text-gray-400">Sem dados ainda.</p>}
      </div>
    </section>
  );
}
