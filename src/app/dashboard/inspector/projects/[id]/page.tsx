import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { submitTakeoffReport } from "./actions";
import { stateBadge } from "@/lib/ui";

export default async function InspectorProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { supabase } = await requireRole(["INSPECTOR", "ADMIN"]);
  const { id: assignmentId } = await params;

  const { data: assignment, error } = await supabase
    .from("project_inspector_assignments")
    .select("id, project_id, request_status, assigned_at, takeoff_report, takeoff_completed_at, notes")
    .eq("id", assignmentId)
    .single();

  if (error || !assignment) {
    return (
      <div style={{ maxWidth: "700px" }}>
        <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "32px", color: "#fff" }}>
          Assignment Not Found
        </h1>
        <Link href="/dashboard/inspector/projects" style={{ color: "#7A9CC4", textDecoration: "underline", fontSize: "13px", display: "block", marginTop: "16px" }}>
          ← Back
        </Link>
      </div>
    );
  }

  const { data: project } = await supabase
    .from("projects")
    .select("id, title, description, category, city, location_general, state, deadline_at")
    .eq("id", assignment.project_id)
    .single();

  const isCompleted = assignment.request_status === "COMPLETED";

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
    <div style={{ maxWidth: "700px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h1 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "36px",
            letterSpacing: "1px",
            color: "#fff",
            margin: 0,
          }}>
            {project?.title ?? "Untitled Project"}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "8px" }}>
            <span style={{ fontSize: "13px", color: "#7A9CC4" }}>
              {project?.category ?? "—"} • {project?.city ?? "—"}
            </span>
            {project && <span style={stateBadge(project.state)}>{project.state}</span>}
          </div>
        </div>
        <Link
          href="/dashboard/inspector/projects"
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

      {/* Project details */}
      <div style={{
        background: "#0F2040",
        border: "1px solid #1B4F8A",
        borderRadius: "12px",
        padding: "20px",
        marginBottom: "16px",
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
          Project Details
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
          <div>
            <div style={{ fontSize: "11px", color: "#7A9CC4", textTransform: "uppercase", letterSpacing: "1px" }}>Location</div>
            <div style={{ fontSize: "13px", color: "#F0F4FF", marginTop: "2px" }}>{project?.location_general ?? "—"}</div>
          </div>
          <div>
            <div style={{ fontSize: "11px", color: "#7A9CC4", textTransform: "uppercase", letterSpacing: "1px" }}>Deadline</div>
            <div style={{ fontSize: "13px", color: "#F0F4FF", marginTop: "2px" }}>
              {project?.deadline_at ? new Date(project.deadline_at).toLocaleDateString() : "—"}
            </div>
          </div>
        </div>
        {project?.description && (
          <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #1B4F8A" }}>
            <div style={{ fontSize: "11px", color: "#7A9CC4", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>Description</div>
            <div style={{ fontSize: "13px", color: "#F0F4FF", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{project.description}</div>
          </div>
        )}
      </div>

      {/* Takeoff report */}
      {isCompleted ? (
        <div style={{
          background: "#0F2040",
          border: "1px solid #166534",
          borderRadius: "12px",
          padding: "24px",
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
            ✅ Takeoff Completed
          </h2>
          {assignment.takeoff_completed_at && (
            <div style={{ fontSize: "12px", color: "#7A9CC4", marginBottom: "12px" }}>
              Submitted: {new Date(assignment.takeoff_completed_at).toLocaleDateString()}
            </div>
          )}
          <div style={{
            background: "#0A1628",
            border: "1px solid #1B4F8A",
            borderRadius: "8px",
            padding: "16px",
            fontSize: "13px",
            color: "#F0F4FF",
            lineHeight: 1.7,
            whiteSpace: "pre-wrap",
          }}>
            {assignment.takeoff_report}
          </div>
        </div>
      ) : (
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
            Submit Takeoff Report
          </h2>
          <p style={{ fontSize: "12px", color: "#7A9CC4", marginBottom: "16px" }}>
            Document your findings from the site visit. Be as detailed as possible.
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