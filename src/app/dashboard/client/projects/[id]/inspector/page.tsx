import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { requestInspector } from "./actions";

export default async function ClientInspectorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { supabase } = await requireRole(["CLIENT", "ADMIN"]);
  const { id: projectId } = await params;

  const { data: project } = await supabase
    .from("projects")
    .select("id, title, state")
    .eq("id", projectId)
    .single();

  const { data: assignment } = await supabase
    .from("project_inspector_assignments")
    .select("id, request_status, requested_at, assigned_at, inspector_id, takeoff_report, takeoff_completed_at, notes")
    .eq("project_id", projectId)
    .maybeSingle();

  // Fetch inspector name if assigned
  let inspectorName = null;
  if (assignment?.inspector_id) {
    const { data: inspector } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", assignment.inspector_id)
      .single();
    inspectorName = inspector?.display_name;
  }

  function statusColor(status: string) {
    switch (status) {
      case "PENDING": return { background: "#2D2000", color: "#FBBF24", border: "1px solid #92400E" };
      case "ASSIGNED": return { background: "#0D2040", color: "#60A5FA", border: "1px solid #1D4ED8" };
      case "COMPLETED": return { background: "#0D3320", color: "#4ADE80", border: "1px solid #166534" };
      default: return { background: "#0F2040", color: "#7A9CC4", border: "1px solid #1B4F8A" };
    }
  }

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
            Inspector Takeoff
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

      {/* Info card */}
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
          fontSize: "18px",
          letterSpacing: "1px",
          color: "#fff",
          textTransform: "uppercase",
          marginBottom: "10px",
        }}>
          What is a Takeoff?
        </h2>
        <p style={{ fontSize: "13px", color: "#7A9CC4", lineHeight: 1.7, marginBottom: "8px" }}>
          An ONP inspector will visit your property and create a detailed scope of work. This ensures contractors have accurate information to submit competitive bids.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", color: "#4ADE80" }}>
          <div>✅ Unbiased third-party assessment</div>
          <div>✅ Detailed scope of work document</div>
          <div>✅ Better bids from contractors</div>
          <div>✅ Reduces disputes and surprises</div>
        </div>
      </div>

      {/* Current status */}
      {assignment ? (
        <div style={{
          background: "#0F2040",
          border: "1px solid #1B4F8A",
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "20px",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <h2 style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: "18px",
              letterSpacing: "1px",
              color: "#fff",
              textTransform: "uppercase",
              margin: 0,
            }}>
              Request Status
            </h2>
            <span style={{
              fontSize: "11px",
              fontWeight: 600,
              padding: "4px 10px",
              borderRadius: "20px",
              letterSpacing: "0.5px",
              ...statusColor(assignment.request_status ?? "PENDING"),
            }}>
              {assignment.request_status ?? "PENDING"}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px" }}>
            {assignment.requested_at && (
              <div>
                <span style={{ color: "#7A9CC4" }}>Requested: </span>
                <span style={{ color: "#F0F4FF" }}>{new Date(assignment.requested_at).toLocaleDateString()}</span>
              </div>
            )}
            {inspectorName && (
              <div>
                <span style={{ color: "#7A9CC4" }}>Inspector: </span>
                <span style={{ color: "#F0F4FF" }}>{inspectorName}</span>
              </div>
            )}
            {assignment.assigned_at && (
              <div>
                <span style={{ color: "#7A9CC4" }}>Assigned: </span>
                <span style={{ color: "#F0F4FF" }}>{new Date(assignment.assigned_at).toLocaleDateString()}</span>
              </div>
            )}
            {assignment.notes && (
              <div>
                <span style={{ color: "#7A9CC4" }}>Notes: </span>
                <span style={{ color: "#F0F4FF" }}>{assignment.notes}</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{
          background: "#0F2040",
          border: "1px solid #1B4F8A",
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "20px",
          textAlign: "center",
        }}>
          <div style={{ fontSize: "13px", color: "#7A9CC4", marginBottom: "20px" }}>
            No inspector has been requested yet. Click below to request one.
          </div>
          <form action={requestInspector.bind(null, projectId)}>
            <button
              type="submit"
              style={{
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
              Request Inspector Takeoff
            </button>
          </form>
          <p style={{ fontSize: "11px", color: "#3A5A7A", marginTop: "10px" }}>
            An admin will assign an available inspector to your project.
          </p>
        </div>
      )}

      {/* Takeoff report */}
      {assignment?.takeoff_report && (
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
            marginBottom: "14px",
          }}>
            ✅ Takeoff Report
          </h2>
          {assignment.takeoff_completed_at && (
            <div style={{ fontSize: "12px", color: "#7A9CC4", marginBottom: "12px" }}>
              Completed: {new Date(assignment.takeoff_completed_at).toLocaleDateString()}
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
      )}
    </div>
  );
}