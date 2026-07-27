-- Punch List 8, item 6: subscription-charge billing disputes.
-- The existing charge.dispute.created handler only covers emergency-bid-
-- payment disputes (via emergency_request_log) and does nothing for a
-- contractor subscription dispute. This table + the extended webhook logic
-- gives those a real admin-visible queue instead of silently doing nothing.

CREATE TABLE IF NOT EXISTS public.subscription_disputes (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_dispute_id       TEXT NOT NULL UNIQUE,
  stripe_payment_intent_id TEXT,
  stripe_customer_id      TEXT,
  contractor_id           UUID,
  amount_cents            BIGINT,
  currency                TEXT,
  reason                  TEXT,
  stripe_status           TEXT,
  status                  TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'RESOLVED')),
  admin_note              TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at             TIMESTAMPTZ,
  resolved_by             UUID
);

CREATE INDEX IF NOT EXISTS subscription_disputes_status_idx ON public.subscription_disputes (status);
CREATE INDEX IF NOT EXISTS subscription_disputes_contractor_id_idx ON public.subscription_disputes (contractor_id);

ALTER TABLE public.subscription_disputes ENABLE ROW LEVEL SECURITY;

-- No client-facing policy — only the webhook (service role) writes here,
-- only admin (service role via requireRole) reads/updates it.
