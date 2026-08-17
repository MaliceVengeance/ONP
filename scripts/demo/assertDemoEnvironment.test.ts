// Run with: node "scripts/demo/assertDemoEnvironment.test.ts"
//
// Negative-proof tests: prove the guard refuses to proceed when pointed
// at the real staging or production Supabase project, and refuses on
// every other missing/misconfigured check, all without needing a live
// database (every one of these throws before the guard's DB-marker step
// ever runs). The one positive-leaning case (ENV_VALID_BUT_UNREACHABLE_DB)
// proves the guard actually attempts the DB step rather than silently
// short-circuiting to success.
import { test } from "node:test";
import assert from "node:assert/strict";
import { assertDemoEnvironment } from "./assertDemoEnvironment.ts";

const REAL_STAGING_URL = "https://qbdihnmgxtowqnvzflfh.supabase.co";
const REAL_PRODUCTION_URL = "https://efxjujtetreipxvxxfip.supabase.co";
const FAKE_DEMO_URL = "https://abcdefghijklmnopqrst.supabase.co";
const FAKE_DEMO_REF = "abcdefghijklmnopqrst";

const ENV_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "DEMO_SUPABASE_PROJECT_REF",
  "ALLOW_DEMO_SEED",
  "NODE_ENV",
] as const;

function withEnv(overrides: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>>, fn: () => Promise<void>) {
  const saved: Record<string, string | undefined> = {};
  for (const key of ENV_KEYS) saved[key] = process.env[key];
  for (const key of ENV_KEYS) {
    if (overrides[key] === undefined) delete process.env[key];
    else process.env[key] = overrides[key];
  }
  return fn().finally(() => {
    for (const key of ENV_KEYS) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  });
}

test("refuses when pointed at the real STAGING project, even with every other check satisfied", async () => {
  await withEnv(
    {
      NEXT_PUBLIC_SUPABASE_URL: REAL_STAGING_URL,
      SUPABASE_SERVICE_ROLE_KEY: "irrelevant-would-never-be-reached",
      DEMO_SUPABASE_PROJECT_REF: "qbdihnmgxtowqnvzflfh", // even if maliciously/mistakenly set to match
      ALLOW_DEMO_SEED: "true",
      NODE_ENV: "development",
    },
    async () => {
      await assert.rejects(() => assertDemoEnvironment(), /STAGING Supabase project/);
    }
  );
});

test("refuses when pointed at the real PRODUCTION project, even with every other check satisfied", async () => {
  await withEnv(
    {
      NEXT_PUBLIC_SUPABASE_URL: REAL_PRODUCTION_URL,
      SUPABASE_SERVICE_ROLE_KEY: "irrelevant-would-never-be-reached",
      DEMO_SUPABASE_PROJECT_REF: "efxjujtetreipxvxxfip",
      ALLOW_DEMO_SEED: "true",
      NODE_ENV: "development",
    },
    async () => {
      await assert.rejects(() => assertDemoEnvironment(), /PRODUCTION Supabase project/);
    }
  );
});

test("refuses when NEXT_PUBLIC_SUPABASE_URL is missing", async () => {
  await withEnv({}, async () => {
    await assert.rejects(() => assertDemoEnvironment(), /NEXT_PUBLIC_SUPABASE_URL is not set/);
  });
});

test("refuses when NEXT_PUBLIC_SUPABASE_URL does not parse to a project ref", async () => {
  await withEnv({ NEXT_PUBLIC_SUPABASE_URL: "not-a-url" }, async () => {
    await assert.rejects(() => assertDemoEnvironment(), /did not parse to a Supabase project ref/);
  });
});

test("refuses when DEMO_SUPABASE_PROJECT_REF is not set", async () => {
  await withEnv({ NEXT_PUBLIC_SUPABASE_URL: FAKE_DEMO_URL }, async () => {
    await assert.rejects(() => assertDemoEnvironment(), /DEMO_SUPABASE_PROJECT_REF is not set/);
  });
});

test("refuses when DEMO_SUPABASE_PROJECT_REF does not match the resolved ref", async () => {
  await withEnv(
    { NEXT_PUBLIC_SUPABASE_URL: FAKE_DEMO_URL, DEMO_SUPABASE_PROJECT_REF: "some-other-ref" },
    async () => {
      await assert.rejects(() => assertDemoEnvironment(), /does not match DEMO_SUPABASE_PROJECT_REF/);
    }
  );
});

test("refuses when ALLOW_DEMO_SEED is not exactly \"true\"", async () => {
  await withEnv(
    { NEXT_PUBLIC_SUPABASE_URL: FAKE_DEMO_URL, DEMO_SUPABASE_PROJECT_REF: FAKE_DEMO_REF, ALLOW_DEMO_SEED: "yes" },
    async () => {
      await assert.rejects(() => assertDemoEnvironment(), /ALLOW_DEMO_SEED is not exactly "true"/);
    }
  );
});

test("refuses when NODE_ENV is \"production\"", async () => {
  await withEnv(
    {
      NEXT_PUBLIC_SUPABASE_URL: FAKE_DEMO_URL,
      DEMO_SUPABASE_PROJECT_REF: FAKE_DEMO_REF,
      ALLOW_DEMO_SEED: "true",
      NODE_ENV: "production",
    },
    async () => {
      await assert.rejects(() => assertDemoEnvironment(), /NODE_ENV is "production"/);
    }
  );
});

test("refuses when SUPABASE_SERVICE_ROLE_KEY is missing (all prior checks satisfied)", async () => {
  await withEnv(
    {
      NEXT_PUBLIC_SUPABASE_URL: FAKE_DEMO_URL,
      DEMO_SUPABASE_PROJECT_REF: FAKE_DEMO_REF,
      ALLOW_DEMO_SEED: "true",
      NODE_ENV: "development",
    },
    async () => {
      await assert.rejects(() => assertDemoEnvironment(), /SUPABASE_SERVICE_ROLE_KEY is not set/);
    }
  );
});

test("with every check satisfied except a genuinely unreachable/fake project, the guard actually attempts the DB marker check rather than short-circuiting to success", async () => {
  await withEnv(
    {
      NEXT_PUBLIC_SUPABASE_URL: FAKE_DEMO_URL, // does not resolve to any real Supabase project
      SUPABASE_SERVICE_ROLE_KEY: "not-a-real-key",
      DEMO_SUPABASE_PROJECT_REF: FAKE_DEMO_REF,
      ALLOW_DEMO_SEED: "true",
      NODE_ENV: "development",
    },
    async () => {
      // Must still reject -- either a network/DNS error reaching a
      // nonexistent project, or the explicit marker-missing message -- but
      // must NEVER resolve successfully for an environment that was never
      // actually proven to be a designated demo project.
      await assert.rejects(() => assertDemoEnvironment());
    }
  );
});
