"use client";

import { useState } from "react";
import Link from "next/link";
import { submitBid } from "@/app/dashboard/contractor/bids/actions";

const DISCLAIMER_VERSION = "v1.0-2026-05-25";

type ExistingBid = {
  amount_cents: number;
  notes: string | null;
  version_number: number;
};

export default function BidForm({
  projectId,
  existingBid,
  licenseExpiresSoon,
  coiExpiresSoon,
  isEmergency,
}: {
  projectId: string;
  existingBid: ExistingBid | null;
  licenseExpiresSoon?: string | null;
  coiExpiresSoon?: string | null;
  isEmergency?: boolean;
}) {
  const [step, setStep] = useState<"form" | "confirm">("form");
  const [amount, setAmount] = useState(
    existingBid ? (existingBid.amount_cents / 100).toFixed(2) : ""
  );
  const [notes, setNotes] = useState(existingBid?.notes ?? "");
  const [termsChecked, setTermsChecked] = useState(false);
  const [credentialsChecked, setCredentialsChecked] = useState(false);
  const [emergencyChecked, setEmergencyChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bothChecked = termsChecked && credentialsChecked && (!isEmergency || emergencyChecked);

  async function handleConfirm() {
    if (!bothChecked) return;
    setSubmitting(true);
    setError(null);
    const fd = new FormData();
    fd.set("amount", amount);
    fd.set("notes", notes);
    fd.set("terms_acknowledged", "true");
    fd.set("credentials_acknowledged", "true");
    fd.set("disclaimer_version", DISCLAIMER_VERSION);
    try {
      await submitBid(projectId, fd);
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

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

  // ─── Step 1: Bid Form ────────────────────────────────────────────────────────
  if (step === "form") {
    return (
      <div style={{
        background: "#EEF4FF",
        border: "1px solid #B8D0E8",
        borderRadius: "12px",
        padding: "24px",
      }}>
        <h2 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: "20px",
          letterSpacing: "1px",
          color: "#0A1628",
          textTransform: "uppercase",
          marginBottom: "4px",
        }}>
          {existingBid ? "Revise Your Bid" : "Submit a Bid"}
        </h2>
        <p style={{ fontSize: "12px", color: isEmergency ? "#C8102E" : "#1B4F8A", marginBottom: "4px" }}>
          {isEmergency
            ? "🚨 Emergency bid — your bid is visible to the client immediately upon submission."
            : "Bids are sealed until the deadline. You can revise anytime before it closes."}
        </p>

        {/* Verification warnings */}
        {(licenseExpiresSoon || coiExpiresSoon) && (
          <div style={{
            background: "#FFFBEB",
            border: "1px solid #FCD34D",
            borderRadius: "8px",
            padding: "10px 14px",
            marginBottom: "12px",
            marginTop: "8px",
            fontSize: "12px",
            color: "#92400E",
          }}>
            ⚠️ {[
              licenseExpiresSoon && `License expires ${licenseExpiresSoon}`,
              coiExpiresSoon && `Insurance expires ${coiExpiresSoon}`,
            ].filter(Boolean).join(" · ")} — update your profile before bidding.
          </div>
        )}

        <label style={{ ...labelStyle, marginTop: "16px" }}>Bid Amount (USD)</label>
        <input
          style={inputStyle}
          placeholder="e.g. 25000"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />

        <label style={labelStyle}>Notes (optional)</label>
        <textarea
          style={{ ...inputStyle, minHeight: "90px", resize: "vertical" as const }}
          placeholder="Clarifying assumptions, schedule notes, material preferences…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        {/* Short inline notice */}
        <div style={{
          background: "#F0F6FF",
          border: "1px solid #1B4F8A",
          borderRadius: "8px",
          padding: "12px 14px",
          marginTop: "16px",
          fontSize: "12px",
          color: "#1B4F8A",
          lineHeight: 1.6,
        }}>
          <strong style={{ color: "#0A1628" }}>Your bid is your commitment.</strong> By submitting,
          you confirm you've reviewed the project details, asked any clarifying questions (RFIs),
          and priced the work based on the information available. ONP does not verify project details
          and is not a party to your agreement with the Client.{" "}
          <Link href="/contractor-bid-disclaimer" target="_blank" style={{ color: "#1B4F8A", fontWeight: 600 }}>
            Full disclaimer →
          </Link>
        </div>

        <button
          type="button"
          disabled={!amount.trim()}
          onClick={() => {
            if (!amount.trim()) return;
            setStep("confirm");
          }}
          style={{
            marginTop: "20px",
            background: amount.trim() ? "#C8102E" : "#B8D0E8",
            color: "#fff",
            border: "none",
            padding: "12px 28px",
            borderRadius: "6px",
            fontFamily: "'Barlow', sans-serif",
            fontWeight: 600,
            fontSize: "14px",
            letterSpacing: "0.5px",
            cursor: amount.trim() ? "pointer" : "not-allowed",
          }}
        >
          Review & Submit →
        </button>
      </div>
    );
  }

  // ─── Step 2: Pre-submit Confirmation ────────────────────────────────────────
  return (
    <div style={{
      background: "#EEF4FF",
      border: "1px solid #B8D0E8",
      borderRadius: "12px",
      padding: "24px",
    }}>
      <h2 style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontWeight: 700,
        fontSize: "20px",
        letterSpacing: "1px",
        color: "#0A1628",
        textTransform: "uppercase",
        marginBottom: "4px",
      }}>
        Before You Lock This Bid
      </h2>

      <div style={{
        background: "#FFFFFF",
        border: "1px solid #B8D0E8",
        borderRadius: "8px",
        padding: "14px 16px",
        marginTop: "12px",
        marginBottom: "16px",
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        gap: "12px",
      }}>
        <span style={{ fontSize: "13px", color: "#1B4F8A" }}>Your bid amount</span>
        <span style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: "28px",
          color: "#0A1628",
          lineHeight: 1,
        }}>
          ${Number(amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </span>
      </div>

      <p style={{ fontSize: "13px", color: "#1B4F8A", lineHeight: 1.6, marginBottom: "14px" }}>
        By submitting, you acknowledge and agree:
      </p>

      <ul style={{
        background: "#FFFFFF",
        border: "1px solid #B8D0E8",
        borderRadius: "8px",
        padding: "14px 14px 14px 30px",
        marginBottom: "16px",
        fontSize: "12px",
        color: "#0A1628",
        lineHeight: 1.8,
      }}>
        <li>You have reviewed the project description, photos, files, and any inspector report provided</li>
        <li>You have submitted RFIs for anything unclear and received adequate responses, <em>or</em> you have elected to bid without further clarification</li>
        <li>Your bid reflects your professional judgment and includes any contingencies you deem appropriate</li>
        <li>Your bid is a good-faith commitment to the Client based on the information available</li>
        <li>ONP does not verify the accuracy of Client-provided information and is not responsible for project conditions, Client conduct, or payment</li>
        <li>You are solely responsible for the accuracy of your bid and for negotiating any adjustments directly with the Client after award</li>
        <li>You will not seek recourse from ONP for losses arising from inaccurate Client information, scope changes, non-payment, or any other dispute with the Client</li>
      </ul>

      {/* Checkbox 1 */}
      <label style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "10px",
        cursor: "pointer",
        marginBottom: "10px",
        padding: "10px 12px",
        background: termsChecked ? "#F0FDF4" : "#FFFFFF",
        border: `1px solid ${termsChecked ? "#166534" : "#B8D0E8"}`,
        borderRadius: "8px",
      }}>
        <input
          type="checkbox"
          checked={termsChecked}
          onChange={(e) => setTermsChecked(e.target.checked)}
          style={{ marginTop: "2px", accentColor: "#1B4F8A", flexShrink: 0 }}
        />
        <span style={{ fontSize: "13px", color: "#0A1628", lineHeight: 1.5 }}>
          I understand and accept these terms.
        </span>
      </label>

      {/* Checkbox 2 */}
      <label style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "10px",
        cursor: "pointer",
        marginBottom: isEmergency ? "10px" : "16px",
        padding: "10px 12px",
        background: credentialsChecked ? "#F0FDF4" : "#FFFFFF",
        border: `1px solid ${credentialsChecked ? "#166534" : "#B8D0E8"}`,
        borderRadius: "8px",
      }}>
        <input
          type="checkbox"
          checked={credentialsChecked}
          onChange={(e) => setCredentialsChecked(e.target.checked)}
          style={{ marginTop: "2px", accentColor: "#1B4F8A", flexShrink: 0 }}
        />
        <span style={{ fontSize: "13px", color: "#0A1628", lineHeight: 1.5 }}>
          I confirm my license, insurance, and business information on file are current and accurate.
        </span>
      </label>

      {/* Checkbox 3 — Emergency acknowledgment */}
      {isEmergency && (
        <label style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "10px",
          cursor: "pointer",
          marginBottom: "16px",
          padding: "10px 12px",
          background: emergencyChecked ? "#1B4F8A" : "#0A1628",
          border: `1px solid ${emergencyChecked ? "#1B4F8A" : "#C8102E"}`,
          borderRadius: "8px",
        }}>
          <input
            type="checkbox"
            checked={emergencyChecked}
            onChange={(e) => setEmergencyChecked(e.target.checked)}
            style={{ marginTop: "2px", accentColor: "#C8102E", flexShrink: 0 }}
          />
          <span style={{ fontSize: "13px", color: "#FFFFFF", lineHeight: 1.5 }}>
            I understand this is an emergency bid. My bid is <strong style={{ color: "#FFFFFF" }}>preliminary and incomplete</strong> — no site visit has been conducted. This bid will be immediately visible to the client. I am not held to a final price until scope and conditions are confirmed in person.
          </span>
        </label>
      )}

      {error && (
        <div style={{
          background: "#FEF2F2",
          border: "1px solid #FCA5A5",
          color: "#991B1B",
          padding: "10px 14px",
          borderRadius: "6px",
          fontSize: "13px",
          marginBottom: "12px",
        }}>
          ❌ {error}
        </div>
      )}

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <button
          type="button"
          disabled={!bothChecked || submitting}
          onClick={handleConfirm}
          style={{
            background: bothChecked ? "#C8102E" : "#B8D0E8",
            color: "#fff",
            border: "none",
            padding: "12px 28px",
            borderRadius: "6px",
            fontFamily: "'Barlow', sans-serif",
            fontWeight: 600,
            fontSize: "14px",
            letterSpacing: "0.5px",
            cursor: bothChecked && !submitting ? "pointer" : "not-allowed",
            opacity: submitting ? 0.7 : 1,
          }}
        >
          {submitting ? "Submitting…" : existingBid ? "Lock in Revision" : "Lock in Bid"}
        </button>
        <button
          type="button"
          onClick={() => { setStep("form"); setTermsChecked(false); setCredentialsChecked(false); setEmergencyChecked(false); }}
          style={{
            background: "transparent",
            color: "#1B4F8A",
            border: "1px solid #B8D0E8",
            padding: "12px 20px",
            borderRadius: "6px",
            fontFamily: "'Barlow', sans-serif",
            fontSize: "13px",
            cursor: "pointer",
          }}
        >
          ← Back
        </button>
      </div>

      <div style={{ fontSize: "11px", color: "#4A7FB5", marginTop: "10px" }}>
        <Link href="/contractor-bid-disclaimer" target="_blank" style={{ color: "#1B4F8A" }}>
          Read full Contractor Bid Acknowledgment →
        </Link>
      </div>
    </div>
  );
}
