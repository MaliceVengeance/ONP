"use client";

import { useState } from "react";
import { awardBid } from "./actions";

export default function AwardButton({
  projectId,
  bidId,
}: {
  projectId: string;
  bidId: string;
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [checked, setChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleAward() {
    setSubmitting(true);
    try {
      await awardBid(projectId, bidId);
    } finally {
      setSubmitting(false);
    }
  }

  if (!showConfirm) {
    return (
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        style={{
          background: "#C8102E",
          color: "#fff",
          border: "none",
          padding: "10px 24px",
          borderRadius: "6px",
          fontFamily: "'Barlow', sans-serif",
          fontWeight: 600,
          fontSize: "13px",
          cursor: "pointer",
          letterSpacing: "0.5px",
        }}
      >
        Award This Bid
      </button>
    );
  }

  return (
    <div style={{
      background: "#FFFFFF",
      border: "1px solid #FCA5A5",
      borderRadius: "10px",
      padding: "20px",
      marginTop: "8px",
    }}>
      <div style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontWeight: 700,
        fontSize: "17px",
        letterSpacing: "1px",
        color: "#0A1628",
        marginBottom: "10px",
      }}>
        Before You Award This Bid
      </div>

      <div style={{ fontSize: "13px", color: "#1B4F8A", lineHeight: 1.6, marginBottom: "12px" }}>
        The bid you're about to accept is the contractor's best estimate based on available
        information. <strong style={{ color: "#0A1628" }}>It is not a fixed-price quote</strong> unless
        the contractor has explicitly agreed to one in writing with you.
      </div>

      <div style={{
        background: "#EEF4FF",
        border: "1px solid #B8D0E8",
        borderRadius: "8px",
        padding: "12px 14px",
        marginBottom: "14px",
        fontSize: "12px",
        color: "#0A1628",
        lineHeight: 1.7,
      }}>
        <strong>Final pricing may be affected by:</strong>
        <ul style={{ margin: "6px 0 0 16px", padding: 0 }}>
          <li>Conditions discovered during a site visit (hidden damage, code issues, access limitations)</li>
          <li>Worst-case allowances the contractor included to protect against underbidding</li>
          <li>Changes you request after work begins</li>
          <li>Material price changes between bid and start date</li>
        </ul>
      </div>

      <label style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "10px",
        cursor: "pointer",
        marginBottom: "16px",
      }}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          style={{ marginTop: "2px", accentColor: "#1B4F8A", flexShrink: 0 }}
        />
        <span style={{ fontSize: "13px", color: "#0A1628", lineHeight: 1.5 }}>
          I understand the bid is an estimate and final cost may vary based on actual site conditions.
        </span>
      </label>

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <button
          type="button"
          disabled={!checked || submitting}
          onClick={handleAward}
          style={{
            background: checked ? "#C8102E" : "#B8D0E8",
            color: "#fff",
            border: "none",
            padding: "10px 24px",
            borderRadius: "6px",
            fontFamily: "'Barlow', sans-serif",
            fontWeight: 600,
            fontSize: "13px",
            cursor: checked && !submitting ? "pointer" : "not-allowed",
            letterSpacing: "0.5px",
            opacity: submitting ? 0.7 : 1,
          }}
        >
          {submitting ? "Awarding…" : "Confirm Award"}
        </button>
        <button
          type="button"
          onClick={() => { setShowConfirm(false); setChecked(false); }}
          style={{
            background: "transparent",
            color: "#1B4F8A",
            border: "1px solid #B8D0E8",
            padding: "10px 20px",
            borderRadius: "6px",
            fontFamily: "'Barlow', sans-serif",
            fontSize: "13px",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>

      <div style={{ fontSize: "11px", color: "#4A7FB5", marginTop: "10px" }}>
        Awarding reveals the contractor's identity. This action cannot be undone.{" "}
        <a href="/bid-disclaimer" target="_blank" style={{ color: "#1B4F8A" }}>
          Read full bid disclaimer →
        </a>
      </div>
    </div>
  );
}
