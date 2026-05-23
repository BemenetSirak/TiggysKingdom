-- Tiggy's Kingdom — full schema
-- Run this in the Supabase SQL editor to create all tables.

-- ── Episodes ──────────────────────────────────────────────────────────────────
create table if not exists episodes (
  id           serial primary key,
  title        text        not null,
  description  text,
  video_id     text,                        -- YouTube video ID
  thumbnail    text,
  age_range    text        default 'All',   -- e.g. "3-5", "6-8", "9-12", "All"
  duration     text,                        -- e.g. "12:34"
  sort_order   integer     default 0,
  published    boolean     default true,
  created_at   timestamptz default now()
);

-- ── Products ──────────────────────────────────────────────────────────────────
create table if not exists products (
  id          serial primary key,
  title       text           not null,
  author      text,
  description text,
  price       numeric(10,2)  not null default 0,
  category    text           default 'book', -- book | activity | gift
  badge       text,                          -- e.g. "NEW", "BESTSELLER"
  active      boolean        default true,
  created_at  timestamptz    default now()
);

-- ── Users ─────────────────────────────────────────────────────────────────────
create table if not exists users (
  id            uuid        primary key default gen_random_uuid(),
  name          text        not null,
  email         text        not null unique,
  password_hash text        not null,
  is_subscriber boolean     default false,
  created_at    timestamptz default now()
);

-- ── Orders ────────────────────────────────────────────────────────────────────
create table if not exists orders (
  id                uuid        primary key default gen_random_uuid(),
  user_id           uuid        references users(id) on delete set null,
  customer_name     text,
  customer_email    text,
  items             jsonb       default '[]',
  total             numeric(10,2) not null default 0,
  status            text        default 'placed',   -- placed|processing|shipped|delivered|cancelled
  payment_status    text        default 'pending',  -- pending|paid|failed|refunded
  stripe_session_id text,
  cancellation_requested boolean default false,
  paid_at           timestamptz,
  created_at        timestamptz default now()
);

-- ── Subscribers ───────────────────────────────────────────────────────────────
create table if not exists subscribers (
  id         serial      primary key,
  email      text        not null unique,
  source     text        default 'footer',  -- footer|mobile-menu|home|subscribe-page
  created_at timestamptz default now()
);

-- ── Activity log ──────────────────────────────────────────────────────────────
create table if not exists activity_log (
  id         serial      primary key,
  action     text        not null,
  details    jsonb       default '{}',
  at         timestamptz default now()
);

-- ── Password reset tokens ─────────────────────────────────────────────────────
create table if not exists reset_tokens (
  id         serial      primary key,
  user_id    uuid        not null references users(id) on delete cascade,
  token      text        not null unique,
  expires_at timestamptz not null,
  used       boolean     default false,
  created_at timestamptz default now()
);

-- ── Admins ────────────────────────────────────────────────────────────────────
create table if not exists admins (
  id            serial      primary key,
  username      text        not null unique,
  password_hash text        not null,
  created_at    timestamptz default now()
);

-- ── Useful indexes ────────────────────────────────────────────────────────────
create index if not exists idx_orders_user_id           on orders(user_id);
create index if not exists idx_orders_stripe_session_id on orders(stripe_session_id);
create index if not exists idx_episodes_sort_order      on episodes(sort_order);
create index if not exists idx_reset_tokens_token       on reset_tokens(token);
