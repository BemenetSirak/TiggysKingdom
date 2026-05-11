CREATE TABLE IF NOT EXISTS activity_log (
  id      SERIAL      PRIMARY KEY,
  action  TEXT        NOT NULL,
  details JSONB       DEFAULT '{}',
  at      TIMESTAMPTZ DEFAULT NOW()
);
