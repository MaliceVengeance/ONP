// Deletes only rows tied to the known demo identifiers (fixed emails, the
// demo project's title) — never a blanket TRUNCATE, so this stays safe
// even if ever pointed at a demo project that's shared for something
// else. Deletes in FK-safe order. Idempotent: safe to run against an
// already-empty demo project (every step is a no-op "delete where
// nothing matches").
//
// Every read/write below checks its returned `error` and throws loudly on
// failure — an earlier version of this file didn't, which let a broken
// step fail completely silently while later steps kept running.
import { fileURLToPath } from "node:url";
import path from "node:path";
import { assertDemoEnvironment } from "./assertDemoEnvironment.ts";
import { buildDemoAdminClient, findUserIdByEmail } from "./supabaseAdminClient.ts";
import { DEMO_CLIENT, DEMO_CONTRACTORS, DEMO_PROJECT } from "./data.ts";
import type { SupabaseClient } from "@supabase/supabase-js";

function check(step: string, error: { message: string } | null): void {
  if (error) throw new Error(`resetDemoData: ${step} failed: ${error.message}`);
}

export async function resetDemoData(admin: SupabaseClient): Promise<void> {
  const contractorEmails = DEMO_CONTRACTORS.map((c) => c.email);
  const allDemoEmails = [DEMO_CLIENT.email, ...contractorEmails];

  const contractorIds = (
    await Promise.all(contractorEmails.map((email) => findUserIdByEmail(admin, email)))
  ).filter((id): id is string => id !== null);

  const { data: projectRows, error: projectFindError } = await admin
    .from("projects")
    .select("id")
    .eq("title", DEMO_PROJECT.title);
  check("find demo project", projectFindError);
  const projectIds = (projectRows ?? []).map((p) => p.id as string);

  for (const projectId of projectIds) {
    const { data: bidRows, error: bidFindError } = await admin.from("bids").select("id").eq("project_id", projectId);
    check("find bids", bidFindError);
    const bidIds = (bidRows ?? []).map((b) => b.id as string);

    if (bidIds.length > 0) {
      const { data: versionRows, error: versionFindError } = await admin
        .from("bid_versions")
        .select("id")
        .in("bid_id", bidIds);
      check("find bid_versions", versionFindError);
      const versionIds = (versionRows ?? []).map((v) => v.id as string);

      if (versionIds.length > 0) {
        const { error } = await admin.from("bid_line_items").delete().in("bid_version_id", versionIds);
        check("delete bid_line_items", error);
      }
      check("delete bid_versions", (await admin.from("bid_versions").delete().in("bid_id", bidIds)).error);
      check("delete bids", (await admin.from("bids").delete().in("id", bidIds)).error);
    }

    check("delete rfis", (await admin.from("rfis").delete().eq("project_id", projectId)).error);
    check(
      "delete project_attachments",
      (await admin.from("project_attachments").delete().eq("project_id", projectId)).error
    );
    check("delete project_awards", (await admin.from("project_awards").delete().eq("project_id", projectId)).error);
  }
  if (projectIds.length > 0) {
    check("delete projects", (await admin.from("projects").delete().in("id", projectIds)).error);
  }

  if (contractorIds.length > 0) {
    check(
      "delete contractor_credentials",
      (await admin.from("contractor_credentials").delete().in("contractor_id", contractorIds)).error
    );
    check(
      "delete contractor_subscriptions",
      (await admin.from("contractor_subscriptions").delete().in("contractor_id", contractorIds)).error
    );
    check(
      "delete contractor_portfolio_photos",
      (await admin.from("contractor_portfolio_photos").delete().in("contractor_id", contractorIds)).error
    );
    check(
      "delete contractor_profiles",
      (await admin.from("contractor_profiles").delete().in("contractor_id", contractorIds)).error
    );
  }

  // profiles rows deleted explicitly (not relied on cascade-from-auth-user,
  // since that FK behavior isn't confirmed) before deleting the auth users
  // themselves.
  const allDemoIds = (
    await Promise.all(allDemoEmails.map((email) => findUserIdByEmail(admin, email)))
  ).filter((id): id is string => id !== null);

  if (allDemoIds.length > 0) {
    check("delete profiles", (await admin.from("profiles").delete().in("id", allDemoIds)).error);
  }
  for (const id of allDemoIds) {
    const { error } = await admin.auth.admin.deleteUser(id);
    check(`delete auth user ${id}`, error);
  }
}

async function main() {
  const env = await assertDemoEnvironment();
  const admin = buildDemoAdminClient(env);
  await resetDemoData(admin);
  console.log(`[demo:reset] done — demo project ref=${env.projectRef}`);
}

// Only run as a CLI entrypoint when invoked directly (not when imported by
// seed.ts). Compares real filesystem paths (via fileURLToPath + path.resolve)
// rather than raw strings — a naive `import.meta.url === \`file://${argv[1]}\``
// comparison is always false on Windows, since import.meta.url uses forward
// slashes with a triple slash after "file:" while process.argv[1] is a
// native backslash path; this cross-platform-correct version was adopted
// after that exact failure mode was caught during demo-tooling verification.
const isDirectCliInvocation =
  process.argv[1] !== undefined &&
  path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1]);

if (isDirectCliInvocation) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
