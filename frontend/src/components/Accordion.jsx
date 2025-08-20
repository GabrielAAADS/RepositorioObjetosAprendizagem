import React, { useState } from 'react';

export default function Accordion({ title, children, defaultOpen=false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border rounded-lg mb-3">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex justify-between items-center px-4 py-2 font-medium"
      >
        <span>{title}</span>
        <span className="text-xl">{open ? '–' : '+'}</span>
      </button>
      {open && <div className="border-t p-4">{children}</div>}
    </div>
  );
}
