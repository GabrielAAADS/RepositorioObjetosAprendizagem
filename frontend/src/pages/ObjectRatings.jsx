import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import * as ratings from '../services/ratings';
import StarRating from '../components/StarRating';
import home from '../components/Home.module.css';
import css from './ObjectDetails.module.css';
import { createPortal } from 'react-dom';

function ConfirmModal({ text, onCancel, onConfirm }) {
  return createPortal(
    <div
      className={css.modalOverlay}
      role="dialog"
      aria-modal="true"
      onKeyDown={(e) => { if (e.key === 'Escape') onCancel(); }}
      tabIndex={-1}
    >
      <div className={css.modalCard}>
        <p className={css.modalText}>{text}</p>
        <div className={css.modalActions}>
          <button className={home.cta} onClick={onConfirm}>Atualizar</button>
          <button
            className={home.cta}
            onClick={onCancel}
            style={{ background:'#fff', color:'var(--primary)', border:'1px solid var(--primary)' }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function ObjectRatings() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [obj, setObj] = useState(null);
  const [loading, setLoading] = useState(true);

  const [rat, setRat] = useState({ list: [], avg: 0, count: 0 });
  const [myStars, setMyStars] = useState(0);
  const [myComment, setMyComment] = useState('');
  const [myVersion, setMyVersion] = useState('');
  const [confirmUpdate, setConfirmUpdate] = useState(false);

  const [myList, setMyList] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const COMM_LIMIT = 20;
  const [commItems, setCommItems] = useState([]);
  const [commTotal, setCommTotal] = useState(0);
  const [commOffset, setCommOffset] = useState(0);
  const [commLoading, setCommLoading] = useState(false);
  const sentinelRef = useRef(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await api.get(`/objetos/${id}`);
        if (alive) setObj(data?.object || null);
        const rs = await ratings.fetchCurrent({ objectId: id });
        if (alive) setRat(rs);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const hist = await ratings.history({ objectId: id });
        if (!cancel) setMyList(hist);
      } catch {
        if (!cancel) setMyList([]);
      }
    })();
    return () => { cancel = true; };
  }, [id]);

  const resetCommunity = async () => {
    setCommItems([]); setCommTotal(0); setCommOffset(0);
    await loadMoreCommunity(true);
  };

  const loadMoreCommunity = async (initial = false) => {
    if (commLoading) return;
    setCommLoading(true);
    try {
      const { list, total } = await ratings.community({
        objectId: id,
        limit: COMM_LIMIT,
        offset: initial ? 0 : commOffset,
      });
      setCommTotal(total || 0);
      setCommItems((prev) => initial ? (list || []) : [...prev, ...(list || [])]);
      setCommOffset((prev) => prev + (list?.length || 0));
    } finally {
      setCommLoading(false);
    }
  };

  useEffect(() => { resetCommunity(); }, [id]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const hasMore = commItems.length < commTotal;
    if (!hasMore) return;

    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) loadMoreCommunity(false);
    }, { rootMargin: '200px' });

    obs.observe(el);
    return () => obs.disconnect();
  }, [sentinelRef, commItems.length, commTotal, commLoading]);

  const hist = useMemo(
    () => [...myList].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    [myList]
  );
  const myCurrent = rat?.me || (myList?.[0] || null);

  async function doSubmit() {
    await ratings.upsert({
      objectId: id,
      stars: myStars,
      comment: myComment,
      version: myVersion || undefined,
    });
    const rs = await ratings.fetchCurrent({ objectId: id });
    setRat(rs);
    try {
      const h = await ratings.history({ objectId: id });
      setMyList(h);
    } catch {}
    setMyStars(0); setMyComment(''); setMyVersion('');
  }

  if (loading) return <div className={home.loading}>Carregando…</div>;

  return (
    <div className={css.container}>
      <div className={css.card} style={{ paddingBottom: 16 }}>
        <div className={css.cardTopBar} />
        <div className={css.cardHeader}>
          <span className={`${home.cardBadge} ${css.badge}`}>{(obj?.category || 'JOGO').toUpperCase()}</span>
          <h1 className={css.title}>Avaliações — {obj?.title || `Objeto #${id}`}</h1>
        </div>
      </div>

      <section className={css.reviews} style={{ marginTop: 0 }}>
        <div className={css.reviewsGrid}>
          <div className={css.panel}>
            <h3 className={css.h3}>Sua avaliação</h3>

            {myCurrent ? (
              <div className={css.myCurrent}>
                <StarRating value={myCurrent.stars} readOnly size={16} />
                <span className={css.reviewMeta}>
                  {myCurrent.version ? `v${myCurrent.version} • ` : ''}
                  {new Date(myCurrent.created_at).toLocaleString()}
                </span>
                {myCurrent.comment && <p className={css.reviewText}>{myCurrent.comment}</p>}
              </div>
            ) : (
              <p className={css.muted}>Você ainda não avaliou este objeto.</p>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!myStars) { alert('Dê uma nota de 1 a 5.'); return; }
                if (myCurrent) { setConfirmUpdate(true); return; }
                doSubmit();
              }}
              className={css.rateForm}
            >
              <label className={css.rateRow}>
                Sua nota: <StarRating value={myStars} onChange={setMyStars} />
              </label>
              <input
                placeholder="Versão (opcional)"
                value={myVersion}
                onChange={(e) => setMyVersion(e.target.value)}
                className={css.input}
              />
              <textarea
                placeholder="Escreva um comentário (opcional)"
                value={myComment}
                onChange={(e) => setMyComment(e.target.value)}
                className={`${css.input} ${css.textarea}`}
                rows={4}
              />
              <button className={home.cta} type="submit" disabled={confirmUpdate}>
                Enviar avaliação
              </button>
            </form>

            <div style={{ display:'flex', alignItems:'center', gap:12, marginTop:12 }}>
              <button
                className={css.linkPrimary}
                style={{ background:'none', border:0, padding:0, cursor:'pointer' }}
                onClick={() => setShowHistory((s) => !s)}
              >
                {showHistory ? 'Ocultar histórico' : 'Mostrar histórico'}
              </button>

              <button
                className={home.cta}
                onClick={() => navigate(-1)}
                style={{ padding: '8px 14px' }}
                title="Voltar"
              >
                Voltar
              </button>
            </div>

            {showHistory && (
              <>
                <h3 className={css.h3} style={{ marginTop: 8 }}>Seu histórico</h3>
                {hist.length === 0 ? (
                  <p className={css.muted}>Você ainda não avaliou este objeto.</p>
                ) : (
                  <div className={css.stair}>
                    {hist.map((r, i) => (
                      <div key={r.id} className={css.stairItem} style={{ marginLeft: i * 12 }}>
                        <div className={css.reviewHead}>
                          <StarRating value={r.stars} readOnly size={16} />
                          <span className={css.reviewMeta}>
                            {r.version ? `v${r.version} • ` : ''}{new Date(r.created_at).toLocaleString()}
                          </span>
                        </div>
                        {r.comment && <p className={css.reviewText}>{r.comment}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div className={css.panel}>
            <h3 className={css.h3}>Avaliações da comunidade</h3>
            <div className={css.communityList}>
              {commItems.length === 0 && !commLoading ? (
                <p className={css.muted}>Ainda não há avaliações.</p>
              ) : (
                <>
                  {commItems.map((r) => (
                    <div key={r.id} className={css.reviewItem}>
                      <div className={css.reviewHead}>
                        <StarRating value={r.stars} readOnly size={16} />
                        <span className={css.reviewMeta}>
                          {r.version ? `v${r.version} • ` : ''}
                          {new Date(r.created_at).toLocaleString()}
                        </span>
                      </div>
                      {r.comment && <p className={css.reviewText}>{r.comment}</p>}
                    </div>
                  ))}

                  {commLoading && <p className={css.muted}>Carregando…</p>}
                  <div ref={sentinelRef} />

                  {commItems.length < commTotal && !commLoading && (
                    <div style={{ display:'flex', justifyContent:'center', marginTop:12 }}>
                      <button className={home.cta} onClick={() => loadMoreCommunity(false)}>
                        Carregar mais
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {confirmUpdate && (
          <ConfirmModal
            text="Você já avaliou este objeto. Quer atualizar sua avaliação? A nota e a descrição substituirão a atual."
            onCancel={() => setConfirmUpdate(false)}
            onConfirm={() => { setConfirmUpdate(false); doSubmit(); }}
          />
        )}
      </section>
    </div>
  );
}
