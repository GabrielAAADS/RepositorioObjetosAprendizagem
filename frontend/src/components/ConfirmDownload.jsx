import { useEffect, useRef } from 'react';

export default function ConfirmDownload({
  open,
  fileName,
  onConfirm,
  onCancel,
}) {
  const cancelBtnRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    setTimeout(() => cancelBtnRef.current?.focus(), 0);

    const onKey = (e) => {
      if (e.key === 'Escape') onCancel?.();
      if (e.key === 'Enter') onConfirm?.();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onCancel, onConfirm]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-download-title"
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,.40)',
        display: 'grid', placeItems: 'center', zIndex: 1000
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(520px, 92vw)',
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 10px 30px rgba(0,0,0,.15)',
          border: '1px solid var(--stroke)',
          padding: 20
        }}
      >
        <h3 id="confirm-download-title" style={{ margin: '0 0 8px 0', color: '#111827' }}>
          Confirmar download
        </h3>
        <p style={{ margin: '0 0 16px 0', color: '#374151' }}>
          Tem certeza de que deseja baixar o arquivo
          {' '}<strong>{fileName || 'este objeto'}</strong>?
        </p>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            ref={cancelBtnRef}
            onClick={onCancel}
            style={{
              background: '#fff',
              color: '#111827',
              border: '1px solid var(--stroke)',
              borderRadius: 10,
              padding: '10px 14px',
            }}
          >
            Não
          </button>
          <button
            onClick={onConfirm}
            style={{
              background: 'var(--primary)',
              color: 'var(--white)',
              border: '1px solid transparent',
              borderRadius: 10,
              padding: '10px 14px',
              fontWeight: 600
            }}
          >
            Sim, baixar
          </button>
        </div>
      </div>
    </div>
  );
}