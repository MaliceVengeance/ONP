import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { saveContractorSettings } from "./actions";

export default async function ContractorSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { supabase, user } = await requireRole(["CONTRACTOR", "ADMIN"]);
  const sp = await searchParams;

  // Load current settings (may not exist yet — defaults apply)
  const { data: settings } = await supabase
    .from("contractor_settings")
    .select("emergency_notifications_enabled")
    .eq("contractor_id", user.id)
    .maybeSingle();

  // Default: enabled if no row exists
  const emergencyEnabled = settings
    ? settings.emergency_notifications_enabled !== false
    : true;

  return (
    <div style={{ maxWidth: "560px" }}>
      {/* Header */}
      <div className="mob-col mob-gap-sm" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px" }}>
        <div>
          <h1 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "36px",
            letterSpacing: "1px",
            color: "var(--camo-charcoal)",
            margin: 0,
          }}>
            Notification Settings
          </h1>
          <p style={{ fontSize: "13px", color: "var(--camo-gunmetal)", marginTop: "4px" }}>
            Control how ONP contacts you about new opportunities.
          </p>
        </div>
        <Link
          href="/dashboard/contractor"
          style={{
            background: "transparent",
            color: "var(--camo-gunmetal)",
            border: "1px solid #d9dbdb",
            padding: "8px 16px",
            borderRadius: "6px",
            fontFamily: "'Barlow', sans-serif",
            fontSize: "13px",
            textDecoration: "none",
          }}
        >
          ← Back
        </Link>
      </div>

      {/* Saved banner */}
      {sp.saved === "1" && (
        <div style={{
          background: "#F0FDF4",
          border: "1px solid #166534",
          borderRadius: "8px",
          padding: "12px 16px",
          marginBottom: "20px",
          fontSize: "13px",
          color: "#15803D",
        }}>
          ✅ Settings saved.
        </div>
      )}

      <div style={{
        background: "var(--camo-concrete)",
        border: "1px solid #d9dbdb",
        borderRadius: "12px",
        padding: "28px",
      }}>
        <form action={saveContractorSettings}>
          {/* Emergency notifications toggle */}
          <div style={{
            background: "#FFFFFF",
            border: "1px solid #d9dbdb",
            borderRadius: "10px",
            padding: "20px",
            marginBottom: "20px",
          }}>
            <div style={{
              fontSize: "11px",
              fontWeight: 600,
              color: "var(--camo-gunmetal)",
              textTransform: "uppercase",
              letterSpacing: "1px",
              marginBottom: "14px",
            }}>
              Emergency Bid Requests
            </div>

            <label style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "14px",
              cursor: "pointer",
            }}>
              <input
                type="checkbox"
                name="emergency_notifications_enabled"
                defaultChecked={emergencyEnabled}
                style={{ marginTop: "3px", accentColor: "#C2410C", width: "16px", height: "16px", flexShrink: 0 }}
              />
              <div>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--camo-charcoal)", marginBottom: "4px" }}>
                  🚨 Receive Emergency Bid Request emails
                </div>
                <div style={{ fontSize: "13px", color: "var(--camo-gunmetal)", lineHeight: 1.6 }}>
                  When a client posts an emergency bid request in your category, we&apos;ll send you an immediate
                  email notification so you can respond quickly. Emergency projects have a 48-hour bidding window
                  and bids are visible as they come in.
                </div>
              </div>
            </label>

            <div style={{
              background: "var(--camo-paper)",
              border: "1px solid #d9dbdb",
              borderRadius: "8px",
              padding: "12px 14px",
              marginTop: "16px",
              fontSize: "12px",
              color: "var(--camo-gunmetal)",
              lineHeight: 1.6,
            }}>
              <strong>Note:</strong> Emergency bid emails are sent to your account email address.
              Disabling this means you may miss time-sensitive opportunities in your category — but
              you can always check the projects list manually.
            </div>
          </div>

          <button
            type="submit"
            style={{
              background: "var(--camo-gunmetal)",
              color: "#FFFFFF",
              border: "none",
              padding: "12px 28px",
              borderRadius: "6px",
              fontFamily: "'Barlow', sans-serif",
              fontWeight: 600,
              fontSize: "14px",
              letterSpacing: "0.5px",
              cursor: "pointer",
            }}
          >
            Save Settings
          </button>
        </form>
      </div>
    </div>
  );
}
