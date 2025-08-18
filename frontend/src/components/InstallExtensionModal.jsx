import React, { useMemo, useState } from 'react';
import { getBrowser } from '../utils/userAgent';

export default function InstallExtensionModal({ open, onClose, payload, error, publicUrl }) {
  const [showPayload, setShowPayload] = useState(false);
  const browser = getBrowser();
  const links = useMemo(() => ({
    chrome:  import.meta.env.VITE_EXT_CHROME_URL  || '',
    edge:    import.meta.env.VITE_EXT_EDGE_URL    || '',
    firefox: import.meta.env.VITE_EXT_FIREFOX_URL || '',
  }), []);
  if (!open) return null;

  const storeUrl =
    browser === 'chrome'  ? links.chrome  :
    browser === 'edge'    ? links.edge    :
    browser === 'firefox' ? links.firefox : '';

  const errorText = typeof error === 'string'
    ? error
    : (error?.error || error?.message || JSON.stringify(error));

  const officeViewerUrl = publicUrl
    ? `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(publicUrl)}`
    : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-lg w-[95%] max-w-2xl p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Preview not available</h3>
          <button className="text-xl font-bold" onClick={onClose}>×</button>
        </div>

        <ol className="list-decimal ml-6 space-y-2 mb-4 text-sm text-gray-700">
          <li>
            <b>Install a browser extension</b> to view Office files.
            {storeUrl ? (
              <a href={storeUrl} target="_blank" rel="noreferrer" className="ml-2 text-blue-600 underline">Open the store</a>
            ) : (
              <span className="ml-2 text-gray-500">(store link not configured)</span>
            )}
          </li>
          <li><b>Download</b> the file and open locally.</li>
          <li>
            {officeViewerUrl ? (
              <>
                <b>Open in Office Web Viewer</b>
                <a href={officeViewerUrl} target="_blank" rel="noreferrer" className="ml-2 text-blue-600 underline">Open viewer</a>
              </>
            ) : (
              <span className="text-gray-500">Provide a public URL to enable Office Web Viewer.</span>
            )}
          </li>
        </ol>

        <button className="px-3 py-2 bg-gray-100 rounded mb-3" onClick={() => setShowPayload(s => !s)}>
          {showPayload ? 'Hide payload' : 'Show payload'}
        </button>

        {showPayload && (
          <div className="bg-gray-50 border rounded p-3 text-xs overflow-auto max-h-60">
            <pre className="whitespace-pre-wrap">
{`Request:
${JSON.stringify(payload, null, 2)}

Error:
${errorText}`}
            </pre>
          </div>
        )}

        <div className="mt-3 text-sm text-gray-600 inline-flex items-center gap-2">
          <input type="checkbox" onChange={(e) => {
            if (e.target.checked) localStorage.setItem('rova_dont_ask_preview_ext', '1');
            else localStorage.removeItem('rova_dont_ask_preview_ext');
          }} />
          Don’t show this again on this device
        </div>
      </div>
    </div>
  );
}
