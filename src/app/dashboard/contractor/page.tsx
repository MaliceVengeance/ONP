import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { stateBadge } from "@/lib/ui";
import HoverCard from "@/components/HoverCard";

type AwardedRow = {
  project_id: string;
  project_title: string | null;
  location_general: string | null;
  category: string | null;
  awarded_at: string;
};

type MyBidRow = {
  project_id: string;
  project_title: string | null;
  category: string | null;
  location_general: string | null;
  deadline_at: string | null;
  project_state: string;
  bid_id: string;
  latest_amount_cents: number | string;
  version_number: number;
};

type OpenProject = {
  id: string;
  title: string | null;
  category: string | null;
  location_general: string | null;
  deadline_at: string | null;
};

function getBranchInfo(branch: string | null) {
  switch (branch) {
    case "army": return { label: "U.S. Army", emoji: "🪖" };
    case "navy": return { label: "U.S. Navy", emoji: "⚓" };
    case "marines": return { label: "U.S. Marine Corps", emoji: "🦅" };
    case "air_force": return { label: "U.S. Air Force", emoji: "✈️" };
    case "space_force": return { label: "U.S. Space Force", emoji: "🚀" };
    case "coast_guard": return { label: "U.S. Coast Guard", emoji: "⚓" };
    case "national_guard": return { label: "National Guard", emoji: "🛡️" };
    default: return { label: "Veteran", emoji: "★" };
  }
}

function fmtMoney(cents: number | string) {
  const n = Number(cents);
  if (!Number.isFinite(n)) return "—";
  return `$${(n / 100).toLocaleString("en-US", { minimumFractionDigits: 0 })}`;
}

