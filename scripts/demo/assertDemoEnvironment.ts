// Fail-closed safety gate for every demo-data script (seed/reset/reveal/
// award). Imported as the very first line of each entrypoint, before any
// other Supabase client in that script is constructed. Throws
// synchronously and stops the process on the first failed check.
//
// There is no override flag, anywhere in this file, by design: if a check
// fails, the fix is to correct the environment, not to bypass this file.
//
// Checks run in this order, cheapest/zero-network first, so a
// misconfigured or absent service-role key can never mask a wrong-project
// mistake:
//   1. NEXT_PUBLIC_SUPABASE_URL parses to a project ref.
//   2. The resolved ref is NOT the known production or staging ref --
//      hardcoded here, independent of every other check, so a
//      misconfigured allowlist alone can never be sufficient to proceed
//      against a real environment.
//   3. DEMO_SUPABASE_PROJECT_REF is set and matches the resolved ref.
//   4. ALLOW_DEMO_SEED=true is set -- a second, human-set confirmation
//      that isn't derived from the URL at all.
//   5. NODE_ENV !== "production".
//   6. A one-row `_demo_environment_marker` table already exists in the
//      target database -- the human-in-the-loop proof that this specific
//      project was deliberately designated for demo writes. Set up by
//      hand via scripts/demo/setup-demo-marker.sql, which is never run by
//      this file, any npm script, or any other automated path.
import { createClient } from "@supabase/supabase-js";

const PRODUCTION_SUPABASE_PROJECT_REF = "efxjujtetreipxvxxfip";
const STAGING_SUPABASE_PROJECT_REF = "qbdihnmgxtowqnvzflfh";

export type DemoEnvironment = {
  supabaseUrl: string;
  serviceRoleKey: string;
  projectRef: string;
};

function fail(message: string): never {
  throw new Error(`[assertDemoEnvironment] REFUSING TO PROCEED: ${message}`);
}

function parseProjectRef(supabaseUrl: string): string | null {
  const match = supabaseUrl.trim().match(/^https:\/\/([a-z0-9]+)\.supabase\.co\/?$/i);
  return match ? match[1].toLowerCase() : null;
}

export async function assertDemoEnvironment(): Promise<DemoEnvironment> {
  // --- 1. NEXT_PUBLIC_SUPABASE_URL parses to a project ref -----------------
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    fail("NEXT_PUBLIC_SUPABASE_URL is not set.");
  }
  const projectRef = parseProjectRef(supabaseUrl!);
  if (!projectRef) {
    fail(`NEXT_PUBLIC_SUPABASE_URL ("${supabaseUrl}") did not parse to a Supabase project ref.`);
  }

  // --- 2. Hardcoded denylist, independent of everything else below --------
  if (projectRef === PRODUCTION_SUPABASE_PROJECT_REF) {
    fail(
      `resolved project ref "${projectRef}" is the PRODUCTION Supabase project. ` +
        `Demo scripts must never run against production, under any configuration.`
    );
  }
  if (projectRef === STAGING_SUPABASE_PROJECT_REF) {
    fail(
      `resolved project ref "${projectRef}" is the STAGING Supabase project. ` +
        `Demo scripts must never run against staging.`
    );
  }

  // --- 3. Explicit expected ref, no default --------------------------------
  const expectedRef = process.env.DEMO_SUPABASE_PROJECT_REF;
  if (!expectedRef) {
    fail("DEMO_SUPABASE_PROJECT_REF is not set. The expected demo project ref must be explicit.");
  }
  if (projectRef !== expectedRef.toLowerCase()) {
    fail(
      `resolved project ref "${projectRef}" does not match DEMO_SUPABASE_PROJECT_REF ` +
        `("${expectedRef}"). Refusing to guess.`
    );
  }

  // --- 4. Independent human confirmation -----------------------------------
  if (process.env.ALLOW_DEMO_SEED !== "true") {
    fail('ALLOW_DEMO_SEED is not exactly "true".');
  }

  // --- 5. Runtime sanity check ----------------------------------------------
  if (process.env.NODE_ENV === "production") {
    fail("NODE_ENV is \"production\". Demo scripts must never run in a production runtime.");
  }

  // --- 6. Read-only DB marker: the human-in-the-loop designation ----------
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    fail("SUPABASE_SERVICE_ROLE_KEY is not set.");
  }

  const admin = createClient(supabaseUrl!, serviceRoleKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await admin
    .from("_demo_environment_marker")
    .select("id")
    .eq("id", true)
    .maybeSingle();

  if (error) {
    fail(
      `could not read the _demo_environment_marker table (code=${error.code ?? "unknown"}, ` +
        `message=${error.message}). Run scripts/demo/setup-demo-marker.sql by hand against this ` +
        `project first -- this table's presence is the human confirmation that this project is ` +
        `authorized for demo writes, and it is never created automatically.`
    );
  }
  if (!data) {
    fail(
      "the _demo_environment_marker table exists but has no designated row. " +
        "Run scripts/demo/setup-demo-marker.sql by hand against this project."
    );
  }

  return { supabaseUrl: supabaseUrl!, serviceRoleKey: serviceRoleKey!, projectRef };
}
