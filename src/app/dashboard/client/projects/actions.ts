"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
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
 * Delete a project — only allowed if it's a DRAFT,
 * or OPEN with zero bids submitted
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
    .select("id, state, client_id")
    .eq("id", projectId)
    .eq("client_id", user.id)
    .single();

  if (readErr || !project) {
    throw new Error("Project not found or you do not have permission to delete it.");
  }

  if (!["DRAFT", "OPEN", "PENDING_PAYMENT"].includes(project.state)) {
    throw new Error("Only draft or open projects can be removed.");
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

  // If OPEN, block deletion if any bids exist
  if (project.state === "OPEN") {
    const { count } = await supabase
      .from("bids")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId);

    if ((count ?? 0) > 0) {
      throw new Error("Cannot remove a project that already has bids submitted.");
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
