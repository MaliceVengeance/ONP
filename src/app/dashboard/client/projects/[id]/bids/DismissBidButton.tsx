"use client";

import { useState } from "react";
import { dismissBid } from "./actions";

type Reason = { code: string; label: string };

const inputStyle = {
  width: "100%",
  background: "#FFFFFF",
  border: "1px solid #d9dbdb",
  color: "var(--camo-charcoal)",
  borderRadius: "6px",
  padding: "8px 12px",
  fontFamily: "'Barlow', sans-serif",
  fontSize: "13px",
  outline: "none",
  boxSizing: "border-box",
} as React.CSSProperties;

const labelStyle = {
  display: "block",
  fontSize: "11px",
  fontWeight: 600,
  color: "var(--camo-gunmetal)",
  textTransform: "uppercase",
  letterSpacing: "1px",
  marginBottom: "4px",
} as React.CSSProperties;

export default function DismissBidButton({
  projectId,
  bidId,
  bidDisplayIndex,
  reasons,
}: {
  projectId: string;
  bidId: string;
  bidDisplayIndex: number;
  reasons: Reason[];
}) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [reasonCode, setReasonCode] = useState("");
  const [otherText, setOtherText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setOpen(false);
    setConfirming(false);
    setReasonCode("");
    setOtherText("");
  }

  async function handleConfirm() {
    setSubmitting(true);
    try {
      await dismissBid(projectId, bidId, reasonCode || null, reasonCode === "OTHER" ? otherText : null);
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          background: "transparent",
          color: "#991B1B",
          border: "1px solid #FCA5A5",
          padding: "8px 16px",
          borderRadius: "6px",
          fontFamily: "'Barlow', sans-serif",
          fontWeight: 600,
          fontSize: "12px",
          cursor: "pointer",
        }}
      >
        Dismiss This Bid
      </button>
    );
  }

  return (
    <div style={{ background: "#FFFFFF", border: "1px solid #FCA5A5", borderRadius: "10px", padding: "18px", marginTop: "8px" }}>
      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "16px", color: "var(--camo-charcoal)", marginBottom: "10px" }}>
        Dismiss Bid #{bidDisplayIndex}?
      </div>

      {!confirming ? (
        <>
          <label style={labelStyle}>Reason (optional)</label>
          <select value={reasonCode} onChange={(e) => setReasonCode(e.target.value)} style={inputStyle}>
            <option value="">— No reason —</option>
            {reasons.map((r) => (
              <option key={r.code} value={r.code}>{r.label}</option>
            ))}
          </select>

          {reasonCode === "OTHER" && (
            <>
              <label style={{ ...labelStyle, marginTop: "10px" }}>Details (optional)</label>
              <textarea
                value={otherText}
                onChange={(e) => setOtherText(e.target.value)}
                style={{ ...inputStyle, minHeight: "60px", resize: "vertical" }}
                maxLength={500}
              />
            </>
          )}

          <div style={{ display: "flex", gap: "10px", marginTop: "14px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setConfirming(true)}
              style={{ background: "#FEF2F2", color: "#991B1B", border: "1px solid #FCA5A5", padding: "9px 20px", borderRadius: "6px", fontFamily: "'Barlow', sans-serif", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}
            >
              Continue
            </button>
            <button
              type="button"
              onClick={reset}
              style={{ background: "transparent", color: "var(--camo-gunmetal)", border: "1px solid #d9dbdb", padding: "9px 20px", borderRadius: "6px", fontFamily: "'Barlow', sans-serif", fontSize: "13px", cursor: "pointer" }}
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: "8px", padding: "12px 14px", marginBottom: "14px", fontSize: "13px", color: "#991B1B", lineHeight: 1.6 }}>
            <strong>This cannot be undone.</strong> Once dismissed, this bid is permanently closed out and the contractor will be notified immediately. Are you sure?
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              type="button"
              disabled={submitting}
              onClick={handleConfirm}
              style={{ background: "#991B1B", color: "#fff", border: "none", padding: "9px 20px", borderRadius: "6px", fontFamily: "'Barlow', sans-serif", fontWeight: 700, fontSize: "13px", cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1 }}
            >
              {submitting ? "Dismissing…" : "Yes, Permanently Dismiss"}
            </button>
            <button
              type="button"
              onClick={reset}
              style={{ background: "transparent", color: "var(--camo-gunmetal)", border: "1px solid #d9dbdb", padding: "9px 20px", borderRadius: "6px", fontFamily: "'Barlow', sans-serif", fontSize: "13px", cursor: "pointer" }}
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
}
