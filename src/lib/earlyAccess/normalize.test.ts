// Run with: node "src/lib/earlyAccess/normalize.test.ts"
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeEarlyAccessRole,
  normalizeContractorTrade,
  normalizeUtm,
  EARLY_ACCESS_ROLES,
} from "./normalize.ts";

test("normalizeEarlyAccessRole accepts each of the three valid roles, case-insensitively and trimmed", () => {
  assert.equal(normalizeEarlyAccessRole("CLIENT"), "CLIENT");
  assert.equal(normalizeEarlyAccessRole("contractor"), "CONTRACTOR");
  assert.equal(normalizeEarlyAccessRole("  Property_Manager  "), "PROPERTY_MANAGER");
  for (const r of EARLY_ACCESS_ROLES) {
    assert.equal(normalizeEarlyAccessRole(r), r);
  }
});

test("normalizeEarlyAccessRole rejects anything else outright rather than defaulting", () => {
  assert.equal(normalizeEarlyAccessRole("BOTH"), null);
  assert.equal(normalizeEarlyAccessRole("UNKNOWN"), null);
  assert.equal(normalizeEarlyAccessRole(""), null);
  assert.equal(normalizeEarlyAccessRole(null), null);
  assert.equal(normalizeEarlyAccessRole(undefined), null);
});

test("normalizeContractorTrade trims and normalizes blank to null", () => {
  assert.equal(normalizeContractorTrade("  Roofing  "), "Roofing");
  assert.equal(normalizeContractorTrade(""), null);
  assert.equal(normalizeContractorTrade("   "), null);
  assert.equal(normalizeContractorTrade(null), null);
  assert.equal(normalizeContractorTrade(undefined), null);
});

test("normalizeContractorTrade caps at 100 characters (matches the DB CHECK constraint in migration 031)", () => {
  const long = "A".repeat(150);
  const result = normalizeContractorTrade(long);
  assert.equal(result?.length, 100);
});

test("normalizeUtm trims and normalizes blank to null", () => {
  assert.equal(normalizeUtm("  google  "), "google");
  assert.equal(normalizeUtm(""), null);
  assert.equal(normalizeUtm("   "), null);
  assert.equal(normalizeUtm(null), null);
});

test("normalizeUtm caps at 200 characters (matches the DB CHECK constraint in migration 031)", () => {
  const long = "x".repeat(500);
  const result = normalizeUtm(long);
  assert.equal(result?.length, 200);
});
