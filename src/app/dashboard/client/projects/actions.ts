"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
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
