const express = require('express');
const multer = require('multer');
const path = require('path');
const { createObject, listObjects } = require('../controllers/objectController');

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/\s+/g, '_');
    cb(null, `${timestamp}-${safeName}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.pptx', '.pptm', '.ppt'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error('Apenas arquivos PPTX, PPTM ou PPT são permitidos'), false);
};

const upload = multer({ storage, fileFilter });

router.get('/objetos', listObjects);

router.post('/objetos', upload.single('file'), createObject);

module.exports = router;