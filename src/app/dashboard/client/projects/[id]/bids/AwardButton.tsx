"use client";

import { useState } from "react";
import { awardBid, type BidReview } from "./actions";

type OtherBid = {
  bidId: string;
  displayIndex: number;
};

const inputStyle = {
  width: "100%",
  background: "#FFFFFF",
  border: "1px solid #B8D0E8",
  color: "#1E3A8A",
  borderRadius: "6px",
  padding: "8px 12px",
  fontFamily: "'Barlow', sans-serif",
  fontSize: "13px",
  outline: "none",
  boxSizing: "border-box",
} as React.CSSProperties;

const textareaStyle = {
  ...inputStyle,
  minHeight: "60px",
  resize: "vertical",
  marginTop: "6px",
} as React.CSSProperties;

const labelStyle = {
  display: "block",
  fontSize: "11px",
  fontWeight: 600,
  color: "#1B4F8A",
  textTransform: "uppercase",
  letterSpacing: "1px",
  marginBottom: "4px",
} as React.CSSProperties;

export default function AwardButton({
  projectId,
  bidId,
  bidDisplayIndex,
  otherBids,
}: {
  projectId: string;
  bidId: string;
  bidDisplayIndex: number;
  otherBids: OtherBid[];
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [checked, setChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [rank1Note, setRank1Note] = useState("");
  const [rank2BidId, setRank2BidId] = useState("");
  const [rank2Note, setRank2Note] = useState("");
  const [rank3BidId, setRank3BidId] = useState("");
  const [rank3Note, setRank3Note] = useState("");

  async function handleAward() {
    setSubmitting(true);
    try {
      const reviews: BidReview[] = [
        { bidId, rank: 1, note: rank1Note },
      ];
      if (rank2BidId) reviews.push({ bidId: rank2BidId, rank: 2, note: rank2Note });
      if (rank3BidId) reviews.push({ bidId: rank3BidId, rank: 3, note: rank3Note });

      await awardBid(projectId, bidId, reviews);
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setShowConfirm(false);
    setChecked(false);
    setRank1Note("");
    setRank2BidId("");
    setRank2Note("");
    setRank3BidId("");
    setRank3Note("");
  }

  const rank2Options = otherBids.filter((b) => b.bidId !== rank3BidId);
  const rank3Options = otherBids.filter((b) => b.bidId !== rank2BidId);

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
      {/* Disclaimer */}
      <div style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontWeight: 700,
        fontSize: "17px",
        letterSpacing: "1px",
        color: "#1E3A8A",
        marginBottom: "10px",
      }}>
        Before You Award This Bid
      </div>

      <div style={{ fontSize: "13px", color: "#1B4F8A", lineHeight: 1.6, marginBottom: "12px" }}>
        The bid you&apos;re about to accept is the contractor&apos;s best estimate based on available
        information. <strong style={{ color: "#1E3A8A" }}>It is not a fixed-price quote</strong> unless
        the contractor has explicitly agreed to one in writing with you.
      </div>

      <div style={{
        background: "#EEF4FF",
        border: "1px solid #B8D0E8",
        borderRadius: "8px",
        padding: "12px 14px",
        marginBottom: "14px",
        fontSize: "12px",
        color: "#1E3A8A",
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
        <span style={{ fontSize: "13px", color: "#1E3A8A", lineHeight: 1.5 }}>
          I understand the bid is an estimate and final cost may vary based on actual site conditions.
        </span>
      </label>

      {/* Ranking section — reveals after accepting disclaimer */}
      {checked && (
        <div style={{
          background: "#F8FAFF",
          border: "1px solid #B8D0E8",
          borderRadius: "8px",
          padding: "16px",
          marginBottom: "16px",
        }}>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "15px",
            letterSpacing: "1px",
            color: "#1E3A8A",
            textTransform: "uppercase",
            marginBottom: "4px",
          }}>
            Rank the Top Bids
          </div>
          <p style={{ fontSize: "12px", color: "#4A7FB5", marginBottom: "16px", lineHeight: 1.5 }}>
            Optional — helps contractors understand where they placed. Amounts are shared anonymously; names are never revealed to other contractors.
          </p>

          {/* Rank 1 — always the awarded bid */}
          <div style={{ marginBottom: "14px" }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "8px",
            }}>
              <span style={{ fontSize: "18px" }}>🥇</span>
              <span style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: "14px",
                color: "#1E3A8A",
                letterSpacing: "0.5px",
              }}>
                Rank 1 — Awarded (Bid #{bidDisplayIndex})
              </span>
            </div>
            <label style={labelStyle}>Note for this contractor (optional)</label>
            <textarea
              value={rank1Note}
              onChange={(e) => setRank1Note(e.target.value)}
              style={textareaStyle}
              placeholder="e.g. Great attention to detail in your bid notes — exactly what we were looking for."
            />
          </div>

          {/* Rank 2 — optional */}
          {otherBids.length >= 1 && (
            <div style={{ marginBottom: "14px" }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "8px",
              }}>
                <span style={{ fontSize: "18px" }}>🥈</span>
                <span style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 700,
                  fontSize: "14px",
                  color: "#1E3A8A",
                  letterSpacing: "0.5px",
                }}>
                  Rank 2 (optional)
                </span>
              </div>
              <label style={labelStyle}>Select bid</label>
              <select
                value={rank2BidId}
                onChange={(e) => { setRank2BidId(e.target.value); setRank2Note(""); }}
                style={{ ...inputStyle, display: "block" }}
              >
                <option value="">— Skip —</option>
                {rank2Options.map((b) => (
                  <option key={b.bidId} value={b.bidId}>
                    Bid #{b.displayIndex}
                  </option>
                ))}
              </select>
              {rank2BidId && (
                <>
                  <label style={{ ...labelStyle, marginTop: "10px" }}>Note for this contractor (optional)</label>
                  <textarea
                    value={rank2Note}
                    onChange={(e) => setRank2Note(e.target.value)}
                    style={textareaStyle}
                    placeholder="e.g. Very competitive price — came in a close second."
                  />
                </>
              )}
            </div>
          )}

          {/* Rank 3 — only shows if rank 2 was selected */}
          {otherBids.length >= 2 && rank2BidId && (
            <div style={{ marginBottom: "4px" }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "8px",
              }}>
                <span style={{ fontSize: "18px" }}>🥉</span>
                <span style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 700,
                  fontSize: "14px",
                  color: "#1E3A8A",
                  letterSpacing: "0.5px",
                }}>
                  Rank 3 (optional)
                </span>
              </div>
              <label style={labelStyle}>Select bid</label>
              <select
                value={rank3BidId}
                onChange={(e) => { setRank3BidId(e.target.value); setRank3Note(""); }}
                style={{ ...inputStyle, display: "block" }}
              >
                <option value="">— Skip —</option>
                {rank3Options.map((b) => (
                  <option key={b.bidId} value={b.bidId}>
                    Bid #{b.displayIndex}
                  </option>
                ))}
              </select>
              {rank3BidId && (
                <>
                  <label style={{ ...labelStyle, marginTop: "10px" }}>Note for this contractor (optional)</label>
                  <textarea
                    value={rank3Note}
                    onChange={(e) => setRank3Note(e.target.value)}
                    style={textareaStyle}
                    placeholder="e.g. Solid bid — would consider for future projects."
                  />
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
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
          onClick={reset}
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
        Awarding reveals the contractor&apos;s identity. This action cannot be undone.{" "}
        <a href="/bid-disclaimer" target="_blank" style={{ color: "#1B4F8A" }}>
          Read full bid disclaimer →
        </a>
      </div>
    </div>
  );
}
