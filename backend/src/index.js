require('./config/mongo');
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const fs = require('fs');

const authRoutes = require('./routes/authRoutes');
const objectRoutes = require('./routes/objectRoutes');
const previewRoute = require('./routes/previewRoute'); 
const homeRoutes = require('./routes/homeRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const ratingsRoutes = require('./routes/ratingRoutes');
const { STORAGE_DIR } = require('./services/storageService');
const { PREVIEWS_DIR } = require('./services/slidePreviewService'); 

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

try {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
  if (PREVIEWS_DIR) fs.mkdirSync(PREVIEWS_DIR, { recursive: true });
} catch (e) {
  console.warn('Warn creating dirs:', e?.message);
}

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api', homeRoutes);
app.use('/api', feedbackRoutes);

app.use('/storage', express.static(STORAGE_DIR));
if (PREVIEWS_DIR) app.use('/uploads/previews', express.static(PREVIEWS_DIR));

app.use('/api/auth', authRoutes);
app.use('/api', objectRoutes);
app.use('/api', previewRoute);

app.use('/api/auth', authRoutes);
app.use('/api/objects', objectRoutes);
app.use('/api/ratings', ratingsRoutes);

app.use((req, res) => res.status(404).json({ error: 'Rota não encontrada' }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
