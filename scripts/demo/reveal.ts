// Flips the demo project's deadline into the past, moving the recording
// checkpoint from "sealed" (bids locked, per src/app/dashboard/client/
// projects/[id]/bids/page.tsx's unlocked = deadlinePassed || ...) to
// "revealed/comparable" — no other state changes. Idempotent: safe to run
// repeatedly, and safe to run again after demo:seed re-establishes a
// future deadline.
import { assertDemoEnvironment } from "./assertDemoEnvironment.ts";
import { buildDemoAdminClient } from "./supabaseAdminClient.ts";
import { DEMO_PROJECT } from "./data.ts";

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

  const pastDeadline = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { error: updateError } = await admin
    .from("projects")
    .update({ deadline_at: pastDeadline })
    .eq("id", projectRow.id);
  if (updateError) throw new Error(`deadline_at update failed: ${updateError.message}`);

  console.log(`[demo:reveal] done — demo project ref=${env.projectRef}, deadline_at set to ${pastDeadline}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
