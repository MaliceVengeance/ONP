"use client";

import { useState } from "react";
import { deleteProject } from "../actions";

export default function DeleteProjectButton({ projectId }: { projectId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleConfirm() {
    setSubmitting(true);
    try {
      await deleteProject(projectId);
    } finally {
      setSubmitting(false);
    }
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
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
        Delete
      </button>
    );
  }

  return (
    <div style={{ background: "#FFFFFF", border: "1px solid #FCA5A5", borderRadius: "10px", padding: "16px", maxWidth: "360px" }}>
      <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: "8px", padding: "12px 14px", marginBottom: "12px", fontSize: "13px", color: "#991B1B", lineHeight: 1.6 }}>
        <strong>This cannot be undone.</strong> This project never received a bid, so it will be permanently erased — no record retained. Are you sure?
      </div>
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <button
          type="button"
          disabled={submitting}
          onClick={handleConfirm}
          style={{ background: "#991B1B", color: "#fff", border: "none", padding: "9px 20px", borderRadius: "6px", fontFamily: "'Barlow', sans-serif", fontWeight: 700, fontSize: "13px", cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1 }}
        >
          {submitting ? "Deleting…" : "Yes, Permanently Delete"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          style={{ background: "transparent", color: "var(--camo-gunmetal)", border: "1px solid #d9dbdb", padding: "9px 20px", borderRadius: "6px", fontFamily: "'Barlow', sans-serif", fontSize: "13px", cursor: "pointer" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
