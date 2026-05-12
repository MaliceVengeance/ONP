import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
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
  const { supabase } = await requireRole(["CONTRACTOR", "ADMIN"]);

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

  // Stats
  const totalBidValue = bids.reduce((sum, b) => sum + Number(b.latest_amount_cents), 0);
  const wonCount = awarded.length;

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
            Bid History
          </h1>
          <p style={{ fontSize: "13px", color: "#7A9CC4", marginTop: "4px" }}>
            All bids you have submitted across all projects
          </p>
        </div>
        <Link
          href="/dashboard/contractor/projects"
          style={{
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
          }}
        >
          Browse Projects
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "28px" }}>
        {[
          { label: "Total Bids", count: bids.length, value: null, accent: false },
          { label: "Pending", count: openBids.length, value: null, accent: openBids.length > 0 },
          { label: "Won", count: wonCount, value: null, accent: wonCount > 0 },
          { label: "Total Bid Value", count: null, value: fmtMoney(totalBidValue), accent: false },
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
              fontSize: s.value ? "22px" : "32px",
              color: s.accent ? "#C8102E" : "#fff",
            }}>
              {s.value ?? s.count}
            </div>
            <div style={{ fontSize: "11px", color: "#7A9CC4", textTransform: "uppercase", letterSpacing: "1px", marginTop: "2px" }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {bids.length === 0 && awarded.length === 0 ? (
        <div style={{
          background: "#0F2040",
          border: "1px solid #1B4F8A",
          borderRadius: "10px",
          padding: "48px",
          textAlign: "center",
          color: "#7A9CC4",
          fontSize: "14px",
        }}>
          You haven't placed any bids yet.{" "}
          <Link href="/dashboard/contractor/projects" style={{ color: "#fff", textDecoration: "underline" }}>
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
                color: "#A78BFA",
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
                      background: "#2D1B69",
                      border: "1px solid #5B21B6",
                      borderRadius: "10px",
                      padding: "18px",
                      cursor: "pointer",
                    }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: "15px", color: "#fff", marginBottom: "3px" }}>
                            {a.project_title ?? "Untitled Project"}
                          </div>
                          <div style={{ fontSize: "12px", color: "#A78BFA", marginBottom: "6px" }}>
                            {a.category ?? "—"} • {a.location_general ?? "—"}
                          </div>
                          {a.awarded_at && (
                            <div style={{ fontSize: "11px", color: "#7A9CC4" }}>
                              Awarded: {new Date(a.awarded_at).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{
                            fontFamily: "'Barlow Condensed', sans-serif",
                            fontWeight: 700,
                            fontSize: "28px",
                            color: "#fff",
                            lineHeight: 1,
                          }}>
                            {fmtMoney(a.latest_amount_cents)}
                          </div>
                          <div style={{
                            fontSize: "11px",
                            fontWeight: 600,
                            padding: "3px 10px",
                            borderRadius: "20px",
                            background: "#1B0D4A",
                            color: "#A78BFA",
                            border: "1px solid #5B21B6",
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
                color: "#fff",
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
              <hr style={{ border: "none", borderTop: "1px solid #1B4F8A", margin: "0 0 20px" }} />
              <h2 style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: "18px",
                letterSpacing: "1px",
                color: "#7A9CC4",
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
        background: "#0F2040",
        border: `1px solid ${isWon ? "#5B21B6" : "#1B4F8A"}`,
        borderRadius: "10px",
        padding: "18px",
        cursor: "pointer",
        opacity: !isOpen && !isWon ? 0.75 : 1,
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: "15px", color: "#fff", marginBottom: "3px" }}>
              {b.project_title ?? "Untitled Project"}
            </div>
            <div style={{ fontSize: "12px", color: "#7A9CC4", marginBottom: "8px" }}>
              {b.category ?? "—"} • {b.location_general ?? "—"}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span style={stateBadge(b.project_state)}>{b.project_state}</span>
              {deadline && (
                <span style={{ fontSize: "11px", color: deadlinePassed ? "#F87171" : "#4A7FB5" }}>
                  {deadlinePassed ? "Deadline passed" : `Deadline: ${deadline.toLocaleDateString()}`}
                </span>
              )}
              {b.bid_updated_at && (
                <span style={{ fontSize: "11px", color: "#3A5A7A" }}>
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
              color: "#fff",
              lineHeight: 1,
            }}>
              {fmtMoney(b.latest_amount_cents)}
            </div>
            <div style={{ fontSize: "11px", color: "#7A9CC4", marginTop: "4px" }}>
              v{b.version_number}
            </div>
            <div style={{
              fontSize: "11px",
              marginTop: "4px",
              fontWeight: 600,
              color: isWon ? "#A78BFA" : isOpen ? "#4ADE80" : "#3A5A7A",
            }}>
              {isWon ? "★ WON" : isOpen ? "● OPEN" : "● CLOSED"}
            </div>
          </div>
        </div>
      </HoverCard>
    </Link>
  );
}