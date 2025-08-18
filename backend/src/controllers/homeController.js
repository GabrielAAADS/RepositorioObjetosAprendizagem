const pool = require('../config/db');
const ObjectMetadata = require('../models/objectMetadata');

async function hydrateWithMeta(rows) {
  if (!rows.length) return [];
  const ids = rows.map(r => r.id);
  const metas = await ObjectMetadata
    .find({ pgObjectId: { $in: ids } })
    .select('pgObjectId general.thumbnail general.keyword')
    .lean();

  const metaById = new Map(metas.map(m => [String(m.pgObjectId), m]));
  return rows.map(r => {
    const m = metaById.get(String(r.id));
    return {
      ...r,
      metadata: {
        general: {
          thumbnail: m?.general?.thumbnail || null,
          keyword: m?.general?.keyword || []
        }
      }
    };
  });
}

exports.getFeatured = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, title, category, file_path, created_at
         FROM objects
         ORDER BY created_at DESC
         LIMIT 8`
    );
    const out = await hydrateWithMeta(rows);
    res.json({ items: out });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao carregar destaques' });
  }
};

exports.getTagCloud = async (req, res) => {
  try {
    const keywords = await ObjectMetadata.aggregate([
      { $unwind: '$general.keyword' },
      { $group: { _id: '$general.keyword', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 24 },
      { $project: { value: '$_id', count: 1, _id: 0 } }
    ]);

    const { rows: cats } = await pool.query(
      `SELECT category AS value, COUNT(*)::int AS count
         FROM objects
         WHERE category IS NOT NULL AND category <> ''
         GROUP BY category
         ORDER BY count DESC
         LIMIT 12`
    );

    res.json({ keywords, categories: cats });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao montar nuvem de filtros' });
  }
};


exports.getRandom = async (req, res) => {
  try {
    const limit = Number(req.query.limit || 12);
    const { rows } = await pool.query(
      `SELECT id, title, category, file_path, created_at
         FROM objects
         ORDER BY RANDOM()
         LIMIT $1`, [limit]
    );
    const out = await hydrateWithMeta(rows);
    res.json({ items: out });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao carregar carrossel' });
  }
};
