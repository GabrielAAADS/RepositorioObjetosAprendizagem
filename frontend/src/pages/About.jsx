import React from 'react';
import { useNavigate } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader';

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gray-100 border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 flex items-center gap-3">
          <button
            onClick={() => navigate('/search')}
            title="Ir para busca de objetos"
            className="text-2xl"
          >
            🔍
          </button>
          <div>
            <h1 className="text-2xl font-semibold">Sobre o ROVA</h1>
            <p className="text-sm text-gray-600">Repositório de Objetos Virtuais de Aprendizagem.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-10 grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <p className="text-lg">
            Desde 2025, o ROVA vem criando novas oportunidades para estudantes e educadores,
            compartilhando Objetos Educacionais Abertos (OER) e impulsionando o acesso livre ao conhecimento.
          </p>
          <p className="text-lg">
            Nosso ecossistema cresce com conteúdo aberto, validações e metadados educacionais ricos,
            promovendo uma educação mais inclusiva e eficaz.
          </p>

          <div className="aspect-video bg-gray-100 border rounded grid place-items-center">
            <span className="text-gray-500">Espaço para vídeo de apresentação</span>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="border rounded p-4">
            <h3 className="font-semibold">Depoimentos</h3>
            <p className="text-sm text-gray-600 mt-2">
              “O ROVA tornou mais fácil encontrar e compartilhar jogos e atividades para minhas aulas.”
            </p>
            <p className="text-xs text-gray-500 mt-1">— Professora da rede pública</p>
          </div>
          <div className="border rounded p-4">
            <h3 className="font-semibold">Comece agora</h3>
            <p className="text-sm text-gray-600 mt-2">Busque um objeto por palavra-chave.</p>
            <button
              onClick={() => navigate('/search')}
              className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded"
            >
              Ir para Busca
            </button>
          </div>
        </aside>
      </section>
    </div>
  );
}
