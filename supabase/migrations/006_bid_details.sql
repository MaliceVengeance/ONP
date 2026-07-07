-- ============================================================
-- Bid Detail Page: structured quote fields + itemized line items
-- Run this in Supabase SQL Editor
--
-- Also required (not covered by this file — Supabase Storage buckets
-- are created via the Dashboard, not SQL, to match how "project-files"
-- was set up): create a new PRIVATE bucket named "bid-quotes"
-- (Dashboard → Storage → New bucket → Public: OFF). No storage RLS
-- policies are needed on it — all reads/writes to this bucket go
-- through the service role in server actions, gated by app-level logic
-- (same pattern already used to reveal bid amounts after a project's
-- bidding window closes).
-- ============================================================

-- 1. Structured quote fields on bid_versions (each bid revision carries
--    its own copy, same as amount_cents/notes already do).
ALTER TABLE public.bid_versions
  ADD COLUMN IF NOT EXISTS warranty_terms      TEXT,
  ADD COLUMN IF NOT EXISTS deposit_terms       TEXT,
  ADD COLUMN IF NOT EXISTS scope_disclaimers   TEXT,
  ADD COLUMN IF NOT EXISTS estimate_valid_until DATE,
  ADD COLUMN IF NOT EXISTS quote_pdf_path       TEXT,
  ADD COLUMN IF NOT EXISTS quote_pdf_filename   TEXT;

-- 2. Itemized line items, one row per line, scoped to a specific bid version
CREATE TABLE IF NOT EXISTS public.bid_line_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bid_version_id   UUID NOT NULL REFERENCES public.bid_versions(id) ON DELETE CASCADE,
  description      TEXT NOT NULL,
  quantity         NUMERIC NOT NULL DEFAULT 1,
  unit_price_cents BIGINT NOT NULL DEFAULT 0,
  tax_pct          NUMERIC NOT NULL DEFAULT 0,
  sort_order       INT NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS bid_line_items_bid_version_id_idx
  ON public.bid_line_items (bid_version_id);

-- 3. RLS — mirrors the existing "contractor can read/write their own bid
--    data" pattern already in place for bids/bid_versions.
ALTER TABLE public.bid_line_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contractor_manage_own_line_items"
  ON public.bid_line_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.bid_versions bv
      JOIN public.bids b ON b.id = bv.bid_id
      WHERE bv.id = bid_line_items.bid_version_id
        AND b.contractor_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bid_versions bv
      JOIN public.bids b ON b.id = bv.bid_id
      WHERE bv.id = bid_line_items.bid_version_id
        AND b.contractor_id = auth.uid()
    )
  );

-- Note: the client-side Bid Detail Page reads line items via the
-- service-role client (supabaseAdmin), same as it already does for
-- bids/bid_versions/contractor_profiles — so no client-facing SELECT
-- policy is added here beyond the contractor's own access above.
