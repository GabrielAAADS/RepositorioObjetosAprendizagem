const pool = require('../config/db');
const fs = require('fs');
const path = require('path');
const { STORAGE_DIR, saveFile } = require('../services/storageService');
const ObjectMetadata = require('../models/objectMetadata');
const mime = require('mime-types');
const {  } = require('../services/storageService');
// const { hasS3, signDownload, extractKeyFromUrl } = require('../services/s3Service');


function mapKeysToLom(obj = {}) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    let key = k;
    if (key.startsWith('metadata.')) key = key.replace(/^metadata\./, 'lom.');
    if (!key.startsWith('lom.')) key = `lom.${key}`;
    out[key] = v;
  }
  return out;
}

const DICT = {
  lifecycle: {
    draft: 'Rascunho',
    final: 'Final',
    revised: 'Revisado',
    unavailable: 'Indisponível'
  },
  difficulty: {
    'very easy': 'Muito fácil',
    'very_easy': 'Muito fácil',
    easy: 'Fácil',
    medium: 'Médio',
    difficult: 'Difícil',
    'very difficult': 'Muito difícil',
    'very_difficult': 'Muito difícil'
  },
  resourceType: {
    game: 'Jogo',
    jogo: 'Jogo',
    exercise: 'Exercício',
    exercicio: 'Exercício',
    lesson: 'Lição',
    simulation: 'Simulação',
    questionnaire: 'Questionário',
    quiz: 'Quiz',
    animation: 'Animação',
    presentation: 'Apresentação'
  },
  interactivityType: {
    active: 'Ativa',
    expositive: 'Expositiva',
    mixed: 'Mista'
  },
  endUserRole: {
    teacher: 'Professor',
    learner: 'Estudante',
    author: 'Autor',
    manager: 'Gestor'
  },
  context: {
    'primary education': 'Ensino Fundamental',
    'secondary education': 'Ensino Médio',
    'higher education': 'Ensino Superior',
    school: 'Escolar',
    university: 'Universidade'
  },
  cost: { yes: 'Com custo', no: 'Sem custo', true: 'Com custo', false: 'Sem custo' }
};

const LANG_PT = {
  'pt': 'Português',
  'pt-br': 'Português (Brasil)',
  'portuguese': 'Português',
  'en': 'Inglês',
  'english': 'Inglês',
  'es': 'Espanhol',
  'spanish': 'Espanhol',
  'fr': 'Francês',
  'french': 'Francês'
};

function pickText(x) {
  if (x == null) return null;
  if (typeof x === 'string') return x.trim();
  if (typeof x === 'boolean') return x ? 'Sim' : 'Não';
  if (typeof x === 'number') return String(x); // deixa como string; filtraremos depois
  if (x.value != null) return String(x.value).trim();
  if (Array.isArray(x.string) && x.string[0]?.['#text']) return String(x.string[0]['#text']).trim();
  if (x.langstring) return String(x.langstring).trim();
  return null;
}
function normLang(v) {
  const k = String(v).trim().toLowerCase();
  return LANG_PT[k] || String(v);
}
function normalizeLabel(groupKey, raw) {
  const v = pickText(raw);
  if (!v) return null;
  const lower = v.toLowerCase();
  switch (groupKey) {
    case 'status':            return DICT.lifecycle[lower]        ?? v;
    case 'difficulty':        return DICT.difficulty[lower]       ?? v;
    case 'resourceType':      return DICT.resourceType[lower]     ?? v;
    case 'interactivityType': return DICT.interactivityType[lower]?? v;
    case 'endUserRole':       return DICT.endUserRole[lower]      ?? v;
    case 'context':           return DICT.context[lower]          ?? v;
    case 'cost':              return DICT.cost[lower]             ?? v;
    case 'language':
    case 'eduLanguage':       return normLang(v);
    case 'keywords':
    default:
      if (/^\d+$/.test(v)) return null;
      return v;
  }
}
function mapKeysToLom(obj = {}) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const kk = k.startsWith('lom.') ? k : `lom.${k}`;
    out[kk] = v;
  }
  return out;
}

function setDeep(target, path, value) {
  const parts = path.split('.');
  let cur = target;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i];
    if (!cur[k] || typeof cur[k] !== 'object') cur[k] = {};
    cur = cur[k];
  }
  cur[parts[parts.length - 1]] = value;
}

