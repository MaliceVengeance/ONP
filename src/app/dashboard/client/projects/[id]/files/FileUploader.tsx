"use client";

import { useState, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";

type FileObject = {
  name: string;
  metadata?: {
    size?: number;
    mimetype?: string;
  };
  created_at?: string;
};

export default function FileUploader({
  projectId,
  existingFiles,
}: {
  projectId: string;
  existingFiles: FileObject[];
}) {
  const [files, setFiles] = useState<FileObject[]>(existingFiles);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function refreshFiles() {
    const { data } = await supabase.storage
      .from("project-files")
      .list(projectId, {
        sortBy: { column: "created_at", order: "desc" },
      });
    setFiles(data ?? []);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files;
    if (!selected || selected.length === 0) return;

    setUploading(true);
    setError(null);
    setSuccess(null);

    for (const file of Array.from(selected)) {
      if (file.size > 10 * 1024 * 1024) {
        setError(`${file.name} is too large. Maximum file size is 10MB.`);
        setUploading(false);
        return;
      }

      const filePath = `${projectId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("project-files")
        .upload(filePath, file);

      if (uploadError) {
        setError(`Failed to upload ${file.name}: ${uploadError.message}`);
        setUploading(false);
        return;
      }
    }

    setSuccess(`${selected.length} file${selected.length > 1 ? "s" : ""} uploaded successfully.`);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    await refreshFiles();
  }

  async function handleDelete(fileName: string) {
    setDeleting(fileName);
    setError(null);

    const { error: deleteError } = await supabase.storage
      .from("project-files")
      .remove([`${projectId}/${fileName}`]);

    if (deleteError) {
      setError(`Failed to delete ${fileName}: ${deleteError.message}`);
    } else {
      await refreshFiles();
    }
    setDeleting(null);
  }

  async function handleDownload(fileName: string) {
    const { data } = await supabase.storage
      .from("project-files")
      .createSignedUrl(`${projectId}/${fileName}`, 60);

    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank");
    }
  }

  function formatSize(bytes?: number) {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function getFileIcon(name: string) {
    const ext = name.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "pdf": return "📄";
      case "jpg": case "jpeg": case "png": case "gif": case "webp": return "🖼️";
      case "doc": case "docx": return "📝";
      case "xls": case "xlsx": return "📊";
      case "zip": case "rar": return "🗜️";
      default: return "📎";
    }
  }

  return (
    <div>
      {/* Upload area */}
      <div
        style={{
          background: "var(--camo-concrete)",
          border: "2px dashed var(--camo-gunmetal)",
          borderRadius: "12px",
          padding: "32px",
          textAlign: "center",
          marginBottom: "20px",
          cursor: "pointer",
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <div style={{ fontSize: "36px", marginBottom: "12px" }}>📁</div>
        <div style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: "20px",
          color: "var(--camo-charcoal)",
          marginBottom: "6px",
        }}>
          {uploading ? "Uploading…" : "Click to upload files"}
        </div>
        <div style={{ fontSize: "13px", color: "var(--camo-gunmetal)", marginBottom: "4px" }}>
          Photos, PDFs, plans, documents — max 10MB per file
        </div>
        <div style={{ fontSize: "12px", color: "var(--camo-gunmetal)" }}>
          All files are visible to bidding contractors
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleUpload}
          style={{ display: "none" }}
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.dwg,.dxf"
          disabled={uploading}
        />
        {!uploading && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            style={{
              marginTop: "16px",
              background: "var(--camo-accent)",
              color: "var(--camo-ink)",
              border: "none",
              padding: "10px 28px",
              borderRadius: "6px",
              fontFamily: "'Barlow', sans-serif",
              fontWeight: 600,
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            Select Files
          </button>
        )}
        {uploading && (
          <div style={{ marginTop: "16px", fontSize: "13px", color: "var(--camo-gunmetal)" }}>
            Please wait…
          </div>
        )}
      </div>

      {/* Success / error messages */}
      {success && (
        <div style={{
          background: "#F0FDF4",
          border: "1px solid #166534",
          color: "#15803D",
          padding: "12px 16px",
          borderRadius: "8px",
          fontSize: "13px",
          marginBottom: "16px",
        }}>
          ✅ {success}
        </div>
      )}
      {error && (
        <div style={{
          background: "#FEF2F2",
          border: "1px solid #FCA5A5",
          color: "#991B1B",
          padding: "12px 16px",
          borderRadius: "8px",
          fontSize: "13px",
          marginBottom: "16px",
        }}>
          ❌ {error}
        </div>
      )}

      {/* File list */}
      <div style={{
        background: "#FFFFFF",
        border: "1px solid #d9dbdb",
        borderRadius: "12px",
        padding: "20px",
      }}>
        <h2 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: "16px",
          letterSpacing: "1px",
          color: "var(--camo-charcoal)",
          textTransform: "uppercase",
          marginBottom: "14px",
        }}>
          Uploaded Files ({files.length})
        </h2>

        {files.length === 0 ? (
          <div style={{
            fontSize: "13px",
            color: "var(--camo-gunmetal)",
            textAlign: "center",
            padding: "24px 0",
            lineHeight: 1.6,
          }}>
            No files uploaded yet.<br />
            <span style={{ fontSize: "12px", color: "var(--camo-gunmetal)" }}>
              Add photos, blueprints, or documents to help contractors understand the scope of work.
            </span>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {files.map((file) => (
              <div key={file.name} style={{
                background: "var(--camo-concrete)",
                border: "1px solid #d9dbdb",
                borderRadius: "8px",
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: "22px", flexShrink: 0 }}>
                    {getFileIcon(file.name)}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontSize: "13px",
                      color: "var(--camo-charcoal)",
                      fontWeight: 500,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}>
                      {file.name.replace(/^\d+_/, "")}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--camo-gunmetal)" }}>
                      {formatSize(file.metadata?.size)}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                  <button
                    onClick={() => handleDownload(file.name)}
                    style={{
                      background: "transparent",
                      color: "var(--camo-gunmetal)",
                      border: "1px solid #d9dbdb",
                      padding: "5px 12px",
                      borderRadius: "6px",
                      fontFamily: "'Barlow', sans-serif",
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleDelete(file.name)}
                    disabled={deleting === file.name}
                    style={{
                      background: "#FEF2F2",
                      color: "#991B1B",
                      border: "1px solid #FCA5A5",
                      padding: "5px 12px",
                      borderRadius: "6px",
                      fontFamily: "'Barlow', sans-serif",
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    {deleting === file.name ? "…" : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
