import React, { useState, useEffect } from 'react';
import api from '../services/api';
import PreviewModal from '../components/PreviewModal';

export default function SearchObjects() {
  const [selectedObject, setSelectedObject] = useState(null);
  const [title, setTitle]       = useState('');
  const [category, setCategory] = useState('');

  const [advanced, setAdvanced] = useState(false);

  const [advFilters, setAdvFilters] = useState({
    'lom.general.keyword': '', 
    'lom.general.language':'pt-BR',
    'lom.lifecycle.version':'',
    'lom.lifecycle.status':'',
    'lom.lifecycle.contribute.role':'',
    'lom.lifecycle.contribute.entity':'',
    'lom.lifecycle.contribute.date':'',
    'lom.technical.format':'',
    'lom.technical.size':'',
    'lom.technical.location':'',
    'lom.educational.interactivityType':'',
    'lom.educational.learningResourceType':'',
    'lom.educational.intendedEndUserRole':'',
    'lom.educational.context':'',
    'lom.educational.typicalAgeRange':'',
    'lom.educational.difficulty':'',
    'lom.educational.typicalLearningTime':'',
    'lom.educational.description':'',
    'lom.educational.language':'pt-BR',
    'lom.rights.cost':'no',
    'lom.rights.copyrightAndOtherRestrictions':'',
    'lom.rights.description':'',
    'lom.classification.purpose':'',
    'lom.classification.description':'',
    'lom.classification.keyword':''
  });

  const [objects, setObjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [page, setPage]     = useState(1);
  const [limit] = useState(20); 
  const [total, setTotal] = useState(0);

  async function fetchObjects() {
    setLoading(true);
    setError('');

    try {
      const offset = (page - 1) * limit;
      const params = { title, category, limit, offset };

      if (advanced) {
        const lomQuery = {};
        Object.entries(advFilters).forEach(([key, val]) => {
          if (val !== '' && val !== null) {
            if (key.endsWith('.keyword')) {
              lomQuery[key] = { $in: val.split(',').map(k=>k.trim()).filter(Boolean) };
            } else {
              lomQuery[key] = val;
            }
          }
        });
        if (Object.keys(lomQuery).length) {
          params.lomFilters = JSON.stringify(lomQuery);
        }
      }

      const res = await api.get('/objetos', { params });
      setObjects(res.data.objects);
      setTotal(res.data.total);
    } catch (err) {
      console.error(err);
      setError('Erro ao buscar objetos.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchObjects();
  }, [page, title, category, advanced, advFilters]);

  const handleAdvChange = (e) => {
    const { name, value } = e.target;
    setAdvFilters(f => ({ ...f, [name]: value }));
  };

  const handleClear = () => {
    setTitle('');
    setCategory('');
    setAdvanced(false);
    setAdvFilters(Object.fromEntries(
      Object.keys(advFilters).map(k => [k, k.endsWith('.cost') ? 'no' : k.endsWith('.language')?'pt-BR':''])
    ));
    fetchObjects();
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl mb-4">Buscar Objetos</h1>

      <div className="bg-white p-4 rounded shadow mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <input
            type="text"
            placeholder="Título"
            value={title}
            onChange={e=>setTitle(e.target.value)}
            className="border p-2 rounded flex-1"
          />
          <input
            type="text"
            placeholder="Categoria"
            value={category}
            onChange={e=>setCategory(e.target.value)}
            className="border p-2 rounded flex-1"
          />
          <button
            onClick={fetchObjects}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Pesquisar
          </button>
          <button
            onClick={handleClear}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded"
          >
            Limpar
          </button>
          <button
            onClick={()=>setAdvanced(a=>!a)}
            className="text-sm text-blue-600 ml-auto"
          >
            {advanced ? 'Ocultar filtros avançados' : 'Mostrar filtros avançados'}
          </button>
        </div>

        {advanced && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="block">Keyword</label>
              <input name="lom.general.keyword" value={advFilters['lom.general.keyword']} onChange={handleAdvChange} className="w-full border p-2 rounded"/></div>
            <div><label className="block">Language</label>
              <input name="lom.general.language" value={advFilters['lom.general.language']} onChange={handleAdvChange} className="w-full border p-2 rounded"/></div>

            <div><label className="block">Version</label>
              <input name="lom.lifecycle.version" value={advFilters['lom.lifecycle.version']} onChange={handleAdvChange} className="w-full border p-2 rounded"/></div>
            <div><label className="block">Status</label>
              <input name="lom.lifecycle.status" value={advFilters['lom.lifecycle.status']} onChange={handleAdvChange} className="w-full border p-2 rounded"/></div>
            <div><label className="block">Contrib Role</label>
              <input name="lom.lifecycle.contribute.role" value={advFilters['lom.lifecycle.contribute.role']} onChange={handleAdvChange} className="w-full border p-2 rounded"/></div>
            <div><label className="block">Contrib Entity</label>
              <input name="lom.lifecycle.contribute.entity" value={advFilters['lom.lifecycle.contribute.entity']} onChange={handleAdvChange} className="w-full border p-2 rounded"/></div>
            <div><label className="block">Contrib Date</label>
              <input type="date" name="lom.lifecycle.contribute.date" value={advFilters['lom.lifecycle.contribute.date']} onChange={handleAdvChange} className="w-full border p-2 rounded"/></div>

            <div><label className="block">Format</label>
              <input name="lom.technical.format" value={advFilters['lom.technical.format']} onChange={handleAdvChange} className="w-full border p-2 rounded"/></div>
            <div><label className="block">Size (bytes)</label>
              <input name="lom.technical.size" type="number" value={advFilters['lom.technical.size']} onChange={handleAdvChange} className="w-full border p-2 rounded"/></div>
            <div><label className="block">Location</label>
              <input name="lom.technical.location" value={advFilters['lom.technical.location']} onChange={handleAdvChange} className="w-full border p-2 rounded"/></div>

            <div><label className="block">InteractivityType</label>
              <input name="lom.educational.interactivityType" value={advFilters['lom.educational.interactivityType']} onChange={handleAdvChange} className="w-full border p-2 rounded"/></div>
            <div><label className="block">ResourceType</label>
              <input name="lom.educational.learningResourceType" value={advFilters['lom.educational.learningResourceType']} onChange={handleAdvChange} className="w-full border p-2 rounded"/></div>
            <div><label className="block">EndUserRole</label>
              <input name="lom.educational.intendedEndUserRole" value={advFilters['lom.educational.intendedEndUserRole']} onChange={handleAdvChange} className="w-full border p-2 rounded"/></div>
            <div><label className="block">Context</label>
              <input name="lom.educational.context" value={advFilters['lom.educational.context']} onChange={handleAdvChange} className="w-full border p-2 rounded"/></div>
            <div><label className="block">AgeRange</label>
              <input name="lom.educational.typicalAgeRange" value={advFilters['lom.educational.typicalAgeRange']} onChange={handleAdvChange} className="w-full border p-2 rounded"/></div>
            <div><label className="block">Difficulty</label>
              <input name="lom.educational.difficulty" value={advFilters['lom.educational.difficulty']} onChange={handleAdvChange} className="w-full border p-2 rounded"/></div>
            <div><label className="block">LearningTime</label>
              <input name="lom.educational.typicalLearningTime" value={advFilters['lom.educational.typicalLearningTime']} onChange={handleAdvChange} className="w-full border p-2 rounded"/></div>
            <div className="md:col-span-2"><label className="block">Educational Description</label>
              <textarea name="lom.educational.description" value={advFilters['lom.educational.description']} onChange={handleAdvChange} className="w-full border p-2 rounded"/></div>
            <div><label className="block">Educational Language</label>
              <input name="lom.educational.language" value={advFilters['lom.educational.language']} onChange={handleAdvChange} className="w-full border p-2 rounded"/></div>

            <div><label className="block">Cost</label>
              <select name="lom.rights.cost" value={advFilters['lom.rights.cost']} onChange={handleAdvChange} className="w-full border p-2 rounded">
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select></div>
            <div><label className="block">Restrictions</label>
              <input name="lom.rights.copyrightAndOtherRestrictions" value={advFilters['lom.rights.copyrightAndOtherRestrictions']} onChange={handleAdvChange} className="w-full border p-2 rounded"/></div>
            <div className="md:col-span-2"><label className="block">Rights Description</label>
              <textarea name="lom.rights.description" value={advFilters['lom.rights.description']} onChange={handleAdvChange} className="w-full border p-2 rounded"/></div>

            <div><label className="block">Purpose</label>
              <input name="lom.classification.purpose" value={advFilters['lom.classification.purpose']} onChange={handleAdvChange} className="w-full border p-2 rounded"/></div>
            <div className="md:col-span-2"><label className="block">Classification Description</label>
              <textarea name="lom.classification.description" value={advFilters['lom.classification.description']} onChange={handleAdvChange} className="w-full border p-2 rounded"/></div>
            <div><label className="block">Classification Keywords</label>
              <input name="lom.classification.keyword" value={advFilters['lom.classification.keyword']} placeholder="vírgula" onChange={handleAdvChange} className="w-full border p-2 rounded"/></div>
          </div>
        )}
      </div>

      {loading && <p>Carregando...</p>}
      {error   && <p className="text-red-500">{error}</p>}
      {!loading && objects.length === 0 && <p>Nenhum objeto encontrado.</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {objects.map(obj => (
          <div
            key={obj.id}
            className="bg-white rounded shadow p-4 cursor-pointer hover:ring-2 hover:ring-blue-400"
            onClick={() => setSelectedObject(obj)}
          >
            <h2 className="text-xl font-semibold">{obj.title}</h2>
            <p className="text-sm text-gray-500">Categoria: {obj.category}</p>
            <p className="text-xs text-gray-400">
              {new Date(obj.created_at).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-center items-center space-x-4">
            <button
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
            >
                Anterior
            </button>

            <span>Pagina {page} de {Math.ceil(total / limit) || 1}</span>

            <button
                onClick={() => setPage(p => p + 1)}
                disabled={page * limit >= total}
                className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
            >
                Próxima
            </button>
        </div>
        
      {selectedObject && (
        <PreviewModal
          object={selectedObject}
          onClose={() => setSelectedObject(null)}
        />
      )}
    </div>
  );
}
