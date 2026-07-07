"use client";

import { useState } from "react";
import { CamoCanvas, type CamoVariant } from "./CamoCanvas";

/**
 * ONE-TIME MARKETING/TEACHING MOMENT ONLY.
 *
 * This is not the real in-product bid pattern — it exists purely to teach a
 * first-time visitor what "sealed bid" means. Real bid cards in the dashboard
 * are plain, static, and reveal all-at-once when a project's window closes
 * (see Bid Detail Page spec). Do not reuse this component for actual bid data.
 */
export function SealedBidReveal({ variant = "urban" }: { variant?: CamoVariant }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div
      onClick={() => setRevealed((v) => !v)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setRevealed((v) => !v);
        }
      }}
      style={{
        position: "relative",
        maxWidth: "420px",
        margin: "0 auto",
        borderRadius: "6px",
        overflow: "hidden",
        background: "var(--camo-charcoal)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
        cursor: "pointer",
        userSelect: "none",
      }}
    >
      {/* Camo cover — dissolves on interaction */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 3,
          opacity: revealed ? 0 : 1,
          filter: revealed ? "blur(6px)" : "none",
          transition: "opacity 0.9s ease, filter 0.9s ease",
          pointerEvents: revealed ? "none" : "auto",
        }}
      >
        <CamoCanvas variant={variant} cell={7} seed={42} />
      </div>

      {/* Tap hint, only visible while sealed */}
      {!revealed && (
        <div
          style={{
            position: "relative",
            zIndex: 4,
            height: "100%",
            minHeight: "220px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "0.78rem",
              color: "var(--camo-concrete)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              background: "rgba(21,23,26,0.65)",
              padding: "8px 16px",
              borderRadius: "20px",
              border: "1px solid rgba(233,234,234,0.3)",
            }}
          >
            Tap to declassify
          </span>
        </div>
      )}

      {/* Bid face — underneath the cover */}
      <div
        style={{
          position: revealed ? "relative" : "absolute",
          inset: 0,
          zIndex: 1,
          padding: "34px 28px",
          color: "var(--camo-concrete)",
          textAlign: "left",
        }}
      >
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "0.72rem",
            color: "var(--camo-steel)",
            display: "block",
            marginBottom: "6px",
          }}
        >
          BID #ONP-10432 · ROOFING · SOCORRO, TX
        </span>
        <div
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 800,
            fontSize: "2.6rem",
            color: "var(--camo-concrete)",
            opacity: revealed ? 1 : 0,
            transition: "opacity 0.6s ease 0.3s",
          }}
        >
          $8,450
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "16px",
            fontSize: "0.85rem",
            color: "var(--camo-steel)",
          }}
        >
          <span>Bravo Remodeling</span>
          <span>Veteran Owned ★</span>
        </div>
        {revealed && (
          <span
            style={{
              display: "inline-block",
              marginTop: "18px",
              padding: "6px 14px",
              borderRadius: "20px",
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "0.7rem",
              letterSpacing: "0.08em",
              background: "rgba(92,138,107,0.15)",
              color: "var(--camo-good)",
              border: "1px solid rgba(92,138,107,0.4)",
            }}
          >
            ✓ VERIFIED · LICENSED · INSURED
          </span>
        )}
      </div>
    </div>
  );
}
