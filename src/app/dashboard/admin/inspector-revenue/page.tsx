import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";

function fmt(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0 })}`;
}

function monthLabel(yyyymm: string) {
  const [y, m] = yyyymm.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

export default async function AdminInspectorRevenuePage() {
  await requireRole(["ADMIN"]);

  // All paid assignments
  const { data: assignments } = await supabaseAdmin
    .from("project_inspector_assignments")
    .select(
      "id, project_id, inspector_id, pricing_key, fee_charged_cents, inspector_share_cents, onp_share_cents, request_status, requested_at, takeoff_completed_at"
    )
    .eq("payment_status", "PAID")
    .order("requested_at", { ascending: false });

  const rows = assignments ?? [];

  // Fetch project details
  const projectIds = [...new Set(rows.map((r: any) => r.project_id).filter(Boolean))];
  const { data: projects } = await supabaseAdmin
    .from("projects")
    .select("id, title, category, city")
    .in("id", projectIds.length > 0 ? projectIds : ["none"]);
  const projectMap = new Map((projects ?? []).map((p: any) => [p.id, p]));

  // Fetch inspector profiles
  const inspectorIds = [...new Set(rows.map((r: any) => r.inspector_id).filter(Boolean))];
  const { data: inspectorProfiles } = await supabaseAdmin
    .from("profiles")
    .select("id, display_name")
    .in("id", inspectorIds.length > 0 ? inspectorIds : ["none"]);
  const inspectorMap = new Map(
    (inspectorProfiles ?? []).map((p: any) => [p.id, p.display_name as string])
  );

  // ── All-time totals ──────────────────────────────────────────────────────
  const totalFees    = rows.reduce((s: number, r: any) => s + (r.fee_charged_cents ?? 0), 0);
  const totalInspPay = rows.reduce((s: number, r: any) => s + (r.inspector_share_cents ?? 0), 0);
  const totalOnp     = rows.reduce((s: number, r: any) => s + (r.onp_share_cents ?? 0), 0);
  const totalCount   = rows.length;
  const completedCount = rows.filter((r: any) => r.request_status === "COMPLETED").length;

  // ── Monthly breakdown ────────────────────────────────────────────────────
  type MonthBucket = {
    count: number;
    fees: number;
    inspPay: number;
    onp: number;
    completed: number;
  };
  const monthMap = new Map<string, MonthBucket>();

  for (const r of rows as any[]) {
    if (!r.requested_at) continue;
    const d = new Date(r.requested_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const bucket = monthMap.get(key) ?? { count: 0, fees: 0, inspPay: 0, onp: 0, completed: 0 };
    bucket.count++;
    bucket.fees    += r.fee_charged_cents   ?? 0;
    bucket.inspPay += r.inspector_share_cents ?? 0;
    bucket.onp     += r.onp_share_cents      ?? 0;
    if (r.request_status === "COMPLETED") bucket.completed++;
    monthMap.set(key, bucket);
  }

  const months = [...monthMap.entries()].sort((a, b) => b[0].localeCompare(a[0]));

  // ── Per-inspector breakdown ───────────────────────────────────────────────
  type InspBucket = {
    assigned: number;
    completed: number;
    earnings: number;
    fees: number;
  };
  const inspMap = new Map<string, InspBucket>();

  for (const r of rows as any[]) {
    if (!r.inspector_id) continue;
    const bucket = inspMap.get(r.inspector_id) ?? {
      assigned: 0,
      completed: 0,
      earnings: 0,
      fees: 0,
    };
    bucket.assigned++;
    bucket.earnings += r.inspector_share_cents ?? 0;
    bucket.fees     += r.fee_charged_cents      ?? 0;
    if (r.request_status === "COMPLETED") bucket.completed++;
    inspMap.set(r.inspector_id, bucket);
  }

  const inspRows = [...inspMap.entries()].sort(
    (a, b) => b[1].earnings - a[1].earnings
  );

  // Assignments with no inspector yet (unassigned)
  const unassignedRows = rows.filter((r: any) => !r.inspector_id);

  return (
    <div>
      {/* Header */}
      <div
        className="mob-col mob-gap-sm"
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "28px",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <div>
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
            Inspector Revenue
          </h1>
          <p style={{ fontSize: "13px", color: "var(--camo-gunmetal)", marginTop: "4px" }}>
            All-time · {totalCount} paid inspection{totalCount !== 1 ? "s" : ""} ·{" "}
            {completedCount} completed
          </p>
        </div>
        <div className="mob-wrap" style={{ display: "flex", gap: "8px" }}>
          <Link
            href="/dashboard/admin/inspector-requests"
            style={{
              background: "transparent",
              color: "var(--camo-gunmetal)",
              border: "1px solid #d9dbdb",
              padding: "8px 16px",
              borderRadius: "6px",
              fontFamily: "'Barlow', sans-serif",
              fontSize: "13px",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            ← Requests
          </Link>
          <Link
            href="/dashboard/admin"
            style={{
              background: "transparent",
              color: "var(--camo-gunmetal)",
              border: "1px solid #d9dbdb",
              padding: "8px 16px",
              borderRadius: "6px",
              fontFamily: "'Barlow', sans-serif",
              fontSize: "13px",
              textDecoration: "none",
            }}
          >
            Admin Home
          </Link>
        </div>
      </div>

      {/* All-time summary cards */}
      <div
        className="mob-grid-2"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "12px",
          marginBottom: "32px",
        }}
      >
        {[
          { label: "Total Collected",    value: fmt(totalFees),    sub: "from clients",         accent: "var(--camo-charcoal)" },
          { label: "Inspector Payouts",  value: fmt(totalInspPay), sub: "65% avg",              accent: "#15803D" },
          { label: "ONP Revenue",        value: fmt(totalOnp),     sub: "35% avg",              accent: "var(--camo-gunmetal)" },
          { label: "Inspections",        value: String(totalCount), sub: `${completedCount} completed`, accent: "var(--camo-charcoal)" },
        ].map((card) => (
          <div
            key={card.label}
            style={{
              background: "var(--camo-concrete)",
              border: "1px solid #d9dbdb",
              borderRadius: "10px",
              padding: "16px 20px",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                color: "var(--camo-gunmetal)",
                textTransform: "uppercase",
                letterSpacing: "1px",
                marginBottom: "4px",
              }}
            >
              {card.label}
            </div>
            <div
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: "28px",
                color: card.accent,
              }}
            >
              {card.value}
            </div>
            <div style={{ fontSize: "11px", color: "var(--camo-gunmetal)", marginTop: "2px" }}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Monthly breakdown */}
      <div style={{ marginBottom: "36px" }}>
        <h2
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "20px",
            letterSpacing: "1px",
            color: "var(--camo-charcoal)",
            textTransform: "uppercase",
            marginBottom: "14px",
          }}
        >
          By Month
        </h2>
        {months.length === 0 ? (
          <div
            style={{
              background: "var(--camo-concrete)",
              border: "1px solid #d9dbdb",
              borderRadius: "10px",
              padding: "24px",
              textAlign: "center",
              color: "var(--camo-gunmetal)",
              fontSize: "14px",
            }}
          >
            No paid inspections yet.
          </div>
        ) : (
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #d9dbdb",
              borderRadius: "12px",
              overflow: "hidden",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "var(--camo-charcoal)", color: "#fff", textAlign: "left" }}>
                  {["Month", "Inspections", "Completed", "Fees Collected", "Inspector Payouts", "ONP Retained"].map(
                    (h) => (
                      <th
                        key={h}
                        style={{
                          padding: "10px 16px",
                          fontFamily: "'Barlow Condensed', sans-serif",
                          fontWeight: 700,
                          fontSize: "12px",
                          letterSpacing: "0.5px",
                          textTransform: "uppercase",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {months.map(([key, b], i) => (
                  <tr
                    key={key}
                    style={{
                      background: i % 2 === 0 ? "var(--camo-concrete)" : "#FFFFFF",
                      borderBottom: "1px solid #d9dbdb",
                    }}
                  >
                    <td style={{ padding: "11px 16px", fontWeight: 600, color: "var(--camo-charcoal)", whiteSpace: "nowrap" }}>
                      {monthLabel(key)}
                    </td>
                    <td style={{ padding: "11px 16px", color: "var(--camo-charcoal)" }}>{b.count}</td>
                    <td style={{ padding: "11px 16px", color: "#15803D" }}>{b.completed}</td>
                    <td style={{ padding: "11px 16px", fontWeight: 700, color: "var(--camo-charcoal)" }}>
                      {fmt(b.fees)}
                    </td>
                    <td style={{ padding: "11px 16px", color: "#15803D" }}>{fmt(b.inspPay)}</td>
                    <td style={{ padding: "11px 16px", color: "var(--camo-gunmetal)", fontWeight: 600 }}>
                      {fmt(b.onp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Per-inspector breakdown */}
      <div style={{ marginBottom: "36px" }}>
        <h2
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "20px",
            letterSpacing: "1px",
            color: "var(--camo-charcoal)",
            textTransform: "uppercase",
            marginBottom: "14px",
          }}
        >
          Per Inspector
        </h2>
        {inspRows.length === 0 ? (
          <div
            style={{
              background: "var(--camo-concrete)",
              border: "1px solid #d9dbdb",
              borderRadius: "10px",
              padding: "24px",
              textAlign: "center",
              color: "var(--camo-gunmetal)",
              fontSize: "14px",
            }}
          >
            No inspectors assigned yet.
          </div>
        ) : (
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #d9dbdb",
              borderRadius: "12px",
              overflow: "hidden",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "var(--camo-charcoal)", color: "#fff", textAlign: "left" }}>
                  {["Inspector", "Assigned", "Completed", "Completion Rate", "Total Earnings", "Avg Earning / Job"].map(
                    (h) => (
                      <th
                        key={h}
                        style={{
                          padding: "10px 16px",
                          fontFamily: "'Barlow Condensed', sans-serif",
                          fontWeight: 700,
                          fontSize: "12px",
                          letterSpacing: "0.5px",
                          textTransform: "uppercase",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {inspRows.map(([inspId, b], i) => {
                  const name = inspectorMap.get(inspId) ?? "Unknown Inspector";
                  const completionRate =
                    b.assigned > 0 ? Math.round((b.completed / b.assigned) * 100) : 0;
                  const avgEarning =
                    b.assigned > 0 ? Math.round(b.earnings / b.assigned) : 0;
                  return (
                    <tr
                      key={inspId}
                      style={{
                        background: i % 2 === 0 ? "var(--camo-concrete)" : "#FFFFFF",
                        borderBottom: "1px solid #d9dbdb",
                      }}
                    >
                      <td style={{ padding: "11px 16px", fontWeight: 600, color: "var(--camo-charcoal)" }}>
                        {name}
                      </td>
                      <td style={{ padding: "11px 16px", color: "var(--camo-charcoal)" }}>{b.assigned}</td>
                      <td style={{ padding: "11px 16px", color: "#15803D" }}>{b.completed}</td>
                      <td style={{ padding: "11px 16px" }}>
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: 600,
                            padding: "3px 8px",
                            borderRadius: "20px",
                            background:
                              completionRate >= 80
                                ? "#F0FDF4"
                                : completionRate >= 50
                                ? "#FFFBEB"
                                : "#FEF2F2",
                            color:
                              completionRate >= 80
                                ? "#15803D"
                                : completionRate >= 50
                                ? "#92400E"
                                : "#991B1B",
                          }}
                        >
                          {completionRate}%
                        </span>
                      </td>
                      <td style={{ padding: "11px 16px", fontWeight: 700, color: "#15803D" }}>
                        {fmt(b.earnings)}
                      </td>
                      <td style={{ padding: "11px 16px", color: "var(--camo-gunmetal)" }}>
                        {fmt(avgEarning)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Full request log */}
      <div>
        <h2
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "20px",
            letterSpacing: "1px",
            color: "var(--camo-charcoal)",
            textTransform: "uppercase",
            marginBottom: "14px",
          }}
        >
          All Paid Requests
        </h2>
        {rows.length === 0 ? (
          <div
            style={{
              background: "var(--camo-concrete)",
              border: "1px solid #d9dbdb",
              borderRadius: "10px",
              padding: "24px",
              textAlign: "center",
              color: "var(--camo-gunmetal)",
              fontSize: "14px",
            }}
          >
            No paid requests yet.
          </div>
        ) : (
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #d9dbdb",
              borderRadius: "12px",
              overflow: "auto",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "13px",
                minWidth: "760px",
              }}
            >
              <thead>
                <tr style={{ background: "var(--camo-charcoal)", color: "#fff", textAlign: "left" }}>
                  {["Project", "Type", "Fee", "Insp. Pay", "ONP", "Inspector", "Status", "Date"].map(
                    (h) => (
                      <th
                        key={h}
                        style={{
                          padding: "10px 14px",
                          fontFamily: "'Barlow Condensed', sans-serif",
                          fontWeight: 700,
                          fontSize: "12px",
                          letterSpacing: "0.5px",
                          textTransform: "uppercase",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((r: any, i: number) => {
                  const p = projectMap.get(r.project_id) as any;
                  const statusColors: Record<string, { bg: string; color: string; border: string }> = {
                    PENDING:   { bg: "#FFFBEB", color: "#92400E",  border: "#FCD34D" },
                    ASSIGNED:  { bg: "var(--camo-concrete)", color: "var(--camo-gunmetal)",  border: "#d9dbdb" },
                    COMPLETED: { bg: "#F0FDF4", color: "#15803D",  border: "#BBF7D0" },
                  };
                  const sc = statusColors[r.request_status] ?? statusColors.PENDING;
                  return (
                    <tr
                      key={r.id}
                      style={{
                        background: i % 2 === 0 ? "var(--camo-concrete)" : "#FFFFFF",
                        borderBottom: "1px solid #d9dbdb",
                      }}
                    >
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ fontWeight: 600, color: "var(--camo-charcoal)" }}>
                          {p?.title ?? "—"}
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--camo-gunmetal)" }}>
                          {p?.category?.replaceAll("_", " ") ?? "—"} · {p?.city ?? "—"}
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "10px 14px",
                          fontSize: "11px",
                          color: "var(--camo-gunmetal)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {r.pricing_key?.replaceAll("_", " ") ?? "—"}
                      </td>
                      <td style={{ padding: "10px 14px", fontWeight: 700, color: "var(--camo-charcoal)", whiteSpace: "nowrap" }}>
                        {fmt(r.fee_charged_cents ?? 0)}
                      </td>
                      <td style={{ padding: "10px 14px", color: "#15803D", whiteSpace: "nowrap" }}>
                        {fmt(r.inspector_share_cents ?? 0)}
                      </td>
                      <td style={{ padding: "10px 14px", color: "var(--camo-gunmetal)", whiteSpace: "nowrap" }}>
                        {fmt(r.onp_share_cents ?? 0)}
                      </td>
                      <td style={{ padding: "10px 14px", color: "var(--camo-charcoal)", whiteSpace: "nowrap" }}>
                        {r.inspector_id
                          ? inspectorMap.get(r.inspector_id) ?? "—"
                          : <em style={{ color: "#9CA3AF" }}>Unassigned</em>}
                      </td>
                      <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 600,
                            padding: "3px 8px",
                            borderRadius: "20px",
                            background: sc.bg,
                            color: sc.color,
                            border: `1px solid ${sc.border}`,
                          }}
                        >
                          {r.request_status}
                        </span>
                      </td>
                      <td style={{ padding: "10px 14px", fontSize: "12px", color: "var(--camo-gunmetal)", whiteSpace: "nowrap" }}>
                        {r.requested_at
                          ? new Date(r.requested_at).toLocaleDateString()
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
