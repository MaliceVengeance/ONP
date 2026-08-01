"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendProjectArchivedEmail } from "@/lib/email";
import type { ProjectCategory } from "@/lib/projects/categories";

function clean(v: FormDataEntryValue | null) {
  return String(v ?? "").trim();
}

function toInt(v: FormDataEntryValue | null, fallback: number) {
  const n = Number(String(v ?? "").trim());
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

/**
 * Create a brand-new draft project
 */
export async function createDraftProject(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const title = clean(formData.get("title"));
  const description = clean(formData.get("description"));
  const category = clean(formData.get("category")) as ProjectCategory;
  const city = clean(formData.get("city"));
  const usState = clean(formData.get("us_state"));
  const zip_code = clean(formData.get("zip_code")) || null;

  if (!title || !category || !city || !usState) {
    throw new Error("Missing required fields.");
  }

  const location_general = `${city}, ${usState}`;

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
    })
    .select("id")
    .single();

  if (error) throw error;

  redirect(`/dashboard/client/projects/${data.id}`);
}

/**
 * Update an existing draft project
 * (draft-only edits)
 */
export async function updateDraftProject(projectId: string, formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const title = clean(formData.get("title"));
  const description = clean(formData.get("description"));
  const category = clean(formData.get("category")) as ProjectCategory;
  const city = clean(formData.get("city"));
  const usState = clean(formData.get("us_state"));
  const zip_code = clean(formData.get("zip_code")) || null;
  const target_start_date = clean(formData.get("target_start_date")) || null;

  if (!title || !category || !city || !usState) {
    throw new Error("Missing required fields.");
  }

  const location_general = `${city}, ${usState}`;

  const { error } = await supabase
    .from("projects")
    .update({
      title,
      category,
      description,
      city,
      location_general,
      zip_code,
      target_start_date,
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId)
    .eq("state", "DRAFT");

  if (error) throw error;

  redirect(`/dashboard/client/projects/${projectId}`);
}

/**
 * Publish a draft project and open bidding
 */
export async function publishProject(projectId: string, formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const MIN_DAYS = 5;
  const MAX_DAYS = 10;

  const chosenDays = toInt(formData.get("bid_days"), MIN_DAYS);
  const bidDays = Math.max(MIN_DAYS, Math.min(MAX_DAYS, chosenDays));

  const { data: project, error: readErr } = await supabase
    .from("projects")
    .select("id,state,title,category,description,location_general")
    .eq("id", projectId)
    .single();

  if (readErr) throw readErr;

  if (project.state !== "DRAFT") {
    redirect(`/dashboard/client/projects/${projectId}`);
  }

  if (!project.title || !project.category || !project.location_general) {
    throw new Error(
      "Project is missing required details (title/category/location)."
    );
  }

  const now = new Date();
  const deadline = new Date(
    now.getTime() + bidDays * 24 * 60 * 60 * 1000
  );

  const { error: updErr } = await supabase
    .from("projects")
    .update({
      state: "OPEN",
      published_at: now.toISOString(),
      deadline_at: deadline.toISOString(),
      min_open_days: MIN_DAYS,
      max_open_days: bidDays,
      updated_at: now.toISOString(),
    })
    .eq("id", projectId)
    .eq("state", "DRAFT");

  if (updErr) throw updErr;

  redirect(`/dashboard/client/projects/${projectId}`);
}

/**
 * Permanently delete a project. Punch List 11: a project can never be
 * deleted while its bidding window is open — DRAFT/PENDING_PAYMENT never
 * had a window at all (always eligible), but an OPEN project is only
 * eligible once its deadline has passed, and only if it never received a
 * single bid. Anything with real bid activity goes through archiveProject
 * instead, never a hard delete.
 */
export async function deleteProject(projectId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Confirm ownership and fetch state
  const { data: project, error: readErr } = await supabase
    .from("projects")
    .select("id, state, client_id, deadline_at")
    .eq("id", projectId)
    .eq("client_id", user.id)
    .single();

  if (readErr || !project) {
    throw new Error("Project not found or you do not have permission to delete it.");
  }

  const neverPublished = project.state === "DRAFT" || project.state === "PENDING_PAYMENT";
  const deadlinePassed = !!project.deadline_at && new Date(project.deadline_at).getTime() <= Date.now();

  if (!neverPublished) {
    if (project.state !== "OPEN") {
      throw new Error("This project can't be permanently deleted. Awarded or bid-on projects are archived instead, to preserve the record.");
    }
    if (!deadlinePassed) {
      throw new Error("This project's bidding window is still open — it can't be deleted or archived until the deadline passes.");
    }
  }

  // If PENDING_PAYMENT, cancel the emergency log row first (avoids FK constraint)
  if (project.state === "PENDING_PAYMENT") {
    await supabaseAdmin
      .from("emergency_request_log")
      .update({
        payment_status: "FAILED",
        counts_against_limit: false,
        closed_at: new Date().toISOString(),
        close_reason: "DELETED",
      })
      .eq("project_id", projectId)
      .eq("payment_status", "PENDING");
  }

  // If OPEN (deadline already confirmed passed above), block deletion if any bids exist
  if (project.state === "OPEN") {
    const { count } = await supabase
      .from("bids")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId);

    if ((count ?? 0) > 0) {
      throw new Error("This project has submitted bids — archive it instead of deleting, to preserve that record.");
    }
  }

  const { error: delErr } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId)
    .eq("client_id", user.id);

  if (delErr) throw delErr;

  redirect("/dashboard/client/projects");
}

