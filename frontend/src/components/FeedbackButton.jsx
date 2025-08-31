import { useState } from 'react';
import { createPortal } from 'react-dom';
import FeedbackModal from './FeedbackModal';

export default function FeedbackButton() {
  const [open, setOpen] = useState(false);

  return createPortal(
    <>
      <button
        type="button"
        aria-label="Enviar feedback"
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed',
          top: '50%',
          right: 0,
          transform: 'translateY(-50%)',
          writingMode: 'vertical-rl',
          textOrientation: 'mixed',
          background: '#b91c1c',
          color: '#fff',
          border: 0,
          padding: '10px 12px',
          borderTopLeftRadius: 8,
          borderBottomLeftRadius: 8,
          boxShadow: '0 6px 16px rgba(0,0,0,.15)',
          cursor: 'pointer',
          zIndex: 2147483000,
          letterSpacing: .5,
        }}
        title="Enviar feedback"
      >
        Feedback
      </button>

      <FeedbackModal open={open} onClose={() => setOpen(false)} />
    </>,
    document.body
  );
}
