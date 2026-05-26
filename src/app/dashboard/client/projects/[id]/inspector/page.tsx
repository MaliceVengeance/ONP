import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";
import InspectorPricingForm, { PriceOption } from "./InspectorPricingForm";
import { selectInspectorTier } from "./actions";

export default async function ClientInspectorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { supabase } = await requireRole(["CLIENT", "ADMIN"]);
  const { id: projectId } = await params;

  // Fetch project — need category for recommended pricing key
  const { data: project } = await supabase
    .from("projects")
    .select("id, title, state, category")
    .eq("id", projectId)
    .single();

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

  // Split price list into single-trade and multi-trade options
  const multiTradeKeys = new Set(["MULTI_TRADE", "WHOLE_PROPERTY"]);
  const singleTradeOptions: PriceOption[] = (priceRows ?? []).filter(
    (r) => !multiTradeKeys.has(r.pricing_key)
  );
  const multiTradeOptions: PriceOption[] = (priceRows ?? []).filter(
    (r) => multiTradeKeys.has(r.pricing_key)
  );

  const recommendedKey = (project as any)?.category ?? singleTradeOptions[0]?.pricing_key ?? "";

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

          {/* Upgrade confirmed notice */}
          {(assignment as any).upgrade_payment_status === "PAID" && (
            <div style={{
              background: "#052E16",
              border: "1px solid #166534",
              borderRadius: "12px",
              padding: "16px 20px",
              marginBottom: "20px",
            }}>
              <div style={{ fontSize: "13px", color: "#4ADE80", fontWeight: 600, marginBottom: "4px" }}>
                ✅ Upgraded to Comprehensive Inspection
              </div>
              <div style={{ fontSize: "12px", color: "#86EFAC" }}>
                Additional $200 charged
                {(assignment as any).upgrade_charged_at && (
                  <> on {new Date((assignment as any).upgrade_charged_at).toLocaleDateString()}</>
                )}
                {" — "}14-day independent review window available if needed.
              </div>
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
            recommendedKey={recommendedKey}
            singleTradeOptions={singleTradeOptions}
            multiTradeOptions={multiTradeOptions}
            formAction={selectInspectorTier.bind(null, projectId)}
          />
        </div>
      )}
    </div>
  );
}
