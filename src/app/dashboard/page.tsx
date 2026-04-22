import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function roleToPath(role: string) {
  switch (role) {
    case "ADMIN":
      return "/dashboard/admin";
    case "INSPECTOR":
      return "/dashboard/inspector";
    case "CONTRACTOR":
      return "/dashboard/contractor";
    case "CLIENT":
    default:
      return "/dashboard/client";
  }
}

export default async function DashboardIndex() {
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

  // If profile is missing for some reason, send them to login (or you could create it here)
  if (error || !profile?.role) {
    redirect("/login");
  }

  redirect(roleToPath(profile.role));
}
