// Plain module (no "use server") — shared by joinWaitlist (public action)
// and the internal trusted-signup path, so both dedupe the same way.

import { supabaseAdmin } from "@/lib/supabase/admin";
import { interpretWaitlistInsertError } from "./classify";
import { logServiceAreaError } from "./log";
import type { IntendedRole, WaitlistSource } from "./normalize";

/**
 * Attempts the insert directly and treats the unique-violation error code
 * (23505 — collision on the normalized (lower(trim(email)), zip,
 * intended_role) index from Migration 017) as a successful dedup, rather
 * than doing a separate SELECT-then-INSERT that would leave a race window.
 */
export async function insertWaitlistRow(row: {
  email: string;
  zip: string;
  intended_role: IntendedRole;
  source: WaitlistSource;
  userId: string | null;
}): Promise<{ ok: true; deduped: boolean } | { ok: false }> {
  const { error } = await supabaseAdmin.from("service_area_waitlist").insert({
    email: row.email,
    zip: row.zip,
    intended_role: row.intended_role,
    source: row.source,
    user_id: row.userId,
  });

  const interpreted = interpretWaitlistInsertError(error);
  if (!interpreted.ok) {
    logServiceAreaError("insertWaitlistRow", {
      userId: row.userId,
      zip: row.zip,
      code: error?.code ?? null,
      message: error?.message ?? null,
    });
    return { ok: false };
  }
  return { ok: true, deduped: interpreted.deduped };
}
