// Pure routing/validation logic for the file-withdrawal dialog, shared
// between the client UI and (for defense in depth) re-derivable server-side.
// The server action never trusts the client's routing choice -- it derives
// the same SENSITIVE_INFO -> SENSITIVE_REMOVE mapping itself.

export const WITHDRAWAL_REASON_CODES = [
  "UPLOADED_WRONG_FILE",
  "DUPLICATE",
  "OUTDATED_SUPERSEDED",
  "NO_LONGER_RELEVANT",
  "SENSITIVE_INFO",
  "OTHER",
] as const;

export type WithdrawalReasonCode = (typeof WITHDRAWAL_REASON_CODES)[number];

export type WithdrawalAction = "WITHDRAW" | "SENSITIVE_REMOVE";

export function actionForReasonCode(reasonCode: string): WithdrawalAction {
  return reasonCode === "SENSITIVE_INFO" ? "SENSITIVE_REMOVE" : "WITHDRAW";
}

export function requiresFreeText(reasonCode: string): boolean {
  return reasonCode === "OTHER";
}

export function validateWithdrawalForm(input: {
  reasonCode: string;
  reasonOtherText: string;
}): { valid: boolean; error?: string } {
  if (!WITHDRAWAL_REASON_CODES.includes(input.reasonCode as WithdrawalReasonCode)) {
    return { valid: false, error: "Please select a reason." };
  }
  if (requiresFreeText(input.reasonCode) && !input.reasonOtherText.trim()) {
    return { valid: false, error: "Please describe the reason." };
  }
  return { valid: true };
}
