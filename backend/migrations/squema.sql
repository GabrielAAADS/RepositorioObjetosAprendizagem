
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =========================================================
-- Função + trigger para atualizar updated_at automaticamente
-- =========================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

-- =========================================================
-- Tabela principal: objects
-- =========================================================
CREATE TABLE IF NOT EXISTS objects (
  id               SERIAL PRIMARY KEY,
  title            TEXT NOT NULL CHECK (char_length(btrim(title)) > 0),
  description      TEXT NOT NULL DEFAULT '',
  category         TEXT NOT NULL DEFAULT 'Jogo',
  file_path        TEXT NOT NULL CHECK (char_length(btrim(file_path)) > 0),
  downloads_count  INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices úteis para suas buscas/ordenções
CREATE INDEX IF NOT EXISTS idx_objects_created_desc ON objects (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_objects_category ON objects (category);
-- index trigram para acelerar ILIKE em title (requer pg_trgm)
CREATE INDEX IF NOT EXISTS idx_objects_title_trgm ON objects USING gin (title gin_trgm_ops);

-- Trigger updated_at
DROP TRIGGER IF EXISTS trg_objects_set_updated ON objects;
CREATE TRIGGER trg_objects_set_updated
BEFORE UPDATE ON objects
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- =========================================================
-- Tabela de avaliações NOVA: ratings
-- (é a que seu código usa hoje)
-- =========================================================
CREATE TABLE IF NOT EXISTS ratings (
  id          SERIAL PRIMARY KEY,
  object_id   INTEGER NOT NULL REFERENCES objects(id) ON DELETE CASCADE,
  user_id     INTEGER,                        -- opcional (pode ser NULL se não tiver auth)
  stars       SMALLINT NOT NULL CHECK (stars BETWEEN 1 AND 5),
  comment     TEXT,
  version     TEXT,                           -- pode ser NULL ou um texto (ex: "1.0")
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Garantias de unicidade:
-- 1) Um único rating por (object_id, user_id) quando version IS NULL
CREATE UNIQUE INDEX IF NOT EXISTS ratings_obj_user_null_version_uniq
  ON ratings (object_id, user_id)
  WHERE version IS NULL;

-- 2) Um único rating por (object_id, user_id, version) quando version IS NOT NULL
CREATE UNIQUE INDEX IF NOT EXISTS ratings_obj_user_nonnull_version_uniq
  ON ratings (object_id, user_id, version)
  WHERE version IS NOT NULL;

-- Índices úteis
CREATE INDEX IF NOT EXISTS idx_ratings_object               ON ratings (object_id);
CREATE INDEX IF NOT EXISTS idx_ratings_object_created       ON ratings (object_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ratings_object_user_created  ON ratings (object_id, user_id, created_at DESC);

-- Trigger updated_at
DROP TRIGGER IF EXISTS trg_ratings_set_updated ON ratings;
CREATE TRIGGER trg_ratings_set_updated
BEFORE UPDATE ON ratings
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- =========================================================
-- Tabela de avaliações LEGADA: object_ratings (opcional)
-- (mantida por compatibilidade / histórico)
-- =========================================================
CREATE TABLE IF NOT EXISTS object_ratings (
  id          SERIAL PRIMARY KEY,
  object_id   INTEGER NOT NULL REFERENCES objects(id) ON DELETE CASCADE,
  user_id     INTEGER NULL,
  stars       SMALLINT NOT NULL CHECK (stars BETWEEN 1 AND 5),
  comment     TEXT,
  version     TEXT,
  ip          INET,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_object_ratings_object ON object_ratings(object_id);

DROP TRIGGER IF EXISTS trg_object_ratings_set_updated ON object_ratings;
CREATE TRIGGER trg_object_ratings_set_updated
BEFORE UPDATE ON object_ratings
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- =========================================================
-- Auditoria de downloads (opcional porém útil)
-- =========================================================
CREATE TABLE IF NOT EXISTS object_downloads (
  id          SERIAL PRIMARY KEY,
  object_id   INTEGER NOT NULL REFERENCES objects(id) ON DELETE CASCADE,
  user_id     INTEGER NULL,
  ip          INET,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_object_downloads_object      ON object_downloads (object_id);
CREATE INDEX IF NOT EXISTS idx_object_downloads_obj_created ON object_downloads (object_id, created_at DESC);

-- =========================================================
-- DADOS EXEMPLO: 1 registro por tabela
-- =========================================================

-- 1) Insere um objeto e reutiliza o id em inserts seguintes
WITH ins_obj AS (
  INSERT INTO objects (title, description, category, file_path)
  VALUES (
    'Jogo da Memória — Planetas',
    'Atividade interativa sobre o Sistema Solar. Use em projetos de Ciências.',
    'Jogo',
    '/storage/exemplo-jogo-planetas.pptx'
  )
  RETURNING id
),

-- 2) Rating "atual" (version IS NULL)
ins_rating_null AS (
  INSERT INTO ratings (object_id, user_id, stars, comment, version)
  SELECT id, NULL, 5, 'Excelente para 5º ano!', NULL
  FROM ins_obj
  RETURNING 1
),

-- 3) Rating por versão (version NOT NULL)
ins_rating_v AS (
  INSERT INTO ratings (object_id, user_id, stars, comment, version)
  SELECT id, 123, 4, 'Versão 1.0 está estável.', '1.0'
  FROM ins_obj
  RETURNING 1
),

-- 4) Avaliação no legado (object_ratings)
ins_legacy AS (
  INSERT INTO object_ratings (object_id, user_id, stars, comment, version, ip, user_agent)
  SELECT id, NULL, 4, 'Histórico: antes da nova tabela.', '0.9', '127.0.0.1', 'psql/cli'
  FROM ins_obj
  RETURNING 1
),

-- 5) Auditoria de download
ins_download AS (
  INSERT INTO object_downloads (object_id, user_id, ip, user_agent)
  SELECT id, NULL, '127.0.0.1', 'psql/cli'
  FROM ins_obj
  RETURNING 1
)

-- 6) Atualiza o contador no objeto (simula um download)
UPDATE objects
SET downloads_count = downloads_count + 1
WHERE id = (SELECT id FROM ins_obj);

-- =========================================================
-- Conferências rápidas
-- =========================================================
SELECT * FROM objects;
SELECT * FROM ratings;
SELECT * FROM object_ratings;
SELECT * FROM object_downloads;

-- Médias/contagens (igual ao que seu backend faz):
SELECT object_id, AVG(stars) AS avg, COUNT(*) AS count
FROM ratings
GROUP BY object_id
ORDER BY object_id;
