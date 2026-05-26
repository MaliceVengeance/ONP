import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { PROJECT_CATEGORIES } from "@/lib/projects/categories";
import { updateDraftProject, publishProject, repostProject } from "../actions";
import DeleteProjectButton from "./DeleteProjectButton";
import CountdownTimer from "@/components/CountdownTimer";
import { stateBadge } from "@/lib/ui";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user, role } = await requireRole(["CLIENT", "ADMIN"]);
  const { id } = await params;

  const { data: project, error } = await supabaseAdmin
    .from("projects")
    .select(
      "id,title,description,category,city,location_general,zip_code,state,deadline_at,published_at,max_open_days,emergency_bid_mode,is_emergency,client_id"
    )
    .eq("id", id)
    .single();

  if (error || !project) throw new Error("Project not found");

  // Enforce ownership: clients can only view their own projects
  if (role !== "ADMIN" && project.client_id !== user.id) {
    throw new Error("Not authorized");
  }

  // Check for unanswered RFIs
  const { count: unansweredRfiCount } = await supabaseAdmin
    .from("rfis")
    .select("id", { count: "exact", head: true })
    .eq("project_id", id)
    .is("response", null);

  // Check inspector request status (exclude FAILED rows; pick most recent active one)
  const { data: inspectorAssignment } = await supabaseAdmin
    .from("project_inspector_assignments")
    .select("request_status, payment_status")
    .eq("project_id", id)
    .neq("payment_status", "FAILED")
    .order("requested_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Check bid count (used to decide if deletion is allowed)
  const { count: bidCount } = await supabaseAdmin
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
  const isPendingPayment = project.state === "PENDING_PAYMENT";
  const isPublished = !isDraft && !isPendingPayment;
  const canDelete =
    project.state === "DRAFT" ||
    project.state === "PENDING_PAYMENT" ||
    (project.state === "OPEN" && (bidCount ?? 0) === 0);

  const deadline = project.deadline_at ? new Date(project.deadline_at) : null;
  const now = new Date();
  const deadlinePassed = !!deadline && deadline.getTime() <= now.getTime();
  const isEmergencyBidMode = !!(project as any).emergency_bid_mode;
  const isEmergencyPaid = !!(project as any).is_emergency;
  const bidsUnlocked = deadlinePassed || project.state !== "OPEN" || isEmergencyBidMode || isEmergencyPaid;
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

          {canDelete && <DeleteProjectButton projectId={id} />}

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

      {/* Pending payment banner */}
      {isPendingPayment && (
        <div style={{
          background: "#1A0D00",
          border: "1px solid #C2410C",
          borderRadius: "12px",
          padding: "20px 24px",
          marginBottom: "24px",
        }}>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "18px",
            letterSpacing: "1px",
            color: "#FDBA74",
            textTransform: "uppercase",
            marginBottom: "8px",
          }}>
            🚨 Payment Required to Activate
          </div>
          <p style={{ fontSize: "13px", color: "#FED7AA", lineHeight: 1.6, marginBottom: "16px" }}>
            Your emergency bid request is saved but not yet live. Pay $10 to activate it — contractors will be notified immediately and bids will be visible as they come in.
          </p>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <a
              href={`/dashboard/client/projects/${id}/emergency-pay`}
              style={{
                background: "#C2410C",
                color: "#FFFFFF",
                border: "none",
                padding: "12px 24px",
                borderRadius: "6px",
                fontFamily: "'Barlow', sans-serif",
                fontWeight: 700,
                fontSize: "14px",
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              🚨 Pay $10 — Activate Now
            </a>
            <a
              href={`/dashboard/client/projects/${id}/emergency-pay`}
              style={{
                background: "transparent",
                color: "#FED7AA",
                border: "1px solid #C2410C",
                padding: "12px 20px",
                borderRadius: "6px",
                fontFamily: "'Barlow', sans-serif",
                fontSize: "13px",
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              Convert to Standard (Free)
            </a>
          </div>
          <p style={{ fontSize: "11px", color: "#9A6840", marginTop: "10px" }}>
            The "Convert to Standard" option is available on the payment page.
          </p>
        </div>
      )}

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
            {bidsUnlocked
            ? (isEmergencyBidMode || isEmergencyPaid) && !deadlinePassed
              ? "🚨 View Bids (Emergency — Live)"
              : "✅ View Bids (Unlocked)"
            : "🔒 View Bids (Locked)"}
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
              ⏰ Modify Deadline
            </Link>
          )}
        </div>
      )}

      {!bidsUnlocked && isPublished && (
        <p style={{ fontSize: "12px", color: "#4A7FB5", marginBottom: "20px" }}>
          Bids are sealed until the deadline passes.
        </p>
      )}

      {/* Files callout — shown on draft and published projects */}
      {(isDraft || isPublished) && (
        <div style={{
          background: "#F0F6FF",
          border: "1px solid #1B4F8A",
          borderRadius: "10px",
          padding: "16px 20px",
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          flexWrap: "wrap",
        }}>
          <div>
            <div style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: "16px",
              color: "#0A1628",
              marginBottom: "4px",
            }}>
              📁 Project Files
            </div>
            <div style={{ fontSize: "12px", color: "#1B4F8A", lineHeight: 1.5 }}>
              {isDraft
                ? "Upload photos, blueprints, or documents so contractors understand the full scope of work."
                : `${(bidCount ?? 0) > 0 ? "Contractors can view your uploaded files while preparing their bids." : "Adding photos or documents may help attract more bids and clarify scope."}`}
            </div>
          </div>
          <a
            href={`/dashboard/client/projects/${id}/files`}
            style={{
              background: "#1B4F8A",
              color: "#fff",
              border: "none",
              padding: "10px 20px",
              borderRadius: "6px",
              fontFamily: "'Barlow', sans-serif",
              fontWeight: 600,
              fontSize: "13px",
              textDecoration: "none",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            Add / View Files
          </a>
        </div>
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
          {isDraft
            ? "Edit your project before publishing."
            : isPendingPayment
            ? "Complete payment to activate this emergency request."
            : "Published projects cannot be edited."}
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

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
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
              <div>
                <label style={labelStyle}>Zip Code</label>
                <input
                  name="zip_code"
                  defaultValue={project.zip_code ?? ""}
                  style={inputStyle}
                  placeholder="e.g. 85001"
                  maxLength={10}
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
      {isPendingPayment ? null : isDraft ? (
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
