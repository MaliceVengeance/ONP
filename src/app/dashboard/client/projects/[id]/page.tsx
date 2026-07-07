import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { PROJECT_CATEGORIES } from "@/lib/projects/categories";
import { updateDraftProject, publishProject, repostProject, updateProjectRfis } from "../actions";
import DeleteProjectButton from "./DeleteProjectButton";
import CountdownTimer from "@/components/CountdownTimer";
import { stateBadge } from "@/lib/ui";
import { getFeatureFlag, FLAGS } from "@/lib/featureFlags";
import { sendClientMessage } from "./messages/actions";
import { confirmCompletion, dismissCompletionRequest } from "./completion/actions";

export default async function EditProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ qa?: string; completed?: string }>;
}) {
  const { user, role } = await requireRole(["CLIENT", "ADMIN"]);
  const { id } = await params;
  const sp = await searchParams;
  const qaSaved = sp.qa === "saved";
  const justCompleted = sp.completed === "1";

  const { data: project, error } = await supabaseAdmin
    .from("projects")
    .select(
      "id,title,description,category,city,location_general,zip_code,state,deadline_at,published_at,max_open_days,emergency_bid_mode,is_emergency,client_id,inspector_hold_started_at,target_start_date,completion_requested_at"
    )
    .eq("id", id)
    .single();

  if (error || !project) redirect("/dashboard/client/projects");

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

  // Fetch catalog items (client-answerable) and existing pre-answers for this project
  const CLIENT_EXCLUDED_KEYWORDS = [
    "specific question not covered above",
    "additional photos of the area",
    "clarify the scope of work for a specific area",
  ];
  type CatalogItem = { id: string; code: string; prompt: string };

  const [{ data: catalogRaw }, { data: existingRfisRaw }] = await Promise.all([
    supabaseAdmin.from("rfi_catalog").select("id, code, prompt").order("code"),
    supabaseAdmin
      .from("rfis")
      .select("id, catalog_id, response")
      .eq("project_id", id)
      .is("contractor_id", null),
  ]);

  const clientCatalog = ((catalogRaw ?? []) as CatalogItem[]).filter(
    (c) => !CLIENT_EXCLUDED_KEYWORDS.some((kw) =>
      c.prompt.toLowerCase().includes(kw.toLowerCase())
    )
  );

  const existingAnswers = new Map<string, { rfiId: string; response: string | null }>();
  ((existingRfisRaw ?? []) as { id: string; catalog_id: string; response: string | null }[])
    .forEach((r) => existingAnswers.set(r.catalog_id, { rfiId: r.id, response: r.response }));

  const locParts = String(project.location_general ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const defaultCity = project.city ?? locParts[0] ?? "";
  const defaultState = locParts[1] ?? "";

  const completionRequestedAt: string | null = (project as any).completion_requested_at ?? null;

  const isDraft = project.state === "DRAFT";
  const isPendingPayment = project.state === "PENDING_PAYMENT";
  const isPublished = !isDraft && !isPendingPayment;
  const canDelete =
    project.state === "DRAFT" ||
    project.state === "PENDING_PAYMENT" ||
    (project.state === "OPEN" && (bidCount ?? 0) === 0);

  // Mark messages as read when client visits this page (AWARDED or COMPLETED)
  if (["AWARDED", "COMPLETED"].includes(project.state)) {
    await supabaseAdmin
      .from("project_message_reads")
      .upsert(
        { project_id: id, user_id: user.id, last_read_at: new Date().toISOString() },
        { onConflict: "project_id,user_id" }
      );
  }

  // Fetch messages if project is AWARDED or COMPLETED
  type MessageRow = {
    id: string;
    sender_id: string;
    sender_role: string;
    body: string;
    created_at: string;
    sender_name: string;
  };
  let projectMessages: MessageRow[] = [];

  if (["AWARDED", "COMPLETED"].includes(project.state)) {
    const { data: rawMessages } = await supabaseAdmin
      .from("project_messages")
      .select("id, sender_id, sender_role, body, created_at")
      .eq("project_id", id)
      .order("created_at", { ascending: true });

    if (rawMessages && rawMessages.length > 0) {
      const senderIds = [...new Set((rawMessages as any[]).map((m) => m.sender_id))];
      const { data: senderProfiles } = await supabaseAdmin
        .from("profiles")
        .select("id, display_name")
        .in("id", senderIds);

      const nameMap = new Map<string, string>();
      (senderProfiles ?? []).forEach((p: any) => nameMap.set(p.id, p.display_name || "ONP User"));

      projectMessages = (rawMessages as any[]).map((m) => ({
        ...m,
        sender_name: nameMap.get(m.sender_id) ?? "ONP User",
      }));
    }
  }

  const deadline = project.deadline_at ? new Date(project.deadline_at) : null;
  const now = new Date();
  const deadlinePassed = !!deadline && deadline.getTime() <= now.getTime();
  const isEmergencyBidMode = !!(project as any).emergency_bid_mode;
  const isEmergencyPaid = !!(project as any).is_emergency;
  const bidsUnlocked = deadlinePassed || project.state !== "OPEN" || isEmergencyBidMode || isEmergencyPaid;
  const hasUnansweredRfis = (unansweredRfiCount ?? 0) > 0;

  const inspectorStatus = inspectorAssignment?.request_status ?? null;
  const inspectorFeatureEnabled = await getFeatureFlag(FLAGS.INSPECTOR_ENABLED);
  // Show inspector button if: feature is ON, OR an assignment already exists (so client can track it)
  const showInspectorButton = inspectorFeatureEnabled || !!inspectorAssignment;

  function inspectorButtonStyle() {
    switch (inspectorStatus) {
      case "COMPLETED":
        return { background: "#F0FDF4", color: "#15803D", border: "1px solid #166534" };
      case "ASSIGNED":
        return { background: "var(--camo-concrete)", color: "var(--camo-gunmetal)", border: "1px solid #d9dbdb" };
      case "PENDING":
        return { background: "#FFFBEB", color: "#92400E", border: "1px solid #FCD34D" };
      default:
        return { background: "transparent", color: "var(--camo-gunmetal)", border: "1px solid #d9dbdb" };
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
    border: "1px solid #d9dbdb",
    color: "var(--camo-charcoal)",
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
    color: "var(--camo-gunmetal)",
    textTransform: "uppercase" as const,
    letterSpacing: "1px",
    marginTop: "16px",
  };

  return (
    <div style={{ maxWidth: "600px" }}>
      {/* Header */}
      <div className="mob-col mob-gap-sm" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h1 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "36px",
            letterSpacing: "1px",
            color: "var(--camo-charcoal)",
            margin: 0,
          }}>
            {isDraft ? "Edit Draft" : project.title ?? "Project"}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "8px", flexWrap: "wrap" }}>
            <span style={stateBadge(project.state)}>{project.state}</span>
            {isPublished && (project as any).inspector_hold_started_at ? (
              <span style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "#92400E",
                background: "#FEF3C7",
                border: "1px solid #FCD34D",
                borderRadius: "20px",
                padding: "3px 10px",
              }}>
                ⏸ Timer paused · Awaiting inspector report
              </span>
            ) : isPublished && project.deadline_at ? (
              <span style={{ fontSize: "13px", color: "var(--camo-gunmetal)" }}>
                Deadline: {new Date(project.deadline_at).toLocaleDateString()}
              </span>
            ) : null}
          </div>
        </div>

        <div className="mob-wrap" style={{ display: "flex", gap: "8px" }}>
          <form action={repostProject.bind(null, id)}>
            <button
              type="submit"
              style={{
                background: "transparent",
                color: "var(--camo-gunmetal)",
                border: "1px solid #d9dbdb",
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
              color: "var(--camo-gunmetal)",
              border: "1px solid #d9dbdb",
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

      {/* Project completed confirmation banner */}
      {justCompleted && (
        <div style={{
          background: "#F0FDF4",
          border: "1px solid #166534",
          color: "#15803D",
          padding: "16px 20px",
          borderRadius: "10px",
          fontSize: "14px",
          fontWeight: 600,
          marginBottom: "20px",
        }}>
          🎉 Project marked as complete! Thank you for using ONP.
        </div>
      )}

      {/* Completion request banner — shown when contractor signals work is done */}
      {project.state === "AWARDED" && completionRequestedAt && (
        <div style={{
          background: "#F0FDF4",
          border: "2px solid #166534",
          borderRadius: "12px",
          padding: "20px 24px",
          marginBottom: "20px",
        }}>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "20px",
            color: "#15803D",
            marginBottom: "8px",
          }}>
            ✅ Your contractor has signaled work is complete
          </div>
          <p style={{ fontSize: "13px", color: "#166534", marginBottom: "16px", lineHeight: 1.6 }}>
            Signaled on {new Date(completionRequestedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}.
            Confirm once you have verified the work is finished to close this project.
          </p>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <form action={confirmCompletion.bind(null, id)}>
              <button
                type="submit"
                style={{
                  background: "#15803D",
                  color: "#FFFFFF",
                  border: "none",
                  padding: "10px 24px",
                  borderRadius: "6px",
                  fontFamily: "'Barlow', sans-serif",
                  fontWeight: 700,
                  fontSize: "13px",
                  cursor: "pointer",
                  letterSpacing: "0.5px",
                }}
              >
                ✓ Confirm Complete
              </button>
            </form>
            <form action={dismissCompletionRequest.bind(null, id)}>
              <button
                type="submit"
                style={{
                  background: "transparent",
                  color: "#166534",
                  border: "1px solid #166534",
                  padding: "10px 20px",
                  borderRadius: "6px",
                  fontFamily: "'Barlow', sans-serif",
                  fontWeight: 500,
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Not Yet — Dismiss
              </button>
            </form>
          </div>
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
              background: bidsUnlocked ? "var(--camo-accent)" : "var(--camo-concrete)",
              color: bidsUnlocked ? "var(--camo-ink)" : "var(--camo-gunmetal)",
              border: `1px solid ${bidsUnlocked ? "var(--camo-accent)" : "#d9dbdb"}`,
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
              color: hasUnansweredRfis ? "#92400E" : "var(--camo-gunmetal)",
              border: `1px solid ${hasUnansweredRfis ? "#FCD34D" : "#d9dbdb"}`,
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
              color: "var(--camo-gunmetal)",
              border: "1px solid #d9dbdb",
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

          {showInspectorButton && (
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
          )}

          {project.state === "OPEN" && (
            <Link
              href={`/dashboard/client/projects/${id}/override`}
              style={{
                background: "transparent",
                color: "var(--camo-gunmetal)",
                border: "1px solid #d9dbdb",
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
        <p style={{ fontSize: "12px", color: "var(--camo-gunmetal)", marginBottom: "20px" }}>
          Bids are sealed until the deadline passes.
        </p>
      )}

      {/* Files callout — shown on draft and published projects */}
      {(isDraft || isPublished) && (
        <div style={{
          background: "var(--camo-paper)",
          border: "1px solid var(--camo-gunmetal)",
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
              color: "var(--camo-charcoal)",
              marginBottom: "4px",
            }}>
              📁 Project Files
            </div>
            <div style={{ fontSize: "12px", color: "var(--camo-gunmetal)", lineHeight: 1.5 }}>
              {isDraft
                ? "Upload photos, blueprints, or documents so contractors understand the full scope of work."
                : `${(bidCount ?? 0) > 0 ? "Contractors can view your uploaded files while preparing their bids." : "Adding photos or documents may help attract more bids and clarify scope."}`}
            </div>
          </div>
          <a
            href={`/dashboard/client/projects/${id}/files`}
            style={{
              background: "var(--camo-gunmetal)",
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
        background: "var(--camo-concrete)",
        border: "1px solid #d9dbdb",
        borderRadius: "12px",
        padding: "24px",
        marginBottom: "20px",
      }}>
        <h2 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: "18px",
          letterSpacing: "1px",
          color: "var(--camo-charcoal)",
          textTransform: "uppercase",
          marginBottom: "4px",
        }}>
          Project Details
        </h2>
        <p style={{ fontSize: "12px", color: "var(--camo-gunmetal)", marginBottom: "16px" }}>
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

            <div className="mob-grid-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
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

            <label style={labelStyle}>Target Start Date</label>
            <input
              type="date"
              name="target_start_date"
              defaultValue={(project as any).target_start_date ?? ""}
              style={inputStyle}
            />
            <p style={{ fontSize: "11px", color: "var(--camo-gunmetal)", marginTop: "4px" }}>
              When do you hope to begin work? Visible to contractors.
            </p>

            {isDraft && (
              <button
                type="submit"
                style={{
                  marginTop: "20px",
                  background: "transparent",
                  color: "var(--camo-gunmetal)",
                  border: "1px solid #d9dbdb",
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

      {/* ── Project Q&A — client answers (editable at any time) ── */}
      {clientCatalog.length > 0 && (
        <div style={{
          background: "var(--camo-concrete)",
          border: "1px solid #d9dbdb",
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "20px",
        }}>
          <h2 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "20px",
            letterSpacing: "1px",
            color: "var(--camo-charcoal)",
            textTransform: "uppercase",
            marginBottom: "4px",
          }}>
            Project Questions
          </h2>
          <p style={{ fontSize: "12px", color: "var(--camo-gunmetal)", marginBottom: "16px", lineHeight: 1.5 }}>
            These answers are visible to all bidding contractors immediately. You can update them at any time — even after publishing.
          </p>

          {/* Advisory warning */}
          <div style={{
            background: "#FFF7ED",
            border: "1px solid #FCD34D",
            borderRadius: "8px",
            padding: "12px 14px",
            marginBottom: "20px",
            display: "flex",
            gap: "10px",
            alignItems: "flex-start",
          }}>
            <span style={{ fontSize: "18px", flexShrink: 0 }}>⚠️</span>
            <div style={{ fontSize: "12px", color: "#92400E", lineHeight: 1.5 }}>
              <strong>Unanswered questions can lead to higher bids.</strong> Contractors price in uncertainty — the more thoroughly you answer, the more competitive their bids will be.
            </div>
          </div>

          {/* Success banner */}
          {qaSaved && (
            <div style={{
              background: "#F0FDF4",
              border: "1px solid #166534",
              color: "#15803D",
              padding: "10px 14px",
              borderRadius: "8px",
              fontSize: "13px",
              marginBottom: "16px",
            }}>
              ✅ Answers saved and visible to contractors.
            </div>
          )}

          <form action={updateProjectRfis.bind(null, id)}>
            {clientCatalog.map((item, idx) => {
              const existing = existingAnswers.get(item.id);
              const isAnswered = !!(existing?.response);
              return (
                <div key={item.id} style={{ marginTop: idx === 0 ? 0 : "18px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                    <label style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "var(--camo-charcoal)",
                      lineHeight: 1.4,
                    }}>
                      {item.prompt}
                    </label>
                    {isAnswered && (
                      <span style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: "20px",
                        background: "#F0FDF4",
                        color: "#15803D",
                        border: "1px solid #86EFAC",
                        flexShrink: 0,
                      }}>
                        ✓ Answered
                      </span>
                    )}
                  </div>
                  <textarea
                    name={`rfi_${item.id}`}
                    defaultValue={existing?.response ?? ""}
                    style={{
                      width: "100%",
                      background: "#FFFFFF",
                      border: `1px solid ${isAnswered ? "#86EFAC" : "#d9dbdb"}`,
                      color: "var(--camo-charcoal)",
                      borderRadius: "6px",
                      padding: "10px 14px",
                      fontFamily: "'Barlow', sans-serif",
                      fontSize: "13px",
                      outline: "none",
                      minHeight: "76px",
                      resize: "vertical",
                    }}
                    placeholder="Leave blank to skip — contractors will see this as unanswered."
                  />
                </div>
              );
            })}

            <button
              type="submit"
              style={{
                marginTop: "20px",
                background: "var(--camo-gunmetal)",
                color: "#FFFFFF",
                border: "none",
                padding: "10px 24px",
                borderRadius: "6px",
                fontFamily: "'Barlow', sans-serif",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
                letterSpacing: "0.5px",
              }}
            >
              Save Answers
            </button>
          </form>
        </div>
      )}

      {/* Publish controls */}
      {isPendingPayment ? null : isDraft ? (
        <div style={{
          background: "var(--camo-concrete)",
          border: "1px solid #d9dbdb",
          borderRadius: "12px",
          padding: "24px",
        }}>
          <h2 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "18px",
            letterSpacing: "1px",
            color: "var(--camo-charcoal)",
            textTransform: "uppercase",
            marginBottom: "4px",
          }}>
            Publish to Contractors
          </h2>
          <p style={{ fontSize: "13px", color: "var(--camo-gunmetal)", marginBottom: "20px" }}>
            Choose how long bidding stays open. Minimum 5 days, maximum 10 days.
          </p>

          <form action={publishProject.bind(null, id)}>
            <div className="mob-col-stretch mob-gap-sm" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <label style={{
                fontSize: "11px",
                fontWeight: 500,
                color: "var(--camo-gunmetal)",
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
                  border: "1px solid #d9dbdb",
                  color: "var(--camo-charcoal)",
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
                  background: "var(--camo-accent)",
                  color: "var(--camo-ink)",
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
          background: "var(--camo-concrete)",
          border: "1px solid #d9dbdb",
          borderRadius: "12px",
          padding: "20px",
          fontSize: "13px",
          color: "var(--camo-gunmetal)",
        }}>
          This project is published. Edits will trigger a revision workflow in a future update.
        </div>
      )}

      {/* ── Post-Award Messages ── */}
      {["AWARDED", "COMPLETED"].includes(project.state) && (
        <div
          id="messages"
          style={{
            background: "var(--camo-concrete)",
            border: "1px solid #d9dbdb",
            borderRadius: "12px",
            overflow: "hidden",
            marginTop: "20px",
          }}
        >
          {/* Section header */}
          <div
            style={{
              background: "var(--camo-charcoal)",
              padding: "14px 20px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <span style={{ fontSize: "18px" }}>💬</span>
            <div>
              <div
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 700,
                  fontSize: "16px",
                  letterSpacing: "1px",
                  color: "#FFFFFF",
                  textTransform: "uppercase",
                }}
              >
                Project Messages
              </div>
              <div style={{ fontSize: "11px", color: "var(--camo-steel)", marginTop: "1px" }}>
                Private thread — visible only to you, the contractor, and ONP
              </div>
            </div>
          </div>

          {/* Message list */}
          <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "12px" }}>
            {projectMessages.length === 0 ? (
              <div
                style={{
                  fontSize: "13px",
                  color: "var(--camo-gunmetal)",
                  textAlign: "center",
                  padding: "24px 0",
                  fontStyle: "italic",
                }}
              >
                No messages yet. Send the first message below.
              </div>
            ) : (
              projectMessages.map((msg) => {
                const isMe = msg.sender_id === user.id;
                const roleBadgeColor =
                  msg.sender_role === "CLIENT"
                    ? { bg: "var(--camo-concrete)", color: "var(--camo-gunmetal)", border: "#d9dbdb" }
                    : msg.sender_role === "ADMIN"
                    ? { bg: "#FFF7ED", color: "#92400E", border: "#FCD34D" }
                    : { bg: "#F0FDF4", color: "#15803D", border: "#86EFAC" };

                return (
                  <div
                    key={msg.id}
                    style={{
                      display: "flex",
                      flexDirection: isMe ? "row-reverse" : "row",
                      gap: "10px",
                      alignItems: "flex-start",
                    }}
                  >
                    <div
                      style={{
                        maxWidth: "80%",
                        background: isMe ? "var(--camo-charcoal)" : "#FFFFFF",
                        border: `1px solid ${isMe ? "var(--camo-gunmetal)" : "#d9dbdb"}`,
                        borderRadius: isMe ? "12px 2px 12px 12px" : "2px 12px 12px 12px",
                        padding: "10px 14px",
                      }}
                    >
                      {/* Sender + time */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom: "6px",
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: 700,
                            color: isMe ? "#d9dbdb" : "var(--camo-charcoal)",
                          }}
                        >
                          {isMe ? "You" : msg.sender_name}
                        </span>
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: 700,
                            padding: "1px 7px",
                            borderRadius: "20px",
                            background: roleBadgeColor.bg,
                            color: roleBadgeColor.color,
                            border: `1px solid ${roleBadgeColor.border}`,
                          }}
                        >
                          {msg.sender_role === "ADMIN" ? "ONP" : msg.sender_role}
                        </span>
                        <span style={{ fontSize: "10px", color: isMe ? "var(--camo-steel)" : "#9CA3AF" }}>
                          {new Date(msg.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}{" "}
                          {new Date(msg.created_at).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      {/* Body */}
                      <div
                        style={{
                          fontSize: "13px",
                          color: isMe ? "var(--camo-paper)" : "var(--camo-charcoal)",
                          lineHeight: 1.6,
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                        }}
                      >
                        {msg.body}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Send form */}
          <div
            style={{
              borderTop: "1px solid #d9dbdb",
              padding: "16px 20px",
              background: "var(--camo-paper)",
            }}
          >
            <form action={sendClientMessage.bind(null, id)}>
              <textarea
                name="body"
                required
                maxLength={2000}
                rows={3}
                placeholder="Type your message…"
                style={{
                  width: "100%",
                  background: "#FFFFFF",
                  border: "1px solid #d9dbdb",
                  color: "var(--camo-charcoal)",
                  borderRadius: "6px",
                  padding: "10px 14px",
                  fontFamily: "'Barlow', sans-serif",
                  fontSize: "13px",
                  outline: "none",
                  resize: "vertical",
                  boxSizing: "border-box",
                }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: "10px",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                <span style={{ fontSize: "11px", color: "var(--camo-gunmetal)" }}>
                  Max 2,000 characters · Visible to contractor and ONP
                </span>
                <button
                  type="submit"
                  style={{
                    background: "var(--camo-charcoal)",
                    color: "#FFFFFF",
                    border: "none",
                    padding: "9px 22px",
                    borderRadius: "6px",
                    fontFamily: "'Barlow', sans-serif",
                    fontWeight: 600,
                    fontSize: "13px",
                    cursor: "pointer",
                    letterSpacing: "0.5px",
                  }}
                >
                  Send Message
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
