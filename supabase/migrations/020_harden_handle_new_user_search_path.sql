-- ============================================================================
-- Migration 020: Harden handle_new_user() Search-Path Resolution
-- ============================================================================
--
-- PURPOSE
--   A staging E2E signup attempt failed with:
--     type "role_type" does not exist  (Postgres 42704)
--   Root cause, confirmed by direct reproduction (rolled back, no state
--   persisted): public.handle_new_user() casts
--   NEW.raw_user_meta_data->>'signup_role' to `role_type` without schema-
--   qualifying the type, and the function has no SET search_path of its
--   own -- so it resolves `role_type` using the CALLING SESSION's search_path,
--   not a fixed one. The role that fires this trigger, supabase_auth_admin,
--   has search_path=auth configured (confirmed via pg_roles.rolconfig,
--   identical in staging and production) -- under that search_path,
--   `role_type` (which lives only in schema public) cannot be found.
--
--   This is the only search-path-sensitive reference in the function --
--   every other reference (the INSERT target public.profiles, COALESCE,
--   the jsonb ->> operator) is either already schema-qualified or a
--   pg_catalog built-in that resolves regardless of search_path, confirmed
--   by direct per-reference testing under search_path=auth.
--
--   The function definition, role configuration, and every other DB-visible
--   setting are byte-for-byte identical between staging and production, so
--   this fix is written to be correct and safe in both, not staging-specific.
--
-- SCOPE
--   Exactly one function: public.handle_new_user(). No other object is
--   touched. Business logic (which columns get populated, from which
--   metadata keys, with which default) is completely unchanged -- only the
--   ::role_type cast is schema-qualified, and a pinned, minimal
--   SET search_path is added so the function's behavior no longer depends
--   on the invoking role's session search_path at all (defense in depth
--   beyond just fixing the one reference that currently breaks).
--
--   SET search_path = public, pg_temp: `public` because that's where every
--   object this function touches actually lives; `pg_temp` is included per
--   Postgres's own SECURITY DEFINER hardening guidance, so a session-local
--   temporary object can never shadow a resolution inside this function.
--   No extension functions are called here, so `extensions` is not needed.
--
-- SAFETY / IDEMPOTENCY
--   CREATE OR REPLACE FUNCTION preserves the function's OID, so the existing
--   on_auth_user_created trigger binding on auth.users requires no change
--   and continues to reference this same function automatically. Ownership
--   (postgres) and SECURITY DEFINER are both preserved unchanged -- neither
--   is altered by this migration. Re-running this migration is a no-op
--   (CREATE OR REPLACE is idempotent).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  INSERT INTO public.profiles (id, role, display_name, company_name, service_area_zip)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'signup_role', 'CLIENT')::public.role_type,
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'company_name',
    NEW.raw_user_meta_data->>'service_area_zip'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$;
