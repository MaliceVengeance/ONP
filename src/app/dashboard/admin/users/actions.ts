"use server";

import { requireRole } from "@/lib/auth/requireRole";
import { revalidatePath } from "next/cache";

export async function changeUserRole(userId: string, newRole: string) {
  const { supabase } = await requireRole(["ADMIN"]);

  const { error } = await supabase
    .from("profiles")
    .update({ role: newRole })
    .eq("id", userId);

  if (error) throw new Error(`changeUserRole failed: ${JSON.stringify(error)}`);

  revalidatePath("/dashboard/admin/users");
}

export async function deactivateUser(userId: string) {
  const { supabase } = await requireRole(["ADMIN"]);

  const { error } = await supabase
    .from("profiles")
    .update({ deactivated: true })
    .eq("id", userId);

  if (error) throw new Error(`deactivateUser failed: ${JSON.stringify(error)}`);

  revalidatePath("/dashboard/admin/users");
}

export async function reactivateUser(userId: string) {
  const { supabase } = await requireRole(["ADMIN"]);

  const { error } = await supabase
    .from("profiles")
    .update({ deactivated: false })
    .eq("id", userId);

  if (error) throw new Error(`reactivateUser failed: ${JSON.stringify(error)}`);

  revalidatePath("/dashboard/admin/users");
}