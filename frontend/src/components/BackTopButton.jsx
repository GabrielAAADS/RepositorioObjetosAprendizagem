import { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';

export default function BackTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isDesktop = window.innerWidth > 768;
      setVisible(isDesktop && window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    visible && (
      <button
        onClick={scrollToTop}
        style={{
          position: 'fixed',
          bottom: '2.5rem',
          right: '2.25rem',
          backgroundColor: 'var(--primary)',
          color: 'var(--white)',
          border: 'none',
          borderRadius: '50%',
          width: '3.5rem',
          height: '3.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
          zIndex: 1000,
        }}
        aria-label="Back to top"
      >
        <ChevronUp size={28} />
      </button>
    )
  );
}
