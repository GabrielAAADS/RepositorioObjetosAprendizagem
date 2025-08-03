CREATE TABLE IF NOT EXISTS objects (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(255) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category    VARCHAR(100) NOT NULL DEFAULT '',
  file_path   VARCHAR(500) NOT NULL,
  created_at  TIMESTAMP   DEFAULT NOW()
);