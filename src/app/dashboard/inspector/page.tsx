import { requireRole } from "@/lib/auth/requireRole";
import { stateBadge } from "@/lib/ui";

export default async function InspectorDashboard() {
  const { supabase, user } = await requireRole(["INSPECTOR", "ADMIN"]);

  const { data, error } = await supabase
    .from("project_inspector_assignments")
    .select("project_id, projects(id, title, category, city, state, deadline_at)")
    .eq("inspector_id", user.id)
    .limit(20);

  const assignments = (data ?? []) as any[];
  const active = assignments.filter((a) => a.projects?.state === "OPEN");

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: "36px",
          letterSpacing: "1px",
          color: "#fff",
          margin: 0,
        }}>
          Inspector Dashboard
        </h1>
        <p style={{ fontSize: "13px", color: "#7A9CC4", marginTop: "4px" }}>
          {user.email}
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", marginBottom: "28px" }}>
        {[
          { label: "Assigned Projects", count: assignments.length, accent: false },
          { label: "Active", count: active.length, accent: active.length > 0 },
        ].map((s) => (
          <div key={s.label} style={{
            background: "#0F2040",
            border: `1px solid ${s.accent ? "#C8102E" : "#1B4F8A"}`,
            borderRadius: "10px",
            padding: "16px",
            textAlign: "center",
          }}>
            <div style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: "36px",
              color: s.accent ? "#C8102E" : "#fff",
            }}>
              {s.count}
            </div>
            <div style={{
              fontSize: "11px",
              color: "#7A9CC4",
              textTransform: "uppercase",
              letterSpacing: "1px",
              marginTop: "2px",
            }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Assigned Projects */}
      <div>
        <h2 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: "18px",
          letterSpacing: "1px",
          color: "#fff",
          textTransform: "uppercase",
          marginBottom: "12px",
        }}>
          Assigned Projects
        </h2>

        {error ? (
          <div style={{
            background: "#3D0A0A",
            border: "1px solid #991B1B",
            color: "#F87171",
            padding: "14px",
            borderRadius: "8px",
            fontSize: "13px",
          }}>
            Failed to load assignments.
          </div>
        ) : assignments.length === 0 ? (
          <div style={{
            background: "#0F2040",
            border: "1px solid #1B4F8A",
            borderRadius: "10px",
            padding: "32px",
            textAlign: "center",
            color: "#7A9CC4",
            fontSize: "14px",
          }}>
            No projects assigned yet.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {assignments.map((a) => {
              const p = a.projects;
              if (!p) return null;
              const deadline = p.deadline_at ? new Date(p.deadline_at) : null;
              const deadlinePassed = !!deadline && deadline.getTime() <= Date.now();

              return (
                <div key={a.project_id} style={{
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
                      {p.title ?? "Untitled"}
                    </div>
                    <div style={{ fontSize: "12px", color: "#7A9CC4", marginBottom: "3px" }}>
                      {p.category ?? "—"} • {p.city ?? "—"}
                    </div>
                    {deadline && (
                      <div style={{ fontSize: "11px", color: deadlinePassed ? "#F87171" : "#4A7FB5" }}>
                        {deadlinePassed ? "Deadline passed" : `Deadline: ${deadline.toLocaleDateString()}`}
                      </div>
                    )}
                  </div>
                  <span style={stateBadge(p.state)}>
                    {p.state}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}