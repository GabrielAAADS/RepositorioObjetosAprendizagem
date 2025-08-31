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

const norm = (s) => String(s || '').trim().toLowerCase();

const BAD_KEYWORDS = new Set([
  'jogo', 'game', 'games', 'atividade', 'atividades', 'lesson', 'quiz', 'presentation',
  'ppt', 'pptx', 'pptm', 'slide', 'slides',
  '1', '2', '3', '4', '5'
]);

const PT_CONTEXT = {
  'primary education': 'Ensino Fundamental',
  'primary': 'Ensino Fundamental',
  'secondary education': 'Ensino Médio',
  'secondary': 'Ensino Médio',
  'higher education': 'Ensino Superior',
  'higher-education': 'Ensino Superior',
  'school': 'Escolar',
  'university': 'Universidade',
  'training': 'Treinamento',
};

const unique = (arr, keyFn = (x) => x) => {
  const seen = new Set(); const out = [];
  for (const v of arr) { const k = keyFn(v); if (!seen.has(k)) { seen.add(k); out.push(v); } }
  return out;
};

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

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

  const hasTitle = (o) => (o?.title || '').trim().length >= 1;

  const buildChipsFromObjects = (objs = []) => {
    const kwCount = new Map();
    for (const o of objs) {
      const gk = o?.metadata?.general?.keyword;
      const ck = o?.metadata?.classification?.keyword;
      const push = (val) => {
        if (val == null) return;
        const raw = String(val).trim();
        const n = norm(raw);
        if (!raw) return;
        if (raw.length < 3) return;
        if (/^\d+$/.test(raw)) return;
        if (BAD_KEYWORDS.has(n)) return;
        kwCount.set(n, (kwCount.get(n) || 0) + 1);
      };
      if (Array.isArray(gk)) gk.forEach(push); else push(gk);
      if (Array.isArray(ck)) ck.forEach(push); else push(ck);
    }
    const kwChips = [...kwCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([n, count]) => ({
        kind: 'keyword',
        value: n,
        label: n.charAt(0).toUpperCase() + n.slice(1),
        count
      }));

    const ctxCount = new Map();
    for (const o of objs) {
      const ctx = o?.metadata?.educational?.context;
      const arr = Array.isArray(ctx) ? ctx : (ctx ? [ctx] : []);
      for (const c of arr) {
        const n = norm(String(c).trim());
        if (!n) continue;
        ctxCount.set(n, (ctxCount.get(n) || 0) + 1);
      }
    }
    const ctxChips = [...ctxCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([n, count]) => ({
        kind: 'context',
        value: n,
        label: PT_CONTEXT[n] || (n.charAt(0).toUpperCase() + n.slice(1)),
        count
      }));

    return unique([...kwChips, ...ctxChips], (x) => `${x.kind}:${x.value}`);
  };

  const rankTop5 = (list) => {
    const sorted = [...list].sort((a, b) => {
      const ar = Number(a.ratingAvg || 0), br = Number(b.ratingAvg || 0);
      if (br !== ar) return br - ar;
      const ac = Number(a.ratingCount || 0), bc = Number(b.ratingCount || 0);
      if (bc !== ac) return bc - ac;
      const ad = new Date(a.created_at || 0).getTime();
      const bd = new Date(b.created_at || 0).getTime();
      return bd - ad;
    });
    return sorted.slice(0, Math.min(5, sorted.length));
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/objetos', { params: { limit: 200, offset: 0 } });
        const objs = Array.isArray(data?.objects) ? data.objects : [];
        const valid = objs.filter(hasTitle);

        const top5 = rankTop5(valid);

        const random5 = shuffle(valid).slice(0, Math.min(5, valid.length));

        const quickChips = buildChipsFromObjects(valid);

        if (!alive) return;
        setPopular(top5);
        setLatest(random5);
        setChips(quickChips);
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

  const goWithChip = (chip) => {
    if (chip.kind === 'context') {
      navigate(`/search?context=${encodeURIComponent(chip.value)}`);
    } else {
      navigate(`/search?keyword=${encodeURIComponent(chip.value)}`);
    }
  };

  return (
    <div id="hero">
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
        <div className={styles.leftImage}><img src={blocksLeft} alt="" /></div>
        <div className={styles.rightImage}><img src={blocksRight} alt="" /></div>
      </section>

      <section id="popular" className={`${styles.popularSection} ${styles.content}`}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Objetos Populares</h2>
          <p className={styles.sectionSubtitle}>Encontre os objetos mais bem avaliados</p>
        </div>

        <nav className={styles.categoryNav}>
          <div>
            {chips.map((chip, i) => (
              <button
                key={`${chip.kind}-${chip.value}-${i}`}
                className={styles.categoryBtn}
                onClick={() => goWithChip(chip)}
                title={chip.kind === 'context'
                  ? `Filtrar por contexto: ${chip.label}`
                  : `Filtrar por palavra-chave: ${chip.label}`}
              >
                {chip.label}
              </button>
            ))}
          </div>
          {!isMobile && <Link to="/search" className={styles.seeAllBtn}>Ver todos os objetos</Link>}
        </nav>

        {loading ? (
          <div className={styles.loading}>Carregando…</div>
        ) : (
          <div className={styles.carouselWrap}>
            <AutoCarouselRow
              items={popular}
              speed={28}
              gap={20}
              dir="ltr"
              minItemWidth={320}
              renderItem={(o) => <ObjectCard key={o.id} obj={o} />}
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
            <img src={tabletBoy} alt="Menino com tablet" className={styles.heroImage} />
          </div>
        </div>
      </section>

      <section id="highlight" className={`${styles.popularSection} ${styles.content}`}>
        <div className={styles.sectionHeader} style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <h2 className={styles.sectionTitle}>Objetos em Destaque</h2>
            <p className={styles.sectionSubtitle}>Seleção aleatória do acervo</p>
          </div>
          {!isMobile && <Link to="/search" className={styles.seeAllBtn}>Ver todos os objetos</Link>}
        </div>

        {loading ? (
          <div className={styles.loading}>Carregando…</div>
        ) : (
          <div className={styles.carouselWrap}>
            <AutoCarouselRow
              items={latest}
              speed={24}
              gap={20}
              dir="rtl"
              minItemWidth={320}
              renderItem={(o) => <ObjectCard key={o.id} obj={o} />}
            />
          </div>
        )}

        {isMobile && <Link to="/search" className={`${styles.cta} ${styles.ctaMobile}`}>Ver todos os objetos</Link>}
      </section>

      {/* COMO FUNCIONA */}
      <section id="howWorks" className={`${styles.howItWorksSection} ${styles.content}`}>
        <div className={styles.howItWorksContainer}>
          <div className={styles.howItWorksLeft}>
            <h2 className={styles.howItWorksTitle}>Como Funciona?</h2>
            <p className={styles.howItWorksSubtitle}>
              Nosso processo é simples e direto para você começar a usar os
              objetos educativos e tornar a aula muito mais interativa e divertida.
            </p>
            <button className={styles.howItWorksBtn}>Quero Começar!</button>
          </div>

          <div className={styles.howItWorksRight}>
            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>1</div>
              <div className={styles.stepContent}>
                <h4>Explore os Objetos</h4>
                <p>Escolha entre uma variedade de jogos educativos, com temas como geografia,
                  matemática e ciências. Todos feitos para engajar os alunos.</p>
              </div>
            </div>

            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>2</div>
              <div className={styles.stepContent}>
                <h4>Baixe o Objeto</h4>
                <p>Baixe o objeto de forma rápida e fácil, compatível com PowerPoint ou LibreOffice.
                  Simples e sem complicações!</p>
              </div>
            </div>

            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>3</div>
              <div className={styles.stepContent}>
                <h4>Jogue e Aprenda</h4>
                <p>Jogue com seus alunos de uso de forma individual. Aprendizado
                  ativo e interativo com seus objetos.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <BackTopButton />
    </div>
  );
}
