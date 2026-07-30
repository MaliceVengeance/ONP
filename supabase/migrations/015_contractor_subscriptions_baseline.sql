-- Punch List 10, item 4 (housekeeping): contractor_subscriptions has existed
-- in the live database since before this migration history began — it was
-- created directly in Supabase, not via a tracked migration, and has only
-- ever been ALTERed since (011_subscription_terms.sql). This file captures
-- its real current schema (confirmed via the live PostgREST OpenAPI spec)
-- so the migration history is reproducible from scratch, without altering
-- the existing live table. Safe to run against the current database: every
-- statement is guarded to no-op if the object already exists.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status') THEN
    CREATE TYPE public.subscription_status AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED', 'TRIALING');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.contractor_subscriptions (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id               UUID NOT NULL REFERENCES public.profiles(id),
  status                      public.subscription_status NOT NULL,
  plan_type                   TEXT,
  plan_interval               TEXT NOT NULL,
  price_cents                 INTEGER NOT NULL,
  currency                    TEXT NOT NULL DEFAULT 'USD',
  current_period_start        TIMESTAMPTZ NOT NULL,
  current_period_end          TIMESTAMPTZ NOT NULL,
  auto_renew                  BOOLEAN NOT NULL DEFAULT TRUE,
  cancel_at_period_end        BOOLEAN NOT NULL DEFAULT FALSE,
  grace_until                 TIMESTAMPTZ,
  provider                    TEXT,
  provider_customer_id        TEXT,
  provider_subscription_id    TEXT,
  stripe_customer_id          TEXT,
  stripe_subscription_id      TEXT,
  term_months                 INTEGER,
  commitment_ends_at          TIMESTAMPTZ,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- The app's only write path is upsert(..., { onConflict: "contractor_id" })
-- (subscribe checkout + webhook handlers) — one subscription row per
-- contractor is the real invariant this table has always relied on.
CREATE UNIQUE INDEX IF NOT EXISTS contractor_subscriptions_contractor_id_key
  ON public.contractor_subscriptions (contractor_id);

-- Webhook handlers look subscriptions up by Stripe customer ID on every event.
CREATE INDEX IF NOT EXISTS contractor_subscriptions_stripe_customer_id_idx
  ON public.contractor_subscriptions (stripe_customer_id);

-- Punch List 10: directory listing and project browsing/detail pages now
-- filter on subscription status directly — this index keeps that check cheap.
CREATE INDEX IF NOT EXISTS contractor_subscriptions_status_idx
  ON public.contractor_subscriptions (status);

ALTER TABLE public.contractor_subscriptions ENABLE ROW LEVEL SECURITY;
