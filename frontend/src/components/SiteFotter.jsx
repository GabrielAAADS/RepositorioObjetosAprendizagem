export default function SiteFooter() {
  return (
    <footer className="border-t bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8 text-sm text-gray-600">
        <div className="flex flex-wrap justify-between gap-4">
          <p>© {new Date().getFullYear()} ROVA — Repositório de Objetos Virtuais de Aprendizagem</p>
          <div className="flex gap-4">
            <a className="hover:text-black" href="#!">Acessibilidade</a>
            <a className="hover:text-black" href="#!">Licença</a>
            <a className="hover:text-black" href="#!">Termos</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
