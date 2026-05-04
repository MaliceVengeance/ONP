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

function fmtMoney(cents: number | string) {
  const n = Number(cents);
  if (!Number.isFinite(n)) return "—";
  return `$${(n / 100).toLocaleString("en-US", { minimumFractionDigits: 0 })}`;
}

export default async function ContractorDashboard() {
  const { supabase, user } = await requireRole(["CONTRACTOR", "ADMIN"]);

  const [{ data: awardedData, error: awardErr }, { data: bidsData, error: bidsErr }] =
    await Promise.all([
      supabase.rpc("list_my_awarded_projects"),
      supabase.rpc("list_my_active_bids"),
    ]);

  const awarded = (awardedData ?? []) as AwardedRow[];
  const activeBids = (bidsData ?? []) as MyBidRow[];
  const openBids = activeBids.filter((b) => b.project_state === "OPEN");

  return (
    <div>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "36px", letterSpacing: "1px", color: "#fff", margin: 0 }}>
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

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "28px" }}>
        {[
          { label: "Active Bids", count: openBids.length, accent: false },
          { label: "Total Bids", count: activeBids.length, accent: false },
          { label: "Won", count: awarded.length, accent: true },
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
              fontSize: "36px",
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
          { label: "My Active Bids", href: "/dashboard/contractor/bids" },
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

      {/* Active Bids */}
      <div style={{ marginBottom: "32px" }}>
        <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "18px", letterSpacing: "1px", color: "#fff", textTransform: "uppercase", marginBottom: "12px" }}>
          Active Bids
        </h2>

        {bidsErr ? (
          <div style={{ background: "#3D0A0A", border: "1px solid #991B1B", color: "#F87171", padding: "14px", borderRadius: "8px", fontSize: "13px" }}>
            Failed to load bids.
          </div>
        ) : openBids.length === 0 ? (
          <div style={{ background: "#0F2040", border: "1px solid #1B4F8A", borderRadius: "10px", padding: "24px", textAlign: "center", color: "#7A9CC4", fontSize: "14px" }}>
            No active bids.{" "}
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
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "18px", letterSpacing: "1px", color: "#fff", textTransform: "uppercase", marginBottom: "12px" }}>
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