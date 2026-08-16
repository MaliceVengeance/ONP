import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { getHistoryDisplay } from "@/lib/attachmentHistoryDisplay";
import ProjectFileLink from "../ProjectFileLink";

export default async function ContractorBidInformationHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { supabase } = await requireRole(["CONTRACTOR", "ADMIN"]);
  const { id: projectId } = await params;

  const { data: project } = await supabase
    .from("projects")
    .select("id, title")
    .eq("id", projectId)
    .single();

  // Privacy-filtered at the DB layer (migration 029) -- sensitive-removed
  // rows already arrive with storage_object_key/original_filename nulled,
  // not merely hidden here.
  const { data: rows } = await supabase.rpc("get_contractor_project_attachment_history", {
    p_project_id: projectId,
  });

  const historyRows = (rows ?? []).filter((r: any) => r.attachment_status !== "ACTIVE");

  return (
    <div style={{ maxWidth: "700px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <div>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "30px", color: "var(--camo-charcoal)", margin: 0 }}>
            Bid Information History
          </h1>
          <p style={{ fontSize: "13px", color: "var(--camo-gunmetal)", marginTop: "4px" }}>
            {project?.title ?? "Project"} — files that are no longer part of the active listing
          </p>
        </div>
        <Link href={`/dashboard/contractor/projects/${projectId}`} style={{ fontSize: "13px", color: "var(--camo-gunmetal)" }}>
          ← Back to Project
        </Link>
      </div>

      {historyRows.length === 0 ? (
        <div style={{ background: "#FFFFFF", border: "1px solid #d9dbdb", borderRadius: "12px", padding: "24px", textAlign: "center", fontSize: "13px", color: "var(--camo-gunmetal)" }}>
          Nothing here yet.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {historyRows.map((r: any) => {
            const display = getHistoryDisplay(r.attachment_status, "CONTRACTOR", !!r.original_filename && r.attachment_status !== "ACTIVE" ? true : false);
            if (!display.showDownloadLink) {
              return (
                <div key={r.id} style={{ background: "#F9FAFB", border: "1px dashed #d1d5db", borderRadius: "10px", padding: "14px 16px", fontSize: "13px", color: "var(--camo-gunmetal)" }}>
                  {display.label} — no further details are shown for this item.
                </div>
              );
            }
            return (
              <div key={r.id}>
                <ProjectFileLink
                  storageObjectKey={r.storage_object_key}
                  displayLabel={r.original_filename ?? r.display_label}
                  isNew={r.is_new}
                />
                <div style={{ fontSize: "11px", color: "var(--camo-gunmetal)", marginTop: "4px", paddingLeft: "4px" }}>
                  Withdrawn{r.withdrawn_at ? ` — ${new Date(r.withdrawn_at).toLocaleDateString()}` : ""}
                  {r.withdrawal_reason_code ? ` — ${String(r.withdrawal_reason_code).replaceAll("_", " ").toLowerCase()}` : ""}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
