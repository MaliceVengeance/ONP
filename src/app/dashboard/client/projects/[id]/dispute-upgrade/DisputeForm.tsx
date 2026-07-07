"use client";

import { useState } from "react";
import { CLIENT_UPGRADE_DISPUTE } from "@/lib/disclaimers/clientUpgradeDispute";

type Props = {
  formAction: (formData: FormData) => Promise<void>;
  upgradeFeeCents: number;
  daysRemaining: number;
};

export default function DisputeForm({ formAction, upgradeFeeCents, daysRemaining }: Props) {
  const [statement, setStatement] = useState("");
  const [inspectorExplained, setInspectorExplained] = useState<string>("");
  const [disclaimerChecked, setDisclaimerChecked] = useState(false);

  const statementLen = statement.length;
  const canSubmit =
    statementLen >= 20 &&
    statementLen <= 1000 &&
    inspectorExplained !== "" &&
    disclaimerChecked;

  const feeFormatted = `$${(upgradeFeeCents / 100).toFixed(0)}`;

  return (
    <form action={formAction}>
      {/* Q1 — Statement */}
      <div style={{ marginBottom: "24px" }}>
        <label
          style={{
            display: "block",
            fontWeight: 700,
            fontSize: "14px",
            color: "var(--camo-charcoal)",
            marginBottom: "6px",
          }}
        >
          What about the upgrade felt unjustified?{" "}
          <span style={{ color: "var(--camo-accent-dim)" }}>*</span>
        </label>
        <p style={{ fontSize: "12px", color: "var(--camo-gunmetal)", marginBottom: "8px", marginTop: 0 }}>
          Describe what happened, what you observed, and why you believe the upgrade was not
          necessary. Be as specific as possible.
        </p>
        <textarea
          name="statement"
          value={statement}
          onChange={(e) => setStatement(e.target.value)}
          maxLength={1000}
          rows={6}
          placeholder="e.g. The inspector arrived and immediately said it needed to be comprehensive without examining anything. The project was clearly a single-trade scope..."
          style={{
            width: "100%",
            border: `1px solid ${statementLen > 1000 ? "var(--camo-accent)" : "#d9dbdb"}`,
            borderRadius: "8px",
            padding: "12px 14px",
            fontSize: "13px",
            fontFamily: "'Barlow', sans-serif",
            color: "var(--camo-charcoal)",
            background: "#FFFFFF",
            resize: "vertical",
            lineHeight: 1.6,
            boxSizing: "border-box",
          }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "11px",
            color: statementLen > 1000 ? "var(--camo-accent)" : statementLen < 20 ? "#9CA3AF" : "#15803D",
            marginTop: "4px",
          }}
        >
          <span>{statementLen < 20 ? `${20 - statementLen} more characters required` : "✓"}</span>
          <span>{statementLen}/1000</span>
        </div>
      </div>

      {/* Q2 — Did inspector explain on-site */}
      <div style={{ marginBottom: "24px" }}>
        <div
          style={{
            fontWeight: 700,
            fontSize: "14px",
            color: "var(--camo-charcoal)",
            marginBottom: "10px",
          }}
        >
          Did the inspector explain specific reasons for the upgrade on-site?{" "}
          <span style={{ color: "var(--camo-accent-dim)" }}>*</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {[
            { value: "yes", label: "Yes — they gave me specific reasons" },
            { value: "no", label: "No — no explanation was given" },
            { value: "unsure", label: "I'm not sure / I don't recall" },
          ].map(({ value, label }) => (
            <label
              key={value}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "12px 14px",
                borderRadius: "8px",
                border: `1px solid ${inspectorExplained === value ? "var(--camo-gunmetal)" : "#d9dbdb"}`,
                background: inspectorExplained === value ? "var(--camo-concrete)" : "#FFFFFF",
                cursor: "pointer",
                fontSize: "13px",
                color: "var(--camo-charcoal)",
              }}
            >
              <input
                type="radio"
                name="inspector_explained"
                value={value}
                checked={inspectorExplained === value}
                onChange={() => setInspectorExplained(value)}
                style={{ accentColor: "var(--camo-gunmetal)" }}
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      {/* Dispute terms */}
      <div
        style={{
          background: "var(--camo-charcoal)",
          border: "1px solid var(--camo-gunmetal)",
          borderRadius: "10px",
          padding: "18px 20px",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "12px",
            letterSpacing: "1px",
            color: "#d9dbdb",
            textTransform: "uppercase",
            marginBottom: "10px",
          }}
        >
          Dispute Terms — Please Read
        </div>
        <pre
          style={{
            fontSize: "11px",
            color: "var(--camo-steel)",
            lineHeight: 1.7,
            whiteSpace: "pre-wrap",
            fontFamily: "'Barlow', sans-serif",
            margin: 0,
          }}
        >
          {CLIENT_UPGRADE_DISPUTE.text}
        </pre>
      </div>

      {/* Acknowledgment */}
      <label
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "10px",
          marginBottom: "24px",
          cursor: "pointer",
        }}
      >
        <input
          type="checkbox"
          name="disclaimer_accepted"
          checked={disclaimerChecked}
          onChange={(e) => setDisclaimerChecked(e.target.checked)}
          style={{ marginTop: "3px", flexShrink: 0, accentColor: "var(--camo-gunmetal)" }}
        />
        <span style={{ fontSize: "13px", color: "var(--camo-charcoal)", lineHeight: 1.6 }}>
          I have read and understood the dispute terms above. I confirm this dispute is about
          whether the on-site upgrade was justified, and I accept that the Master Inspector&apos;s
          decision is final.
        </span>
      </label>

      {/* Deadline reminder */}
      <div
        style={{
          background: daysRemaining <= 3 ? "#FEF2F2" : "#FFFBEB",
          border: `1px solid ${daysRemaining <= 3 ? "#FCA5A5" : "#FCD34D"}`,
          borderRadius: "8px",
          padding: "12px 16px",
          marginBottom: "20px",
          fontSize: "12px",
          color: daysRemaining <= 3 ? "#991B1B" : "#92400E",
        }}
      >
        <strong>
          {daysRemaining <= 0
            ? "⚠ Dispute window has closed."
            : daysRemaining === 1
            ? "⚠ 1 day remaining to file."
            : `⏰ ${daysRemaining} days remaining in your dispute window.`}
        </strong>{" "}
        After {`${14} days`} from the upgrade charge, this option is no longer available.
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!canSubmit}
        style={{
          width: "100%",
          background: canSubmit ? "var(--camo-accent)" : "#E5E7EB",
          color: canSubmit ? "var(--camo-ink)" : "#9CA3AF",
          border: "none",
          padding: "14px 28px",
          borderRadius: "6px",
          fontFamily: "'Barlow', sans-serif",
          fontWeight: 700,
          fontSize: "15px",
          letterSpacing: "0.5px",
          cursor: canSubmit ? "pointer" : "not-allowed",
          transition: "background 0.15s",
        }}
      >
        Submit Dispute — Request Master Inspector Review
      </button>

      <p style={{ fontSize: "11px", color: "#9CA3AF", textAlign: "center", marginTop: "10px" }}>
        This dispute is free. The {feeFormatted} upgrade charge is held in escrow until resolved.
      </p>
    </form>
  );
}
