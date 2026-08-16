"use client";

import { useState } from "react";
import { withdrawProjectFile } from "./actions";
import {
  WITHDRAWAL_REASON_CODES,
  actionForReasonCode,
  requiresFreeText,
  validateWithdrawalForm,
} from "@/lib/withdrawalReasonRouting";

const REASON_LABELS: Record<string, string> = {
  UPLOADED_WRONG_FILE: "Uploaded wrong file",
  DUPLICATE: "Duplicate file",
  OUTDATED_SUPERSEDED: "Outdated / superseded",
  NO_LONGER_RELEVANT: "No longer relevant",
  SENSITIVE_INFO: "Contains private / sensitive information",
  OTHER: "Other",
};

export default function WithdrawDialog({
  projectId,
  attachmentId,
  filename,
  onClose,
  onWithdrawn,
}: {
  projectId: string;
  attachmentId: string;
  filename: string;
  onClose: () => void;
  onWithdrawn: () => void;
}) {
  const [reasonCode, setReasonCode] = useState("");
  const [reasonOtherText, setReasonOtherText] = useState("");
  const [isHighRisk, setIsHighRisk] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"choose" | "confirm">("choose");

  const action = reasonCode ? actionForReasonCode(reasonCode) : null;
  const isSensitive = action === "SENSITIVE_REMOVE";

  function handleContinue() {
    const check = validateWithdrawalForm({ reasonCode, reasonOtherText });
    if (!check.valid) {
      setError(check.error ?? "Please complete the form.");
      return;
    }
    setError(null);
    setStep("confirm");
  }

  async function handleConfirm() {
    setSubmitting(true);
    setError(null);
    try {
      await withdrawProjectFile(
        projectId,
        attachmentId,
        reasonCode,
        requiresFreeText(reasonCode) ? reasonOtherText.trim() : null,
        isSensitive ? isHighRisk : false
      );
      onWithdrawn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to withdraw file.");
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#FFFFFF", borderRadius: "12px", padding: "24px",
          maxWidth: "480px", width: "92%", maxHeight: "85vh", overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{
          fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "22px",
          color: "var(--camo-charcoal)", margin: "0 0 4px",
        }}>
          Withdraw File
        </h2>
        <p style={{ fontSize: "13px", color: "var(--camo-gunmetal)", marginBottom: "18px" }}>
          {filename}
        </p>

        {step === "choose" && (
          <>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--camo-gunmetal)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>
              Reason
            </label>
            <select
              value={reasonCode}
              onChange={(e) => setReasonCode(e.target.value)}
              style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #d9dbdb", fontSize: "13px", marginBottom: "12px" }}
            >
              <option value="">Select a reason…</option>
              {WITHDRAWAL_REASON_CODES.map((code) => (
                <option key={code} value={code}>{REASON_LABELS[code]}</option>
              ))}
            </select>

            {reasonCode && requiresFreeText(reasonCode) && (
              <textarea
                value={reasonOtherText}
                onChange={(e) => setReasonOtherText(e.target.value)}
                placeholder="Describe the reason…"
                style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #d9dbdb", fontSize: "13px", marginBottom: "12px", minHeight: "70px" }}
              />
            )}

            {isSensitive && (
              <label style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "12px", color: "#991B1B", marginBottom: "12px", background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: "6px", padding: "10px 12px" }}>
                <input type="checkbox" checked={isHighRisk} onChange={(e) => setIsHighRisk(e.target.checked)} style={{ marginTop: "2px" }} />
                <span>
                  This involves unusually serious information — government ID, financial account details, credentials/passwords, medical information, information about a minor, or similarly high-risk material. (Check this to route directly to an ONP admin review instead of the standard self-service flow.)
                </span>
              </label>
            )}

            {error && <div style={{ color: "#991B1B", fontSize: "12px", marginBottom: "12px" }}>{error}</div>}

            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button onClick={onClose} style={secondaryBtn}>Cancel</button>
              <button onClick={handleContinue} disabled={!reasonCode} style={isSensitive ? dangerBtn : primaryBtn}>
                Continue
              </button>
            </div>
          </>
        )}

        {step === "confirm" && (
          <>
            {isSensitive ? (
              <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: "8px", padding: "14px", marginBottom: "16px" }}>
                <div style={{ fontWeight: 700, color: "#991B1B", fontSize: "13px", marginBottom: "8px" }}>
                  This is a sensitive-information removal
                </div>
                <ul style={{ fontSize: "12px", color: "#991B1B", margin: 0, paddingLeft: "18px", lineHeight: 1.6 }}>
                  <li>Contractor access to this file is revoked immediately, before anything else happens.</li>
                  <li>Already-downloaded copies cannot be recalled — this cannot undo any prior access.</li>
                  <li>Bidding on this project pauses immediately.</li>
                  {isHighRisk ? (
                    <li>Because you flagged this as high-risk, an ONP admin will review it directly.</li>
                  ) : (
                    <li>Next, you&apos;ll be asked whether this file contained information contractors still need — most removals are resolved by you, without ONP staff needing to review the file.</li>
                  )}
                </ul>
              </div>
            ) : (
              <div style={{ background: "var(--camo-concrete)", border: "1px solid #d9dbdb", borderRadius: "8px", padding: "14px", marginBottom: "16px" }}>
                <ul style={{ fontSize: "12px", color: "var(--camo-charcoal)", margin: 0, paddingLeft: "18px", lineHeight: 1.6 }}>
                  <li>This file leaves the current Project Files view.</li>
                  <li>It remains visible in the Bid Information History.</li>
                  <li>Contractors with project access can still download it from history.</li>
                  <li>This creates a new project information revision.</li>
                  <li>Existing bids may become stale and require reconfirmation.</li>
                  <li>The bidding deadline may extend, if the existing rules allow it.</li>
                </ul>
              </div>
            )}

            {error && <div style={{ color: "#991B1B", fontSize: "12px", marginBottom: "12px" }}>{error}</div>}

            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button onClick={() => setStep("choose")} disabled={submitting} style={secondaryBtn}>Back</button>
              <button onClick={handleConfirm} disabled={submitting} style={isSensitive ? dangerBtn : primaryBtn}>
                {submitting ? "Working…" : isSensitive ? "Confirm Sensitive Removal" : "Confirm Withdrawal"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const primaryBtn: React.CSSProperties = {
  background: "var(--camo-accent)", color: "var(--camo-ink)", border: "none",
  padding: "9px 18px", borderRadius: "6px", fontFamily: "'Barlow', sans-serif",
  fontWeight: 600, fontSize: "13px", cursor: "pointer",
};
const secondaryBtn: React.CSSProperties = {
  background: "transparent", color: "var(--camo-gunmetal)", border: "1px solid #d9dbdb",
  padding: "9px 18px", borderRadius: "6px", fontFamily: "'Barlow', sans-serif", fontSize: "13px", cursor: "pointer",
};
const dangerBtn: React.CSSProperties = {
  background: "#DC2626", color: "#FFFFFF", border: "none",
  padding: "9px 18px", borderRadius: "6px", fontFamily: "'Barlow', sans-serif",
  fontWeight: 600, fontSize: "13px", cursor: "pointer",
};
