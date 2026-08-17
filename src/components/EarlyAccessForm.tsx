"use client";

import { useRef, useState } from "react";
import { joinEarlyAccessList, type EarlyAccessJoinResult } from "@/lib/earlyAccess/actions";
import { ZIP_INPUT_PATTERN, EARLY_ACCESS_ROLES, type EarlyAccessRole } from "@/lib/earlyAccess/normalize";
import { PROJECT_CATEGORIES } from "@/lib/projects/categories";
import { trackEvent } from "@/lib/analytics";

const ROLE_LABELS: Record<EarlyAccessRole, string> = {
  CLIENT: "Client / Homeowner",
  CONTRACTOR: "Contractor",
  PROPERTY_MANAGER: "Property Manager / Developer",
};

function formatCategoryLabel(cat: string): string {
  return cat
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

const inputStyle: React.CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #d9dbdb",
  color: "var(--camo-charcoal)",
  borderRadius: "6px",
  padding: "10px 14px",
  fontFamily: "'Barlow', sans-serif",
  fontSize: "14px",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: 600,
  color: "var(--camo-gunmetal)",
  display: "block",
  marginBottom: "6px",
};

/**
 * Public Early Access interest form. Fires early_access_form_start (once,
 * on first field interaction), early_access_role_selected, and
 * early_access_signup / early_access_signup_failed based on the server
 * action's result — never with email, ZIP, or trade in the event params.
 * The honeypot input below must stay CSS-hidden (not type="hidden") and
 * must never be populated by legitimate submit code.
 */
export default function EarlyAccessForm() {
  const [email, setEmail] = useState("");
  const [zip, setZip] = useState("");
  const [role, setRole] = useState<EarlyAccessRole | "">("");
  const [contractorTrade, setContractorTrade] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<EarlyAccessJoinResult | null>(null);
  const hasFiredFormStart = useRef(false);

  function fireFormStartOnce() {
    if (hasFiredFormStart.current) return;
    hasFiredFormStart.current = true;
    trackEvent("early_access_form_start");
  }

  function handleRoleChange(next: EarlyAccessRole) {
    fireFormStartOnce();
    setRole(next);
    trackEvent("early_access_role_selected", { role: next });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.set("email", email);
      formData.set("zip", zip);
      formData.set("role", role);
      formData.set("contractor_trade", contractorTrade);
      formData.set("marketing_consent", marketingConsent ? "true" : "false");
      const res = await joinEarlyAccessList(formData);
      setResult(res);
      if (res.status === "ok") {
        trackEvent("early_access_signup", { role: role || "UNKNOWN" });
      } else {
        trackEvent("early_access_signup_failed", { reason: res.reason });
      }
    } catch {
      const failure: EarlyAccessJoinResult = {
        status: "error",
        reason: "validation",
        message: "Something went wrong. Please try again.",
      };
      setResult(failure);
      trackEvent("early_access_signup_failed", { reason: "validation" });
    } finally {
      setBusy(false);
    }
  }

  if (result?.status === "ok") {
    return (
      <div
        style={{
          background: "#F0FDF4",
          border: "1px solid #166534",
          borderRadius: "8px",
          padding: "18px",
          textAlign: "center",
          fontSize: "14px",
          color: "#15803D",
        }}
      >
        ✓ Thanks — we&apos;ll let you know when ONP is available in your area.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} onFocus={fireFormStartOnce} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Honeypot — CSS-hidden (not type="hidden", since some bots specifically
          skip that), real users never populate it. */}
      <div style={{ position: "absolute", left: "-9999px", width: "1px", height: "1px", overflow: "hidden" }} aria-hidden="true">
        <label htmlFor="ea-website">Leave this field blank</label>
        <input id="ea-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {result?.status === "error" && (
        <div
          style={{
            background: "rgba(180,80,80,0.1)",
            border: "1px solid #B45050",
            color: "#943A3A",
            padding: "8px 12px",
            borderRadius: "6px",
            fontSize: "12px",
          }}
        >
          {result.message}
        </div>
      )}

      <div>
        <label style={labelStyle} htmlFor="ea-email">Email</label>
        <input
          id="ea-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          style={inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle} htmlFor="ea-zip">ZIP code</label>
        <input
          id="ea-zip"
          required
          maxLength={10}
          pattern={ZIP_INPUT_PATTERN}
          title="5-digit ZIP (12345) or ZIP+4 (12345-6789)"
          value={zip}
          onChange={(e) => setZip(e.target.value)}
          placeholder="79901"
          style={inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle}>I am a...</label>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {EARLY_ACCESS_ROLES.map((r) => (
            <label key={r} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--camo-charcoal)", cursor: "pointer" }}>
              <input type="radio" name="role" value={r} checked={role === r} onChange={() => handleRoleChange(r)} required />
              {ROLE_LABELS[r]}
            </label>
          ))}
        </div>
      </div>

      {role === "CONTRACTOR" && (
        <div>
          <label style={labelStyle} htmlFor="ea-trade">Primary trade (optional)</label>
          <select id="ea-trade" value={contractorTrade} onChange={(e) => setContractorTrade(e.target.value)} style={inputStyle}>
            <option value="">Select a trade…</option>
            {PROJECT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{formatCategoryLabel(cat)}</option>
            ))}
          </select>
        </div>
      )}

      <label style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "12px", color: "var(--camo-gunmetal)", cursor: "pointer" }}>
        <input
          type="checkbox"
          checked={marketingConsent}
          onChange={(e) => setMarketingConsent(e.target.checked)}
          style={{ marginTop: "2px" }}
        />
        Also send me occasional updates about ONP beyond the launch notification.
      </label>

      <p style={{ fontSize: "11px", color: "var(--camo-gunmetal)", lineHeight: 1.6, margin: 0 }}>
        By submitting, you agree ONP can email you when access opens in your area.
      </p>

      <button
        type="submit"
        disabled={busy}
        style={{
          background: "var(--camo-accent)",
          color: "var(--camo-ink)",
          border: "none",
          padding: "12px",
          borderRadius: "6px",
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: "14px",
          textTransform: "uppercase",
          letterSpacing: "0.03em",
          cursor: busy ? "not-allowed" : "pointer",
          opacity: busy ? 0.7 : 1,
        }}
      >
        {busy ? "Joining…" : "Join the Early Access List"}
      </button>
    </form>
  );
}
