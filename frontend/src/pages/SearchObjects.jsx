import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import PreviewModal from '../components/PreviewModal';
import CourseCard from '../components/CourseCard';

const FACET_GROUPS = [
  { key:'status',            title:'Lifecycle Status', path:'metadata.lifecycle.status' },
  { key:'difficulty',        title:'Difficulty',        path:'metadata.educational.difficulty' },
  { key:'resourceType',      title:'Resource Type',     path:'metadata.educational.learningResourceType' },
  { key:'interactivityType', title:'Interactivity',     path:'metadata.educational.interactivityType' },
  { key:'endUserRole',       title:'End-user Role',     path:'metadata.educational.intendedEndUserRole' },
  { key:'context',           title:'Context',           path:'metadata.educational.context' },
  { key:'language',          title:'Language',          path:'metadata.general.language' },
  { key:'eduLanguage',       title:'Edu Language',      path:'metadata.educational.language' },
  { key:'cost',              title:'Cost',              path:'metadata.rights.cost' },
  { key:'keywords',          title:'Keywords',          path:'metadata.general.keyword', isKeyword:true },
];

const VOCABS = {
  status: new Set(['draft','final','revised']),
  difficulty: new Set(['very easy','easy','medium','difficult','very difficult']),
  resourceType: new Set(['game','quiz','presentation','simulation','exercise','lecture-notes']),
  interactivityType: new Set(['active','expositive','mixed']),
  endUserRole: new Set(['teacher','learner']),
  context: new Set(['primary','secondary','higher-education','training']),
  cost: new Set(['yes','no']),
};

const LABELS = {
  status: { draft:'Draft', final:'Final', revised:'Revised' },
  difficulty: {
    'very easy':'Very easy', easy:'Easy', medium:'Medium',
    difficult:'Difficult', 'very difficult':'Very difficult'
  },
  resourceType: {
    game:'Game', quiz:'Quiz', presentation:'Presentation',
    simulation:'Simulation', 'lecture-notes':'Lecture notes', exercise:'Exercise'
  },
  interactivityType: { active:'Active', expositive:'Expositive', mixed:'Mixed' },
  endUserRole: { teacher:'Teacher', learner:'Learner' },
  context: {
    primary:'Primary', secondary:'Secondary',
    'higher-education':'Higher education', training:'Training'
  },
  cost: { yes:'Yes', no:'No' },
};

