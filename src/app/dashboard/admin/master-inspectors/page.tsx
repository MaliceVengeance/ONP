import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { promoteToMasterInspector, demoteFromMasterInspector } from "./actions";

export default async function MasterInspectorsPage() {
  await requireRole(["ADMIN"]);

  // Load all inspectors with MI info + open dispute counts
  const { data: inspectors } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, email, is_master_inspector, master_inspector_since, upgrade_blocked")
    .eq("role", "INSPECTOR")
    .order("full_name", { ascending: true });

  // Count open disputes per MI
  const { data: openDisputeCounts } = await supabaseAdmin
    .from("inspector_upgrade_disputes")
    .select("master_inspector_id")
    .in("status", ["SUBMITTED", "UNDER_REVIEW"])
    .not("master_inspector_id", "is", null);

  const disputeCountMap: Record<string, number> = {};
  for (const d of openDisputeCounts ?? []) {
    const mid = (d as any).master_inspector_id as string;
    disputeCountMap[mid] = (disputeCountMap[mid] ?? 0) + 1;
  }

  // Count completed reviews per MI
  const { data: reviewCounts } = await supabaseAdmin
    .from("master_inspector_reviews_log")
    .select("master_inspector_id");

  const reviewCountMap: Record<string, number> = {};
  for (const r of reviewCounts ?? []) {
    const mid = (r as any).master_inspector_id as string;
    reviewCountMap[mid] = (reviewCountMap[mid] ?? 0) + 1;
  }

  const masterInspectors = (inspectors ?? []).filter((i: any) => i.is_master_inspector);
  const regularInspectors = (inspectors ?? []).filter((i: any) => !i.is_master_inspector);

  const sectionStyle: React.CSSProperties = {
    background: "#EEF4FF",
    border: "1px solid #B8D0E8",
    borderRadius: "12px",
    padding: "24px",
    marginBottom: "24px",
  };

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
    padding: "12px 12px",
    fontSize: "13px",
    color: "#1E3A8A",
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
          color: "#1E3A8A",
          margin: 0,
        }}>
          Master Inspectors
        </h1>
        <p style={{ fontSize: "13px", color: "#1B4F8A", marginTop: "6px" }}>
          Manage which inspectors can review upgrade disputes. Master Inspectors are
          auto-assigned to disputes and earn a $50 review fee per resolved case.
        </p>
      </div>

      {/* ── Active Master Inspectors ── */}
      <div style={sectionStyle}>
        <h2 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: "20px",
          color: "#1E3A8A",
          margin: "0 0 16px 0",
        }}>
          Active Master Inspectors ({masterInspectors.length})
        </h2>

        {masterInspectors.length === 0 ? (
          <p style={{ fontSize: "13px", color: "#4A7FB5", margin: 0 }}>
            No Master Inspectors have been promoted yet.
          </p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F0F6FF" }}>
                <th style={tableHeaderStyle}>Inspector</th>
                <th style={tableHeaderStyle}>Master Since</th>
                <th style={tableHeaderStyle}>Open Disputes</th>
                <th style={tableHeaderStyle}>Reviews Done</th>
                <th style={tableHeaderStyle}>Status</th>
                <th style={tableHeaderStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {masterInspectors.map((insp: any) => {
                const openCount = disputeCountMap[insp.id] ?? 0;
                const doneCount = reviewCountMap[insp.id] ?? 0;
                return (
                  <tr key={insp.id} style={{ background: "#fff" }}>
                    <td style={cellStyle}>
                      <div style={{ fontWeight: 600 }}>{insp.full_name || "—"}</div>
                      <div style={{ fontSize: "11px", color: "#4A7FB5" }}>{insp.email}</div>
                    </td>
                    <td style={cellStyle}>
                      {insp.master_inspector_since
                        ? new Date(insp.master_inspector_since).toLocaleDateString()
                        : "—"}
                    </td>
                    <td style={cellStyle}>
                      <span style={{
                        background: openCount > 0 ? "#FEF3C7" : "#EEF4FF",
                        color: openCount > 0 ? "#92400E" : "#1B4F8A",
                        padding: "2px 10px",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: 600,
                      }}>
                        {openCount}
                      </span>
                    </td>
                    <td style={cellStyle}>{doneCount}</td>
                    <td style={cellStyle}>
                      {insp.upgrade_blocked ? (
                        <span style={{ background: "#FEE2E2", color: "#991B1B", padding: "2px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: 600 }}>
                          BLOCKED
                        </span>
                      ) : (
                        <span style={{ background: "#DCFCE7", color: "#166534", padding: "2px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: 600 }}>
                          ACTIVE
                        </span>
                      )}
                    </td>
                    <td style={cellStyle}>
                      <details style={{ cursor: "pointer" }}>
                        <summary style={{
                          fontSize: "12px",
                          color: "#C8102E",
                          fontWeight: 600,
                          cursor: "pointer",
                          listStyle: "none",
                        }}>
                          Demote ▾
                        </summary>
                        <form action={demoteFromMasterInspector.bind(null, insp.id)} style={{ marginTop: "8px" }}>
                          <textarea
                            name="reason"
                            placeholder="Reason for demotion (required, min 10 chars)"
                            required
                            minLength={10}
                            rows={2}
                            style={{
                              width: "200px",
                              fontSize: "12px",
                              border: "1px solid #B8D0E8",
                              borderRadius: "6px",
                              padding: "6px 8px",
                              resize: "vertical",
                              display: "block",
                              marginBottom: "6px",
                            }}
                          />
                          <button
                            type="submit"
                            style={{
                              background: "#C8102E",
                              color: "#fff",
                              border: "none",
                              borderRadius: "6px",
                              padding: "5px 12px",
                              fontSize: "12px",
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            Confirm Demotion
                          </button>
                        </form>
                      </details>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Eligible Inspectors (promote) ── */}
      <div style={sectionStyle}>
        <h2 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: "20px",
          color: "#1E3A8A",
          margin: "0 0 8px 0",
        }}>
          Promote an Inspector
        </h2>
        <p style={{ fontSize: "12px", color: "#4A7FB5", marginBottom: "16px", marginTop: 0 }}>
          Before promoting, confirm the inspector has: passed the MI competency review, agreed to the MI terms,
          and completed at least 10 standard inspections on the platform.
        </p>

        {regularInspectors.length === 0 ? (
          <p style={{ fontSize: "13px", color: "#4A7FB5", margin: 0 }}>No additional inspectors found.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F0F6FF" }}>
                <th style={tableHeaderStyle}>Inspector</th>
                <th style={tableHeaderStyle}>Status</th>
                <th style={tableHeaderStyle}>Promote</th>
              </tr>
            </thead>
            <tbody>
              {regularInspectors.map((insp: any) => (
                <tr key={insp.id} style={{ background: "#fff" }}>
                  <td style={cellStyle}>
                    <div style={{ fontWeight: 600 }}>{insp.full_name || "—"}</div>
                    <div style={{ fontSize: "11px", color: "#4A7FB5" }}>{insp.email}</div>
                  </td>
                  <td style={cellStyle}>
                    {insp.upgrade_blocked ? (
                      <span style={{ background: "#FEE2E2", color: "#991B1B", padding: "2px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: 600 }}>
                        BLOCKED
                      </span>
                    ) : (
                      <span style={{ background: "#EEF4FF", color: "#1B4F8A", padding: "2px 10px", borderRadius: "12px", fontSize: "11px" }}>
                        Standard
                      </span>
                    )}
                  </td>
                  <td style={cellStyle}>
                    <form action={promoteToMasterInspector.bind(null, insp.id)}>
                      <button
                        type="submit"
                        style={{
                          background: "#1B4F8A",
                          color: "#fff",
                          border: "none",
                          borderRadius: "6px",
                          padding: "6px 14px",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Promote to MI
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
