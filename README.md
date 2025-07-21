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
gr repo clone coreybutler/nvm-windows
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
* **.gitignore**: ignora node_modules, .env, logs e arquivos de IDE.  
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
```

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

---

## 🖥️ Configuração do Frontend

1. **Variáveis de Ambiente**
```bash
cd frontend && touch .env
```  
```env
VITE_API_URL=http://localhost:4000/api
```

2. **Instalar React Router**
```bash
cd frontend
npm install react-router-dom
```

3. **Estrutura de Arquivos**
```bash
cd frontend
mkdir -p src/services src/pages src/components
touch src/services/api.js src/App.jsx src/main.jsx src/pages/Login.jsx src/pages/Register.jsx src/components/PrivateRoute.jsx
```

4. **API Cliente com Interceptor**
```js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
```

5. **Roteamento e Rotas Protegidas**
- `src/components/PrivateRoute.jsx`: verifica `localStorage.getItem('token')` para permitir acesso.
- `src/App.jsx`: configure `BrowserRouter`, rotas públicas (`/login`, `/register`) e privadas (`/dashboard`) via `<PrivateRoute>`.

6. **Páginas de Autenticação**
- **Login** (`src/pages/Login.jsx`): chama `api.post('/auth/login')`, salva `token` e navega para `/dashboard`.
- **Register** (`src/pages/Register.jsx`): chama `api.post('/auth/register')` e navega para `/login`.

7. **Logout**
No `src/pages/Dashboard.jsx`, adicione:
```jsx
<button onClick={() => {
  localStorage.removeItem('token');
  navigate('/login', { replace: true });
}}>
  Logout
</button>
```

---

## 🔗 Testar Integração Frontend-Backend

1. **Iniciar servidores**
   - Backend: `cd backend && npm run dev`
   - Frontend: `cd frontend && npm run dev`

2. **Registrar Usuário**
   - Acesse `http://localhost:5173/register`, preencha e confirme redirecionamento para `/login`.

3. **Login e Armazenamento de Token**
   - Acesse `http://localhost:5173/login`, faça login e verifique em DevTools → Application → Local Storage se `token` está salvo.

4. **Acesso Protegido e Logout**
   - Acesse `http://localhost:5173/dashboard`; sem token, redireciona para `/login`; com token, exibe Dashboard e permite logout.

*Este README resume todo o setup e funcionalidades implementadas até a primeira semana de desenvolvimento.*