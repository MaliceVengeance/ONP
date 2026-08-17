// Deletes only rows tied to the known demo identifiers (fixed emails, the
// demo project's title) — never a blanket TRUNCATE, so this stays safe
// even if ever pointed at a demo project that's shared for something
// else. Deletes in FK-safe order. Idempotent: safe to run against an
// already-empty demo project (every step is a no-op "delete where
// nothing matches").
import { assertDemoEnvironment } from "./assertDemoEnvironment.ts";
import { buildDemoAdminClient, findUserIdByEmail } from "./supabaseAdminClient.ts";
import { DEMO_CLIENT, DEMO_CONTRACTORS, DEMO_PROJECT } from "./data.ts";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function resetDemoData(admin: SupabaseClient): Promise<void> {
  const contractorEmails = DEMO_CONTRACTORS.map((c) => c.email);
  const allDemoEmails = [DEMO_CLIENT.email, ...contractorEmails];

  const contractorIds = (
    await Promise.all(contractorEmails.map((email) => findUserIdByEmail(admin, email)))
  ).filter((id): id is string => id !== null);

  const { data: projectRows } = await admin
    .from("projects")
    .select("id")
    .eq("title", DEMO_PROJECT.title);
  const projectIds = (projectRows ?? []).map((p) => p.id as string);

  for (const projectId of projectIds) {
    const { data: bidRows } = await admin.from("bids").select("id").eq("project_id", projectId);
    const bidIds = (bidRows ?? []).map((b) => b.id as string);

    if (bidIds.length > 0) {
      const { data: versionRows } = await admin
        .from("bid_versions")
        .select("id")
        .in("bid_id", bidIds);
      const versionIds = (versionRows ?? []).map((v) => v.id as string);

      if (versionIds.length > 0) {
        await admin.from("bid_line_items").delete().in("bid_version_id", versionIds);
      }
      await admin.from("bid_versions").delete().in("bid_id", bidIds);
      await admin.from("bids").delete().in("id", bidIds);
    }

    await admin.from("rfis").delete().eq("project_id", projectId);
    await admin.from("project_attachments").delete().eq("project_id", projectId);
    await admin.from("project_awards").delete().eq("project_id", projectId);
  }
  if (projectIds.length > 0) {
    await admin.from("projects").delete().in("id", projectIds);
  }

  if (contractorIds.length > 0) {
    await admin.from("contractor_credentials").delete().in("contractor_id", contractorIds);
    await admin.from("contractor_subscriptions").delete().in("contractor_id", contractorIds);
    await admin.from("contractor_portfolio_photos").delete().in("contractor_id", contractorIds);
    await admin.from("contractor_profiles").delete().in("contractor_id", contractorIds);
  }

  // profiles rows deleted explicitly (not relied on cascade-from-auth-user,
  // since that FK behavior isn't confirmed) before deleting the auth users
  // themselves.
  const allDemoIds = (
    await Promise.all(allDemoEmails.map((email) => findUserIdByEmail(admin, email)))
  ).filter((id): id is string => id !== null);

  if (allDemoIds.length > 0) {
    await admin.from("profiles").delete().in("id", allDemoIds);
  }
  for (const id of allDemoIds) {
    await admin.auth.admin.deleteUser(id);
  }
}

async function main() {
  const env = await assertDemoEnvironment();
  const admin = buildDemoAdminClient(env);
  await resetDemoData(admin);
  console.log(`[demo:reset] done — demo project ref=${env.projectRef}`);
}

// Only run as a CLI entrypoint when invoked directly (not when imported by
// seed.ts).
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
