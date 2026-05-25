import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { createEmergencyCheckout, downgradeToStandard } from "./actions";
import { CLIENT_EMERGENCY_REQUEST } from "@/lib/disclaimers/clientEmergencyRequest";

export default async function EmergencyPayPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ canceled?: string }>;
}) {
  const { supabase } = await requireRole(["CLIENT", "ADMIN"]);
  const { id: projectId } = await params;
  const sp = await searchParams;

  const { data: project } = await supabase
    .from("projects")
    .select("id, title, category, state, is_emergency, city, location_general")
    .eq("id", projectId)
    .single();

  if (!project || (project as any).state !== "PENDING_PAYMENT") {
    return (
      <div style={{ maxWidth: "600px" }}>
        <div style={{
          background: "#FEF2F2",
          border: "1px solid #FCA5A5",
          borderRadius: "10px",
          padding: "24px",
          color: "#991B1B",
          fontSize: "14px",
        }}>
          This project is not awaiting payment. It may have already been activated or cancelled.
        </div>
        <Link
          href="/dashboard/client/projects"
          style={{ fontSize: "13px", color: "#1B4F8A", textDecoration: "underline", display: "block", marginTop: "16px" }}
        >
          ← Back to Projects
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "600px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px" }}>
        <div>
          <h1 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "36px",
            letterSpacing: "1px",
            color: "#0A1628",
            margin: 0,
          }}>
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
        <div style={{
          background: "#FFFBEB",
          border: "1px solid #FCD34D",
          borderRadius: "8px",
          padding: "14px 18px",
          marginBottom: "20px",
          fontSize: "13px",
          color: "#92400E",
        }}>
          ⚠ Checkout was canceled. Your project is still in draft — you can pay now or convert it to a standard bid.
        </div>
      )}

      {/* What you're getting */}
      <div style={{
        background: "#7C1A00",
        border: "1px solid #C2410C",
        borderRadius: "12px",
        padding: "24px",
        marginBottom: "20px",
      }}>
        <div style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: "14px",
          letterSpacing: "1px",
          color: "#FDBA74",
          textTransform: "uppercase",
          marginBottom: "12px",
        }}>
          🚨 Emergency Bid Request
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "16px" }}>
          <span style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "48px",
            color: "#FFFFFF",
            lineHeight: 1,
          }}>
            $10
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
            <li key={item} style={{ fontSize: "13px", color: "#FED7AA", lineHeight: 1.7, marginBottom: "4px" }}>
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Project summary */}
      <div style={{
        background: "#EEF4FF",
        border: "1px solid #B8D0E8",
        borderRadius: "10px",
        padding: "18px 20px",
        marginBottom: "20px",
      }}>
        <div style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: "13px",
          letterSpacing: "1px",
          color: "#1B4F8A",
          textTransform: "uppercase",
          marginBottom: "10px",
        }}>
          Project Summary
        </div>
        <div style={{ fontSize: "16px", fontWeight: 600, color: "#0A1628", marginBottom: "4px" }}>
          {(project as any).title}
        </div>
        <div style={{ fontSize: "13px", color: "#1B4F8A" }}>
          {(project as any).category?.replaceAll("_", " ")} · {(project as any).location_general}
        </div>
      </div>

      {/* Disclaimer (already acknowledged at project creation — shown for reference) */}
      <div style={{
        background: "#0A1628",
        border: "1px solid #1B4F8A",
        borderRadius: "10px",
        padding: "18px 20px",
        marginBottom: "20px",
      }}>
        <div style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: "12px",
          letterSpacing: "1px",
          color: "#B8D0E8",
          textTransform: "uppercase",
          marginBottom: "10px",
        }}>
          Terms You Acknowledged at Submission
        </div>
        <pre style={{
          fontSize: "11px",
          color: "#7A9CC4",
          lineHeight: 1.65,
          whiteSpace: "pre-wrap",
          fontFamily: "'Barlow', sans-serif",
          margin: 0,
        }}>
          {CLIENT_EMERGENCY_REQUEST.text}
        </pre>
      </div>

      {/* Pay button */}
      <form action={createEmergencyCheckout.bind(null, projectId)}>
        <button
          type="submit"
          style={{
            width: "100%",
            background: "#C2410C",
            color: "#FFFFFF",
            border: "none",
            padding: "16px",
            borderRadius: "8px",
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "20px",
            letterSpacing: "1px",
            cursor: "pointer",
          }}
        >
          🚨 Pay $10 — Activate Emergency Bid
        </button>
      </form>

      <p style={{ fontSize: "11px", color: "#4A7FB5", textAlign: "center", marginTop: "10px", lineHeight: 1.6 }}>
        You will be redirected to Stripe to complete payment securely. $10 is charged immediately and is non-refundable.
      </p>

      {/* Downgrade option */}
      <div style={{
        borderTop: "1px solid #B8D0E8",
        paddingTop: "20px",
        marginTop: "20px",
        textAlign: "center",
      }}>
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
