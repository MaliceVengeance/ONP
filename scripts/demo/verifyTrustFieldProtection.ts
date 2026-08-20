// Regression check for the migration 032/033 admin-only verification-field
// protections (directory_verified*, veteran_verified*, contractor_
// credentials.verified*, and the bond_status/verified-BOND-credential
// consistency rule). These are DB-level triggers/RLS behavior — nothing a
// pure-function unit test can meaningfully mirror, since the thing under
// test IS the authorization boundary itself (auth.role()-gated writes).
// This script exercises the real boundary against the demo project, the
// same way the existing seed/reset/reveal/award scripts do.
//
// Every write this script makes to demo data is reverted before it exits
// (or on early failure via the try/finally below), so it's safe to re-run
// any time against the seeded demo project. It never modifies the "does
// this contractor look like the frozen brief" fixture values it touches.
//
// Run with: npm run demo:verify-protection (after npm run demo:seed)
import { createClient } from "@supabase/supabase-js";
import { assertDemoEnvironment } from "./assertDemoEnvironment.ts";
import { buildDemoAdminClient, findUserIdByEmail } from "./supabaseAdminClient.ts";

const UNVERIFIED_CONTRACTOR_EMAIL = "contractor.demo.one@onp-demo.test"; // Desert Crest: directory_verified=true, veteran_verified=false, no BOND credential
const VETERAN_CONTRACTOR_EMAIL = "contractor.demo.six@onp-demo.test"; // Mission Ridge: veteran_verified=true

type Check = { name: string; pass: boolean; detail?: string };
const checks: Check[] = [];
function record(name: string, pass: boolean, detail?: string) {
  checks.push({ name, pass, detail });
  console.log(`${pass ? "✅" : "❌"} ${name}${detail ? ` — ${detail}` : ""}`);
}

