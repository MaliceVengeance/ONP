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

  const inputStyle = {
    width: "100%",
    background: "#0A1628",
    border: "1px solid #1B4F8A",
    color: "#F0F4FF",
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
            color: "#fff",
            margin: 0,
          }}>
            Deadline Extension
          </h1>
          <p style={{ fontSize: "13px", color: "#7A9CC4", marginTop: "4px" }}>
            {project?.title ?? "Untitled"}
          </p>
        </div>
        <Link
          href={`/dashboard/client/projects/${projectId}`}
          style={{
            background: "transparent",
            color: "#7A9CC4",
            border: "1px solid #1B4F8A",
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
        background: "#0F2040",
        border: "1px solid #1B4F8A",
        borderRadius: "12px",
        padding: "20px",
        marginBottom: "20px",
      }}>
        <h2 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: "16px",
          letterSpacing: "1px",
          color: "#fff",
          textTransform: "uppercase",
          marginBottom: "12px",
        }}>
          Current Deadline
        </h2>
        <div style={{ fontSize: "24px", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, color: "#fff" }}>
          {deadline ? deadline.toLocaleDateString() : "—"}
        </div>
        <div style={{ fontSize: "13px", color: "#7A9CC4", marginTop: "4px" }}>
          Project state: {project?.state ?? "—"}
        </div>
      </div>

      {/* Override approved */}
      {isOverridden && (
        <div style={{
          background: "#0D3320",
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
            color: "#4ADE80",
            textTransform: "uppercase",
            marginBottom: "8px",
          }}>
            ✅ Extension Approved
          </h2>
          <div style={{ fontSize: "13px", color: "#7A9CC4" }}>
            Your deadline extension has been approved by an admin.
          </div>
          {project?.urgent_reason && (
            <div style={{ fontSize: "13px", color: "#F0F4FF", marginTop: "8px" }}>
              <span style={{ color: "#7A9CC4" }}>Reason: </span>
              {project.urgent_reason}
            </div>
          )}
        </div>
      )}

      {/* Already requested */}
      {hasRequested && !isOverridden && (
        <div style={{
          background: "#2D2000",
          border: "1px solid #92400E",
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "20px",
        }}>
          <h2 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "18px",
            letterSpacing: "1px",
            color: "#FBBF24",
            textTransform: "uppercase",
            marginBottom: "8px",
          }}>
            ⏳ Request Pending
          </h2>
          <div style={{ fontSize: "13px", color: "#7A9CC4" }}>
            Your extension request is being reviewed by an admin.
          </div>
          <div style={{ fontSize: "13px", color: "#F0F4FF", marginTop: "8px" }}>
            <span style={{ color: "#7A9CC4" }}>Submitted: </span>
            {new Date(project.override_requested_at!).toLocaleDateString()}
          </div>
          <div style={{ fontSize: "13px", color: "#F0F4FF", marginTop: "4px" }}>
            <span style={{ color: "#7A9CC4" }}>Reason: </span>
            {project.override_requested_reason}
          </div>
        </div>
      )}

      {/* Request form */}
      {!hasRequested && !isOverridden && (
        <div style={{
          background: "#0F2040",
          border: "1px solid #1B4F8A",
          borderRadius: "12px",
          padding: "24px",
        }}>
          <h2 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "18px",
            letterSpacing: "1px",
            color: "#fff",
            textTransform: "uppercase",
            marginBottom: "4px",
          }}>
            Request Extension
          </h2>
          <p style={{ fontSize: "12px", color: "#7A9CC4", marginBottom: "16px" }}>
            Explain why you need more time. An admin will review and may approve a new deadline.
          </p>

          <form action={requestDeadlineOverride.bind(null, projectId)}>
            <label style={{
              display: "block",
              fontSize: "11px",
              fontWeight: 500,
              color: "#7A9CC4",
              textTransform: "uppercase",
              letterSpacing: "1px",
              marginBottom: "6px",
            }}>
              Reason for Extension
            </label>
            <textarea
              name="reason"
              style={{ ...inputStyle, minHeight: "120px", resize: "vertical" }}
              placeholder="e.g. Additional contractors need more time to review the scope. We would like to extend the deadline by 3 days."
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