CREATE TABLE IF NOT EXISTS users (
  id          TEXT        PRIMARY KEY,
  name        TEXT        NOT NULL,
  email       TEXT        UNIQUE NOT NULL,
  joined_date TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
