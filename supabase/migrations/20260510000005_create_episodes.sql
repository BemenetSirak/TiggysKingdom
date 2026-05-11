CREATE TABLE IF NOT EXISTS episodes (
  id         SERIAL      PRIMARY KEY,
  video_id   TEXT        NOT NULL DEFAULT '',
  title      TEXT        NOT NULL,
  description TEXT,
  ages       TEXT,
  category   TEXT        DEFAULT 'general',
  featured   BOOLEAN     DEFAULT false,
  sort_order INTEGER     DEFAULT 1,
  active     BOOLEAN     DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
