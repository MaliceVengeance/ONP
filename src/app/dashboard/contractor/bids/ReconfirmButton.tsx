"use client";

import { useState } from "react";
import { reconfirmBid } from "./actions";

export default function ReconfirmButton({ bidId }: { bidId: string }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setSubmitting(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("information_acknowledged", "true");
      await reconfirmBid(bidId, fd);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reconfirm.");
      setSubmitting(false);
    }
  }

  if (done) {
    return <div style={{ fontSize: "11px", color: "#15803D", fontWeight: 600 }}>✅ Reconfirmed</div>;
  }

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <div style={{
        background: "#FFF7ED", border: "1px solid #FDBA74", borderRadius: "6px",
        padding: "8px 10px", fontSize: "11px", color: "#9A3412", marginBottom: "6px", lineHeight: 1.5,
      }}>
        Project information changed after bidding closed. Your price and terms are not being edited — reconfirming just tells the client your bid still stands under the updated information.
      </div>
      <button
        onClick={handleClick}
        disabled={submitting}
        style={{
          background: "var(--camo-accent)", color: "var(--camo-ink)", border: "none",
          padding: "6px 14px", borderRadius: "6px", fontFamily: "'Barlow', sans-serif",
          fontWeight: 600, fontSize: "12px", cursor: submitting ? "default" : "pointer",
        }}
      >
        {submitting ? "Reconfirming…" : "Reconfirm My Bid"}
      </button>
      {error && <div style={{ fontSize: "11px", color: "#991B1B", marginTop: "4px" }}>{error}</div>}
    </div>
  );
}
