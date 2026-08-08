-- ============================================================================
-- Migration 018: Restore Database Privilege Baseline
-- ============================================================================
--
-- PURPOSE
--   A read-only audit comparing production (efxjujtetreipxvxxfip) against a
--   staging project rebuilt purely from migrations 016 + 017
--   (qbdihnmgxtowqnvzflfh) found that staging's public-schema tables are
--   missing SELECT/INSERT/UPDATE/DELETE for anon, authenticated, and
--   service_role -- present on production, absent on staging, uniformly
--   across all 42 tables (confirmed with zero per-table exceptions in
--   either environment).
--
--   Root cause, confirmed by directly comparing pg_default_acl between the
--   two environments rather than assumed: staging's own
--   ALTER DEFAULT PRIVILEGES entry for role postgres in schema public only
--   ever granted TRUNCATE/REFERENCES/TRIGGER/MAINTAIN, never the four DML
--   privileges that production's equivalent entry has. Because every table
--   in both environments is owned by postgres, every table inherited
--   whatever that default happened to be at creation time -- which is why
--   the gap is schema-wide rather than table-specific.
--
--   Migration 016 never captured grant/privilege state at all -- no
--   GRANT, REVOKE, or ALTER DEFAULT PRIVILEGES statement exists anywhere in
--   migrations 001-017 -- so a recovery built purely from 016+017 was never
--   going to reproduce this. This migration restores it explicitly.
--
-- SCOPE (approved repair scope only)
--   - Existing public-table DML grants (SELECT/INSERT/UPDATE/DELETE).
--   - ALTER DEFAULT PRIVILEGES so future postgres-owned public tables
--     inherit the same grants automatically.
--   - Existing/future public sequence privileges (USAGE/SELECT/UPDATE),
--     for future-proofing -- zero sequences exist in public today, but
--     production's own default ACL for sequences already includes these
--     roles, so this closes the same latent gap before any future table
--     ever needs a SERIAL/IDENTITY column.
--
--   Deliberately excludes:
--   - Function EXECUTE grants -- production's own default ACL for public
--     functions has no anon/authenticated/service_role entry (only
--     postgres). Adding one here would not be derived from verified
--     production state. Staging's functions already work correctly via
--     Postgres's built-in behavior of granting EXECUTE to PUBLIC when a
--     function's ACL is NULL (confirmed: all 20 staging functions have a
--     NULL proacl, vs. production's 20 functions each having an explicit
--     per-role ACL -- different mechanism, same effective access).
--   - RLS in any way -- no ALTER TABLE ... ENABLE/DISABLE ROW LEVEL
--     SECURITY, no CREATE/DROP POLICY. RLS state is already identical
--     between staging and production. This migration only touches the
--     separate, lower-level table-privilege mechanism RLS sits on top of.
--
-- SAFETY / IDEMPOTENCY
--   GRANT and ALTER DEFAULT PRIVILEGES are both idempotent by nature in
--   PostgreSQL -- re-granting an already-held privilege, or re-declaring an
--   identical default-privilege rule, is a no-op, never an error. Safe to
--   run repeatedly, and safe if accidentally run against production, where
--   these exact grants already exist in full.
-- ============================================================================

-- Existing tables: bring the current public tables up to production parity.
GRANT SELECT, INSERT, UPDATE, DELETE
  ON ALL TABLES IN SCHEMA public
  TO anon, authenticated, service_role;

-- Future tables: fix the underlying default so anything created hereafter
-- (by the postgres role, matching production's own grantor context)
-- inherits the same privileges automatically, instead of repeating this
-- gap on the next migration.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES
  TO anon, authenticated, service_role;

-- Sequences: none exist in public today, but production's default ACL for
-- sequences already includes these roles -- matching it now avoids the same
-- silent gap the moment any future table needs a SERIAL/IDENTITY column.
GRANT USAGE, SELECT, UPDATE
  ON ALL SEQUENCES IN SCHEMA public
  TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT USAGE, SELECT, UPDATE ON SEQUENCES
  TO anon, authenticated, service_role;
