// frontend/src/components/ObjectCard.jsx
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import StarRating from './StarRating';
import styles from './Home.module.css';

export default function ObjectCard({ obj }) {
  const navigate = useNavigate();

  const {
    id,
    title = 'Sem título',
    category = 'JOGO',
    created_at,
    metadata = {},
    ratingAvg = 0,
    ratingCount = 0,
  } = obj || {};

  const desc = useMemo(() => {
    const d = metadata?.general?.description || metadata?.educational?.description || '';
    return Array.isArray(d) ? d[0] : d;
  }, [metadata]);

  const thumb = useMemo(() => {
    return (
      metadata?.general?.thumbnail ||
      metadata?.technical?.location?.[0] ||
      '/placeholder.jpg'
    );
  }, [metadata]);

  return (
    <div className={styles.objectCard} onClick={() => navigate(`/objects/${id}`)} style={{ cursor: 'pointer' }}>
      <div className={styles.cardImage}>
        <div className={styles.cardImageContent}>
          <img src={thumb} alt="" loading="lazy" />
        </div>
      </div>
      <div className={styles.cardContent}>
        <div className={styles.cardBadge}>{(category || 'JOGO').toUpperCase()}</div>
        <h4 title={title}>{title}</h4>
        <p>{desc || 'Sem descrição.'}</p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 10px 0' }}>
          <StarRating value={Number(ratingAvg) || 0} readOnly size={16} />
          <span style={{ color: '#64748b', fontSize: 12 }}>
            {Number(ratingAvg || 0).toFixed(1)} ({ratingCount || 0})
          </span>
        </div>

        <button className={styles.detailsBtn} onClick={(e) => { e.stopPropagation(); navigate(`/objects/${id}`); }}>
          Ver Detalhes <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
