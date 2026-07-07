import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { stateBadge } from "@/lib/ui";
import HoverCard from "@/components/HoverCard";

type Project = {
  id: string;
  title: string | null;
  category: string | null;
  state: string;
  city: string | null;
  created_at: string;
  deadline_at: string | null;
};

export default async function AdminProjectsPage() {
  const { supabase } = await requireRole(["ADMIN"]);

  const { data, error } = await supabase
    .from("projects")
    .select("id, title, category, state, city, created_at, deadline_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;

  const projects = (data ?? []) as Project[];

  return (
    <div>
      {/* Header */}
      <div className="mob-col mob-gap-sm" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
        <div>
          <h1 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "36px",
            letterSpacing: "1px",
            color: "var(--camo-charcoal)",
            margin: 0,
          }}>
            All Projects
          </h1>
          <p style={{ fontSize: "13px", color: "var(--camo-gunmetal)", marginTop: "4px" }}>
            {projects.length} total projects
          </p>
        </div>
        <Link
          href="/dashboard/admin"
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
          Back
        </Link>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {projects.length === 0 ? (
          <div style={{ background: "var(--camo-concrete)", border: "1px solid #d9dbdb", borderRadius: "10px", padding: "32px", textAlign: "center", color: "var(--camo-gunmetal)", fontSize: "14px" }}>
            No projects found.
          </div>
        ) : (
          projects.map((p) => (
            <Link key={p.id} href={`/dashboard/admin/projects/${p.id}`} style={{ textDecoration: "none" }}>
            <HoverCard className="mob-card-stack" style={{
              background: "var(--camo-concrete)",
              border: "1px solid #d9dbdb",
              borderRadius: "10px",
              padding: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "16px",
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: "15px", color: "var(--camo-charcoal)", marginBottom: "3px" }}>
                  {p.title ?? "Untitled"}
                </div>
                <div style={{ fontSize: "12px", color: "var(--camo-gunmetal)", marginBottom: "3px" }}>
                  {p.category ?? "—"} • {p.city ?? "—"}
                </div>
                <div style={{ fontSize: "11px", color: "var(--camo-gunmetal)" }}>
                  Created: {new Date(p.created_at).toLocaleDateString()}
                  {p.deadline_at && (
                    <> • Deadline: {new Date(p.deadline_at).toLocaleDateString()}</>
                  )}
                </div>
              </div>
              <span style={stateBadge(p.state)}>{p.state}</span>
            </HoverCard>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
