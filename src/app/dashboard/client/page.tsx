import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { stateBadge } from "@/lib/ui";
import HoverCard from "@/components/HoverCard";
import { SERVICE_AREA_LABEL } from "@/lib/serviceArea/launchZips";

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

  // Service area status
  const { data: profileStatus } = await supabaseAdmin
    .from("profiles")
    .select("service_area_status, service_area_zip")
    .eq("id", user.id)
    .single();
  const isOutOfArea = profileStatus?.service_area_status === "OUT_OF_AREA";

  const { data, error } = await supabaseAdmin
    .from("projects")
    .select("id, title, category, state, city, deadline_at, created_at")
    .eq("client_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) console.error("Client dashboard projects error:", JSON.stringify(error));

  const projects = (data ?? []) as Project[];
  const drafts = projects.filter((p) => p.state === "DRAFT");
  const open = projects.filter((p) => p.state === "OPEN");
  const needsAction = projects.filter((p) => ["BIDDING_CLOSED", "BIDS_UNLOCKED"].includes(p.state));
  const awarded = projects.filter((p) => p.state === "AWARDED");

  // Fetch total unread messages across all awarded projects
  const awardedIds = awarded.map((p) => p.id);
  let totalUnreadMessages = 0;

  if (awardedIds.length > 0) {
    const [{ data: msgs }, { data: reads }] = await Promise.all([
      supabaseAdmin
        .from("project_messages")
        .select("project_id, sender_id, created_at")
        .in("project_id", awardedIds)
        .neq("sender_id", user.id),
      supabaseAdmin
        .from("project_message_reads")
        .select("project_id, last_read_at")
        .eq("user_id", user.id)
        .in("project_id", awardedIds),
    ]);

    const readMap = new Map((reads ?? []).map((r: any) => [r.project_id, r.last_read_at]));
    for (const msg of msgs ?? []) {
      const m = msg as any;
      const lastRead = readMap.get(m.project_id);
      if (!lastRead || new Date(m.created_at) > new Date(lastRead)) {
        totalUnreadMessages++;
      }
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mob-col" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "36px", letterSpacing: "1px", color: "var(--camo-charcoal)", margin: 0 }}>
            Client Dashboard
          </h1>
          <p style={{ fontSize: "13px", color: "var(--camo-gunmetal)", marginTop: "4px" }}>
            {user.email}
          </p>
        </div>
        <Link href="/dashboard/client/projects/new" style={{
          background: "var(--camo-accent)",
          color: "var(--camo-ink)",
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
      <div className="mob-grid-2" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "28px" }}>
        {[
          { label: "Drafts", count: drafts.length, accent: false },
          { label: "Open", count: open.length, accent: false },
          { label: "Needs Action", count: needsAction.length, accent: needsAction.length > 0 },
          { label: "Awarded", count: awarded.length, accent: false },
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

{/* Quick links */}
      <div className="mob-wrap" style={{ display: "flex", gap: "10px", marginBottom: "32px" }}>
        {[
          { label: "All Projects", href: "/dashboard/client/projects" },
          { label: "My Credits", href: "/dashboard/client/credits" },
          { label: "My Profile", href: "/dashboard/client/profile" },
          { label: "Terms of Service", href: "/terms" },
          { label: "Privacy Policy", href: "/privacy" },
        ].map((l) => (
          <Link key={l.href} href={l.href} style={{
            background: "transparent",
            color: "var(--camo-gunmetal)",
            border: "1px solid #d9dbdb",
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

      {/* Out-of-area banner */}
      {isOutOfArea && (
        <div style={{
          background: "#FFFBEB",
          border: "1px solid #FCD34D",
          borderRadius: "10px",
          padding: "14px 18px",
          marginBottom: "20px",
          fontSize: "13px",
          color: "#92400E",
          lineHeight: 1.6,
        }}>
          📍 <strong>You're on the waitlist for your area ({profileStatus?.service_area_zip ?? "unknown ZIP"}).</strong>{" "}
          ONP currently serves {SERVICE_AREA_LABEL} only. We'll notify you when we expand to your region.
          Project posting is unavailable until then.
        </div>
      )}

      {/* Unread messages banner */}
      {totalUnreadMessages > 0 && (
        <Link href="/dashboard/client/projects?tab=awarded" style={{ textDecoration: "none", display: "block", marginBottom: "20px" }}>
          <div style={{
            background: "var(--camo-charcoal)",
            border: "1px solid var(--camo-gunmetal)",
            borderRadius: "10px",
            padding: "14px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "20px" }}>💬</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: "14px", color: "#FFFFFF" }}>
                  {totalUnreadMessages} unread message{totalUnreadMessages !== 1 ? "s" : ""}
                </div>
                <div style={{ fontSize: "12px", color: "var(--camo-steel)", marginTop: "1px" }}>
                  New messages from your awarded project{awarded.length !== 1 ? "s" : ""}
                </div>
              </div>
            </div>
            <span style={{
              fontSize: "11px",
              fontWeight: 700,
              padding: "4px 12px",
              borderRadius: "20px",
              background: "var(--camo-accent)",
              color: "var(--camo-ink)",
              whiteSpace: "nowrap",
            }}>
              View →
            </span>
          </div>
        </Link>
      )}

      {/* Needs Action */}
      {needsAction.length > 0 && (
        <div style={{ marginBottom: "32px" }}>
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "18px", letterSpacing: "1px", color: "var(--camo-accent-dim)", textTransform: "uppercase", marginBottom: "12px" }}>
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
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "18px", letterSpacing: "1px", color: "var(--camo-charcoal)", textTransform: "uppercase", margin: 0 }}>
            Recent Projects
          </h2>
          <Link href="/dashboard/client/projects" style={{ fontSize: "13px", color: "var(--camo-gunmetal)", textDecoration: "underline" }}>
            View all
          </Link>
        </div>

        {error ? (
          <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", color: "#991B1B", padding: "14px", borderRadius: "8px", fontSize: "13px" }}>
            Failed to load projects.
          </div>
        ) : projects.length === 0 ? (
          <div style={{ background: "var(--camo-concrete)", border: "1px solid #d9dbdb", borderRadius: "10px", padding: "32px", textAlign: "center", color: "var(--camo-gunmetal)", fontSize: "14px" }}>
            No projects yet.{" "}
            <Link href="/dashboard/client/projects/new" style={{ color: "var(--camo-charcoal)", textDecoration: "underline" }}>
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
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
          <span style={stateBadge(p.state)}>{p.state}</span>
          {bidsUnlocked && p.state !== "DRAFT" && (
            <span style={{ fontSize: "11px", color: "#15803D" }}>✓ Bids unlocked</span>
          )}
        </div>
      </HoverCard>
    </Link>
  );
}
