"use client";

import { useState } from "react";

type Decision =
  | "RESOLVED_UPGRADE_JUSTIFIED"
  | "RESOLVED_PARTIAL_CREDIT"
  | "RESOLVED_REFUND"
  | "";

type Props = {
  formAction: (formData: FormData) => Promise<void>;
  upgradeChargeCents: number;
};

export default function ReviewForm({ formAction, upgradeChargeCents }: Props) {
  const [decision, setDecision] = useState<Decision>("");
  const [reasoning, setReasoning] = useState("");
  const [creditCents, setCreditCents] = useState(10000); // $100 default

  const reasoningLen = reasoning.length;
  const canSubmit    = decision !== "" && reasoningLen >= 100;
  const fmt          = (c: number) => `$${(c / 100).toFixed(0)}`;

  const DECISIONS: {
    value: Exclude<Decision, "">;
    label: string;
    description: string;
    bg: string;
    border: string;
    labelColor: string;
    descColor: string;
  }[] = [
    {
      value: "RESOLVED_UPGRADE_JUSTIFIED",
      label: "Upgrade was justified",
      description: `The ${fmt(upgradeChargeCents)} upgrade charge stands. Inspector acted correctly. Escrow released to inspector.`,
      bg: "#F0FDF4",
      border: "#166534",
      labelColor: "#15803D",
      descColor: "#166534",
    },
    {
      value: "RESOLVED_PARTIAL_CREDIT",
      label: "Upgrade was a reasonable judgment call",
      description:
        "Charge stands but client receives a credit. No flag added to inspector's record.",
      bg: "var(--camo-concrete)",
      border: "var(--camo-gunmetal)",
      labelColor: "var(--camo-charcoal)",
      descColor: "var(--camo-gunmetal)",
    },
    {
      value: "RESOLVED_REFUND",
      label: "Upgrade was not justified",
      description: `Full ${fmt(upgradeChargeCents)} refund to client. A flag is added to the inspector's record.`,
      bg: "#FEF2F2",
      border: "#C2410C",
      labelColor: "#9A3412",
      descColor: "#9A3412",
    },
  ];

  return (
    <form action={formAction}>
      {/* Decision selection */}
      <div style={{ marginBottom: "24px" }}>
        <div
          style={{
            fontWeight: 700,
            fontSize: "13px",
            color: "var(--camo-charcoal)",
            marginBottom: "12px",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          Decision <span style={{ color: "var(--camo-accent-dim)" }}>*</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {DECISIONS.map((d) => (
            <label
              key={d.value}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                padding: "14px 16px",
                borderRadius: "10px",
                border: `1px solid ${decision === d.value ? d.border : "#d9dbdb"}`,
                background: decision === d.value ? d.bg : "#FFFFFF",
                cursor: "pointer",
                transition: "border-color 0.15s, background 0.15s",
              }}
            >
              <input
                type="radio"
                name="decision"
                value={d.value}
                checked={decision === d.value}
                onChange={() => setDecision(d.value)}
                style={{ marginTop: "3px", flexShrink: 0, accentColor: "var(--camo-gunmetal)" }}
              />
              <div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: "14px",
                    color: decision === d.value ? d.labelColor : "var(--camo-charcoal)",
                  }}
                >
                  {d.label}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: decision === d.value ? d.descColor : "var(--camo-gunmetal)",
                    marginTop: "3px",
                    lineHeight: 1.5,
                  }}
                >
                  {d.description}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Credit amount — only for PARTIAL_CREDIT */}
      {decision === "RESOLVED_PARTIAL_CREDIT" && (
        <div
          style={{
            background: "var(--camo-concrete)",
            border: "1px solid #d9dbdb",
            borderRadius: "10px",
            padding: "16px 20px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              fontWeight: 700,
              fontSize: "13px",
              color: "var(--camo-charcoal)",
              marginBottom: "6px",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Credit Amount <span style={{ color: "var(--camo-accent-dim)" }}>*</span>
          </div>
          <p style={{ fontSize: "12px", color: "var(--camo-gunmetal)", marginBottom: "12px", marginTop: 0 }}>
            Amount to credit the client&apos;s account ($50–$200). Default is $100.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <input
              type="range"
              min={5000}
              max={20000}
              step={1000}
              value={creditCents}
              onChange={(e) => setCreditCents(Number(e.target.value))}
              style={{ flex: 1, accentColor: "var(--camo-gunmetal)" }}
            />
            <div
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: "26px",
                color: "var(--camo-charcoal)",
                minWidth: "64px",
                textAlign: "right",
              }}
            >
              {fmt(creditCents)}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "11px",
              color: "var(--camo-gunmetal)",
              marginTop: "4px",
            }}
          >
            <span>$50</span>
            <span>$200</span>
          </div>
          {/* Hidden field carries the actual value to the server action */}
          <input type="hidden" name="credit_cents" value={creditCents} />
        </div>
      )}

      {/* Reasoning */}
      <div style={{ marginBottom: "24px" }}>
        <label
          style={{
            display: "block",
            fontWeight: 700,
            fontSize: "13px",
            color: "var(--camo-charcoal)",
            marginBottom: "6px",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          Written Reasoning <span style={{ color: "var(--camo-accent-dim)" }}>*</span>
        </label>
        <p style={{ fontSize: "12px", color: "var(--camo-gunmetal)", marginBottom: "8px", marginTop: 0 }}>
          Explain your decision. This will be shared with both the client and the inspector.
          Minimum 100 characters.
        </p>
        <textarea
          name="reasoning"
          value={reasoning}
          onChange={(e) => setReasoning(e.target.value)}
          maxLength={2000}
          rows={8}
          placeholder="Based on the project context, the inspector's on-site report and justification, and the client's dispute statement, my finding is…"
          style={{
            width: "100%",
            border: `1px solid ${
              reasoningLen > 0 && reasoningLen < 100 ? "#FCD34D" : "#d9dbdb"
            }`,
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
            marginTop: "4px",
            color:
              reasoningLen < 100 ? "#9CA3AF" : reasoningLen > 1900 ? "var(--camo-accent)" : "#15803D",
          }}
        >
          <span>
            {reasoningLen < 100
              ? `${100 - reasoningLen} more characters required`
              : "✓ Minimum length met"}
          </span>
          <span>{reasoningLen}/2000</span>
        </div>
      </div>

      {/* Refund warning */}
      {decision === "RESOLVED_REFUND" && (
        <div
          style={{
            background: "#FEF2F2",
            border: "1px solid #FCA5A5",
            borderRadius: "8px",
            padding: "14px 16px",
            marginBottom: "20px",
            fontSize: "13px",
            color: "#991B1B",
          }}
        >
          <strong>⚠ Irreversible Action:</strong> Submitting this decision will process a{" "}
          {fmt(upgradeChargeCents)} Stripe refund to the client and add a flag to the
          inspector&apos;s record. This cannot be undone.
        </div>
      )}

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
          cursor: canSubmit ? "pointer" : "not-allowed",
          letterSpacing: "0.5px",
          transition: "background 0.15s",
        }}
      >
        Submit Decision
      </button>
      <p
        style={{
          fontSize: "11px",
          color: "#9CA3AF",
          textAlign: "center",
          marginTop: "10px",
        }}
      >
        This decision is final and will immediately trigger notifications to the client and
        inspector.
      </p>
    </form>
  );
}
