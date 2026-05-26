import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { submitTakeoffReport, requestUpgrade, submitDisputeResponse } from "./actions";
import { stateBadge } from "@/lib/ui";

export default async function InspectorProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user, role } = await requireRole(["INSPECTOR", "ADMIN"]);
  const { id: assignmentId } = await params;

  const { data: assignment, error } = await supabaseAdmin
    .from("project_inspector_assignments")
    .select(
      "id, project_id, inspector_id, request_status, assigned_at, takeoff_report, takeoff_completed_at, notes, pricing_key, fee_charged_cents, upgrade_payment_status, upgrade_justification, upgrade_requested_at, upgrade_fee_cents"
    )
    .eq("id", assignmentId)
    .single();

  if (error || !assignment) {
    return (
      <div style={{ maxWidth: "700px" }}>
        <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "32px", color: "#0A1628" }}>
          Assignment Not Found
        </h1>
        <Link href="/dashboard/inspector/projects" style={{ color: "#1B4F8A", textDecoration: "underline", fontSize: "13px", display: "block", marginTop: "16px" }}>
          ← Back
        </Link>
      </div>
    );
  }

  // Ownership check: inspectors can only view their own assignments
  if (role !== "ADMIN" && assignment.inspector_id !== user.id) {
    return (
      <div style={{ maxWidth: "700px" }}>
        <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "32px", color: "#0A1628" }}>
          Not Authorized
        </h1>
        <Link href="/dashboard/inspector/projects" style={{ color: "#1B4F8A", textDecoration: "underline", fontSize: "13px", display: "block", marginTop: "16px" }}>
          ← Back
        </Link>
      </div>
    );
  }

  const { data: project } = await supabaseAdmin
    .from("projects")
    .select("id, title, description, category, city, location_general, state, deadline_at")
    .eq("id", assignment.project_id)
    .single();

  const isAssigned  = assignment.request_status === "ASSIGNED";
  const isCompleted = assignment.request_status === "COMPLETED";
  const isStandard  = assignment.pricing_key === "STANDARD";
  const upgradeStatus = (assignment as any).upgrade_payment_status ?? "NONE";

  // Fetch open dispute for this assignment (if any)
  const { data: openDispute } = await supabaseAdmin
    .from("inspector_upgrade_disputes")
    .select("id, status, created_at, client_statement, original_inspector_statement, original_inspector_responded_at, inspector_showed_reasons_on_site")
    .eq("inspector_request_id", assignmentId)
    .in("status", ["SUBMITTED", "UNDER_REVIEW"])
    .maybeSingle();

  const disputeDeadlineAt = openDispute?.created_at
    ? new Date(new Date(openDispute.created_at).getTime() + 3 * 24 * 60 * 60 * 1000)
    : null;
  const disputeDeadlinePassed = disputeDeadlineAt != null && new Date() > disputeDeadlineAt;
  const disputeDaysRemaining = disputeDeadlineAt
    ? Math.max(0, Math.ceil((disputeDeadlineAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const inputStyle = {
    width: "100%",
    background: "#FFFFFF",
    border: "1px solid #B8D0E8",
    color: "#0A1628",
    borderRadius: "6px",
    padding: "10px 14px",
    fontFamily: "'Barlow', sans-serif",
    fontSize: "14px",
    outline: "none",
    marginTop: "6px",
  } as React.CSSProperties;

  return (
    <div style={{ maxWidth: "700px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h1 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "36px",
            letterSpacing: "1px",
            color: "#0A1628",
            margin: 0,
          }}>
            {project?.title ?? "Untitled Project"}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "8px" }}>
            <span style={{ fontSize: "13px", color: "#1B4F8A" }}>
              {project?.category ?? "—"} • {project?.city ?? "—"}
            </span>
            {project && <span style={stateBadge(project.state)}>{project.state}</span>}
          </div>
        </div>
        <Link
          href="/dashboard/inspector/projects"
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
          Back
        </Link>
      </div>

      {/* Project details */}
      <div style={{
        background: "#EEF4FF",
        border: "1px solid #B8D0E8",
        borderRadius: "12px",
        padding: "20px",
        marginBottom: "16px",
      }}>
        <h2 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: "16px",
          letterSpacing: "1px",
          color: "#0A1628",
          textTransform: "uppercase",
          marginBottom: "12px",
        }}>
          Project Details
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
          <div>
            <div style={{ fontSize: "11px", color: "#1B4F8A", textTransform: "uppercase", letterSpacing: "1px" }}>Location</div>
            <div style={{ fontSize: "13px", color: "#0A1628", marginTop: "2px" }}>{project?.location_general ?? "—"}</div>
          </div>
          <div>
            <div style={{ fontSize: "11px", color: "#1B4F8A", textTransform: "uppercase", letterSpacing: "1px" }}>Deadline</div>
            <div style={{ fontSize: "13px", color: "#0A1628", marginTop: "2px" }}>
              {project?.deadline_at ? new Date(project.deadline_at).toLocaleDateString() : "—"}
            </div>
          </div>
        </div>
        {/* Inspection type + pricing */}
        {assignment.pricing_key && (
          <div style={{ paddingTop: "12px", borderTop: "1px solid #B8D0E8", display: "flex", gap: "16px", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: "11px", color: "#1B4F8A", textTransform: "uppercase", letterSpacing: "1px" }}>Inspection Type</div>
              <div style={{ fontSize: "13px", color: "#0A1628", marginTop: "2px", fontWeight: 600 }}>
                {upgradeStatus === "PAID" ? "Comprehensive" : assignment.pricing_key.replaceAll("_", " ")}
              </div>
            </div>
            {assignment.fee_charged_cents && (
              <div>
                <div style={{ fontSize: "11px", color: "#1B4F8A", textTransform: "uppercase", letterSpacing: "1px" }}>Fee</div>
                <div style={{ fontSize: "13px", color: "#0A1628", marginTop: "2px" }}>
                  ${(assignment.fee_charged_cents / 100).toFixed(0)} paid
                  {upgradeStatus === "PAID" && (assignment as any).upgrade_fee_cents && (
                    <span style={{ color: "#1B4F8A" }}>
                      {" "}+ ${((assignment as any).upgrade_fee_cents / 100).toFixed(0)} upgrade
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        {project?.description && (
          <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #B8D0E8" }}>
            <div style={{ fontSize: "11px", color: "#1B4F8A", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>Description</div>
            <div style={{ fontSize: "13px", color: "#0A1628", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{project.description}</div>
          </div>
        )}
      </div>

      {/* ── Upgrade section (STANDARD + ASSIGNED only) ── */}
      {isAssigned && isStandard && (
        <div style={{ marginBottom: "16px" }}>
          {upgradeStatus === "NONE" && (
            <div style={{
              background: "#FFFBEB",
              border: "1px solid #FCD34D",
              borderRadius: "12px",
              padding: "24px",
            }}>
              <h2 style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: "18px",
                letterSpacing: "1px",
                color: "#92400E",
                textTransform: "uppercase",
                marginBottom: "4px",
              }}>
                Request Upgrade to Comprehensive
              </h2>
              <p style={{ fontSize: "13px", color: "#78350F", marginBottom: "16px", lineHeight: 1.6 }}>
                If the scope of work on-site requires a more thorough inspection than the Standard tier covers,
                you can request an upgrade. The client will be charged an additional $200 and must approve the
                payment before you proceed with the extended scope.
              </p>
              <form action={requestUpgrade.bind(null, assignmentId)}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#92400E", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>
                  Why does this inspection require a Comprehensive upgrade?
                </label>
                <textarea
                  name="justification"
                  required
                  minLength={20}
                  maxLength={800}
                  rows={5}
                  style={{ ...inputStyle, minHeight: "100px", resize: "vertical", border: "1px solid #FCD34D" }}
                  placeholder="Describe specifically why the Standard scope is insufficient (e.g. multiple systems involved, larger-than-expected footprint, hidden conditions found)…"
                />
                <button
                  type="submit"
                  style={{
                    marginTop: "14px",
                    background: "#92400E",
                    color: "#fff",
                    border: "none",
                    padding: "10px 24px",
                    borderRadius: "6px",
                    fontFamily: "'Barlow', sans-serif",
                    fontWeight: 600,
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  Request Upgrade (+$200 to client)
                </button>
              </form>
            </div>
          )}

          {upgradeStatus === "PENDING" && (
            <div style={{
              background: "#FFFBEB",
              border: "1px solid #FCD34D",
              borderRadius: "12px",
              padding: "20px",
            }}>
              <h2 style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: "16px",
                letterSpacing: "1px",
                color: "#92400E",
                textTransform: "uppercase",
                marginBottom: "8px",
              }}>
                ⏳ Upgrade Awaiting Client Payment
              </h2>
              <p style={{ fontSize: "13px", color: "#78350F", marginBottom: "8px", lineHeight: 1.6 }}>
                Your upgrade request has been sent to the client. They must approve and pay $200 before you proceed
                with the Comprehensive scope. Continue with Standard scope if no response is received.
              </p>
              {(assignment as any).upgrade_requested_at && (
                <div style={{ fontSize: "12px", color: "#92400E" }}>
                  Requested: {new Date((assignment as any).upgrade_requested_at).toLocaleDateString()}
                </div>
              )}
              {(assignment as any).upgrade_justification && (
                <div style={{ marginTop: "10px", padding: "10px 14px", background: "#FEF9C3", borderRadius: "6px", fontSize: "12px", color: "#78350F", fontStyle: "italic" }}>
                  "{(assignment as any).upgrade_justification}"
                </div>
              )}
            </div>
          )}

          {upgradeStatus === "PAID" && (
            <div style={{
              background: "#F0FDF4",
              border: "1px solid #166534",
              borderRadius: "12px",
              padding: "20px",
            }}>
              <h2 style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: "16px",
                letterSpacing: "1px",
                color: "#15803D",
                textTransform: "uppercase",
                marginBottom: "8px",
              }}>
                ✅ Upgrade Approved — Proceed with Comprehensive
              </h2>
              <p style={{ fontSize: "13px", color: "#166534", lineHeight: 1.6 }}>
                The client has paid the upgrade fee. You are now authorized to perform the full Comprehensive scope.
              </p>
            </div>
          )}

          {upgradeStatus === "DECLINED" && (
            <div style={{
              background: "#FFF7ED",
              border: "1px solid #C2410C",
              borderRadius: "12px",
              padding: "20px",
            }}>
              <h2 style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: "16px",
                letterSpacing: "1px",
                color: "#C2410C",
                textTransform: "uppercase",
                marginBottom: "8px",
              }}>
                ℹ Upgrade Declined — Proceed with Standard
              </h2>
              <p style={{ fontSize: "13px", color: "#9A3412", lineHeight: 1.6 }}>
                The client has declined the upgrade. Please proceed with the original Standard inspection scope.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Dispute response section ── */}
      {openDispute && (
        <div style={{ marginBottom: "16px" }}>
          {!(openDispute as any).original_inspector_statement ? (
            <div style={{
              background: "#FFFBEB",
              border: "1px solid #FCD34D",
              borderRadius: "12px",
              padding: "24px",
            }}>
              <h2 style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: "18px",
                letterSpacing: "1px",
                color: "#92400E",
                textTransform: "uppercase",
                marginBottom: "8px",
              }}>
                ⚠ Dispute Filed — Response Required
              </h2>
              <p style={{ fontSize: "13px", color: "#78350F", marginBottom: "16px", lineHeight: 1.6 }}>
                The client has disputed the upgrade charge on this inspection. A Master Inspector will
                review the case. Please provide your account of why the upgrade was necessary.
                {!disputeDeadlinePassed && disputeDaysRemaining <= 3 && (
                  <strong> Response required within {disputeDaysRemaining === 1 ? "1 day" : `${disputeDaysRemaining} days`}.</strong>
                )}
              </p>

              {/* Client's dispute statement */}
              <div style={{
                background: "#FEF9C3",
                border: "1px solid #FCD34D",
                borderRadius: "8px",
                padding: "14px 16px",
                marginBottom: "16px",
              }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#92400E", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>
                  Client&apos;s Dispute Statement
                </div>
                <p style={{ fontSize: "13px", color: "#78350F", lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>
                  &ldquo;{(openDispute as any).client_statement}&rdquo;
                </p>
              </div>

              <form action={submitDisputeResponse.bind(null, assignmentId)}>
                <label style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#92400E",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  marginBottom: "6px",
                }}>
                  Your Response
                </label>
                <p style={{ fontSize: "12px", color: "#78350F", marginBottom: "8px", marginTop: 0 }}>
                  Explain why the upgrade was warranted. Be specific about what you observed on-site
                  that made the Standard scope insufficient.
                </p>
                <textarea
                  name="statement"
                  required
                  minLength={20}
                  maxLength={2000}
                  rows={7}
                  style={{ ...inputStyle, minHeight: "140px", resize: "vertical", border: "1px solid #FCD34D" }}
                  placeholder="Describe the on-site conditions that required a Comprehensive inspection — specific findings, measurements, systems involved, any conditions the client was informed of…"
                />
                <button
                  type="submit"
                  style={{
                    marginTop: "14px",
                    background: "#92400E",
                    color: "#fff",
                    border: "none",
                    padding: "10px 24px",
                    borderRadius: "6px",
                    fontFamily: "'Barlow', sans-serif",
                    fontWeight: 600,
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  Submit Response
                </button>
              </form>

              {disputeDeadlineAt && (
                <div style={{
                  marginTop: "14px",
                  fontSize: "12px",
                  color: disputeDeadlinePassed ? "#C2410C" : "#92400E",
                }}>
                  {disputeDeadlinePassed
                    ? "⚠ Response window has passed. The Master Inspector may proceed without your statement."
                    : `⏰ Respond by ${disputeDeadlineAt.toLocaleDateString()} (${disputeDaysRemaining === 1 ? "1 day" : `${disputeDaysRemaining} days`} remaining)`}
                </div>
              )}
            </div>
          ) : (
            <div style={{
              background: "#F0FDF4",
              border: "1px solid #166534",
              borderRadius: "12px",
              padding: "20px",
            }}>
              <h2 style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: "16px",
                letterSpacing: "1px",
                color: "#15803D",
                textTransform: "uppercase",
                marginBottom: "8px",
              }}>
                ✅ Dispute Response Submitted
              </h2>
              {(openDispute as any).original_inspector_responded_at && (
                <div style={{ fontSize: "12px", color: "#15803D", marginBottom: "10px" }}>
                  Submitted: {new Date((openDispute as any).original_inspector_responded_at).toLocaleDateString()}
                </div>
              )}
              <div style={{
                background: "#FFFFFF",
                border: "1px solid #B8D0E8",
                borderRadius: "8px",
                padding: "14px 16px",
                fontSize: "13px",
                color: "#0A1628",
                lineHeight: 1.7,
                whiteSpace: "pre-wrap",
              }}>
                {(openDispute as any).original_inspector_statement}
              </div>
              <p style={{ fontSize: "12px", color: "#15803D", marginTop: "10px", marginBottom: 0 }}>
                A Master Inspector is reviewing the dispute. You will be notified of the decision.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Takeoff report ── */}
      {isCompleted ? (
        <div style={{
          background: "#EEF4FF",
          border: "1px solid #166534",
          borderRadius: "12px",
          padding: "24px",
        }}>
          <h2 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "18px",
            letterSpacing: "1px",
            color: "#15803D",
            textTransform: "uppercase",
            marginBottom: "8px",
          }}>
            ✅ Takeoff Completed
          </h2>
          {assignment.takeoff_completed_at && (
            <div style={{ fontSize: "12px", color: "#1B4F8A", marginBottom: "12px" }}>
              Submitted: {new Date(assignment.takeoff_completed_at).toLocaleDateString()}
            </div>
          )}
          <div style={{
            background: "#FFFFFF",
            border: "1px solid #B8D0E8",
            borderRadius: "8px",
            padding: "16px",
            fontSize: "13px",
            color: "#0A1628",
            lineHeight: 1.7,
            whiteSpace: "pre-wrap",
          }}>
            {assignment.takeoff_report}
          </div>
        </div>
      ) : (
        <div style={{
          background: "#EEF4FF",
          border: "1px solid #B8D0E8",
          borderRadius: "12px",
          padding: "24px",
        }}>
          <h2 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "18px",
            letterSpacing: "1px",
            color: "#0A1628",
            textTransform: "uppercase",
            marginBottom: "4px",
          }}>
            Submit Takeoff Report
          </h2>
          <p style={{ fontSize: "12px", color: "#1B4F8A", marginBottom: "16px" }}>
            Document your findings from the site visit.
            {upgradeStatus === "PENDING" && " Wait for the client's upgrade decision before submitting if scope is unclear."}
          </p>

          <form action={submitTakeoffReport.bind(null, assignmentId)}>
            <textarea
              name="takeoff_report"
              style={{ ...inputStyle, minHeight: "200px", resize: "vertical" }}
              placeholder="Describe the scope of work in detail. Include measurements, materials needed, existing conditions, access notes, and any other relevant findings…"
              required
            />
            <button
              type="submit"
              style={{
                marginTop: "16px",
                background: "#C8102E",
                color: "#fff",
                border: "none",
                padding: "12px 28px",
                borderRadius: "6px",
                fontFamily: "'Barlow', sans-serif",
                fontWeight: 600,
                fontSize: "14px",
                letterSpacing: "0.5px",
                cursor: "pointer",
              }}
            >
              Submit Report
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
