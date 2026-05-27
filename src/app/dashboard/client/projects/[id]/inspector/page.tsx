import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";
import InspectorPricingForm, { PriceOption } from "./InspectorPricingForm";
import { selectInspectorTier } from "./actions";
import { getFeatureFlag, FLAGS } from "@/lib/featureFlags";

export default async function ClientInspectorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ paid?: string; upgrade_paid?: string; dispute_submitted?: string }>;
}) {
  const { user, role } = await requireRole(["CLIENT", "ADMIN"]);
  const { id: projectId } = await params;
  const sp = await searchParams;

  // Fetch project
  const { data: project } = await supabaseAdmin
    .from("projects")
    .select("id, title, state, category, client_id")
    .eq("id", projectId)
    .single();

  if (!project || (role !== "ADMIN" && (project as any).client_id !== user.id)) {
    redirect(`/dashboard/client/projects`);
  }

  // Gate: if the inspector feature is disabled and there's no existing assignment,
  // redirect back to the project page (nothing to show yet)
  if (role !== "ADMIN") {
    const inspectorEnabled = await getFeatureFlag(FLAGS.INSPECTOR_ENABLED);
    if (!inspectorEnabled) {
      // Check for an existing assignment before redirecting
      const { data: existingAsgn } = await supabaseAdmin
        .from("project_inspector_assignments")
        .select("id")
        .eq("project_id", projectId)
        .neq("payment_status", "FAILED")
        .maybeSingle();

      if (!existingAsgn) {
        redirect(`/dashboard/client/projects/${projectId}`);
      }
    }
  }

  // Fetch active price list
  const { data: priceRows } = await supabaseAdmin
    .from("inspector_price_list")
    .select("pricing_key, display_name, description, fee_cents")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  // Fetch existing assignment (include upgrade columns)
  const { data: assignment } = await supabaseAdmin
    .from("project_inspector_assignments")
    .select(
      "id, request_status, payment_status, pricing_key, fee_charged_cents, requested_at, assigned_at, inspector_id, takeoff_report, takeoff_completed_at, notes, upgrade_payment_status, upgrade_justification, upgrade_requested_at, upgrade_fee_cents, upgrade_charged_at"
    )
    .eq("project_id", projectId)
    .neq("payment_status", "FAILED")
    .order("requested_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // If a PENDING (unpaid) row exists, send client straight to the pay page
  if (assignment && assignment.payment_status === "PENDING") {
    redirect(`/dashboard/client/projects/${projectId}/inspector/pay`);
  }

  // Fetch inspector name if assigned
  let inspectorName: string | null = null;
  if (assignment?.inspector_id) {
    const { data: inspector } = await supabaseAdmin
      .from("profiles")
      .select("display_name")
      .eq("id", assignment.inspector_id)
      .single();
    inspectorName = inspector?.display_name ?? null;
  }

  const options: PriceOption[] = priceRows ?? [];

  // Fetch existing dispute (if any) for upgrade-paid assignments
  let existingDispute: { id: string; status: string; created_at: string } | null = null;
  if (assignment && (assignment as any).upgrade_payment_status === "PAID" && (assignment as any).upgrade_charged_at) {
    const { data: dispRow } = await supabaseAdmin
      .from("inspector_upgrade_disputes")
      .select("id, status, created_at")
      .eq("inspector_request_id", (assignment as any).id)
      .maybeSingle();
    existingDispute = (dispRow as any) ?? null;
  }

  // 14-day dispute window calculation
  const upgradeChargedAt = (assignment as any)?.upgrade_charged_at as string | null;
  const disputeWindowExpiresAt = upgradeChargedAt
    ? new Date(new Date(upgradeChargedAt).getTime() + 14 * 24 * 60 * 60 * 1000)
    : null;
  const withinDisputeWindow =
    disputeWindowExpiresAt != null && new Date() <= disputeWindowExpiresAt;
  const disputeDaysRemaining = disputeWindowExpiresAt
    ? Math.max(0, Math.ceil((disputeWindowExpiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  function statusColor(status: string) {
    switch (status) {
      case "PENDING":
        return { background: "#FFFBEB", color: "#92400E", border: "1px solid #FCD34D" };
      case "ASSIGNED":
        return { background: "#EEF4FF", color: "#1B4F8A", border: "1px solid #B8D0E8" };
      case "COMPLETED":
        return { background: "#F0FDF4", color: "#15803D", border: "1px solid #166534" };
      default:
        return { background: "#EEF4FF", color: "#1B4F8A", border: "1px solid #B8D0E8" };
    }
  }

  function formatFee(cents: number | null) {
    if (!cents) return null;
    return `$${(cents / 100).toFixed(0)}`;
  }

  return (
    <div style={{ maxWidth: "620px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "28px",
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
            Inspector Takeoff
          </h1>
          <p style={{ fontSize: "13px", color: "#1B4F8A", marginTop: "4px" }}>
            {project?.title ?? "Untitled"}
          </p>
        </div>
        <Link
          href={`/dashboard/client/projects/${projectId}`}
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

      {/* What is a Takeoff */}
      <div
        style={{
          background: "#EEF4FF",
          border: "1px solid #B8D0E8",
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "24px",
        }}
      >
        <h2
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "16px",
            letterSpacing: "1px",
            color: "#0A1628",
            textTransform: "uppercase",
            marginBottom: "10px",
          }}
        >
          What is a Bid-Accuracy Inspection?
        </h2>
        <p style={{ fontSize: "13px", color: "#1B4F8A", lineHeight: 1.7, marginBottom: "10px" }}>
          An ONP Inspector visits your property and produces a focused scope document — measurements,
          photos, condition notes, and access observations — targeted to your project trade. This
          gives bidding contractors the information they need to price accurately.
        </p>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "5px",
            fontSize: "13px",
            color: "#15803D",
          }}
        >
          <div>✅ Targeted to your specific trade(s)</div>
          <div>✅ Typical visit: 1–2 hours on-site</div>
          <div>✅ Report shared with all bidding contractors</div>
          <div>✅ Results in tighter, more competitive bids</div>
        </div>
      </div>

      {/* PAID / active assignment — show status view */}
      {assignment && assignment.payment_status === "PAID" ? (
        <div>
          {/* Status card */}
          <div
            style={{
              background: "#EEF4FF",
              border: "1px solid #B8D0E8",
              borderRadius: "12px",
              padding: "20px",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "14px",
              }}
            >
              <h2
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 700,
                  fontSize: "18px",
                  letterSpacing: "1px",
                  color: "#0A1628",
                  textTransform: "uppercase",
                  margin: 0,
                }}
              >
                Inspection Status
              </h2>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  padding: "4px 10px",
                  borderRadius: "20px",
                  letterSpacing: "0.5px",
                  ...statusColor(assignment.request_status ?? "PENDING"),
                }}
              >
                {assignment.request_status ?? "PENDING"}
              </span>
            </div>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px" }}
            >
              {assignment.pricing_key && (
                <div>
                  <span style={{ color: "#1B4F8A" }}>Inspection type: </span>
                  <span style={{ color: "#0A1628" }}>
                    {assignment.pricing_key.replaceAll("_", " ")}
                  </span>
                </div>
              )}
              {assignment.fee_charged_cents && (
                <div>
                  <span style={{ color: "#1B4F8A" }}>Fee paid: </span>
                  <span style={{ color: "#0A1628", fontWeight: 600 }}>
                    {formatFee(assignment.fee_charged_cents)}
                  </span>
                </div>
              )}
              {assignment.requested_at && (
                <div>
                  <span style={{ color: "#1B4F8A" }}>Requested: </span>
                  <span style={{ color: "#0A1628" }}>
                    {new Date(assignment.requested_at).toLocaleDateString()}
                  </span>
                </div>
              )}
              {inspectorName && (
                <div>
                  <span style={{ color: "#1B4F8A" }}>Inspector: </span>
                  <span style={{ color: "#0A1628" }}>{inspectorName}</span>
                </div>
              )}
              {assignment.assigned_at && (
                <div>
                  <span style={{ color: "#1B4F8A" }}>Assigned: </span>
                  <span style={{ color: "#0A1628" }}>
                    {new Date(assignment.assigned_at).toLocaleDateString()}
                  </span>
                </div>
              )}
              {assignment.notes && (
                <div>
                  <span style={{ color: "#1B4F8A" }}>Notes: </span>
                  <span style={{ color: "#0A1628" }}>{assignment.notes}</span>
                </div>
              )}
            </div>
          </div>

          {/* Upgrade banner — shown when inspector has requested an upgrade */}
          {(assignment as any).upgrade_payment_status === "PENDING" && (
            <div style={{
              background: "#2D1B00",
              border: "1px solid #FBBF24",
              borderRadius: "12px",
              padding: "20px",
              marginBottom: "20px",
            }}>
              <h3 style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: "18px",
                letterSpacing: "1px",
                color: "#FBBF24",
                textTransform: "uppercase",
                marginBottom: "8px",
              }}>
                ⚠ Upgrade Requested by Inspector
              </h3>
              <p style={{ fontSize: "13px", color: "#FDE68A", lineHeight: 1.6, marginBottom: "10px" }}>
                Your inspector has reviewed the project on-site and determined that a Comprehensive inspection
                is needed. An additional{" "}
                <strong>${(((assignment as any).upgrade_fee_cents ?? 20000) / 100).toFixed(0)}</strong> will be charged.
              </p>
              {(assignment as any).upgrade_justification && (
                <div style={{
                  background: "#0A1628",
                  borderRadius: "6px",
                  padding: "12px 16px",
                  marginBottom: "14px",
                  fontSize: "13px",
                  color: "#F0F4FF",
                  fontStyle: "italic",
                }}>
                  "{(assignment as any).upgrade_justification}"
                </div>
              )}
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <a
                  href={`/dashboard/client/projects/${projectId}/inspector/upgrade-pay`}
                  style={{
                    background: "#C8102E",
                    color: "#fff",
                    padding: "10px 22px",
                    borderRadius: "6px",
                    fontFamily: "'Barlow', sans-serif",
                    fontWeight: 600,
                    fontSize: "13px",
                    textDecoration: "none",
                    display: "inline-block",
                  }}
                >
                  Pay $200 Upgrade Fee
                </a>
                <a
                  href={`/dashboard/client/projects/${projectId}/inspector/upgrade-pay`}
                  style={{
                    background: "transparent",
                    color: "#FDE68A",
                    border: "1px solid #FBBF24",
                    padding: "10px 20px",
                    borderRadius: "6px",
                    fontFamily: "'Barlow', sans-serif",
                    fontSize: "13px",
                    textDecoration: "none",
                    display: "inline-block",
                  }}
                >
                  Review & Decline
                </a>
              </div>
            </div>
          )}

          {/* Dispute submitted banner */}
          {sp.dispute_submitted === "1" && (
            <div style={{ background: "#052E16", border: "1px solid #166534", borderRadius: "10px", padding: "14px 18px", marginBottom: "20px" }}>
              <div style={{ fontSize: "13px", color: "#4ADE80", fontWeight: 700, marginBottom: "4px" }}>✅ Dispute Submitted</div>
              <div style={{ fontSize: "12px", color: "#86EFAC" }}>Your dispute has been received. An independent Master Inspector will review your case within 5 business days.</div>
            </div>
          )}

          {/* Upgrade confirmed notice + dispute CTA */}
          {(assignment as any).upgrade_payment_status === "PAID" && (
            <div style={{
              background: "#052E16",
              border: "1px solid #166534",
              borderRadius: "12px",
              padding: "20px",
              marginBottom: "20px",
            }}>
              <div style={{ fontSize: "13px", color: "#4ADE80", fontWeight: 600, marginBottom: "6px" }}>
                ✅ Upgraded to Comprehensive Inspection
              </div>
              <div style={{ fontSize: "12px", color: "#86EFAC", marginBottom: "14px" }}>
                Additional ${(((assignment as any).upgrade_fee_cents ?? 20000) / 100).toFixed(0)} charged
                {(assignment as any).upgrade_charged_at && (
                  <> on {new Date((assignment as any).upgrade_charged_at).toLocaleDateString()}</>
                )}.
              </div>

              {/* Dispute status or CTA */}
              {existingDispute && (existingDispute as any).status !== "WITHDRAWN" ? (
                <div style={{ background: "#0A1628", borderRadius: "8px", padding: "12px 16px" }}>
                  <div style={{ fontSize: "12px", color: "#FBBF24", fontWeight: 700, marginBottom: "4px" }}>
                    Dispute Status: {(existingDispute as any).status.replaceAll("_", " ")}
                  </div>
                  <div style={{ fontSize: "11px", color: "#7A9CC4" }}>
                    Filed {new Date((existingDispute as any).created_at).toLocaleDateString()} · A Master Inspector will render a decision within 5 business days.
                  </div>
                  <a href={`/dashboard/client/projects/${projectId}/dispute-upgrade`} style={{ display: "inline-block", marginTop: "8px", fontSize: "11px", color: "#4ADE80", textDecoration: "underline" }}>
                    View dispute details →
                  </a>
                </div>
              ) : withinDisputeWindow ? (
                <div style={{ background: "#0A1628", borderRadius: "8px", padding: "12px 16px" }}>
                  <div style={{ fontSize: "12px", color: "#B8D0E8", lineHeight: 1.6, marginBottom: "10px" }}>
                    If you believe this upgrade was not justified, you have{" "}
                    <strong style={{ color: "#FBBF24" }}>{disputeDaysRemaining} day{disputeDaysRemaining !== 1 ? "s" : ""}</strong>{" "}
                    remaining to request a free independent review.
                  </div>
                  <a
                    href={`/dashboard/client/projects/${projectId}/dispute-upgrade`}
                    style={{
                      display: "inline-block",
                      background: "transparent",
                      color: "#FBBF24",
                      border: "1px solid #FBBF24",
                      padding: "8px 18px",
                      borderRadius: "6px",
                      fontFamily: "'Barlow', sans-serif",
                      fontSize: "12px",
                      fontWeight: 600,
                      textDecoration: "none",
                    }}
                  >
                    Request Master Inspector Review →
                  </a>
                </div>
              ) : (
                <div style={{ fontSize: "11px", color: "#4A7FB5" }}>
                  The 14-day independent review window has closed.
                </div>
              )}
            </div>
          )}

          {/* Takeoff report */}
          {assignment.takeoff_report && (
            <div
              style={{
                background: "#EEF4FF",
                border: "1px solid #166534",
                borderRadius: "12px",
                padding: "24px",
              }}
            >
              <h2
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 700,
                  fontSize: "18px",
                  letterSpacing: "1px",
                  color: "#15803D",
                  textTransform: "uppercase",
                  marginBottom: "14px",
                }}
              >
                ✅ Takeoff Report
              </h2>
              {assignment.takeoff_completed_at && (
                <div style={{ fontSize: "12px", color: "#1B4F8A", marginBottom: "12px" }}>
                  Completed:{" "}
                  {new Date(assignment.takeoff_completed_at).toLocaleDateString()}
                </div>
              )}
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #B8D0E8",
                  borderRadius: "8px",
                  padding: "16px",
                  fontSize: "13px",
                  color: "#0A1628",
                  lineHeight: 1.7,
                  whiteSpace: "pre-wrap",
                }}
              >
                {assignment.takeoff_report}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* No assignment (or all FAILED) — show pricing form */
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #B8D0E8",
            borderRadius: "12px",
            padding: "24px",
          }}
        >
          <h2
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: "18px",
              letterSpacing: "1px",
              color: "#0A1628",
              textTransform: "uppercase",
              marginBottom: "20px",
            }}
          >
            Request an Inspector
          </h2>
          <InspectorPricingForm
            options={options}
            formAction={selectInspectorTier.bind(null, projectId)}
          />
        </div>
      )}
    </div>
  );
}
