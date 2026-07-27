"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendProblemReportEmail } from "@/lib/email";

export async function submitProblemReport(formData: FormData) {
  const pageUrl = String(formData.get("page_url") ?? "unknown page").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!description) throw new Error("Please describe the problem.");

  // Auto-attach account/role if logged in — never required, never blocks a
  // logged-out visitor on a public page from submitting.
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  let userRole: string | null = null;
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    userRole = profile?.role ?? null;
  }

  let screenshotPath: string | null = null;
  const screenshot = formData.get("screenshot");
  if (screenshot instanceof File && screenshot.size > 0) {
    if (screenshot.size > 5 * 1024 * 1024) {
      throw new Error("Screenshot is too large. Maximum file size is 5MB.");
    }
    const path = `${user?.id ?? "anonymous"}/${Date.now()}_${screenshot.name}`;
    const { error: uploadErr } = await supabaseAdmin.storage
      .from("problem-report-screenshots")
      .upload(path, screenshot, { contentType: screenshot.type || "image/png" });
    if (uploadErr) throw new Error(`storage.upload(screenshot) failed: ${JSON.stringify(uploadErr)}`);
    screenshotPath = path;
  }

  const { error: insertErr } = await supabaseAdmin.from("problem_reports").insert({
    page_url: pageUrl,
    description,
    screenshot_path: screenshotPath,
    user_id: user?.id ?? null,
    user_email: user?.email ?? null,
    user_role: userRole,
  });
  if (insertErr) throw new Error(`problem_reports.insert failed: ${JSON.stringify(insertErr)}`);

  // Alert admins — non-fatal if this fails, the report is already logged and
  // will still show up in the admin queue either way.
  try {
    const { data: adminProfiles } = await supabaseAdmin.from("profiles").select("id").eq("role", "ADMIN");
    for (const admin of adminProfiles ?? []) {
      const { data: adminAuth } = await supabaseAdmin.auth.admin.getUserById(admin.id);
      const adminEmail = adminAuth?.user?.email;
      if (adminEmail) {
        sendProblemReportEmail({
          adminEmail,
          pageUrl,
          description,
          userEmail: user?.email ?? null,
          userRole,
          hasScreenshot: !!screenshotPath,
        }).catch((e) => console.error("Problem report admin email failed:", e));
      }
    }
  } catch (notifyErr) {
    console.error("Problem report admin notification error (non-fatal):", notifyErr);
  }

  return { ok: true };
}
