"use client";

import { deleteProject } from "../actions";

export default function DeleteProjectButton({ projectId }: { projectId: string }) {
  return (
    <form
      action={deleteProject.bind(null, projectId)}
      onSubmit={(e) => {
        if (!confirm("Are you sure you want to remove this project? This cannot be undone.")) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        style={{
          background: "#FEF2F2",
          color: "#991B1B",
          border: "1px solid #FCA5A5",
          padding: "8px 16px",
          borderRadius: "6px",
          fontFamily: "'Barlow', sans-serif",
          fontSize: "13px",
          cursor: "pointer",
        }}
      >
        Remove
      </button>
    </form>
  );
}
