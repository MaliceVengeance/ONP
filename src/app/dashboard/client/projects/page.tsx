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
  deadline_at: string | null;
  created_at: string;
};

export default async function ClientProjectsPage() {
  const { supabase } = await requireRole(["CLIENT", "ADMIN"]);

  const { data, error } = await supabase
    .from("projects")
    .select("id, title, category, state, city, deadline_at, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;

  const projects = (data ?? []) as Project[];
  const now = new Date();

  const active = projects.filter((p) =>
    ["DRAFT", "OPEN"].includes(p.state) &&
    (p.state === "DRAFT" || !p.deadline_at || new Date(p.deadline_at) > now)
  );

  const awarded = projects.filter((p) => p.state === "AWARDED");

  const needsAction = projects.filter((p) =>
    p.state === "OPEN" && p.deadline_at && new Date(p.deadline_at) <= now
  );

  const closed = projects.filter((p) =>
    ["BIDDING_CLOSED", "BIDS_UNLOCKED", "COMPLETED", "CANCELED"].includes(p.state)
  );

  const sectionHeader = (text: string, color = "#fff") => ({
    fontFamily: "'Barlow Condensed', sans-serif" as const,
    fontWeight: 700,
    fontSize: "18px" as const,
    letterSpacing: "1px",
    color,
    textTransform: "uppercase" as const,
    marginBottom: "12px",
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <h1 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: "32px",
          letterSpacing: "1px",
          color: "#fff",
          margin: 0,
        }}>
          My Projects
        </h1>
        <Link href="/dashboard/client/projects/new" style={{
          background: "#C8102E",
          color: "#fff",
          border: "none",
          padding: "10px 16px",
          borderRadius: "6px",
          fontFamily: "'Barlow', sans-serif",
          fontWeight: 600,
          fontSize: "13px",
          letterSpacing: "0.5px",
          textDecoration: "none",
          display: "inline-block",
          whiteSpace: "nowrap",
        }}>
          + New Project
        </Link>
      </div>

      {error && (
        <div style={{ background: "#3D0A0A", border: "1px solid #991B1B", color: "#F87171", padding: "14px", borderRadius: "8px", fontSize: "13px", marginBottom: "20px" }}>
          Failed to load projects.
        </div>
      )}

      {/* Needs Action — deadline passed but still OPEN */}
      {needsAction.length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          <div style={{
            background: "#3D0A0A",
            border: "1px solid #991B1B",
            borderRadius: "8px",
            padding: "10px 14px",
            marginBottom: "12px",
            fontSize: "12px",
            color: "#F87171",
            fontWeight: 600,
          }}>
            ⚠ {needsAction.length} project{needsAction.length !== 1 ? "s" : ""} need{needsAction.length === 1 ? "s" : ""} your attention — deadline passed, review bids now
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {needsAction.map((p) => (
              <ProjectCard key={p.id} p={p} urgent />
            ))}
          </div>
        </div>
      )}

      {/* Active projects */}
      <div style={{ marginBottom: "28px" }}>
        <h2 style={sectionHeader(`Active (${active.length})`)}>
          Active ({active.length})
        </h2>
        {active.length === 0 ? (
          <div style={{ background: "#0F2040", border: "1px solid #1B4F8A", borderRadius: "10px", padding: "24px", textAlign: "center", color: "#7A9CC4", fontSize: "14px" }}>
            No active projects.{" "}
            <Link href="/dashboard/client/projects/new" style={{ color: "#fff", textDecoration: "underline" }}>
              Create one
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {active.map((p) => (
              <ProjectCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </div>

      {/* Awarded */}
      {awarded.length > 0 && (
        <div style={{ marginBottom: "28px" }}>
          <hr style={{ border: "none", borderTop: "1px solid #1B4F8A", margin: "0 0 20px" }} />
          <h2 style={sectionHeader(`Awarded (${awarded.length})`)}>
            Awarded ({awarded.length})
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {awarded.map((p) => (
              <ProjectCard key={p.id} p={p} />
            ))}
          </div>
        </div>
      )}

      {/* Closed / completed projects */}
      {closed.length > 0 && (
        <div>
          <hr style={{ border: "none", borderTop: "1px solid #1B4F8A", margin: "0 0 20px" }} />
          <h2 style={sectionHeader(`Closed / Completed (${closed.length})`, "#7A9CC4")}>
            Closed / Completed ({closed.length})
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {closed.map((p) => (
              <ProjectCard key={p.id} p={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ProjectCard({ p, urgent }: { p: Project; urgent?: boolean }) {
  const deadline = p.deadline_at ? new Date(p.deadline_at) : null;
  const now = new Date();
  const deadlinePassed = !!deadline && deadline.getTime() <= now.getTime();
  const bidsUnlocked = deadlinePassed && p.state !== "DRAFT";

  return (
    <Link href={`/dashboard/client/projects/${p.id}`} style={{ textDecoration: "none" }}>
      <HoverCard style={{
        background: "#0F2040",
        border: `1px solid ${urgent ? "#991B1B" : "#1B4F8A"}`,
        borderRadius: "10px",
        padding: "16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        cursor: "pointer",
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontWeight: 600,
            fontSize: "15px",
            color: "#fff",
            marginBottom: "3px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            {p.title ?? "Untitled"}
          </div>
          <div style={{ fontSize: "12px", color: "#7A9CC4", marginBottom: "3px" }}>
            {p.category ?? "—"} • {p.city ?? "—"}
          </div>
          {deadline && (
            <div style={{ fontSize: "11px", color: deadlinePassed ? "#F87171" : "#4A7FB5" }}>
              {deadlinePassed
                ? "⚠ Deadline passed"
                : `Deadline: ${deadline.toLocaleDateString()}`}
            </div>
          )}
          {bidsUnlocked && (
            <div style={{ fontSize: "11px", color: "#4ADE80", marginTop: "2px" }}>
              ✓ Bids ready to review
            </div>
          )}
        </div>
        <div style={{ flexShrink: 0 }}>
          <span style={stateBadge(p.state)}>{p.state}</span>
        </div>
      </HoverCard>
    </Link>
  );
}