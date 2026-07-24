import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AppRole = "CLIENT" | "CONTRACTOR" | "ADMIN" | "INSPECTOR";

export async function requireRole(allowed: AppRole[]) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role, deactivated")
    .eq("id", user.id)
    .single();

  if (error || !profile?.role) redirect("/login");

  // Deactivated accounts are signed out on their very next protected request —
  // this is the only place that check happens, since every dashboard page and
  // mutating action routes through requireRole.
  if (profile.deactivated) {
    await supabase.auth.signOut();
    redirect("/login?error=Your%20account%20has%20been%20deactivated.%20Contact%20support%20if%20you%20believe%20this%20is%20a%20mistake.");
  }

  const role = profile.role as AppRole;

  if (!allowed.includes(role)) {
    // Safe default: kick them back to /dashboard, which routes them properly.
    redirect("/dashboard");
  }

  return { supabase, user, role };
}
