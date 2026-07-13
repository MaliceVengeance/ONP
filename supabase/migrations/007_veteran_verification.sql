-- Punch List 3, item 2: structured credential capture + rejection messaging
-- for the existing veteran-owned verification workflow (contractor_profiles.veteran_verified).

alter table contractor_profiles
  add column if not exists veteran_credential_type text
    check (veteran_credential_type in ('TVC_VVL', 'VA_VETCERT')),
  add column if not exists veteran_credential_reference text,
  add column if not exists veteran_rejection_reason text;
