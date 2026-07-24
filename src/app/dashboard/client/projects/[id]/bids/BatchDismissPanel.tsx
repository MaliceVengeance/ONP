"use client";

import { useState } from "react";
import { batchDismissBids } from "./actions";

type Reason = { code: string; label: string };
type Candidate = { bidId: string; displayIndex: number; amountLabel: string };

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

export default function BatchDismissPanel({
  projectId,
  candidates,
  reasons,
}: {
  projectId: string;
  candidates: Candidate[];
  reasons: Reason[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [reasonCode, setReasonCode] = useState("");
  const [otherText, setOtherText] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (candidates.length === 0) return null;

  function toggle(bidId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(bidId)) next.delete(bidId);
      else next.add(bidId);
      return next;
    });
  }

  async function handleConfirm() {
    setSubmitting(true);
    try {
      await batchDismissBids(projectId, Array.from(selected), reasonCode || null, reasonCode === "OTHER" ? otherText : null);
    } finally {
      setSubmitting(false);
    }
  }

  const count = selected.size;

  return (
    <div style={{ background: "var(--camo-concrete)", border: "1px solid #d9dbdb", borderRadius: "10px", padding: "20px", marginBottom: "20px" }}>
      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "16px", letterSpacing: "1px", color: "var(--camo-charcoal)", textTransform: "uppercase", marginBottom: "4px" }}>
        Batch Dismiss
      </div>
      <p style={{ fontSize: "12px", color: "var(--camo-gunmetal)", marginBottom: "14px" }}>
        Select multiple bids to dismiss at once — e.g. everything above or below a threshold.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "16px", maxHeight: "260px", overflowY: "auto" }}>
        {candidates.map((c) => (
          <label key={c.bidId} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "var(--camo-charcoal)", cursor: "pointer", background: "#FFFFFF", border: "1px solid #d9dbdb", borderRadius: "6px", padding: "8px 12px" }}>
            <input
              type="checkbox"
              checked={selected.has(c.bidId)}
              onChange={() => toggle(c.bidId)}
              style={{ accentColor: "#991B1B" }}
            />
            <span style={{ flex: 1 }}>Bid #{c.displayIndex}</span>
            <span style={{ fontWeight: 600 }}>{c.amountLabel}</span>
          </label>
        ))}
      </div>

      {count > 0 && !confirming && (
        <>
          <label style={labelStyle}>Reason applied to all selected (optional)</label>
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

          <button
            type="button"
            onClick={() => setConfirming(true)}
            style={{ marginTop: "14px", background: "#FEF2F2", color: "#991B1B", border: "1px solid #FCA5A5", padding: "9px 20px", borderRadius: "6px", fontFamily: "'Barlow', sans-serif", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}
          >
            Dismiss {count} Selected Bid{count !== 1 ? "s" : ""}
          </button>
        </>
      )}

      {confirming && (
        <>
          <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: "8px", padding: "12px 14px", marginBottom: "14px", fontSize: "13px", color: "#991B1B", lineHeight: 1.6 }}>
            <strong>You&apos;re about to permanently dismiss {count} proposal{count !== 1 ? "s" : ""}. This cannot be undone.</strong> Every contractor affected will be notified immediately.
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              type="button"
              disabled={submitting}
              onClick={handleConfirm}
              style={{ background: "#991B1B", color: "#fff", border: "none", padding: "9px 20px", borderRadius: "6px", fontFamily: "'Barlow', sans-serif", fontWeight: 700, fontSize: "13px", cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1 }}
            >
              {submitting ? "Dismissing…" : `Yes, Dismiss ${count} Bid${count !== 1 ? "s" : ""}`}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
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
