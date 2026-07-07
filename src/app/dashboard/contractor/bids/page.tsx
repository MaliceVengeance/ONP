import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { stateBadge } from "@/lib/ui";
import HoverCard from "@/components/HoverCard";

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
  bid_updated_at: string | null;
};

type AwardedRow = {
  project_id: string;
  project_title: string | null;
  category: string | null;
  location_general: string | null;
  awarded_at: string | null;
  latest_amount_cents: number | string;
};

function fmtMoney(cents: number | string) {
  const n = Number(cents);
  if (!Number.isFinite(n)) return "—";
  return `$${(n / 100).toLocaleString("en-US", { minimumFractionDigits: 0 })}`;
}

export default async function ContractorMyBidsPage() {
  const { supabase, user } = await requireRole(["CONTRACTOR", "ADMIN"]);

  const [
    { data: bidsData, error: bidsError },
    { data: awardedData, error: awardedError },
  ] = await Promise.all([
    supabase.rpc("list_my_active_bids"),
    supabase.rpc("list_my_awarded_projects"),
  ]);

  if (bidsError) throw new Error(`RPC list_my_active_bids failed: ${JSON.stringify(bidsError)}`);

  const bids = (bidsData ?? []) as MyBidRow[];
  const awarded = (awardedData ?? []) as AwardedRow[];

  const openBids = bids.filter((b) => b.project_state === "OPEN");
  const closedBids = bids.filter((b) => b.project_state !== "OPEN" && b.project_state !== "AWARDED");
  const awardedBidIds = new Set(awarded.map((a) => a.project_id));

  // Fetch unread message counts for awarded projects
  const awardedProjectIds = awarded.map((a) => a.project_id);
  const unreadCountMap = new Map<string, number>();

  if (awardedProjectIds.length > 0) {
    const [{ data: msgs }, { data: reads }] = await Promise.all([
      supabaseAdmin
        .from("project_messages")
        .select("project_id, sender_id, created_at")
        .in("project_id", awardedProjectIds)
        .neq("sender_id", user.id),
      supabaseAdmin
        .from("project_message_reads")
        .select("project_id, last_read_at")
        .eq("user_id", user.id)
        .in("project_id", awardedProjectIds),
    ]);

    const readMap = new Map((reads ?? []).map((r: any) => [r.project_id, r.last_read_at]));
    for (const msg of msgs ?? []) {
      const m = msg as any;
      const lastRead = readMap.get(m.project_id);
      if (!lastRead || new Date(m.created_at) > new Date(lastRead)) {
        unreadCountMap.set(m.project_id, (unreadCountMap.get(m.project_id) ?? 0) + 1);
      }
    }
  }

  // Stats
  const totalBidValue = bids.reduce((sum, b) => sum + Number(b.latest_amount_cents), 0);
  const wonCount = awarded.length;

  return (
    <div>
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
            Bid History
          </h1>
          <p style={{ fontSize: "13px", color: "var(--camo-gunmetal)", marginTop: "4px" }}>
            All bids you have submitted across all projects
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <Link
            href="/dashboard/contractor/projects"
            style={{
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
            }}
          >
            Browse Projects
          </Link>
          <Link
            href="/dashboard/contractor"
            style={{
              background: "transparent",
              color: "var(--camo-gunmetal)",
              border: "1px solid #d9dbdb",
              padding: "10px 20px",
              borderRadius: "6px",
              fontFamily: "'Barlow', sans-serif",
              fontSize: "13px",
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            ← Back
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="mob-grid-2" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "28px" }}>
        {[
          { label: "Total Bids", count: bids.length, value: null, accent: false },
          { label: "Pending", count: openBids.length, value: null, accent: openBids.length > 0 },
          { label: "Won", count: wonCount, value: null, accent: wonCount > 0 },
          { label: "Total Bid Value", count: null, value: fmtMoney(totalBidValue), accent: false },
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
              fontSize: s.value ? "22px" : "32px",
              color: s.accent ? "var(--camo-accent)" : "var(--camo-charcoal)",
            }}>
              {s.value ?? s.count}
            </div>
            <div style={{ fontSize: "11px", color: "var(--camo-gunmetal)", textTransform: "uppercase", letterSpacing: "1px", marginTop: "2px" }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {bids.length === 0 && awarded.length === 0 ? (
        <div style={{
          background: "var(--camo-concrete)",
          border: "1px solid #d9dbdb",
          borderRadius: "10px",
          padding: "48px",
          textAlign: "center",
          color: "var(--camo-gunmetal)",
          fontSize: "14px",
        }}>
          You haven't placed any bids yet.{" "}
          <Link href="/dashboard/contractor/projects" style={{ color: "var(--camo-charcoal)", textDecoration: "underline" }}>
            Browse open projects
          </Link>
        </div>
      ) : (
        <>
          {/* Won projects */}
          {awarded.length > 0 && (
            <div style={{ marginBottom: "32px" }}>
              <h2 style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: "18px",
                letterSpacing: "1px",
                color: "var(--camo-gunmetal)",
                textTransform: "uppercase",
                marginBottom: "12px",
              }}>
                ★ Won ({awarded.length})
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {awarded.map((a) => (
                  <Link
                    key={a.project_id}
                    href={`/dashboard/contractor/projects/${a.project_id}`}
                    style={{ textDecoration: "none" }}
                  >
                    <HoverCard style={{
                      background: "var(--camo-concrete)",
                      border: `1px solid ${(unreadCountMap.get(a.project_id) ?? 0) > 0 ? "var(--camo-accent)" : "var(--camo-gunmetal)"}`,
                      borderRadius: "10px",
                      padding: "18px",
                      cursor: "pointer",
                    }}>
                      <div className="mob-card-stack" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: "15px", color: "var(--camo-charcoal)", marginBottom: "3px" }}>
                            {a.project_title ?? "Untitled Project"}
                          </div>
                          <div style={{ fontSize: "12px", color: "var(--camo-gunmetal)", marginBottom: "6px" }}>
                            {a.category ?? "—"} • {a.location_general ?? "—"}
                          </div>
                          {a.awarded_at && (
                            <div style={{ fontSize: "11px", color: "var(--camo-gunmetal)" }}>
                              Awarded: {new Date(a.awarded_at).toLocaleDateString()}
                            </div>
                          )}
                          {(unreadCountMap.get(a.project_id) ?? 0) > 0 && (
                            <div style={{ fontSize: "11px", color: "var(--camo-accent-dim)", fontWeight: 700, marginTop: "4px" }}>
                              💬 {unreadCountMap.get(a.project_id)} new message{(unreadCountMap.get(a.project_id) ?? 0) !== 1 ? "s" : ""}
                            </div>
                          )}
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{
                            fontFamily: "'Barlow Condensed', sans-serif",
                            fontWeight: 700,
                            fontSize: "28px",
                            color: "var(--camo-charcoal)",
                            lineHeight: 1,
                          }}>
                            {fmtMoney(a.latest_amount_cents)}
                          </div>
                          <div style={{
                            fontSize: "11px",
                            fontWeight: 600,
                            padding: "3px 10px",
                            borderRadius: "20px",
                            background: "var(--camo-concrete)",
                            color: "var(--camo-gunmetal)",
                            border: "1px solid #d9dbdb",
                            marginTop: "6px",
                            display: "inline-block",
                          }}>
                            ★ AWARDED
                          </div>
                        </div>
                      </div>
                    </HoverCard>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Pending bids */}
          {openBids.length > 0 && (
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
                Pending ({openBids.length})
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {openBids.map((b) => (
                  <BidCard key={b.bid_id} b={b} isWon={awardedBidIds.has(b.project_id)} />
                ))}
              </div>
            </div>
          )}

          {/* Closed bids */}
          {closedBids.length > 0 && (
            <div>
              <hr style={{ border: "none", borderTop: "1px solid #d9dbdb", margin: "0 0 20px" }} />
              <h2 style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: "18px",
                letterSpacing: "1px",
                color: "var(--camo-gunmetal)",
                textTransform: "uppercase",
                marginBottom: "12px",
              }}>
                Closed ({closedBids.length})
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {closedBids.map((b) => (
                  <BidCard key={b.bid_id} b={b} isWon={awardedBidIds.has(b.project_id)} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function BidCard({ b, isWon }: { b: MyBidRow; isWon: boolean }) {
  const deadline = b.deadline_at ? new Date(b.deadline_at) : null;
  const deadlinePassed = !!deadline && deadline.getTime() <= Date.now();
  const isOpen = b.project_state === "OPEN";

  return (
    <Link href={`/dashboard/contractor/projects/${b.project_id}`} style={{ textDecoration: "none" }}>
      <HoverCard style={{
        background: "var(--camo-concrete)",
        border: `1px solid ${isWon ? "var(--camo-gunmetal)" : "#d9dbdb"}`,
        borderRadius: "10px",
        padding: "18px",
        cursor: "pointer",
        opacity: !isOpen && !isWon ? 0.75 : 1,
      }}>
        <div className="mob-card-stack" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: "15px", color: "var(--camo-charcoal)", marginBottom: "3px" }}>
              {b.project_title ?? "Untitled Project"}
            </div>
            <div style={{ fontSize: "12px", color: "var(--camo-gunmetal)", marginBottom: "8px" }}>
              {b.category ?? "—"} • {b.location_general ?? "—"}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span style={stateBadge(b.project_state)}>{b.project_state}</span>
              {deadline && (
                <span style={{ fontSize: "11px", color: deadlinePassed ? "#991B1B" : "var(--camo-gunmetal)" }}>
                  {deadlinePassed ? "Deadline passed" : `Deadline: ${deadline.toLocaleDateString()}`}
                </span>
              )}
              {b.bid_updated_at && (
                <span style={{ fontSize: "11px", color: "var(--camo-gunmetal)" }}>
                  Updated: {new Date(b.bid_updated_at).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: "28px",
              color: "var(--camo-charcoal)",
              lineHeight: 1,
            }}>
              {fmtMoney(b.latest_amount_cents)}
            </div>
            <div style={{ fontSize: "11px", color: "var(--camo-gunmetal)", marginTop: "4px" }}>
              v{b.version_number}
            </div>
            <div style={{
              fontSize: "11px",
              marginTop: "4px",
              fontWeight: 600,
              color: isWon ? "var(--camo-gunmetal)" : isOpen ? "#15803D" : "var(--camo-gunmetal)",
            }}>
              {isWon ? "★ WON" : isOpen ? "● OPEN" : "● CLOSED"}
            </div>
          </div>
        </div>
      </HoverCard>
    </Link>
  );
}
