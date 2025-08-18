const express = require('express');
const multer  = require('multer');
const os      = require('os');
const path    = require('path');
const { generateSlidePreviews, deletePreviewFolder, checkSoffice } =
  require('../services/slidePreviewService');

const router = express.Router();

const upload = multer({
  dest: path.join(os.tmpdir(), 'rova-previews'),
  limits: { fileSize: 150 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    cb(/\.(pptx?|pptm)$/i.test(file.originalname) ? null : new Error('Only PPT/PPTX/PPTM'), true);
  }
});

router.get('/preview/health', async (req, res) => {
  const ok = await checkSoffice().catch(() => false);
  res.json({ available: !!ok });
});

router.post('/preview/slides', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'file is required' });
    const { folder, urls } = await generateSlidePreviews(req.file.path);
    if (!urls.length) return res.status(500).json({ error: 'No slides generated' });
    res.json({ folder, slides: urls });
  } catch (e) {
    console.error('preview error:', e?.message);
    res.status(501).json({ error: 'Preview not available on server' });
  }
});

router.delete('/preview/slides/:folder', async (req, res) => {
  await deletePreviewFolder(req.params.folder).catch(() => {});
  res.json({ ok: true });
});

module.exports = router;
