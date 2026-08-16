"use client";

import { useState, useRef, useEffect } from "react";
import { respondToRfi } from "./actions";
import { classifyPreview, removeFileAt, formatFileSize, submitButtonLabel } from "@/lib/rfiAttachmentPreview";

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
  const [files, setFiles] = useState<File[]>([]);
  const [acknowledged, setAcknowledged] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local object URLs for image thumbnails -- created/revoked purely
  // client-side, no Storage upload happens to generate a preview.
  const previewUrls = useRef<Map<File, string>>(new Map());
  useEffect(() => {
    return () => {
      previewUrls.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);
  function urlFor(file: File): string {
    let url = previewUrls.current.get(file);
    if (!url) {
      url = URL.createObjectURL(file);
      previewUrls.current.set(file, url);
    }
    return url;
  }

  function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    if (picked.length === 0) return;
    setFiles((prev) => [...prev, ...picked]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleRemove(index: number) {
    const removed = files[index];
    const url = previewUrls.current.get(removed);
    if (url) {
      URL.revokeObjectURL(url);
      previewUrls.current.delete(removed);
    }
    setFiles((prev) => removeFileAt(prev, index));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return; // guards against a duplicate click producing two submissions
    if (files.length > 0 && !acknowledged) {
      setError("You must confirm you understand these attachments will become part of the published project information.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const formData = new FormData(formRef.current!);
      // The real File objects, not whatever the (now-empty, per-pick) hidden
      // input holds -- files are accumulated in local state so they can be
      // individually removed before submission.
      formData.delete("attachments");
      for (const file of files) formData.append("attachments", file);
      formData.set("attachments_acknowledged", files.length > 0 ? "true" : "false");

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
        ref={fileInputRef}
        type="file"
        name="attachments"
        multiple
        disabled={submitting}
        accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,.doc,.docx,.xls,.xlsx,.txt,.dwg,.dxf"
        onChange={handleFilePick}
        style={{ fontSize: "12px", color: "var(--camo-gunmetal)" }}
      />

      {files.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "10px" }}>
          {files.map((file, i) => {
            const kind = classifyPreview(file);
            return (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: "10px",
                background: "#F9FAFB", border: "1px solid #e5e7eb", borderRadius: "6px", padding: "6px 10px",
              }}>
                {kind === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={urlFor(file)} alt={file.name} style={{ width: "36px", height: "36px", objectFit: "cover", borderRadius: "4px" }} />
                ) : (
                  <span style={{ fontSize: "18px" }}>📎</span>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "12px", color: "var(--camo-charcoal)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {file.name}
                  </div>
                  <div style={{ fontSize: "10px", color: "var(--camo-gunmetal)" }}>
                    {file.type || "file"} — {formatFileSize(file.size)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(i)}
                  disabled={submitting}
                  style={{ background: "transparent", border: "none", color: "#991B1B", cursor: "pointer", fontSize: "16px", lineHeight: 1 }}
                  aria-label={`Remove ${file.name}`}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}

      {files.length > 0 && (
        <>
          <div style={{
            marginTop: "12px",
            background: "#FFF7ED",
            border: "1px solid #FDBA74",
            color: "#9A3412",
            padding: "10px 12px",
            borderRadius: "6px",
            fontSize: "11px",
            lineHeight: 1.5,
          }}>
            Attachments become part of the official RFI response. Contractors may use these files when preparing or revising their bids. Review each file carefully before submitting. After publication, files can only be withdrawn under ONP&apos;s published-file removal process.
          </div>
          <label style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginTop: "10px", fontSize: "12px", color: "var(--camo-charcoal)" }}>
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              disabled={submitting}
              style={{ marginTop: "2px" }}
            />
            I understand that these attachments will become part of the published project information once I submit this response.
          </label>
        </>
      )}

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
        disabled={submitting || (files.length > 0 && !acknowledged)}
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
          opacity: submitting || (files.length > 0 && !acknowledged) ? 0.7 : 1,
        }}
      >
        {submitting ? "Saving…" : submitButtonLabel(files.length)}
      </button>
    </form>
  );
}
