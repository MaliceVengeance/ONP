-- Punch List 6, item 4: 3/6/12-month prepay subscription terms.
-- term_months is NULL for plain month-to-month subscriptions; set to 3/6/12
-- while a contractor is inside a committed term's paid phase, and cleared
-- back to NULL once Stripe transitions/releases the subscription into the
-- ongoing standard-rate monthly phase after that term completes.

ALTER TABLE public.contractor_subscriptions
  ADD COLUMN IF NOT EXISTS term_months INT,
  ADD COLUMN IF NOT EXISTS commitment_ends_at TIMESTAMPTZ;
