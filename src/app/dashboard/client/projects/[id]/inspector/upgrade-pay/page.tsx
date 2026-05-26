import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getTotalAvailableCredits } from "@/lib/credits";
import { createUpgradeCheckout, declineUpgrade } from "./actions";

export default async function InspectorUpgradePayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user } = await requireRole(["CLIENT", "ADMIN"]);
  const { id: projectId } = await params;

  // Fetch project + ownership check
  const { data: project } = await supabaseAdmin
    .from("projects")
    .select("id, title, client_id")
    .eq("id", projectId)
    .single();

  if (!project || (project as any).client_id !== user.id) {
    redirect(`/dashboard/client/projects`);
  }

  // Fetch the pending upgrade assignment
  const { data: assignment } = await supabaseAdmin
    .from("project_inspector_assignments")
    .select(
      "id, pricing_key, fee_charged_cents, upgrade_fee_cents, upgrade_justification, upgrade_requested_at, upgrade_payment_status, inspector_id"
    )
    .eq("project_id", projectId)
    .eq("payment_status", "PAID")
    .maybeSingle();

  const upgradeStatus = (assignment as any)?.upgrade_payment_status ?? "NONE";

  // If no pending upgrade, redirect back
  if (!assignment || upgradeStatus !== "PENDING") {
    redirect(`/dashboard/client/projects/${projectId}/inspector`);
  }

  const originalFee = (assignment as any).fee_charged_cents as number ?? 19900;
  const upgradeFee  = (assignment as any).upgrade_fee_cents as number ?? 20000;
  const requestedAt = (assignment as any).upgrade_requested_at
    ? new Date((assignment as any).upgrade_requested_at).toLocaleDateString()
    : "—";

  // Fetch available credits
  const availableCredits = await getTotalAvailableCredits(user.id);
  const creditsToApply   = Math.min(availableCredits, upgradeFee);
  const afterCredits     = upgradeFee - creditsToApply;
  const fullCover        = availableCredits >= upgradeFee;

  function fmt(cents: number) {
    return `$${(cents / 100).toFixed(0)}`;
  }

  return (
    <div style={{ maxWidth: "560px" }}>
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
            Inspector Upgrade
          </h1>
          <p style={{ fontSize: "13px", color: "#1B4F8A", marginTop: "4px" }}>
            {(project as any).title ?? "Untitled"}
          </p>
        </div>
        <Link
          href={`/dashboard/client/projects/${projectId}/inspector`}
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

      {/* What happened */}
      <div
        style={{
          background: "#2D1B00",
          border: "1px solid #FBBF24",
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "20px",
        }}
      >
        <h2
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "20px",
            letterSpacing: "1px",
            color: "#FBBF24",
            textTransform: "uppercase",
            marginBottom: "12px",
          }}
        >
          ⚠ Your Inspector Requested an Upgrade
        </h2>
        <p style={{ fontSize: "13px", color: "#FDE68A", lineHeight: 1.6, marginBottom: "16px" }}>
          After arriving on-site, your inspector determined that a Comprehensive Inspection is
          needed for accurate results. The reason provided is:
        </p>
        <div
          style={{
            background: "#0A1628",
            borderRadius: "8px",
            padding: "14px 16px",
            marginBottom: "16px",
            fontSize: "13px",
            color: "#F0F4FF",
            lineHeight: 1.6,
            fontStyle: "italic",
          }}
        >
          &ldquo;{(assignment as any).upgrade_justification}&rdquo;
        </div>
        <div style={{ fontSize: "12px", color: "#92400E" }}>Requested on {requestedAt}</div>
      </div>

      {/* Pricing summary */}
      <div
        style={{
          background: "#EEF4FF",
          border: "1px solid #B8D0E8",
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "20px",
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
            marginBottom: "16px",
          }}
        >
          Charge Summary
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
            <span style={{ color: "#1B4F8A" }}>Standard Inspection (already paid)</span>
            <span style={{ color: "#6B7280", textDecoration: "line-through" }}>
              {fmt(originalFee)}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
            <span style={{ color: "#1B4F8A" }}>Upgrade to Comprehensive</span>
            <span style={{ color: "#C8102E", fontWeight: 700 }}>+{fmt(upgradeFee)}</span>
          </div>
          <div
            style={{
              borderTop: "1px solid #B8D0E8",
              paddingTop: "10px",
              display: "flex",
              justifyContent: "space-between",
              fontSize: "15px",
              fontWeight: 700,
            }}
          >
            <span style={{ color: "#0A1628" }}>Total for Comprehensive Inspection</span>
            <span style={{ color: "#0A1628" }}>{fmt(originalFee + upgradeFee)}</span>
          </div>
        </div>

        <div
          style={{
            marginTop: "16px",
            padding: "12px 16px",
            background: "#FFFBEB",
            border: "1px solid #FCD34D",
            borderRadius: "6px",
            fontSize: "12px",
            color: "#92400E",
            lineHeight: 1.6,
          }}
        >
          <strong>Independent review available:</strong> After paying, you have 14 days to request
          a free review by an independent Master Inspector if you believe this upgrade was not
          justified. A full refund of the upgrade fee may be issued if the dispute is upheld.
        </div>
      </div>

      {/* Credits section */}
      {availableCredits > 0 && (
        <div
          style={{
            background: "#F0FDF4",
            border: "1px solid #86EFAC",
            borderRadius: "10px",
            padding: "18px 20px",
            marginBottom: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
            <span style={{ fontSize: "18px" }}>💳</span>
            <span style={{ fontWeight: 700, fontSize: "14px", color: "#15803D" }}>
              You have {fmt(availableCredits)} in ONP Credits
            </span>
          </div>
          <p style={{ fontSize: "13px", color: "#166534", lineHeight: 1.6, marginBottom: "12px" }}>
            {fullCover
              ? "Your credits cover the full upgrade fee — no card required."
              : `Applying your credits reduces the card charge to ${fmt(afterCredits)}.`}
          </p>
          <form action={createUpgradeCheckout.bind(null, projectId)}>
            <input type="hidden" name="apply_credits" value="1" />
            <button
              type="submit"
              style={{
                width: "100%",
                background: "#15803D",
                color: "#fff",
                border: "none",
                padding: "13px 24px",
                borderRadius: "6px",
                fontFamily: "'Barlow', sans-serif",
                fontWeight: 700,
                fontSize: "14px",
                cursor: "pointer",
                letterSpacing: "0.5px",
              }}
            >
              {fullCover
                ? `Pay with Credits — $0 Charged to Card`
                : `Apply ${fmt(creditsToApply)} Credits + Pay ${fmt(afterCredits)} via Card`}
            </button>
          </form>
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {availableCredits > 0 && (
          <p style={{ fontSize: "12px", color: "#6B7280", textAlign: "center", margin: 0 }}>
            — or pay the full upgrade fee without credits —
          </p>
        )}
        <form action={createUpgradeCheckout.bind(null, projectId)}>
          <button
            type="submit"
            style={{
              width: "100%",
              background: availableCredits > 0 ? "transparent" : "#C8102E",
              color: availableCredits > 0 ? "#1B4F8A" : "#fff",
              border: availableCredits > 0 ? "1px solid #B8D0E8" : "none",
              padding: "14px 24px",
              borderRadius: "8px",
              fontFamily: "'Barlow', sans-serif",
              fontWeight: 700,
              fontSize: "15px",
              cursor: "pointer",
              letterSpacing: "0.5px",
            }}
          >
            Pay {fmt(upgradeFee)} — Approve Upgrade
          </button>
        </form>

        <form action={declineUpgrade.bind(null, projectId)}>
          <button
            type="submit"
            style={{
              width: "100%",
              background: "transparent",
              color: "#6B7280",
              border: "1px solid #D1D5DB",
              padding: "12px 24px",
              borderRadius: "8px",
              fontFamily: "'Barlow', sans-serif",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            Decline — Proceed with Standard Inspection
          </button>
        </form>
      </div>

      <p style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "16px", lineHeight: 1.6 }}>
        If you decline, your inspector will proceed with the original Standard scope. The
        additional {fmt(upgradeFee)} will not be charged.
      </p>
    </div>
  );
}
