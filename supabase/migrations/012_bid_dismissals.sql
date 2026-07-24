-- Punch List 7, item 2: proposal dismissal/rejection.
-- Reason taxonomy is a DB-backed lookup (not hardcoded) so new reasons can be
-- added later without a code deploy — same principle as Page 9's pass reasons
-- would use, though Page 9 itself doesn't exist yet in this codebase.

CREATE TABLE IF NOT EXISTS public.bid_dismissal_reasons (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        TEXT NOT NULL UNIQUE,
  label       TEXT NOT NULL,
  sort_order  INT NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.bid_dismissal_reasons (code, label, sort_order) VALUES
  ('OVER_BUDGET',        'Over Budget',                                 10),
  ('UNDER_BUDGET',       'Under Budget',                                20),
  ('TIMELINE',           'Timeline doesn''t work',                      30),
  ('PROPOSAL_UNCLEAR',   'Proposal incomplete or unclear',              40),
  ('MISSING_CREDENTIALS','Missing license/insurance/bond info',         50),
  ('PORTFOLIO_MISMATCH', 'Portfolio/experience didn''t match project needs', 60),
  ('WENT_ANOTHER',       'Went with another contractor',                70),
  ('OTHER',              'Other',                                       80)
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.bid_dismissals (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  contractor_id       UUID NOT NULL,
  bid_id              UUID NOT NULL REFERENCES public.bids(id) ON DELETE CASCADE,
  reason_code         TEXT REFERENCES public.bid_dismissal_reasons(code),
  reason_other_text   TEXT,
  dismissed_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  dismissed_by        UUID NOT NULL,
  -- Profanity: dismissal proceeds without the text ever reaching the
  -- contractor either way; this flag exists purely so admin can track a
  -- client's pattern of behavior over time, independent of moderation_status.
  contains_profanity  BOOLEAN NOT NULL DEFAULT FALSE,
  -- Discriminatory/sensitive content: a separate concern from profanity —
  -- this drives whether the reason text is ever delivered to the contractor
  -- at all. not_applicable = no free text or nothing flagged (delivered
  -- immediately); pending_review = held for admin; approved = delivered as a
  -- follow-up; rejected = never delivered.
  moderation_status   TEXT NOT NULL DEFAULT 'not_applicable'
                        CHECK (moderation_status IN ('not_applicable', 'pending_review', 'approved', 'rejected')),
  reviewed_at         TIMESTAMPTZ,
  reviewed_by         UUID,
  UNIQUE (bid_id)
);

CREATE INDEX IF NOT EXISTS bid_dismissals_project_id_idx ON public.bid_dismissals (project_id);
CREATE INDEX IF NOT EXISTS bid_dismissals_contractor_id_idx ON public.bid_dismissals (contractor_id);
CREATE INDEX IF NOT EXISTS bid_dismissals_dismissed_by_idx ON public.bid_dismissals (dismissed_by);
CREATE INDEX IF NOT EXISTS bid_dismissals_moderation_status_idx ON public.bid_dismissals (moderation_status);

ALTER TABLE public.bid_dismissal_reasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bid_dismissals ENABLE ROW LEVEL SECURITY;

-- Reasons are public reference data — anyone authenticated can read the list
-- (needed by the client-side dismiss form).
CREATE POLICY "authenticated_read_dismissal_reasons"
  ON public.bid_dismissal_reasons FOR SELECT
  TO authenticated
  USING (true);

-- Client who dismissed can read their own dismissal rows; contractor whose
-- bid was dismissed can read their own (for the "your bid was dismissed"
-- notice) — mirrors the existing bids/bid_versions ownership pattern.
CREATE POLICY "client_read_own_dismissals"
  ON public.bid_dismissals FOR SELECT
  USING (
    dismissed_by = auth.uid()
    OR contractor_id = auth.uid()
  );

CREATE POLICY "client_insert_own_dismissals"
  ON public.bid_dismissals FOR INSERT
  WITH CHECK (dismissed_by = auth.uid());