export default async function ContractorDashboard() {
  const { supabase, user } = await requireRole(["CONTRACTOR", "ADMIN"]);

const [
    { data: awardedData },
    { data: bidsData },
    { data: openProjectsData },
  ] = await Promise.all([
    supabase.rpc("list_my_awarded_projects"),
    supabase.rpc("list_my_active_bids"),
    supabase.rpc("list_open_projects", { p_sort: "deadline" }),
  ]);

  const { data: contractorProfile } = await supabase
    .from("contractor_profiles")
    .select("veteran_verified, military_branch")
    .eq("contractor_id", user.id)
    .maybeSingle();

  const isVeteran = contractorProfile?.veteran_verified ?? false;
  const militaryBranch = contractorProfile?.military_branch ?? null;

  const awarded = (awardedData ?? []) as AwardedRow[];
  const activeBids = (bidsData ?? []) as MyBidRow[];
  const openProjects = (openProjectsData ?? []) as OpenProject[];
  const openBids = activeBids.filter((b) => b.project_state === "OPEN");

  // Projects contractor has already bid on
  const bidProjectIds = new Set(activeBids.map((b) => b.project_id));

  // Open projects contractor has NOT bid on yet
  const unbidProjects = openProjects.filter((p) => !bidProjectIds.has(p.id));

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px" }}>
        <div>
          <h1 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "36px",
            letterSpacing: "1px",
            color: "#fff",
            margin: 0,
          }}>
            Contractor Dashboard
          </h1>
          <p style={{ fontSize: "13px", color: "#7A9CC4", marginTop: "4px" }}>
            {user.email}
          </p>
        </div>
        <Link href="/dashboard/contractor/projects" style={{
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
          Browse Projects
        </Link>
      </div>

{/* Veteran thank you banner */}
      {isVeteran && (() => {
        const branch = getBranchInfo(militaryBranch);
        return (
          <div style={{
            background: "#1e1a00",
            border: "1px solid #92400E",
            borderRadius: "12px",
            padding: "20px 24px",
            marginBottom: "28px",
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}>
            <div style={{ fontSize: "40px", flexShrink: 0 }}>
              {branch.emoji}
            </div>
            <div>
              <div style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: "22px",
                letterSpacing: "1px",
                color: "#FBBF24",
                marginBottom: "4px",
              }}>
                Thank You For Your Service
              </div>
              <div style={{ fontSize: "13px", color: "#7A9CC4" }}>
                {branch.label} • Certified Veteran Owned Business
              </div>
            </div>
            <div style={{
              marginLeft: "auto",
              fontSize: "11px",
              fontWeight: 600,
              padding: "6px 14px",
              borderRadius: "20px",
              background: "#1e1a00",
              color: "#FBBF24",
              border: "1px solid #92400E",
              flexShrink: 0,
            }}>
              ★ VERIFIED
            </div>
          </div>
        );
      })()}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px", marginBottom: "28px" }}>
        {[
          { label: "Pending Bids", count: openBids.length, accent: false },
          { label: "Total Bids", count: activeBids.length, accent: false },
          { label: "Won", count: awarded.length, accent: true },
          { label: "New Projects", count: unbidProjects.length, accent: unbidProjects.length > 0 },
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
          { label: "My Pending Bids", href: "/dashboard/contractor/bids" },
          { label: "My Profile", href: "/dashboard/contractor/profile" },
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

      {/* New projects available */}
      {unbidProjects.length > 0 && (
        <div style={{ marginBottom: "32px" }}>
          <h2 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "18px",
            letterSpacing: "1px",
            color: "#C8102E",
            textTransform: "uppercase",
            marginBottom: "12px",
          }}>
            ★ New Projects Available ({unbidProjects.length})
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {unbidProjects.slice(0, 3).map((p) => (
              <Link key={p.id} href={`/dashboard/contractor/projects/${p.id}`} style={{ textDecoration: "none" }}>
                <HoverCard style={{
                  background: "#0F2040",
                  border: "1px solid #1B4F8A",
                  borderRadius: "10px",
                  padding: "16px 18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "15px", color: "#fff", marginBottom: "3px" }}>
                      {p.title ?? "Untitled Project"}
                    </div>
                    <div style={{ fontSize: "12px", color: "#7A9CC4" }}>
                      {p.category ?? "—"} • {p.location_general ?? "—"}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    {p.deadline_at && (
                      <div style={{ fontSize: "11px", color: "#4A7FB5" }}>
                        Deadline: {new Date(p.deadline_at).toLocaleDateString()}
                      </div>
                    )}
                    <div style={{ fontSize: "11px", color: "#C8102E", fontWeight: 600, marginTop: "4px" }}>
                      Bid Now →
                    </div>
                  </div>
                </HoverCard>
              </Link>
            ))}
            {unbidProjects.length > 3 && (
              <Link href="/dashboard/contractor/projects" style={{
                textAlign: "center",
                fontSize: "13px",
                color: "#7A9CC4",
                textDecoration: "underline",
                display: "block",
                padding: "8px",
              }}>
                View all {unbidProjects.length} available projects →
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Pending Bids */}
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
          Pending Bids
        </h2>

        {openBids.length === 0 ? (
          <div style={{ background: "#0F2040", border: "1px solid #1B4F8A", borderRadius: "10px", padding: "24px", textAlign: "center", color: "#7A9CC4", fontSize: "14px" }}>
            No pending bids.{" "}
            <Link href="/dashboard/contractor/projects" style={{ color: "#fff", textDecoration: "underline" }}>
              Browse open projects
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {openBids.map((b) => (
              <Link key={b.bid_id} href={`/dashboard/contractor/projects/${b.project_id}`} style={{ textDecoration: "none" }}>
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
                      {b.project_title ?? "Untitled Project"}
                    </div>
                    <div style={{ fontSize: "12px", color: "#7A9CC4", marginBottom: "3px" }}>
                      {b.category ?? "—"} • {b.location_general ?? "—"}
                    </div>
                    {b.deadline_at && (
                      <div style={{ fontSize: "11px", color: "#4A7FB5" }}>
                        Deadline: {new Date(b.deadline_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "24px", color: "#fff" }}>
                      {fmtMoney(b.latest_amount_cents)}
                    </div>
                    <div style={{ fontSize: "11px", color: "#7A9CC4" }}>v{b.version_number}</div>
                    <div style={{ marginTop: "6px" }}>
                      <span style={stateBadge(b.project_state)}>
                        {b.project_state}
                      </span>
                    </div>
                  </div>
                </HoverCard>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Won Projects */}
      {awarded.length > 0 && (
        <div>
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
            Won Projects
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {awarded.map((p) => (
              <Link key={p.project_id} href={`/dashboard/contractor/projects/${p.project_id}`} style={{ textDecoration: "none" }}>
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
                      {p.project_title ?? "Untitled Project"}
                    </div>
                    <div style={{ fontSize: "12px", color: "#7A9CC4", marginBottom: "3px" }}>
                      {p.category ?? "—"} • {p.location_general ?? "—"}
                    </div>
                    <div style={{ fontSize: "11px", color: "#4A7FB5" }}>
                      Awarded: {new Date(p.awarded_at).toLocaleDateString()}
                    </div>
                  </div>
                  <span style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    padding: "4px 10px",
                    borderRadius: "20px",
                    letterSpacing: "0.5px",
                    background: "#2D1B69",
                    color: "#A78BFA",
                    border: "1px solid #5B21B6",
                  }}>
                    ★ WON
                  </span>
                </HoverCard>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}