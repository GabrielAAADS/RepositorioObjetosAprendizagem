import React from 'react';
import SiteHeader from '../components/SiteHeader';

export default function Contact() {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gray-100 border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
          <h1 className="text-2xl font-semibold">Contato</h1>
          <p className="text-sm text-gray-600">Perguntas frequentes e suporte.</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-10 grid lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold">Perguntas frequentes</h3>
            <p className="text-sm text-gray-700 mt-2">
              O ROVA é um repositório aberto de materiais educacionais. Você pode navegar, baixar
              e reutilizar (respeitando os direitos definidos pelo autor).
            </p>
          </div>

          <div>
            <h3 className="font-semibold">Registro é obrigatório?</h3>
            <p className="text-sm text-gray-700 mt-2">
              Não. É possível explorar e baixar sem cadastro. Para enviar objetos, faça login.
            </p>
          </div>

          <div>
            <h3 className="font-semibold">Política de uso</h3>
            <p className="text-sm text-gray-700 mt-2">
              Sempre cite a fonte ao compartilhar. Em caso de dúvida sobre licenças, fale conosco em{' '}
              <a href="mailto:contato@rova.edu" className="text-blue-600 underline">contato@rova.edu</a>.
            </p>
          </div>
        </div>

        <div className="w-full">
          <img
            src="https://images.unsplash.com/photo-1519452575417-564c1401ecc0?q=80&w=1400&auto=format&fit=crop"
            alt="Campus"
            className="w-full rounded border object-cover"
          />
        </div>
      </section>
    </div>
  );
}
