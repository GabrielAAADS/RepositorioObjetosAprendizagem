import React from 'react';
import { X } from 'lucide-react';

export default function PreviewModal({ object, onClose }) {
  if (!object) return null;

  const fileUrl = `${window.location.origin}${object.file_path}`;
  const embedUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded shadow-lg w-[90%] max-w-4xl h-[90%]"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-600 hover:text-gray-900"
        >
          <X size={24} />
        </button>

        <h2 className="text-xl font-semibold p-4 border-b">
          Preview: {object.title}
        </h2>

        <div className="h-[calc(100%-8rem)] p-4">
          <iframe
            src={embedUrl}
            title={object.title}
            className="w-full h-full border"
          />
        </div>

        <div className="p-4 border-t text-right">
          <a
            href={object.file_path}
            download
            className="inline-block bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
          >
            Download
          </a>
        </div>
      </div>
    </div>
  );
}
