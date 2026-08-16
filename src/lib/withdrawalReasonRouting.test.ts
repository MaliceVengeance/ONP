// Run with: node "src/lib/withdrawalReasonRouting.test.ts"
import { test } from "node:test";
import assert from "node:assert/strict";
import { actionForReasonCode, requiresFreeText, validateWithdrawalForm } from "./withdrawalReasonRouting.ts";

test("SENSITIVE_INFO routes to SENSITIVE_REMOVE", () => {
  assert.equal(actionForReasonCode("SENSITIVE_INFO"), "SENSITIVE_REMOVE");
});

test("every other reason routes to ordinary WITHDRAW", () => {
  for (const code of ["UPLOADED_WRONG_FILE", "DUPLICATE", "OUTDATED_SUPERSEDED", "NO_LONGER_RELEVANT", "OTHER"]) {
    assert.equal(actionForReasonCode(code), "WITHDRAW");
  }
});

test("OTHER requires free text", () => {
  assert.equal(requiresFreeText("OTHER"), true);
  assert.equal(requiresFreeText("DUPLICATE"), false);
  assert.equal(requiresFreeText("SENSITIVE_INFO"), false);
});

test("validateWithdrawalForm rejects an unknown reason code", () => {
  const r = validateWithdrawalForm({ reasonCode: "NOT_A_REAL_CODE", reasonOtherText: "" });
  assert.equal(r.valid, false);
});

test("validateWithdrawalForm rejects OTHER with blank free text", () => {
  const r = validateWithdrawalForm({ reasonCode: "OTHER", reasonOtherText: "   " });
  assert.equal(r.valid, false);
});

test("validateWithdrawalForm accepts OTHER with free text", () => {
  const r = validateWithdrawalForm({ reasonCode: "OTHER", reasonOtherText: "wrong revision uploaded" });
  assert.equal(r.valid, true);
});

test("validateWithdrawalForm accepts a normal reason with no free text needed", () => {
  const r = validateWithdrawalForm({ reasonCode: "DUPLICATE", reasonOtherText: "" });
  assert.equal(r.valid, true);
});

test("validateWithdrawalForm accepts SENSITIVE_INFO with no free text needed", () => {
  const r = validateWithdrawalForm({ reasonCode: "SENSITIVE_INFO", reasonOtherText: "" });
  assert.equal(r.valid, true);
});
