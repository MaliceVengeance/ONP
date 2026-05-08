import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import FileUploader from "./FileUploader";

export default async function ProjectFilesPage({
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

  // Fetch existing files
  const { data: files } = await supabase.storage
    .from("project-files")
    .list(projectId, {
      sortBy: { column: "created_at", order: "desc" },
    });

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
            Project Files
          </h1>
          <p style={{ fontSize: "13px", color: "#7A9CC4", marginTop: "4px" }}>
            {project?.title ?? "Untitled"} — visible to all bidding contractors
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

      {/* Upload component */}
      <FileUploader
        projectId={projectId}
        existingFiles={files ?? []}
      />
    </div>
  );
}