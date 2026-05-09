import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { stateBadge } from "@/lib/ui";

export default async function InspectorProjectsPage() {
  const { supabase, user } = await requireRole(["INSPECTOR", "ADMIN"]);

  const { data: assignments, error } = await supabase
    .from("project_inspector_assignments")
    .select("id, project_id, request_status, requested_at, assigned_at, takeoff_completed_at, notes")
    .eq("inspector_id", user.id)
    .order("requested_at", { ascending: false });

  const assignmentList = assignments ?? [];

  // Fetch project details for each assignment
  const projectIds = assignmentList.map((a) => a.project_id).filter(Boolean);
  const { data: projects } = await supabase
    .from("projects")
    .select("id, title, category, city, state, deadline_at")
    .in("id", projectIds.length > 0 ? projectIds : ["none"]);

  const projectMap = new Map((projects ?? []).map((p) => [p.id, p]));

  const pending = assignmentList.filter((a) => a.request_status === "ASSIGNED");
  const completed = assignmentList.filter((a) => a.request_status === "COMPLETED");

  return (
    <div>
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
            My Assignments
          </h1>
          <p style={{ fontSize: "13px", color: "#7A9CC4", marginTop: "4px" }}>
            {pending.length} pending • {completed.length} completed
          </p>
        </div>
        <Link
          href="/dashboard/inspector"
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

      {/* Pending assignments */}
      <div style={{ marginBottom: "32px" }}>
        <h2 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: "18px",
          letterSpacing: "1px",
          color: "#fff",
          textTransform: "uppercase",
          marginBottom: "12px",
        }}>
          Pending ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <div style={{ background: "#0F2040", border: "1px solid #1B4F8A", borderRadius: "10px", padding: "24px", textAlign: "center", color: "#7A9CC4", fontSize: "14px" }}>
            No pending assignments.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {pending.map((a) => {
              const p = projectMap.get(a.project_id);
              return (
                <Link
                  key={a.id}
                  href={`/dashboard/inspector/projects/${a.id}`}
                  style={{ textDecoration: "none" }}
                >
                  <div style={{
                    background: "#0F2040",
                    border: "1px solid #1B4F8A",
                    borderRadius: "10px",
                    padding: "18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "15px", color: "#fff", marginBottom: "3px" }}>
                        {p?.title ?? "Untitled Project"}
                      </div>
                      <div style={{ fontSize: "12px", color: "#7A9CC4", marginBottom: "3px" }}>
                        {p?.category ?? "—"} • {p?.city ?? "—"}
                      </div>
                      {a.assigned_at && (
                        <div style={{ fontSize: "11px", color: "#4A7FB5" }}>
                          Assigned: {new Date(a.assigned_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    <span style={stateBadge(p?.state ?? "OPEN")}>{p?.state ?? "—"}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

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
            {completed.map((a) => {
              const p = projectMap.get(a.project_id);
              return (
                <Link
                  key={a.id}
                  href={`/dashboard/inspector/projects/${a.id}`}
                  style={{ textDecoration: "none" }}
                >
                  <div style={{
                    background: "#0F2040",
                    border: "1px solid #1B4F8A",
                    borderRadius: "10px",
                    padding: "18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    opacity: 0.8,
                    cursor: "pointer",
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "15px", color: "#fff", marginBottom: "3px" }}>
                        {p?.title ?? "Untitled Project"}
                      </div>
                      <div style={{ fontSize: "12px", color: "#7A9CC4" }}>
                        {p?.category ?? "—"} • {p?.city ?? "—"}
                      </div>
                      {a.takeoff_completed_at && (
                        <div style={{ fontSize: "11px", color: "#4ADE80", marginTop: "3px" }}>
                          ✅ Completed: {new Date(a.takeoff_completed_at).toLocaleDateString()}
                        </div>
                      )}
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
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}