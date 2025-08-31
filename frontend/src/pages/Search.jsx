import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import ObjectCard from '../components/ObjectCards';
import homeCss from '../components/Home.module.css';
import css from '../components/Search.module.css';

const FACET_GROUPS = [
  { key:'status',           title:'Status do Ciclo de Vida', path:'lom.lifecycle.status' },
  { key:'difficulty',       title:'Dificuldade',              path:'lom.educational.difficulty' },
  { key:'resourceType',     title:'Tipo de Recurso',          path:'lom.educational.learningResourceType' },
  { key:'interactivityType',title:'Interatividade',           path:'lom.educational.interactivityType' },
  { key:'endUserRole',      title:'Papel do Usuário',         path:'lom.educational.intendedEndUserRole' },
  { key:'context',          title:'Contexto',                 path:'lom.educational.context' },
  { key:'language',         title:'Idioma do Objeto',         path:'lom.general.language' },
  { key:'eduLanguage',      title:'Idioma Educacional',       path:'lom.educational.language' },
  { key:'cost',             title:'Custo',                    path:'lom.rights.cost' },
  { key:'keywords',         title:'Palavras-chave',           path:'lom.general.keyword', isKeyword:true },
];

const PATH2KEY = Object.fromEntries(FACET_GROUPS.map(g => [g.path, g.key]));

const getFacetLabel = (facets, path, value) => {
  const key = PATH2KEY[path];
  const list = facets[key] || [];
  const hit = list.find(i => String(i.value) === String(value));
  return hit?.label || prettyLabel(key, value);
};

function prettyLabel(key, value) {
  if (value == null || String(value).trim() === '') return 'Sem valor';
  if (key === 'cost') {
    const v = String(value).toLowerCase();
    return v === 'yes' || v === 'true' ? 'Com custo' : v === 'no' || v === 'false' ? 'Gratuito' : String(value);
  }
  if (key === 'language' || key === 'eduLanguage') {
    const v = String(value).toLowerCase();
    if (v.startsWith('pt')) return 'Português';
    if (v.startsWith('en')) return 'Inglês';
    if (v.startsWith('es')) return 'Espanhol';
  }
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
        const items = (data.facets?.[g.key] || [])
          .filter(x => x && x.value != null && String(x.value).trim() !== '')
          .map(x => ({ value: x.value, count: x.count }));
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

  useEffect(() => {
    setPage(1);
  }, [q, JSON.stringify(lomFilters)]);

  useEffect(() => {
    loadObjects(1);
    loadFacets();
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (page > 1) params.set('page', String(page));
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

  const filterOptions = (list, q) => {
    const base = !q ? list : list.filter(o =>
      String(o.value).toLowerCase().includes(q.toLowerCase())
    );
    return base.filter(o => !/^\d+$/.test(String(o.value).trim()));
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
          {activeChips.map((c, i) => (
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
                          checked={selected[group.path]?.has(o.value) || false}
                          onChange={() => toggleValue(group.path, o.value)}
                        />
                        <span className="flex-1">{o.label || prettyLabel(group.key, o.value)}</span>
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
            <div className={homeCss.objectsGrid}>
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
