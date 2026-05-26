import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";

export default async function AdminDisputesPage() {
  await requireRole(["ADMIN"]);

  // Stats
  const [
    { count: totalCount },
    { count: openCount },
    { count: refundCount },
    { count: partialCount },
    { count: deniedCount },
    { count: unassignedCount },
  ] = await Promise.all([
    supabaseAdmin.from("inspector_upgrade_disputes").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("inspector_upgrade_disputes").select("id", { count: "exact", head: true }).in("status", ["SUBMITTED", "UNDER_REVIEW"]),
    supabaseAdmin.from("inspector_upgrade_disputes").select("id", { count: "exact", head: true }).eq("status", "RESOLVED_REFUND"),
    supabaseAdmin.from("inspector_upgrade_disputes").select("id", { count: "exact", head: true }).eq("status", "RESOLVED_PARTIAL_CREDIT"),
    supabaseAdmin.from("inspector_upgrade_disputes").select("id", { count: "exact", head: true }).eq("status", "RESOLVED_DENIED"),
    supabaseAdmin.from("inspector_upgrade_disputes").select("id", { count: "exact", head: true }).in("status", ["SUBMITTED", "UNDER_REVIEW"]).is("master_inspector_id", null),
  ]);

  // Full dispute list (open first, then resolved)
  const { data: disputes } = await supabaseAdmin
    .from("inspector_upgrade_disputes")
    .select("id, status, created_at, assigned_at, master_inspector_id, inspector_request_id, project_id")
    .order("created_at", { ascending: false })
    .limit(100);

  // Enrich with project titles in one query
  const projectIds = [...new Set((disputes ?? []).map((d: any) => d.project_id).filter(Boolean))];
  const { data: projects } = projectIds.length > 0
    ? await supabaseAdmin.from("projects").select("id, title").in("id", projectIds)
    : { data: [] };
  const projectMap: Record<string, string> = {};
  for (const p of projects ?? []) projectMap[(p as any).id] = (p as any).title;

  // MI names
  const miIds = [...new Set((disputes ?? []).map((d: any) => d.master_inspector_id).filter(Boolean))];
  const { data: miProfiles } = miIds.length > 0
    ? await supabaseAdmin.from("profiles").select("id, full_name").in("id", miIds)
    : { data: [] };
  const miMap: Record<string, string> = {};
  for (const p of miProfiles ?? []) miMap[(p as any).id] = (p as any).full_name ?? "—";

  const statusColor: Record<string, { bg: string; text: string }> = {
    SUBMITTED: { bg: "#FEF3C7", text: "#92400E" },
    UNDER_REVIEW: { bg: "#DBEAFE", text: "#1E40AF" },
    RESOLVED_REFUND: { bg: "#DCFCE7", text: "#166534" },
    RESOLVED_PARTIAL_CREDIT: { bg: "#F0FDF4", text: "#14532D" },
    RESOLVED_DENIED: { bg: "#F5F5F5", text: "#374151" },
    WITHDRAWN: { bg: "#F5F5F5", text: "#6B7280" },
  };

  const statCard = (label: string, value: number, accent?: string) => (
    <div style={{
      background: "#EEF4FF",
      border: `1px solid ${accent ?? "#B8D0E8"}`,
      borderRadius: "10px",
      padding: "16px 20px",
      minWidth: "120px",
    }}>
      <div style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontWeight: 700,
        fontSize: "36px",
        color: accent ?? "#0A1628",
        lineHeight: 1,
      }}>
        {value ?? 0}
      </div>
      <div style={{ fontSize: "11px", color: "#4A7FB5", textTransform: "uppercase", letterSpacing: "1px", marginTop: "4px" }}>
        {label}
      </div>
    </div>
  );

  const tableHeaderStyle: React.CSSProperties = {
    fontFamily: "'Barlow', sans-serif",
    fontWeight: 600,
    fontSize: "11px",
    color: "#4A7FB5",
    textTransform: "uppercase",
    letterSpacing: "1px",
    padding: "8px 12px",
    textAlign: "left",
    borderBottom: "1px solid #B8D0E8",
  };

  const cellStyle: React.CSSProperties = {
    padding: "11px 12px",
    fontSize: "13px",
    color: "#0A1628",
    borderBottom: "1px solid #EEF4FF",
    verticalAlign: "middle",
  };

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: "32px",
          color: "#0A1628",
          margin: 0,
        }}>
          Dispute Oversight
        </h1>
        <p style={{ fontSize: "13px", color: "#1B4F8A", marginTop: "6px" }}>
          All inspector upgrade disputes. Click a row to open the full review page.
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "28px" }}>
        {statCard("Total", totalCount ?? 0)}
        {statCard("Open", openCount ?? 0, (openCount ?? 0) > 0 ? "#C8102E" : undefined)}
        {statCard("Unassigned", unassignedCount ?? 0, (unassignedCount ?? 0) > 0 ? "#C8102E" : undefined)}
        {statCard("Refunded", refundCount ?? 0)}
        {statCard("Partial Credit", partialCount ?? 0)}
        {statCard("Denied", deniedCount ?? 0)}
      </div>

      {/* Disputes table */}
      <div style={{ background: "#EEF4FF", border: "1px solid #B8D0E8", borderRadius: "12px", overflow: "hidden" }}>
        {(disputes ?? []).length === 0 ? (
          <p style={{ padding: "24px", fontSize: "13px", color: "#4A7FB5", margin: 0 }}>
            No disputes found.
          </p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F0F6FF" }}>
                <th style={tableHeaderStyle}>Project</th>
                <th style={tableHeaderStyle}>Status</th>
                <th style={tableHeaderStyle}>Assigned To</th>
                <th style={tableHeaderStyle}>Assigned</th>
                <th style={tableHeaderStyle}>Created</th>
                <th style={tableHeaderStyle}>Review</th>
              </tr>
            </thead>
            <tbody>
              {(disputes ?? []).map((d: any) => {
                const colors = statusColor[d.status] ?? { bg: "#F5F5F5", text: "#374151" };
                const projectTitle = projectMap[d.project_id] ?? "—";
                const miName = d.master_inspector_id ? (miMap[d.master_inspector_id] ?? "—") : "Unassigned";
                const createdDate = new Date(d.created_at).toLocaleDateString();
                const assignedDate = d.assigned_at
                  ? new Date(d.assigned_at).toLocaleDateString()
                  : "—";

                return (
                  <tr key={d.id} style={{ background: "#fff" }}>
                    <td style={cellStyle}>
                      <div style={{ fontWeight: 600 }}>{projectTitle}</div>
                      <div style={{ fontSize: "10px", color: "#4A7FB5", fontFamily: "monospace" }}>
                        {d.id.slice(0, 8)}…
                      </div>
                    </td>
                    <td style={cellStyle}>
                      <span style={{
                        background: colors.bg,
                        color: colors.text,
                        padding: "2px 10px",
                        borderRadius: "12px",
                        fontSize: "11px",
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                      }}>
                        {d.status.replace("RESOLVED_", "").replace("_", " ")}
                      </span>
                    </td>
                    <td style={{ ...cellStyle, color: d.master_inspector_id ? "#0A1628" : "#9CA3AF", fontStyle: d.master_inspector_id ? "normal" : "italic" }}>
                      {miName}
                    </td>
                    <td style={cellStyle}>{assignedDate}</td>
                    <td style={cellStyle}>{createdDate}</td>
                    <td style={cellStyle}>
                      <Link
                        href={`/dashboard/inspector/disputes/${d.id}`}
                        style={{
                          background: "#1B4F8A",
                          color: "#fff",
                          padding: "5px 12px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: 600,
                          textDecoration: "none",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Open →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
