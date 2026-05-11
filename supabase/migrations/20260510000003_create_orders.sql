CREATE TABLE IF NOT EXISTS orders (
  id                        TEXT         PRIMARY KEY,
  stripe_session_id         TEXT,
  user_id                   TEXT,
  customer_name             TEXT,
  customer_email            TEXT,
  items                     JSONB        DEFAULT '[]',
  total                     NUMERIC(10,2) NOT NULL DEFAULT 0,
  status                    TEXT         NOT NULL DEFAULT 'placed',
  payment_status            TEXT,
  paid_at                   TIMESTAMPTZ,
  note                      TEXT,
  cancellation_requested    BOOLEAN      DEFAULT false,
  cancellation_requested_at TIMESTAMPTZ,
  cancellation_denied_at    TIMESTAMPTZ,
  created_at                TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS orders_user_id_idx        ON orders (user_id);
CREATE INDEX IF NOT EXISTS orders_stripe_session_idx ON orders (stripe_session_id);
CREATE INDEX IF NOT EXISTS orders_status_idx         ON orders (status);
