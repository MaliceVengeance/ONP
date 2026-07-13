-- ============================================================
-- Contractor Portfolio Photos (public directory profile, Page 10)
-- Run this in Supabase SQL Editor
--
-- Also required (not covered by this file — Supabase Storage buckets
-- are created via the Dashboard): create a new PUBLIC bucket named
-- "contractor-portfolio" (Dashboard -> Storage -> New bucket -> Public: ON).
-- Public because these images render on the public /contractors/[id]
-- page, unlike the private "bid-quotes" bucket. No storage RLS
-- policies are needed — uploads/deletes go through the service role
-- in server actions, gated by app-level ownership checks.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.contractor_portfolio_photos (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id  UUID NOT NULL REFERENCES public.contractor_profiles(contractor_id) ON DELETE CASCADE,
  storage_path   TEXT NOT NULL,
  caption        TEXT,
  display_order  INT NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS contractor_portfolio_photos_contractor_id_idx
  ON public.contractor_portfolio_photos (contractor_id);

ALTER TABLE public.contractor_portfolio_photos ENABLE ROW LEVEL SECURITY;

-- Contractor manages their own photos
CREATE POLICY "contractor_manage_own_portfolio_photos"
  ON public.contractor_portfolio_photos FOR ALL
  USING (contractor_id = auth.uid())
  WITH CHECK (contractor_id = auth.uid());

-- Public can read photos belonging to listed, directory-verified contractors
-- (mirrors the same is_listed + directory_verified gate the /contractors
-- directory page already applies to contractor_profiles).
CREATE POLICY "public_read_listed_contractor_photos"
  ON public.contractor_portfolio_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.contractor_profiles cp
      WHERE cp.contractor_id = contractor_portfolio_photos.contractor_id
        AND cp.is_listed = true
        AND cp.directory_verified = true
    )
  );
