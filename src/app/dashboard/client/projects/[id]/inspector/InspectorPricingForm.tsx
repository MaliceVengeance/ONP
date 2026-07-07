"use client";

import { useState } from "react";

export type PriceOption = {
  pricing_key: string;
  display_name: string;
  description: string | null;
  fee_cents: number;
};

type Props = {
  options: PriceOption[];
  formAction: (formData: FormData) => Promise<void>;
};

function formatFee(cents: number) {
  return `$${(cents / 100).toFixed(0)}`;
}

export default function InspectorPricingForm({ options, formAction }: Props) {
  const defaultKey = options.find((o) => o.pricing_key === "STANDARD")?.pricing_key
    ?? options[0]?.pricing_key
    ?? "";

  const [selectedKey, setSelectedKey] = useState(defaultKey);
  const [disclaimerChecked, setDisclaimerChecked] = useState(false);

  const selectedOption = options.find((o) => o.pricing_key === selectedKey);

  return (
    <form action={formAction}>
      {/* Hidden input carries the selected key to the server */}
      <input type="hidden" name="pricing_key" value={selectedKey} />

      {/* Section label */}
      <div
        style={{
          fontSize: "11px",
          color: "var(--camo-gunmetal)",
          textTransform: "uppercase",
          letterSpacing: "1px",
          marginBottom: "10px",
          fontWeight: 600,
        }}
      >
        Select Inspection Type
      </div>

      {/* Options */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
        {options.map((opt) => {
          const isSelected = selectedKey === opt.pricing_key;
          return (
            <div
              key={opt.pricing_key}
              onClick={() => setSelectedKey(opt.pricing_key)}
              style={{
                background: isSelected ? "var(--camo-gunmetal)" : "#FFFFFF",
                border: `2px solid ${isSelected ? "var(--camo-gunmetal)" : "#d9dbdb"}`,
                borderRadius: "8px",
                padding: "14px 16px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <span
                    style={{
                      fontWeight: 600,
                      fontSize: "14px",
                      color: isSelected ? "#fff" : "var(--camo-charcoal)",
                    }}
                  >
                    {opt.display_name}
                  </span>
                  {opt.pricing_key === "STANDARD" && (
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: "20px",
                        background: isSelected ? "rgba(255,255,255,0.18)" : "var(--camo-concrete)",
                        color: isSelected ? "#fff" : "var(--camo-gunmetal)",
                        border: `1px solid ${isSelected ? "rgba(255,255,255,0.3)" : "#d9dbdb"}`,
                        letterSpacing: "0.5px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      MOST POPULAR
                    </span>
                  )}
                  {opt.pricing_key === "COMPREHENSIVE" && (
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: "20px",
                        background: isSelected ? "rgba(255,255,255,0.18)" : "#FEF2F2",
                        color: isSelected ? "#fff" : "var(--camo-accent)",
                        border: `1px solid ${isSelected ? "rgba(255,255,255,0.3)" : "#FECACA"}`,
                        letterSpacing: "0.5px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      FULL SCOPE
                    </span>
                  )}
                </div>
                {opt.description && (
                  <div
                    style={{
                      fontSize: "12px",
                      color: isSelected ? "rgba(255,255,255,0.75)" : "var(--camo-gunmetal)",
                      marginTop: "4px",
                      lineHeight: 1.5,
                    }}
                  >
                    {opt.description}
                  </div>
                )}
              </div>
              <div
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 700,
                  fontSize: "18px",
                  color: isSelected ? "#fff" : "var(--camo-charcoal)",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {formatFee(opt.fee_cents)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Fee summary */}
      {selectedOption && (
        <div
          style={{
            background: "#F0FDF4",
            border: "1px solid #BBF7D0",
            borderRadius: "8px",
            padding: "14px 16px",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "11px",
                color: "#15803D",
                textTransform: "uppercase",
                letterSpacing: "1px",
                marginBottom: "2px",
              }}
            >
              Total — one-time, non-refundable
            </div>
            <div
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: "28px",
                fontWeight: 700,
                color: "var(--camo-charcoal)",
              }}
            >
              {formatFee(selectedOption.fee_cents)}
            </div>
          </div>
          <div style={{ fontSize: "12px", color: "#15803D", textAlign: "right", lineHeight: 1.6 }}>
            {selectedOption.display_name}
            <br />
            <span style={{ color: "var(--camo-gunmetal)" }}>Typically scheduled within 3–5 business days</span>
          </div>
        </div>
      )}

      {/* Disclaimer notice */}
      <div
        style={{
          background: "#FFFBEB",
          border: "1px solid #FCD34D",
          borderRadius: "8px",
          padding: "14px 16px",
          marginBottom: "16px",
          fontSize: "12px",
          color: "#92400E",
          lineHeight: 1.7,
        }}
      >
        <strong>Before you continue:</strong> ONP Inspectors provide targeted bid-accuracy
        inspections — not full real estate or pre-purchase inspections. Your fee is non-refundable
        once an inspection is scheduled. The inspector&apos;s report will be shared with contractors
        bidding on your project.
      </div>

      {/* Disclaimer checkbox */}
      <label
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "10px",
          marginBottom: "20px",
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
          I have read and agree to the <strong>Inspector Request terms</strong>. I understand
          my inspection fee is non-refundable and the report will be shared with bidding
          contractors.
        </span>
      </label>

      {/* Submit */}
      <button
        type="submit"
        disabled={!disclaimerChecked || !selectedKey}
        style={{
          background: disclaimerChecked && selectedKey ? "var(--camo-accent)" : "#E5E7EB",
          color: disclaimerChecked && selectedKey ? "var(--camo-ink)" : "#9CA3AF",
          border: "none",
          padding: "14px 28px",
          borderRadius: "6px",
          fontFamily: "'Barlow', sans-serif",
          fontWeight: 700,
          fontSize: "14px",
          letterSpacing: "0.5px",
          cursor: disclaimerChecked && selectedKey ? "pointer" : "not-allowed",
          width: "100%",
          transition: "background 0.15s",
        }}
      >
        Continue to Payment
        {selectedOption ? ` — ${formatFee(selectedOption.fee_cents)}` : ""}
      </button>
    </form>
  );
}
