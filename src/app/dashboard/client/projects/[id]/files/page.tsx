import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import FileUploader from "./FileUploader";

export default async function ProjectFilesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ new?: string }>;
}) {
  const { supabase } = await requireRole(["CLIENT", "ADMIN"]);
  const { id: projectId } = await params;
  const sp = await searchParams;
  const isCreationStep = sp.new === "1";

  const { data: project } = await supabase
    .from("projects")
    .select("id, title, state")
    .eq("id", projectId)
    .single();

  // Metadata-driven listing (project_attachments), not raw Storage listing --
  // switched only after the historical-file backfill was verified complete.
  const { data: attachments } = await supabase
    .from("project_attachments")
    .select("id, storage_object_key, original_filename, mime_type, file_size_bytes, created_at")
    .eq("project_id", projectId)
    .is("withdrawn_at", null)
    .order("created_at", { ascending: false });

  return (
    <div style={{ maxWidth: "600px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
        <div>
          {isCreationStep && (
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--camo-accent-dim, #B45309)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>
              Step 2 of 2
            </div>
          )}
          <h1 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "36px",
            letterSpacing: "1px",
            color: "var(--camo-charcoal)",
            margin: 0,
          }}>
            {isCreationStep ? "Add Photos & Documents" : "Project Files"}
          </h1>
          <p style={{ fontSize: "13px", color: "var(--camo-gunmetal)", marginTop: "4px" }}>
            {isCreationStep
              ? `"${project?.title ?? "Untitled"}" was created. Photos and documents are optional but help contractors bid accurately.`
              : `${project?.title ?? "Untitled"} — visible to all bidding contractors`}
          </p>
        </div>
        {!isCreationStep && (
          <Link
            href={`/dashboard/client/projects/${projectId}`}
            style={{
              background: "transparent",
              color: "var(--camo-gunmetal)",
              border: "1px solid #d9dbdb",
              padding: "8px 16px",
              borderRadius: "6px",
              fontFamily: "'Barlow', sans-serif",
              fontSize: "13px",
              textDecoration: "none",
            }}
          >
            Back
          </Link>
        )}
      </div>

      {/* Upload component */}
      <FileUploader
        projectId={projectId}
        projectState={project?.state ?? "DRAFT"}
        existingAttachments={attachments ?? []}
      />

      {isCreationStep && (
        <div style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end" }}>
          <Link
            href={`/dashboard/client/projects/${projectId}`}
            style={{
              background: "var(--camo-accent)",
              color: "var(--camo-ink)",
              padding: "12px 28px",
              borderRadius: "6px",
              fontFamily: "'Barlow', sans-serif",
              fontWeight: 600,
              fontSize: "14px",
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            Finish →
          </Link>
        </div>
      )}
    </div>
  );
}
