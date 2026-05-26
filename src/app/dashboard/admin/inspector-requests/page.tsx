import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { assignInspector } from "./actions";

function formatFee(cents: number | null) {
  if (!cents) return null;
  return `$${(cents / 100).toFixed(0)}`;
}

export default async function AdminInspectorRequestsPage() {
  await requireRole(["ADMIN"]);

  // Fetch all assignments with new payment columns
  const { data: requests } = await supabaseAdmin
    .from("project_inspector_assignments")
    .select(
      "id, project_id, client_id, request_status, payment_status, pricing_key, fee_charged_cents, requested_at, assigned_at, inspector_id"
    )
    .order("requested_at", { ascending: true });

  const requestList = requests ?? [];

  // Fetch project details
  const projectIds = [...new Set(requestList.map((r: any) => r.project_id).filter(Boolean))];
  const { data: projects } = await supabaseAdmin
    .from("projects")
    .select("id, title, category, city")
    .in("id", projectIds.length > 0 ? projectIds : ["none"]);
  const projectMap = new Map((projects ?? []).map((p: any) => [p.id, p]));

  // Fetch available inspectors
  const { data: inspectors } = await supabaseAdmin
    .from("profiles")
    .select("id, display_name")
    .eq("role", "INSPECTOR")
    .eq("inspector_active", true);

  // Fetch inspector names for assigned rows
  const assignedInspectorIds = [
    ...new Set(
      requestList
        .filter((r: any) => r.inspector_id)
        .map((r: any) => r.inspector_id)
    ),
  ];
  const { data: inspectorProfiles } = await supabaseAdmin
    .from("profiles")
    .select("id, display_name")
    .in("id", assignedInspectorIds.length > 0 ? assignedInspectorIds : ["none"]);
  const inspectorMap = new Map((inspectorProfiles ?? []).map((p: any) => [p.id, p.display_name]));

  // Paid + unassigned → ready to assign
  const needsAssignment = requestList.filter(
    (r: any) => r.request_status === "PENDING" && r.payment_status === "PAID"
  );
  // Unpaid → waiting on client payment
  const awaitingPayment = requestList.filter(
    (r: any) => r.request_status === "PENDING" && r.payment_status === "PENDING"
  );
  const assigned = requestList.filter((r: any) => r.request_status === "ASSIGNED");
  const completed = requestList.filter((r: any) => r.request_status === "COMPLETED");

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
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
              color: "#0A1628",
              margin: 0,
            }}
          >
            Inspector Requests
          </h1>
          <p style={{ fontSize: "13px", color: "#1B4F8A", marginTop: "4px" }}>
            {needsAssignment.length} needs assignment · {awaitingPayment.length} awaiting payment ·{" "}
            {assigned.length} assigned · {completed.length} completed
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <Link
            href="/dashboard/admin/inspector-revenue"
            style={{
              background: "#1B4F8A",
              color: "#fff",
              border: "none",
              padding: "8px 16px",
              borderRadius: "6px",
              fontFamily: "'Barlow', sans-serif",
              fontSize: "13px",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            Revenue & Stats →
          </Link>
          <Link
            href="/dashboard/admin"
            style={{
              background: "transparent",
              color: "#1B4F8A",
              border: "1px solid #B8D0E8",
              padding: "8px 16px",
              borderRadius: "6px",
              fontFamily: "'Barlow', sans-serif",
              fontSize: "13px",
              textDecoration: "none",
            }}
          >
            ← Back
          </Link>
        </div>
      </div>

      {/* Needs Assignment */}
      <div style={{ marginBottom: "32px" }}>
        <h2
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "18px",
            letterSpacing: "1px",
            color: needsAssignment.length > 0 ? "#92400E" : "#0A1628",
            textTransform: "uppercase",
            marginBottom: "12px",
          }}
        >
          Needs Assignment ({needsAssignment.length})
        </h2>
        {needsAssignment.length === 0 ? (
          <div
            style={{
              background: "#EEF4FF",
              border: "1px solid #B8D0E8",
              borderRadius: "10px",
              padding: "24px",
              textAlign: "center",
              color: "#1B4F8A",
              fontSize: "14px",
            }}
          >
            No paid requests awaiting assignment.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {needsAssignment.map((r: any) => {
              const p = projectMap.get(r.project_id);
              return (
                <div
                  key={r.id}
                  style={{
                    background: "#EEF4FF",
                    border: "1px solid #FCD34D",
                    borderRadius: "10px",
                    padding: "18px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: "16px",
                      marginBottom: "14px",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: "15px",
                          color: "#0A1628",
                          marginBottom: "3px",
                        }}
                      >
                        {(p as any)?.title ?? "Untitled Project"}
                      </div>
                      <div style={{ fontSize: "12px", color: "#1B4F8A", marginBottom: "3px" }}>
                        {(p as any)?.category?.replaceAll("_", " ") ?? "—"} ·{" "}
                        {(p as any)?.city ?? "—"}
                      </div>
                      {r.pricing_key && (
                        <div
                          style={{
                            display: "inline-flex",
                            gap: "6px",
                            alignItems: "center",
                            fontSize: "11px",
                            marginBottom: "3px",
                          }}
                        >
                          <span
                            style={{
                              background: "#EEF4FF",
                              border: "1px solid #B8D0E8",
                              borderRadius: "4px",
                              padding: "2px 7px",
                              color: "#1B4F8A",
                              fontWeight: 600,
                            }}
                          >
                            {r.pricing_key.replaceAll("_", " ")}
                          </span>
                          {r.fee_charged_cents && (
                            <span style={{ color: "#15803D", fontWeight: 700 }}>
                              {formatFee(r.fee_charged_cents)} collected
                            </span>
                          )}
                        </div>
                      )}
                      {r.requested_at && (
                        <div style={{ fontSize: "11px", color: "#4A7FB5" }}>
                          Requested: {new Date(r.requested_at).toLocaleDateString()}
                        </div>
                      )}
                      <Link
                        href={`/dashboard/admin/projects/${r.project_id}`}
                        style={{
                          fontSize: "11px",
                          color: "#4A7FB5",
                          textDecoration: "underline",
                          display: "inline-block",
                          marginTop: "6px",
                        }}
                      >
                        View project →
                      </Link>
                    </div>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        padding: "4px 10px",
                        borderRadius: "20px",
                        background: "#F0FDF4",
                        color: "#15803D",
                        border: "1px solid #BBF7D0",
                        flexShrink: 0,
                        whiteSpace: "nowrap",
                      }}
                    >
                      ✓ PAID
                    </span>
                  </div>

                  <form action={assignInspector.bind(null, r.id)}>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <select
                        name="inspector_id"
                        style={{
                          background: "#FFFFFF",
                          border: "1px solid #B8D0E8",
                          color: "#0A1628",
                          borderRadius: "6px",
                          padding: "8px 12px",
                          fontFamily: "'Barlow', sans-serif",
                          fontSize: "13px",
                          outline: "none",
                          flex: 1,
                        }}
                        required
                      >
                        <option value="">Select inspector…</option>
                        {(inspectors ?? []).map((i: any) => (
                          <option key={i.id} value={i.id}>
                            {i.display_name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        style={{
                          background: "#C8102E",
                          color: "#fff",
                          border: "none",
                          padding: "8px 20px",
                          borderRadius: "6px",
                          fontFamily: "'Barlow', sans-serif",
                          fontWeight: 600,
                          fontSize: "13px",
                          cursor: "pointer",
                          flexShrink: 0,
                        }}
                      >
                        Assign
                      </button>
                    </div>
                  </form>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Awaiting Payment */}
      {awaitingPayment.length > 0 && (
        <div style={{ marginBottom: "32px" }}>
          <hr style={{ border: "none", borderTop: "1px solid #B8D0E8", margin: "0 0 20px" }} />
          <h2
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: "18px",
              letterSpacing: "1px",
              color: "#0A1628",
              textTransform: "uppercase",
              marginBottom: "12px",
            }}
          >
            Awaiting Client Payment ({awaitingPayment.length})
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {awaitingPayment.map((r: any) => {
              const p = projectMap.get(r.project_id);
              return (
                <div
                  key={r.id}
                  style={{
                    background: "#EEF4FF",
                    border: "1px solid #B8D0E8",
                    borderRadius: "10px",
                    padding: "18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    opacity: 0.8,
                  }}
                >
                  <div>
                    <div
                      style={{ fontWeight: 600, fontSize: "15px", color: "#0A1628", marginBottom: "3px" }}
                    >
                      {(p as any)?.title ?? "Untitled"}
                    </div>
                    <div style={{ fontSize: "12px", color: "#1B4F8A" }}>
                      {(p as any)?.category?.replaceAll("_", " ") ?? "—"} · {(p as any)?.city ?? "—"}
                    </div>
                    {r.pricing_key && (
                      <div style={{ fontSize: "11px", color: "#4A7FB5", marginTop: "3px" }}>
                        {r.pricing_key.replaceAll("_", " ")}
                        {r.fee_charged_cents ? ` · ${formatFee(r.fee_charged_cents)}` : ""}
                      </div>
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      padding: "4px 10px",
                      borderRadius: "20px",
                      background: "#FFFBEB",
                      color: "#92400E",
                      border: "1px solid #FCD34D",
                      flexShrink: 0,
                    }}
                  >
                    AWAITING PAYMENT
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Assigned */}
      {assigned.length > 0 && (
        <div style={{ marginBottom: "32px" }}>
          <hr style={{ border: "none", borderTop: "1px solid #B8D0E8", margin: "0 0 20px" }} />
          <h2
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: "18px",
              letterSpacing: "1px",
              color: "#0A1628",
              textTransform: "uppercase",
              marginBottom: "12px",
            }}
          >
            Assigned ({assigned.length})
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {assigned.map((r: any) => {
              const p = projectMap.get(r.project_id);
              return (
                <div
                  key={r.id}
                  style={{
                    background: "#EEF4FF",
                    border: "1px solid #B8D0E8",
                    borderRadius: "10px",
                    padding: "18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div
                      style={{ fontWeight: 600, fontSize: "15px", color: "#0A1628", marginBottom: "3px" }}
                    >
                      {(p as any)?.title ?? "Untitled"}
                    </div>
                    <div style={{ fontSize: "12px", color: "#1B4F8A", marginBottom: "2px" }}>
                      {(p as any)?.category?.replaceAll("_", " ") ?? "—"} · {(p as any)?.city ?? "—"}
                    </div>
                    {r.pricing_key && (
                      <div style={{ fontSize: "11px", color: "#4A7FB5", marginBottom: "2px" }}>
                        {r.pricing_key.replaceAll("_", " ")}
                        {r.fee_charged_cents ? ` · ${formatFee(r.fee_charged_cents)}` : ""}
                      </div>
                    )}
                    {inspectorMap.get(r.inspector_id) && (
                      <div style={{ fontSize: "11px", color: "#1B4F8A" }}>
                        Inspector: {inspectorMap.get(r.inspector_id)}
                      </div>
                    )}
                    {r.assigned_at && (
                      <div style={{ fontSize: "11px", color: "#4A7FB5" }}>
                        Assigned: {new Date(r.assigned_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      padding: "4px 10px",
                      borderRadius: "20px",
                      background: "#EEF4FF",
                      color: "#1B4F8A",
                      border: "1px solid #B8D0E8",
                    }}
                  >
                    ASSIGNED
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <div>
          <hr style={{ border: "none", borderTop: "1px solid #B8D0E8", margin: "0 0 20px" }} />
          <h2
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: "18px",
              letterSpacing: "1px",
              color: "#1B4F8A",
              textTransform: "uppercase",
              marginBottom: "12px",
            }}
          >
            Completed ({completed.length})
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {completed.map((r: any) => {
              const p = projectMap.get(r.project_id);
              return (
                <div
                  key={r.id}
                  style={{
                    background: "#EEF4FF",
                    border: "1px solid #B8D0E8",
                    borderRadius: "10px",
                    padding: "18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    opacity: 0.7,
                  }}
                >
                  <div>
                    <div
                      style={{ fontWeight: 600, fontSize: "15px", color: "#0A1628", marginBottom: "3px" }}
                    >
                      {(p as any)?.title ?? "Untitled"}
                    </div>
                    <div style={{ fontSize: "12px", color: "#1B4F8A", marginBottom: "2px" }}>
                      {(p as any)?.category?.replaceAll("_", " ") ?? "—"} · {(p as any)?.city ?? "—"}
                    </div>
                    {r.pricing_key && (
                      <div style={{ fontSize: "11px", color: "#4A7FB5" }}>
                        {r.pricing_key.replaceAll("_", " ")}
                        {r.fee_charged_cents ? ` · ${formatFee(r.fee_charged_cents)}` : ""}
                      </div>
                    )}
                    {inspectorMap.get(r.inspector_id) && (
                      <div style={{ fontSize: "11px", color: "#4A7FB5" }}>
                        Inspector: {inspectorMap.get(r.inspector_id)}
                      </div>
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      padding: "4px 10px",
                      borderRadius: "20px",
                      background: "#F0FDF4",
                      color: "#15803D",
                      border: "1px solid #166534",
                    }}
                  >
                    COMPLETED
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
