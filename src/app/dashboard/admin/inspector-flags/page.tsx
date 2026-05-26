import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { unblockInspector, suspendInspector } from "./actions";

// Thresholds matching get_inspector_flag_status SQL function
const SOFT_ALERT_RATE = 0.05;
const SOFT_ALERT_MIN_FLAGS = 2;
const MANDATORY_RATE = 0.10;
const MANDATORY_MIN_FLAGS = 3;
const SUSPENSION_RATE = 0.15;
const SUSPENSION_MIN_FLAGS = 3;
const VOLUME_FLOOR = 10;

type FlagStatus = "CLEAN" | "SOFT_ALERT" | "MANDATORY_REVIEW" | "SUSPENSION_RECOMMENDED";

function computeFlagStatus(flagCount: number, inspectionCount: number): FlagStatus {
  if (inspectionCount < VOLUME_FLOOR) return "CLEAN";
  const rate = inspectionCount === 0 ? 0 : flagCount / inspectionCount;
  if (rate >= SUSPENSION_RATE && flagCount >= SUSPENSION_MIN_FLAGS) return "SUSPENSION_RECOMMENDED";
  if (rate >= MANDATORY_RATE && flagCount >= MANDATORY_MIN_FLAGS) return "MANDATORY_REVIEW";
  if (rate >= SOFT_ALERT_RATE && flagCount >= SOFT_ALERT_MIN_FLAGS) return "SOFT_ALERT";
  return "CLEAN";
}

const statusStyles: Record<FlagStatus, { bg: string; text: string; label: string }> = {
  CLEAN: { bg: "#DCFCE7", text: "#166534", label: "Clean" },
  SOFT_ALERT: { bg: "#FEF3C7", text: "#92400E", label: "Soft Alert" },
  MANDATORY_REVIEW: { bg: "#FED7AA", text: "#9A3412", label: "Mandatory Review" },
  SUSPENSION_RECOMMENDED: { bg: "#FEE2E2", text: "#991B1B", label: "Suspend Recommended" },
};

