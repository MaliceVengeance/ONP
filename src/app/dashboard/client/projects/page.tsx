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

const TABS = [
  { label: "All",           value: null,           color: "#1B4F8A" },
  { label: "Active",        value: "active",       color: "#15803D" },
  { label: "Needs Action",  value: "needs_action", color: "#991B1B" },
  { label: "Awarded",       value: "awarded",      color: "#92400E" },
  { label: "Closed",        value: "closed",       color: "#4A7FB5" },
];

export default async function ClientProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { supabase } = await requireRole(["CLIENT", "ADMIN"]);
  const sp = await searchParams;
  const activeTab = sp.tab ?? null;

  const { data, error } = await supabase
    .from("projects")
    .select("id, title, category, state, city, deadline_at, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;

  const projects = (data ?? []) as Project[];
  const now = new Date();

  // Fetch bid counts for all projects in one query
  const projectIds = projects.map((p) => p.id);
  const { data: bidCountsRaw } = projectIds.length > 0
    ? await supabase
        .from("bids")
        .select("project_id")
        .in("project_id", projectIds)
    : { data: [] };

  const bidCountMap = new Map<string, number>();
  (bidCountsRaw ?? []).forEach((row) => {
    bidCountMap.set(row.project_id, (bidCountMap.get(row.project_id) ?? 0) + 1);
  });

  // Categorize projects
  const active = projects.filter((p) =>
    ["DRAFT", "OPEN"].includes(p.state) &&
    (p.state === "DRAFT" || !p.deadline_at || new Date(p.deadline_at) > now)
  );

  const needsAction = projects.filter((p) =>
    p.state === "OPEN" && p.deadline_at && new Date(p.deadline_at) <= now
  );

  const awarded = projects.filter((p) => p.state === "AWARDED");

  const closed = projects.filter((p) =>
    ["BIDDING_CLOSED", "BIDS_UNLOCKED", "COMPLETED", "CANCELED"].includes(p.state)
  );

  // Counts for tab badges
  const counts = {
    active: active.length,
    needs_action: needsAction.length,
    awarded: awarded.length,
    closed: closed.length,
    all: projects.length,
  };

  // Projects shown based on active tab
  const visibleActive      = !activeTab || activeTab === "active"       ? active      : [];
  const visibleNeedsAction = !activeTab || activeTab === "needs_action" ? needsAction : [];
  const visibleAwarded     = !activeTab || activeTab === "awarded"      ? awarded     : [];
  const visibleClosed      = !activeTab || activeTab === "closed"       ? closed      : [];

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <h1 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: "32px",
          letterSpacing: "1px",
          color: "#0A1628",
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

      {/* Tabs */}
      <div style={{
        display: "flex",
        gap: "6px",
        marginBottom: "24px",
        borderBottom: "2px solid #B8D0E8",
        flexWrap: "wrap",
      }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.value;
          const count = tab.value === null
            ? counts.all
            : counts[tab.value as keyof typeof counts] ?? 0;
          const href = tab.value
            ? `/dashboard/client/projects?tab=${tab.value}`
            : `/dashboard/client/projects`;
          // Needs Action tab glows red if there are any
          const isAlert = tab.value === "needs_action" && counts.needs_action > 0;

          return (
            <Link
              key={tab.label}
              href={href}
              style={{
                padding: "8px 16px",
                borderRadius: "6px 6px 0 0",
                fontFamily: "'Barlow', sans-serif",
                fontWeight: isActive ? 700 : 500,
                fontSize: "13px",
                textDecoration: "none",
                color: isActive ? tab.color : isAlert ? "#991B1B" : "#4A7FB5",
                background: isActive ? "#FFFFFF" : "transparent",
                borderTop: isActive ? `2px solid ${tab.color}` : "2px solid transparent",
                borderLeft: isActive ? "1px solid #B8D0E8" : "1px solid transparent",
                borderRight: isActive ? "1px solid #B8D0E8" : "1px solid transparent",
                borderBottom: isActive ? "2px solid #FFFFFF" : "none",
                marginBottom: isActive ? "-2px" : "0",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              {tab.label}
              <span style={{
                fontSize: "11px",
                fontWeight: 700,
                padding: "1px 7px",
                borderRadius: "20px",
                background: isActive
                  ? tab.color
                  : isAlert
                  ? "#FEF2F2"
                  : "#EEF4FF",
                color: isActive ? "#fff" : isAlert ? "#991B1B" : "#4A7FB5",
                border: isAlert && !isActive ? "1px solid #FCA5A5" : "none",
              }}>
                {count}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Needs Action section */}
      {visibleNeedsAction.length > 0 && (
        <div style={{ marginBottom: "28px" }}>
          {!activeTab && (
            <div style={{
              background: "#FEF2F2",
              border: "1px solid #FCA5A5",
              borderRadius: "8px",
              padding: "10px 14px",
              marginBottom: "12px",
              fontSize: "12px",
              color: "#991B1B",
              fontWeight: 600,
            }}>
              ⚠ {needsAction.length} project{needsAction.length !== 1 ? "s" : ""} need{needsAction.length === 1 ? "s" : ""} your attention — deadline passed, review bids now
            </div>
          )}
          {activeTab === "needs_action" && (
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "18px", letterSpacing: "1px", color: "#991B1B", textTransform: "uppercase", marginBottom: "12px" }}>
              Needs Action ({needsAction.length})
            </h2>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {visibleNeedsAction.map((p) => (
              <ProjectCard key={p.id} p={p} urgent bidCount={bidCountMap.get(p.id) ?? 0} />
            ))}
          </div>
        </div>
      )}

      {/* Active section */}
      {(visibleActive.length > 0 || activeTab === "active") && (
        <div style={{ marginBottom: "28px" }}>
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "18px", letterSpacing: "1px", color: "#0A1628", textTransform: "uppercase", marginBottom: "12px" }}>
            Active ({active.length})
          </h2>
          {visibleActive.length === 0 ? (
            <div style={{ background: "#EEF4FF", border: "1px solid #B8D0E8", borderRadius: "10px", padding: "24px", textAlign: "center", color: "#1B4F8A", fontSize: "14px" }}>
              No active projects.{" "}
              <Link href="/dashboard/client/projects/new" style={{ color: "#0A1628", textDecoration: "underline" }}>
                Create one
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {visibleActive.map((p) => (
                <ProjectCard key={p.id} p={p} bidCount={bidCountMap.get(p.id) ?? 0} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Awarded section */}
      {(visibleAwarded.length > 0 || activeTab === "awarded") && (
        <div style={{ marginBottom: "28px" }}>
          <hr style={{ border: "none", borderTop: "1px solid #B8D0E8", margin: "0 0 20px" }} />
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "18px", letterSpacing: "1px", color: "#0A1628", textTransform: "uppercase", marginBottom: "12px" }}>
            Awarded ({awarded.length})
          </h2>
          {visibleAwarded.length === 0 ? (
            <div style={{ background: "#EEF4FF", border: "1px solid #B8D0E8", borderRadius: "10px", padding: "24px", textAlign: "center", color: "#1B4F8A", fontSize: "14px" }}>
              No awarded projects yet.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {visibleAwarded.map((p) => (
                <ProjectCard key={p.id} p={p} bidCount={bidCountMap.get(p.id) ?? 0} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Closed section */}
      {(visibleClosed.length > 0 || activeTab === "closed") && (
        <div>
          <hr style={{ border: "none", borderTop: "1px solid #B8D0E8", margin: "0 0 20px" }} />
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "18px", letterSpacing: "1px", color: "#1B4F8A", textTransform: "uppercase", marginBottom: "12px" }}>
            Closed / Completed ({closed.length})
          </h2>
          {visibleClosed.length === 0 ? (
            <div style={{ background: "#EEF4FF", border: "1px solid #B8D0E8", borderRadius: "10px", padding: "24px", textAlign: "center", color: "#1B4F8A", fontSize: "14px" }}>
              No closed projects.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {visibleClosed.map((p) => (
                <ProjectCard key={p.id} p={p} bidCount={bidCountMap.get(p.id) ?? 0} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* All tab: empty state */}
      {!activeTab && projects.length === 0 && (
        <div style={{ background: "#EEF4FF", border: "1px solid #B8D0E8", borderRadius: "10px", padding: "48px", textAlign: "center", color: "#1B4F8A", fontSize: "14px" }}>
          No projects yet.{" "}
          <Link href="/dashboard/client/projects/new" style={{ color: "#0A1628", textDecoration: "underline" }}>
            Create your first project
          </Link>
        </div>
      )}
    </div>
  );
}

function ProjectCard({ p, urgent, bidCount }: { p: Project; urgent?: boolean; bidCount: number }) {
  const deadline = p.deadline_at ? new Date(p.deadline_at) : null;
  const now = new Date();
  const deadlinePassed = !!deadline && deadline.getTime() <= now.getTime();
  const bidsUnlocked = deadlinePassed && p.state !== "DRAFT";
  const hasBids = bidCount > 0;

  return (
    <Link href={`/dashboard/client/projects/${p.id}`} style={{ textDecoration: "none" }}>
      <HoverCard style={{
        background: "#EEF4FF",
        border: `1px solid ${urgent ? "#FCA5A5" : "#B8D0E8"}`,
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
            color: "#0A1628",
            marginBottom: "3px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            {p.title ?? "Untitled"}
          </div>
          <div style={{ fontSize: "12px", color: "#1B4F8A", marginBottom: "3px" }}>
            {p.category ?? "—"} • {p.city ?? "—"}
          </div>
          {deadline && (
            <div style={{ fontSize: "11px", color: deadlinePassed ? "#991B1B" : "#4A7FB5" }}>
              {deadlinePassed
                ? "⚠ Deadline passed"
                : `Deadline: ${deadline.toLocaleDateString()}`}
            </div>
          )}
          {bidsUnlocked && hasBids && (
            <div style={{ fontSize: "11px", color: "#15803D", marginTop: "2px" }}>
              ✓ {bidCount} bid{bidCount !== 1 ? "s" : ""} ready to review
            </div>
          )}
          {bidsUnlocked && !hasBids && (
            <div style={{ fontSize: "11px", color: "#92400E", marginTop: "4px", lineHeight: 1.4 }}>
              No bids received. Consider revisiting the project and addressing any open RFIs to help clarify the scope of work.
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
