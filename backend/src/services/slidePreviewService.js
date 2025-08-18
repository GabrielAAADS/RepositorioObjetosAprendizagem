const { execFile } = require('child_process');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const { v4: uuid } = require('uuid');

const BASE_DIR = path.resolve(__dirname, '..', '..');
const PREVIEWS_DIR = process.env.PREVIEWS_DIR
  ? path.resolve(process.env.PREVIEWS_DIR)
  : path.join(BASE_DIR, 'uploads', 'previews');

const DEBUG = process.env.PREVIEW_DEBUG === '1';

function log(...args) { if (DEBUG) console.log('[preview]', ...args); }

async function ensureDir(dir) {
  await fsp.mkdir(dir, { recursive: true });
}

function runSoffice(inputPath, outDir) {
  const soffice = process.env.SOFFICE_PATH || 'soffice';
  const args = [
    '--headless',
    '--convert-to', 'png:impress_png_Export',
    '--outdir', outDir,
    inputPath,
  ];
  log('exec:', soffice, args.join(' '));
  return new Promise((resolve, reject) => {
    execFile(soffice, args, { timeout: 60000 }, (err, stdout, stderr) => {
      if (err) { log('error:', err); return reject(err); }
      log('stdout:', stdout?.toString()); log('stderr:', stderr?.toString());
      resolve();
    });
  });
}

function sortPngs(a, b) {
  const rx = /(\d+)(?=\.png$)/;
  const na = parseInt((a.match(rx) || [,'0'])[1], 10);
  const nb = parseInt((b.match(rx) || [,'0'])[1], 10);
  return na - nb;
}

exports.generateSlidePreviews = async function(tempFilePath) {
  await ensureDir(PREVIEWS_DIR);
  const folder = uuid();
  const outDir = path.join(PREVIEWS_DIR, folder);
  await ensureDir(outDir);

  log('input:', tempFilePath);
  log('outDir:', outDir);

  await runSoffice(tempFilePath, outDir);

  const files = (await fsp.readdir(outDir))
    .filter(n => n.toLowerCase().endsWith('.png'))
    .sort(sortPngs);

  if (!files.length) throw new Error('No PNG slides produced by LibreOffice');

  const urls = files.map(n => `/uploads/previews/${folder}/${n}`);
  log('slides:', urls);
  return { folder, urls };
};

exports.deletePreviewFolder = async function(folder) {
  const dir = path.join(PREVIEWS_DIR, folder);
  await fsp.rm(dir, { recursive: true, force: true });
};

exports.checkSoffice = function() {
  const soffice = process.env.SOFFICE_PATH || 'soffice';
  return new Promise((resolve) => {
    execFile(soffice, ['--version'], { timeout: 8000 }, (err, stdout, stderr) => {
      if (err) return resolve(false);
      resolve(/LibreOffice/i.test(String(stdout || stderr || '')));
    });
  });
};

exports.PREVIEWS_DIR = PREVIEWS_DIR;
