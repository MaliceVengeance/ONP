import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getTotalAvailableCredits } from "@/lib/credits";
import { createInspectorCheckout } from "./actions";
import { cancelInspectorRequest } from "../actions";

export default async function InspectorPayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user } = await requireRole(["CLIENT", "ADMIN"]);
  const { id: projectId } = await params;

  // Fetch the pending assignment for this project + client
  const { data: assignment } = await supabaseAdmin
    .from("project_inspector_assignments")
    .select("id, pricing_key, fee_charged_cents, requested_at, payment_status")
    .eq("project_id", projectId)
    .eq("client_id", user.id)
    .eq("payment_status", "PENDING")
    .maybeSingle();

  // Fetch project title
  const { data: project } = await supabaseAdmin
    .from("projects")
    .select("id, title")
    .eq("id", projectId)
    .single();

  // If there's no pending assignment, redirect back to the inspector page
  if (!assignment) {
    redirect(`/dashboard/client/projects/${projectId}/inspector`);
  }

  // Fetch price row for the display name
  const { data: priceRow } = await supabaseAdmin
    .from("inspector_price_list")
    .select("display_name, description")
    .eq("pricing_key", (assignment as any).pricing_key ?? "")
    .maybeSingle();

  // Fetch available credits
  const availableCredits = await getTotalAvailableCredits(user.id);
  const feeCents = (assignment as any).fee_charged_cents as number;
  const creditsToApply = Math.min(availableCredits, feeCents);
  const afterCredits   = feeCents - creditsToApply;
  const fullCover      = availableCredits >= feeCents;

  function formatFee(cents: number | null) {
    if (!cents && cents !== 0) return "—";
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
              color: "var(--camo-charcoal)",
              margin: 0,
            }}
          >
            Complete Payment
          </h1>
          <p style={{ fontSize: "13px", color: "var(--camo-gunmetal)", marginTop: "4px" }}>
            {(project as any)?.title ?? "Untitled"}
          </p>
        </div>
        <Link
          href={`/dashboard/client/projects/${projectId}/inspector`}
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
          ← Back
        </Link>
      </div>

      {/* Order summary */}
      <div
        style={{
          background: "var(--camo-concrete)",
          border: "1px solid #d9dbdb",
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
            color: "var(--camo-charcoal)",
            textTransform: "uppercase",
            marginBottom: "16px",
          }}
        >
          Order Summary
        </h2>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "16px",
            paddingBottom: "16px",
            borderBottom: "1px solid #d9dbdb",
            marginBottom: "16px",
          }}
        >
          <div>
            <div style={{ fontWeight: 600, fontSize: "15px", color: "var(--camo-charcoal)", marginBottom: "4px" }}>
              {(priceRow as any)?.display_name ??
                (assignment as any).pricing_key?.replaceAll("_", " ") ??
                "Inspection"}
            </div>
            {(priceRow as any)?.description && (
              <div style={{ fontSize: "12px", color: "var(--camo-gunmetal)", lineHeight: 1.5 }}>
                {(priceRow as any).description}
              </div>
            )}
          </div>
          <div
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: "22px",
              color: "var(--camo-charcoal)",
              whiteSpace: "nowrap",
            }}
          >
            {formatFee((assignment as any).fee_charged_cents)}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "14px",
            fontWeight: 700,
            color: "var(--camo-charcoal)",
          }}
        >
          <span>Total due today</span>
          <span>{formatFee((assignment as any).fee_charged_cents)}</span>
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
              You have {formatFee(availableCredits)} in ONP Credits
            </span>
          </div>
          <p style={{ fontSize: "13px", color: "#166534", lineHeight: 1.6, marginBottom: "12px" }}>
            {fullCover
              ? "Your credits cover the full inspection fee — no card required."
              : `Applying your credits reduces the card charge to ${formatFee(afterCredits)}.`}
          </p>
          <form action={createInspectorCheckout.bind(null, projectId)}>
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
                : `Apply ${formatFee(creditsToApply)} Credits + Pay ${formatFee(afterCredits)} via Card`}
            </button>
          </form>
        </div>
      )}

      {/* Reminder */}
      <div
        style={{
          background: "#FFFBEB",
          border: "1px solid #FCD34D",
          borderRadius: "8px",
          padding: "14px 16px",
          marginBottom: "24px",
          fontSize: "12px",
          color: "#92400E",
          lineHeight: 1.7,
        }}
      >
        <strong>Reminder:</strong> This fee is non-refundable once your inspection is scheduled.
        Most inspections are scheduled within 3–5 business days of payment. The inspector&apos;s
        report will be shared with contractors bidding on your project.
      </div>

      {/* Pay full price button (always shown) */}
      {availableCredits > 0 && (
        <p style={{ fontSize: "12px", color: "#6B7280", textAlign: "center", marginBottom: "8px" }}>
          — or pay the full amount without credits —
        </p>
      )}
      <form action={createInspectorCheckout.bind(null, projectId)}>
        <button
          type="submit"
          style={{
            background: availableCredits > 0 ? "transparent" : "var(--camo-accent)",
            color: availableCredits > 0 ? "var(--camo-gunmetal)" : "var(--camo-ink)",
            border: availableCredits > 0 ? "1px solid #d9dbdb" : "none",
            padding: "14px 28px",
            borderRadius: "6px",
            fontFamily: "'Barlow', sans-serif",
            fontWeight: 700,
            fontSize: "15px",
            letterSpacing: "0.5px",
            cursor: "pointer",
            width: "100%",
            marginBottom: "12px",
          }}
        >
          Pay {formatFee((assignment as any).fee_charged_cents)} — Secure Checkout
        </button>
      </form>

      {/* Cancel link */}
      <form action={cancelInspectorRequest.bind(null, projectId)}>
        <button
          type="submit"
          style={{
            background: "transparent",
            color: "#6B7280",
            border: "1px solid #E5E7EB",
            padding: "10px 20px",
            borderRadius: "6px",
            fontFamily: "'Barlow', sans-serif",
            fontSize: "13px",
            cursor: "pointer",
            width: "100%",
          }}
        >
          Cancel — go back and change my selection
        </button>
      </form>

      <p style={{ fontSize: "11px", color: "#9CA3AF", textAlign: "center", marginTop: "12px" }}>
        Powered by Stripe · Your card details are never stored by ONP
      </p>
    </div>
  );
}
