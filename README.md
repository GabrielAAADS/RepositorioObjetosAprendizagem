# TCC II – ROVA – RepositorioObjetosAprendizagem
Repositório de Objetos Virtuais de Aprendizagem, criado em parceria com professores da UGCF e para cumprimento do TCC 2

Monorepo com **Frontend** (React + Tailwind) e **Backend** (Node.js + Express)

---

## 🚀 Comandos Essenciais

### 1. Preparar Monorepo

```bash
# Clonar repositório e acessar pasta
git clone git@github.com:SEU_USUARIO/tcc-rova.git
cd tcc-rova
```

### 2. Versão do Node (Windows)

```powershell
# Instalar/usar Node.js v18.16.0 via nvm-windows
gh repo clone coreybutler/nvm-windows
nvm install 18.16.0
nvm use 18.16.0
```

### 3. Instalar Hooks e Convenções de Commit

```bash
# Husky + Commitlint
git checkout main
npm install --save-dev husky @commitlint/cli @commitlint/config-conventional
npm run prepare       # cria pasta .husky/
npx husky add .husky/commit-msg "npx --no -- commitlint --edit \"$1\""
```

### 4. Configurar Lint & Format

```bash
# ESLint, Prettier, lint-staged
npm install --save-dev eslint prettier lint-staged
npx husky add .husky/pre-commit "npx lint-staged"
```

### 5. Instalar Dependências do Frontend

```bash
cd frontend
npm install
npm install axios
npm install --save-dev tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 6. Instalar Dependências do Backend

```bash
cd ../backend
npm install
npm install express cors dotenv pg bcrypt jsonwebtoken
npm install --save-dev nodemon
```

### 7. Rodar Ambiente de Desenvolvimento

```bash
# Frontend
dd frontend && npm run dev
# Backend
cd ../backend && npm run dev
```

---

## 📁 Função dos Principais Arquivos

* **.nvmrc**: define a versão Node padrão (v18.16.0).
* **.env.example**: modelo de variáveis de ambiente (frontend e backend).
* **.gitignore**: ignora node\_modules, .env, logs e arquivos de IDE.
* **.eslintrc.json** & **.prettierrc**: regras de lint e formatação.
* **commitlint.config.js**: valida mensagens conforme Conventional Commits.
* **.husky/**: scripts Git hooks — pre-commit (lint-staged) e commit-msg (commitlint).
* **vite.config.js** & **tailwind.config.js**: configurações de build e CSS no frontend.
* **postcss.config.js**: integra PostCSS ao Tailwind.
* **src/index.css**: importa `base`, `components` e `utilities` do Tailwind.
* **src/index.js (backend)**: carrega `.env` e inicia o servidor Express.
* **src/config/db.js**: define conexão com PostgreSQL.


## 📦 Configuração do Banco de Dados PostgreSQL

1. **Instalar e iniciar o PostgreSQL**  
   - Windows/macOS/Linux (siga o site oficial).

2. **Criar database e tabela**  
   ```sql
   CREATE DATABASE rova;
   \c rova;
   CREATE TABLE users (
     id SERIAL PRIMARY KEY,
     name VARCHAR(100) NOT NULL,
     email VARCHAR(100) UNIQUE NOT NULL,
     password VARCHAR(200) NOT NULL,
     created_at TIMESTAMP DEFAULT NOW()
   );

3. **Variável de ambiente**

```bash
DATABASE_URL=postgres://<usuário>:<senha>@localhost:5432/rova
```

4. **Teste de conexão**

```bash
cd backend
npm run db:test
```

---

## 🔐 Reset de Senha & Configuração do Banco

Caso esqueça a senha do usuário `postgres` ou precise reconfigurar o banco, siga:

```bash
# 1) Pausar serviço
net stop postgresql-x64-15

# 2) Permitir trust temporário
# Edite pg_hba.conf (…/data/pg_hba.conf), trocando md5 → trust nas linhas local/host
net start postgresql-x64-15

# 3) No pgAdmin:
#   → Conecte ao servidor (não solicitará senha)
#   → Em Login/Group Roles → postgres → Properties → Definition → altere Password

# 4) Reverter pg_hba.conf para md5:
net stop postgresql-x64-15
# volte trust → md5
net start postgresql-x64-15

# 5) Atualize backend/.env:
# DATABASE_URL=postgres://postgres:<NovaSenha>@localhost:5432/rova
```
