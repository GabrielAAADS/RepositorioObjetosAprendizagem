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
