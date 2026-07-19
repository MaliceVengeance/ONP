-- Punch List 6, items 1-3: bonding as its own credential type, and a flexible
-- one-to-many credential list replacing the single license_number/license_expiry
-- fields (which cannot correctly represent either El Paso, TX or Las Cruces, NM
-- licensing/registration/bonding requirements, let alone both).
--
-- Note: contractor_profiles.license_number / license_expiry / coi_* fields are
-- left in place (not dropped) — insurance stays a single-entry concept (one COI
-- typically covers the whole business), only license/registration/bond becomes
-- multi-entry. The old license_number/license_expiry fields become legacy/unused
-- by the UI going forward but are not destructive to remove them here.

CREATE TABLE IF NOT EXISTS public.contractor_credentials (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id      UUID NOT NULL REFERENCES public.contractor_profiles(contractor_id) ON DELETE CASCADE,
  credential_type    TEXT NOT NULL CHECK (credential_type IN ('STATE_LICENSE', 'CITY_REGISTRATION', 'TRADE_LICENSE', 'BOND')),
  state              TEXT,
  city               TEXT,
  credential_number  TEXT,
  issuing_authority  TEXT,
  trade              TEXT,
  expiration_date    DATE,
  bond_amount_cents  BIGINT,
  bonding_company    TEXT,
  verified           BOOLEAN NOT NULL DEFAULT FALSE,
  verified_at        TIMESTAMPTZ,
  verified_by        UUID,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS contractor_credentials_contractor_id_idx
  ON public.contractor_credentials (contractor_id);

ALTER TABLE public.contractor_credentials ENABLE ROW LEVEL SECURITY;

-- Contractor manages their own credential entries
CREATE POLICY "contractor_manage_own_credentials"
  ON public.contractor_credentials FOR ALL
  USING (contractor_id = auth.uid())
  WITH CHECK (contractor_id = auth.uid());

-- Public can read verified credentials belonging to listed, directory-verified
-- contractors (mirrors the same gate already used for portfolio photos).
CREATE POLICY "public_read_verified_listed_contractor_credentials"
  ON public.contractor_credentials FOR SELECT
  USING (
    verified = true
    AND EXISTS (
      SELECT 1 FROM public.contractor_profiles cp
      WHERE cp.contractor_id = contractor_credentials.contractor_id
        AND cp.is_listed = true
        AND cp.directory_verified = true
    )
  );
