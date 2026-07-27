"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { submitProblemReport } from "@/lib/problemReport/actions";

export default function ReportProblemButton() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setOpen(false);
    setDescription("");
    setDone(false);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const formData = new FormData(e.currentTarget);
      formData.set("page_url", pathname ?? "unknown page");
      await submitProblemReport(formData);
      setDone(true);
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          zIndex: 9999,
          background: "var(--camo-charcoal, #202326)",
          color: "var(--camo-accent, #FF9E1B)",
          border: "1px solid var(--camo-accent, #FF9E1B)",
          borderRadius: "24px",
          padding: "8px 16px",
          fontFamily: "'Barlow', sans-serif",
          fontSize: "12px",
          fontWeight: 600,
          cursor: "pointer",
          boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
        }}
      >
        🐞 Report a Problem
      </button>

      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={reset}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "10px",
              padding: "24px",
              maxWidth: "420px",
              width: "100%",
              fontFamily: "'Barlow', sans-serif",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {done ? (
              <>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "#15803D", marginBottom: "8px" }}>
                  ✅ Thanks — we got it.
                </div>
                <p style={{ fontSize: "13px", color: "#4B5054", marginBottom: "16px" }}>
                  Your report has been logged and the team's been notified.
                </p>
                <button
                  type="button"
                  onClick={reset}
                  style={{ background: "#202326", color: "#fff", border: "none", padding: "9px 20px", borderRadius: "6px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
                >
                  Close
                </button>
              </>
            ) : (
              <form onSubmit={handleSubmit}>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "#202326", marginBottom: "4px" }}>
                  Report a Problem
                </div>
                <p style={{ fontSize: "12px", color: "#4B5054", marginBottom: "14px" }}>
                  Currently on: <code>{pathname}</code>
                </p>

                <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#4B5054", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>
                  What went wrong? <span style={{ color: "#B45050" }}>*</span>
                </label>
                <textarea
                  name="description"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Describe what happened..."
                  style={{ width: "100%", border: "1px solid #d9dbdb", borderRadius: "6px", padding: "8px 12px", fontFamily: "'Barlow', sans-serif", fontSize: "13px", boxSizing: "border-box", resize: "vertical", marginBottom: "12px" }}
                />

                <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#4B5054", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>
                  Screenshot (optional)
                </label>
                <input
                  type="file"
                  name="screenshot"
                  accept="image/png,image/jpeg,image/webp"
                  style={{ width: "100%", fontSize: "12px", marginBottom: "14px" }}
                />

                {error && (
                  <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", color: "#991B1B", padding: "8px 12px", borderRadius: "6px", fontSize: "12px", marginBottom: "12px" }}>
                    {error}
                  </div>
                )}

                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      background: submitting ? "#d9dbdb" : "#202326",
                      color: submitting ? "#4B5054" : "#FF9E1B",
                      border: "none",
                      padding: "9px 20px",
                      borderRadius: "6px",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: submitting ? "not-allowed" : "pointer",
                    }}
                  >
                    {submitting ? "Sending…" : "Submit"}
                  </button>
                  <button
                    type="button"
                    onClick={reset}
                    style={{ background: "transparent", color: "#4B5054", border: "1px solid #d9dbdb", padding: "9px 16px", borderRadius: "6px", fontSize: "13px", cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
