import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import ObjectCard from '../components/ObjectCards';
import BackTopButton from '../components/BackTopButton';
import styles from '../components/Home.module.css';
import AutoCarouselRow from '../components/AutoCarouselRow';

import blocksLeft from '../assets/blocksLeft.svg';
import blocksRight from '../assets/blocksRight.svg';
import tabletBoy from '../assets/tabletBoy.png';

export default function Home() {
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const [query, setQuery] = useState(sp.get('q') || '');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 767);

  const [popular, setPopular] = useState([]); 
  const [latest, setLatest] = useState([]);  
  const [chips, setChips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const onR = () => setIsMobile(window.innerWidth <= 767);
    window.addEventListener('resize', onR);
    return () => window.removeEventListener('resize', onR);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const [oRes, fRes] = await Promise.all([
          api.get('/objetos', { params: { limit: 48, offset: 0 } }),
          api.get('/objetos/facets'),
        ]);

        const objs = Array.isArray(oRes.data?.objects) ? oRes.data.objects : [];

        const pop = [...objs]
          .sort((a, b) => (b.ratingAvg || 0) - (a.ratingAvg || 0))
          .slice(0, 12);

        const lat = [...objs]
          .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
          .slice(0, 12);

        const facets = fRes.data?.facets || {};
        const keywords = (facets.keywords || [])
          .sort((a, b) => (b.count || 0) - (a.count || 0))
          .slice(0, 6)
          .map((x) => x.value);
        const contexts = (facets.context || [])
          .sort((a, b) => (b.count || 0) - (a.count || 0))
          .slice(0, 4)
          .map((x) => x.value);

        if (!alive) return;
        setPopular(pop);
        setLatest(lat);
        setChips([...keywords, ...contexts].slice(0, 10));
      } catch (e) {
        console.error(e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const term = query.trim();
    navigate(term ? `/search?q=${encodeURIComponent(term)}` : '/search');
  };

  return (
    <div id="hero">
      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.container}>
          <span className={styles.badge}>Biblioteca com dezenas de objetos educativos!</span>
          <h1 className={styles.title}>
            Aprenda Brincando com <span className={styles.highlight}>Objetos</span> Educacionais Interativos!
          </h1>
          <p className={styles.subtitle}>
            Explore uma coleção de objetos interativos para reforçar o aprendizado de forma divertida.
          </p>

          <form onSubmit={handleSearch} className={styles.search}>
            <input
              type="text"
              placeholder="Pesquise por tema ou disciplina..."
              className={styles.input}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit" className={styles.button}>Buscar</button>
          </form>
        </div>
        <div className={styles.leftImage}>
          <img src={blocksLeft} alt="" />
        </div>
        <div className={styles.rightImage}>
          <img src={blocksRight} alt="" />
        </div>
      </section>

      {/* POPULARES */}
      <section id="popular" className={`${styles.popularSection} ${styles.content}`}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Objetos Populares</h2>
          <p className={styles.sectionSubtitle}>Encontre os objetos mais bem avaliados</p>
        </div>

        <nav className={styles.categoryNav}>
          <div>
            {chips.map((c, i) => (
              <button
                key={`${c}-${i}`}
                className={styles.categoryBtn}
                onClick={() => navigate(`/search?q=${encodeURIComponent(c)}`)}
              >
                {c}
              </button>
            ))}
          </div>
          {!isMobile && <Link to="/search" className={styles.seeAllBtn}>Ver todos os objetos</Link>}
        </nav>

        {loading ? (
          <div className={styles.loading}>Carregando…</div>
        ) : (
          <div className={styles.objectsGrid}>
            <AutoCarouselRow
              items={popular}       
              speed={28}
              gap={20}
              dir="ltr"
              minItemWidth={320}
              renderItem={(obj) => <ObjectCard key={obj.id} object={obj} />}
            />
          </div>
        )}

        {isMobile && <Link to="/search" className={`${styles.cta} ${styles.ctaMobile}`}>Ver todos os objetos</Link>}
      </section>

      <section id="use" className="content">
        <div className={styles.educationSection}>
          <div className={styles.leftContent}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                Por Que Utilizar <span>Objetos</span> Educativos no Ensino?
              </h2>
              <p className={styles.sectionSubtitle}>
                Explore uma coleção de objetos interativos para reforçar o aprendizado de forma divertida.
              </p>
            </div>
            <ul className={styles.learnList}>
              <li><span>1</span> Aprendizado Interativo – Torna o ensino mais envolvente e dinâmico.</li>
              <li><span>2</span> Fácil de Usar – Basta abrir no PowerPoint e começar a jogar!</li>
              <li><span>3</span> 100% Gratuito – Baixe e utilize sem custos.</li>
              <li><span>4</span> Para Todas as Idades – Jogos para ensino fundamental e médio.</li>
            </ul>
          </div>

          <div className={styles.rightContent}>
            <img
              src={tabletBoy}
              alt="Menino com tablet"
              className={styles.heroImage}
            />
          </div>
        </div>
      </section>

      <section id="highlight" className={`${styles.popularSection} ${styles.content}`}>
        <div className={styles.sectionHeader} style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <h2 className={styles.sectionTitle}>Objetos em Destaque</h2>
            <p className={styles.sectionSubtitle}>Os mais recentes do acervo</p>
          </div>
          {!isMobile && <Link to="/search" className={styles.seeAllBtn}>Ver todos os objetos</Link>}
        </div>

        {loading ? (
          <div className={styles.loading}>Carregando…</div>
        ) : (
          <div className={styles.objectsGrid}>
            <AutoCarouselRow
              items={latest}     
              speed={24}
              gap={20}
              dir="rtl"
              minItemWidth={320}
              renderItem={(obj) => <ObjectCard key={obj.id} object={obj} />}
            />
          </div>
        )}

        {isMobile && <Link to="/search" className={`${styles.cta} ${styles.ctaMobile}`}>Ver todos os objetos</Link>}
      </section>

      <section id="howWorks" className={`${styles.howItWorksSection} ${styles.content}`}>
        <div className={styles.howItWorksContainer}>
          <div className={styles.howItWorksLeft}>
            <h2 className={styles.howItWorksTitle}>Como Funciona?</h2>
            <p className={styles.howItWorksSubtitle}>
              Nosso processo é simples e direto para você começar a usar os
              objetos educativos e tornar a aula muito mais interativa e divertida.
            </p>
            <button className={styles.howItWorksBtn}>
              Quero Começar!
            </button>
          </div>

          <div className={styles.howItWorksRight}>
            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>1</div>
              <div className={styles.stepContent}>
                <h4>Explore os Objetos</h4>
                <p>
                  Escolha entre uma variedade de jogos educativos, com temas como geografia,
                  matemática e ciências. Todos feitos para engajar os alunos.
                </p>
              </div>
            </div>

            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>2</div>
              <div className={styles.stepContent}>
                <h4>Baixe o Objeto</h4>
                <p>
                  Baixe o objeto de forma rápida e fácil, compatível com PowerPoint ou LibreOffice.
                  Simples e sem complicações!
                </p>
              </div>
            </div>

            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>3</div>
              <div className={styles.stepContent}>
                <h4>Jogue e Aprenda</h4>
                <p>
                  Jogue com seus alunos de uso de forma individual. Aprendizado
                  ativo e interativo com seus objetos.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <BackTopButton />
    </div>
  );
}
