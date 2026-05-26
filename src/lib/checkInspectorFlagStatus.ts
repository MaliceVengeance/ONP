import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  sendInspectorFlagThresholdEmail,
  sendAdminInspectorFlagThresholdEmail,
} from "@/lib/email";

export type FlagStatus =
  | "OK"
  | "SOFT_ALERT"
  | "MANDATORY_REVIEW"
  | "SUSPENSION_RECOMMENDED";

export interface InspectorFlagStatusResult {
  inspector_id: string;
  flags_12mo: number;
  inspections_12mo: number;
  flag_rate: number; // 0.0 – 1.0
  status: FlagStatus;
  last_flag_at: string | null;
}

/**
 * Recomputes the rate-based flag status for an inspector after a dispute resolution.
 *
 * If status crosses MANDATORY_REVIEW or SUSPENSION_RECOMMENDED:
 *   1. Sets upgrade_blocked = true on their profiles row
 *   2. Notifies the inspector by email
 *   3. Notifies all admins by email
 *
 * Safe to call fire-and-forget — all failures are logged, not thrown.
 */
export async function checkInspectorFlagStatus(
  inspectorId: string
): Promise<InspectorFlagStatusResult | null> {
  const { data, error } = await supabaseAdmin.rpc("get_inspector_flag_status", {
    p_inspector_id: inspectorId,
  });

  if (error || !data || (data as any[]).length === 0) {
    console.error("get_inspector_flag_status RPC failed:", error);
    return null;
  }

  const raw = (data as any[])[0];
  const result: InspectorFlagStatusResult = {
    inspector_id: raw.inspector_id,
    flags_12mo: Number(raw.flags_12mo),
    inspections_12mo: Number(raw.inspections_12mo),
    flag_rate: parseFloat(String(raw.flag_rate)),
    status: raw.status as FlagStatus,
    last_flag_at: raw.last_flag_at ?? null,
  };

  if (
    result.status === "MANDATORY_REVIEW" ||
    result.status === "SUSPENSION_RECOMMENDED"
  ) {
    // Block the inspector from requesting further on-site upgrades
    await supabaseAdmin
      .from("profiles")
      .update({ upgrade_blocked: true })
      .eq("id", inspectorId)
      .then(({ error: e }) => {
        if (e) console.error("Failed to set upgrade_blocked on inspector:", e);
      });

    // Notify inspector + all admins
    try {
      const [{ data: inspAuth }, { data: adminProfiles }] = await Promise.all([
        supabaseAdmin.auth.admin.getUserById(inspectorId),
        supabaseAdmin.from("profiles").select("id").eq("role", "ADMIN"),
      ]);

      const inspEmail  = inspAuth?.user?.email;
      const flagRatePct = (result.flag_rate * 100).toFixed(1);
      const thresholdStatus = result.status as "MANDATORY_REVIEW" | "SUSPENSION_RECOMMENDED";

      if (inspEmail) {
        sendInspectorFlagThresholdEmail({
          inspectorEmail: inspEmail,
          status: thresholdStatus,
          flags12mo: result.flags_12mo,
          inspections12mo: result.inspections_12mo,
          flagRatePct,
        }).catch((e: unknown) =>
          console.error("Inspector flag threshold email failed:", e)
        );
      }

      for (const admin of adminProfiles ?? []) {
        const { data: adminAuth } = await supabaseAdmin.auth.admin.getUserById(
          (admin as any).id
        );
        const adminEmail = adminAuth?.user?.email;
        if (adminEmail) {
          sendAdminInspectorFlagThresholdEmail({
            adminEmail,
            inspectorId,
            status: thresholdStatus,
            flags12mo: result.flags_12mo,
            inspections12mo: result.inspections_12mo,
            flagRatePct,
          }).catch((e: unknown) =>
            console.error("Admin flag threshold email failed:", e)
          );
        }
      }
    } catch (e) {
      console.error("Flag threshold notifications error (non-fatal):", e);
    }
  }

  return result;
}
