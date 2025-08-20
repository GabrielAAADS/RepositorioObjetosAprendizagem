import React from 'react';

export default function InfoLabel({ label, info, htmlFor }) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={htmlFor} className="block font-medium">
        {label}
      </label>
      <span
        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-200 text-gray-700 text-xs cursor-help"
        title={info}
        aria-label={info}
      >
        i
      </span>
    </div>
  );
}
