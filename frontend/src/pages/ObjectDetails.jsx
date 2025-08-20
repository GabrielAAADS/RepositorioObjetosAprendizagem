import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';

export default function ObjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await api.get(`/objetos/${id}`);
        if (mounted) setData(data);
      } catch (e) {
        if (mounted) setErr('Erro ao carregar detalhes.');
        console.error(e);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  const lom = useMemo(() => (data?.metadata?.lom || data?.metadata || {}), [data]);

  const keywords = lom?.general?.keyword || [];
  const contribute = (lom?.lifecycle?.contribute || [])[0] || {};
  const edu = lom?.educational || {};
  const tech = lom?.technical || {};

  const title = data?.object?.title || '—';
  const desc  = data?.object?.description || lom?.general?.description || '';
  const thumb = lom?.general?.thumbnail || data?.metadata?.thumbnailUrl || '';
  const createdAt = data?.object?.created_at ? new Date(data.object.created_at).toLocaleDateString() : '';

  function goFilterByKeyword(k) {
    const lomFilters = { 'lom.general.keyword': { $in: [k] } };
    navigate(`/search?lomFilters=${encodeURIComponent(JSON.stringify(lomFilters))}`);
  }

  if (err) return <div className="p-6 text-red-600">{err}</div>;
  if (!data) return <div className="p-6">Carregando…</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-sky-700 text-white">
        <div className="mx-auto max-w-6xl px-4 py-8 md:py-12 grid md:grid-cols-3 gap-6 items-center">
          <div className="md:col-span-2">
            <div className="text-sm opacity-90">
              {data.object.category || '—'} &nbsp;|&nbsp; {createdAt}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mt-1">{title}</h1>
            <div className="mt-3 flex flex-wrap gap-2">
              {(keywords || []).slice(0, 6).map(k => (
                <button
                  key={k}
                  onClick={() => goFilterByKeyword(k)}
                  className="text-xs bg-white/20 hover:bg-white/30 rounded-full px-2 py-1"
                  title="Filtrar por tópico"
                >
                  {k}
                </button>
              ))}
            </div>
          </div>
          <div className="aspect-video bg-white/10 rounded-lg overflow-hidden">
            {thumb ? (
              <img className="w-full h-full object-cover" src={thumb} alt={title} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/80">
                Sem imagem
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <h2 className="text-xl font-semibold">Descrição do Curso</h2>
          <p className="mt-2 text-gray-700 whitespace-pre-line">
            {desc || 'Sem descrição.'}
          </p>
        </div>

        <aside className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold">Informações</h3>
            <dl className="mt-2 text-sm text-gray-700 space-y-1">
              <div className="flex gap-2">
                <dt className="min-w-[110px] text-gray-500">Autor/Entidade:</dt>
                <dd>{contribute?.entity || '—'}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="min-w-[110px] text-gray-500">Papel:</dt>
                <dd>{contribute?.role || '—'}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="min-w-[110px] text-gray-500">Interatividade:</dt>
                <dd>{edu?.interactivityType || '—'}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="min-w-[110px] text-gray-500">Tipo de Recurso:</dt>
                <dd>{edu?.learningResourceType || '—'}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="min-w-[110px] text-gray-500">Dificuldade:</dt>
                <dd>{edu?.difficulty || '—'}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="min-w-[110px] text-gray-500">Formato:</dt>
                <dd>{tech?.format || '—'}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="min-w-[110px] text-gray-500">Tamanho (bytes):</dt>
                <dd>{tech?.size || '—'}</dd>
              </div>
            </dl>

            <div className="mt-4 flex flex-wrap gap-2">
              <a
                className="bg-sky-600 hover:bg-sky-700 text-white text-sm px-3 py-2 rounded"
                href={data.object.file_path}
                target="_blank"
                rel="noreferrer"
              >
                Abrir / Baixar
              </a>
              <button
                onClick={() => navigate(-1)}
                className="bg-gray-200 hover:bg-gray-300 text-sm px-3 py-2 rounded"
              >
                Voltar
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold mb-2">Tópicos</h3>
            <div className="flex flex-wrap gap-2">
              {(keywords || []).map(k => (
                <button
                  key={k}
                  onClick={() => goFilterByKeyword(k)}
                  className="text-xs bg-gray-100 hover:bg-gray-200 rounded-full px-2 py-1"
                  title="Filtrar por tópico"
                >
                  {k}
                </button>
              ))}
              {(!keywords || keywords.length === 0) && <p className="text-sm text-gray-500">Sem tópicos.</p>}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
