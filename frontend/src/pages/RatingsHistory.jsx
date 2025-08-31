import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as ratings from '../services/ratings';
import StarRating from '../components/StarRating';
import styles from '../components/Home.module.css';

export default function RatingsHistory() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [list, setList] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await ratings.history({ objectId: id });
        setList(data);
      } catch (e) {
        if (e?.response?.status === 401) {
          setErr('Você precisa entrar para ver seu histórico.');
        } else {
          setErr('Falha ao carregar histórico.');
        }
        setList([]);
      }
    })();
  }, [id]);

  if (list === null) return <div className={styles.loading}>Carregando…</div>;

  return (
    <div className={styles.content} style={{ padding: '2rem 0' }}>
      <h1>Histórico de avaliações</h1>
      {err && <p className={styles.error}>{err}</p>}
      {!err && list.length === 0 && (
        <p className="text-sm" style={{ color: '#64748b' }}>Sem histórico para este objeto.</p>
      )}
      {list.map((r) => (
        <div key={r.id} style={{ borderTop: '1px solid var(--stroke)', padding: '12px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <StarRating value={r.stars} readOnly size={16} />
            <span style={{ color: '#64748b', fontSize: 12 }}>
              {r.version ? `v${r.version} • ` : ''}{new Date(r.created_at).toLocaleString()}
            </span>
          </div>
          {r.comment && <p style={{ margin: '8px 0', color: '#334155' }}>{r.comment}</p>}
        </div>
      ))}
    </div>
  );
}
