import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { approveOverride, denyOverride } from "./actions";

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
            color: "#fff",
            margin: 0,
          }}>
            Override Requests
          </h1>
          <p style={{ fontSize: "13px", color: "#7A9CC4", marginTop: "4px" }}>
            {requests.length} pending deadline extension request{requests.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/dashboard/admin"
          style={{
            background: "transparent",
            color: "#7A9CC4",
            border: "1px solid #1B4F8A",
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
        <div style={{ background: "#0F2040", border: "1px solid #1B4F8A", borderRadius: "10px", padding: "32px", textAlign: "center", color: "#7A9CC4", fontSize: "14px" }}>
          No pending override requests.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {requests.map((r) => {
            const deadline = r.deadline_at ? new Date(r.deadline_at) : null;
            const deadlinePassed = !!deadline && deadline.getTime() <= Date.now();

            return (
              <div key={r.id} style={{
                background: "#0F2040",
                border: "1px solid #92400E",
                borderRadius: "12px",
                padding: "20px",
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", marginBottom: "14px" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "16px", color: "#fff", marginBottom: "4px" }}>
                      {r.title ?? "Untitled Project"}
                    </div>
                    <div style={{ fontSize: "12px", color: "#7A9CC4", marginBottom: "4px" }}>
                      Current deadline: {deadline ? deadline.toLocaleDateString() : "—"}
                      {deadlinePassed && <span style={{ color: "#F87171", marginLeft: "8px" }}>⚠ Passed</span>}
                    </div>
                    <div style={{ fontSize: "12px", color: "#3A5A7A" }}>
                      Requested: {r.override_requested_at ? new Date(r.override_requested_at).toLocaleDateString() : "—"}
                    </div>
                  </div>
                  <Link
                    href={`/dashboard/admin/projects/${r.id}`}
                    style={{
                      fontSize: "12px",
                      color: "#4A7FB5",
                      textDecoration: "underline",
                      flexShrink: 0,
                    }}
                  >
                    View project →
                  </Link>
                </div>

                {r.override_requested_reason && (
                  <div style={{
                    background: "#0A1628",
                    border: "1px solid #1B4F8A",
                    borderRadius: "8px",
                    padding: "12px",
                    marginBottom: "14px",
                    fontSize: "13px",
                    color: "#F0F4FF",
                    lineHeight: 1.6,
                  }}>
                    <span style={{ color: "#7A9CC4", fontWeight: 600 }}>Reason: </span>
                    {r.override_requested_reason}
                  </div>
                )}

                {/* Approve form */}
                <form action={approveOverride.bind(null, r.id)} style={{ display: "flex", gap: "8px", alignItems: "flex-end", flexWrap: "wrap" }}>
                  <div>
                    <label style={{
                      display: "block",
                      fontSize: "11px",
                      color: "#7A9CC4",
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
                        background: "#0A1628",
                        border: "1px solid #1B4F8A",
                        color: "#F0F4FF",
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
                      background: "#0D3320",
                      color: "#4ADE80",
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

                <form action={denyOverride.bind(null, r.id)} style={{ marginTop: "8px" }}>
                  <button
                    type="submit"
                    style={{
                      background: "transparent",
                      color: "#F87171",
                      border: "1px solid #991B1B",
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