"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getEmergencyRequestStatus } from "@/lib/emergency/rateLimit";
import { CLIENT_EMERGENCY_REQUEST } from "@/lib/disclaimers/clientEmergencyRequest";
import type { ProjectCategory } from "@/lib/projects/categories";
import { isInServiceArea } from "@/lib/serviceArea/launchZips";

function clean(v: FormDataEntryValue | null) {
  return String(v ?? "").trim();
}

/** Insert any pre-answered RFI fields (name="rfi_<catalog_id>") from the new-project form. */
async function insertPreAnsweredRfis(projectId: string, formData: FormData) {
  const now = new Date().toISOString();
  const toInsert: {
    project_id: string;
    contractor_id: null;
    catalog_id: string;
    question: null;
    response: string;
    status: string;
    responded_at: string;
    revision_number: number;
  }[] = [];

  for (const [key, value] of formData.entries()) {
    if (key.startsWith("rfi_") && typeof value === "string" && value.trim()) {
      toInsert.push({
        project_id: projectId,
        contractor_id: null,
        catalog_id: key.slice(4),
        question: null,
        response: value.trim(),
        status: "ANSWERED",
        responded_at: now,
        revision_number: 0,
      });
    }
  }

  if (toInsert.length === 0) return;

  const { error } = await supabaseAdmin.from("rfis").insert(toInsert);
  if (error) {
    // Non-fatal — project creation succeeds regardless
    console.error("Failed to insert pre-answered RFIs:", error.message);
  }
}

export async function createProject(formData: FormData) {
  const { supabase, user } = await requireRole(["CLIENT", "ADMIN"]);

  const title = clean(formData.get("title"));
  const description = clean(formData.get("description"));
  const category = clean(formData.get("category")) as ProjectCategory;
  const city = clean(formData.get("city"));
  const usState = clean(formData.get("us_state"));
  const zip_code = clean(formData.get("zip_code")) || null;
  const target_start_date = clean(formData.get("target_start_date")) || null;
  const isEmergency = formData.get("is_emergency") === "true";
  const disclaimerAccepted = formData.get("emergency_disclaimer_accepted") === "on";

  if (!title || !category || !city || !usState) {
    throw new Error("Missing required fields.");
  }

  // Server-side service area check — trust nothing from the client
  if (zip_code && !isInServiceArea(zip_code)) {
    redirect(`/dashboard/client/projects/new?area_error=1&zip=${encodeURIComponent(zip_code.slice(0, 5))}`);
  }

  const location_general = `${city}, ${usState}`;

  // ── Standard project ──────────────────────────────────────────
  if (!isEmergency) {
    const { data, error } = await supabase
      .from("projects")
      .insert({
        client_id: user.id,
        state: "DRAFT",
        title,
        category,
        description,
        city,
        location_general,
        zip_code,
        target_start_date,
      })
      .select("id")
      .single();

    if (error) throw error;
    await insertPreAnsweredRfis(data.id, formData);
    redirect(`/dashboard/client/projects/${data.id}`);
  }

  // ── Emergency project ─────────────────────────────────────────

  // Require disclaimer acceptance (belt-and-suspenders — UI enforces it too)
  if (!disclaimerAccepted) {
    throw new Error("You must accept the Emergency Bid Request terms to continue.");
  }

  // Server-side rate limit check
  const rateLimit = await getEmergencyRequestStatus(user.id);
  if (rateLimit.remaining <= 0) {
    throw new Error(
      "Emergency request limit reached. Please wait until a slot reopens or contact support."
    );
  }

  // Create project in PENDING_PAYMENT state
  const { data: project, error: projErr } = await supabase
    .from("projects")
    .insert({
      client_id: user.id,
      state: "PENDING_PAYMENT",
      is_emergency: true,
      title,
      category,
      description,
      city,
      location_general,
      zip_code,
      target_start_date,
    })
    .select("id")
    .single();

  if (projErr) throw projErr;

  const projectId = project.id;
  const now = new Date().toISOString();

  // Log disclaimer acknowledgment
  await supabaseAdmin
    .from("disclaimer_acknowledgments")
    .insert({
      user_id: user.id,
      disclaimer_type: CLIENT_EMERGENCY_REQUEST.type,
      disclaimer_version: CLIENT_EMERGENCY_REQUEST.version,
      project_id: projectId,
      acknowledged_at: now,
    });

  // Check for an available admin-granted bonus slot (not yet consumed)
  const { data: bonusRow } = await supabaseAdmin
    .from("emergency_request_log")
    .select("id")
    .eq("client_id", user.id)
    .eq("admin_granted", true)
    .is("project_id", null)
    .limit(1)
    .maybeSingle();

  // If a bonus slot exists, this request doesn't consume the regular limit
  const countsAgainstLimit = !bonusRow;

  // Insert log row for this emergency project
  await supabaseAdmin
    .from("emergency_request_log")
    .insert({
      client_id: user.id,
      project_id: projectId,
      payment_status: "PENDING",
      charged_amount_cents: 1000,
      counts_against_limit: countsAgainstLimit,
      admin_granted: false,
    });

  // Consume the bonus slot by linking it to this project
  if (bonusRow) {
    await supabaseAdmin
      .from("emergency_request_log")
      .update({ project_id: projectId })
      .eq("id", bonusRow.id);
  }

  await insertPreAnsweredRfis(projectId, formData);

  redirect(`/dashboard/client/projects/${projectId}/emergency-pay`);
}
