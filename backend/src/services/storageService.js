require('dotenv').config();
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const driver = process.env.STORAGE_DRIVER || 'local';

const BASE_DIR = path.resolve(__dirname, '..', '..');
const STORAGE_DIR = process.env.STORAGE_DIR
  ? path.resolve(process.env.STORAGE_DIR)
  : path.join(BASE_DIR, 'storage');

function sanitize(name) {
  return (name || 'file')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w.\-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function ensureDir(dir) {
  await fsp.mkdir(dir, { recursive: true });
}

async function moveFile(src, dest) {
  try {
    await fsp.rename(src, dest);
  } catch (e) {
    if (e.code === 'EXDEV') {
      await fsp.copyFile(src, dest);
      await fsp.unlink(src);
    } else {
      throw e;
    }
  }
}

async function saveLocal(file) {
  if (!file?.path) throw new Error('Arquivo temporário inválido.');
  await ensureDir(STORAGE_DIR);

  const ext = path.extname(file.originalname || '').toLowerCase();
  const base = path.basename(file.originalname || 'file', ext);
  const safe = sanitize(base);
  const filename = `${Date.now()}-${safe}${ext}`;

  const dest = path.join(STORAGE_DIR, filename);
  await moveFile(file.path, dest);

  return `/storage/${filename}`;
}

async function saveS3(file) {
  if (!file?.path) throw new Error('Arquivo temporário inválido.');

  const s3 = new S3Client({ region: process.env.AWS_REGION });
  const ext = path.extname(file.originalname || '').toLowerCase();
  const base = path.basename(file.originalname || 'file', ext);
  const safe = sanitize(base);
  const key = `${Date.now()}-${safe}${ext}`;

  await s3.send(new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    Body: fs.createReadStream(file.path),
    ContentType: file.mimetype,
    ACL: 'public-read',
  }));

  await fsp.unlink(file.path);
  return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}

module.exports = {
  saveFile: (driver === 's3') ? saveS3 : saveLocal,
  STORAGE_DIR,
};
