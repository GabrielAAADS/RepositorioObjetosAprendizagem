import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import ObjectCard from '../components/ObjectCards';
import homeCss from '../components/Home.module.css';
import css from '../components/Search.module.css';

const FACET_GROUPS = [
  { key: 'status',            title: 'Status do Ciclo de Vida', path: 'lom.lifecycle.status' },
  { key: 'difficulty',        title: 'Dificuldade',             path: 'lom.educational.difficulty' },
  { key: 'resourceType',      title: 'Tipo de Recurso',         path: 'lom.educational.learningResourceType' },
  { key: 'interactivityType', title: 'Interatividade',          path: 'lom.educational.interactivityType' },
  { key: 'endUserRole',       title: 'Papel do Usuário',        path: 'lom.educational.intendedEndUserRole' },
  { key: 'context',           title: 'Contexto',                path: 'lom.educational.context' },
  { key: 'language',          title: 'Idioma do Objeto',        path: 'lom.general.language' },
  { key: 'eduLanguage',       title: 'Idioma Educacional',      path: 'lom.educational.language' },
  { key: 'cost',              title: 'Custo',                   path: 'lom.rights.cost' },
  { key: 'keywords',          title: 'Palavras-chave',          path: 'lom.general.keyword', isKeyword: true },
];

const PATH2KEY = Object.fromEntries(FACET_GROUPS.map(g => [g.path, g.key]));

const norm = (s) => String(s ?? '').trim().toLowerCase();
const normKey = (s) =>
  norm(s)
    .normalize('NFD').replace(/\p{Diacritic}/gu, '') 
    .replace(/[\s-]+/g, '_')                         
    .replace(/__+/g, '_');                           

const MAP = {
  status: {
    draft: 'Rascunho', final: 'Final', revised: 'Revisado', unavailable: 'Indisponível',
  },
  difficulty: {
    very_easy: 'Muito fácil', easy: 'Fácil', medium: 'Médio',
    difficult: 'Difícil', very_difficult: 'Muito difícil',
  },
  resourceType: {
    game: 'Jogo', jogo: 'Jogo',
    exercise: 'Exercício', exercicio: 'Exercício',
    lesson: 'Lição', simulation: 'Simulação',
    questionnaire: 'Questionário', quiz: 'Quiz',
    animation: 'Animação', presentation: 'Apresentação',
  },
  interactivityType: {
    active: 'Ativa', expositive: 'Expositiva', mixed: 'Mista',
  },
  endUserRole: {
    teacher: 'Professor', learner: 'Estudante', author: 'Autor', manager: 'Gestor',
  },
  context: {
    primary_education: 'Ensino Fundamental', primary: 'Ensino Fundamental',
    secondary_education: 'Ensino Médio', secondary: 'Ensino Médio',
    higher_education: 'Ensino Superior', highereducation: 'Ensino Superior',
    'higher-education': 'Ensino Superior',
    school: 'Escolar', university: 'Universidade', training: 'Treinamento',
  },
};

function labelFromMap(groupKey, value) {
  const k = normKey(value);
  const table = MAP[groupKey];
  if (!table) return null;
  return (
    table[k] ||
    table[k.replace(/_/g, ' ')] ||
    table[k.replace(/_/g, '')] ||
    null
  );
}

function prettyLabel(groupKey, value) {
  if (value == null || String(value).trim() === '') return 'Sem valor';

  if (groupKey === 'cost') {
    const v = norm(value);
    if (v === 'yes' || v === 'true') return 'Com custo';
    if (v === 'no'  || v === 'false') return 'Gratuito';
  }

  if (groupKey === 'language' || groupKey === 'eduLanguage') {
    const v = norm(value);
    if (v.startsWith('pt')) return 'Português';
    if (v.startsWith('en')) return 'Inglês';
    if (v.startsWith('es')) return 'Espanhol';
    if (v.startsWith('fr')) return 'Francês';
  }

  const mapped = labelFromMap(groupKey, value);
  if (mapped) return mapped;

  return String(value);
}

