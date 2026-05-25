import { createSupabaseServerClient } from "@/lib/supabase/server";

const MAX_PER_WINDOW = 2;
const WINDOW_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface EmergencyRequestStatus {
  /** Paid (counting) requests in the last 30 days */
  used: number;
  /** Admin-granted bonus slots not yet consumed */
  adminBonus: number;
  /** Effective slots remaining (0 floor) */
  remaining: number;
  /** Earliest date a slot frees up, if remaining === 0 */
  nextSlotAvailableAt: Date | null;
}

export async function getEmergencyRequestStatus(
  clientId: string
): Promise<EmergencyRequestStatus> {
  const supabase = await createSupabaseServerClient();

  const windowStart = new Date(Date.now() - WINDOW_MS).toISOString();

  // Counting rows in the rolling 30-day window
  const { data: countingRows } = await supabase
    .from("emergency_request_log")
    .select("created_at")
    .eq("client_id", clientId)
    .eq("counts_against_limit", true)
    .neq("payment_status", "FAILED")
    .gte("created_at", windowStart)
    .order("created_at", { ascending: true });

  // Unused admin-granted bonus slots (project_id is null = not yet consumed)
  const { data: bonusRows } = await supabase
    .from("emergency_request_log")
    .select("id")
    .eq("client_id", clientId)
    .eq("admin_granted", true)
    .is("project_id", null);

  const used = (countingRows ?? []).length;
  const adminBonus = (bonusRows ?? []).length;
  const effective = MAX_PER_WINDOW + adminBonus;
  const remaining = Math.max(0, effective - used);

  let nextSlotAvailableAt: Date | null = null;
  if (remaining === 0 && (countingRows ?? []).length > 0) {
    const earliest = new Date((countingRows![0] as any).created_at);
    nextSlotAvailableAt = new Date(earliest.getTime() + WINDOW_MS);
  }

  return { used, adminBonus, remaining, nextSlotAvailableAt };
}

export function formatNextSlot(d: Date): string {
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
