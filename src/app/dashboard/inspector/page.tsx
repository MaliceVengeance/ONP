import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { stateBadge } from "@/lib/ui";

export default async function InspectorDashboard() {
  const { supabase, user } = await requireRole(["INSPECTOR", "ADMIN"]);

  // Check master inspector status for nav link
  const { data: myProfile } = await supabase
    .from("profiles")
    .select("is_master_inspector")
    .eq("id", user.id)
    .single();
  const isMasterInspector = (myProfile as any)?.is_master_inspector === true;

  // Fetch assignments with user-scoped client (inspector owns these rows)
  const { data, error } = await supabase
    .from("project_inspector_assignments")
    .select("id, project_id, request_status, assigned_at, takeoff_completed_at")
    .eq("inspector_id", user.id)
    .limit(20);

  const assignments = (data ?? []) as any[];

  // Fetch project details with admin client — inspector doesn't own project rows
  const projectIds = assignments.map((a: any) => a.project_id).filter(Boolean);
  const { data: projectRows } = projectIds.length > 0
    ? await supabaseAdmin
        .from("projects")
        .select("id, title, category, city, state, deadline_at")
        .in("id", projectIds)
    : { data: [] };
  const projectMap = new Map((projectRows ?? []).map((p: any) => [p.id, p]));

  // Enrich assignments with project data
  const enriched = assignments.map((a: any) => ({ ...a, projects: projectMap.get(a.project_id) ?? null }));

  const active = enriched.filter((a) => a.request_status === "ASSIGNED");
  const completed = enriched.filter((a) => a.request_status === "COMPLETED");
  const pending = enriched.filter((a) => a.request_status === "PENDING");

  return (
    <div>
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
            Inspector Dashboard
          </h1>
          <p style={{ fontSize: "13px", color: "var(--camo-gunmetal)", marginTop: "4px" }}>
            {user.email}
          </p>
        </div>
        <div className="mob-wrap" style={{ display: "flex", gap: "8px" }}>
          {isMasterInspector && (
            <Link
              href="/dashboard/inspector/disputes"
              style={{
                background: "transparent",
                color: "var(--camo-gunmetal)",
                border: "1px solid #d9dbdb",
                padding: "10px 16px",
                borderRadius: "6px",
                fontFamily: "'Barlow', sans-serif",
                fontWeight: 600,
                fontSize: "13px",
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              Dispute Reviews
            </Link>
          )}
          <Link
            href="/dashboard/inspector/projects"
            style={{
              background: "var(--camo-accent)",
              color: "var(--camo-ink)",
              border: "none",
              padding: "10px 20px",
              borderRadius: "6px",
              fontFamily: "'Barlow', sans-serif",
              fontWeight: 600,
              fontSize: "13px",
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            View Assignments
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="mob-grid-1" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "28px" }}>
        {[
          { label: "Assigned", count: active.length, accent: active.length > 0 },
          { label: "Pending", count: pending.length, accent: false },
          { label: "Completed", count: completed.length, accent: false },
        ].map((s) => (
          <div key={s.label} style={{
            background: "var(--camo-concrete)",
            border: `1px solid ${s.accent ? "var(--camo-accent)" : "#d9dbdb"}`,
            borderRadius: "10px",
            padding: "16px",
            textAlign: "center",
          }}>
            <div style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: "32px",
              color: s.accent ? "var(--camo-accent)" : "var(--camo-charcoal)",
            }}>
              {s.count}
            </div>
            <div style={{ fontSize: "11px", color: "var(--camo-gunmetal)", textTransform: "uppercase", letterSpacing: "1px", marginTop: "2px" }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Active assignments */}
      <div>
        <h2 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: "18px",
          letterSpacing: "1px",
          color: "var(--camo-charcoal)",
          textTransform: "uppercase",
          marginBottom: "12px",
        }}>
          Active Assignments
        </h2>

        {error ? (
          <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", color: "#991B1B", padding: "14px", borderRadius: "8px", fontSize: "13px" }}>
            Failed to load assignments.
          </div>
        ) : active.length === 0 ? (
          <div style={{ background: "var(--camo-concrete)", border: "1px solid #d9dbdb", borderRadius: "10px", padding: "32px", textAlign: "center", color: "var(--camo-gunmetal)", fontSize: "14px" }}>
            No active assignments.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {active.map((a) => {
              const p = a.projects;
              if (!p) return null;
              const deadline = p.deadline_at ? new Date(p.deadline_at) : null;
              const deadlinePassed = !!deadline && deadline.getTime() <= Date.now();

              return (
                <Link
                  key={a.id}
                  href={`/dashboard/inspector/projects/${a.id}`}
                  style={{ textDecoration: "none" }}
                >
                  <div className="mob-card-stack" style={{
                    background: "var(--camo-concrete)",
                    border: "1px solid #d9dbdb",
                    borderRadius: "10px",
                    padding: "18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "15px", color: "var(--camo-charcoal)", marginBottom: "3px" }}>
                        {p.title ?? "Untitled"}
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--camo-gunmetal)", marginBottom: "3px" }}>
                        {p.category ?? "—"} • {p.city ?? "—"}
                      </div>
                      {deadline && (
                        <div style={{ fontSize: "11px", color: deadlinePassed ? "#991B1B" : "var(--camo-gunmetal)" }}>
                          {deadlinePassed ? "Deadline passed" : `Deadline: ${deadline.toLocaleDateString()}`}
                        </div>
                      )}
                    </div>
                    <span style={stateBadge(p.state)}>
                      {p.state}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
