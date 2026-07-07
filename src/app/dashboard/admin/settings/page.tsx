import { requireRole } from "@/lib/auth/requireRole";
import { getFeatureFlag, FLAGS } from "@/lib/featureFlags";
import { setFeatureFlag } from "./actions";

export default async function AdminSettingsPage() {
  await requireRole(["ADMIN"]);

  const inspectorEnabled = await getFeatureFlag(FLAGS.INSPECTOR_ENABLED);

  const sectionStyle: React.CSSProperties = {
    background: "#EEF4FF",
    border: "1px solid #B8D0E8",
    borderRadius: "12px",
    padding: "24px",
    marginBottom: "20px",
  };

  return (
    <div style={{ maxWidth: "680px" }}>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: "32px",
          color: "#1E3A8A",
          margin: 0,
        }}>
          Platform Settings
        </h1>
        <p style={{ fontSize: "13px", color: "#1B4F8A", marginTop: "6px" }}>
          Toggle platform features on or off without touching the code. Changes take effect immediately.
        </p>
      </div>

      {/* Inspector Feature Flag */}
      <div style={sectionStyle}>
        <div className="mob-col mob-gap-sm" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "20px" }}>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: "20px",
              color: "#1E3A8A",
              marginBottom: "6px",
            }}>
              Inspector Takeoff Feature
            </div>
            <p style={{ fontSize: "13px", color: "#1B4F8A", lineHeight: 1.7, margin: 0 }}>
              Controls whether clients can request an on-site inspector takeoff for their projects.
              When <strong>OFF</strong>, the inspector button is hidden from client project pages and
              the inspector request flow is disabled. Existing assignments and all inspector code
              remain intact — nothing is deleted.
            </p>
            {!inspectorEnabled && (
              <div style={{
                marginTop: "12px",
                fontSize: "12px",
                color: "#92400E",
                background: "#FEF3C7",
                border: "1px solid #FCD34D",
                borderRadius: "6px",
                padding: "8px 12px",
                display: "inline-block",
              }}>
                ⚠ Currently OFF — clients cannot request inspectors
              </div>
            )}
            {inspectorEnabled && (
              <div style={{
                marginTop: "12px",
                fontSize: "12px",
                color: "#166534",
                background: "#DCFCE7",
                border: "1px solid #86EFAC",
                borderRadius: "6px",
                padding: "8px 12px",
                display: "inline-block",
              }}>
                ✅ Currently ON — inspector requests are available to clients
              </div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", flexShrink: 0 }}>
            {inspectorEnabled ? (
              <form action={setFeatureFlag.bind(null, FLAGS.INSPECTOR_ENABLED, false)}>
                <button
                  type="submit"
                  style={{
                    background: "#C8102E",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "10px 20px",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  Turn OFF
                </button>
              </form>
            ) : (
              <form action={setFeatureFlag.bind(null, FLAGS.INSPECTOR_ENABLED, true)}>
                <button
                  type="submit"
                  style={{
                    background: "#166534",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "10px 20px",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  Turn ON
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Placeholder for future flags */}
      <div style={{
        background: "#F8FAFF",
        border: "1px dashed #B8D0E8",
        borderRadius: "12px",
        padding: "20px 24px",
        fontSize: "13px",
        color: "#4A7FB5",
        fontStyle: "italic",
      }}>
        Additional feature flags (emergency bids, contractor onboarding, etc.) can be added here as needed.
      </div>
    </div>
  );
}