/**
 * Soft-delete / archive a project — for AWARDED or COMPLETED projects, or an
 * OPEN project past its deadline that has real bid activity. Nothing is
 * deleted; state flips to CANCELED (the app's existing, previously-unused
 * archive marker — already styled and bucketed as "closed" everywhere in
 * the UI, so no new enum value or migration was needed). If the project was
 * never awarded, every contractor who bid gets notified immediately, same
 * pattern as bid dismissal notifications.
 */
export async function archiveProject(projectId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: project, error: readErr } = await supabase
    .from("projects")
    .select("id, title, state, client_id, deadline_at")
    .eq("id", projectId)
    .eq("client_id", user.id)
    .single();

  if (readErr || !project) {
    throw new Error("Project not found or you do not have permission to archive it.");
  }

  const isTerminalAwarded = project.state === "AWARDED" || project.state === "COMPLETED";
  const deadlinePassed = !!project.deadline_at && new Date(project.deadline_at).getTime() <= Date.now();

  if (!isTerminalAwarded) {
    if (project.state !== "OPEN") {
      throw new Error("This project can't be archived from its current state.");
    }
    if (!deadlinePassed) {
      throw new Error("This project's bidding window is still open — it can't be archived until the deadline passes.");
    }
  }

  const { data: bidderRows } = await supabase
    .from("bids")
    .select("contractor_id")
    .eq("project_id", projectId);

  const hasBids = (bidderRows ?? []).length > 0;

  if (!isTerminalAwarded && !hasBids) {
    throw new Error("This project never received a bid — delete it instead of archiving, since there's nothing to preserve.");
  }

  const { error: updErr } = await supabase
    .from("projects")
    .update({ state: "CANCELED", updated_at: new Date().toISOString() })
    .eq("id", projectId)
    .eq("client_id", user.id);

  if (updErr) throw updErr;

  // Notify every contractor who bid — only meaningful when the project
  // never reached an award (an awarded/completed project's contractors
  // already know the outcome; this is specifically for "closed out with no
  // winner"). Each send is independently try/caught so one failure can't
  // block the others, matching the dismissal-notification pattern.
  if (!isTerminalAwarded && hasBids) {
    const contractorIds = [...new Set((bidderRows ?? []).map((b) => b.contractor_id))];
    const { data: profileRows } = await supabaseAdmin
      .from("contractor_profiles")
      .select("contractor_id, business_name")
      .in("contractor_id", contractorIds);
    const nameMap = new Map((profileRows ?? []).map((p) => [p.contractor_id, p.business_name]));

    for (const contractorId of contractorIds) {
      try {
        const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(contractorId);
        if (authUser?.user?.email) {
          await sendProjectArchivedEmail({
            contractorEmail: authUser.user.email,
            contractorName: nameMap.get(contractorId) ?? "Contractor",
            projectTitle: project.title ?? "Project",
          });
        }
      } catch (e) {
        console.error(`Failed to send project-archived email for contractor ${contractorId}:`, e);
      }
    }
  }

  redirect("/dashboard/client/projects");
}

/**
 * Repost / clone an existing project as a NEW draft
 * (new ID, clean bidding round)
 */
export async function repostProject(projectId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data, error } = await supabase.rpc("clone_project_as_draft", {
    p_project_id: projectId,
  });

  if (error) {
    throw new Error(
      `clone_project_as_draft failed: ${JSON.stringify(error)}`
    );
  }

  // data is the new project UUID
  redirect(`/dashboard/client/projects/${data}`);
}

/**
 * Save / update the client's pre-answered catalog questions on a project.
 * Works on both draft and published projects.
 */
export async function updateProjectRfis(projectId: string, formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Ownership check (admins bypass)
  const { data: proj } = await supabase
    .from("projects")
    .select("client_id")
    .eq("id", projectId)
    .maybeSingle();

  if (!proj) throw new Error("Project not found.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const isAdmin = (profile as any)?.role === "ADMIN";
  if (!isAdmin && proj.client_id !== user.id) throw new Error("Not authorized.");

  const now = new Date().toISOString();

  // Fetch existing pre-answered RFIs for this project (contractor_id IS NULL)
  const { data: existing } = await supabaseAdmin
    .from("rfis")
    .select("id, catalog_id")
    .eq("project_id", projectId)
    .is("contractor_id", null);

  const existingMap = new Map<string, string>(); // catalog_id → rfi row id
  (existing ?? []).forEach((r: any) => existingMap.set(r.catalog_id, r.id));

  // Process every rfi_<catalog_id> field from the form
  for (const [key, val] of formData.entries()) {
    if (!key.startsWith("rfi_")) continue;
    const catalogId = key.slice(4);
    const value = typeof val === "string" ? val.trim() : "";
    const existingId = existingMap.get(catalogId);

    if (existingId && value) {
      // Update existing answer
      const { error } = await supabaseAdmin
        .from("rfis")
        .update({ response: value, responded_at: now })
        .eq("id", existingId);
      if (error) throw new Error(`Failed to update RFI: ${error.message}`);
    } else if (existingId && !value) {
      // Client cleared the answer — remove it
      const { error } = await supabaseAdmin.from("rfis").delete().eq("id", existingId);
      if (error) throw new Error(`Failed to delete RFI: ${error.message}`);
    } else if (!existingId && value) {
      // New answer
      const { error } = await supabaseAdmin.from("rfis").insert({
        project_id: projectId,
        contractor_id: null,
        catalog_id: catalogId,
        question: null,
        response: value,
        status: "ANSWERED",
        responded_at: now,
        revision_number: 0,
      });
      if (error) throw new Error(`Failed to save answer: ${error.message}`);
    }
  }

  redirect(`/dashboard/client/projects/${projectId}?qa=saved`);
}