exports.listFacets = async (req, res) => {
  try {
    const { title, category } = req.query;

    let allowedIds = null;
    if (title || category) {
      const w = [], p = [];
      if (title)    { p.push(`%${title}%`);    w.push(`title ILIKE $${p.length}`); }
      if (category) { p.push(`%${category}%`); w.push(`category ILIKE $${p.length}`); }
      const { rows } = await pool.query(`SELECT id FROM objects ${w.length ? 'WHERE '+w.join(' AND ') : ''}`, p);
      allowedIds = rows.map(r => r.id);
      if (allowedIds.length === 0) {
        return res.json({ facets: {
          status:[], difficulty:[], resourceType:[], interactivityType:[],
          endUserRole:[], context:[], language:[], eduLanguage:[], cost:[], keywords:[]
        }});
      }
    }

    let metaMatch = {};
    if (req.query.lomFilters) {
      try { metaMatch = mapKeysToLom(JSON.parse(req.query.lomFilters)); } catch {}
    }

    const FIELDS = [
      ['status',            'lom.lifecycle.status'],
      ['difficulty',        'lom.educational.difficulty'],
      ['resourceType',      'lom.educational.learningResourceType'],
      ['interactivityType', 'lom.educational.interactivityType'],
      ['endUserRole',       'lom.educational.intendedEndUserRole'],
      ['context',           'lom.educational.context'],
      ['language',          'lom.general.language'],
      ['eduLanguage',       'lom.educational.language'],
      ['cost',              'lom.rights.cost'],
      ['keywords',          'lom.general.keyword'],
    ];
    const ARRAY_FIELDS = new Set(['lom.general.keyword']);

    const pipeline = [];
    const firstMatch = {};
    if (allowedIds) firstMatch.objectId = { $in: allowedIds };
    if (Object.keys(metaMatch).length) Object.assign(firstMatch, metaMatch);
    if (Object.keys(firstMatch).length) pipeline.push({ $match: firstMatch });

    const facetObj = {};
    for (const [key, path] of FIELDS) {
      const stages = [
        { $project: { v: `$${path}` } },
        ...(ARRAY_FIELDS.has(path) ? [{ $unwind: { path: '$v', preserveNullAndEmptyArrays: false } }] : []),
        { $match: { v: { $ne: null, $ne: '' } } },
        { $group: { _id: '$v', count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } },
      ];
      facetObj[key] = stages;
    }
    pipeline.push({ $facet: facetObj });

    const agg = await ObjectMetadata.aggregate(pipeline);
    const raw = agg[0] || {};

    const build = (key) => (raw[key] || [])
      .map(x => {
        const label = normalizeLabel(key, x._id);
        return label ? { value: pickText(x._id), label, count: x.count } : null;
      })
      .filter(Boolean);

    const facets = {
      status:            build('status'),
      difficulty:        build('difficulty'),
      resourceType:      build('resourceType'),
      interactivityType: build('interactivityType'),
      endUserRole:       build('endUserRole'),
      context:           build('context'),
      language:          build('language'),
      eduLanguage:       build('eduLanguage'),
      cost:              build('cost'),
      keywords:          build('keywords'),
    };

    res.json({ facets });
  } catch (e) {
    console.error('Erro agregando facets:', e);
    res.status(500).json({ error: 'Erro ao calcular facets' });
  }
};

