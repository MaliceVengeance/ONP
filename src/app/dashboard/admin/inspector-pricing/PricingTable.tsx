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

export default function PricingTable({ rows }: { rows: PriceRow[] }) {
  const [editingKey, setEditingKey] = useState<string | null>(null);

  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "13px",
          minWidth: "760px",
        }}
      >
        <thead>
          <tr
            style={{
              background: "#0A1628",
              color: "#fff",
              textAlign: "left",
            }}
          >
            {[
              "Pricing Key",
              "Display Name",
              "Description",
              "Fee",
              "Insp. %",
              "Insp. Earns",
              "Active",
              "",
            ].map((h) => (
              <th
                key={h}
                style={{
                  padding: "10px 14px",
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 700,
                  fontSize: "12px",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const isEditing = editingKey === row.pricing_key;
            const isMultiTrade =
              row.pricing_key === "MULTI_TRADE" || row.pricing_key === "WHOLE_PROPERTY";
            const rowBg = isEditing
              ? "#FFFBEB"
              : i % 2 === 0
              ? "#EEF4FF"
              : "#FFFFFF";

            return (
              <tr
                key={row.pricing_key}
                style={{
                  background: rowBg,
                  borderBottom: "1px solid #B8D0E8",
                  verticalAlign: "middle",
                }}
              >
                {/* Pricing Key */}
                <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "3px 8px",
                      borderRadius: "4px",
                      background: isMultiTrade ? "#EDE9FE" : "#EEF4FF",
                      color: isMultiTrade ? "#5B21B6" : "#1B4F8A",
                      border: `1px solid ${isMultiTrade ? "#C4B5FD" : "#B8D0E8"}`,
                      letterSpacing: "0.3px",
                    }}
                  >
                    {row.pricing_key}
                  </span>
                </td>

                {/* Display Name */}
                <td
                  style={{
                    padding: "12px 14px",
                    fontWeight: 500,
                    color: "#0A1628",
                    whiteSpace: "nowrap",
                  }}
                >
                  {row.display_name}
                </td>

                {/* Description */}
                <td style={{ padding: "12px 14px", color: "#4A7FB5", maxWidth: "260px" }}>
                  {isEditing ? (
                    <input
                      form={`edit-${row.pricing_key}`}
                      name="description"
                      defaultValue={row.description ?? ""}
                      style={{
                        width: "100%",
                        border: "1px solid #B8D0E8",
                        borderRadius: "4px",
                        padding: "5px 8px",
                        fontSize: "12px",
                        fontFamily: "'Barlow', sans-serif",
                        background: "#fff",
                        color: "#0A1628",
                        minWidth: "200px",
                      }}
                    />
                  ) : (
                    <span
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {row.description ?? <em style={{ color: "#9CA3AF" }}>—</em>}
                    </span>
                  )}
                </td>

                {/* Fee */}
                <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                  {isEditing ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <span style={{ color: "#0A1628", fontWeight: 600 }}>$</span>
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
                          fontSize: "13px",
                          fontFamily: "'Barlow', sans-serif",
                          background: "#fff",
                          color: "#0A1628",
                          fontWeight: 700,
                        }}
                      />
                    </div>
                  ) : (
                    <span style={{ fontWeight: 700, color: "#0A1628" }}>
                      {formatFee(row.fee_cents)}
                    </span>
                  )}
                </td>

                {/* Inspector % */}
                <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
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
                          fontSize: "13px",
                          fontFamily: "'Barlow', sans-serif",
                          background: "#fff",
                          color: "#0A1628",
                        }}
                      />
                      <span style={{ color: "#0A1628" }}>%</span>
                    </div>
                  ) : (
                    <span style={{ color: "#1B4F8A" }}>{row.inspector_share_percent}%</span>
                  )}
                </td>

                {/* Inspector earns */}
                <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                  <span style={{ color: "#15803D", fontWeight: 600 }}>
                    {inspectorShare(row.fee_cents, row.inspector_share_percent)}
                  </span>
                </td>

                {/* Active toggle */}
                <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                  <form
                    action={togglePriceActive.bind(null, row.pricing_key, row.is_active)}
                  >
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
                </td>

                {/* Edit / Save / Cancel */}
                <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                  {isEditing ? (
                    <div style={{ display: "flex", gap: "6px" }}>
                      {/* Hidden form — inputs are associated via form= attribute */}
                      <form id={`edit-${row.pricing_key}`} action={updatePriceRow.bind(null, row.pricing_key)} onSubmit={() => setEditingKey(null)} />
                      <button
                        type="submit"
                        form={`edit-${row.pricing_key}`}
                        style={{
                          background: "#15803D",
                          color: "#fff",
                          border: "none",
                          padding: "5px 12px",
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
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
