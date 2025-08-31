import { useState } from 'react';

export default function FeedbackFab() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed',
          top: '50%',
          right: 0,
          transform: 'translateY(-50%)',
          background: '#b91c1c',
          color: 'white',
          border: 0,
          borderTopLeftRadius: 6,
          borderBottomLeftRadius: 6,
          padding: '10px 12px',
          writingMode: 'vertical-rl',
          textOrientation: 'mixed',
          cursor: 'pointer',
          zIndex: 1000,
          letterSpacing: .5,
        }}
      >
        Feedback
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)',
            display: 'grid', placeItems: 'center', zIndex: 1001
          }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', padding: 16, borderRadius: 12, width: 420, maxWidth: '90%' }}>
            <h3 style={{ marginTop: 0 }}>Envie seu feedback</h3>
            <textarea
              rows={6}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="border p-2 rounded w-full"
              style={{ borderColor: 'var(--stroke)' }}
              placeholder="Conte sua experiência, dúvidas ou solicitações…"
            />
            <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setOpen(false)}>Cancelar</button>
              <a
                href={`mailto:gabriel.silva.3@academico.ifpb.edu.br?subject=Feedback%20ROVA&body=${encodeURIComponent(text)}`}
                onClick={() => setOpen(false)}
                className="bg-blue-600 text-white px-3 py-2 rounded"
                style={{ background: 'var(--primary)', color: '#fff', borderRadius: 8, textDecoration: 'none' }}
              >
                Enviar
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