exports.createObject = async (req, res) => {
  const { title, description = '', category = '', metadata } = req.body;
  const file = req.file;

  if (!title || !file || !metadata) {
    return res.status(400).json({
      error: 'Título, arquivo e metadata JSON são obrigatórios.'
    });
  }

  try {
    const fileUrl = await saveFile(file);

    const pgRes = await pool.query(
      `INSERT INTO objects
         (title, description, category, file_path)
       VALUES ($1,$2,$3,$4)
       RETURNING id, title, description, category, file_path, created_at`,
      [title, description, category, fileUrl]
    );
    const newObj = pgRes.rows[0];

    const lom = JSON.parse(metadata);
    const mongoDoc = await ObjectMetadata.create({ objectId: newObj.id, lom });

    res.status(201).json({ object: newObj, metadata: mongoDoc });
  } catch (err) {
    console.error('Erro ao criar objeto:', err);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
};

exports.listObjects = async (req, res) => {
  try {
    const { title, category } = req.query;
    const limit  = Number(req.query.limit || 20);
    const offset = Number(req.query.offset || 0);

    let mongoMatch = {};
    if (req.query.lomFilters) {
      try {
        const parsed = JSON.parse(req.query.lomFilters);
        mongoMatch = mapKeysToLom(parsed);
      } catch (_) {}
    }
    
    let allowedIds = null;
    if (Object.keys(mongoMatch).length) {
      const docs = await ObjectMetadata.find(mongoMatch, { objectId: 1 }).lean();
      allowedIds = docs.map((d) => d.objectId);
      if (allowedIds.length === 0) {
        return res.json({ objects: [], total: 0 });
      }
    }

    const wheres = [];
    const params = [];
    if (title) {
      params.push(`%${title}%`);
      wheres.push(`title ILIKE $${params.length}`);
    }
    if (category) {
      params.push(`%${category}%`);
      wheres.push(`category ILIKE $${params.length}`);
    }
    if (allowedIds) {
      params.push(allowedIds);
      wheres.push(`id = ANY($${params.length})`);
    }

    const whereSql = wheres.length ? `WHERE ${wheres.join(' AND ')}` : '';

    const totalRes = await pool.query(`SELECT COUNT(*)::int as c FROM objects ${whereSql}`, params);
    const total = totalRes.rows[0]?.c || 0;

    params.push(limit, offset);
    const rowsRes = await pool.query(
      `SELECT o.*,
              COALESCE(r.avg,0)::float AS "ratingAvg",
              COALESCE(r.count,0)::int AS "ratingCount"
        FROM objects o
    LEFT JOIN (
          SELECT object_id, AVG(stars) AS avg, COUNT(*) AS count
            FROM ratings
            GROUP BY object_id
    ) r ON r.object_id = o.id
      ${whereSql ? ' ' + whereSql.replace(/^WHERE /, 'WHERE ') : ''}
    ORDER BY o.created_at DESC
    LIMIT $${params.length-1} OFFSET $${params.length}`,
      params
    );
    const rows = rowsRes.rows || [];

    const ids = rows.map(r => r.id);

    const metas = await ObjectMetadata
      .find({ objectId: { $in: ids } }, { _id: 0, objectId: 1, lom: 1 })
      .lean();

    const metaById = new Map(metas.map(m => [m.objectId, m.lom]));

    const objects = rows.map(r => ({ ...r, metadata: metaById.get(r.id) || null }));
    res.json({ objects, total });
  } catch (err) {
    console.error('Erro listObjects:', err);
    res.status(500).json({ error: 'Erro ao listar objetos' });
  }
};

function applyLomFilters(match, lomJSON) {
  if (!lomJSON) return;
  try {
    const obj = JSON.parse(lomJSON);
    for (const [k, v] of Object.entries(obj)) {
      const path = k.startsWith('lom.') ? k.slice(4) : k;
      match[path] = v;
    }
  } catch (_) {
  }
}

exports.getObjectById = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  try {
    const { rows } = await pool.query(
      `
      SELECT o.*,
             COALESCE(r.avg, 0)::float AS "ratingAvg",
             COALESCE(r.cnt, 0)::int   AS "ratingCount"
      FROM objects o
      LEFT JOIN (
        SELECT object_id, AVG(stars) AS avg, COUNT(*) AS cnt
          FROM ratings              -- << se sua tabela chama object_ratings, troque aqui
        GROUP BY object_id
      ) r ON r.object_id = o.id
      WHERE o.id = $1
      LIMIT 1
      `,
      [id]
    );

    if (!rows.length) return res.status(404).json({ error: 'Objeto não encontrado' });
    const obj = rows[0];

    const base = process.env.PUBLIC_APP_URL || `${req.protocol}://${req.get('host')}`;

    obj.download_url = `${base}/api/objetos/${id}/download`;

    if (obj.file_path?.startsWith('/storage/')) {
      obj.file_url = `${req.protocol}://${req.get('host')}${obj.file_path}`;
    } else if (obj.file_path?.startsWith('http')) {
      obj.file_url = obj.file_path;
    } else {
      obj.file_url = null;
    }

    const metaDoc = await ObjectMetadata.findOne({ objectId: id }, { _id: 0, lom: 1 }).lean();

    return res.json({ object: obj, metadata: metaDoc?.lom || null });
  } catch (err) {
    console.error('Erro ao buscar objeto por id:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

function safeName(title, fallbackExt = '') {
  let base = (title || 'arquivo')
    .toString()
    .normalize('NFKD')
    .replace(/[^\w\s.-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase();

  if (!path.extname(base) && fallbackExt) base += fallbackExt;
  return base || ('arquivo' + fallbackExt);
}

exports.downloadObject = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'ID inválido' });

    // buscamos só o que precisamos
    const { rows } = await pool.query(
      'SELECT id, title, file_path FROM objects WHERE id = $1 LIMIT 1',
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Objeto não encontrado' });

    const { title, file_path } = rows[0] || {};
    if (!file_path) return res.status(404).json({ error: 'Arquivo não disponível' });

    const ext = path.extname(file_path) || '.pptx';
    const filename = safeName(title, ext);

    if (file_path.startsWith('/storage/')) {
      const basename = path.basename(file_path);
      const abs = path.join(STORAGE_DIR, basename); 

      if (!fs.existsSync(abs)) {
        return res.status(404).json({ error: 'Arquivo não encontrado no storage' });
      }

      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(filename)}"`
      );
      // res.type(ext); // usa o mime do Express
      return res.sendFile(abs);
      // return res.download(abs, filename);
    }

    if (/^https?:\/\//i.test(file_path)) {
      return res.redirect(file_path);
    }

    const abs = path.isAbsolute(file_path)
      ? file_path
      : path.join(process.cwd(), file_path);

    if (!fs.existsSync(abs)) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    return res.download(abs, filename);
  } catch (e) {
    console.error('downloadObject error:', e);
    return res.status(500).json({ error: 'Erro ao baixar arquivo' });
  }
};
