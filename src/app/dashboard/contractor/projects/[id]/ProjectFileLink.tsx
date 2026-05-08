"use client";

import { createBrowserClient } from "@supabase/ssr";

export default function ProjectFileLink({
  projectId,
  fileName,
}: {
  projectId: string;
  fileName: string;
}) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function handleView() {
    const { data } = await supabase.storage
      .from("project-files")
      .createSignedUrl(`${projectId}/${fileName}`, 60);

    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank");
    }
  }

  function getFileIcon(name: string) {
    const ext = name.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "pdf": return "📄";
      case "jpg": case "jpeg": case "png": case "gif": case "webp": return "🖼️";
      case "doc": case "docx": return "📝";
      default: return "📎";
    }
  }

  const displayName = fileName.replace(/^\d+_/, "");

  return (
    <div style={{
      background: "#0A1628",
      border: "1px solid #1B4F8A",
      borderRadius: "8px",
      padding: "10px 14px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "12px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "16px" }}>{getFileIcon(fileName)}</span>
        <span style={{ fontSize: "13px", color: "#F0F4FF" }}>{displayName}</span>
      </div>
      <button
        onClick={handleView}
        style={{
          background: "transparent",
          color: "#7A9CC4",
          border: "1px solid #1B4F8A",
          padding: "4px 10px",
          borderRadius: "6px",
          fontFamily: "'Barlow', sans-serif",
          fontSize: "12px",
          cursor: "pointer",
        }}
      >
        View
      </button>
    </div>
  );
}