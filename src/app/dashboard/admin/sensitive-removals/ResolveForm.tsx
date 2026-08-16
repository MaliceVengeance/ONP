"use client";

import { useState } from "react";
import { resolveSensitiveRemoval } from "./actions";

const OPTIONS = [
  { value: "REACKNOWLEDGE_ALLOWED", label: "Reacknowledge allowed" },
  { value: "BIDDING_REOPENED", label: "Bidding reopened" },
  { value: "PROJECT_RESTARTED", label: "Project restarted" },
  { value: "NO_ACTION_NEEDED", label: "No action needed" },
];

export default function ResolveForm({ projectId, reviewId }: { projectId: string; reviewId: string }) {
  const [resolution, setResolution] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!resolution) {
      setError("Choose a resolution action.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setNotice(null);
    try {
      const result = await resolveSensitiveRemoval(projectId, reviewId, resolution, note.trim() || null);
      if (!result.pauseCleared) {
        setNotice("Resolved, but bidding remains paused — another item on this project is still outstanding (quarantine pending or a separate unresolved review).");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resolve.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "10px" }}>
      <select
        value={resolution}
        onChange={(e) => setResolution(e.target.value)}
        disabled={submitting}
        style={{ fontSize: "12px", padding: "8px 10px", borderRadius: "4px", border: "1px solid #d9dbdb" }}
      >
        <option value="">Resolution…</option>
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Admin note (optional)"
        disabled={submitting}
        style={{ flex: 1, minWidth: "180px", fontSize: "12px", padding: "8px 10px", borderRadius: "4px", border: "1px solid #d9dbdb" }}
      />
      <button
        type="submit"
        disabled={submitting}
        style={{ background: "#F0FDF4", color: "#15803D", border: "1px solid #166534", padding: "8px 16px", borderRadius: "6px", fontFamily: "'Barlow', sans-serif", fontWeight: 600, fontSize: "12px", cursor: "pointer" }}
      >
        {submitting ? "Working…" : "Resolve & Clear Pause"}
      </button>
      {error && <div style={{ width: "100%", fontSize: "12px", color: "#991B1B" }}>{error}</div>}
      {notice && <div style={{ width: "100%", fontSize: "12px", color: "#9A3412" }}>{notice}</div>}
    </form>
  );
}