export default function SearchObjects() {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');

  const [selected, setSelected] = useState({});
  const [facetSearch, setFacetSearch] = useState({});

  const [objects, setObjects] = useState([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const [page, setPage] = useState(1);
  const limit = 20;

  const [advanced, setAdvanced] = useState(true);
  const [facets, setFacets] = useState({});    
  const [selectedObject, setSelectedObject] = useState(null);

  const buildLomFilters = useMemo(() => {
    const lom = {};
    Object.entries(selected).forEach(([path, set]) => {
      const arr = Array.from(set);
      if (arr.length > 0) lom[path] = { $in: arr };
    });
    return lom;
  }, [selected]);

  async function loadFacets() {
    try {
      const params = { title, category };
      if (Object.keys(buildLomFilters).length) {
        params.lomFilters = JSON.stringify(buildLomFilters);
      }
      const { data } = await api.get('/objetos/facets', { params });
      setFacets(data.facets || {});
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchObjects() {
    setLoading(true); setError('');
    try {
      const offset = (page - 1) * limit;
      const params = { title, category, limit, offset };
      if (Object.keys(buildLomFilters).length) {
        params.lomFilters = JSON.stringify(buildLomFilters);
      }
      const res = await api.get('/objetos', { params });
      setObjects(res.data.objects);
      setTotal(res.data.total);
    } catch (e) {
      console.error(e);
      setError('Erro ao buscar objetos.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchObjects(); loadFacets(); }, [page, title, category, buildLomFilters]);

  const toggleValue = (path, value) => {
    setPage(1);
    setSelected(prev => {
      const s = new Set(prev[path] || []);
      s.has(value) ? s.delete(value) : s.add(value);
      return { ...prev, [path]: s };
    });
  };

  const clearAll = () => {
    setTitle(''); setCategory('');
    setSelected({}); setFacetSearch({});
    setPage(1);
  };

  const filterOptions = (list, q) =>
    !q ? list : list.filter(o => String(o.value).toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl mb-4">Explore Objetos</h1>

      <div className="bg-white rounded shadow p-4 mb-4 flex flex-wrap gap-3">
        <input
          placeholder="Buscar por título"
          value={title}
          onChange={e=>{ setTitle(e.target.value); setPage(1); }}
          className="border p-2 rounded flex-1"
        />
        <input
          placeholder="Categoria"
          value={category}
          onChange={e=>{ setCategory(e.target.value); setPage(1); }}
          className="border p-2 rounded w-56"
        />
        <button onClick={()=>setAdvanced(a=>!a)} className="px-3 py-2 text-blue-600">
          {advanced ? 'Ocultar filtros' : 'Mostrar filtros'}
        </button>
        <div className="ml-auto self-center text-sm text-gray-600">
          {total} resultados
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {advanced && (
          <aside className="lg:col-span-1">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold">Filtros</h2>
              <button onClick={clearAll} className="text-sm text-blue-600">Limpar tudo</button>
            </div>

            <div className="space-y-3">
              {FACET_GROUPS.map(group => {
                  const raw = facets[group.key] || [];
                  const searched = filterOptions(raw, facetSearch[group.key] || '');
                  const opts = searched.filter(o => {
                    if (!o || o.value === undefined || o.value === null) return false;
                    const v = String(o.value).toLowerCase().trim();
                    const vocab = VOCABS[group.key];
                    return vocab ? vocab.has(v) : v.length > 0;
                  });
                return (
                  <div key={group.key} className="border rounded">
                    <div className="flex items-center justify-between px-3 py-2">
                      <span className="font-medium">{group.title}</span>
                      <input
                        placeholder="Pesquisar"
                        value={facetSearch[group.key] || ''}
                        onChange={e=>setFacetSearch(s=>({ ...s, [group.key]: e.target.value }))}
                        className="border p-1 rounded text-sm w-32"
                      />
                    </div>
                    <div className="max-h-64 overflow-auto px-3 pb-2">
                      {opts.map(o => {
                        const v = String(o.value);
                        const key = v.toLowerCase();
                        const label = LABELS[group.key]?.[key] || v;
                        const sel = selected[group.path]?.has(v) || false;
                        return (
                          <label key={group.key + v} className="flex items-center gap-2 py-1">
                            <input
                              type="checkbox"
                              checked={sel}
                              onChange={() => toggleValue(group.path, v)}
                            />
                            <span className="flex-1">{label}</span>
                            <span className="text-xs text-gray-500">({o.count})</span>
                          </label>
                        );
                      })}
                      {opts.length === 0 && <p className="text-sm text-gray-400">Sem opções</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>
        )}

        <section className={advanced ? 'lg:col-span-3' : 'lg:col-span-4'}>
          {loading && <p>Carregando…</p>}
          {error && <p className="text-red-500">{error}</p>}
          {!loading && objects.length === 0 && <p>Nenhum objeto encontrado.</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {objects.map(obj => (
              <CourseCard key={obj.id} obj={obj} />
            ))}
          </div>         
          
          <div className="mt-6 flex justify-center items-center gap-4">
            <button
              onClick={()=>setPage(p => Math.max(p-1,1))}
              disabled={page===1}
              className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
            >Anterior</button>
            <span>Página {page} de {Math.max(1, Math.ceil(total/limit))}</span>
            <button
              onClick={()=>setPage(p => p + 1)}
              disabled={page*limit >= total}
              className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
            >Próxima</button>
          </div>
        </section>
      </div>

      {selectedObject && (
        <PreviewModal object={selectedObject} onClose={()=>setSelectedObject(null)} />
      )}
    </div>
  );
}
