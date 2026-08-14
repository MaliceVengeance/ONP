"use client";

import { useRef, useState } from "react";
import { submitRfi } from "./actions";
import { isNextRedirectError } from "@/lib/isNextRedirectError";

type RfiCatalogItem = {
  id: string;
  code: string;
  prompt: string;
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--camo-charcoal)",
  border: "1px solid var(--camo-gunmetal)",
  color: "var(--camo-paper)",
  borderRadius: "6px",
  padding: "10px 14px",
  fontFamily: "'Barlow', sans-serif",
  fontSize: "14px",
  outline: "none",
  marginTop: "6px",
};

export default function AskQuestionForm({
  projectId,
  availableCatalog,
}: {
  projectId: string;
  availableCatalog: RfiCatalogItem[];
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
      await submitRfi(projectId, formData);
      // submitRfi redirects on success -- if we get here without a redirect
      // having thrown, nothing further to do.
    } catch (err) {
      // Next.js redirect() throws a special internal error to perform the
      // navigation -- only surface genuine failures to the user, not this.
      if (isNextRedirectError(err)) {
        throw err;
      }
      // Expected, anticipated validation rejections (e.g. "already asked",
      // "please select a question type", "project is not open for RFIs")
      // arrive here as a normal Error with a safe, user-facing message --
      // submitRfi never throws anything else. Fall back to a generic
      // message rather than exposing internals for any unexpected shape.
      setError(err instanceof Error ? err.message : "Failed to submit question. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
      <label style={{
        display: "block",
        fontSize: "11px",
        fontWeight: 600,
        color: "var(--camo-steel)",
        textTransform: "uppercase",
        letterSpacing: "1px",
      }}>
        Question Type
      </label>
      <select
        name="catalog_id"
        style={inputStyle}
        required
        disabled={submitting}
      >
        <option value="">Select a question type…</option>
        {availableCatalog.map((c) => (
          <option key={c.id} value={c.id}>
            {c.prompt}
          </option>
        ))}
      </select>

      <label style={{
        display: "block",
        fontSize: "11px",
        fontWeight: 600,
        color: "var(--camo-steel)",
        textTransform: "uppercase",
        letterSpacing: "1px",
        marginTop: "14px",
      }}>
        Additional Details (optional)
      </label>
      <textarea
        name="question"
        style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
        placeholder="Add any specific details about your question…"
        disabled={submitting}
      />

      {error && (
        <div style={{
          marginTop: "12px",
          background: "#3D0A0A",
          border: "1px solid #991B1B",
          color: "#F87171",
          padding: "10px 14px",
          borderRadius: "6px",
          fontSize: "13px",
        }}>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        style={{
          marginTop: "12px",
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
        {submitting ? "Submitting…" : "Submit Question"}
      </button>
    </form>
  );
}
