import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { approveOverride, approveEmergencyBidMode, denyOverride } from "./actions";

type OverrideProject = {
  id: string;
  title: string | null;
  state: string;
  deadline_at: string | null;
  override_requested_at: string | null;
  override_requested_reason: string | null;
  client_id: string;
};

export default async function AdminOverrideRequestsPage() {
  const { supabase } = await requireRole(["ADMIN"]);

  const { data, error } = await supabase
    .from("projects")
    .select("id, title, state, deadline_at, override_requested_at, override_requested_reason, client_id")
    .not("override_requested_at", "is", null)
    .eq("urgent_override", false)
    .order("override_requested_at", { ascending: true });

  const requests = (data ?? []) as OverrideProject[];

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
        <div>
          <h1 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "36px",
            letterSpacing: "1px",
            color: "#0A1628",
            margin: 0,
          }}>
            Deadline Requests
          </h1>
          <p style={{ fontSize: "13px", color: "#1B4F8A", marginTop: "4px" }}>
            {requests.length} pending deadline modification request{requests.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/dashboard/admin"
          style={{
            background: "transparent",
            color: "#1B4F8A",
            border: "1px solid #B8D0E8",
            padding: "8px 16px",
            borderRadius: "6px",
            fontFamily: "'Barlow', sans-serif",
            fontSize: "13px",
            textDecoration: "none",
          }}
        >
          Back
        </Link>
      </div>

      {requests.length === 0 ? (
        <div style={{ background: "#EEF4FF", border: "1px solid #B8D0E8", borderRadius: "10px", padding: "32px", textAlign: "center", color: "#1B4F8A", fontSize: "14px" }}>
          No pending override requests.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {requests.map((r) => {
            const deadline = r.deadline_at ? new Date(r.deadline_at) : null;
            const deadlinePassed = !!deadline && deadline.getTime() <= Date.now();
            const isEmergencyBid = (r.override_requested_reason ?? "").includes("[EMERGENCY BID REQUEST]");
            const isEmergency = isEmergencyBid;

            return (
              <div key={r.id} style={{
                background: isEmergencyBid ? "#0A1628" : "#EEF4FF",
                border: `1px solid ${isEmergencyBid ? "#C8102E" : "#FCD34D"}`,
                borderRadius: "12px",
                padding: "20px",
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", marginBottom: "14px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <div style={{ fontWeight: 600, fontSize: "16px", color: isEmergencyBid ? "#FFFFFF" : "#0A1628" }}>
                        {r.title ?? "Untitled Project"}
                      </div>
                      {isEmergencyBid ? (
                        <span style={{
                          fontSize: "10px",
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: "20px",
                          background: "#C8102E",
                          color: "#FFFFFF",
                          border: "1px solid #C8102E",
                          letterSpacing: "0.5px",
                          flexShrink: 0,
                        }}>
                          🚨 EMERGENCY BID
                        </span>
                      ) : (
                        <span style={{
                          fontSize: "10px",
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: "20px",
                          background: "#EEF4FF",
                          color: "#1B4F8A",
                          border: "1px solid #B8D0E8",
                          letterSpacing: "0.5px",
                          flexShrink: 0,
                        }}>
                          ⏰ EXTEND DEADLINE
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: "12px", color: isEmergencyBid ? "#B8D0E8" : "#1B4F8A", marginBottom: "4px" }}>
                      Current deadline: {deadline ? deadline.toLocaleDateString() : "—"}
                      {deadlinePassed && <span style={{ color: "#C8102E", marginLeft: "8px" }}>⚠ Passed</span>}
                    </div>
                    <div style={{ fontSize: "12px", color: isEmergencyBid ? "#B8D0E8" : "#4A7FB5" }}>
                      Requested: {r.override_requested_at ? new Date(r.override_requested_at).toLocaleDateString() : "—"}
                    </div>
                  </div>
                  <Link
                    href={`/dashboard/admin/projects/${r.id}`}
                    style={{
                      fontSize: "12px",
                      color: isEmergencyBid ? "#B8D0E8" : "#4A7FB5",
                      textDecoration: "underline",
                      flexShrink: 0,
                    }}
                  >
                    View project →
                  </Link>
                </div>

                {r.override_requested_reason && (
                  <div style={{
                    background: isEmergencyBid ? "#1B4F8A" : "#FFFFFF",
                    border: `1px solid ${isEmergencyBid ? "#1B4F8A" : "#B8D0E8"}`,
                    borderRadius: "8px",
                    padding: "12px",
                    marginBottom: "14px",
                    fontSize: "13px",
                    color: isEmergencyBid ? "#FFFFFF" : "#0A1628",
                    lineHeight: 1.6,
                  }}>
                    <span style={{ color: isEmergencyBid ? "#B8D0E8" : "#1B4F8A", fontWeight: 600 }}>Reason: </span>
                    {r.override_requested_reason}
                  </div>
                )}

                {isEmergencyBid ? (
                  /* Emergency Bid Mode approval — no date picker, just unlocks bids */
                  <>
                    <div style={{
                      background: "#1B4F8A",
                      borderRadius: "8px",
                      padding: "12px 14px",
                      marginBottom: "12px",
                      fontSize: "12px",
                      color: "#FFFFFF",
                      lineHeight: 1.65,
                    }}>
                      <strong style={{ color: "#FFFFFF" }}>Approving this request</strong> will immediately unlock bids on this project as contractors submit them. The deadline itself does not change. Both the client and contractors will see an emergency disclaimer. This cannot be undone.
                    </div>
                    <form action={approveEmergencyBidMode.bind(null, r.id)}>
                      <button
                        type="submit"
                        style={{
                          background: "#C8102E",
                          color: "#FFFFFF",
                          border: "none",
                          padding: "8px 20px",
                          borderRadius: "6px",
                          fontFamily: "'Barlow', sans-serif",
                          fontWeight: 600,
                          fontSize: "13px",
                          cursor: "pointer",
                        }}
                      >
                        🚨 Approve Emergency Bid Mode
                      </button>
                    </form>
                  </>
                ) : (
                  /* Standard deadline extension approval */
                  <form action={approveOverride.bind(null, r.id)} style={{ display: "flex", gap: "8px", alignItems: "flex-end", flexWrap: "wrap" }}>
                    <div>
                      <label style={{
                        display: "block",
                        fontSize: "11px",
                        color: "#1B4F8A",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                        marginBottom: "4px",
                      }}>
                        New Deadline
                      </label>
                      <input
                        type="date"
                        name="new_deadline"
                        style={{
                          background: "#FFFFFF",
                          border: "1px solid #B8D0E8",
                          color: "#0A1628",
                          borderRadius: "6px",
                          padding: "8px 12px",
                          fontFamily: "'Barlow', sans-serif",
                          fontSize: "13px",
                          outline: "none",
                        }}
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      style={{
                        background: "#F0FDF4",
                        color: "#15803D",
                        border: "1px solid #166534",
                        padding: "8px 20px",
                        borderRadius: "6px",
                        fontFamily: "'Barlow', sans-serif",
                        fontWeight: 600,
                        fontSize: "13px",
                        cursor: "pointer",
                      }}
                    >
                      Approve & Set Date
                    </button>
                  </form>
                )}

                <form action={denyOverride.bind(null, r.id)} style={{ marginTop: "8px" }}>
                  <button
                    type="submit"
                    style={{
                      background: "transparent",
                      color: isEmergencyBid ? "#B8D0E8" : "#991B1B",
                      border: `1px solid ${isEmergencyBid ? "#1B4F8A" : "#FCA5A5"}`,
                      padding: "6px 16px",
                      borderRadius: "6px",
                      fontFamily: "'Barlow', sans-serif",
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    Deny Request
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
