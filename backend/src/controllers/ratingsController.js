const pool = require('../config/db');

// CREATE TABLE ratings (
//   id SERIAL PRIMARY KEY,
//   object_id INT NOT NULL,
//   user_id   INT NOT NULL,
//   stars     INT NOT NULL CHECK (stars BETWEEN 1 AND 5),
//   comment   TEXT,
//   version   TEXT,
//   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
// );
// CREATE INDEX idx_ratings_object ON ratings(object_id);
// CREATE UNIQUE INDEX uniq_ratings_current ON ratings(object_id, user_id)
// WHERE (version IS NULL); 

exports.getCurrent = async (req, res) => {
  try {
    const objectId = parseInt(req.query.objectId, 10);
    if (!objectId) return res.status(400).json({ error: 'objectId inválido' });

    const avgQ = await pool.query(
      'SELECT COALESCE(AVG(stars)::numeric(10,2),0) AS avg, COUNT(*)::int AS count FROM ratings WHERE object_id=$1',
      [objectId]
    );
    const avg = Number(avgQ.rows[0]?.avg || 0);
    const count = avgQ.rows[0]?.count || 0;

    const listQ = await pool.query(
      `SELECT id, object_id, user_id, stars, comment, version, created_at
         FROM ratings
        WHERE object_id=$1
        ORDER BY created_at DESC
        LIMIT 20`,
      [objectId]
    );

    let me = null;
    if (req.user?.id) {
      try {
        const meQ = await pool.query(
          `SELECT id, object_id, user_id, stars, comment, version, created_at
             FROM ratings
            WHERE object_id=$1 AND user_id=$2
            ORDER BY created_at DESC
            LIMIT 1`,
          [objectId, req.user.id]
        );
        me = meQ.rows[0] || null;
      } catch (e) {
        console.warn('getCurrent.me lookup failed:', e?.message);
      }
    }

    return res.json({ avg, count, list: listQ.rows, me });
  } catch (e) {
    console.error('getCurrent error:', e);
    return res.json({ avg: 0, count: 0, list: [], me: null });
  }
};


exports.getHistory = async (req, res) => {
  const objectId = parseInt(req.query.objectId, 10);
  if (!objectId) return res.status(400).json({ error: 'objectId inválido' });

  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Não autenticado' });

  const q = await pool.query(
    `SELECT id, object_id, user_id, stars, comment, version, created_at
       FROM ratings
      WHERE object_id=$1 AND user_id=$2
      ORDER BY created_at DESC`,
    [objectId, userId]
  );

  res.json({ list: q.rows });
};

exports.upsert = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Não autenticado' });

  const { objectId, stars, comment, version } = req.body || {};
  if (!objectId || !stars) return res.status(400).json({ error: 'objectId e stars são obrigatórios' });

  const nStars = Number(stars);
  if (nStars < 1 || nStars > 5) return res.status(400).json({ error: 'stars deve ser 1..5' });

  const v = (version == null || String(version).trim() === '') ? null : String(version).trim();

  try {
    const { rows } = await pool.query(
      `INSERT INTO ratings (object_id, user_id, stars, comment, version)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, object_id, user_id, stars, comment, version, created_at`,
      [objectId, userId, nStars, comment || null, v]
    );
    return res.json({ ok: true, rating: rows[0] });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Erro ao salvar avaliação' });
  }
};

exports.getCommunity = async (req, res) => {
  try {
    const objectId = parseInt(req.query.objectId, 10);
    const limit = Math.min(parseInt(req.query.limit || '20', 10), 100);
    const offset = parseInt(req.query.offset || '0', 10);

    if (!objectId) return res.status(400).json({ error: 'objectId inválido' });

    const listQ = await pool.query(
      `
      WITH latest AS (
        SELECT DISTINCT ON (user_id)
               id, object_id, user_id, stars, comment, version, created_at
          FROM ratings
         WHERE object_id = $1
      ORDER BY user_id, created_at DESC
      )
      SELECT * FROM latest
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
      `,
      [objectId, limit, offset]
    );

    const totalQ = await pool.query(
      `SELECT COUNT(DISTINCT user_id)::int AS c FROM ratings WHERE object_id=$1`,
      [objectId]
    );

    res.json({ list: listQ.rows, total: totalQ.rows[0]?.c || 0 });
  } catch (e) {
    console.error('getCommunity error:', e);
    res.status(500).json({ error: 'Erro ao listar avaliações da comunidade' });
  }
};