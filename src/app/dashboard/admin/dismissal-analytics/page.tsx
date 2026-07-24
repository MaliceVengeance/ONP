import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";

const REASON_LABELS: Record<string, string> = {
  OVER_BUDGET: "Over Budget",
  UNDER_BUDGET: "Under Budget",
  TIMELINE: "Timeline doesn't work",
  PROPOSAL_UNCLEAR: "Proposal incomplete or unclear",
  MISSING_CREDENTIALS: "Missing license/insurance/bond info",
  PORTFOLIO_MISMATCH: "Portfolio/experience didn't match project needs",
  WENT_ANOTHER: "Went with another contractor",
  OTHER: "Other",
};

const TIME_RANGES: Record<string, number | null> = {
  "30": 30,
  "90": 90,
  "365": 365,
  all: null,
};

const inputStyle: React.CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #d9dbdb",
  color: "var(--camo-charcoal)",
  borderRadius: "6px",
  padding: "8px 12px",
  fontFamily: "'Barlow', sans-serif",
  fontSize: "13px",
  outline: "none",
};

export default async function DismissalAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ trade?: string; region?: string; range?: string }>;
}) {
  await requireRole(["ADMIN"]);
  const sp = await searchParams;
  const range = sp.range && TIME_RANGES[sp.range] !== undefined ? sp.range : "90";
  const rangeDays = TIME_RANGES[range];

  const { data: dismissalRows, error } = await supabaseAdmin
    .from("bid_dismissals")
    .select("id, project_id, reason_code, dismissed_at");
  if (error) throw error;

  const projectIds = [...new Set((dismissalRows ?? []).map((d) => d.project_id))];
  const { data: projectRows } = projectIds.length > 0
    ? await supabaseAdmin.from("projects").select("id, category, city").in("id", projectIds)
    : { data: [] as any[] };

  const projectInfo = new Map((projectRows ?? []).map((p: any) => [p.id, { category: p.category as string | null, city: p.city as string | null }]));

  const cutoff = rangeDays ? Date.now() - rangeDays * 24 * 60 * 60 * 1000 : null;

  let rows = (dismissalRows ?? [])
    .map((d) => ({
      ...d,
      category: projectInfo.get(d.project_id)?.category ?? "Uncategorized",
      city: projectInfo.get(d.project_id)?.city ?? "Unknown",
    }))
    .filter((d) => !cutoff || new Date(d.dismissed_at).getTime() >= cutoff);

  const allTrades = [...new Set(rows.map((r) => r.category))].sort();
  const allRegions = [...new Set(rows.map((r) => r.city))].sort();

  if (sp.trade) rows = rows.filter((r) => r.category === sp.trade);
  if (sp.region) rows = rows.filter((r) => r.city === sp.region);

  // Overall reason breakdown
  const reasonCounts = new Map<string, number>();
  rows.forEach((r) => {
    const code = r.reason_code ?? "NO_REASON";
    reasonCounts.set(code, (reasonCounts.get(code) ?? 0) + 1);
  });
  const totalWithFilters = rows.length;
  const breakdown = [...reasonCounts.entries()]
    .map(([code, count]) => ({
      code,
      label: code === "NO_REASON" ? "No reason given" : REASON_LABELS[code] ?? code,
      count,
      pct: totalWithFilters > 0 ? Math.round((count / totalWithFilters) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // Per-trade top reason — the "could this be a sentence in an email" view.
  // Uses the unfiltered-by-trade set so every trade gets its own top reason,
  // even when a specific trade filter is applied elsewhere on the page.
  const tradeGroups = new Map<string, Map<string, number>>();
  (sp.trade ? rows : (dismissalRows ?? [])
    .map((d) => ({ ...d, category: projectInfo.get(d.project_id)?.category ?? "Uncategorized", city: projectInfo.get(d.project_id)?.city ?? "Unknown" }))
    .filter((d) => !cutoff || new Date(d.dismissed_at).getTime() >= cutoff)
    .filter((d) => !sp.region || d.city === sp.region)
  ).forEach((r) => {
    const codeMap = tradeGroups.get(r.category) ?? new Map<string, number>();
    const code = r.reason_code ?? "NO_REASON";
    codeMap.set(code, (codeMap.get(code) ?? 0) + 1);
    tradeGroups.set(r.category, codeMap);
  });

  const tradeInsights = [...tradeGroups.entries()].map(([trade, codeMap]) => {
    const total = [...codeMap.values()].reduce((a, b) => a + b, 0);
    const [topCode, topCount] = [...codeMap.entries()].sort((a, b) => b[1] - a[1])[0];
    const pct = Math.round((topCount / total) * 100);
    const label = topCode === "NO_REASON" ? "no reason given" : REASON_LABELS[topCode] ?? topCode;
    return { trade, label, pct, total };
  }).filter((t) => t.total >= 3) // only surface trades with enough volume to be a real pattern
    .sort((a, b) => b.total - a.total);

  return (
    <div>
      <div className="mob-col mob-gap-sm" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "36px", letterSpacing: "1px", color: "var(--camo-charcoal)", margin: 0 }}>
            Dismissal Analytics
          </h1>
          <p style={{ fontSize: "13px", color: "var(--camo-gunmetal)", marginTop: "4px" }}>
            {totalWithFilters} dismissal{totalWithFilters !== 1 ? "s" : ""} in view — separate from any contractor-pass data.
          </p>
        </div>
        <Link href="/dashboard/admin" style={{ background: "transparent", color: "var(--camo-gunmetal)", border: "1px solid #d9dbdb", padding: "8px 16px", borderRadius: "6px", fontFamily: "'Barlow', sans-serif", fontSize: "13px", textDecoration: "none", flexShrink: 0 }}>
          Back
        </Link>
      </div>

      {/* Filters */}
      <form style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "flex-end", marginBottom: "24px", background: "var(--camo-concrete)", border: "1px solid #d9dbdb", borderRadius: "10px", padding: "16px 20px" }}>
        <div>
          <label style={{ display: "block", fontSize: "11px", color: "var(--camo-gunmetal)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Trade</label>
          <select name="trade" defaultValue={sp.trade ?? ""} style={inputStyle}>
            <option value="">All trades</option>
            {allTrades.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: "block", fontSize: "11px", color: "var(--camo-gunmetal)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Region</label>
          <select name="region" defaultValue={sp.region ?? ""} style={inputStyle}>
            <option value="">All regions</option>
            {allRegions.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: "block", fontSize: "11px", color: "var(--camo-gunmetal)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Time Range</label>
          <select name="range" defaultValue={range} style={inputStyle}>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
            <option value="all">All time</option>
          </select>
        </div>
        <button type="submit" style={{ background: "var(--camo-gunmetal)", color: "#fff", border: "none", padding: "9px 20px", borderRadius: "6px", fontFamily: "'Barlow', sans-serif", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}>
          Apply
        </button>
        <Link href="/dashboard/admin/dismissal-analytics" style={{ background: "transparent", color: "var(--camo-gunmetal)", border: "1px solid #d9dbdb", padding: "9px 16px", borderRadius: "6px", fontFamily: "'Barlow', sans-serif", fontSize: "13px", textDecoration: "none" }}>
          Clear
        </Link>
      </form>

      {/* Shareable insights — the subscriber-email use case */}
      {tradeInsights.length > 0 && (
        <div style={{ marginBottom: "28px" }}>
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "16px", letterSpacing: "1px", color: "var(--camo-charcoal)", textTransform: "uppercase", marginBottom: "12px" }}>
            Shareable Insights
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {tradeInsights.map((t) => (
              <div key={t.trade} style={{ background: "#FFFBEB", border: "1px solid #FCD34D", borderRadius: "8px", padding: "14px 16px", fontSize: "13px", color: "#92400E", lineHeight: 1.6 }}>
                <strong>{t.trade}:</strong> the most common reason bids get dismissed in this trade is{" "}
                <strong>{t.label}</strong> ({t.pct}% of {t.total} dismissals with a reason on file).
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overall breakdown */}
      <div>
        <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "16px", letterSpacing: "1px", color: "var(--camo-charcoal)", textTransform: "uppercase", marginBottom: "12px" }}>
          Reason Breakdown {sp.trade || sp.region ? "(filtered)" : ""}
        </h2>
        {breakdown.length === 0 ? (
          <div style={{ background: "var(--camo-concrete)", border: "1px solid #d9dbdb", borderRadius: "10px", padding: "24px", textAlign: "center", color: "var(--camo-gunmetal)", fontSize: "14px" }}>
            No dismissals match these filters.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {breakdown.map((b) => (
              <div key={b.code} style={{ background: "var(--camo-concrete)", border: "1px solid #d9dbdb", borderRadius: "8px", padding: "12px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--camo-charcoal)", marginBottom: "6px" }}>
                  <span style={{ fontWeight: 600 }}>{b.label}</span>
                  <span>{b.count} ({b.pct}%)</span>
                </div>
                <div style={{ background: "#FFFFFF", border: "1px solid #d9dbdb", borderRadius: "4px", height: "8px", overflow: "hidden" }}>
                  <div style={{ width: `${b.pct}%`, height: "100%", background: "var(--camo-accent)" }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
