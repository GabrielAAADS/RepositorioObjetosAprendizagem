const pool = require('../config/db');
const fs = require('fs');
const path = require('path');
const { saveFile } = require('../services/storageService');
const ObjectMetadata = require('../models/objectMetadata');

function normalizeLomKeys(obj) {
  if (!obj || typeof obj !== 'object') return {};
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const nk = k.startsWith('lom.') ? k.replace(/^lom\./, 'metadata.') : k;
    out[nk] = v;
  }
  return out;
}

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
        mongoMatch = normalizeLomKeys(parsed);
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
      `SELECT * FROM objects ${whereSql} ORDER BY created_at DESC LIMIT $${params.length-1} OFFSET $${params.length}`,
      params
    );
    const rows = rowsRes.rows || [];

    const ids = rows.map(r => r.id);
    const metas = await ObjectMetadata
      .find({ objectId: { $in: ids } }, { _id: 0, objectId: 1, metadata: 1 })
      .lean();
    const metaById = new Map(metas.map(m => [m.objectId, m.metadata]));

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

const norm = (arr = []) =>
  arr
    .filter(x => x && x.value !== undefined && x.value !== null && x.value !== '')
    .map(x => ({ value: x.value, count: x.count }));

exports.listFacets = async (req, res) => {
  try {
    let match = {};
    if (req.query.lomFilters) {
      try {
        const parsed = JSON.parse(req.query.lomFilters);
        match = normalizeLomKeys(parsed);
      } catch (_) {}
    }

    const FIELDS = [
      ['status',           'metadata.lifecycle.status'],
      ['difficulty',       'metadata.educational.difficulty'],
      ['resourceType',     'metadata.educational.learningResourceType'],
      ['interactivityType','metadata.educational.interactivityType'],
      ['endUserRole',      'metadata.educational.intendedEndUserRole'],
      ['context',          'metadata.educational.context'],
      ['language',         'metadata.general.language'],
      ['eduLanguage',      'metadata.educational.language'],
      ['cost',             'metadata.rights.cost'],
      ['keywords',         'metadata.general.keyword'],
    ];

    const ARRAY_FIELDS = new Set(['metadata.general.keyword']);

    const pipeline = [];
    if (Object.keys(match).length) pipeline.push({ $match: match });

    const facetObj = {};
    for (const [key, path] of FIELDS) {
      const stages = [
        { $project: { v: `$${path}` } },
        ...(ARRAY_FIELDS.has(path)
          ? [{ $unwind: { path: '$v', preserveNullAndEmptyArrays: false } }]
          : []),
        { $match: { v: { $ne: null, $ne: '' } } },
        { $group: { _id: '$v', count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } },
      ];
      facetObj[key] = stages;
    }

    pipeline.push({ $facet: facetObj });

    const agg = await ObjectMetadata.aggregate(pipeline);
    const raw = agg[0] || {};

    const facets = {};
    for (const [key, arr] of Object.entries(raw)) {
      facets[key] = (arr || []).map((d) => ({ value: d._id, count: d.count }));
    }

    res.json({ facets });
  } catch (e) {
    console.error('Erro agregando facets:', e);
    res.status(500).json({ error: 'Erro ao calcular facets' });
  }
};

exports.getObjectById = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  try {
    const { rows } = await pool.query(
      `SELECT id, title, description, category, file_path, created_at
      FROM objects WHERE id = $1`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Objeto não encontrado' });

    const metaDoc = await ObjectMetadata.findOne({ objectId: id }).lean();
    
    const metadata = metaDoc || null;

    return res.json({ object: rows[0], metadata });
  } catch (err) {
    console.error('Erro ao buscar objeto por id:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};