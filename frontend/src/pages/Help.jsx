import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader';

export default function Help() {
  const navigate = useNavigate();

  const cards = [
    {
      title: 'Como começo no ROVA?',
      text: 'Use a página de busca e filtre por palavras-chave, papéis (professor/estudante) e contexto.',
      action: () => navigate('/search'),
      label: 'Ir para Busca',
    },
    {
      title: 'Upload de arquivos',
      text: 'Aceitamos PPT/PPTX/PPTM. Preencha os metadados para facilitar a descoberta.',
      action: () => navigate('/objects/new'),
      label: 'Enviar Objeto',
    },
    {
      title: 'Dúvidas sobre direitos',
      text: 'Verifique a seção “Rights” no cadastro para custos e restrições.',
      action: () => navigate('/contact'),
      label: 'Falar com a equipe',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gray-100 border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
          <h1 className="text-2xl font-semibold">Ajuda & Perguntas Frequentes</h1>
          <p className="text-sm text-gray-600">Encontre respostas rápidas e recursos úteis.</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-10 grid md:grid-cols-3 gap-6">
        {cards.map((c) => (
          <div key={c.title} className="border rounded p-6 bg-white">
            <h3 className="font-semibold">{c.title}</h3>
            <p className="text-sm text-gray-600 mt-2">{c.text}</p>
            <button
              onClick={c.action}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded"
            >
              {c.label}
            </button>
          </div>
        ))}
      </section>

      <section className="py-10 text-center">
        <h2 className="text-2xl font-semibold">Não encontrou o que procurava?</h2>
        <Link
          to="/contact"
          className="inline-block mt-4 bg-rose-600 hover:bg-rose-700 text-white px-5 py-2 rounded"
        >
          Entre em contato
        </Link>
      </section>
    </div>
  );
}
