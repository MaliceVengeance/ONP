import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { PROJECT_CATEGORIES } from "@/lib/projects/categories";
import { updateDraftProject, publishProject, repostProject, deleteProject } from "../actions";
import CountdownTimer from "@/components/CountdownTimer";
import { stateBadge } from "@/lib/ui";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { supabase } = await requireRole(["CLIENT", "ADMIN"]);
  const { id } = await params;

  const { data: project, error } = await supabase
    .from("projects")
    .select(
      "id,title,description,category,city,location_general,state,deadline_at,published_at,max_open_days"
    )
    .eq("id", id)
    .single();

  if (error) throw error;

  // Check for unanswered RFIs
  const { count: unansweredRfiCount } = await supabase
    .from("rfis")
    .select("id", { count: "exact", head: true })
    .eq("project_id", id)
    .is("response", null);

  // Check inspector request status
  const { data: inspectorAssignment } = await supabase
    .from("project_inspector_assignments")
    .select("request_status")
    .eq("project_id", id)
    .maybeSingle();

  // Check bid count (used to decide if deletion is allowed)
  const { count: bidCount } = await supabase
    .from("bids")
    .select("id", { count: "exact", head: true })
    .eq("project_id", id);

  const locParts = String(project.location_general ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const defaultCity = project.city ?? locParts[0] ?? "";
  const defaultState = locParts[1] ?? "";

  const isDraft = project.state === "DRAFT";
  const isPublished = !isDraft;
  const canDelete =
    project.state === "DRAFT" ||
    (project.state === "OPEN" && (bidCount ?? 0) === 0);

  const deadline = project.deadline_at ? new Date(project.deadline_at) : null;
  const now = new Date();
  const deadlinePassed = !!deadline && deadline.getTime() <= now.getTime();
  const bidsUnlocked = deadlinePassed || project.state !== "OPEN";
  const hasUnansweredRfis = (unansweredRfiCount ?? 0) > 0;

  const inspectorStatus = inspectorAssignment?.request_status ?? null;

  function inspectorButtonStyle() {
    switch (inspectorStatus) {
      case "COMPLETED":
        return { background: "#F0FDF4", color: "#15803D", border: "1px solid #166534" };
      case "ASSIGNED":
        return { background: "#EEF4FF", color: "#1B4F8A", border: "1px solid #B8D0E8" };
      case "PENDING":
        return { background: "#FFFBEB", color: "#92400E", border: "1px solid #FCD34D" };
      default:
        return { background: "transparent", color: "#1B4F8A", border: "1px solid #B8D0E8" };
    }
  }

  function inspectorButtonLabel() {
    switch (inspectorStatus) {
      case "COMPLETED": return "🔍 Takeoff Complete";
      case "ASSIGNED": return "🔍 Inspector Assigned";
      case "PENDING": return "🔍 Inspector Requested";
      default: return "🔍 Inspector";
    }
  }

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

  const labelStyle = {
    display: "block",
    fontSize: "11px",
    fontWeight: 500,
    color: "#1B4F8A",
    textTransform: "uppercase" as const,
    letterSpacing: "1px",
    marginTop: "16px",
  };

  return (
    <div style={{ maxWidth: "600px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h1 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "36px",
            letterSpacing: "1px",
            color: "#0A1628",
            margin: 0,
          }}>
            {isDraft ? "Edit Draft" : project.title ?? "Project"}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "8px" }}>
            <span style={stateBadge(project.state)}>{project.state}</span>
            {isPublished && project.deadline_at && (
              <span style={{ fontSize: "13px", color: "#1B4F8A" }}>
                Deadline: {new Date(project.deadline_at).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <form action={repostProject.bind(null, id)}>
            <button
              type="submit"
              style={{
                background: "transparent",
                color: "#1B4F8A",
                border: "1px solid #B8D0E8",
                padding: "8px 16px",
                borderRadius: "6px",
                fontFamily: "'Barlow', sans-serif",
                fontSize: "13px",
                cursor: "pointer",
              }}
              title="Creates a new draft copy with a new bidding window"
            >
              Repost
            </button>
          </form>

          {canDelete && (
            <form
              action={deleteProject.bind(null, id)}
              onSubmit={(e) => {
                if (!confirm("Are you sure you want to remove this project? This cannot be undone.")) {
                  e.preventDefault();
                }
              }}
            >
              <button
                type="submit"
                style={{
                  background: "#FEF2F2",
                  color: "#991B1B",
                  border: "1px solid #FCA5A5",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  fontFamily: "'Barlow', sans-serif",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Remove
              </button>
            </form>
          )}

          <Link
            href="/dashboard/client/projects"
            style={{
              background: "transparent",
              color: "#1B4F8A",
              border: "1px solid #B8D0E8",
              padding: "8px 16px",
              borderRadius: "6px",
              fontFamily: "'Barlow', sans-serif",
              fontSize: "13px",
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            Back
          </Link>
        </div>
      </div>

      {/* Countdown timer */}
      {isPublished && project.deadline_at && project.state === "OPEN" && (
        <div style={{ marginBottom: "20px" }}>
          <CountdownTimer deadline={project.deadline_at} />
        </div>
      )}

      {/* Action buttons */}
      {isPublished && (
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "24px" }}>
          <Link
            href={`/dashboard/client/projects/${id}/bids`}
            style={{
              background: bidsUnlocked ? "#C8102E" : "#EEF4FF",
              color: bidsUnlocked ? "#fff" : "#1B4F8A",
              border: `1px solid ${bidsUnlocked ? "#C8102E" : "#B8D0E8"}`,
              padding: "10px 20px",
              borderRadius: "6px",
              fontFamily: "'Barlow', sans-serif",
              fontWeight: 600,
              fontSize: "13px",
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            {bidsUnlocked ? "✅ View Bids (Unlocked)" : "🔒 View Bids (Locked)"}
          </Link>

          <Link
            href={`/dashboard/client/projects/${id}/rfis`}
            style={{
              background: hasUnansweredRfis ? "#FFFBEB" : "transparent",
              color: hasUnansweredRfis ? "#92400E" : "#1B4F8A",
              border: `1px solid ${hasUnansweredRfis ? "#FCD34D" : "#B8D0E8"}`,
              padding: "10px 20px",
              borderRadius: "6px",
              fontFamily: "'Barlow', sans-serif",
              fontSize: "13px",
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            {hasUnansweredRfis
              ? `⚠ Questions (${unansweredRfiCount} pending)`
              : "Questions (RFIs)"}
          </Link>

          <Link
            href={`/dashboard/client/projects/${id}/files`}
            style={{
              background: "transparent",
              color: "#1B4F8A",
              border: "1px solid #B8D0E8",
              padding: "10px 20px",
              borderRadius: "6px",
              fontFamily: "'Barlow', sans-serif",
              fontSize: "13px",
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            📁 Files
          </Link>

          <Link
            href={`/dashboard/client/projects/${id}/inspector`}
            style={{
              padding: "10px 20px",
              borderRadius: "6px",
              fontFamily: "'Barlow', sans-serif",
              fontSize: "13px",
              textDecoration: "none",
              display: "inline-block",
              ...inspectorButtonStyle(),
            }}
          >
            {inspectorButtonLabel()}
          </Link>

          {project.state === "OPEN" && (
            <Link
              href={`/dashboard/client/projects/${id}/override`}
              style={{
                background: "transparent",
                color: "#1B4F8A",
                border: "1px solid #B8D0E8",
                padding: "10px 20px",
                borderRadius: "6px",
                fontFamily: "'Barlow', sans-serif",
                fontSize: "13px",
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              ⏰ Request Extension
            </Link>
          )}
        </div>
      )}

      {!bidsUnlocked && isPublished && (
        <p style={{ fontSize: "12px", color: "#4A7FB5", marginBottom: "20px" }}>
          Bids are sealed until the deadline passes.
        </p>
      )}

      {/* Edit form */}
      <div style={{
        background: "#EEF4FF",
        border: "1px solid #B8D0E8",
        borderRadius: "12px",
        padding: "24px",
        marginBottom: "20px",
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
          Project Details
        </h2>
        <p style={{ fontSize: "12px", color: "#1B4F8A", marginBottom: "16px" }}>
          {isDraft ? "Edit your project before publishing." : "Published projects cannot be edited."}
        </p>

        <form action={updateDraftProject.bind(null, id)}>
          <fieldset disabled={!isDraft} style={{ border: "none", padding: 0, opacity: isDraft ? 1 : 0.5 }}>
            <label style={{ ...labelStyle, marginTop: 0 }}>Title</label>
            <input
              name="title"
              defaultValue={project.title ?? ""}
              style={inputStyle}
              required
            />

            <label style={labelStyle}>Category</label>
            <select
              name="category"
              defaultValue={project.category ?? ""}
              style={inputStyle}
              required
            >
              <option value="">Select…</option>
              {PROJECT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.replaceAll("_", " ")}
                </option>
              ))}
            </select>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={labelStyle}>City</label>
                <input
                  name="city"
                  defaultValue={defaultCity}
                  style={inputStyle}
                  required
                />
              </div>
              <div>
                <label style={labelStyle}>State</label>
                <input
                  name="us_state"
                  defaultValue={defaultState}
                  style={inputStyle}
                  required
                  placeholder="TX"
                />
              </div>
            </div>

            <label style={labelStyle}>Description</label>
            <textarea
              name="description"
              defaultValue={project.description ?? ""}
              style={{ ...inputStyle, minHeight: "120px", resize: "vertical" }}
              rows={6}
            />

            {isDraft && (
              <button
                type="submit"
                style={{
                  marginTop: "20px",
                  background: "transparent",
                  color: "#1B4F8A",
                  border: "1px solid #B8D0E8",
                  padding: "10px 20px",
                  borderRadius: "6px",
                  fontFamily: "'Barlow', sans-serif",
                  fontWeight: 500,
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Save Draft
              </button>
            )}
          </fieldset>
        </form>
      </div>

      {/* Publish controls */}
      {isDraft ? (
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
            Publish to Contractors
          </h2>
          <p style={{ fontSize: "13px", color: "#1B4F8A", marginBottom: "20px" }}>
            Choose how long bidding stays open. Minimum 5 days, maximum 10 days.
          </p>

          <form action={publishProject.bind(null, id)}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <label style={{
                fontSize: "11px",
                fontWeight: 500,
                color: "#1B4F8A",
                textTransform: "uppercase",
                letterSpacing: "1px",
                flexShrink: 0,
              }}>
                Bid Duration
              </label>
              <select
                name="bid_days"
                defaultValue="7"
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #B8D0E8",
                  color: "#0A1628",
                  borderRadius: "6px",
                  padding: "8px 12px",
                  fontFamily: "'Barlow', sans-serif",
                  fontSize: "14px",
                  outline: "none",
                }}
              >
                {[5, 6, 7, 8, 9, 10].map((d) => (
                  <option key={d} value={d}>{d} days</option>
                ))}
              </select>

              <button
                type="submit"
                style={{
                  marginLeft: "auto",
                  background: "#C8102E",
                  color: "#fff",
                  border: "none",
                  padding: "10px 24px",
                  borderRadius: "6px",
                  fontFamily: "'Barlow', sans-serif",
                  fontWeight: 600,
                  fontSize: "13px",
                  letterSpacing: "0.5px",
                  cursor: "pointer",
                }}
              >
                Publish Project
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div style={{
          background: "#EEF4FF",
          border: "1px solid #B8D0E8",
          borderRadius: "12px",
          padding: "20px",
          fontSize: "13px",
          color: "#1B4F8A",
        }}>
          This project is published. Edits will trigger a revision workflow in a future update.
        </div>
      )}
    </div>
  );
}
