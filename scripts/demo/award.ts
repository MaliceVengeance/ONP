// Awards the demo project to DEMO_AWARD_WINNER_EMAIL's bid via the real
// award_project_bid() RPC (migration 021), rather than hand-inserting
// project_awards — the RPC also flips projects.state and enforces the
// one-award-per-project uniqueness, so hand-inserting would risk state
// drift. Idempotent in effect: re-running after an award already exists
// will surface the RPC's own "already awarded" behavior rather than
// silently double-awarding.
//
// NOT YET VERIFIED against a live project: award_project_bid's exact
// signature/auth-context requirements (whether it relies on auth.uid()
// internally vs. an explicit actor parameter) were not confirmed by the
// research this script was designed from. If invoking it via the
// service-role client fails here, that needs to be resolved against the
// real function definition once a demo project exists — see the
// implementation report.
import { assertDemoEnvironment } from "./assertDemoEnvironment.ts";
import { buildDemoAdminClient } from "./supabaseAdminClient.ts";
import { DEMO_PROJECT, DEMO_AWARD_WINNER_EMAIL } from "./data.ts";
import { findUserIdByEmail } from "./supabaseAdminClient.ts";

async function main() {
  const env = await assertDemoEnvironment();
  const admin = buildDemoAdminClient(env);

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

  const { error: awardError } = await admin.rpc("award_project_bid", {
    p_project_id: projectRow.id,
    p_bid_id: bidRow.id,
  });
  if (awardError) {
    throw new Error(
      `award_project_bid RPC failed: ${awardError.message}. This RPC's auth-context requirements were not ` +
        `confirmed against a live project when this script was written — see the implementation report.`
    );
  }

  console.log(`[demo:award] done — demo project ref=${env.projectRef}, awarded to ${DEMO_AWARD_WINNER_EMAIL}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
