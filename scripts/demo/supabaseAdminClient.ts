import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { DemoEnvironment } from "./assertDemoEnvironment.ts";

export function buildDemoAdminClient(env: DemoEnvironment): SupabaseClient {
  return createClient(env.supabaseUrl, env.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Supabase Admin Auth has no "get user by email" call — only paginated
 * listUsers(). Fine for a demo project's tiny, known-small user count.
 * Returns null if no user with this email exists yet.
 */
export async function findUserIdByEmail(
  admin: SupabaseClient,
  email: string
): Promise<string | null> {
  const target = email.trim().toLowerCase();
  let page = 1;
  const perPage = 200;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`listUsers failed: ${error.message}`);
    const match = data.users.find((u) => (u.email ?? "").toLowerCase() === target);
    if (match) return match.id;
    if (data.users.length < perPage) return null; // exhausted all pages
    page += 1;
  }
}
