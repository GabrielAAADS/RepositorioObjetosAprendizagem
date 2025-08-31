import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../services/api';

export default function FeedbackModal({ open, onClose }) {
  const [rating, setRating] = useState(4);
  const [category, setCategory] = useState('geral');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState('');

  if (!open) return null;

  const submit = async () => {
    setErr('');
    if (!message.trim()) {
      setErr('Escreva uma mensagem.');
      return;
    }
    try {
      setSending(true);
      await api.post('/feedback', {
        rating,
        category,
        message,
        email,
        page: window.location.pathname + window.location.search,
        extras: {
          userAgent: navigator.userAgent,
          viewport: { w: window.innerWidth, h: window.innerHeight },
          referrer: document.referrer || null,
        },
      });

      setOk(true);
      setTimeout(() => { setOk(false); onClose?.(); }, 1200);
    } catch (e) {
      setErr(e?.response?.data?.error || 'Falha ao enviar feedback.');
    } finally {
      setSending(false);
    }
  };

  const emojiBtnStyle = (active) => ({
    width: 44,
    height: 44,
    borderRadius: 9999,
    border: '1px solid #e5e7eb',
    background: active ? '#fef3c7' : '#fff',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    lineHeight: 1,
    fontSize: 20,
  });

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      onKeyDown={(e) => { if (e.key === 'Escape') onClose?.(); }}
      tabIndex={-1}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.4)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 2147483640,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 520,
          background: '#fff',
          borderRadius: 12,
          padding: 20,
          boxShadow: '0 12px 28px rgba(0,0,0,.18)',
        }}
      >
        <h3 style={{ margin: '4px 0 12px', fontSize: 20, fontWeight: 600 }}>
          Envie seu feedback
        </h3>

        <label style={{ display: 'block', fontSize: 14, marginBottom: 6 }}>
          Como foi sua experiência?
        </label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {[1,2,3,4,5].map(n => (
            <button
              key={n}
              type="button"
              aria-pressed={rating === n}
              onClick={() => setRating(n)}
              title={`${n} de 5`}
              style={emojiBtnStyle(rating === n)}
            >
              {['😡','😕','😐','🙂','🤩'][n-1]}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          <div>
            <label style={{ display:'block', fontSize: 14, marginBottom: 6 }}>Categoria</label>
            <select
              value={category}
              onChange={e=>setCategory(e.target.value)}
              style={{ width:'100%', padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:8 }}
            >
              <option value="geral">Geral</option>
              <option value="bug">Bug</option>
              <option value="sugestao">Sugestão</option>
              <option value="ui">UI/UX</option>
              <option value="conteudo">Conteúdo</option>
            </select>
          </div>

          <div>
            <label style={{ display:'block', fontSize: 14, marginBottom: 6 }}>Mensagem</label>
            <textarea
              value={message}
              onChange={e=>setMessage(e.target.value)}
              rows={4}
              placeholder="Conte sua experiência, dúvidas ou solicitações…"
              style={{ width:'100%', padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:8, resize:'vertical' }}
            />
          </div>

          <div>
            <label style={{ display:'block', fontSize: 14, marginBottom: 6 }}>Seu e-mail (opcional)</label>
            <input
              value={email}
              onChange={e=>setEmail(e.target.value)}
              inputMode="email"
              placeholder="voce@exemplo.com"
              style={{ width:'100%', padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:8 }}
            />
          </div>
        </div>

        {err && <div style={{ marginTop: 10, color: '#dc2626', fontSize: 14 }}>{err}</div>}
        {ok  && <div style={{ marginTop: 10, color: '#16a34a', fontSize: 14 }}>Feedback enviado! Obrigado 🙏</div>}

        <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop: 16 }}>
          <button
            onClick={onClose}
            style={{ padding:'8px 12px', border:'1px solid #e5e7eb', borderRadius:8, background:'#fff', cursor:'pointer' }}
          >
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={sending}
            style={{
              padding:'8px 12px', border:0, borderRadius:8,
              background: '#4f46e5', color:'#fff', cursor:'pointer',
              opacity: sending ? .6 : 1
            }}
          >
            {sending ? 'Enviando…' : 'Enviar'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