async function main() {
  const env = await assertDemoEnvironment();
  const admin = buildDemoAdminClient(env);
  const accountPassword = process.env.DEMO_ACCOUNT_PASSWORD;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!accountPassword) throw new Error("DEMO_ACCOUNT_PASSWORD is not set.");
  if (!anonKey) throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not set.");

  const unverifiedId = await findUserIdByEmail(admin, UNVERIFIED_CONTRACTOR_EMAIL);
  const veteranId = await findUserIdByEmail(admin, VETERAN_CONTRACTOR_EMAIL);
  if (!unverifiedId || !veteranId) {
    throw new Error("Expected demo contractors not found — run npm run demo:seed first.");
  }

  const asUnverified = createClient(env.supabaseUrl, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const asVeteran = createClient(env.supabaseUrl, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });

  const [{ error: e1 }, { error: e2 }] = await Promise.all([
    asUnverified.auth.signInWithPassword({ email: UNVERIFIED_CONTRACTOR_EMAIL, password: accountPassword }),
    asVeteran.auth.signInWithPassword({ email: VETERAN_CONTRACTOR_EMAIL, password: accountPassword }),
  ]);
  if (e1) throw new Error(`sign-in failed (${UNVERIFIED_CONTRACTOR_EMAIL}): ${e1.message}`);
  if (e2) throw new Error(`sign-in failed (${VETERAN_CONTRACTOR_EMAIL}): ${e2.message}`);

  let insertedCredentialId: string | null = null;

  // Capture the unverified contractor's real pre-test bond_status so cleanup
  // restores it exactly, rather than assuming a fixed default (Desert Crest's
  // canonical demo value is NOT_BONDED, not NOT_PROVIDED -- hardcoding the
  // wrong constant here previously corrupted the seeded fixture state).
  const { data: originalProfile } = await admin
    .from("contractor_profiles")
    .select("bond_status")
    .eq("contractor_id", unverifiedId)
    .maybeSingle();
  const originalBondStatus = originalProfile?.bond_status ?? "NOT_PROVIDED";

  try {
    // 1. Contractor cannot self-verify directory_verified.
    {
      const { error } = await asUnverified.from("contractor_profiles").update({ directory_verified: false }).eq("contractor_id", unverifiedId);
      const { data } = await admin.from("contractor_profiles").select("directory_verified").eq("contractor_id", unverifiedId).maybeSingle();
      record("contractor cannot self-unverify directory_verified", !!error && data?.directory_verified === true, error?.message);
    }

    // 2. Contractor cannot self-set veteran_verified (false -> true).
    {
      const { error } = await asUnverified.from("contractor_profiles").update({ veteran_verified: true }).eq("contractor_id", unverifiedId);
      const { data } = await admin.from("contractor_profiles").select("veteran_verified").eq("contractor_id", unverifiedId).maybeSingle();
      record("contractor cannot self-set veteran_verified", !!error && data?.veteran_verified === false, error?.message);
    }

    // 3. Contractor cannot self-clear veteran_verified (true -> false).
    {
      const { error } = await asVeteran.from("contractor_profiles").update({ veteran_verified: false }).eq("contractor_id", veteranId);
      const { data } = await admin.from("contractor_profiles").select("veteran_verified").eq("contractor_id", veteranId).maybeSingle();
      record("contractor cannot self-clear veteran_verified", !!error && data?.veteran_verified === true, error?.message);
    }

    // 4. Contractor CAN still edit an unrelated field on their own row.
    {
      const { error } = await asUnverified.from("contractor_profiles").update({ military_branch: "Army" }).eq("contractor_id", unverifiedId);
      record("contractor can still edit unrelated self fields", !error, error?.message);
      await admin.from("contractor_profiles").update({ military_branch: null }).eq("contractor_id", unverifiedId);
    }

    // 5. Contractor cannot self-verify their own credential.
    {
      const { data: ins, error: insErr } = await asUnverified
        .from("contractor_credentials")
        .insert({ contractor_id: unverifiedId, credential_type: "STATE_LICENSE", state: "TX", credential_number: "REGRESSION-CHECK" })
        .select()
        .maybeSingle();
      if (insErr || !ins) {
        record("contractor can submit an own unverified credential", false, insErr?.message);
      } else {
        insertedCredentialId = ins.id;
        const { error: verErr } = await asUnverified.from("contractor_credentials").update({ verified: true }).eq("id", ins.id);
        const { data: check } = await admin.from("contractor_credentials").select("verified").eq("id", ins.id).maybeSingle();
        record("contractor cannot self-verify own credential", !!verErr && check?.verified === false, verErr?.message);
      }
    }

    // 6. Admin/service-role path can still legitimately write veteran_verified.
    {
      const { error } = await admin.from("contractor_profiles").update({
        veteran_verified: true, veteran_verified_at: new Date().toISOString(), veteran_verified_by: veteranId,
      }).eq("contractor_id", unverifiedId);
      record("service-role admin path can still write veteran_verified", !error, error?.message);
      await admin.from("contractor_profiles").update({ veteran_verified: false, veteran_verified_at: null, veteran_verified_by: null }).eq("contractor_id", unverifiedId);
    }

    // 7a. bond_status cannot be set to NOT_BONDED while a verified BOND
    // credential exists. Starts from NOT_PROVIDED (the unverified
    // contractor's real canonical bond_status may already be NOT_BONDED,
    // which would make the insert itself correctly rejected by 7b's rule --
    // a different assertion, tested separately below).
    {
      const { error: toNeutralErr } = await admin.from("contractor_profiles").update({ bond_status: "NOT_PROVIDED" }).eq("contractor_id", unverifiedId);
      record("baseline: admin can set bond_status to NOT_PROVIDED", !toNeutralErr, toNeutralErr?.message);

      const { error: bondInsertErr } = await admin.from("contractor_credentials").insert({ contractor_id: unverifiedId, credential_type: "BOND", state: "TX", verified: true });
      record("baseline: admin can insert a verified BOND credential while status is NOT_PROVIDED", !bondInsertErr, bondInsertErr?.message);

      const { error: statusErr } = await admin.from("contractor_profiles").update({ bond_status: "NOT_BONDED" }).eq("contractor_id", unverifiedId);
      record("bond_status=NOT_BONDED blocked while a verified BOND credential exists", !!statusErr, statusErr?.message);

      await admin.from("contractor_credentials").delete().eq("contractor_id", unverifiedId).eq("credential_type", "BOND");
      await admin.from("contractor_profiles").update({ bond_status: "NOT_BONDED" }).eq("contractor_id", unverifiedId);
    }

    // 7b. Mirror image: a BOND credential cannot be verified while
    // bond_status is already NOT_BONDED (set immediately above).
    {
      const { data: ins, error: insErr } = await admin
        .from("contractor_credentials")
        .insert({ contractor_id: unverifiedId, credential_type: "BOND", state: "TX" })
        .select()
        .maybeSingle();
      if (insErr || !ins) {
        record("baseline: admin can insert an unverified BOND credential", false, insErr?.message);
      } else {
        const { error: verifyErr } = await admin.from("contractor_credentials").update({ verified: true }).eq("id", ins.id);
        record("verifying a BOND credential blocked while bond_status is NOT_BONDED", !!verifyErr, verifyErr?.message);
        await admin.from("contractor_credentials").delete().eq("id", ins.id);
      }
    }
  } finally {
    await asUnverified.auth.signOut();
    await asVeteran.auth.signOut();
    if (insertedCredentialId) {
      await admin.from("contractor_credentials").delete().eq("id", insertedCredentialId);
    }
    // Belt-and-suspenders: make sure nothing lingers regardless of which
    // assertion (if any) threw before its own cleanup ran.
    await admin.from("contractor_credentials").delete().eq("contractor_id", unverifiedId).eq("credential_type", "BOND");
    await admin.from("contractor_profiles").update({ military_branch: null, bond_status: originalBondStatus }).eq("contractor_id", unverifiedId);
    await admin.from("contractor_profiles").update({ veteran_verified: false, veteran_verified_at: null, veteran_verified_by: null }).eq("contractor_id", unverifiedId);
    await admin.from("contractor_profiles").update({ veteran_verified: true }).eq("contractor_id", veteranId);
  }

  const failed = checks.filter((c) => !c.pass);
  console.log(`\n[demo:verify-protection] ${checks.length - failed.length}/${checks.length} checks passed.`);
  if (failed.length > 0) {
    throw new Error(`${failed.length} protection check(s) failed: ${failed.map((c) => c.name).join("; ")}`);
  }
  console.log(`[demo:verify-protection] done — demo project ref=${env.projectRef}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
