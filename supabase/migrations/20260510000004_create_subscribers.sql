CREATE TABLE IF NOT EXISTS subscribers (
  id         SERIAL      PRIMARY KEY,
  email      TEXT        UNIQUE NOT NULL,
  name       TEXT        DEFAULT '',
  source     TEXT        DEFAULT 'api',
  active     BOOLEAN     DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
