import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";
import ResolveForm from "./ResolveForm";

function formatDate(d: string | null) {
  return d ? new Date(d).toLocaleString() : "—";
}

export default async function AdminSensitiveRemovalsPage() {
  await requireRole(["ADMIN"]);

  const { data: reviews, error } = await supabaseAdmin
    .from("attachment_sensitive_removal_reviews")
    .select("id, project_id, attachment_id, requested_by, requested_at, status, is_high_risk, client_decision, replacement_attachment_id, resolution_action, admin_note, resolved_at, bidding_paused_at, bidding_resumed_at")
    .order("requested_at", { ascending: false });
  if (error) throw error;

  const rows = reviews ?? [];
  const projectIds = [...new Set(rows.map((r) => r.project_id))];
  const attachmentIds = [...new Set(rows.map((r) => r.attachment_id))];
  const clientIds = [...new Set(rows.map((r) => r.requested_by).filter(Boolean))] as string[];

  const [{ data: projects }, { data: attachments }, { data: clients }] = await Promise.all([
    projectIds.length ? supabaseAdmin.from("projects").select("id, title, bidding_paused_at").in("id", projectIds) : Promise.resolve({ data: [] as any[] }),
    attachmentIds.length ? supabaseAdmin.from("project_attachments").select("id, original_filename, attachment_status, withdrawal_reason_other_text, original_object_deleted_at").in("id", attachmentIds) : Promise.resolve({ data: [] as any[] }),
    clientIds.length ? supabaseAdmin.from("profiles").select("id, display_name").in("id", clientIds) : Promise.resolve({ data: [] as any[] }),
  ]);

  const projectMap = new Map((projects ?? []).map((p: any) => [p.id, p]));
  const attachmentMap = new Map((attachments ?? []).map((a: any) => [a.id, a]));
  const clientMap = new Map((clients ?? []).map((c: any) => [c.id, c.display_name]));

  // Only genuine escalations (client selected "I'm not sure", or the client
  // flagged the removal high-risk at withdrawal time) are admin-actionable.
  // PENDING_CLIENT_DECISION rows -- most sensitive removals -- are awaiting
  // the client's own self-service Yes/No/Unsure answer and are deliberately
  // not shown here at all; this queue is not where routine removals live.
  const pending = rows.filter((r) => r.status === "PENDING_REVIEW");
  const resolvedByClient = rows.filter((r) => r.status === "RESOLVED_NOT_NEEDED" || r.status === "RESOLVED_REPLACEMENT_UPLOADED");
  const resolvedByAdmin = rows.filter((r) => r.status === "BIDDING_RESUMED" || r.status === "RESOLVED_NO_ACTION");

  function renderRow(r: (typeof rows)[number], mode: "pending" | "client_resolved" | "admin_resolved") {
    const project = projectMap.get(r.project_id);
    const attachment = attachmentMap.get(r.attachment_id);
    const clientName = r.requested_by ? clientMap.get(r.requested_by) ?? "Unknown client" : "Unknown client";
    const cleanupDone = attachment?.attachment_status === "SENSITIVE_REMOVED" && !!attachment?.original_object_deleted_at;

    return (
      <div key={r.id} style={{ background: "var(--camo-concrete)", border: (r as any).is_high_risk && mode === "pending" ? "1px solid #DC2626" : "1px solid #d9dbdb", borderRadius: "10px", padding: "18px", marginBottom: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", marginBottom: "8px" }}>
          <div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "15px", color: "var(--camo-charcoal)" }}>
              {project?.title ?? "Unknown project"}
            </div>
            <div style={{ fontSize: "12px", color: "var(--camo-gunmetal)", marginTop: "2px" }}>
              {attachment?.original_filename ?? "attachment"} — requested by {clientName} — {formatDate(r.requested_at)}
            </div>
          </div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {(r as any).is_high_risk && (
              <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", padding: "3px 10px", borderRadius: "20px", height: "fit-content", background: "#DC2626", color: "#FFFFFF" }}>
                High risk
              </span>
            )}
            <span style={{
              fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px",
              padding: "3px 10px", borderRadius: "20px", height: "fit-content",
              background: attachment?.attachment_status === "SENSITIVE_REMOVED" ? "#F0FDF4" : "#FEF2F2",
              color: attachment?.attachment_status === "SENSITIVE_REMOVED" ? "#15803D" : "#991B1B",
            }}>
              {attachment?.attachment_status?.replaceAll("_", " ") ?? "unknown"}
            </span>
          </div>
        </div>

        <div style={{ fontSize: "12px", color: "var(--camo-gunmetal)", display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "8px" }}>
          <span>
            Quarantine cleanup: {cleanupDone ? "✅ complete" : "⏳ pending — original path may not be fully closed yet"}
          </span>
          <span>
            Bidding pause: {project?.bidding_paused_at ? `⏸ paused since ${formatDate(project.bidding_paused_at)}` : "▶ not paused"}
          </span>
        </div>

        {attachment?.withdrawal_reason_other_text && (
          <div style={{ fontSize: "12px", color: "var(--camo-gunmetal)", fontStyle: "italic", marginBottom: "8px" }}>
            Client note: “{attachment.withdrawal_reason_other_text}”
          </div>
        )}

        {mode === "pending" && <ResolveForm projectId={r.project_id} reviewId={r.id} />}

        {mode === "client_resolved" && (
          <div style={{ fontSize: "12px", color: "var(--camo-gunmetal)" }}>
            Client decision: {(r as any).client_decision?.replaceAll("_", " ").toLowerCase() ?? "—"}
            {(r as any).replacement_attachment_id ? " — replacement uploaded" : ""}
          </div>
        )}

        {mode === "admin_resolved" && (
          <div style={{ fontSize: "12px", color: "var(--camo-gunmetal)" }}>
            Resolved {formatDate(r.resolved_at)} — {r.resolution_action?.replaceAll("_", " ") ?? "—"}
            {r.admin_note ? ` — ${r.admin_note}` : ""}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "36px", letterSpacing: "1px", color: "var(--camo-charcoal)", margin: 0 }}>
            Sensitive-Removal Reviews
          </h1>
          <p style={{ fontSize: "13px", color: "var(--camo-gunmetal)", marginTop: "4px" }}>
            {pending.length} pending admin review · {resolvedByClient.length} resolved by client · {resolvedByAdmin.length} resolved by admin
          </p>
        </div>
        <Link href="/dashboard/admin" style={{ background: "transparent", color: "var(--camo-gunmetal)", border: "1px solid #d9dbdb", padding: "8px 16px", borderRadius: "6px", fontFamily: "'Barlow', sans-serif", fontSize: "13px", textDecoration: "none" }}>
          Back
        </Link>
      </div>

      <h2 style={{ fontSize: "14px", fontWeight: 700, color: "var(--camo-charcoal)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "10px" }}>
        Pending Admin Review
      </h2>
      <p style={{ fontSize: "12px", color: "var(--camo-gunmetal)", marginBottom: "10px" }}>
        Only genuine escalations appear here — a client selected &quot;I&apos;m not sure&quot;, or flagged the removal as high-risk. Routine removals resolve themselves via the client&apos;s own decision and never reach this list.
      </p>
      {pending.length === 0 ? (
        <div style={{ background: "#FFFFFF", border: "1px solid #d9dbdb", borderRadius: "10px", padding: "20px", textAlign: "center", color: "var(--camo-gunmetal)", fontSize: "13px", marginBottom: "24px" }}>
          Nothing pending.
        </div>
      ) : (
        <div style={{ marginBottom: "24px" }}>{pending.map((r) => renderRow(r, "pending"))}</div>
      )}

      <h2 style={{ fontSize: "14px", fontWeight: 700, color: "var(--camo-charcoal)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "10px" }}>
        Resolved by Client (read-only)
      </h2>
      {resolvedByClient.length === 0 ? (
        <div style={{ background: "#FFFFFF", border: "1px solid #d9dbdb", borderRadius: "10px", padding: "20px", textAlign: "center", color: "var(--camo-gunmetal)", fontSize: "13px", marginBottom: "24px" }}>
          Nothing yet.
        </div>
      ) : (
        <div style={{ marginBottom: "24px" }}>{resolvedByClient.map((r) => renderRow(r, "client_resolved"))}</div>
      )}

      <h2 style={{ fontSize: "14px", fontWeight: 700, color: "var(--camo-charcoal)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "10px" }}>
        Resolved by Admin
      </h2>
      {resolvedByAdmin.length === 0 ? (
        <div style={{ background: "#FFFFFF", border: "1px solid #d9dbdb", borderRadius: "10px", padding: "20px", textAlign: "center", color: "var(--camo-gunmetal)", fontSize: "13px" }}>
          Nothing resolved yet.
        </div>
      ) : (
        <div>{resolvedByAdmin.map((r) => renderRow(r, "admin_resolved"))}</div>
      )}
    </div>
  );
}
