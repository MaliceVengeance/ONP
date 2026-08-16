import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { getHistoryDisplay } from "@/lib/attachmentHistoryDisplay";

export default async function BidInformationHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { supabase } = await requireRole(["CLIENT", "ADMIN"]);
  const { id: projectId } = await params;

  const { data: project } = await supabase
    .from("projects")
    .select("id, title")
    .eq("id", projectId)
    .single();

  const { data: rows } = await supabase
    .from("project_attachments")
    .select("id, original_filename, attachment_status, withdrawal_reason_code, withdrawal_reason_other_text, withdrawn_at, created_at")
    .eq("project_id", projectId)
    .neq("attachment_status", "ACTIVE")
    .order("created_at", { ascending: false });

  return (
    <div style={{ maxWidth: "700px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <div>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "30px", color: "var(--camo-charcoal)", margin: 0 }}>
            Bid Information History
          </h1>
          <p style={{ fontSize: "13px", color: "var(--camo-gunmetal)", marginTop: "4px" }}>
            {project?.title ?? "Project"} — files no longer in the active view
          </p>
        </div>
        <Link href={`/dashboard/client/projects/${projectId}/files`} style={{ fontSize: "13px", color: "var(--camo-gunmetal)" }}>
          ← Back to Files
        </Link>
      </div>

      {(!rows || rows.length === 0) ? (
        <div style={{ background: "#FFFFFF", border: "1px solid #d9dbdb", borderRadius: "12px", padding: "24px", textAlign: "center", fontSize: "13px", color: "var(--camo-gunmetal)" }}>
          Nothing here yet — withdrawn and removed files will appear in this history.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {rows.map((r) => {
            const display = getHistoryDisplay(r.attachment_status as any, "CLIENT", false);
            return (
              <div key={r.id} style={{ background: "#FFFFFF", border: "1px solid #d9dbdb", borderRadius: "10px", padding: "14px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--camo-charcoal)" }}>
                      {display.showFilename ? r.original_filename : "Removed attachment"}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--camo-gunmetal)", marginTop: "2px" }}>
                      {display.label}
                      {r.withdrawn_at && ` — ${new Date(r.withdrawn_at).toLocaleDateString()}`}
                    </div>
                    {display.showReasonCategory && r.withdrawal_reason_code && (
                      <div style={{ fontSize: "11px", color: "var(--camo-gunmetal)", marginTop: "2px" }}>
                        Reason: {r.withdrawal_reason_code.replaceAll("_", " ").toLowerCase()}
                      </div>
                    )}
                    {display.showClientFreeText && r.withdrawal_reason_other_text && (
                      <div style={{ fontSize: "11px", color: "var(--camo-gunmetal)", marginTop: "2px", fontStyle: "italic" }}>
                        “{r.withdrawal_reason_other_text}”
                      </div>
                    )}
                  </div>
                  <span style={{
                    fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px",
                    padding: "3px 8px", borderRadius: "999px",
                    background: r.attachment_status === "WITHDRAWN" ? "#FFF7ED" : "#FEF2F2",
                    color: r.attachment_status === "WITHDRAWN" ? "#9A3412" : "#991B1B",
                  }}>
                    {r.attachment_status.replaceAll("_", " ")}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
