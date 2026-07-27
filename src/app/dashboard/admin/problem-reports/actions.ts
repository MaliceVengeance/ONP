"use server";

import { requireRole } from "@/lib/auth/requireRole";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function markProblemReportResolved(reportId: string, resolved: boolean) {
  await requireRole(["ADMIN"]);

  const { error } = await supabaseAdmin
    .from("problem_reports")
    .update({ status: resolved ? "RESOLVED" : "OPEN" })
    .eq("id", reportId);
  if (error) throw new Error(`markProblemReportResolved failed: ${JSON.stringify(error)}`);

  revalidatePath("/dashboard/admin/problem-reports");
}
