const pool = require('../config/db');
const fs = require('fs');
const path = require('path');
const { saveFile } = require('../services/storageService');
const ObjectMetadata = require('../models/objectMetadata');

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
  const { title, category, lomFilters } = req.query;
  const limit  = Math.min(parseInt(req.query.limit, 10)  || 10, 100);
  const offset = parseInt(req.query.offset, 10) || 0;

  const whereClauses = [];
  const values = [];

  if (title) {
    values.push(`%${title}%`);
    whereClauses.push(`title ILIKE $${values.length}`);
  }
  if (category) {
    values.push(`%${category}%`);
    whereClauses.push(`category ILIKE $${values.length}`);
  }

  if (lomFilters) {
    let lomQuery;

    try {
      lomQuery = JSON.parse(lomFilters);
    } catch (e) {
      return res.status(400).json({ error: 'lomFilters inválido; deve ser JSON.' });
    }

    const metas = await ObjectMetadata.find(lomQuery).select('objectId').lean();
    const ids = metas.map(m => m.objectId);

    if (ids.length === 0) {
      return res.json({ total: 0, limit, offset, objects: [] });
    }

    values.push(ids);
    whereClauses.push(`id = ANY($${values.length})`);
  }

  const whereSQL = whereClauses.length
    ? `WHERE ${whereClauses.join(' AND ')}`
    : '';

  try {
    const countRes = await pool.query(
      `SELECT COUNT(*) AS total FROM objects ${whereSQL}`,
      values
    );
    const total = parseInt(countRes.rows[0].total, 10);

    values.push(limit, offset);
    const dataRes = await pool.query(
      `
      SELECT id, title, category, file_path, created_at
      FROM objects
      ${whereSQL}
      ORDER BY created_at DESC
      LIMIT $${values.length - 1}
      OFFSET $${values.length}
      `,
      values
    );

    const pgRows = dataRes.rows;

    const pgIds    = pgRows.map(r => r.id);
    const fullMetas = await ObjectMetadata.find({ objectId: { $in: pgIds } }).lean();
    const metaMap  = fullMetas.reduce((acc, doc) => {
      acc[doc.objectId] = doc.lom;
      return acc;
    }, {});

    const objects = pgRows.map(obj => ({
      ...obj,
      metadata: metaMap[obj.id] || null
    }));

    res.json({ total, limit, offset, objects });
    
  } catch (err) {
    console.error('Erro listando objetos:', err);
    res.status(500).json({ error: 'Erro interno ao buscar objetos.' });
  }
};