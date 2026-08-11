"use client";

import { useState, useRef } from "react";
import { respondToRfi } from "./actions";

export default function RfiResponseForm({
  projectId,
  rfiId,
  inputStyle,
}: {
  projectId: string;
  rfiId: string;
  inputStyle: React.CSSProperties;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return; // guards against a duplicate click producing two submissions
    setSubmitting(true);
    setError(null);
    try {
      const formData = new FormData(formRef.current!);
      await respondToRfi(projectId, rfiId, formData);
      // respondToRfi redirects on success -- if we get here without a
      // redirect having thrown, nothing further to do.
    } catch (err) {
      // Next.js redirect() throws a special internal error to perform the
      // navigation -- only surface genuine failures to the user.
      if (err && typeof err === "object" && "digest" in err && String((err as any).digest).startsWith("NEXT_REDIRECT")) {
        throw err;
      }
      setError(err instanceof Error ? err.message : "Failed to save response.");
      setSubmitting(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
      <label style={{
        display: "block",
        fontSize: "11px",
        fontWeight: 600,
        color: "var(--camo-gunmetal)",
        textTransform: "uppercase",
        letterSpacing: "1px",
        marginBottom: "4px",
      }}>
        Your Response
      </label>
      <textarea
        name="response"
        style={inputStyle}
        placeholder="Type your response here… This will be visible to all contractors bidding on this project."
        required
        disabled={submitting}
      />
      <label style={{
        display: "block",
        fontSize: "11px",
        fontWeight: 600,
        color: "var(--camo-gunmetal)",
        textTransform: "uppercase",
        letterSpacing: "1px",
        margin: "10px 0 4px",
      }}>
        Attach a file (optional)
      </label>
      <input
        type="file"
        name="attachments"
        multiple
        disabled={submitting}
        accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,.doc,.docx,.xls,.xlsx,.txt,.dwg,.dxf"
        style={{ fontSize: "12px", color: "var(--camo-gunmetal)" }}
      />
      <div style={{ fontSize: "11px", color: "var(--camo-gunmetal)", marginTop: "4px" }}>
        Attaching a file here publishes it together with this answer, as one update.
      </div>
      {error && (
        <div style={{
          marginTop: "10px",
          background: "#FEF2F2",
          border: "1px solid #FCA5A5",
          color: "#991B1B",
          padding: "8px 12px",
          borderRadius: "6px",
          fontSize: "12px",
        }}>
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={submitting}
        style={{
          marginTop: "10px",
          background: "var(--camo-accent)",
          color: "var(--camo-ink)",
          border: "none",
          padding: "10px 20px",
          borderRadius: "6px",
          fontFamily: "'Barlow', sans-serif",
          fontWeight: 600,
          fontSize: "13px",
          cursor: submitting ? "default" : "pointer",
          width: "100%",
          opacity: submitting ? 0.7 : 1,
        }}
      >
        {submitting ? "Saving…" : "Post Response"}
      </button>
    </form>
  );
}
