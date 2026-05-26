import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";
import ReviewForm from "./ReviewForm";
import { submitReview } from "./actions";

export default async function DisputeReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user, role } = await requireRole(["INSPECTOR", "ADMIN"]);
  const { id: disputeId } = await params;

  // Check master inspector flag
  const { data: myProfile } = await supabaseAdmin
    .from("profiles")
    .select("is_master_inspector")
    .eq("id", user.id)
    .single();

  const isMasterInspector = (myProfile as any)?.is_master_inspector === true;

  if (role !== "ADMIN" && !isMasterInspector) {
    redirect("/dashboard/inspector");
  }

  // Fetch dispute
  const { data: dispute, error: disputeErr } = await supabaseAdmin
    .from("inspector_upgrade_disputes")
    .select(
      "id, status, created_at, assigned_at, upgrade_charge_cents, client_statement, " +
      "original_inspector_id, master_inspector_id, project_id, inspector_request_id, " +
      "original_inspector_statement, original_inspector_responded_at, " +
      "resolution_decision, resolution_reasoning, inspector_showed_reasons_on_site, " +
      "resolved_at, refund_cents, credit_cents"
    )
    .eq("id", disputeId)
    .single();

  if (disputeErr || !dispute) {
    return (
      <div style={{ maxWidth: "700px" }}>
        <h1
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "32px",
            color: "#0A1628",
          }}
        >
          Dispute Not Found
        </h1>
        <Link
          href="/dashboard/inspector/disputes"
          style={{
            color: "#1B4F8A",
            textDecoration: "underline",
            fontSize: "13px",
            display: "block",
            marginTop: "12px",
          }}
        >
          ← Back to Disputes
        </Link>
      </div>
    );
  }

  // Authorization: only the assigned MI (or admin) can review
  if (role !== "ADMIN" && (dispute as any).master_inspector_id !== user.id) {
    redirect("/dashboard/inspector/disputes");
  }

  const isResolved = !["SUBMITTED", "UNDER_REVIEW"].includes((dispute as any).status);
  const upgradeChargeCents = (dispute as any).upgrade_charge_cents as number ?? 20000;
  const fmt = (cents: number) => `$${(cents / 100).toFixed(0)}`;

  // Fetch project, assignment, and inspector profile in parallel
  const [{ data: project }, { data: assignment }, { data: inspectorProfile }] =
    await Promise.all([
      supabaseAdmin
        .from("projects")
        .select("id, title, description, category, city, location_general, deadline_at")
        .eq("id", (dispute as any).project_id)
        .single(),
      supabaseAdmin
        .from("project_inspector_assignments")
        .select(
          "id, pricing_key, fee_charged_cents, upgrade_fee_cents, upgrade_justification, takeoff_report, takeoff_completed_at"
        )
        .eq("id", (dispute as any).inspector_request_id)
        .single(),
      supabaseAdmin
        .from("profiles")
        .select("id, display_name")
        .eq("id", (dispute as any).original_inspector_id)
        .single(),
    ]);

  const inspectorExplainedLabel =
    (dispute as any).inspector_showed_reasons_on_site === true
      ? "Yes — inspector gave specific reasons on-site"
      : (dispute as any).inspector_showed_reasons_on_site === false
      ? "No — no explanation was given"
      : "Not sure / did not recall";

  return (
    <div style={{ maxWidth: "720px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "24px",
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
            Dispute Review
          </h1>
          <p style={{ fontSize: "13px", color: "#1B4F8A", marginTop: "4px" }}>
            {(project as any)?.title ?? "Untitled Project"} ·{" "}
            <span style={{ color: "#4A7FB5" }}>
              {fmt(upgradeChargeCents)} upgrade charge disputed
            </span>
          </p>
        </div>
        <Link
          href="/dashboard/inspector/disputes"
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

      {/* Already-resolved banner */}
      {isResolved && (
        <div
          style={{
            background: "#F0FDF4",
            border: "1px solid #166534",
            borderRadius: "12px",
            padding: "16px 20px",
            marginBottom: "20px",
          }}
        >
          <div style={{ fontWeight: 700, fontSize: "14px", color: "#15803D", marginBottom: "6px" }}>
            ✅ Resolved:{" "}
            {(dispute as any).status.replaceAll("_", " ")}
            {(dispute as any).resolved_at &&
              ` — ${new Date((dispute as any).resolved_at).toLocaleDateString()}`}
          </div>
          {(dispute as any).resolution_reasoning && (
            <p
              style={{
                fontSize: "13px",
                color: "#166534",
                margin: 0,
                lineHeight: 1.6,
                fontStyle: "italic",
              }}
            >
              &ldquo;{(dispute as any).resolution_reasoning}&rdquo;
            </p>
          )}
        </div>
      )}

      {/* ── 1. Project Context ─────────────────────────────────── */}
      <ReviewSection title="Project Context">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <InfoField
            label="Category"
            value={(project as any)?.category?.replaceAll("_", " ") ?? "—"}
          />
          <InfoField
            label="City"
            value={(project as any)?.city ?? (project as any)?.location_general ?? "—"}
          />
        </div>
        {(project as any)?.description && (
          <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px solid #B8D0E8" }}>
            <div
              style={{
                fontSize: "11px",
                color: "#1B4F8A",
                textTransform: "uppercase",
                letterSpacing: "1px",
                marginBottom: "4px",
              }}
            >
              Client&apos;s Description
            </div>
            <div
              style={{
                fontSize: "13px",
                color: "#0A1628",
                lineHeight: 1.6,
                whiteSpace: "pre-wrap",
              }}
            >
              {(project as any).description}
            </div>
          </div>
        )}
      </ReviewSection>

      {/* ── 2. Booking Details ─────────────────────────────────── */}
      <ReviewSection title="Booking Details">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <InfoField label="Original Booking" value="Standard Inspection" />
          <InfoField label="Upgraded To (On-site)" value="Comprehensive" />
          <InfoField label="Upgrade Fee Disputed" value={fmt(upgradeChargeCents)} />
          <InfoField
            label="Original Inspector"
            value={(inspectorProfile as any)?.display_name ?? "—"}
          />
        </div>
      </ReviewSection>

      {/* ── 3. Inspector's Upgrade Justification ───────────────── */}
      <ReviewSection title="Inspector's Upgrade Justification">
        {(assignment as any)?.upgrade_justification ? (
          <div
            style={{
              background: "#FEF9C3",
              border: "1px solid #FCD34D",
              borderRadius: "8px",
              padding: "14px 16px",
              fontSize: "13px",
              color: "#78350F",
              lineHeight: 1.6,
              whiteSpace: "pre-wrap",
              fontStyle: "italic",
            }}
          >
            &ldquo;{(assignment as any).upgrade_justification}&rdquo;
          </div>
        ) : (
          <div
            style={{
              fontSize: "13px",
              color: "#4A7FB5",
              fontStyle: "italic",
            }}
          >
            No justification was recorded.
          </div>
        )}
      </ReviewSection>

      {/* ── 4. Inspector's On-Site Report ──────────────────────── */}
      <ReviewSection title="Inspector's On-Site Report">
        {(assignment as any)?.takeoff_report ? (
          <>
            {(assignment as any).takeoff_completed_at && (
              <div style={{ fontSize: "12px", color: "#1B4F8A", marginBottom: "8px" }}>
                Submitted:{" "}
                {new Date((assignment as any).takeoff_completed_at).toLocaleDateString()}
              </div>
            )}
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #B8D0E8",
                borderRadius: "8px",
                padding: "14px 16px",
                fontSize: "13px",
                color: "#0A1628",
                lineHeight: 1.7,
                whiteSpace: "pre-wrap",
              }}
            >
              {(assignment as any).takeoff_report}
            </div>
          </>
        ) : (
          <div style={{ fontSize: "13px", color: "#4A7FB5", fontStyle: "italic" }}>
            No takeoff report submitted yet.
          </div>
        )}
      </ReviewSection>

      {/* ── 5. Client's Dispute Statement ─────────────────────── */}
      <ReviewSection title="Client's Dispute Statement">
        <div style={{ fontSize: "12px", color: "#1B4F8A", marginBottom: "8px" }}>
          Did inspector explain reasons on-site?{" "}
          <strong style={{ color: "#0A1628" }}>{inspectorExplainedLabel}</strong>
        </div>
        <div
          style={{
            background: "#FEF2F2",
            border: "1px solid #FCA5A5",
            borderRadius: "8px",
            padding: "14px 16px",
            fontSize: "13px",
            color: "#7F1D1D",
            lineHeight: 1.6,
            whiteSpace: "pre-wrap",
            fontStyle: "italic",
          }}
        >
          &ldquo;{(dispute as any).client_statement}&rdquo;
        </div>
        <div style={{ fontSize: "11px", color: "#4A7FB5", marginTop: "8px" }}>
          Filed: {new Date((dispute as any).created_at).toLocaleDateString()}
        </div>
      </ReviewSection>

      {/* ── 6. Inspector's Response to Dispute ────────────────── */}
      <ReviewSection title="Inspector's Response to Dispute">
        {(dispute as any).original_inspector_statement ? (
          <>
            {(dispute as any).original_inspector_responded_at && (
              <div style={{ fontSize: "12px", color: "#1B4F8A", marginBottom: "8px" }}>
                Responded:{" "}
                {new Date(
                  (dispute as any).original_inspector_responded_at
                ).toLocaleDateString()}
              </div>
            )}
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #B8D0E8",
                borderRadius: "8px",
                padding: "14px 16px",
                fontSize: "13px",
                color: "#0A1628",
                lineHeight: 1.7,
                whiteSpace: "pre-wrap",
              }}
            >
              {(dispute as any).original_inspector_statement}
            </div>
          </>
        ) : (
          <div
            style={{
              background: "#FFFBEB",
              border: "1px solid #FCD34D",
              borderRadius: "8px",
              padding: "14px 16px",
              fontSize: "13px",
              color: "#92400E",
            }}
          >
            ⚠ The inspector has not yet submitted a response to this dispute. You may
            still render a decision — non-response is noted in the record.
          </div>
        )}
      </ReviewSection>

      {/* ── Decision Form (only if not yet resolved) ──────────── */}
      {!isResolved && (
        <div
          style={{
            background: "#FFFFFF",
            border: "2px solid #0A1628",
            borderRadius: "12px",
            padding: "28px",
            marginTop: "8px",
          }}
        >
          <h2
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: "20px",
              letterSpacing: "1px",
              color: "#0A1628",
              textTransform: "uppercase",
              marginBottom: "6px",
            }}
          >
            Your Decision
          </h2>
          <p style={{ fontSize: "12px", color: "#4A7FB5", marginBottom: "24px", marginTop: 0 }}>
            Review all evidence above before submitting. Your written reasoning will be
            shared with both parties.
          </p>
          <ReviewForm
            formAction={submitReview.bind(null, disputeId)}
            upgradeChargeCents={upgradeChargeCents}
          />
        </div>
      )}
    </div>
  );
}

function ReviewSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "#EEF4FF",
        border: "1px solid #B8D0E8",
        borderRadius: "12px",
        padding: "20px",
        marginBottom: "16px",
      }}
    >
      <h2
        style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: "13px",
          letterSpacing: "1px",
          color: "#1B4F8A",
          textTransform: "uppercase",
          marginBottom: "12px",
        }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div
        style={{
          fontSize: "11px",
          color: "#1B4F8A",
          textTransform: "uppercase",
          letterSpacing: "1px",
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: "13px", color: "#0A1628", marginTop: "2px", fontWeight: 500 }}>
        {value}
      </div>
    </div>
  );
}
