"use client";

import { useState } from "react";
import { updatePriceRow, togglePriceActive } from "./actions";

export type PriceRow = {
  pricing_key: string;
  display_name: string;
  description: string | null;
  fee_cents: number;
  inspector_share_percent: number;
  is_active: boolean;
  sort_order: number;
  updated_at: string;
};

function formatFee(cents: number) {
  return `$${(cents / 100).toFixed(0)}`;
}

function inspectorShare(feeCents: number, pct: number) {
  return `$${Math.round((feeCents * pct) / 100 / 100).toFixed(0)}`;
}

function onpShare(feeCents: number, pct: number) {
  return `$${Math.round((feeCents * (100 - pct)) / 100 / 100).toFixed(0)}`;
}

export default function PricingTable({ rows }: { rows: PriceRow[] }) {
  const [editingKey, setEditingKey] = useState<string | null>(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
      {rows.map((row, i) => {
        const isEditing = editingKey === row.pricing_key;

        return (
          <div
            key={row.pricing_key}
            style={{
              background: isEditing ? "#FFFBEB" : i % 2 === 0 ? "#EEF4FF" : "#FFFFFF",
              borderBottom: "1px solid #B8D0E8",
              padding: "16px 20px",
            }}
          >
            {/* Top row: key + status + edit button */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", marginBottom: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <span style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "3px 8px",
                  borderRadius: "4px",
                  background: "#EEF4FF",
                  color: "#1B4F8A",
                  border: "1px solid #B8D0E8",
                  letterSpacing: "0.3px",
                }}>
                  {row.pricing_key}
                </span>
                <span style={{
                  fontWeight: 600,
                  fontSize: "15px",
                  color: "#1E3A8A",
                }}>
                  {row.display_name}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {/* Active toggle */}
                <form action={togglePriceActive.bind(null, row.pricing_key, row.is_active)}>
                  <button
                    type="submit"
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "4px 10px",
                      borderRadius: "20px",
                      border: "none",
                      cursor: "pointer",
                      letterSpacing: "0.3px",
                      background: row.is_active ? "#F0FDF4" : "#FEF2F2",
                      color: row.is_active ? "#15803D" : "#991B1B",
                      outline: `1px solid ${row.is_active ? "#BBF7D0" : "#FECACA"}`,
                    }}
                  >
                    {row.is_active ? "ACTIVE" : "INACTIVE"}
                  </button>
                </form>

                {/* Edit / Save / Cancel */}
                {isEditing ? (
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      type="submit"
                      form={`edit-${row.pricing_key}`}
                      style={{
                        background: "#15803D",
                        color: "#fff",
                        border: "none",
                        padding: "5px 14px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontFamily: "'Barlow', sans-serif",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingKey(null)}
                      style={{
                        background: "transparent",
                        color: "#6B7280",
                        border: "1px solid #E5E7EB",
                        padding: "5px 12px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontFamily: "'Barlow', sans-serif",
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditingKey(row.pricing_key)}
                    style={{
                      background: "transparent",
                      color: "#1B4F8A",
                      border: "1px solid #B8D0E8",
                      padding: "5px 12px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontFamily: "'Barlow', sans-serif",
                      cursor: "pointer",
                    }}
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>

            {/* Description */}
            <div style={{ fontSize: "13px", color: "#4A7FB5", marginBottom: "12px" }}>
              {isEditing ? (
                <input
                  form={`edit-${row.pricing_key}`}
                  name="description"
                  defaultValue={row.description ?? ""}
                  style={{
                    width: "100%",
                    border: "1px solid #B8D0E8",
                    borderRadius: "4px",
                    padding: "6px 10px",
                    fontSize: "13px",
                    fontFamily: "'Barlow', sans-serif",
                    background: "#fff",
                    color: "#1E3A8A",
                    boxSizing: "border-box",
                  }}
                />
              ) : (
                row.description ?? <em style={{ color: "#9CA3AF" }}>No description</em>
              )}
            </div>

            {/* Stats row: Fee | Insp. % | Inspector Earns | ONP Earns */}
            <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", alignItems: "flex-end" }}>
              {/* Fee */}
              <div>
                <div style={{ fontSize: "10px", color: "#1B4F8A", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "3px" }}>Fee</div>
                {isEditing ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <span style={{ color: "#1E3A8A", fontWeight: 600, fontSize: "14px" }}>$</span>
                    <input
                      form={`edit-${row.pricing_key}`}
                      name="fee_dollars"
                      type="number"
                      min="0"
                      step="1"
                      defaultValue={(row.fee_cents / 100).toFixed(0)}
                      style={{
                        width: "70px",
                        border: "1px solid #B8D0E8",
                        borderRadius: "4px",
                        padding: "5px 8px",
                        fontSize: "14px",
                        fontFamily: "'Barlow', sans-serif",
                        background: "#fff",
                        color: "#1E3A8A",
                        fontWeight: 700,
                      }}
                    />
                  </div>
                ) : (
                  <span style={{ fontWeight: 700, fontSize: "18px", color: "#1E3A8A" }}>
                    {formatFee(row.fee_cents)}
                  </span>
                )}
              </div>

              {/* Inspector % */}
              <div>
                <div style={{ fontSize: "10px", color: "#1B4F8A", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "3px" }}>Insp. %</div>
                {isEditing ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <input
                      form={`edit-${row.pricing_key}`}
                      name="inspector_share_percent"
                      type="number"
                      min="1"
                      max="99"
                      defaultValue={row.inspector_share_percent}
                      style={{
                        width: "55px",
                        border: "1px solid #B8D0E8",
                        borderRadius: "4px",
                        padding: "5px 8px",
                        fontSize: "14px",
                        fontFamily: "'Barlow', sans-serif",
                        background: "#fff",
                        color: "#1E3A8A",
                      }}
                    />
                    <span style={{ color: "#1E3A8A", fontWeight: 600 }}>%</span>
                  </div>
                ) : (
                  <span style={{ fontSize: "18px", fontWeight: 600, color: "#1B4F8A" }}>
                    {row.inspector_share_percent}%
                  </span>
                )}
              </div>

              {/* Inspector earns */}
              <div>
                <div style={{ fontSize: "10px", color: "#15803D", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "3px" }}>Insp. Earns</div>
                <span style={{ fontSize: "18px", fontWeight: 700, color: "#15803D" }}>
                  {inspectorShare(row.fee_cents, row.inspector_share_percent)}
                </span>
              </div>

              {/* ONP earns */}
              <div>
                <div style={{ fontSize: "10px", color: "#92400E", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "3px" }}>ONP Earns</div>
                <span style={{ fontSize: "18px", fontWeight: 700, color: "#92400E" }}>
                  {onpShare(row.fee_cents, row.inspector_share_percent)}
                </span>
              </div>
            </div>

            {/* Hidden form for edit submission */}
            {isEditing && (
              <form
                id={`edit-${row.pricing_key}`}
                action={updatePriceRow.bind(null, row.pricing_key)}
                onSubmit={() => setEditingKey(null)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
