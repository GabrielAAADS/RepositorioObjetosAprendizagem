import { useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import styles from './SiteHeader.module.css';

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');

  const scrollToSection = (id) => {
    if (location.pathname !== '/') {
      navigate('/', { replace: false });
      requestAnimationFrame(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      });
    } else {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
    setOpen(false);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setOpen(false);
    navigate('/login', { replace: true });
  };

  const linkCls = ({ isActive }) =>
    `${styles.link} ${isActive ? styles.active : ''}`;

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <button onClick={() => setOpen(!open)} className={styles.menuBtn}>
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>

        <Link to="/" className={styles.logo}>
          <img src="logoShield.svg" alt="GAMERED" className={styles.logoImg} />
          <span className={styles.logoText}>GAMERED</span>
        </Link>

        <Link to="/search" className={styles.cta}>
          Acessar Objetos
        </Link>

        <Link to="/objects/new" className={styles.cta}>
          Publicar Objeto
        </Link>

        <nav className={styles.navDesktop}>
          <NavLink
            className={linkCls({})}
            onClick={() => scrollToSection('hero')}
          >
            Home
          </NavLink>
          <NavLink
            className={linkCls({})}
            onClick={() => scrollToSection('popular')}
          >
            Objetos Populares
          </NavLink>
          <NavLink
            className={linkCls({})}
            onClick={() => scrollToSection('use')}
          >
            Por Que Utilizar?
          </NavLink>
          <NavLink
            className={linkCls({})}
            onClick={() => scrollToSection('highlight')}
          >
            Objetos em Destaque
          </NavLink>
          <NavLink
            className={linkCls({})}
            onClick={() => scrollToSection('howWorks')}
          >
            Como Funciona
          </NavLink>
        </nav>

        {token ? (
          <button className={styles.link} onClick={logout}>Sair</button>
        ) : (
          <Link to="/login" className={styles.link} onClick={() => setOpen(false)}>Entrar</Link>
        )}
      </div>

      {open && (
        <div className={styles.menuMobile}>
          <button
            className={styles.link}
            onClick={() => scrollToSection('hero')}
          >
            Home
          </button>
          <button
            className={styles.link}
            onClick={() => scrollToSection('popular')}
          >
            Objetos Populares
          </button>
          <button
            className={styles.link}
            onClick={() => scrollToSection('use')}
          >
            Por Que Utilizar?
          </button>
          <button
            className={styles.link}
            onClick={() => scrollToSection('highlight')}
          >
            Objetos em Destaque
          </button>
          <button
            className={styles.link}
            onClick={() => scrollToSection('howWorks')}
          >
            Como Funciona
          </button>
          {token ? (
            <button className={styles.link} onClick={logout}>Sair</button>
          ) : (
            <Link to="/login" className={styles.link} onClick={() => setOpen(false)}>Entrar</Link>
          )}
        </div>
      )}
    </header>
  );
}
