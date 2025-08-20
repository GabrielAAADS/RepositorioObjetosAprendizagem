import { Link, NavLink, useNavigate } from 'react-router-dom';

const linkCls = ({ isActive }) =>
  `text-sm ${isActive ? 'text-indigo-600 font-medium' : 'text-gray-700 hover:text-black'}`;

export default function SiteHeader() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const logout = () => {
    localStorage.removeItem('token');
    navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl">
          <span className="w-8 h-8 rounded-full bg-indigo-600 text-white grid place-items-center">R</span>
          ROVA
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <NavLink to="/about" className={linkCls}>Sobre</NavLink>
          <NavLink to="/help" className={linkCls}>Ajuda & FAQ</NavLink>
          <NavLink to="/contact" className={linkCls}>Contato</NavLink>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            to="/objects/new"
            className="hidden sm:inline-flex bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded"
          >
            + Novo objeto
          </Link>
          <Link
            to="/search"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded"
          >
            Buscar
          </Link>
          {token ? (
            <button onClick={logout} className="ml-2 text-sm text-gray-600 hover:text-black">Sair</button>
          ) : (
            <Link to="/login" className="ml-2 text-sm text-gray-600 hover:text-black">Entrar</Link>
          )}
        </div>
      </div>
    </header>
  );
}
