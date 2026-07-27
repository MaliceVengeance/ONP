-- Punch List 8, item 1: site-wide "Report a Problem" link (every page, including admin).
-- Storage bucket "problem-report-screenshots" created directly via the Storage API
-- (private — reads go through the service role, same pattern as "bid-quotes").

CREATE TABLE IF NOT EXISTS public.problem_reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_url        TEXT NOT NULL,
  description     TEXT NOT NULL,
  screenshot_path TEXT,
  user_id         UUID,
  user_email      TEXT,
  user_role       TEXT,
  status          TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'RESOLVED')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS problem_reports_status_idx ON public.problem_reports (status);
CREATE INDEX IF NOT EXISTS problem_reports_created_at_idx ON public.problem_reports (created_at);

ALTER TABLE public.problem_reports ENABLE ROW LEVEL SECURITY;

-- No client-facing SELECT/INSERT policy — submissions go through the service
-- role in a server action (same pattern as portfolio photos, credentials,
-- etc.), so a logged-out visitor on a public page can still submit one.
