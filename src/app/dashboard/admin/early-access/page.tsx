import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";

type EarlyAccessRow = {
  id: string;
  email: string;
  zip: string;
  role: string;
  contractor_trade: string | null;
  created_at: string;
};

const statBoxStyle: React.CSSProperties = {
  background: "var(--camo-concrete)",
  border: "1px solid #d9dbdb",
  borderRadius: "10px",
  padding: "16px 20px",
};

const statLabelStyle: React.CSSProperties = {
  fontSize: "11px",
  color: "var(--camo-gunmetal)",
  textTransform: "uppercase",
  letterSpacing: "1px",
  marginBottom: "4px",
};

const panelTitleStyle: React.CSSProperties = {
  fontFamily: "'Barlow Condensed', sans-serif",
  fontWeight: 700,
  fontSize: "14px",
  letterSpacing: "1px",
  color: "var(--camo-charcoal)",
  textTransform: "uppercase",
  marginBottom: "12px",
};

/**
 * Read-only demand-measurement view for the Early Access list — no notes,
 * lead statuses, assignment, editing, or deletion. This is the only
 * intended reader of early_access_signups (see migration 031's zero-RLS-
 * policy design); access is gated purely by requireRole(["ADMIN"]), the
 * same pattern used throughout dashboard/admin/**.
 */
export default async function AdminEarlyAccessPage() {
  await requireRole(["ADMIN"]);

  const { data, error } = await supabaseAdmin
    .from("early_access_signups")
    .select("id, email, zip, role, contractor_trade, created_at")
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as EarlyAccessRow[];

  if (error) {
    console.error(
      `[earlyAccess:adminPage] failed to load rows code=${error.code ?? "unknown"} message=${error.message}`
    );
  }

  const totalSignups = rows.length;
  const distinctEmails = new Set(rows.map((r) => r.email.trim().toLowerCase())).size;

  const roleCounts = new Map<string, number>();
  const zipCounts = new Map<string, number>();
  const tradeCounts = new Map<string, number>();
  for (const r of rows) {
    roleCounts.set(r.role, (roleCounts.get(r.role) ?? 0) + 1);
    zipCounts.set(r.zip, (zipCounts.get(r.zip) ?? 0) + 1);
    if (r.role === "CONTRACTOR") {
      const trade = r.contractor_trade ?? "Not specified";
      tradeCounts.set(trade, (tradeCounts.get(trade) ?? 0) + 1);
    }
  }
  const roleBreakdown = [...roleCounts.entries()].sort((a, b) => b[1] - a[1]);
  const topZips = [...zipCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20);
  const tradeBreakdown = [...tradeCounts.entries()].sort((a, b) => b[1] - a[1]);
  const recent = rows.slice(0, 50);

  return (
    <div>
      <div style={{ marginBottom: "28px" }}>
        <h1
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "36px",
            letterSpacing: "1px",
            color: "var(--camo-charcoal)",
            margin: 0,
          }}
        >
          Early Access
        </h1>
        <p style={{ fontSize: "13px", color: "var(--camo-gunmetal)", marginTop: "4px" }}>
          Pre-launch demand-validation signups. Read-only — see the Expansion Waitlist for post-attempt geographic
          demand from people who already tried to sign up.
        </p>
      </div>

      {error ? (
        <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: "10px", padding: "32px", textAlign: "center", color: "#991B1B", fontSize: "14px" }}>
          Couldn&apos;t load Early Access signups due to a server error.
        </div>
      ) : (
        <>
          <div className="mob-grid-1" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", marginBottom: "28px" }}>
            {[
              { label: "Total Signups", value: totalSignups },
              { label: "Distinct People", value: distinctEmails },
            ].map((s) => (
              <div key={s.label} style={statBoxStyle}>
                <div style={statLabelStyle}>{s.label}</div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "32px", color: "var(--camo-charcoal)" }}>
                  {s.value}
                </div>
              </div>
            ))}
          </div>

          <div className="mob-grid-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "28px" }}>
            <div style={statBoxStyle}>
              <div style={panelTitleStyle}>By Role</div>
              {roleBreakdown.length === 0 ? (
                <div style={{ fontSize: "13px", color: "var(--camo-gunmetal)" }}>No data yet</div>
              ) : (
                roleBreakdown.map(([role, count]) => (
                  <div key={role} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--camo-charcoal)", marginBottom: "6px" }}>
                    <span>{role.replaceAll("_", " ")}</span>
                    <span style={{ fontWeight: 700 }}>{count}</span>
                  </div>
                ))
              )}
            </div>

            <div style={statBoxStyle}>
              <div style={panelTitleStyle}>Top ZIPs</div>
              {topZips.length === 0 ? (
                <div style={{ fontSize: "13px", color: "var(--camo-gunmetal)" }}>No data yet</div>
              ) : (
                topZips.map(([zip, count]) => (
                  <div key={zip} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--camo-charcoal)", marginBottom: "6px" }}>
                    <span>{zip}</span>
                    <span style={{ fontWeight: 700 }}>{count}</span>
                  </div>
                ))
              )}
            </div>

            <div style={statBoxStyle}>
              <div style={panelTitleStyle}>Contractor Trade</div>
              {tradeBreakdown.length === 0 ? (
                <div style={{ fontSize: "13px", color: "var(--camo-gunmetal)" }}>No data yet</div>
              ) : (
                tradeBreakdown.map(([trade, count]) => (
                  <div key={trade} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--camo-charcoal)", marginBottom: "6px" }}>
                    <span>{trade.replaceAll("_", " ")}</span>
                    <span style={{ fontWeight: 700 }}>{count}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div style={panelTitleStyle}>Recent Signups</div>
          {recent.length === 0 ? (
            <div style={{ background: "var(--camo-concrete)", border: "1px solid #d9dbdb", borderRadius: "10px", padding: "32px", textAlign: "center", color: "var(--camo-gunmetal)", fontSize: "14px" }}>
              No signups yet.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {recent.map((row) => (
                <div
                  key={row.id}
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #d9dbdb",
                    borderRadius: "10px",
                    padding: "12px 16px",
                    display: "flex",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "8px",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "13px", color: "var(--camo-charcoal)" }}>{row.email}</div>
                    <div style={{ fontSize: "11px", color: "var(--camo-gunmetal)" }}>
                      ZIP {row.zip} · {row.role.replaceAll("_", " ")}
                      {row.contractor_trade && ` · ${row.contractor_trade.replaceAll("_", " ")}`}
                    </div>
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--camo-gunmetal)" }}>
                    {new Date(row.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <div style={{ marginTop: "28px" }}>
        <Link href="/dashboard/admin" style={{ fontSize: "13px", color: "var(--camo-gunmetal)" }}>
          ← Admin Home
        </Link>
      </div>
    </div>
  );
}
