import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function NavBar() {
  const nav = useNavigate();
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={()=>nav('/')} className="font-bold text-xl">ROVA</button>
          <nav className="hidden md:flex gap-6 text-sm">
            <Link to="/about"  className="hover:underline">Sobre</Link>
            <Link to="/help"   className="hover:underline">Ajuda & FAQs</Link>
            <Link to="/contact"className="hover:underline">Contato</Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/objects/new" className="text-sm px-3 py-1.5 rounded bg-emerald-600 text-white">+ Novo objeto</Link>
          <Link to="/search" className="text-sm px-3 py-1.5 rounded border">Buscar</Link>
        </div>
      </div>
    </header>
  );
}
