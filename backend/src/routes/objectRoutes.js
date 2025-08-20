const express = require('express');
const multer = require('multer');
const os = require('os');
const path = require('path');
const { createObject, listObjects, listFacets, getObjectById } = require('../controllers/objectController');

const router = express.Router();

const upload = multer({
  dest: path.join(os.tmpdir(), 'rova-uploads'),
  limits: { fileSize: 150 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pptx', '.pptm', '.ppt'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(allowed.includes(ext) ? null : new Error('Apenas arquivos PPTX/PPTM/PPT'), allowed.includes(ext));
  },
});

router.get('/objetos/facets', listFacets);
router.get('/objetos', listObjects);
router.post('/objetos', upload.single('file'), createObject);
router.get('/objetos/:id', getObjectById);

module.exports = router;