export default function Search() {
  const navigate = useNavigate();
  const [sp] = useSearchParams();

  const [q, setQ] = useState(sp.get('q') || '');
  const [selected, setSelected] = useState({});
  const [facetSearch, setFacetSearch] = useState({});
  const [facets, setFacets] = useState({});
  const [objects, setObjects] = useState([]);
  const [total, setTotal] = useState(0);

  const limit = 12;
  const [page, setPage] = useState(Number(sp.get('page') || 1));

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    const kw = sp.get('keyword');
    const ctx = sp.get('context');
    if (!kw && !ctx) return;

    setSelected(prev => {
      const next = { ...prev };
      if (kw) {
        const p = 'lom.general.keyword';
        const s = new Set(next[p] || []);
        s.add(kw);
        next[p] = s;
      }
      if (ctx) {
        const p = 'lom.educational.context';
        const s = new Set(next[p] || []);
        s.add(ctx);
        next[p] = s;
      }
      return next;
    });
  }, []);

  const lomFilters = useMemo(() => {
    const lom = {};
    Object.entries(selected).forEach(([path, set]) => {
      const arr = Array.from(set);
      if (arr.length > 0) lom[path] = { $in: arr };
    });
    return lom;
  }, [selected]);

  async function loadFacets() {
    try {
      const params = { title: q };
      if (Object.keys(lomFilters).length) params.lomFilters = JSON.stringify(lomFilters);
      const { data } = await api.get('/objetos/facets', { params });

      const clean = {};
      for (const g of FACET_GROUPS) {
        const raw = Array.isArray(data.facets?.[g.key]) ? data.facets[g.key] : [];
        const items = raw
          .filter(x => x && x.value != null && String(x.value).trim() !== '')
          .filter(x => !/^\d+$/.test(String(x.value).trim()))
          .map(x => ({
            value: x.value,
            count: x.count,
            label: g.isKeyword ? String(x.value) : prettyLabel(g.key, x.value),
          }))
          .sort((a, b) => (b.count || 0) - (a.count || 0));
        clean[g.key] = items;
      }
      setFacets(clean);
    } catch (e) {
      console.error('facets', e);
    }
  }

  async function loadObjects(newPage = page) {
    setLoading(true); setErr('');
    try {
      const offset = (newPage - 1) * limit;
      const params = { title: q, limit, offset };
      if (Object.keys(lomFilters).length) params.lomFilters = JSON.stringify(lomFilters);
      const res = await api.get('/objetos', { params });
      setObjects(res.data.objects || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      console.error(e);
      setErr('Erro ao buscar objetos.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { setPage(1); }, [q, JSON.stringify(lomFilters)]);

  useEffect(() => {
    loadObjects(1);
    loadFacets();

    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (page > 1) params.set('page', String(page));
    const selectedPairs = [];
    Object.entries(selected).forEach(([path, set]) => {
      Array.from(set).forEach(v => selectedPairs.push([path, String(v)]));
    });
    selectedPairs.forEach(([path, v], idx) => {
      params.append(`f${idx}`, `${path}::${v}`);
    });

    navigate(`/search?${params.toString()}`, { replace: true });
  }, [q, page, JSON.stringify(lomFilters)]);

  const toggleValue = (path, value) => {
    setPage(1);
    setSelected(prev => {
      const s = new Set(prev[path] || []);
      s.has(value) ? s.delete(value) : s.add(value);
      return { ...prev, [path]: s };
    });
  };

  const clearAll = () => {
    setQ('');
    setSelected({});
    setFacetSearch({});
    setPage(1);
  };

  const filterOptions = (list, qstr) => {
    const base = !qstr
      ? list
      : list.filter(o =>
          String(o.value).toLowerCase().includes(qstr.toLowerCase()) ||
          String(o.label || '').toLowerCase().includes(qstr.toLowerCase())
        );
    return base;
  };

  const getFacetLabel = (facetsState, path, value) => {
    const key = PATH2KEY[path];
    const list = facetsState[key] || [];
    const hit = list.find(i => String(i.value) === String(value));
    return hit?.label || prettyLabel(key, value);
  };

  const activeChips = Object.entries(selected)
    .flatMap(([path, set]) => Array.from(set).map(v => ({ path, key: PATH2KEY[path], value: v })));

  return (
    <div className={homeCss.content} style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <form
        onSubmit={(e) => { e.preventDefault(); setPage(1); loadObjects(1); loadFacets(); }}
        className={css.searchBar}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Pesquise por título, palavra-chave, disciplina…"
          className={css.searchInput}
        />
        <button className={css.searchBtn} type="submit">Buscar</button>
      </form>

      {activeChips.length > 0 && (
        <div className={css.chips}>
          {activeChips.map((c) => (
            <span key={`${c.path}:${String(c.value)}`} className={css.chip}>
              {getFacetLabel(facets, c.path, c.value)}
              <button onClick={() => toggleValue(c.path, c.value)}>×</button>
            </span>
          ))}
          <button className={css.clear} onClick={clearAll}>Limpar tudo</button>
        </div>
      )}

      <div className={css.wrap}>
        <aside className={css.sidebar}>
          <div className={css.actions}>
            <h2 className={homeCss.sectionTitle} style={{ fontSize: '1.2rem', margin: 0 }}>Filtros</h2>
            <button onClick={clearAll} className={css.clear}>Limpar tudo</button>
          </div>

          {FACET_GROUPS.map(group => {
            const list = filterOptions(facets[group.key] || [], facetSearch[group.key] || '');
            return (
              <div key={group.key} className={css.panel} style={{ marginBottom: 12 }}>
                <div className={css.panelHead}>
                  <h3 className={css.panelTitle}>{group.title}</h3>
                  <input
                    placeholder="Pesquisar"
                    value={facetSearch[group.key] || ''}
                    onChange={e => setFacetSearch(s => ({ ...s, [group.key]: e.target.value }))}
                    className={css.inlineSearch}
                  />
                </div>

                <div className={css.list}>
                  {list.length === 0 && <p className={homeCss.error} style={{ margin: 8 }}>Sem opções</p>}
                  {list.map((o, idx) => {
                    const sel = selected[group.path]?.has(o.value) || false;
                    return (
                      <label key={`${group.key}:${String(o.value)}:${idx}`} className={css.item}>
                        <input
                          type="checkbox"
                          checked={sel}
                          onChange={() => toggleValue(group.path, o.value)}
                        />
                        <span className="flex-1">{o.label}</span>
                        <span className={css.count}>{o.count}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </aside>

        <section>
          {loading && <p className={homeCss.loading}>Carregando…</p>}
          {err && <p className={homeCss.error}>{err}</p>}

          {!loading && objects.length === 0 && (
            <div className={homeCss.noObjects}>
              <p>Nenhum objeto encontrado.</p>
              <button className={css.clear} onClick={clearAll}>Limpar filtros</button>
            </div>
          )}

          {!loading && objects.length > 0 && (
            <div className={css.resultsGrid}>
              {objects.map((o) => <ObjectCard key={o.id} obj={o} />)}
            </div>
          )}

          <div className={css.pager}>
            <button
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              disabled={page === 1}
              className={css.pagerBtn}
            >
              Anterior
            </button>
            <span>Página {page} de {Math.max(1, Math.ceil(total / limit))}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page * limit >= total}
              className={css.pagerBtn}
            >
              Próxima
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
