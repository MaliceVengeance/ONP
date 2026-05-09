import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { assignInspector } from "./actions";

export default async function AdminInspectorRequestsPage() {
  const { supabase } = await requireRole(["ADMIN"]);

  // Fetch all pending requests
  const { data: requests } = await supabase
    .from("project_inspector_assignments")
    .select("id, project_id, client_id, request_status, requested_at, assigned_at, inspector_id")
    .order("requested_at", { ascending: true });

  const requestList = requests ?? [];

  // Fetch project details
  const projectIds = requestList.map((r) => r.project_id).filter(Boolean);
  const { data: projects } = await supabase
    .from("projects")
    .select("id, title, category, city")
    .in("id", projectIds.length > 0 ? projectIds : ["none"]);
  const projectMap = new Map((projects ?? []).map((p) => [p.id, p]));

  // Fetch available inspectors
  const { data: inspectors } = await supabase
    .from("profiles")
    .select("id, display_name")
    .eq("role", "INSPECTOR")
    .eq("inspector_active", true);

  const pending = requestList.filter((r) => r.request_status === "PENDING");
  const assigned = requestList.filter((r) => r.request_status === "ASSIGNED");
  const completed = requestList.filter((r) => r.request_status === "COMPLETED");

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
            Inspector Requests
          </h1>
          <p style={{ fontSize: "13px", color: "#7A9CC4", marginTop: "4px" }}>
            {pending.length} pending • {assigned.length} assigned • {completed.length} completed
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

      {/* Pending */}
      <div style={{ marginBottom: "32px" }}>
        <h2 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: "18px",
          letterSpacing: "1px",
          color: pending.length > 0 ? "#FBBF24" : "#fff",
          textTransform: "uppercase",
          marginBottom: "12px",
        }}>
          Needs Assignment ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <div style={{ background: "#0F2040", border: "1px solid #1B4F8A", borderRadius: "10px", padding: "24px", textAlign: "center", color: "#7A9CC4", fontSize: "14px" }}>
            No pending requests.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {pending.map((r) => {
              const p = projectMap.get(r.project_id);
              return (
                <div key={r.id} style={{
                  background: "#0F2040",
                  border: "1px solid #92400E",
                  borderRadius: "10px",
                  padding: "18px",
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", marginBottom: "14px" }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "15px", color: "#fff", marginBottom: "3px" }}>
  {p?.title ?? "Untitled Project"}
</div>
<div style={{ fontSize: "12px", color: "#7A9CC4" }}>
  {p?.category ?? "—"} • {p?.city ?? "—"}
</div>
{r.requested_at && (
  <div style={{ fontSize: "11px", color: "#3A5A7A", marginTop: "3px" }}>
    Requested: {new Date(r.requested_at).toLocaleDateString()}
  </div>
)}
<Link
  href={`/dashboard/admin/projects/${r.project_id}`}
  style={{
    fontSize: "11px",
    color: "#4A7FB5",
    textDecoration: "underline",
    display: "inline-block",
    marginTop: "6px",
  }}
>
  View project details →
</Link>
                    </div>
                    <span style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      padding: "4px 10px",
                      borderRadius: "20px",
                      background: "#2D2000",
                      color: "#FBBF24",
                      border: "1px solid #92400E",
                      flexShrink: 0,
                    }}>
                      PENDING
                    </span>
                  </div>

                  <form action={assignInspector.bind(null, r.id)}>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <select
                        name="inspector_id"
                        style={{
                          background: "#0A1628",
                          border: "1px solid #1B4F8A",
                          color: "#F0F4FF",
                          borderRadius: "6px",
                          padding: "8px 12px",
                          fontFamily: "'Barlow', sans-serif",
                          fontSize: "13px",
                          outline: "none",
                          flex: 1,
                        }}
                        required
                      >
                        <option value="">Select inspector…</option>
                        {(inspectors ?? []).map((i) => (
                          <option key={i.id} value={i.id}>{i.display_name}</option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        style={{
                          background: "#C8102E",
                          color: "#fff",
                          border: "none",
                          padding: "8px 20px",
                          borderRadius: "6px",
                          fontFamily: "'Barlow', sans-serif",
                          fontWeight: 600,
                          fontSize: "13px",
                          cursor: "pointer",
                          flexShrink: 0,
                        }}
                      >
                        Assign
                      </button>
                    </div>
                  </form>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Assigned */}
      {assigned.length > 0 && (
        <div style={{ marginBottom: "32px" }}>
          <hr style={{ border: "none", borderTop: "1px solid #1B4F8A", margin: "0 0 20px" }} />
          <h2 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "18px",
            letterSpacing: "1px",
            color: "#fff",
            textTransform: "uppercase",
            marginBottom: "12px",
          }}>
            Assigned ({assigned.length})
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {assigned.map((r) => {
              const p = projectMap.get(r.project_id);
              return (
                <div key={r.id} style={{
                  background: "#0F2040",
                  border: "1px solid #1B4F8A",
                  borderRadius: "10px",
                  padding: "18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "15px", color: "#fff", marginBottom: "3px" }}>
                      {p?.title ?? "Untitled"}
                    </div>
                    <div style={{ fontSize: "12px", color: "#7A9CC4" }}>
                      {p?.category ?? "—"} • {p?.city ?? "—"}
                    </div>
                    {r.assigned_at && (
                      <div style={{ fontSize: "11px", color: "#4A7FB5", marginTop: "3px" }}>
                        Assigned: {new Date(r.assigned_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <span style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    padding: "4px 10px",
                    borderRadius: "20px",
                    background: "#0D2040",
                    color: "#60A5FA",
                    border: "1px solid #1D4ED8",
                  }}>
                    ASSIGNED
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <div>
          <hr style={{ border: "none", borderTop: "1px solid #1B4F8A", margin: "0 0 20px" }} />
          <h2 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "18px",
            letterSpacing: "1px",
            color: "#7A9CC4",
            textTransform: "uppercase",
            marginBottom: "12px",
          }}>
            Completed ({completed.length})
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {completed.map((r) => {
              const p = projectMap.get(r.project_id);
              return (
                <div key={r.id} style={{
                  background: "#0F2040",
                  border: "1px solid #1B4F8A",
                  borderRadius: "10px",
                  padding: "18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  opacity: 0.7,
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "15px", color: "#fff", marginBottom: "3px" }}>
                      {p?.title ?? "Untitled"}
                    </div>
                    <div style={{ fontSize: "12px", color: "#7A9CC4" }}>
                      {p?.category ?? "—"} • {p?.city ?? "—"}
                    </div>
                  </div>
                  <span style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    padding: "4px 10px",
                    borderRadius: "20px",
                    background: "#0D3320",
                    color: "#4ADE80",
                    border: "1px solid #166534",
                  }}>
                    COMPLETED
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}