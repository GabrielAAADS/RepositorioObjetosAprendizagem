import React, { useState } from 'react';
import api from '../services/api';

export default function FeedbackModal({ open, onClose }) {
  const [rating, setRating] = useState(4);
  const [category, setCategory] = useState('geral');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [ok, setOk] = useState(false);

  if (!open) return null;

  const submit = async () => {
    try {
      setSending(true);
      await api.post('/feedback', {
        rating,
        category,
        message,
        email,
        page: window.location.pathname,
        extras: {
          userAgent: navigator.userAgent,
          viewport: { w: window.innerWidth, h: window.innerHeight }
        }
      });
      setOk(true);
      setTimeout(() => { setOk(false); onClose?.(); }, 1200);
    } catch {
      alert('Falha ao enviar feedback');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-5">
        <h3 className="text-xl font-semibold mb-3">Envie seu feedback</h3>

        <label className="block text-sm mb-1">Como foi sua experiência?</label>
        <div className="flex gap-2 mb-3">
          {[1,2,3,4,5].map(n => (
            <button
              key={n}
              onClick={() => setRating(n)}
              className={`w-10 h-10 rounded-full border ${rating===n?'bg-yellow-200':'bg-white'}`}
              title={`${n} de 5`}
            >{['😡','😕','😐','🙂','🤩'][n-1]}</button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="block text-sm mb-1">Categoria</label>
            <select value={category} onChange={e=>setCategory(e.target.value)} className="border rounded w-full p-2">
              <option value="geral">Geral</option>
              <option value="bug">Bug</option>
              <option value="sugestao">Sugestão</option>
              <option value="ui">UI/UX</option>
              <option value="conteudo">Conteúdo</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Mensagem</label>
            <textarea value={message} onChange={e=>setMessage(e.target.value)} rows={4} className="border rounded w-full p-2" />
          </div>
          <div>
            <label className="block text-sm mb-1">Seu e-mail (opcional)</label>
            <input value={email} onChange={e=>setEmail(e.target.value)} className="border rounded w-full p-2" />
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 rounded border">Cancelar</button>
          <button onClick={submit} disabled={sending} className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-50">
            {sending ? 'Enviando…' : 'Enviar'}
          </button>
        </div>

        {ok && <div className="mt-3 text-green-600 text-sm">Feedback enviado! Obrigado 🙏</div>}
      </div>
    </div>
  );
}
