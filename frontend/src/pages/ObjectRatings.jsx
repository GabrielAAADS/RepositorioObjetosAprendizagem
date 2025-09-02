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
        <div className={css.modalHeader}>
          <h3 className={css.modalTitle}>Confirmar Atualização</h3>
        </div>
        <p className={css.modalText}>{text}</p>
        <div className={css.modalActions}>
          <button className={`${home.cta} ${css.confirmBtn}`} onClick={onConfirm}>
            Atualizar
          </button>
          <button
            className={`${home.cta} ${css.cancelBtn}`}
            onClick={onCancel}
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

  if (loading) return <div className={css.loadingContainer}>
    <div className={css.loadingSpinner}></div>
    <p>Carregando avaliações...</p>
  </div>;

  return (
    <div className={css.container}>
    
      <div className={css.headerCard}>
        <div className={css.cardTopBar} />
        <div className={css.headerContent}>
          <div className={css.headerMeta}>
            <span className={css.categoryBadge}>
              {(obj?.category || 'JOGO').toUpperCase()}
            </span>
            {rat.avg > 0 && (
              <div className={css.overallRating}>
                <StarRating value={rat.avg} readOnly size={18} />
                <span className={css.ratingStats}>
                  {rat.avg.toFixed(1)} ({rat.count} {rat.count === 1 ? 'avaliação' : 'avaliações'})
                </span>
              </div>
            )}
          </div>
          <h1 className={css.pageTitle}>
            Avaliações — {obj?.title || `Objeto #${id}`}
          </h1>
        </div>
      </div>

      <div className={css.ratingsLayout}>
        
        <div className={css.userPanel}>
          <div className={css.panelCard}>
            <div className={css.panelHeader}>
              <h2 className={css.panelTitle}>Sua Avaliação</h2>
            </div>

            {myCurrent ? (
              <div className={css.currentRating}>
                <div className={css.ratingDisplay}>
                  <StarRating value={myCurrent.stars} readOnly size={20} />
                  <span className={css.ratingValue}>{myCurrent.stars}/5</span>
                </div>
                <div className={css.ratingMeta}>
                  {myCurrent.version && (
                    <span className={css.versionTag}>v{myCurrent.version}</span>
                  )}
                  <span className={css.dateText}>
                    {new Date(myCurrent.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                {myCurrent.comment && (
                  <div className={css.commentBox}>
                    <p className={css.commentText}>{myCurrent.comment}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className={css.noRating}>
                <div className={css.noRatingIcon}>⭐</div>
                <p className={css.noRatingText}>Você ainda não avaliou este objeto</p>
                <p className={css.noRatingSubtext}>Seja o primeiro a compartilhar sua opinião!</p>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!myStars) { alert('Dê uma nota de 1 a 5.'); return; }
                if (myCurrent) { setConfirmUpdate(true); return; }
                doSubmit();
              }}
              className={css.ratingForm}
            >
              <div className={css.formSection}>
                <label className={css.formLabel}>Sua nota</label>
                <div className={css.starsInput}>
                  <StarRating value={myStars} onChange={setMyStars} size={28} />
                  {myStars > 0 && <span className={css.starValue}>{myStars}/5</span>}
                </div>
              </div>

              <div className={css.formSection}>
                <label className={css.formLabel}>Versão (opcional)</label>
                <input
                  placeholder="Ex: 1.0, 2.5, beta..."
                  value={myVersion}
                  onChange={(e) => setMyVersion(e.target.value)}
                  className={css.formInput}
                />
              </div>

              <div className={css.formSection}>
                <label className={css.formLabel}>Comentário (opcional)</label>
                <textarea
                  placeholder="Compartilhe sua experiência com este objeto..."
                  value={myComment}
                  onChange={(e) => setMyComment(e.target.value)}
                  className={css.formTextarea}
                  rows={4}
                />
              </div>

              <button 
                className={css.submitBtn} 
                type="submit" 
                disabled={confirmUpdate}
              >
                {myCurrent ? 'Atualizar Avaliação' : 'Enviar Avaliação'}
              </button>
            </form>

            <div className={css.panelActions}>
              <button
                className={css.historyToggle}
                onClick={() => setShowHistory((s) => !s)}
              >
                {showHistory ? '📋 Ocultar histórico' : '📋 Ver histórico'}
              </button>
              <button
                className={css.backBtn}
                onClick={() => navigate(-1)}
                title="Voltar"
              >
                ← Voltar
              </button>
            </div>

            {showHistory && (
              <div className={css.historySection}>
                <h3 className={css.historyTitle}>Seu Histórico</h3>
                {hist.length === 0 ? (
                  <p className={css.emptyState}>Nenhuma avaliação encontrada</p>
                ) : (
                  <div className={css.historyList}>
                    {hist.map((r, i) => (
                      <div key={r.id} className={css.historyItem}>
                        <div className={css.historyHeader}>
                          <StarRating value={r.stars} readOnly size={16} />
                          <div className={css.historyMeta}>
                            {r.version && (
                              <span className={css.versionTag}>v{r.version}</span>
                            )}
                            <span className={css.dateText}>
                              {new Date(r.created_at).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </div>
                        {r.comment && (
                          <p className={css.historyComment}>{r.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        
        <div className={css.communityPanel}>
          <div className={css.panelCard}>
            <div className={css.panelHeader}>
              <h2 className={css.panelTitle}>Avaliações da Comunidade</h2>
              {rat.count > 0 && (
                <span className={css.communityCount}>
                  {rat.count} {rat.count === 1 ? 'avaliação' : 'avaliações'}
                </span>
              )}
            </div>

            <div className={css.communityContent}>
              {commItems.length === 0 && !commLoading ? (
                <div className={css.emptyState}>
                  <div className={css.emptyIcon}>💬</div>
                  <p className={css.emptyText}>Ainda não há avaliações</p>
                  <p className={css.emptySubtext}>Seja o primeiro a avaliar este objeto!</p>
                </div>
              ) : (
                <>
                  <div className={css.reviewsList}>
                    {commItems.map((r) => (
                      <div key={r.id} className={css.reviewCard}>
                        <div className={css.reviewHeader}>
                          <div className={css.reviewRating}>
                            <StarRating value={r.stars} readOnly size={16} />
                            <span className={css.ratingNumber}>{r.stars}/5</span>
                          </div>
                          <div className={css.reviewMeta}>
                            {r.version && (
                              <span className={css.versionTag}>v{r.version}</span>
                            )}
                            <span className={css.dateText}>
                              {new Date(r.created_at).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </div>
                        {r.comment && (
                          <div className={css.reviewBody}>
                            <p className={css.reviewText}>{r.comment}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {commLoading && (
                    <div className={css.loadingMore}>
                      <div className={css.loadingSpinner}></div>
                      <span>Carregando mais avaliações...</span>
                    </div>
                  )}

                  <div ref={sentinelRef} />

                  {commItems.length < commTotal && !commLoading && (
                    <div className={css.loadMoreContainer}>
                      <button 
                        className={css.loadMoreBtn} 
                        onClick={() => loadMoreCommunity(false)}
                      >
                        Carregar mais avaliações
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {confirmUpdate && (
        <ConfirmModal
          text="Você já avaliou este objeto. Quer atualizar sua avaliação? A nota e o comentário substituirão a avaliação atual."
          onCancel={() => setConfirmUpdate(false)}
          onConfirm={() => { setConfirmUpdate(false); doSubmit(); }}
        />
      )}
    </div>
  );
}