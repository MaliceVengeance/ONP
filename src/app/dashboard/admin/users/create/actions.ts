"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";

function clean(v: FormDataEntryValue | null) {
  return String(v ?? "").trim();
}

export async function createUser(formData: FormData) {
  // Verify the requester is an admin
  await requireRole(["ADMIN"]);

  const display_name = clean(formData.get("display_name"));
  const email = clean(formData.get("email"));
  const password = clean(formData.get("password"));
  const role = clean(formData.get("role"));

  if (!display_name || !email || !password || !role) {
    redirect("/dashboard/admin/users/create?error=All+fields+are+required.");
  }

  if (password.length < 8) {
    redirect("/dashboard/admin/users/create?error=Password+must+be+at+least+8+characters.");
  }

  if (!["ADMIN", "INSPECTOR"].includes(role)) {
    redirect("/dashboard/admin/users/create?error=Invalid+role+selected.");
  }

  // Create auth user using admin client
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError || !authData?.user) {
    const msg = encodeURIComponent(authError?.message ?? "Failed to create user.");
    redirect(`/dashboard/admin/users/create?error=${msg}`);
  }

  const userId = authData.user.id;

  // Upsert profile in case trigger already created it
  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .upsert({
      id: userId,
      role,
      display_name,
    }, {
      onConflict: "id",
    });

  if (profileError) {
    const msg = encodeURIComponent(profileError.message ?? "Failed to create profile.");
    redirect(`/dashboard/admin/users/create?error=${msg}`);
  }

  redirect("/dashboard/admin/users/create?created=1");
}