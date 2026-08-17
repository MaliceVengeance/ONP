// Plain module (no "use server") — holds the service-role Supabase client
// and performs a privileged write, so it has no legitimate client-side
// use. "server-only" fails the build if it's ever imported from client
// code.
import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";
import type { EarlyAccessRole } from "./normalize";

/**
 * Calls join_early_access_signup() (migration 031), a single atomic
 * INSERT ... ON CONFLICT (lower(trim(email)), role) DO UPDATE. There is no
 * race window between a duplicate check and the write, and no error code
 * to interpret as "already exists" — the function always succeeds for
 * well-formed input, whether it's a fresh insert or a consent-preserving
 * update of an existing row. marketing_consent can only be upgraded
 * false -> true by a duplicate submission, never downgraded.
 */
export async function insertEarlyAccessRow(row: {
  email: string;
  zip: string;
  role: EarlyAccessRole;
  contractorTrade: string | null;
  marketingConsent: boolean;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
}): Promise<{ ok: true } | { ok: false }> {
  const { error } = await supabaseAdmin.rpc("join_early_access_signup", {
    p_email: row.email,
    p_zip: row.zip,
    p_role: row.role,
    p_contractor_trade: row.contractorTrade,
    p_marketing_consent: row.marketingConsent,
    p_utm_source: row.utmSource,
    p_utm_medium: row.utmMedium,
    p_utm_campaign: row.utmCampaign,
  });

  if (error) {
    console.error(
      `[earlyAccess] insertEarlyAccessRow failed code=${error.code ?? "unknown"} message=${error.message}`
    );
    return { ok: false };
  }
  return { ok: true };
}
