import styles from './SiteFooter.module.css';

export default function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.brand}>
            <div className={styles.logo}>
              <img src="logo.svg" alt="Logo" />
            </div>
            <p className={styles.brandDescription}>
              Facilitando o Aprendizado Com Objetos Digitais
            </p>
          </div>

          <div className={styles.linksSection}>
            <div className={styles.linkColumn}>
              <h4 className={styles.linkTitle}>Links Relevantes</h4>
              <ul className={styles.linkList}>
                <li><a href="#hero" className={styles.link}>Home</a></li>
                <li><a href="#popular" className={styles.link}>Objetos Populares</a></li>
                <li><a href="#use" className={styles.link}>Por Que Utilizar?</a></li>
                <li><a href="/howWorks" className={styles.link}>Como Funciona</a></li>
              </ul>
            </div>

            <div className={styles.linkColumn}>
              <h4 className={styles.linkTitle}>Termos de Uso</h4>
              <ul className={styles.linkList}>
                <li><a href="#!" className={styles.link}>Terms of Services</a></li>
                <li><a href="#!" className={styles.link}>Privacy Policy</a></li>
              </ul>
            </div>

            <div className={styles.linkColumn}>
              <h4 className={styles.linkTitle}>Redes Sociais</h4>
              <ul className={styles.linkList}>
                <li><a href="#!" className={styles.link}>Facebook</a></li>
                <li><a href="#!" className={styles.link}>Instagram</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className={styles.bottom}>
          <div className={styles.copyright}>
            © 2025 Todos os direitos reservados.
          </div>
          <div className={styles.developedBy}>
            🚀 Desenvolvido por Isaelson Trajano e Gabriel Alves
          </div>
        </div>
      </div>
    </footer>
  );
}