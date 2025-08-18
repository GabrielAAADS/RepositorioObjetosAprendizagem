import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');

  const onSearch = (e) => {
    e.preventDefault();
    const term = q.trim();
    navigate(term ? `/search?q=${encodeURIComponent(term)}` : '/search');
  };

  return (
    <div className="bg-gray-50 flex flex-col">
      <section className="relative h-[56vh] min-h-[420px]">
        <img
          src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1600&auto=format&fit=crop"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/45" />

        <div className="relative z-10 h-full">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 h-full flex flex-col justify-center text-white">
            <h1 className="text-3xl md:text-4xl font-bold max-w-3xl">
              Descubra cursos, materiais e recursos de ensino
            </h1>

            <form onSubmit={onSearch} className="mt-6 flex flex-wrap gap-2 max-w-2xl">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Busque por título, palavra-chave etc."
                className="flex-1 min-w-[240px] rounded px-4 py-3 text-black"
              />
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded font-semibold">
                Buscar
              </button>
              <button
                type="button"
                onClick={() => navigate('/search')}
                className="bg-rose-600 hover:bg-rose-700 px-5 py-3 rounded font-semibold"
              >
                Explorar
              </button>
            </form>

            <div className="mt-6 bg-white/15 backdrop-blur p-5 rounded max-w-3xl">
              <h2 className="text-2xl font-bold">Desbloqueando conhecimento, empoderando mentes.</h2>
              <p className="mt-2 text-sm md:text-base">
                Repositório de Objetos Virtuais de Aprendizagem. Envie, pesquise, visualize e baixe
                objetos (PPT/PPTX/PPTM) com metadados educacionais.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 -mt-8 pb-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 grid md:grid-cols-2 gap-6">
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold">Você é novo no ROVA?</h3>
            <p className="text-gray-600 mt-2">
              Explore materiais pensados para estudantes e comece agora mesmo.
            </p>
            <div className="mt-4">
              <button
                onClick={() => navigate('/search?role=learner')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
              >
                Começar (Estudantes)
              </button>
            </div>
          </div>

          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold">Procurando materiais para ensino?</h3>
            <p className="text-gray-600 mt-2">
              Encontre objetos voltados a professores, com filtros de contexto, papel do usuário e mais.
            </p>
            <div className="mt-4">
              <button
                onClick={() => navigate('/search?role=teacher')}
                className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded"
              >
                Educadores: começar aqui
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-10">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate('/objects/new')}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          >
            + Novo Objeto
          </button>
          <button
            onClick={() => navigate('/search')}
            className="bg-gray-800 hover:bg-black text-white px-4 py-2 rounded"
          >
            🔍 Buscar Objetos
          </button>
        </div>
      </section>
    </div>
  );
}
