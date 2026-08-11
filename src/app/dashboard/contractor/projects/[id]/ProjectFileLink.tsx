"use client";

import { createBrowserClient } from "@supabase/ssr";

export default function ProjectFileLink({
  storageObjectKey,
  displayLabel,
  isNew,
}: {
  storageObjectKey: string;
  displayLabel: string;
  isNew?: boolean;
}) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function handleView() {
    // storageObjectKey is always an opaque {uuid}.{ext} (or, for a legacy
    // backfilled file, its pre-existing filename-embedding key) -- either
    // way it's exactly what the signed-URL call needs, and the caller never
    // sees original_filename unless this RPC decided to reveal it.
    const { data } = await supabase.storage
      .from("project-files")
      .createSignedUrl(storageObjectKey, 60);

    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank");
    }
  }

  function getFileIcon(name: string) {
    const ext = name.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "pdf": return "📄";
      case "jpg": case "jpeg": case "png": case "gif": case "webp": case "heic": case "heif": return "🖼️";
      case "doc": case "docx": return "📝";
      case "xls": case "xlsx": return "📊";
      case "dwg": case "dxf": return "📐";
      default: return "📎";
    }
  }

  return (
    <div style={{
      background: "var(--camo-charcoal)",
      border: "1px solid var(--camo-gunmetal)",
      borderRadius: "8px",
      padding: "10px 14px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "12px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "16px" }}>{getFileIcon(displayLabel)}</span>
        <span style={{ fontSize: "13px", color: "var(--camo-paper)" }}>{displayLabel}</span>
        {isNew && (
          <span style={{
            fontSize: "10px",
            fontWeight: 700,
            padding: "2px 8px",
            borderRadius: "20px",
            background: "var(--camo-accent)",
            color: "var(--camo-ink)",
          }}>
            NEW
          </span>
        )}
      </div>
      <button
        onClick={handleView}
        style={{
          background: "transparent",
          color: "var(--camo-steel)",
          border: "1px solid var(--camo-gunmetal)",
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
