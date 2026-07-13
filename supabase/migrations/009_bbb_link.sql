-- Punch List 4, items 3 & 4: BBB profile link, admin-managed.
-- Presence of a URL in this field is itself the verification (admin manually
-- confirms the correct BBB profile before entering it, same manual-check
-- pattern already used for license/insurance and veteran credentials).

ALTER TABLE public.contractor_profiles
  ADD COLUMN IF NOT EXISTS bbb_url TEXT;
