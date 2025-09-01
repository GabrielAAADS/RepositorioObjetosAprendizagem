import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import StarRating from '../components/StarRating';
import home from '../components/Home.module.css';
import * as ratings from '../services/ratings';
import ConfirmDownload from '../components/ConfirmDownload';
import css from './ObjectDetails.module.css';
import { createPortal } from 'react-dom';

const FALLBACK_SVG = (() => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#5b4ae6"/><stop offset="100%" stop-color="#7c5cf5"/>
    </linearGradient></defs>
    <rect width="800" height="500" fill="url(#g)"/>
    <g fill="white" opacity="0.14"><circle cx="120" cy="120" r="80"/><circle cx="700" cy="420" r="60"/></g>
  </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
})();

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

const LANG_PT = {
  'pt': 'Português', 'pt-br': 'Português (Brasil)', 'portuguese': 'Português',
  'en': 'Inglês', 'english': 'Inglês',
  'es': 'Espanhol', 'spanish': 'Espanhol',
  'fr': 'Francês', 'french': 'Francês',
};
const MAP = {
  lifecycleStatus: { draft: 'Rascunho', final: 'Final', revised: 'Revisado', unavailable: 'Indisponível' },
  difficulty: {
    'very easy': 'Muito fácil', 'very_easy': 'Muito fácil',
    easy: 'Fácil', medium: 'Médio', difficult: 'Difícil',
    'very difficult': 'Muito difícil', 'very_difficult': 'Muito difícil',
  },
  learningResourceType: {
    game: 'Jogo', jogo: 'Jogo', exercise: 'Exercício', exercicio: 'Exercício',
    lesson: 'Lição', simulation: 'Simulação', questionnaire: 'Questionário',
    quiz: 'Quiz', animation: 'Animação', presentation: 'Apresentação',
  },
  interactivityType: { active: 'Ativa', expositive: 'Expositiva', mixed: 'Mista' },
  endUserRole: { teacher: 'Professor', learner: 'Estudante', author: 'Autor', manager: 'Gestor' },
  context: {
    'primary education': 'Ensino Fundamental',
    'secondary education': 'Ensino Médio',
    'higher education': 'Ensino Superior',
    school: 'Escolar', university: 'Universidade',
    primary: 'Ensino Fundamental', secondary: 'Ensino Médio', 'higher-education': 'Ensino Superior', training: 'Treinamento',
  },
  cost: { yes: 'Com custo', no: 'Sem custo', true: 'Com custo', false: 'Sem custo' },
};
const norm = (s) => String(s ?? '').trim().toLowerCase();
const labelOf = (group, value) => {
  if (value == null || value === '') return '—';
  const v = norm(value);
  if (group === 'language' || group === 'eduLanguage') {
    return LANG_PT[v] || String(value);
  }
  return MAP[group]?.[v] ?? String(value);
};
const parseIsoMins = (iso) => {
  if (!iso) return null;
  if (typeof iso === 'number') return iso;
  const m = String(iso).match(/PT(\d+)M/i);
  return m ? Number(m[1]) : null;
};

