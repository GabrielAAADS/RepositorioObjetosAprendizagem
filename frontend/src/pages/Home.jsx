import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import ObjectCard from '../components/ObjectCards';
import BackTopButton from '../components/BackTopButton';
import AutoCarouselRow from '../components/AutoCarouselRow';
import styles from '../components/Home.module.css';

import blocksLeft from '../assets/blocksLeft.svg';
import blocksRight from '../assets/blocksRight.svg';
import tabletBoy from '../assets/tabletBoy.png';
import { Import } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const [query, setQuery] = useState(sp.get('q') || '');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const [popular, setPopular] = useState([]);
  const [latest, setLatest] = useState([]);
  const [chips, setChips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    let alive = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [oRes, fRes] = await Promise.all([
          api.get('/objetos', { params: { limit: 48, offset: 0 } }),
          api.get('/objetos/facets'),
        ]);

        if (!alive) return;

        const objs = Array.isArray(oRes.data?.objects) ? oRes.data.objects : [];
        const pop = [...objs].sort((a, b) => (b.ratingAvg || 0) - (a.ratingAvg || 0)).slice(0, 12);
        const lat = [...objs].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 12);

        const facets = fRes.data?.facets || {};
        const keywords = (facets.keywords || []).sort((a, b) => b.count - a.count).slice(0, 6).map(x => x.value);
        const contexts = (facets.context || []).sort((a, b) => b.count - a.count).slice(0, 4).map(x => x.value);

        setPopular(pop);
        setLatest(lat);
        setChips([...keywords, ...contexts].slice(0, 10));
      } catch (e) {
        console.error("Erro ao buscar dados:", e);
      } finally {
        if (alive) setLoading(false);
      }
    };
    fetchData();
    return () => { alive = false; };
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const term = query.trim();
    navigate(term ? `/search?q=${encodeURIComponent(term)}` : '/search');
  };

  return (
    <div className={styles.pageContainer}>
      {/* HERO */}
      <section className={styles.hero}>
        <div className={`${styles.sectionContainer} ${styles.heroContent}`}>
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
        <div className={styles.leftImage}><img src={blocksLeft} alt="" /></div>
        <div className={styles.rightImage}><img src={blocksRight} alt="" /></div>
      </section>

      {/* OBJETOS POPULARES */}
      <section className={`${styles.section} ${styles.sectionGray}`}>
        <div className={styles.sectionContainer}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>Objetos Populares</h2>
              <p className={styles.sectionSubtitle}>Encontre os objetos mais bem avaliados pela comunidade.</p>
            </div>
          </div>
          <nav className={styles.categoryNav}>
            <div className={styles.categoryChips}>
              {chips.map((c, i) => (
                <button key={`${c}-${i}`} className={styles.categoryBtn} onClick={() => navigate(`/search?q=${encodeURIComponent(c)}`)}>
                  {c}
                </button>
              ))}
            </div>
            {!isMobile && <Link to="/search" className={styles.seeAllBtn}>Ver todos os objetos</Link>}
          </nav>
          {loading ? <div className={styles.loading}>Carregando…</div> : (
            <div className={styles.objectsGrid}>
              <AutoCarouselRow items={popular} speed={28} gap={20} dir="ltr" minItemWidth={320} renderItem={(obj) => <ObjectCard key={obj.id} object={obj} />} />
            </div>
          )}
          {isMobile && <Link to="/search" className={styles.ctaMobile}>Ver todos os objetos</Link>}
        </div>
      </section>

      {/* POR QUE UTILIZAR? */}
      <section className={styles.section}>
        <div className={`${styles.sectionContainer} ${styles.educationGrid}`}>
          <div className={styles.educationTextContent}>
            <h2 className={styles.sectionTitle}>Por Que Utilizar <span>Objetos</span> Educativos no Ensino?</h2>
            <p className={styles.sectionSubtitle}>Explore uma coleção de objetos interativos para reforçar o aprendizado de forma divertida.</p>
            <ul className={styles.learnList}>
              <li><span>1</span> <strong>Aprendizado Interativo:</strong> Torna o ensino mais envolvente e dinâmico.</li>
              <li><span>2</span> <strong>Fácil de Usar:</strong> Basta abrir no PowerPoint e começar a jogar!</li>
              <li><span>3</span> <strong>100% Gratuito:</strong> Baixe e utilize sem custos para fins educacionais.</li>
              <li><span>4</span> <strong>Para Todas as Idades:</strong> Jogos para ensino fundamental e médio.</li>
            </ul>
          </div>
          <div className={styles.educationImageContainer}>
            <img src={tabletBoy} alt="Menino utilizando um tablet para aprender" className={styles.educationImage} />
          </div>
        </div>
      </section>

      {/* OBJETOS EM DESTAQUE */}
      <section className={`${styles.section} ${styles.sectionGray}`}>
        <div className={styles.sectionContainer}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>Objetos em Destaque</h2>
              <p className={styles.sectionSubtitle}>Os mais recentes do nosso acervo.</p>
            </div>
            {!isMobile && <Link to="/search" className={styles.seeAllBtn}>Ver todos os objetos</Link>}
          </div>
          {loading ? <div className={styles.loading}>Carregando…</div> : (
            <div className={styles.objectsGrid}>
              <AutoCarouselRow items={latest} speed={24} gap={20} dir="rtl" minItemWidth={320} renderItem={(obj) => <ObjectCard key={obj.id} object={obj} />} />
            </div>
          )}
          {isMobile && <Link to="/search" className={styles.ctaMobile}>Ver todos os objetos</Link>}
        </div>
      </section>

      {/* COMO FUNCIONA? */}
      <section className={styles.section}>
        <div className={`${styles.sectionContainer} ${styles.howItWorksGrid}`}>
          <div className={styles.howItWorksLeft}>
            <h2 className={styles.sectionTitle}>Como Funciona?</h2>
            <p className={styles.sectionSubtitle}>Nosso processo é simples e direto para você começar a usar os objetos educativos e tornar a aula muito mais interativa.</p>
            <button className={styles.howItWorksBtn} onClick={() => navigate('/search')}>Quero Começar!</button>
          </div>
          <div className={styles.stepsContainer}>
            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>1</div>
              <div className={styles.stepContent}>
                <h4>Explore os Objetos</h4>
                <p>Escolha entre uma variedade de jogos educativos, com temas como geografia, matemática e ciências.</p>
              </div>
            </div>
            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>2</div>
              <div className={styles.stepContent}>
                <h4>Baixe o Arquivo</h4>
                <p>Baixe o objeto de forma rápida, compatível com PowerPoint ou LibreOffice. Simples e sem complicações!</p>
              </div>
            </div>
            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>3</div>
              <div className={styles.stepContent}>
                <h4>Jogue e Aprenda</h4>
                <p>Jogue com seus alunos de forma individual ou em grupo. Promova um aprendizado ativo e divertido.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <BackTopButton />
    </div>
  );
}
