CREATE TABLE IF NOT EXISTS admins (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  email      TEXT        UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO admins (email) VALUES ('bemenetzeleke0@gmail.com') ON CONFLICT DO NOTHING;