export default function ObjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [obj, setObj] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rat, setRat] = useState({ list: [], avg: 0, count: 0 });
  const [ask, setAsk] = useState(false);
  const [myStars, setMyStars] = useState(0);
  const [myComment, setMyComment] = useState('');
  const [myVersion, setMyVersion] = useState('');
  const [tab, setTab] = useState('geral');

  const [myList, setMyList] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [confirmUpdate, setConfirmUpdate] = useState(false);

  const COMM_LIMIT = 20;
  const [commItems, setCommItems] = useState([]);
  const [commTotal, setCommTotal] = useState(0);
  const [commOffset, setCommOffset] = useState(0);
  const [commLoading, setCommLoading] = useState(false);
  const sentinelRef = useRef(null);

  const API_ORIGIN = (import.meta.env.VITE_API_URL || '').replace(/\/api$/, '');
  const downloadUrl = obj?.download_url || `${API_ORIGIN}/api/objetos/${id}/download`;

  const desc = useMemo(() => {
    const d = obj?.metadata?.general?.description || obj?.metadata?.educational?.description || '';
    return Array.isArray(d) ? d[0] : d;
  }, [obj]);

  const keywords = useMemo(() => {
    const k = obj?.metadata?.general?.keyword || [];
    return Array.isArray(k) ? k : (k ? [k] : []);
  }, [obj]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await api.get(`/objetos/${id}`);
        if (alive) setObj({ ...(data?.object || null), metadata: data?.metadata || null });
        const rs = await ratings.fetchCurrent({ objectId: id });
        if (alive) setRat(rs);
      } catch (e) {
        console.error(e);
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
    } catch (e) {
      console.error(e);
    } finally {
      setCommLoading(false);
    }
  };

  useEffect(() => {
    resetCommunity();
  }, [id]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const hasMore = commItems.length < commTotal;
    if (!hasMore) return;

    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        loadMoreCommunity(false);
      }
    }, { rootMargin: '200px' });

    obs.observe(el);
    return () => obs.disconnect();
  }, [sentinelRef, commItems.length, commTotal, commLoading]);

  const hist = useMemo(
    () => [...myList].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    [myList]
  );
  const myCurrent = useMemo(
    () => rat?.me || (myList?.[0] || null),
    [rat, myList]
  );

  const thumb = useMemo(() => {
    const m = obj?.metadata;
    const genThumb = m?.general?.thumbnail;
    const loc = m?.technical?.location;
    const locStr = Array.isArray(loc) ? loc?.[0] : (typeof loc === 'string' ? loc : null);
    return genThumb || locStr || FALLBACK_SVG;
  }, [obj]);

  const fileNameForUi = (() => {
    const title = obj?.title?.trim() || 'objeto';
    const fromPath = (obj?.file_path || '').split('?')[0];
    const ext = fromPath?.match(/\.[a-z0-9]{3,5}$/i)?.[0] || '.pptx';
    return `${title}${ext}`;
  })();

  const m = obj?.metadata || {};

  const humanFormat = (() => {
    const fmt = m?.technical?.format;
    const map = {
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
      'application/vnd.ms-powerpoint.presentation.macroEnabled.12': 'PPTM',
      'application/vnd.ms-powerpoint': 'PPT',
    };
    return map?.[fmt] || (fmt ? fmt.split('/').pop()?.toUpperCase() : '—');
  })();

  const sizeText = (() => {
    const s = m?.technical?.size;
    if (!s) return '—';
    const mb = s / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(1)} MB`;
    const kb = s / 1024;
    return `${Math.max(1, Math.round(kb))} KB`;
  })();

  const langText = labelOf('language', m?.general?.language);
  const interacText = labelOf('interactivityType', m?.educational?.interactivityType);

  const timeText = (() => {
    const t = parseIsoMins(m?.educational?.typicalLearningTime);
    return t ? `${t} min` : '—';
  })();

  const adv = {
    geral: {
      'Idioma': labelOf('language', m?.general?.language),
      'Palavras-chave': (Array.isArray(m?.general?.keyword) ? m.general.keyword : (m?.general?.keyword ? [m.general.keyword] : [])).join(', ') || '—',
      'Thumbnail': m?.general?.thumbnail ? 'Sim' : '—',
      'Descrição': desc || '—',
    },
    ciclo: {
      'Versão': m?.lifecycle?.version || '—',
      'Status': labelOf('lifecycleStatus', m?.lifecycle?.status),
      'Contribuidor(a)': (m?.lifecycle?.contribute?.[0]?.entity || '—') +
        (m?.lifecycle?.contribute?.[0]?.role ? ` (${m.lifecycle.contribute[0].role})` : ''),
      'Data de contribuição': m?.lifecycle?.contribute?.[0]?.date || '—',
    },
    tecnico: {
      'Formato': m?.technical?.format || '—',
      'Tamanho (bytes)': m?.technical?.size ?? '—',
      'Nome do arquivo': (Array.isArray(m?.technical?.location) ? m.technical.location[0] : m?.technical?.location) || '—',
    },
    educacional: {
      'Interatividade': labelOf('interactivityType', m?.educational?.interactivityType),
      'Tipo de Recurso': labelOf('learningResourceType', m?.educational?.learningResourceType),
      'Papel do Usuário': labelOf('endUserRole', m?.educational?.intendedEndUserRole),
      'Contexto': labelOf('context', m?.educational?.context),
      'Faixa Etária': m?.educational?.typicalAgeRange || '—',
      'Dificuldade': labelOf('difficulty', m?.educational?.difficulty),
      'Tempo médio (min)': parseIsoMins(m?.educational?.typicalLearningTime) ?? '—',
      'Idioma Educacional': labelOf('eduLanguage', m?.educational?.language),
      'Descrição Educacional': m?.educational?.description || '—',
    },
    direitos: {
      'Custo': labelOf('cost', m?.rights?.cost),
      'Copyright/Restrições': m?.rights?.copyrightAndOtherRestrictions || '—',
      'Descrição de Direitos': m?.rights?.description || '—',
    },
    classificacao: {
      'Propósito': m?.classification?.purpose || '—',
      'Descrição': m?.classification?.description || '—',
      'Palavras-chave (classificação)': (Array.isArray(m?.classification?.keyword) ? m.classification.keyword : (m?.classification?.keyword ? [m.classification.keyword] : [])).join(', ') || '—',
    },
  };

  async function doSubmit() {
    try {
      await ratings.upsert({
        objectId: id,
        stars: myStars,
        comment: myComment,
        version: myVersion || undefined,
      });
      const rs = await ratings.fetchCurrent({ objectId: id });
      setRat(rs);
      try {
        const hist = await ratings.history({ objectId: id });
        setMyList(hist);
      } catch (_) {}
      setMyStars(0); setMyComment(''); setMyVersion('');
    } catch (err) {
      alert(err?.response?.data?.error || 'Erro ao enviar avaliação.');
    }
  }

  if (loading) return <div className={home.loading}>Carregando…</div>;
  if (!obj)    return <div className={home.error}>Objeto não encontrado.</div>;

  return (
    <div className={css.container}>
      <div className={css.card}>
        <div className={css.cardTopBar} />
        <div className={css.cardHeader}>
          <span className={`${home.cardBadge} ${css.badge}`}>{(obj?.category || 'JOGO').toUpperCase()}</span>
          <h1 className={css.title}>{obj?.title}</h1>
        </div>

        <div className={css.cardBody}>
          <div className={css.imageFrame}>
            <img
              src={thumb}
              alt=""
              onError={(e) => {
                const img = e.currentTarget;
                if (img.src !== FALLBACK_SVG) img.src = FALLBACK_SVG;
              }}
            />
          </div>

          <div className={css.infoCol}>
            <div
              className={css.ratingRow}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/objects/${id}/ratings`)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && navigate(`/objects/${id}/ratings`)}
              title="Abrir página de avaliações"
              style={{ cursor: 'pointer' }}
            >
              <StarRating value={Number(rat.avg || obj?.ratingAvg || 0)} readOnly />
              <span className={css.ratingText}>
                {Number((rat.avg || obj?.ratingAvg || 0)).toFixed(1)} ({rat.count || obj?.ratingCount || 0})
              </span>
            </div>

            <div className={css.metaRow}>
              <div className={css.pill}><span>Formato</span><strong>{humanFormat}</strong></div>
              <div className={css.pill}><span>Idioma</span><strong>{langText}</strong></div>
              <div className={css.pill}><span>Tamanho</span><strong>{sizeText}</strong></div>
              <div className={css.pill}><span>Interatividade</span><strong>{interacText}</strong></div>
              <div className={css.pill}><span>Tempo médio</span><strong>{timeText}</strong></div>
            </div>

            {desc && <p className={css.desc}>{desc}</p>}

            {keywords.length > 0 && (
              <div className={css.tags}>
                {keywords.map((k, i) => (
                  <Link key={i} to={`/search?q=${encodeURIComponent(k)}`} className={css.tag}>#{k}</Link>
                ))}
              </div>
            )}

            <div className={css.actions}>
              <button className={home.cta} onClick={() => setAsk(true)}>Baixar</button>
              <button className={home.cta} onClick={() => navigate('/search')}>Voltar</button>
            </div>
          </div>
        </div>

        <ConfirmDownload
          open={ask}
          fileName={fileNameForUi}
          onCancel={() => setAsk(false)}
          onConfirm={() => { setAsk(false); window.location.assign(downloadUrl); }}
        />
      </div>

      <div className={css.tabs}>
        <div className={css.tabList} role="tablist" aria-label="Informações avançadas">
          {[
            ['geral', 'Geral'],
            ['ciclo', 'Ciclo de Vida'],
            ['tecnico', 'Técnico'],
            ['educacional', 'Educacional'],
            ['direitos', 'Direitos'],
            ['classificacao', 'Classificação'],
          ].map(([key, label]) => (
            <button
              key={key}
              role="tab"
              aria-selected={tab === key}
              className={`${css.tabBtn} ${tab === key ? css.tabBtnActive : ''}`}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className={css.tabPanel} role="tabpanel">
          <div className={css.kvGrid}>
            {Object.entries(adv[tab]).map(([k, v]) => (
              <div key={k} className={css.kvItem}>
                <div className={css.k}>{k}</div>
                <div className={css.v}>{String(v)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
