CREATE TABLE IF NOT EXISTS reset_tokens (
  id         SERIAL PRIMARY KEY,
  email      TEXT   NOT NULL,
  code       TEXT   NOT NULL,
  expires_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS reset_tokens_email_idx ON reset_tokens (email);
