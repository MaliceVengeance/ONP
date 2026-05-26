import { supabaseAdmin } from "@/lib/supabase/admin";

/** Sum of all AVAILABLE credits for a client, in cents. */
export async function getTotalAvailableCredits(clientId: string): Promise<number> {
  const { data } = await supabaseAdmin
    .from("client_credits")
    .select("amount_cents")
    .eq("client_id", clientId)
    .eq("status", "AVAILABLE");
  return (data ?? []).reduce((sum: number, r: any) => sum + (r.amount_cents ?? 0), 0);
}

/**
 * Grant a credit to a client. Expires after 12 months by default.
 */
export async function grantCredit({
  clientId,
  amountCents,
  source,
  sourceReferenceId,
}: {
  clientId: string;
  amountCents: number;
  source: string;
  sourceReferenceId?: string;
}): Promise<void> {
  const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
  await supabaseAdmin.from("client_credits").insert({
    client_id: clientId,
    amount_cents: amountCents,
    source,
    source_reference_id: sourceReferenceId ?? null,
    status: "AVAILABLE",
    expires_at: expiresAt,
  });
}

/**
 * Apply available credits toward a charge. Marks credits USED immediately.
 * Uses soonest-expiring credits first.
 * Handles partial credit use (splits a credit row if needed).
 *
 * @param usedForReferenceId - The assignment/log ID, stored on each used credit row for restoration.
 * @returns The actual cents applied (≤ feeCents).
 */
export async function applyCredits(
  clientId: string,
  feeCents: number,
  usedForReferenceId: string
): Promise<number> {
  const now = new Date().toISOString();

  const { data: credits } = await supabaseAdmin
    .from("client_credits")
    .select("id, amount_cents, source, source_reference_id, expires_at")
    .eq("client_id", clientId)
    .eq("status", "AVAILABLE")
    .order("expires_at", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  let remaining = feeCents;
  let totalApplied = 0;

  for (const credit of (credits ?? [])) {
    if (remaining <= 0) break;
    const c = credit as any;
    const useAmount = Math.min(c.amount_cents as number, remaining);
    remaining -= useAmount;
    totalApplied += useAmount;

    if (useAmount === c.amount_cents) {
      // Use entire credit row
      await supabaseAdmin
        .from("client_credits")
        .update({ status: "USED", used_at: now, used_for_reference_id: usedForReferenceId })
        .eq("id", c.id);
    } else {
      // Partial use: reduce existing credit, insert a new USED record for the consumed portion
      await supabaseAdmin
        .from("client_credits")
        .update({ amount_cents: (c.amount_cents as number) - useAmount })
        .eq("id", c.id);

      await supabaseAdmin.from("client_credits").insert({
        client_id: clientId,
        amount_cents: useAmount,
        source: c.source,
        source_reference_id: c.source_reference_id,
        status: "USED",
        expires_at: c.expires_at,
        used_at: now,
        used_for_reference_id: usedForReferenceId,
      });
    }
  }

  return totalApplied;
}

/**
 * Restore credits that were applied for a given reference (e.g. on Stripe checkout expiry).
 * Finds all USED credits with the given reference ID and marks them AVAILABLE again.
 */
export async function restoreCredits(usedForReferenceId: string): Promise<void> {
  await supabaseAdmin
    .from("client_credits")
    .update({ status: "AVAILABLE", used_at: null, used_for_reference_id: null })
    .eq("used_for_reference_id", usedForReferenceId)
    .eq("status", "USED");
}
