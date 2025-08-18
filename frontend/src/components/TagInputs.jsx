import React, { useState } from 'react';

export default function TagInput({
  label,
  tags,
  onAdd,
  onRemove,
  placeholder = 'Digite e clique em +',
}) {
  const [text, setText] = useState('');

  const add = () => {
    const t = text.trim();
    if (!t) return;
    if (!tags.includes(t)) onAdd(t);
    setText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      add();
    }
  };

  return (
    <div>
      {label && <label className="block">{label}</label>}
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="border p-2 rounded flex-1"
        />
        <button type="button" onClick={add} className="px-3 py-2 rounded bg-gray-200">
          +
        </button>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        {tags.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-2 bg-gray-100 px-2 py-1 rounded text-sm"
          >
            {t}
            <button
              type="button"
              onClick={() => onRemove(t)}
              className="text-red-500 font-bold"
              title="remover"
            >
              ×
            </button>
          </span>
        ))}
        {tags.length === 0 && <span className="text-xs text-gray-400">Nenhuma palavra-chave</span>}
      </div>
    </div>
  );
}
