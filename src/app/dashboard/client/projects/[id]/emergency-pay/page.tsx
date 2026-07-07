import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getTotalAvailableCredits } from "@/lib/credits";
import { EMERGENCY_FEE_CENTS } from "@/lib/stripe";
import { createEmergencyCheckout, downgradeToStandard } from "./actions";
import { CLIENT_EMERGENCY_REQUEST } from "@/lib/disclaimers/clientEmergencyRequest";

export default async function EmergencyPayPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ canceled?: string }>;
}) {
  const { user } = await requireRole(["CLIENT", "ADMIN"]);
  const { id: projectId } = await params;
  const sp = await searchParams;

  const { data: project } = await supabaseAdmin
    .from("projects")
    .select("id, title, category, state, is_emergency, city, location_general, client_id")
    .eq("id", projectId)
    .single();

  if (
    !project ||
    (project as any).client_id !== user.id ||
    (project as any).state !== "PENDING_PAYMENT"
  ) {
    return (
      <div style={{ maxWidth: "600px" }}>
        <div
          style={{
            background: "#FEF2F2",
            border: "1px solid #FCA5A5",
            borderRadius: "10px",
            padding: "24px",
            color: "#991B1B",
            fontSize: "14px",
          }}
        >
          This project is not awaiting payment. It may have already been activated or cancelled.
        </div>
        <Link
          href="/dashboard/client/projects"
          style={{
            fontSize: "13px",
            color: "#1B4F8A",
            textDecoration: "underline",
            display: "block",
            marginTop: "16px",
          }}
        >
          ← Back to Projects
        </Link>
      </div>
    );
  }

  // Fetch available credits
  const availableCredits = await getTotalAvailableCredits(user.id);
  const creditsToApply   = Math.min(availableCredits, EMERGENCY_FEE_CENTS);
  const afterCredits     = EMERGENCY_FEE_CENTS - creditsToApply;
  const fullCover        = availableCredits >= EMERGENCY_FEE_CENTS;

  function fmt(cents: number) {
    return `$${(cents / 100).toFixed(0)}`;
  }

  return (
    <div style={{ maxWidth: "600px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
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
              color: "#1E3A8A",
              margin: 0,
            }}
          >
            Activate Emergency Bid
          </h1>
          <p style={{ fontSize: "13px", color: "#1B4F8A", marginTop: "4px" }}>
            {(project as any).title ?? "Untitled"}
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
          Back
        </Link>
      </div>

      {/* Checkout canceled banner */}
      {sp.canceled === "1" && (
        <div
          style={{
            background: "#FFFBEB",
            border: "1px solid #FCD34D",
            borderRadius: "8px",
            padding: "14px 18px",
            marginBottom: "20px",
            fontSize: "13px",
            color: "#92400E",
          }}
        >
          ⚠ Checkout was canceled. Your project is still in draft — you can pay now or convert it
          to a standard bid.
        </div>
      )}

      {/* What you're getting */}
      <div
        style={{
          background: "#7C1A00",
          border: "1px solid #C2410C",
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "14px",
            letterSpacing: "1px",
            color: "#FDBA74",
            textTransform: "uppercase",
            marginBottom: "12px",
          }}
        >
          🚨 Emergency Bid Request
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "16px" }}>
          <span
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: "48px",
              color: "#FFFFFF",
              lineHeight: 1,
            }}
          >
            {fmt(EMERGENCY_FEE_CENTS)}
          </span>
          <span style={{ fontSize: "14px", color: "#FED7AA" }}>one-time, non-refundable</span>
        </div>
        <ul style={{ paddingLeft: "20px", margin: 0 }}>
          {[
            "Bids visible to you immediately as contractors submit them",
            "Project auto-notifies all eligible contractors right away",
            "48-hour bidding window — fast response for urgent situations",
            "Award a contractor and get contact info immediately",
          ].map((item) => (
            <li
              key={item}
              style={{ fontSize: "13px", color: "#FED7AA", lineHeight: 1.7, marginBottom: "4px" }}
            >
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Project summary */}
      <div
        style={{
          background: "#EEF4FF",
          border: "1px solid #B8D0E8",
          borderRadius: "10px",
          padding: "18px 20px",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "13px",
            letterSpacing: "1px",
            color: "#1B4F8A",
            textTransform: "uppercase",
            marginBottom: "10px",
          }}
        >
          Project Summary
        </div>
        <div style={{ fontSize: "16px", fontWeight: 600, color: "#1E3A8A", marginBottom: "4px" }}>
          {(project as any).title}
        </div>
        <div style={{ fontSize: "13px", color: "#1B4F8A" }}>
          {(project as any).category?.replaceAll("_", " ")} ·{" "}
          {(project as any).location_general}
        </div>
      </div>

      {/* Disclaimer */}
      <div
        style={{
          background: "#1E3A8A",
          border: "1px solid #1B4F8A",
          borderRadius: "10px",
          padding: "18px 20px",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "12px",
            letterSpacing: "1px",
            color: "#B8D0E8",
            textTransform: "uppercase",
            marginBottom: "10px",
          }}
        >
          Terms You Acknowledged at Submission
        </div>
        <pre
          style={{
            fontSize: "11px",
            color: "#7A9CC4",
            lineHeight: 1.65,
            whiteSpace: "pre-wrap",
            fontFamily: "'Barlow', sans-serif",
            margin: 0,
          }}
        >
          {CLIENT_EMERGENCY_REQUEST.text}
        </pre>
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
              ? "Your credits cover the full emergency fee — no card required."
              : `Applying your credits reduces the card charge to ${fmt(afterCredits)}.`}
          </p>
          <form action={createEmergencyCheckout.bind(null, projectId)}>
            <input type="hidden" name="apply_credits" value="1" />
            <button
              type="submit"
              style={{
                width: "100%",
                background: "#15803D",
                color: "#fff",
                border: "none",
                padding: "14px",
                borderRadius: "8px",
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: "18px",
                letterSpacing: "1px",
                cursor: "pointer",
              }}
            >
              {fullCover
                ? `Pay with Credits — $0 Charged`
                : `Apply ${fmt(creditsToApply)} Credits + Pay ${fmt(afterCredits)}`}
            </button>
          </form>
        </div>
      )}

      {/* Full price pay button */}
      {availableCredits > 0 && (
        <p style={{ fontSize: "12px", color: "#4A7FB5", textAlign: "center", marginBottom: "8px" }}>
          — or pay the full amount —
        </p>
      )}
      <form action={createEmergencyCheckout.bind(null, projectId)}>
        <button
          type="submit"
          style={{
            width: "100%",
            background: availableCredits > 0 ? "transparent" : "#C2410C",
            color: availableCredits > 0 ? "#C2410C" : "#FFFFFF",
            border: availableCredits > 0 ? "1px solid #C2410C" : "none",
            padding: "16px",
            borderRadius: "8px",
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "20px",
            letterSpacing: "1px",
            cursor: "pointer",
          }}
        >
          🚨 Pay {fmt(EMERGENCY_FEE_CENTS)} — Activate Emergency Bid
        </button>
      </form>

      <p
        style={{
          fontSize: "11px",
          color: "#4A7FB5",
          textAlign: "center",
          marginTop: "10px",
          lineHeight: 1.6,
        }}
      >
        You will be redirected to Stripe to complete payment securely.{" "}
        {fmt(EMERGENCY_FEE_CENTS)} is charged immediately and is non-refundable.
      </p>

      {/* Downgrade option */}
      <div
        style={{
          borderTop: "1px solid #B8D0E8",
          paddingTop: "20px",
          marginTop: "20px",
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: "13px", color: "#4A7FB5", marginBottom: "12px" }}>
          Changed your mind? You can convert this to a free standard bid request instead.
        </p>
        <form action={downgradeToStandard.bind(null, projectId)}>
          <button
            type="submit"
            style={{
              background: "transparent",
              color: "#1B4F8A",
              border: "1px solid #B8D0E8",
              padding: "10px 24px",
              borderRadius: "6px",
              fontFamily: "'Barlow', sans-serif",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            Convert to Standard Bid (Free)
          </button>
        </form>
        <p style={{ fontSize: "11px", color: "#4A7FB5", marginTop: "8px" }}>
          Project becomes a regular draft — normal 5–10 day sealed bidding window. No charge.
        </p>
      </div>
    </div>
  );
}
