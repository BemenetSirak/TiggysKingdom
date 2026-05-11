CREATE TABLE IF NOT EXISTS products (
  id             SERIAL       PRIMARY KEY,
  title          TEXT         NOT NULL,
  author         TEXT,
  price          NUMERIC(10,2) NOT NULL,
  original_price NUMERIC(10,2),
  category       TEXT         NOT NULL DEFAULT 'story',
  ages           TEXT,
  stock          INTEGER      NOT NULL DEFAULT 0,
  sold           INTEGER      DEFAULT 0,
  rating         NUMERIC(3,1) DEFAULT 5.0,
  reviews        INTEGER      DEFAULT 0,
  badge          TEXT,
  active         BOOLEAN      DEFAULT true,
  created_at     TIMESTAMPTZ  DEFAULT NOW()
);
