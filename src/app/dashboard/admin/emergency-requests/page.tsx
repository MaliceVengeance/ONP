import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { grantEmergencySlot, unsuspendClient } from "./actions";

type LogRow = {
  id: string;
  client_id: string;
  project_id: string | null;
  payment_status: string;
  charged_amount_cents: number;
  counts_against_limit: boolean;
  admin_granted: boolean;
  created_at: string;
  closed_at: string | null;
  close_reason: string | null;
  stripe_payment_intent_id: string | null;
};

type ClientSummary = {
  clientId: string;
  email: string;
  suspended: boolean;
  suspendedReason: string | null;
  rows: LogRow[];
  unusedBonusSlots: number;
};

function statusColor(status: string) {
  switch (status) {
    case "PAID": return { bg: "#F0FDF4", color: "#15803D", border: "#166534" };
    case "PENDING": return { bg: "#FFFBEB", color: "#92400E", border: "#FCD34D" };
    case "DISPUTED": return { bg: "#FEF2F2", color: "#991B1B", border: "#FCA5A5" };
    case "FAILED": return { bg: "var(--camo-paper)", color: "var(--camo-gunmetal)", border: "#d9dbdb" };
    default: return { bg: "var(--camo-concrete)", color: "var(--camo-gunmetal)", border: "#d9dbdb" };
  }
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

export default async function AdminEmergencyRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  await requireRole(["ADMIN"]);
  const sp = await searchParams;
  const filter = sp.filter ?? "all";

  // Fetch all log rows, ordered newest first
  const { data: logs, error: logsErr } = await supabaseAdmin
    .from("emergency_request_log")
    .select("*")
    .order("created_at", { ascending: false });

  if (logsErr) throw new Error(`Failed to fetch logs: ${JSON.stringify(logsErr)}`);

  const allLogs = (logs ?? []) as LogRow[];

  // Get unique client IDs
  const clientIds = [...new Set(allLogs.map((r) => r.client_id))];

  // Fetch profile info for all clients
  const profileMap = new Map<string, { email: string; suspended: boolean; suspended_reason: string | null }>();
  if (clientIds.length > 0) {
    // Get emails from auth
    for (const cId of clientIds) {
      try {
        const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(cId);
        const { data: profileRow } = await supabaseAdmin
          .from("profiles")
          .select("suspended, suspended_reason")
          .eq("id", cId)
          .maybeSingle();
        profileMap.set(cId, {
          email: authUser?.user?.email ?? cId,
          suspended: !!(profileRow as any)?.suspended,
          suspended_reason: (profileRow as any)?.suspended_reason ?? null,
        });
      } catch {
        profileMap.set(cId, { email: cId, suspended: false, suspended_reason: null });
      }
    }
  }

  // Build per-client summaries
  const summaryMap = new Map<string, ClientSummary>();
  for (const row of allLogs) {
    if (!summaryMap.has(row.client_id)) {
      const profile = profileMap.get(row.client_id) ?? { email: row.client_id, suspended: false, suspended_reason: null };
      summaryMap.set(row.client_id, {
        clientId: row.client_id,
        email: profile.email,
        suspended: profile.suspended,
        suspendedReason: profile.suspended_reason,
        rows: [],
        unusedBonusSlots: 0,
      });
    }
    const summary = summaryMap.get(row.client_id)!;
    summary.rows.push(row);
    if (row.admin_granted && !row.project_id) {
      summary.unusedBonusSlots += 1;
    }
  }

  // Filter
  let summaries = [...summaryMap.values()];
  if (filter === "suspended") summaries = summaries.filter((s) => s.suspended);
  if (filter === "disputed") summaries = summaries.filter((s) => s.rows.some((r) => r.payment_status === "DISPUTED"));
  if (filter === "active") summaries = summaries.filter((s) =>
    s.rows.some((r) => r.payment_status === "PAID" && !r.closed_at)
  );

  const totalActive = allLogs.filter((r) => r.payment_status === "PAID" && !r.closed_at).length;
  const totalDisputed = allLogs.filter((r) => r.payment_status === "DISPUTED").length;
  const totalSuspended = [...summaryMap.values()].filter((s) => s.suspended).length;

  return (
    <div style={{ maxWidth: "900px" }}>
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
            Emergency Requests
          </h1>
          <p style={{ fontSize: "13px", color: "var(--camo-gunmetal)", marginTop: "4px" }}>
            {allLogs.length} total log rows · {totalActive} active · {totalDisputed} disputed · {totalSuspended} suspended clients
          </p>
        </div>
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
          ← Admin
        </Link>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
        {[
          { label: "All Clients", value: "all" },
          { label: `Active (${totalActive})`, value: "active" },
          { label: `Disputed (${totalDisputed})`, value: "disputed" },
          { label: `Suspended (${totalSuspended})`, value: "suspended" },
        ].map((tab) => (
          <Link
            key={tab.value}
            href={`/dashboard/admin/emergency-requests?filter=${tab.value}`}
            style={{
              background: filter === tab.value ? "var(--camo-gunmetal)" : "transparent",
              color: filter === tab.value ? "#FFFFFF" : "var(--camo-gunmetal)",
              border: "1px solid var(--camo-gunmetal)",
              padding: "8px 16px",
              borderRadius: "6px",
              fontFamily: "'Barlow', sans-serif",
              fontSize: "13px",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {summaries.length === 0 ? (
        <div style={{
          background: "var(--camo-concrete)",
          border: "1px solid #d9dbdb",
          borderRadius: "10px",
          padding: "32px",
          textAlign: "center",
          color: "var(--camo-gunmetal)",
          fontSize: "14px",
        }}>
          No emergency requests match this filter.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {summaries.map((s) => {
            const recentRows = s.rows.slice(0, 10);
            const windowStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
            const used = s.rows.filter((r) =>
              r.counts_against_limit &&
              r.payment_status !== "FAILED" &&
              r.created_at >= windowStart
            ).length;

            return (
              <div key={s.clientId} style={{
                background: s.suspended ? "#1A0000" : "var(--camo-concrete)",
                border: `1px solid ${s.suspended ? "#C2410C" : "#d9dbdb"}`,
                borderRadius: "12px",
                padding: "20px",
              }}>
                {/* Client header */}
                <div className="mob-col mob-gap-sm" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", marginBottom: "16px" }}>
                  <div>
                    <div style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: 700,
                      fontSize: "18px",
                      color: s.suspended ? "#FDBA74" : "var(--camo-charcoal)",
                      marginBottom: "4px",
                    }}>
                      {s.email}
                    </div>
                    <div style={{ fontSize: "12px", color: s.suspended ? "#FED7AA" : "var(--camo-gunmetal)" }}>
                      {used} of 2{s.unusedBonusSlots > 0 ? ` (+${s.unusedBonusSlots} bonus)` : ""} used in rolling 30 days
                      {s.suspended && (
                        <span style={{ marginLeft: "10px", color: "#FCA5A5", fontWeight: 600 }}>
                          ⚠ ACCOUNT SUSPENDED{s.suspendedReason ? ` — ${s.suspendedReason}` : ""}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Admin actions */}
                  <div style={{ display: "flex", gap: "8px", flexShrink: 0, flexWrap: "wrap" }}>
                    <form action={grantEmergencySlot.bind(null, s.clientId)}>
                      <button
                        type="submit"
                        style={{
                          background: "var(--camo-gunmetal)",
                          color: "#FFFFFF",
                          border: "none",
                          padding: "8px 14px",
                          borderRadius: "6px",
                          fontFamily: "'Barlow', sans-serif",
                          fontWeight: 600,
                          fontSize: "12px",
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        + Grant Slot
                      </button>
                    </form>
                    {s.suspended && (
                      <form action={unsuspendClient.bind(null, s.clientId)}>
                        <button
                          type="submit"
                          style={{
                            background: "#C2410C",
                            color: "#FFFFFF",
                            border: "none",
                            padding: "8px 14px",
                            borderRadius: "6px",
                            fontFamily: "'Barlow', sans-serif",
                            fontWeight: 600,
                            fontSize: "12px",
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Unsuspend
                        </button>
                      </form>
                    )}
                  </div>
                </div>

                {/* Log rows table */}
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                    <thead>
                      <tr>
                        {["Created", "Status", "Project", "Close Reason", "Counts?", "Admin?", "PI ID"].map((h) => (
                          <th key={h} style={{
                            textAlign: "left",
                            padding: "6px 10px",
                            fontSize: "10px",
                            fontWeight: 600,
                            color: "var(--camo-gunmetal)",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            borderBottom: "1px solid #d9dbdb",
                          }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {recentRows.map((row) => {
                        const sc = statusColor(row.payment_status);
                        return (
                          <tr key={row.id}>
                            <td style={{ padding: "8px 10px", color: "var(--camo-charcoal)", borderBottom: "1px solid var(--camo-concrete)" }}>
                              {fmtDate(row.created_at)}
                            </td>
                            <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--camo-concrete)" }}>
                              <span style={{
                                fontSize: "10px",
                                fontWeight: 600,
                                padding: "2px 8px",
                                borderRadius: "20px",
                                background: sc.bg,
                                color: sc.color,
                                border: `1px solid ${sc.border}`,
                              }}>
                                {row.payment_status}
                              </span>
                            </td>
                            <td style={{ padding: "8px 10px", color: "var(--camo-gunmetal)", borderBottom: "1px solid var(--camo-concrete)" }}>
                              {row.project_id ? (
                                <Link
                                  href={`/dashboard/admin/projects/${row.project_id}`}
                                  style={{ color: "var(--camo-gunmetal)", textDecoration: "underline", fontSize: "11px" }}
                                >
                                  View →
                                </Link>
                              ) : "—"}
                            </td>
                            <td style={{ padding: "8px 10px", color: "var(--camo-charcoal)", borderBottom: "1px solid var(--camo-concrete)" }}>
                              {row.close_reason ?? (row.closed_at ? "CLOSED" : row.payment_status === "PAID" ? "ACTIVE" : "—")}
                            </td>
                            <td style={{ padding: "8px 10px", color: row.counts_against_limit ? "var(--camo-charcoal)" : "var(--camo-gunmetal)", borderBottom: "1px solid var(--camo-concrete)" }}>
                              {row.counts_against_limit ? "Yes" : "No"}
                            </td>
                            <td style={{ padding: "8px 10px", color: row.admin_granted ? "var(--camo-gunmetal)" : "var(--camo-gunmetal)", borderBottom: "1px solid var(--camo-concrete)" }}>
                              {row.admin_granted ? "✓" : "—"}
                            </td>
                            <td style={{ padding: "8px 10px", color: "var(--camo-gunmetal)", borderBottom: "1px solid var(--camo-concrete)", fontFamily: "monospace", fontSize: "10px" }}>
                              {row.stripe_payment_intent_id ? row.stripe_payment_intent_id.slice(-8) : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {s.rows.length > 10 && (
                    <div style={{ fontSize: "11px", color: "var(--camo-gunmetal)", padding: "6px 10px" }}>
                      Showing 10 of {s.rows.length} rows
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
