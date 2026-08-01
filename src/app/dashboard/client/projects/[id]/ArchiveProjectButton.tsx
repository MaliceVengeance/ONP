"use client";

import { archiveProject } from "../actions";

export default function ArchiveProjectButton({ projectId }: { projectId: string }) {
  return (
    <form
      action={archiveProject.bind(null, projectId)}
      onSubmit={(e) => {
        if (!confirm("Archive this project? It will be removed from your active list, but all records are retained.")) {
          e.preventDefault();
        }
      }}
    >
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
      >
        Archive
      </button>
    </form>
  );
}
