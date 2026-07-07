import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { stateBadge } from "@/lib/ui";
import HoverCard from "@/components/HoverCard";
import { SERVICE_AREA_LABEL } from "@/lib/serviceArea/launchZips";

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

export default async function ContractorDashboard({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const sp = await searchParams;
  const showWelcome = sp?.welcome === "1";

  const { supabase, user } = await requireRole(["CONTRACTOR", "ADMIN"]);

  // Service area status
  const { data: profileStatus } = await supabaseAdmin
    .from("profiles")
    .select("service_area_status, service_area_zip")
    .eq("id", user.id)
    .single();
  const isOutOfArea = profileStatus?.service_area_status === "OUT_OF_AREA";

  const [
    { data: awardedData },
    { data: bidsData },
    { data: openProjectsData },
  ] = await Promise.all([
    supabase.rpc("list_my_awarded_projects"),
    supabase.rpc("list_my_active_bids"),
    supabase.rpc("list_open_projects", { p_sort: "deadline" }),
  ]);

  const [{ data: contractorProfile }, { data: subscriptionData }] = await Promise.all([
    supabase
      .from("contractor_profiles")
      .select("veteran_verified, military_branch")
      .eq("contractor_id", user.id)
      .maybeSingle(),
    supabase
      .from("contractor_subscriptions")
      .select("status")
      .eq("contractor_id", user.id)
      .maybeSingle(),
  ]);

  const isVeteran = contractorProfile?.veteran_verified ?? false;
  const militaryBranch = contractorProfile?.military_branch ?? null;
  const hasActiveSub =
    subscriptionData?.status === "ACTIVE" || subscriptionData?.status === "TRIALING";
  const showOnboarding = !hasActiveSub && !showWelcome;

  const awarded = (awardedData ?? []) as AwardedRow[];
  const activeBids = (bidsData ?? []) as MyBidRow[];
  const openProjects = (openProjectsData ?? []) as OpenProject[];
  const openBids = activeBids.filter((b) => b.project_state === "OPEN");

  const bidProjectIds = new Set(activeBids.map((b) => b.project_id));
  const unbidProjects = openProjects.filter((p) => !bidProjectIds.has(p.id));

  // Fetch total unread messages across awarded projects
  const awardedIds = awarded.map((a) => a.project_id);
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
          Subscription activation is unavailable until then. If you operate in El Paso or Las Cruces,{" "}
          <Link href="/dashboard/contractor/profile" style={{ color: "#92400E", fontWeight: 600 }}>
            update your ZIP in your profile
          </Link>{" "}
          or <a href="mailto:support@ournextproject.us" style={{ color: "#92400E", fontWeight: 600 }}>contact support</a> for manual verification.
        </div>
      )}

      {/* Unread messages banner */}
      {totalUnreadMessages > 0 && (
        <Link href="/dashboard/contractor/bids" style={{ textDecoration: "none", display: "block", marginBottom: "20px" }}>
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
                  New messages on your awarded project{awarded.length !== 1 ? "s" : ""}
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

      {/* Welcome banner */}
      {showWelcome && (
        <div style={{
          background: "#F0FDF4",
          border: "1px solid #166534",
          borderRadius: "12px",
          padding: "24px 28px",
          marginBottom: "28px",
          display: "flex",
          alignItems: "center",
          gap: "20px",
        }}>
          <div style={{ fontSize: "48px", flexShrink: 0 }}>🎉</div>
          <div>
            <div style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: "26px",
              letterSpacing: "1px",
              color: "#15803D",
              marginBottom: "6px",
            }}>
              Welcome to ONP!
            </div>
            <div style={{ fontSize: "14px", color: "#166534", marginBottom: "12px" }}>
              Your subscription is active. You now have full access to the ONP bidding platform.
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <Link href="/dashboard/contractor/projects" style={{
                background: "var(--camo-accent)",
                color: "var(--camo-ink)",
                padding: "8px 18px",
                borderRadius: "6px",
                fontFamily: "'Barlow', sans-serif",
                fontWeight: 600,
                fontSize: "13px",
                textDecoration: "none",
              }}>
                Browse Open Projects →
              </Link>
              <Link href="/dashboard/contractor/profile" style={{
                background: "transparent",
                color: "#15803D",
                border: "1px solid #166534",
                padding: "8px 18px",
                borderRadius: "6px",
                fontFamily: "'Barlow', sans-serif",
                fontWeight: 600,
                fontSize: "13px",
                textDecoration: "none",
              }}>
                Complete Your Profile
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Onboarding banner — shown to unsubscribed contractors */}
      {showOnboarding && (
        <div style={{
          background: "var(--camo-concrete)",
          border: "1px solid var(--camo-gunmetal)",
          borderRadius: "12px",
          padding: "24px 28px",
          marginBottom: "28px",
          display: "flex",
          alignItems: "flex-start",
          gap: "20px",
        }}>
          <div style={{ fontSize: "40px", flexShrink: 0 }}>🏗️</div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: "22px",
              letterSpacing: "1px",
              color: "var(--camo-charcoal)",
              marginBottom: "6px",
            }}>
              Get Started — It's Free
            </div>
            <div style={{ fontSize: "14px", color: "var(--camo-gunmetal)", marginBottom: "16px", lineHeight: 1.6 }}>
              Complete your profile and apply for <strong>Certified Veteran Owned</strong> status at no cost.
              Subscribe when you're ready to start bidding on projects.
            </div>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <Link href="/dashboard/contractor/profile" style={{
                background: "var(--camo-gunmetal)",
                color: "#fff",
                padding: "9px 20px",
                borderRadius: "6px",
                fontFamily: "'Barlow', sans-serif",
                fontWeight: 600,
                fontSize: "13px",
                textDecoration: "none",
                display: "inline-block",
              }}>
                Complete Your Profile
              </Link>
              <Link href="/dashboard/contractor/subscribe" style={{
                background: "transparent",
                color: "var(--camo-gunmetal)",
                border: "1px solid var(--camo-gunmetal)",
                padding: "9px 20px",
                borderRadius: "6px",
                fontFamily: "'Barlow', sans-serif",
                fontWeight: 600,
                fontSize: "13px",
                textDecoration: "none",
                display: "inline-block",
              }}>
                View Subscription Plans →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
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
            Contractor Dashboard
          </h1>
          <p style={{ fontSize: "13px", color: "var(--camo-gunmetal)", marginTop: "4px" }}>
            {user.email}
          </p>
        </div>
        <Link href="/dashboard/contractor/projects" style={{
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
          Browse Projects
        </Link>
        <Link href="/dashboard/contractor/subscribe" style={{
          background: "#F0FDF4",
          color: "#15803D",
          border: "1px solid #166534",
          padding: "10px 20px",
          borderRadius: "6px",
          fontFamily: "'Barlow', sans-serif",
          fontWeight: 600,
          fontSize: "13px",
          textDecoration: "none",
          display: "inline-block",
        }}>
          Manage Subscription
        </Link>
      </div>

      {/* Veteran thank you banner */}
      {isVeteran && (() => {
        const branch = getBranchInfo(militaryBranch);
        return (
          <div style={{
            background: "#FFF7ED",
            border: "1px solid #D97706",
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
                color: "#B45309",
                marginBottom: "4px",
              }}>
                Thank You For Your Service
              </div>
              <div style={{ fontSize: "13px", color: "#92400E" }}>
                {branch.label} • Certified Veteran Owned Business
              </div>
            </div>
            <div style={{
              marginLeft: "auto",
              fontSize: "11px",
              fontWeight: 600,
              padding: "6px 14px",
              borderRadius: "20px",
              background: "#FFF7ED",
              color: "#B45309",
              border: "1px solid #D97706",
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
          { label: "My Pending Bids", href: "/dashboard/contractor/bids" },
          { label: "My Profile", href: "/dashboard/contractor/profile" },
          { label: "⚙ Notification Settings", href: "/dashboard/contractor/settings" },
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

      {/* New projects available */}
      {unbidProjects.length > 0 && (
        <div style={{ marginBottom: "32px" }}>
          <h2 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "18px",
            letterSpacing: "1px",
            color: "var(--camo-accent-dim)",
            textTransform: "uppercase",
            marginBottom: "12px",
          }}>
            ★ New Projects Available ({unbidProjects.length})
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {unbidProjects.slice(0, 3).map((p) => (
              <Link key={p.id} href={`/dashboard/contractor/projects/${p.id}`} style={{ textDecoration: "none" }}>
                <HoverCard style={{
                  background: "var(--camo-concrete)",
                  border: "1px solid #d9dbdb",
                  borderRadius: "10px",
                  padding: "16px 18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "15px", color: "var(--camo-charcoal)", marginBottom: "3px" }}>
                      {p.title ?? "Untitled Project"}
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--camo-gunmetal)" }}>
                      {p.category ?? "—"} • {p.location_general ?? "—"}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    {p.deadline_at && (
                      <div style={{ fontSize: "11px", color: "var(--camo-gunmetal)" }}>
                        Deadline: {new Date(p.deadline_at).toLocaleDateString()}
                      </div>
                    )}
                    <div style={{ fontSize: "11px", color: "var(--camo-accent-dim)", fontWeight: 600, marginTop: "4px" }}>
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
                color: "var(--camo-gunmetal)",
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
          color: "var(--camo-charcoal)",
          textTransform: "uppercase",
          marginBottom: "12px",
        }}>
          Pending Bids
        </h2>
        {openBids.length === 0 ? (
          <div style={{ background: "var(--camo-concrete)", border: "1px solid #d9dbdb", borderRadius: "10px", padding: "24px", textAlign: "center", color: "var(--camo-gunmetal)", fontSize: "14px" }}>
            No pending bids.{" "}
            <Link href="/dashboard/contractor/projects" style={{ color: "var(--camo-charcoal)", textDecoration: "underline" }}>
              Browse open projects
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {openBids.map((b) => (
              <Link key={b.bid_id} href={`/dashboard/contractor/projects/${b.project_id}`} style={{ textDecoration: "none" }}>
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
                      {b.project_title ?? "Untitled Project"}
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--camo-gunmetal)", marginBottom: "3px" }}>
                      {b.category ?? "—"} • {b.location_general ?? "—"}
                    </div>
                    {b.deadline_at && (
                      <div style={{ fontSize: "11px", color: "var(--camo-gunmetal)" }}>
                        Deadline: {new Date(b.deadline_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "24px", color: "var(--camo-charcoal)" }}>
                      {fmtMoney(b.latest_amount_cents)}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--camo-gunmetal)" }}>v{b.version_number}</div>
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
          <hr style={{ border: "none", borderTop: "1px solid #d9dbdb", margin: "0 0 20px" }} />
          <h2 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "18px",
            letterSpacing: "1px",
            color: "var(--camo-charcoal)",
            textTransform: "uppercase",
            marginBottom: "12px",
          }}>
            Won Projects
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {awarded.map((p) => (
              <Link key={p.project_id} href={`/dashboard/contractor/projects/${p.project_id}`} style={{ textDecoration: "none" }}>
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
                      {p.project_title ?? "Untitled Project"}
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--camo-gunmetal)", marginBottom: "3px" }}>
                      {p.category ?? "—"} • {p.location_general ?? "—"}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--camo-gunmetal)" }}>
                      Awarded: {new Date(p.awarded_at).toLocaleDateString()}
                    </div>
                  </div>
                  <span style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    padding: "4px 10px",
                    borderRadius: "20px",
                    letterSpacing: "0.5px",
                    background: "var(--camo-concrete)",
                    color: "var(--camo-gunmetal)",
                    border: "1px solid #d9dbdb",
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
