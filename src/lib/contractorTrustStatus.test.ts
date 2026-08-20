// Run with: node "src/lib/contractorTrustStatus.test.ts"
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  insuranceStatusDisplay,
  bondStatusDisplay,
  deriveInsuranceStatusFromLegacy,
  bondStatusConflictsWithVerifiedCredential,
  isInsuranceStatus,
  isBondStatus,
} from "./contractorTrustStatus.ts";

test("insuranceStatusDisplay: all three states render distinct, correctly-toned text", () => {
  assert.deepEqual(insuranceStatusDisplay("INSURED"), { text: "✅ Insured", tone: "positive" });
  assert.deepEqual(insuranceStatusDisplay("NOT_INSURED"), { text: "Not insured", tone: "negative" });
  assert.deepEqual(insuranceStatusDisplay("NOT_PROVIDED"), {
    text: "Insurance information not provided",
    tone: "neutral",
  });
});

test("bondStatusDisplay: all three states render distinct, correctly-toned text", () => {
  assert.deepEqual(bondStatusDisplay("BONDED"), { text: "✅ Bonded", tone: "positive" });
  assert.deepEqual(bondStatusDisplay("NOT_BONDED"), { text: "Not bonded", tone: "negative" });
  assert.deepEqual(bondStatusDisplay("NOT_PROVIDED"), {
    text: "Bonding information not provided",
    tone: "neutral",
  });
});

test("NOT_PROVIDED never gets the negative tone used for an explicit No", () => {
  assert.notEqual(insuranceStatusDisplay("NOT_PROVIDED").tone, "negative");
  assert.notEqual(bondStatusDisplay("NOT_PROVIDED").tone, "negative");
});

test("deriveInsuranceStatusFromLegacy: has_no_insurance=true always wins as NOT_INSURED", () => {
  assert.equal(
    deriveInsuranceStatusFromLegacy({ hasNoInsurance: true, coiProvider: "State Farm", coiExpiry: "2030-01-01" }),
    "NOT_INSURED"
  );
});

test("deriveInsuranceStatusFromLegacy: provider + expiry together => INSURED", () => {
  assert.equal(
    deriveInsuranceStatusFromLegacy({ hasNoInsurance: false, coiProvider: "State Farm", coiExpiry: "2030-01-01" }),
    "INSURED"
  );
});

test("deriveInsuranceStatusFromLegacy: partial/placeholder data never infers INSURED", () => {
  // provider only, no expiry
  assert.equal(
    deriveInsuranceStatusFromLegacy({ hasNoInsurance: false, coiProvider: "State Farm", coiExpiry: null }),
    "NOT_PROVIDED"
  );
  // expiry only, no provider
  assert.equal(
    deriveInsuranceStatusFromLegacy({ hasNoInsurance: false, coiProvider: null, coiExpiry: "2030-01-01" }),
    "NOT_PROVIDED"
  );
  // whitespace-only provider treated as absent
  assert.equal(
    deriveInsuranceStatusFromLegacy({ hasNoInsurance: false, coiProvider: "   ", coiExpiry: "2030-01-01" }),
    "NOT_PROVIDED"
  );
  // nothing at all
  assert.equal(
    deriveInsuranceStatusFromLegacy({ hasNoInsurance: false, coiProvider: null, coiExpiry: null }),
    "NOT_PROVIDED"
  );
  // hasNoInsurance null (legacy default) with nothing else provided
  assert.equal(
    deriveInsuranceStatusFromLegacy({ hasNoInsurance: null, coiProvider: null, coiExpiry: null }),
    "NOT_PROVIDED"
  );
});

test("bondStatusConflictsWithVerifiedCredential: only NOT_BONDED + a verified credential conflicts", () => {
  assert.equal(bondStatusConflictsWithVerifiedCredential("NOT_BONDED", true), true);
  assert.equal(bondStatusConflictsWithVerifiedCredential("NOT_BONDED", false), false);
  assert.equal(bondStatusConflictsWithVerifiedCredential("BONDED", true), false);
  assert.equal(bondStatusConflictsWithVerifiedCredential("NOT_PROVIDED", true), false);
});

test("isInsuranceStatus / isBondStatus: reject unknown or cross-domain values", () => {
  assert.equal(isInsuranceStatus("INSURED"), true);
  assert.equal(isInsuranceStatus("BONDED"), false);
  assert.equal(isInsuranceStatus("insured"), false);
  assert.equal(isInsuranceStatus(null), false);

  assert.equal(isBondStatus("BONDED"), true);
  assert.equal(isBondStatus("INSURED"), false);
  assert.equal(isBondStatus(undefined), false);
});
