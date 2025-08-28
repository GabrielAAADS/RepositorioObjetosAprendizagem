import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import { ChevronRight } from 'lucide-react';

import styles from "../components/Home.module.css";

export default function Home() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [_latest, setLatest] = useState([]);
  const [_loading, setLoading] = useState(true);
  const [_err, setErr] = useState('');

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 767);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 767);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const LIMIT = 12;

  // --- busca objetos ---
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setErr('');

        const qTitle = searchParams.get('q') || undefined;

        const { data } = await api.get('/objetos', {
          params: {
            title: qTitle,
            limit: LIMIT,
            offset: 0,
          },
        });

        const arr = Array.isArray(data?.objects) ? data.objects : [];
        if (mounted) setLatest(arr.filter(Boolean));
      } catch (e) {
        console.error(e);
        if (mounted) setErr('Erro ao carregar objetos.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [searchParams]);

  // --- handler da busca ---
  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    navigate(`?${params.toString()}`);
  };

  return (
    <div id="hero">
      <section className={styles.hero}>
        <div className={styles.container}>
          <span className={styles.badge}>
            Biblioteca com dezenas de objetos educativos!
          </span>

          <h1 className={styles.title}>
            Aprenda Brincando com{' '}
            <span className={styles.highlight}>Objetos</span> Educacionais
            Interativos!
          </h1>

          <p className={styles.subtitle}>
            Explore uma coleção de objetos interativos para reforçar o
            aprendizado de forma divertida.
          </p>

          <form onSubmit={handleSearch} className={styles.search}>
            <input
              type="text"
              placeholder="Pesquise por tema ou disciplina..."
              className={styles.input}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit" className={styles.button}>
              Buscar
            </button>
          </form>
        </div>

        <div className={styles.leftImage}>
          <img src="src\assets\blocksLeft.svg" />
        </div>
        <div className={styles.rightImage}>
          <img src="src\assets\blocksRight.svg" />
        </div>
      </section>

      <section
        id="popular"
        className={`${styles.popularSection} ${styles.content}`}
      >
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Objetos Populares</h2>
          <p className={styles.sectionSubtitle}>
            Encontre os objetos mais baixados e recomendados por educadores
          </p>
        </div>

        <nav className={styles.categoryNav}>
          <div>
            <button className={styles.categoryBtn}>Matemática</button>
            <button className={styles.categoryBtn}>Língua Portuguesa</button>
            <button className={styles.categoryBtn}>Ciências</button>
            <button className={styles.categoryBtn}>Geografia</button>
            <button className={styles.categoryBtn}>História</button>
            <button className={styles.categoryBtn}>Inglês</button>
          </div>
          {!isMobile && (
            <Link to="/search" className={styles.cta}>
              Ver Todos os Objetos
            </Link>
          )}
        </nav>

        <div className={styles.objectsGrid}>
          <div className={styles.objectCard}>
            <div className={styles.cardImage}>
              <div className={styles.cardImageContent}>
                <img src="image.jpg" alt="" />
              </div>
            </div>
            <div className={styles.cardContent}>
              <div className={styles.cardBadge}>JOGO</div>
              <h4>Aprendendo Usar os Porquês de Forma Fácil e Divertida</h4>
              <p>
                Teste seus conhecimentos sobre as regras do Brasil e do mundo.
              </p>
              <button className={styles.detailsBtn}>
                Ver Detalhes <ChevronRight size={24} />
              </button>
            </div>
          </div>

          <div className={styles.objectCard}>
            <div className={styles.cardImage}>
              <div className={styles.cardImageContent}>
                <img src="image2.jpg" alt="" />
              </div>
            </div>
            <div className={styles.cardContent}>
              <div className={styles.cardBadge}>JOGO</div>
              <h4>Bingo Divertido - Aprenda Brincando!</h4>
              <p>
                Testando conhecimentos de forma interativa com este jogo de
                bingo.
              </p>
              <button className={styles.detailsBtn}>
                Ver Detalhes <ChevronRight size={24} />
              </button>
            </div>
          </div>

          <div className={styles.objectCard}>
            <div className={styles.cardImage}>
              <div className={styles.cardImageContent}>
                <img src="image3.jpg" alt="" />
              </div>
            </div>
            <div className={styles.cardContent}>
              <div className={styles.cardBadge}>JOGO</div>
              <h4>Explorando os Biomas do Nosso País Brasil</h4>
              <p>Testando conhecimentos sobre os biomas em nosso território.</p>
              <button className={styles.detailsBtn}>
                Ver Detalhes <ChevronRight size={24} />
              </button>
            </div>
          </div>

          <div className={styles.objectCard}>
            <div className={styles.cardImage}>
              <div className={styles.cardImageContent}>
                <img src="image4.jpg" alt="" />
              </div>
            </div>
            <div className={styles.cardContent}>
              <div className={styles.cardBadge}>JOGO</div>
              <h4>Aprenda a Comparar os Números de Forma Divertida</h4>
              <p>Exercitando seus conhecimentos em comparação de números.</p>
              <button className={styles.detailsBtn}>
                Ver Detalhes <ChevronRight size={24} />
              </button>
            </div>
          </div>

          <div className={styles.objectCard}>
            <div className={styles.cardImage}>
              <div className={styles.cardImageContent}>
                <img src="image5.jpg" alt="" />
              </div>
            </div>
            <div className={styles.cardContent}>
              <div className={styles.cardBadge}>JOGO</div>
              <h4>Dominando o Português - Aprenda de Forma Divertida</h4>
              <p>Aprimere sua gramática e vocabulário com desafios musicais.</p>
              <button className={styles.detailsBtn}>
                Ver Detalhes <ChevronRight size={24} />
              </button>
            </div>
          </div>

          <div className={styles.objectCard}>
            <div className={styles.cardImage}>
              <div className={styles.cardImageContent}>
                <img src="image6.jpg" alt="" />
              </div>
            </div>
            <div className={styles.cardContent}>
              <div className={styles.cardBadge}>JOGO</div>
              <h4>CapitalGeo - Jogo das Capitais do Brasil</h4>
              <p>
                Teste seus conhecimentos sobre as capitais do Brasil e do mundo.
              </p>
              <button className={styles.detailsBtn}>
                Ver Detalhes <ChevronRight size={24} />
              </button>
            </div>
          </div>

          <div className={styles.objectCard}>
            <div className={styles.cardImage}>
              <div className={styles.cardImageContent}>
                <img src="image7.jpg" alt="" />
              </div>
            </div>
            <div className={styles.cardContent}>
              <div className={styles.cardBadge}>JOGO</div>
              <h4>
                Inglês Descomplicado - Aprende de Forma Rápida e Divertida
              </h4>
              <p>Melhore seu inglês com jogos interativos e divertidos.</p>
              <button className={styles.detailsBtn}>
                Ver Detalhes <ChevronRight size={24} />
              </button>
            </div>
          </div>

          <div className={styles.objectCard}>
            <div className={styles.cardImage}>
              <div className={styles.cardImageContent}>
                <img src="image8.jpg" alt="" />
              </div>
            </div>
            <div className={styles.cardContent}>
              <div className={styles.cardBadge}>JOGO</div>
              <h4>GCompris - Jogo Educacional para fundamental I</h4>
              <p>
                Atividades que ensinam matemática, leitura e ciências de forma
                divertida.
              </p>
              <button className={styles.detailsBtn}>
                Ver Detalhes <ChevronRight size={24} />
              </button>
            </div>
          </div>
        </div>
        {isMobile && (
          <Link to="/search" className={`${styles.cta} ${styles.ctaMobile}`}>
            Ver Todos os Objetos
          </Link>
        )}
      </section>

      <section id="use" className="content">
        <div className={styles.educationSection}>
          <div className={styles.leftContent}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                Por Que Utilizar <span>Objetos</span> Educativos no Ensino?
              </h2>
              <p className={styles.sectionSubtitle}>
                Explore uma coleção de objetos interativos para reforçar o
                aprendizado de forma divertida.
              </p>
            </div>
            <ul className={styles.learnList}>
              <li>
                <span>1</span> Aprendizado Interativo – Torna o ensino mais
                envolvente e dinâmico.
              </li>
              <li>
                <span>2</span> Fácil de Usar – Basta abrir no PowerPoint e
                começar a jogar!
              </li>
              <li>
                <span>3</span> 100% Gratuito – Baixe e utilize sem custos.
              </li>
              <li>
                <span>4</span> Para Todas as Idades – Jogos para ensino
                fundamental e médio.
              </li>
            </ul>
          </div>

          <div className={styles.rightContent}>
            <img
              src="src/assets/tabletBoy.png"
              alt="Menino com tablet"
              className={styles.heroImage}
            />
          </div>
        </div>
      </section>

      <section
        id="highlight"
        className={`${styles.popularSection} ${styles.content}`}
      >
        <div className={styles.sectionWrapper}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Objetos em Destaque</h2>
            <p className={styles.sectionSubtitle}>
              Encontre os objetos mais baixados e recomendados por educadores
            </p>
          </div>
          {!isMobile && (
            <Link to="/search" className={styles.cta}>
              Ver Todos os Objetos
            </Link>
          )}{' '}
        </div>
        <div className={styles.objectsGrid}>
          <div className={styles.objectCard}>
            <div className={styles.cardImage}>
              <div className={styles.cardImageContent}>
                <img src="image9.jpg" alt="" />
              </div>
            </div>
            <div className={styles.cardContent}>
              <div className={styles.cardBadge}>JOGO</div>
              <h4>As Estações do Ano - Descubra e Aprenda!</h4>
              <p>
                Explore as características de cada estação com um jogo
                interativo.
              </p>
              <button className={styles.detailsBtn}>
                Ver Detalhes <ChevronRight size={24} />
              </button>
            </div>
          </div>

          <div className={styles.objectCard}>
            <div className={styles.cardImage}>
              <div className={styles.cardImageContent}>
                <img src="image10.jpg" alt="" />
              </div>
            </div>
            <div className={styles.cardContent}>
              <div className={styles.cardBadge}>JOGO</div>
              <h4>Ensinando Matemática Com Jogo da Memória</h4>
              <p>Testando conhecimentos em matemática com jogo da memória.</p>
              <button className={styles.detailsBtn}>
                Ver Detalhes <ChevronRight size={24} />
              </button>
            </div>
          </div>

          <div className={styles.objectCard}>
            <div className={styles.cardImage}>
              <div className={styles.cardImageContent}>
                <img src="image1.jpg" alt="" />
              </div>
            </div>
            <div className={styles.cardContent}>
              <div className={styles.cardBadge}>JOGO</div>
              <h4>Jogo dos Sinônimos – Amplie seu Vocabulário</h4>
              <p>
                Encontre palavras com significados semelhantes e aprenda
                brincando.
              </p>
              <button className={styles.detailsBtn}>
                Ver Detalhes <ChevronRight size={24} />
              </button>
            </div>
          </div>

          <div className={styles.objectCard}>
            <div className={styles.cardImage}>
              <div className={styles.cardImageContent}>
                <img src="image12.jpg" alt="" />
              </div>
            </div>
            <div className={styles.cardContent}>
              <div className={styles.cardBadge}>JOGO</div>
              <h4>
                Encontre palavras com significados semelhantes e aprenda
                brincando.
              </h4>
              <p>
                Descubra as partes do corpo e suas funções de forma interativa e
                divertida.
              </p>
              <button className={styles.detailsBtn}>
                Ver Detalhes <ChevronRight size={24} />
              </button>
            </div>
          </div>
        </div>
        {isMobile && (
          <Link to="/search" className={`${styles.cta} ${styles.ctaMobile}`}>
            Ver Todos os Objetos
          </Link>
        )}
      </section>

      <section
        id="howWorks"
        className={`${styles.howItWorksSection} ${styles.content}`}
      >
        <div className={styles.howItWorksContainer}>
          <div className={styles.howItWorksLeft}>
            <h2 className={styles.howItWorksTitle}>Como Funciona?</h2>
            <p className={styles.howItWorksSubtitle}>
              Nosso processo é simples e direto para você começar a usar os
              objetos educativos e tornar a aula muito mais interativa e
              divertida.
            </p>
            <button className={styles.howItWorksBtn}>
              Quero Começar! <ChevronRight size={24} color={'#fff'} />
            </button>
          </div>

          <div className={styles.howItWorksRight}>
            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>1</div>
              <div className={styles.stepContent}>
                <h4>Explore os Objetos</h4>
                <p>
                  Escolha entre uma variedade de jogos educativos, com temas
                  como geografia, matemática e ciências. Todos feitos para
                  engajar os alunos.
                </p>
              </div>
            </div>

            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>2</div>
              <div className={styles.stepContent}>
                <h4>Baixe o Objeto</h4>
                <p>
                  Baixe o objeto de forma rápida e fácil, compatível com
                  PowerPoint ou LibreOffice. Simples e sem complicações!
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
    </div>
  );
}
