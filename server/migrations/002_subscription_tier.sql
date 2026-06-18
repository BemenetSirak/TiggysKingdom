-- Migration 002: subscription tiers
--
-- Adds the columns needed to sync a Stripe subscription tier per user.
-- (Note: 001_schema.sql is stale relative to the live database — `users.id`
-- is already `text`, already has `joined_date`, and has no `password_hash`
-- column. This migration only adds what's actually missing.)

alter table users
  add column if not exists subscription_tier      text default 'free',
  add column if not exists stripe_customer_id     text,
  add column if not exists stripe_subscription_id text;

create index if not exists idx_users_stripe_customer_id on users(stripe_customer_id);
