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

export default async function ClientDashboard() {
  const { supabase, user } = await requireRole(["CLIENT", "ADMIN"]);

  const { data, error } = await supabase
    .from("projects")
    .select("id, title, category, state, city, deadline_at, created_at")
    .eq("client_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const projects = (data ?? []) as Project[];
  const drafts = projects.filter((p) => p.state === "DRAFT");
  const open = projects.filter((p) => p.state === "OPEN");
  const needsAction = projects.filter((p) => ["BIDDING_CLOSED", "BIDS_UNLOCKED"].includes(p.state));
  const awarded = projects.filter((p) => p.state === "AWARDED");

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "36px", letterSpacing: "1px", color: "#fff", margin: 0 }}>
            Client Dashboard
          </h1>
          <p style={{ fontSize: "13px", color: "#7A9CC4", marginTop: "4px" }}>
            {user.email}
          </p>
        </div>
        <Link href="/dashboard/client/projects/new" style={{
          background: "#C8102E",
          color: "#fff",
          border: "none",
          padding: "10px 20px",
          borderRadius: "6px",
          fontFamily: "'Barlow', sans-serif",
          fontWeight: 600,
          fontSize: "13px",
          letterSpacing: "0.5px",
          textDecoration: "none",
          display: "inline-block",
        }}>
          + New Project
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "28px" }}>
        {[
          { label: "Drafts", count: drafts.length, accent: false },
          { label: "Open", count: open.length, accent: false },
          { label: "Needs Action", count: needsAction.length, accent: needsAction.length > 0 },
          { label: "Awarded", count: awarded.length, accent: false },
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
              fontSize: "32px",
              color: s.accent ? "#C8102E" : "#fff",
            }}>
              {s.count}
            </div>
            <div style={{ fontSize: "11px", color: "#7A9CC4", textTransform: "uppercase", letterSpacing: "1px", marginTop: "2px" }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

{/* Quick links */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "32px" }}>
        {[
          { label: "All Projects", href: "/dashboard/client/projects" },
          { label: "My Profile", href: "/dashboard/client/profile" },
        ].map((l) => (
          <Link key={l.href} href={l.href} style={{
            background: "transparent",
            color: "#7A9CC4",
            border: "1px solid #1B4F8A",
            padding: "8px 18px",
            borderRadius: "6px",
            fontFamily: "'Barlow', sans-serif",
            fontWeight: 500,
            fontSize: "13px",
            textDecoration: "none",
          }}>
            {l.label}
          </Link>
        ))}
      </div>

      {/* Needs Action */}
      {needsAction.length > 0 && (
        <div style={{ marginBottom: "32px" }}>
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "18px", letterSpacing: "1px", color: "#C8102E", textTransform: "uppercase", marginBottom: "12px" }}>
            ⚠ Needs Your Attention
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {needsAction.map((p) => (
              <ProjectCard key={p.id} p={p} />
            ))}
          </div>
        </div>
      )}

      {/* Recent Projects */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "18px", letterSpacing: "1px", color: "#fff", textTransform: "uppercase", margin: 0 }}>
            Recent Projects
          </h2>
          <Link href="/dashboard/client/projects" style={{ fontSize: "13px", color: "#7A9CC4", textDecoration: "underline" }}>
            View all
          </Link>
        </div>

        {error ? (
          <div style={{ background: "#3D0A0A", border: "1px solid #991B1B", color: "#F87171", padding: "14px", borderRadius: "8px", fontSize: "13px" }}>
            Failed to load projects.
          </div>
        ) : projects.length === 0 ? (
          <div style={{ background: "#0F2040", border: "1px solid #1B4F8A", borderRadius: "10px", padding: "32px", textAlign: "center", color: "#7A9CC4", fontSize: "14px" }}>
            No projects yet.{" "}
            <Link href="/dashboard/client/projects/new" style={{ color: "#fff", textDecoration: "underline" }}>
              Create your first project
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {projects.map((p) => (
              <ProjectCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProjectCard({ p }: { p: Project }) {
  const deadline = p.deadline_at ? new Date(p.deadline_at) : null;
  const now = new Date();
  const deadlinePassed = !!deadline && deadline.getTime() <= now.getTime();
  const bidsUnlocked = deadlinePassed || !["DRAFT", "OPEN"].includes(p.state);

  return (
    <Link href={`/dashboard/client/projects/${p.id}`} style={{ textDecoration: "none" }}>
      <HoverCard style={{
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
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
          <span style={stateBadge(p.state)}>{p.state}</span>
          {bidsUnlocked && p.state !== "DRAFT" && (
            <span style={{ fontSize: "11px", color: "#4ADE80" }}>✓ Bids unlocked</span>
          )}
        </div>
      </HoverCard>
    </Link>
  );
}