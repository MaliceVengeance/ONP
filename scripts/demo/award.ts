// Awards the demo project to DEMO_AWARD_WINNER_EMAIL's bid via the real
// award_project_bid() RPC (migration 021), rather than hand-inserting
// project_awards — the RPC also flips projects.state and enforces the
// one-award-per-project uniqueness, so hand-inserting would risk state
// drift. Idempotent in effect: re-running after an award already exists
// will surface the RPC's own "already awarded" behavior rather than
// silently double-awarding.
//
// award_project_bid is SECURITY DEFINER but still checks
// `auth.uid() = projects.client_id or role = 'ADMIN'` internally. A
// service-role call carries no `sub` claim, so auth.uid() is null there and
// the RPC always raises "Not authenticated". Confirmed against the live
// function body in migration 021. The fix: sign in as the demo client with
// the anon-key client and invoke the RPC through that authenticated
// session, matching how the real app calls it from a client server action.
import { createClient } from "@supabase/supabase-js";
import { assertDemoEnvironment } from "./assertDemoEnvironment.ts";
import { buildDemoAdminClient } from "./supabaseAdminClient.ts";
import { DEMO_CLIENT, DEMO_PROJECT, DEMO_AWARD_WINNER_EMAIL } from "./data.ts";
import { findUserIdByEmail } from "./supabaseAdminClient.ts";

async function main() {
  const env = await assertDemoEnvironment();
  const admin = buildDemoAdminClient(env);
  const accountPassword = process.env.DEMO_ACCOUNT_PASSWORD;
  if (!accountPassword) {
    throw new Error("DEMO_ACCOUNT_PASSWORD is not set — required to sign in as the demo client.");
  }
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not set — required to sign in as the demo client.");
  }

  const { data: projectRow, error: findError } = await admin
    .from("projects")
    .select("id")
    .eq("title", DEMO_PROJECT.title)
    .maybeSingle();
  if (findError) throw new Error(`project lookup failed: ${findError.message}`);
  if (!projectRow) {
    throw new Error(`no demo project found with title "${DEMO_PROJECT.title}" — run npm run demo:seed first.`);
  }

  const winnerContractorId = await findUserIdByEmail(admin, DEMO_AWARD_WINNER_EMAIL);
  if (!winnerContractorId) {
    throw new Error(`demo award winner "${DEMO_AWARD_WINNER_EMAIL}" not found — run npm run demo:seed first.`);
  }

  const { data: bidRow, error: bidError } = await admin
    .from("bids")
    .select("id")
    .eq("project_id", projectRow.id)
    .eq("contractor_id", winnerContractorId)
    .maybeSingle();
  if (bidError) throw new Error(`bid lookup failed: ${bidError.message}`);
  if (!bidRow) {
    throw new Error(`no bid found for the designated demo award winner — run npm run demo:seed first.`);
  }

  const asClient = createClient(env.supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error: signInError } = await asClient.auth.signInWithPassword({
    email: DEMO_CLIENT.email,
    password: accountPassword,
  });
  if (signInError) {
    throw new Error(`sign-in as demo client (${DEMO_CLIENT.email}) failed: ${signInError.message}`);
  }

  const { error: awardError } = await asClient.rpc("award_project_bid", {
    p_project_id: projectRow.id,
    p_bid_id: bidRow.id,
  });
  if (awardError) {
    throw new Error(`award_project_bid RPC failed: ${awardError.message}`);
  }

  await asClient.auth.signOut();

  console.log(`[demo:award] done — demo project ref=${env.projectRef}, awarded to ${DEMO_AWARD_WINNER_EMAIL}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
