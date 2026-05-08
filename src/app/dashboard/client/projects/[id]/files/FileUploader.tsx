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
      // Limit file size to 10MB
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
      <div style={{
        background: "#0F2040",
        border: "2px dashed #1B4F8A",
        borderRadius: "12px",
        padding: "32px",
        textAlign: "center",
        marginBottom: "20px",
        cursor: "pointer",
      }}
        onClick={() => fileInputRef.current?.click()}
      >
        <div style={{ fontSize: "32px", marginBottom: "12px" }}>📁</div>
        <div style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: "18px",
          color: "#fff",
          marginBottom: "6px",
        }}>
          {uploading ? "Uploading..." : "Click to upload files"}
        </div>
        <div style={{ fontSize: "12px", color: "#7A9CC4" }}>
          Photos, PDFs, documents — max 10MB per file
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleUpload}
          style={{ display: "none" }}
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
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
              background: "#C8102E",
              color: "#fff",
              border: "none",
              padding: "10px 24px",
              borderRadius: "6px",
              fontFamily: "'Barlow', sans-serif",
              fontWeight: 600,
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            Select Files
          </button>
        )}
        {uploading && (
          <div style={{
            marginTop: "16px",
            fontSize: "13px",
            color: "#7A9CC4",
          }}>
            Please wait…
          </div>
        )}
      </div>

      {/* Success / error messages */}
      {success && (
        <div style={{
          background: "#0D3320",
          border: "1px solid #166534",
          color: "#4ADE80",
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
          background: "#3D0A0A",
          border: "1px solid #991B1B",
          color: "#F87171",
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
        background: "#0F2040",
        border: "1px solid #1B4F8A",
        borderRadius: "12px",
        padding: "20px",
      }}>
        <h2 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: "16px",
          letterSpacing: "1px",
          color: "#fff",
          textTransform: "uppercase",
          marginBottom: "14px",
        }}>
          Uploaded Files ({files.length})
        </h2>

        {files.length === 0 ? (
          <div style={{ fontSize: "13px", color: "#7A9CC4", textAlign: "center", padding: "20px 0" }}>
            No files uploaded yet.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {files.map((file) => (
              <div key={file.name} style={{
                background: "#0A1628",
                border: "1px solid #1B4F8A",
                borderRadius: "8px",
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: "20px", flexShrink: 0 }}>
                    {getFileIcon(file.name)}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontSize: "13px",
                      color: "#F0F4FF",
                      fontWeight: 500,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}>
                      {file.name.replace(/^\d+_/, "")}
                    </div>
                    <div style={{ fontSize: "11px", color: "#3A5A7A" }}>
                      {formatSize(file.metadata?.size)}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                  <button
                    onClick={() => handleDownload(file.name)}
                    style={{
                      background: "transparent",
                      color: "#7A9CC4",
                      border: "1px solid #1B4F8A",
                      padding: "5px 10px",
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
                      background: "#3D0A0A",
                      color: "#F87171",
                      border: "1px solid #991B1B",
                      padding: "5px 10px",
                      borderRadius: "6px",
                      fontFamily: "'Barlow', sans-serif",
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    {deleting === file.name ? "..." : "Delete"}
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