export default async function InspectorFlagsPage() {
  await requireRole(["ADMIN"]);

  // Bulk fetch inspectors
  const { data: inspectors } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, email, upgrade_blocked")
    .eq("role", "INSPECTOR")
    .order("full_name", { ascending: true });

  const inspectorIds = (inspectors ?? []).map((i: any) => i.id);

  // Bulk fetch flag counts
  const { data: flagRows } = inspectorIds.length > 0
    ? await supabaseAdmin
        .from("inspector_flags")
        .select("inspector_id")
        .in("inspector_id", inspectorIds)
    : { data: [] };

  const flagCountMap: Record<string, number> = {};
  for (const f of flagRows ?? []) {
    const id = (f as any).inspector_id as string;
    flagCountMap[id] = (flagCountMap[id] ?? 0) + 1;
  }

  // Bulk fetch completed inspection counts
  const { data: assignmentRows } = inspectorIds.length > 0
    ? await supabaseAdmin
        .from("project_inspector_assignments")
        .select("inspector_id")
        .in("inspector_id", inspectorIds)
        .eq("request_status", "COMPLETED")
    : { data: [] };

  const inspectionCountMap: Record<string, number> = {};
  for (const a of assignmentRows ?? []) {
    const id = (a as any).inspector_id as string;
    inspectionCountMap[id] = (inspectionCountMap[id] ?? 0) + 1;
  }

  // Compute status for each inspector
  const enriched = (inspectors ?? []).map((insp: any) => {
    const flags = flagCountMap[insp.id] ?? 0;
    const inspections = inspectionCountMap[insp.id] ?? 0;
    const flagStatus = computeFlagStatus(flags, inspections);
    return { ...insp, flags, inspections, flagStatus };
  });

  // Sort: worst status first
  const statusOrder: Record<FlagStatus, number> = {
    SUSPENSION_RECOMMENDED: 0,
    MANDATORY_REVIEW: 1,
    SOFT_ALERT: 2,
    CLEAN: 3,
  };
  enriched.sort((a: any, b: any) => statusOrder[a.flagStatus as FlagStatus] - statusOrder[b.flagStatus as FlagStatus]);

  const alertCount = enriched.filter((i: any) => i.flagStatus !== "CLEAN").length;

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
          Inspector Flag Dashboard
        </h1>
        <p style={{ fontSize: "13px", color: "#1B4F8A", marginTop: "6px" }}>
          Computed in real-time from dispute outcomes. Flags trigger at ≥5% rate (soft), ≥10% (mandatory review),
          ≥15% (suspension recommended). Minimum 10 inspections required.
        </p>
      </div>

      {alertCount > 0 && (
        <div style={{
          background: "#FEE2E2",
          border: "1px solid #F87171",
          borderRadius: "10px",
          padding: "12px 16px",
          marginBottom: "20px",
          fontSize: "13px",
          color: "#991B1B",
          fontWeight: 600,
        }}>
          ⚠️ {alertCount} inspector{alertCount !== 1 ? "s" : ""} require{alertCount === 1 ? "s" : ""} attention.
        </div>
      )}

      <div style={{ background: "#EEF4FF", border: "1px solid #B8D0E8", borderRadius: "12px", overflow: "hidden" }}>
        {enriched.length === 0 ? (
          <p style={{ padding: "24px", fontSize: "13px", color: "#4A7FB5", margin: 0 }}>No inspectors found.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F0F6FF" }}>
                <th style={tableHeaderStyle}>Inspector</th>
                <th style={tableHeaderStyle}>Flag Status</th>
                <th style={tableHeaderStyle}>Flags / Inspections</th>
                <th style={tableHeaderStyle}>Rate</th>
                <th style={tableHeaderStyle}>Account</th>
                <th style={tableHeaderStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {enriched.map((insp: any) => {
                const style = statusStyles[insp.flagStatus as FlagStatus];
                const rate = insp.inspections > 0
                  ? ((insp.flags / insp.inspections) * 100).toFixed(1) + "%"
                  : "—";
                return (
                  <tr key={insp.id} style={{ background: "#fff" }}>
                    <td style={cellStyle}>
                      <div style={{ fontWeight: 600 }}>{insp.full_name || "—"}</div>
                      <div style={{ fontSize: "11px", color: "#4A7FB5" }}>{insp.email}</div>
                    </td>
                    <td style={cellStyle}>
                      <span style={{
                        background: style.bg,
                        color: style.text,
                        padding: "2px 10px",
                        borderRadius: "12px",
                        fontSize: "11px",
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                      }}>
                        {style.label}
                      </span>
                    </td>
                    <td style={cellStyle}>
                      <span style={{ fontWeight: 600, color: insp.flags > 0 ? "#C8102E" : "#0A1628" }}>
                        {insp.flags}
                      </span>
                      <span style={{ color: "#4A7FB5" }}> / {insp.inspections}</span>
                    </td>
                    <td style={cellStyle}>{rate}</td>
                    <td style={cellStyle}>
                      {insp.upgrade_blocked ? (
                        <span style={{ background: "#FEE2E2", color: "#991B1B", padding: "2px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: 600 }}>
                          BLOCKED
                        </span>
                      ) : (
                        <span style={{ background: "#DCFCE7", color: "#166534", padding: "2px 10px", borderRadius: "12px", fontSize: "11px" }}>
                          Active
                        </span>
                      )}
                    </td>
                    <td style={cellStyle}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {/* Unblock */}
                        {insp.upgrade_blocked && (
                          <details>
                            <summary style={{ fontSize: "12px", color: "#166534", fontWeight: 600, cursor: "pointer", listStyle: "none" }}>
                              Unblock ▾
                            </summary>
                            <form action={unblockInspector.bind(null, insp.id)} style={{ marginTop: "6px" }}>
                              <textarea
                                name="notes"
                                placeholder="Reason for unblocking (min 10 chars)"
                                required
                                minLength={10}
                                rows={2}
                                style={{ width: "180px", fontSize: "11px", border: "1px solid #B8D0E8", borderRadius: "5px", padding: "5px 7px", resize: "vertical", display: "block", marginBottom: "5px" }}
                              />
                              <button type="submit" style={{ background: "#166534", color: "#fff", border: "none", borderRadius: "5px", padding: "4px 10px", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>
                                Confirm Unblock
                              </button>
                            </form>
                          </details>
                        )}
                        {/* Suspend */}
                        {!insp.upgrade_blocked && (
                          <details>
                            <summary style={{ fontSize: "12px", color: "#C8102E", fontWeight: 600, cursor: "pointer", listStyle: "none" }}>
                              Block ▾
                            </summary>
                            <form action={suspendInspector.bind(null, insp.id)} style={{ marginTop: "6px" }}>
                              <textarea
                                name="notes"
                                placeholder="Reason for blocking (min 10 chars)"
                                required
                                minLength={10}
                                rows={2}
                                style={{ width: "180px", fontSize: "11px", border: "1px solid #B8D0E8", borderRadius: "5px", padding: "5px 7px", resize: "vertical", display: "block", marginBottom: "5px" }}
                              />
                              <button type="submit" style={{ background: "#C8102E", color: "#fff", border: "none", borderRadius: "5px", padding: "4px 10px", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>
                                Confirm Block
                              </button>
                            </form>
                          </details>
                        )}
                      </div>
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
