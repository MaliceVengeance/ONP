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
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || !profile?.role) redirect("/login");

  const role = profile.role as AppRole;

  if (!allowed.includes(role)) {
    // Safe default: kick them back to /dashboard, which routes them properly.
    redirect("/dashboard");
  }

  return { supabase, user, role };
}
