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

function fmtMoney(cents: number | string) {
  const n = Number(cents);
  if (!Number.isFinite(n)) return "—";
  return `$${(n / 100).toLocaleString("en-US", { minimumFractionDigits: 0 })}`;
}

export default async function ContractorMyBidsPage() {
  const { supabase } = await requireRole(["CONTRACTOR", "ADMIN"]);

  const { data, error } = await supabase.rpc("list_my_active_bids");

  if (error) {
    throw new Error(`RPC list_my_active_bids failed: ${JSON.stringify(error)}`);
  }

  const bids = (data ?? []) as MyBidRow[];
  const openBids = bids.filter((b) => b.project_state === "OPEN");
  const closedBids = bids.filter((b) => b.project_state !== "OPEN");

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
            My Bids
          </h1>
          <p style={{ fontSize: "13px", color: "#7A9CC4", marginTop: "4px" }}>
            Your latest bid per project
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", marginBottom: "28px" }}>
        {[
          { label: "Active Bids", count: openBids.length, accent: false },
          { label: "Closed Bids", count: closedBids.length, accent: false },
        ].map((s) => (
          <div key={s.label} style={{
            background: "#0F2040",
            border: "1px solid #1B4F8A",
            borderRadius: "10px",
            padding: "16px",
            textAlign: "center",
          }}>
            <div style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: "32px",
              color: "#fff",
            }}>
              {s.count}
            </div>
            <div style={{ fontSize: "11px", color: "#7A9CC4", textTransform: "uppercase", letterSpacing: "1px", marginTop: "2px" }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {bids.length === 0 ? (
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
          {/* Active bids */}
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
                Active ({openBids.length})
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {openBids.map((b) => (
                  <BidCard key={b.bid_id} b={b} />
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
                  <BidCard key={b.bid_id} b={b} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function BidCard({ b }: { b: MyBidRow }) {
  const deadline = b.deadline_at ? new Date(b.deadline_at) : null;
  const deadlinePassed = !!deadline && deadline.getTime() <= Date.now();
  const isOpen = b.project_state === "OPEN";

  return (
    <Link href={`/dashboard/contractor/projects/${b.project_id}`} style={{ textDecoration: "none" }}>
      <HoverCard style={{
        background: "#0F2040",
        border: "1px solid #1B4F8A",
        borderRadius: "10px",
        padding: "18px",
        cursor: "pointer",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: "15px", color: "#fff", marginBottom: "3px" }}>
              {b.project_title ?? "Untitled Project"}
            </div>
            <div style={{ fontSize: "12px", color: "#7A9CC4", marginBottom: "8px" }}>
              {b.category ?? "—"} • {b.location_general ?? "—"}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={stateBadge(b.project_state)}>{b.project_state}</span>
              {deadline && (
                <span style={{ fontSize: "11px", color: deadlinePassed ? "#F87171" : "#4A7FB5" }}>
                  {deadlinePassed ? "Deadline passed" : `Deadline: ${deadline.toLocaleDateString()}`}
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
            <div style={{ fontSize: "11px", color: isOpen ? "#4ADE80" : "#3A5A7A", marginTop: "4px", fontWeight: 600 }}>
              {isOpen ? "● OPEN" : "● CLOSED"}
            </div>
          </div>
        </div>
      </HoverCard>
    </Link>
  );
}