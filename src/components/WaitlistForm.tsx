"use client";

import { useState } from "react";
import { joinWaitlist, type JoinWaitlistResult } from "@/lib/serviceArea/actions";

type Props = {
  source: "HOMEPAGE" | "PROJECT_POST_BLOCKED";
  intendedRole: "CLIENT" | "CONTRACTOR" | "BOTH" | "UNKNOWN";
  defaultZip?: string;
  lockZip?: boolean;
  /** Only cosmetic — the two current call sites (login page, blocked project-post page) use different visual styles. */
  theme?: "dark" | "amber";
};

/**
 * Reusable anonymous waitlist-join form. Replaces the old inline server-action
 * forms that relied on an unreachable ?waitlist=joined redirect param — this
 * tracks real success/failure client-side instead, consistent with the app's
 * existing "use client" + local useState pattern (e.g. FileUploader.tsx)
 * rather than a redirect-driven confirmation.
 */
export default function WaitlistForm({ source, intendedRole, defaultZip, lockZip, theme = "dark" }: Props) {
  const [email, setEmail] = useState("");
  const [zip, setZip] = useState(defaultZip ?? "");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<JoinWaitlistResult | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.set("email", email);
      formData.set("zip", zip);
      formData.set("source", source);
      formData.set("intended_role", intendedRole);
      const res = await joinWaitlist(formData);
      setResult(res);
    } catch {
      setResult({ status: "failed" });
    } finally {
      setBusy(false);
    }
  }

  const isDark = theme === "dark";
  const radius = isDark ? "4px" : "6px";

  const inputStyle: React.CSSProperties = {
    background: isDark ? "var(--camo-paper)" : "#FFFFFF",
    border: "1px solid #d9dbdb",
    color: "var(--camo-charcoal)",
    borderRadius: radius,
    padding: "10px 14px",
    fontFamily: "'Barlow', sans-serif",
    fontSize: "14px",
    outline: "none",
  };

  const buttonStyle: React.CSSProperties = {
    background: isDark ? "var(--camo-charcoal)" : "var(--camo-charcoal)",
    color: isDark ? "var(--camo-concrete)" : "#fff",
    border: "none",
    padding: "11px",
    borderRadius: radius,
    fontFamily: isDark ? "'Barlow Condensed', sans-serif" : "'Barlow', sans-serif",
    fontWeight: isDark ? 700 : 600,
    fontSize: isDark ? "13px" : "13px",
    textTransform: isDark ? "uppercase" : "none",
    letterSpacing: isDark ? "0.03em" : "normal",
    cursor: busy ? "not-allowed" : "pointer",
    opacity: busy ? 0.7 : 1,
  };

  if (result?.status === "joined" || result?.status === "already_joined") {
    return (
      <div style={{
        background: isDark ? "rgba(92,138,107,0.12)" : "#F0FDF4",
        border: `1px solid ${isDark ? "var(--camo-good)" : "#166534"}`,
        borderRadius: isDark ? "4px" : "8px",
        padding: "14px 16px",
        fontSize: "13px",
        color: isDark ? "var(--camo-good)" : "#15803D",
        textAlign: "center",
      }}>
        {result.status === "already_joined"
          ? "✓ You're already on the waitlist — we'll be in touch when ONP launches near you."
          : "✓ Thanks — we'll be in touch when ONP launches near you."}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {(result?.status === "invalid_input" || result?.status === "failed") && (
        <div style={{
          background: "rgba(180,80,80,0.1)",
          border: "1px solid #B45050",
          color: "#943A3A",
          padding: "8px 12px",
          borderRadius: radius,
          fontSize: "12px",
        }}>
          {result.status === "invalid_input"
            ? result.message
            : "Something went wrong adding you to the waitlist. Please try again."}
        </div>
      )}

      <div style={{ display: "flex", gap: "8px" }}>
        {!lockZip && (
          <input
            value={zip}
            onChange={(e) => setZip(e.target.value)}
            required
            maxLength={10}
            placeholder="ZIP code"
            style={{ ...inputStyle, flex: "0 0 100px" }}
          />
        )}
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
          placeholder="your@email.com"
          style={{ ...inputStyle, flex: 1 }}
        />
      </div>

      <button type="submit" disabled={busy} style={buttonStyle}>
        {busy ? "Joining…" : "Join Waitlist"}
      </button>
    </form>
  );
}
