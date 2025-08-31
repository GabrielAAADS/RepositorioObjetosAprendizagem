import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import StarRating from './StarRating';
import styles from './Home.module.css';

export default function ObjectCard(props) {
  const o = props.object ?? props.obj ?? {};
  const navigate = useNavigate();

  const {
    id,
    category = 'JOGO',
    ratingAvg = 0,
    ratingCount = 0,
    metadata = {},
  } = o;

  const title = useMemo(() => {
    const t = String(o?.title || metadata?.general?.title || '').trim();
    return t.length ? t : 'Sem título';
  }, [o?.title, metadata?.general?.title]);

  const desc = useMemo(() => {
    const raw =
      metadata?.general?.description ??
      metadata?.educational?.description ??
      '';
    const d = Array.isArray(raw) ? raw[0] : raw;
    const txt = String(d || '').trim();
    return txt.length ? txt : 'Sem descrição.';
  }, [metadata]);

  const thumb = useMemo(() => {
    const genThumb = metadata?.general?.thumbnail;
    const loc = metadata?.technical?.location;
    const locStr = Array.isArray(loc) ? loc?.[0] : loc;
    return genThumb || locStr || '/placeholder.jpg';
  }, [metadata]);

  const avg = Number(ratingAvg) || 0;
  const count = Number(ratingCount) || 0;

  const go = () => navigate(`/objects/${id}`);
  const goLink = (e) => { e.stopPropagation(); go(); };

  return (
    <div className={styles.objectCard} onClick={go} style={{ cursor: 'pointer' }}>
      <div className={styles.cardImage}>
        <div className={styles.cardImageContent}>
          <img src={thumb} alt="" loading="lazy" />
        </div>
      </div>

      <div className={styles.cardContent}>
        <div className={styles.cardBadge}>{String(category || 'JOGO').toUpperCase()}</div>

        <h4 title={title}>{title}</h4>
        <p>{desc}</p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 10px 0' }}>
          <StarRating value={avg} readOnly size={16} />
          <span style={{ color: '#64748b', fontSize: 12 }}>
            {avg.toFixed(1)} ({count})
          </span>
        </div>

        <button className={styles.detailsBtn} onClick={goLink}>
          Ver Detalhes <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
