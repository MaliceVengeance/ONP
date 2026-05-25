import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { requestDeadlineOverride } from "./actions";

export default async function ClientOverridePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { supabase } = await requireRole(["CLIENT", "ADMIN"]);
  const { id: projectId } = await params;

  const { data: project } = await supabase
    .from("projects")
    .select("id, title, state, deadline_at, override_requested_at, override_requested_reason, urgent_override, urgent_reason")
    .eq("id", projectId)
    .single();

  const deadline = project?.deadline_at ? new Date(project.deadline_at) : null;
  const hasRequested = !!project?.override_requested_at;
  const isOverridden = !!project?.urgent_override;

  // Detect whether an approved request was a shorten or extend
  const approvedReason = project?.urgent_reason ?? "";

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
    <div style={{ maxWidth: "600px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
        <div>
          <h1 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "36px",
            letterSpacing: "1px",
            color: "#0A1628",
            margin: 0,
          }}>
            Modify Deadline
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
          Back
        </Link>
      </div>

      {/* Current deadline */}
      <div style={{
        background: "#EEF4FF",
        border: "1px solid #B8D0E8",
        borderRadius: "12px",
        padding: "20px",
        marginBottom: "20px",
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
          Current Deadline
        </h2>
        <div style={{ fontSize: "24px", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, color: "#0A1628" }}>
          {deadline ? deadline.toLocaleDateString() : "—"}
        </div>
        <div style={{ fontSize: "13px", color: "#1B4F8A", marginTop: "4px" }}>
          Project state: {project?.state ?? "—"}
        </div>
      </div>

      {/* Override approved */}
      {isOverridden && (
        <div style={{
          background: "#F0FDF4",
          border: "1px solid #166534",
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "20px",
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
            ✅ Request Approved
          </h2>
          <div style={{ fontSize: "13px", color: "#1B4F8A" }}>
            Your deadline modification has been approved by an admin.
          </div>
          {approvedReason && (
            <div style={{ fontSize: "13px", color: "#0A1628", marginTop: "8px" }}>
              <span style={{ color: "#1B4F8A" }}>Reason: </span>
              {approvedReason}
            </div>
          )}
        </div>
      )}

      {/* Already requested */}
      {hasRequested && !isOverridden && (
        <div style={{
          background: "#FFFBEB",
          border: "1px solid #FCD34D",
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "20px",
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
            ⏳ Request Pending
          </h2>
          <div style={{ fontSize: "13px", color: "#1B4F8A" }}>
            Your request is being reviewed by an admin.
          </div>
          <div style={{ fontSize: "13px", color: "#0A1628", marginTop: "8px" }}>
            <span style={{ color: "#1B4F8A" }}>Submitted: </span>
            {new Date(project!.override_requested_at!).toLocaleDateString()}
          </div>
          <div style={{ fontSize: "13px", color: "#0A1628", marginTop: "4px" }}>
            <span style={{ color: "#1B4F8A" }}>Request: </span>
            {project!.override_requested_reason}
          </div>
        </div>
      )}

      {/* Request form */}
      {!hasRequested && !isOverridden && (
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
            Request Deadline Change
          </h2>
          <p style={{ fontSize: "12px", color: "#1B4F8A", marginBottom: "20px" }}>
            Choose the type of change you need and explain why. An admin will review your request.
          </p>

          <form action={requestDeadlineOverride.bind(null, projectId)}>
            {/* Request type */}
            <div style={{ marginBottom: "20px" }}>
              <div style={{
                fontSize: "11px",
                fontWeight: 500,
                color: "#1B4F8A",
                textTransform: "uppercase",
                letterSpacing: "1px",
                marginBottom: "10px",
              }}>
                Type of Request
              </div>

              <label style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                background: "#FFFFFF",
                border: "1px solid #B8D0E8",
                borderRadius: "8px",
                padding: "14px 16px",
                marginBottom: "8px",
                cursor: "pointer",
              }}>
                <input
                  type="radio"
                  name="request_type"
                  value="extend"
                  defaultChecked
                  style={{ marginTop: "2px", accentColor: "#1B4F8A" }}
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: "14px", color: "#0A1628", marginBottom: "2px" }}>
                    ⏰ Extend Deadline
                  </div>
                  <div style={{ fontSize: "12px", color: "#4A7FB5" }}>
                    Need more time to collect bids or give contractors additional review time.
                  </div>
                </div>
              </label>

              <label style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                background: "#FEF2F2",
                border: "1px solid #FCA5A5",
                borderRadius: "8px",
                padding: "14px 16px",
                cursor: "pointer",
              }}>
                <input
                  type="radio"
                  name="request_type"
                  value="emergency_bid"
                  style={{ marginTop: "2px", accentColor: "#C8102E" }}
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: "14px", color: "#991B1B", marginBottom: "2px" }}>
                    🚨 Emergency Bid Request
                  </div>
                  <div style={{ fontSize: "12px", color: "#991B1B" }}>
                    Urgent situation — open bids immediately as contractors submit them instead of waiting for the deadline.
                  </div>
                </div>
              </label>
            </div>

            {/* Emergency bid disclaimer */}
            <div style={{
              background: "#0A1628",
              border: "1px solid #C8102E",
              borderRadius: "10px",
              padding: "18px 20px",
              marginBottom: "20px",
            }}>
              <div style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: "14px",
                letterSpacing: "1px",
                color: "#C8102E",
                textTransform: "uppercase",
                marginBottom: "10px",
              }}>
                ⚠ Emergency Bid Mode — Read Before Proceeding
              </div>
              <p style={{ fontSize: "13px", color: "#FFFFFF", lineHeight: 1.75, marginBottom: "10px" }}>
                If approved, bids on this project will be <strong style={{ color: "#FFFFFF" }}>visible to you as contractors submit them</strong>, rather than remaining sealed until the deadline. The deadline itself does not change — contractors still bid within the original window.
              </p>
              <p style={{ fontSize: "13px", color: "#FFFFFF", lineHeight: 1.75, marginBottom: "10px" }}>
                <strong style={{ color: "#C8102E" }}>Important trade-offs you are accepting:</strong>
              </p>
              <ul style={{ paddingLeft: "20px", marginBottom: "10px" }}>
                <li style={{ fontSize: "13px", color: "#FFFFFF", lineHeight: 1.75, marginBottom: "6px" }}>
                  Contractors bidding on this project will be notified that bids are open and visible. This may cause contractors to <strong style={{ color: "#FFFFFF" }}>anchor to or undercut each other&apos;s numbers</strong>, undermining the independence that sealed bidding is designed to protect.
                </li>
                <li style={{ fontSize: "13px", color: "#FFFFFF", lineHeight: 1.75, marginBottom: "6px" }}>
                  Bids submitted under emergency conditions are <strong style={{ color: "#FFFFFF" }}>generally incomplete and preliminary</strong>. Because no site visit has been conducted and contractors are responding urgently, pricing may reflect worst-case assumptions, missing scope, or significant contingency padding.
                </li>
                <li style={{ fontSize: "13px", color: "#FFFFFF", lineHeight: 1.75, marginBottom: "6px" }}>
                  The blind bidding process exists to protect you from inflated pricing and to give contractors equal footing. Bypassing it carries real financial risk — <strong style={{ color: "#FFFFFF" }}>the lowest emergency bid is not necessarily the best value</strong>, and final costs after site visits may differ materially.
                </li>
                <li style={{ fontSize: "13px", color: "#FFFFFF", lineHeight: 1.75 }}>
                  ONP is not responsible for pricing differences, disputes, or outcomes that arise from bids submitted under emergency conditions. Awarding a contractor based on an emergency bid is done entirely at your own risk.
                </li>
              </ul>
              <p style={{ fontSize: "12px", color: "#B8D0E8", lineHeight: 1.6, fontStyle: "italic" }}>
                Only select this option if your situation genuinely cannot wait for the standard bidding process to run its course.
              </p>
            </div>

            <label style={{
              display: "block",
              fontSize: "11px",
              fontWeight: 500,
              color: "#1B4F8A",
              textTransform: "uppercase",
              letterSpacing: "1px",
              marginBottom: "6px",
            }}>
              Reason / Details
            </label>
            <textarea
              name="reason"
              style={{ ...inputStyle, minHeight: "120px", resize: "vertical" }}
              placeholder="Describe the situation. For a deadline extension: how many extra days are needed and why. For an Emergency Bid Request: what makes this a genuine emergency (e.g. 'storm damage, need repair estimates immediately')…"
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
              Submit Request
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
