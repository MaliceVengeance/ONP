"use client";

import { useState } from "react";
import Link from "next/link";
import { createProject } from "./actions";
import { CLIENT_EMERGENCY_REQUEST } from "@/lib/disclaimers/clientEmergencyRequest";
import type { EmergencyRequestStatus } from "@/lib/emergency/rateLimit";

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#FFFFFF",
  border: "1px solid #B8D0E8",
  color: "#0A1628",
  borderRadius: "6px",
  padding: "10px 14px",
  fontFamily: "'Barlow', sans-serif",
  fontSize: "14px",
  outline: "none",
  marginTop: "6px",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "11px",
  fontWeight: 500,
  color: "#1B4F8A",
  textTransform: "uppercase",
  letterSpacing: "1px",
  marginTop: "16px",
};

interface Props {
  categories: string[];
  rateLimit: EmergencyRequestStatus;
}

export default function NewProjectForm({ categories, rateLimit }: Props) {
  const [isEmergency, setIsEmergency] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const canUseEmergency = rateLimit.remaining > 0;

  return (
    <div style={{ maxWidth: "600px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
        <div>
          <h1 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "36px",
            letterSpacing: "1px",
            color: "#0A1628",
            margin: 0,
          }}>
            New Project
          </h1>
          <p style={{ fontSize: "13px", color: "#1B4F8A", marginTop: "4px" }}>
            Fill in the details below, then choose standard or emergency bidding.
          </p>
        </div>
        <Link
          href="/dashboard/client/projects"
          style={{
            background: "transparent",
            color: "#1B4F8A",
            border: "1px solid #B8D0E8",
            padding: "8px 16px",
            borderRadius: "6px",
            fontFamily: "'Barlow', sans-serif",
            fontSize: "13px",
            textDecoration: "none",
          }}
        >
          Cancel
        </Link>
      </div>

      {/* Form card */}
      <div style={{
        background: "#EEF4FF",
        border: "1px solid #B8D0E8",
        borderRadius: "12px",
        padding: "28px",
        marginBottom: "20px",
      }}>
        <form action={createProject}>
          {/* Hidden field for emergency flag */}
          <input type="hidden" name="is_emergency" value={isEmergency ? "true" : "false"} />

          <label style={{ ...labelStyle, marginTop: 0 }}>Project Title</label>
          <input
            name="title"
            style={inputStyle}
            placeholder="e.g. Kitchen Remodel"
            required
          />

          <label style={labelStyle}>Category</label>
          <select name="category" style={inputStyle} required>
            <option value="">Select a category…</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c.replaceAll("_", " ")}
              </option>
            ))}
          </select>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
            <div>
              <label style={labelStyle}>City</label>
              <input name="city" style={inputStyle} placeholder="e.g. Phoenix" required />
            </div>
            <div>
              <label style={labelStyle}>State</label>
              <input name="us_state" style={inputStyle} placeholder="e.g. TX" required />
            </div>
            <div>
              <label style={labelStyle}>Zip Code</label>
              <input name="zip_code" style={inputStyle} placeholder="e.g. 85001" maxLength={10} />
            </div>
          </div>

          <label style={labelStyle}>Description</label>
          <textarea
            name="description"
            style={{ ...inputStyle, minHeight: "140px", resize: "vertical" }}
            placeholder="Describe the work needed in as much detail as possible…"
            rows={6}
          />

          {/* Files tip */}
          <div style={{
            background: "#F0F6FF",
            border: "1px solid #1B4F8A",
            borderRadius: "8px",
            padding: "14px 16px",
            marginTop: "20px",
            display: "flex",
            gap: "12px",
            alignItems: "flex-start",
          }}>
            <span style={{ fontSize: "20px", flexShrink: 0 }}>📁</span>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#0A1628", marginBottom: "3px" }}>
                You can add photos and documents after creating your draft
              </div>
              <div style={{ fontSize: "12px", color: "#1B4F8A", lineHeight: 1.5 }}>
                Once your draft is saved you'll be able to upload blueprints, photos, and files to help contractors understand the scope.
              </div>
            </div>
          </div>

          {/* Platform rules */}
          <div style={{
            background: "#FFFFFF",
            border: "1px solid #B8D0E8",
            borderRadius: "8px",
            padding: "16px",
            marginTop: "20px",
          }}>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "#1B4F8A", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "10px" }}>
              Platform Rules — Shown to All Contractors
            </div>
            <div style={{ fontSize: "13px", color: "#15803D", marginBottom: "6px" }}>✅ The contractor is responsible for pulling all required permits.</div>
            <div style={{ fontSize: "13px", color: "#15803D" }}>✅ The contractor is responsible for all debris removal and disposal.</div>
          </div>

          {/* ── Bid Type Selection ────────────────────────────── */}
          <div style={{ marginTop: "28px" }}>
            <div style={{
              fontSize: "11px",
              fontWeight: 600,
              color: "#1B4F8A",
              textTransform: "uppercase",
              letterSpacing: "1px",
              marginBottom: "12px",
            }}>
              Bid Type
            </div>

            {/* Standard */}
            <label style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
              background: !isEmergency ? "#FFFFFF" : "#F8FAFF",
              border: `1px solid ${!isEmergency ? "#1B4F8A" : "#B8D0E8"}`,
              borderRadius: "8px",
              padding: "14px 16px",
              marginBottom: "8px",
              cursor: "pointer",
            }}>
              <input
                type="radio"
                name="_bid_type_ui"
                checked={!isEmergency}
                onChange={() => { setIsEmergency(false); setDisclaimerAccepted(false); }}
                style={{ marginTop: "3px", accentColor: "#1B4F8A" }}
              />
              <div>
                <div style={{ fontWeight: 600, fontSize: "14px", color: "#0A1628", marginBottom: "2px" }}>
                  Standard Bid Request — Free
                </div>
                <div style={{ fontSize: "12px", color: "#4A7FB5", lineHeight: 1.5 }}>
                  Sealed bidding for 5–10 days. Bids are hidden until the deadline, giving contractors equal footing and you the most accurate pricing. Best for non-urgent work.
                </div>
              </div>
            </label>

            {/* Emergency */}
            <label style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
              background: isEmergency ? "#7C1A00" : canUseEmergency ? "#FEF2F2" : "#F8FAFF",
              border: `1px solid ${isEmergency ? "#C2410C" : canUseEmergency ? "#FCA5A5" : "#B8D0E8"}`,
              borderRadius: "8px",
              padding: "14px 16px",
              cursor: canUseEmergency ? "pointer" : "not-allowed",
              opacity: canUseEmergency ? 1 : 0.6,
            }}>
              <input
                type="radio"
                name="_bid_type_ui"
                checked={isEmergency}
                disabled={!canUseEmergency}
                onChange={() => canUseEmergency && setIsEmergency(true)}
                style={{ marginTop: "3px", accentColor: "#C2410C" }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: "14px", color: isEmergency ? "#FDBA74" : canUseEmergency ? "#991B1B" : "#4A7FB5", marginBottom: "2px" }}>
                  🚨 Emergency Bid Request — $10
                </div>
                <div style={{ fontSize: "12px", color: isEmergency ? "#FED7AA" : canUseEmergency ? "#991B1B" : "#4A7FB5", lineHeight: 1.5 }}>
                  {canUseEmergency
                    ? "Bids visible immediately as contractors submit. Contractors notified right away. 8-hour window. For burst pipes, storm damage, and genuine emergencies only."
                    : `Emergency limit reached. Next slot available ${rateLimit.nextSlotAvailableAt
                        ? rateLimit.nextSlotAvailableAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
                        : "soon"}.`}
                </div>

                {/* Usage counter */}
                <div style={{
                  marginTop: "8px",
                  fontSize: "11px",
                  color: isEmergency ? "#FED7AA" : canUseEmergency ? "#991B1B" : "#4A7FB5",
                }}>
                  {rateLimit.used} of {2 + rateLimit.adminBonus} emergency requests used in the last 30 days
                  {rateLimit.adminBonus > 0 && (
                    <span style={{ marginLeft: "6px", fontWeight: 600 }}>
                      (+{rateLimit.adminBonus} admin-granted)
                    </span>
                  )}
                </div>
              </div>
            </label>
          </div>

          {/* Emergency disclaimer (shown when emergency is selected) */}
          {isEmergency && (
            <div style={{ marginTop: "16px" }}>
              <div style={{
                background: "#0A1628",
                border: "1px solid #C2410C",
                borderRadius: "10px",
                padding: "18px 20px",
                marginBottom: "14px",
              }}>
                <div style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 700,
                  fontSize: "12px",
                  letterSpacing: "1px",
                  color: "#FDBA74",
                  textTransform: "uppercase",
                  marginBottom: "10px",
                }}>
                  Emergency Bid Request — Terms
                </div>
                <pre style={{
                  fontSize: "11px",
                  color: "#B8D0E8",
                  lineHeight: 1.65,
                  whiteSpace: "pre-wrap",
                  fontFamily: "'Barlow', sans-serif",
                  margin: 0,
                }}>
                  {CLIENT_EMERGENCY_REQUEST.text}
                </pre>
              </div>

              <label style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                cursor: "pointer",
                padding: "12px 14px",
                background: disclaimerAccepted ? "#0D3320" : "#1A0000",
                border: `1px solid ${disclaimerAccepted ? "#166534" : "#C2410C"}`,
                borderRadius: "8px",
              }}>
                <input
                  type="checkbox"
                  name="emergency_disclaimer_accepted"
                  checked={disclaimerAccepted}
                  onChange={(e) => setDisclaimerAccepted(e.target.checked)}
                  style={{ marginTop: "2px", accentColor: "#C2410C", flexShrink: 0 }}
                />
                <span style={{ fontSize: "13px", color: "#FFFFFF", lineHeight: 1.5 }}>
                  I have read and accept the Emergency Bid Request terms. I understand the $10 fee is non-refundable, bids will be preliminary, and ONP is not responsible for contractor pricing or performance.
                </span>
              </label>
            </div>
          )}

          {/* Submit */}
          <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
            <button
              type="submit"
              disabled={isEmergency && !disclaimerAccepted}
              style={{
                background: isEmergency
                  ? (disclaimerAccepted ? "#C2410C" : "#7A4030")
                  : "#C8102E",
                color: "#fff",
                border: "none",
                padding: "12px 28px",
                borderRadius: "6px",
                fontFamily: "'Barlow', sans-serif",
                fontWeight: 600,
                fontSize: "14px",
                letterSpacing: "0.5px",
                cursor: isEmergency && !disclaimerAccepted ? "not-allowed" : "pointer",
                opacity: isEmergency && !disclaimerAccepted ? 0.6 : 1,
              }}
            >
              {isEmergency ? "🚨 Create Emergency Request →" : "Create Draft"}
            </button>
            <Link
              href="/dashboard/client/projects"
              style={{
                background: "transparent",
                color: "#1B4F8A",
                border: "1px solid #B8D0E8",
                padding: "12px 24px",
                borderRadius: "6px",
                fontFamily: "'Barlow', sans-serif",
                fontSize: "14px",
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              Cancel
            </Link>
          </div>

          {isEmergency && (
            <p style={{ fontSize: "11px", color: "#991B1B", marginTop: "8px", lineHeight: 1.5 }}>
              After creating, you will be directed to pay $10 via Stripe to activate the emergency request.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
