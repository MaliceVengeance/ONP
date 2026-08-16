"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadProjectFile } from "./actions";
import { resolveSensitiveRemovalClientDecision } from "./actions";

type PendingReview = {
  id: string;
  attachment_id: string;
  attachment_filename: string;
  status: "PENDING_CLIENT_DECISION" | "PENDING_REVIEW";
};

export default function SensitiveRemovalBanner({
  projectId,
  reviews,
}: {
  projectId: string;
  reviews: PendingReview[];
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);

  async function handleNotNeeded(reviewId: string) {
    setBusyId(reviewId);
    setError(null);
    try {
      await resolveSensitiveRemovalClientDecision(projectId, reviewId, "NOT_NEEDED", null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record your decision.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleUnsure(reviewId: string) {
    setBusyId(reviewId);
    setError(null);
    try {
      await resolveSensitiveRemovalClientDecision(projectId, reviewId, "UNSURE", null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record your decision.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleReplacementFile(reviewId: string, file: File) {
    setBusyId(reviewId);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const uploadResult = await uploadProjectFile(projectId, fd);
      if (!uploadResult?.attachmentId) throw new Error("Upload did not complete.");
      await resolveSensitiveRemovalClientDecision(projectId, reviewId, "REPLACEMENT_UPLOADED", uploadResult.attachmentId);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload the replacement file.");
    } finally {
      setBusyId(null);
      setUploadingFor(null);
    }
  }

  if (reviews.length === 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
      {reviews.map((r) => (
        <div key={r.id} style={{ background: "#FFF7ED", border: "1px solid #FDBA74", borderRadius: "10px", padding: "16px" }}>
          {r.status === "PENDING_REVIEW" ? (
            <div style={{ fontSize: "13px", color: "#9A3412" }}>
              <strong>{r.attachment_filename}</strong> was removed for a privacy concern and is with ONP for review. Bidding remains paused until this is resolved.
            </div>
          ) : (
            <>
              <div style={{ fontSize: "13px", color: "#9A3412", marginBottom: "10px" }}>
                <strong>{r.attachment_filename}</strong> was removed for a privacy concern. Does this file contain project information contractors still need to prepare their bids? Bidding remains paused until you answer.
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                {uploadingFor === r.id ? (
                  <input
                    type="file"
                    disabled={busyId === r.id}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleReplacementFile(r.id, file);
                    }}
                    style={{ fontSize: "12px" }}
                  />
                ) : (
                  <button
                    onClick={() => setUploadingFor(r.id)}
                    disabled={busyId === r.id}
                    style={btnStyle("#F0FDF4", "#15803D", "#166534")}
                  >
                    Yes — I&apos;ll upload a corrected version
                  </button>
                )}
                <button
                  onClick={() => handleNotNeeded(r.id)}
                  disabled={busyId === r.id}
                  style={btnStyle("#F3F4F6", "#374151", "#d1d5db")}
                >
                  No — this file was not needed for bidding
                </button>
                <button
                  onClick={() => handleUnsure(r.id)}
                  disabled={busyId === r.id}
                  style={btnStyle("#FEF2F2", "#991B1B", "#FCA5A5")}
                >
                  I&apos;m not sure — I need help
                </button>
              </div>
            </>
          )}
          {error && busyId === null && <div style={{ fontSize: "12px", color: "#991B1B", marginTop: "8px" }}>{error}</div>}
        </div>
      ))}
    </div>
  );
}

function btnStyle(bg: string, color: string, border: string): React.CSSProperties {
  return {
    background: bg, color, border: `1px solid ${border}`,
    padding: "7px 12px", borderRadius: "6px", fontFamily: "'Barlow', sans-serif",
    fontWeight: 600, fontSize: "12px", cursor: "pointer",
  };
}
