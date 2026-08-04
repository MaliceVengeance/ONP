"use server";

import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

/**
 * Punch List 12: permanent deletion of already-deactivated user accounts,
 * for pre-launch test-account cleanup. No DB-level cascade can be assumed —
 * several tables in this schema (confirmed via the live PostgREST schema)
 * use plain UUID "reference" columns with no enforced foreign key at all,
 * so every dependent row is deleted explicitly here, in dependency order,
 * rather than relying on ON DELETE CASCADE that may not exist.
 *
 * Two different things happen to a user's ID across other tables, and they
 * are handled differently on purpose:
 *  - Rows the deleted user OWNS (their bids, their projects, their
 *    credentials, messages they sent, disputes they were a party to) are
 *    deleted outright — this is the "cascade through everything tied to
 *    the account" behavior that was explicitly asked for.
 *  - Columns where the deleted user is merely an ACTOR on someone ELSE's
 *    row (an admin who verified a different contractor's credential, who
 *    resolved a different contractor's dispute, who assigned a support
 *    ticket) are nulled out instead of deleting that row — deleting a real
 *    user's credential/dispute/ticket just because the admin who touched
 *    it is gone would destroy real data that was never asked to be
 *    removed. audit_log/admin_actions are left untouched entirely, since
 *    an audit trail is supposed to survive the actor's account.
 */

async function purgeStoragePrefix(bucket: string, prefix: string) {
  try {
    const { data: files } = await supabaseAdmin.storage.from(bucket).list(prefix);
    if (files && files.length > 0) {
      await supabaseAdmin.storage.from(bucket).remove(files.map((f) => `${prefix}/${f.name}`));
    }
  } catch (e) {
    console.error(`purgeStoragePrefix(${bucket}, ${prefix}) failed:`, e);
  }
}

async function nullColumn(table: string, column: string, userId: string) {
  try {
    await supabaseAdmin.from(table).update({ [column]: null }).eq(column, userId);
  } catch (e) {
    console.error(`nullColumn(${table}.${column}) failed:`, e);
  }
}

async function deleteWhereEq(table: string, column: string, userId: string) {
  try {
    await supabaseAdmin.from(table).delete().eq(column, userId);
  } catch (e) {
    console.error(`deleteWhereEq(${table}.${column}) failed:`, e);
  }
}

async function deleteWhereIn(table: string, column: string, values: string[]) {
  if (values.length === 0) return;
  try {
    await supabaseAdmin.from(table).delete().in(column, values);
  } catch (e) {
    console.error(`deleteWhereIn(${table}.${column}) failed:`, e);
  }
}

async function deleteOneAccount(userId: string) {
  const { data: profile, error: profileErr } = await supabaseAdmin
    .from("profiles")
    .select("id, deactivated")
    .eq("id", userId)
    .maybeSingle();

  if (profileErr || !profile) throw new Error(`User ${userId} not found.`);
  if (!profile.deactivated) throw new Error(`User ${userId} is not deactivated — deactivate the account before deleting it.`);

  // Collect this user's own entities so children can be cascaded.
  const [{ data: projectRows }, { data: bidRows }] = await Promise.all([
    supabaseAdmin.from("projects").select("id").eq("client_id", userId),
    supabaseAdmin.from("bids").select("id").eq("contractor_id", userId),
  ]);
  const projectIds = (projectRows ?? []).map((r) => r.id as string);
  const bidIds = (bidRows ?? []).map((r) => r.id as string);

  let bidVersionIds: string[] = [];
  if (bidIds.length > 0) {
    const { data: versionRows } = await supabaseAdmin
      .from("bid_versions")
      .select("id")
      .in("bid_id", bidIds);
    bidVersionIds = (versionRows ?? []).map((r) => r.id as string);
  }

  // Storage — physical files, best-effort.
  await purgeStoragePrefix("contractor-portfolio", userId);
  await purgeStoragePrefix("problem-report-screenshots", userId);
  for (const projectId of projectIds) await purgeStoragePrefix("project-files", projectId);
  for (const bidId of bidIds) await purgeStoragePrefix("bid-quotes", bidId);

  // Null out actor-only references on rows this user doesn't own, so a
  // real other user's row survives intact.
  await Promise.all([
    nullColumn("contractor_credentials", "verified_by", userId),
    nullColumn("subscription_disputes", "resolved_by", userId),
    nullColumn("support_requests", "assigned_to", userId),
    nullColumn("coupon_codes", "created_by", userId),
    nullColumn("emergency_request_log", "admin_granted_by", userId),
    nullColumn("inspector_upgrade_disputes", "master_inspector_id", userId),
    nullColumn("master_inspector_reviews_log", "master_inspector_id", userId),
    nullColumn("contractor_verification_log", "admin_id", userId),
    nullColumn("project_revisions", "created_by", userId),
    nullColumn("project_attachments", "uploaded_by", userId),
    nullColumn("project_awards", "created_by", userId),
    nullColumn("project_awards", "awarded_by", userId),
    nullColumn("rfis", "responded_by", userId),
    nullColumn("profiles", "vet_cert_verified_by", userId),
    nullColumn("contractor_profiles", "veteran_verified_by", userId),
    nullColumn("contractor_profiles", "directory_verified_by", userId),
    nullColumn("projects", "urgent_set_by", userId),
    nullColumn("projects", "override_requested_by", userId),
  ]);

  // Delete owned rows, leaves first.
  await deleteWhereIn("bid_line_items", "bid_version_id", bidVersionIds);
  await deleteWhereIn("bid_versions", "bid_id", bidIds);
  await deleteWhereEq("bid_acknowledgments", "contractor_id", userId);
  await deleteWhereIn("bid_acknowledgments", "bid_id", bidIds);
  await deleteWhereEq("bid_dismissals", "contractor_id", userId);
  await deleteWhereIn("bid_dismissals", "bid_id", bidIds);
  await deleteWhereIn("bid_dismissals", "project_id", projectIds);
  await deleteWhereEq("project_awards", "awarded_contractor_id", userId);
  await deleteWhereEq("project_awards", "contractor_id", userId);
  await deleteWhereIn("project_awards", "project_id", projectIds);
  await deleteWhereIn("project_awards", "bid_id", bidIds);
  await deleteWhereEq("rfis", "contractor_id", userId);
  await deleteWhereIn("rfis", "project_id", projectIds);
  await deleteWhereEq("inspector_rfis", "contractor_id", userId);
  await deleteWhereEq("inspector_rfis", "inspector_id", userId);
  await deleteWhereIn("inspector_rfis", "project_id", projectIds);
  await deleteWhereEq("project_inspector_assignments", "inspector_id", userId);
  await deleteWhereEq("project_inspector_assignments", "client_id", userId);
  await deleteWhereIn("project_inspector_assignments", "project_id", projectIds);
  await deleteWhereEq("inspector_upgrade_disputes", "client_id", userId);
  await deleteWhereEq("inspector_upgrade_disputes", "original_inspector_id", userId);
  await deleteWhereIn("inspector_upgrade_disputes", "project_id", projectIds);
  await deleteWhereEq("inspector_flags", "inspector_id", userId);
  await deleteWhereEq("project_messages", "sender_id", userId);
  await deleteWhereIn("project_messages", "project_id", projectIds);
  await deleteWhereEq("project_message_reads", "user_id", userId);
  await deleteWhereIn("project_message_reads", "project_id", projectIds);
  await deleteWhereIn("project_attachments", "project_id", projectIds);
  await deleteWhereIn("project_revisions", "project_id", projectIds);
  await deleteWhereEq("emergency_request_log", "client_id", userId);
  await deleteWhereIn("emergency_request_log", "project_id", projectIds);
  await deleteWhereEq("client_credits", "client_id", userId);
  await deleteWhereEq("support_requests", "created_by", userId);
  await deleteWhereEq("disclaimer_acknowledgments", "user_id", userId);
  await deleteWhereEq("problem_reports", "user_id", userId);
  await deleteWhereEq("contractor_credentials", "contractor_id", userId);
  await deleteWhereEq("contractor_portfolio_photos", "contractor_id", userId);
  await deleteWhereEq("contractor_verification_log", "contractor_id", userId);
  await deleteWhereEq("contractor_subscriptions", "contractor_id", userId);
  await deleteWhereEq("subscription_disputes", "contractor_id", userId);
  await deleteWhereEq("contractor_settings", "contractor_id", userId);
  await deleteWhereEq("contractor_profiles", "contractor_id", userId);

  // Core rows — these must succeed for the deletion to be considered done.
  const { error: bidsErr } = await supabaseAdmin.from("bids").delete().eq("contractor_id", userId);
  if (bidsErr) throw new Error(`Failed to delete bids for ${userId}: ${JSON.stringify(bidsErr)}`);

  const { error: projectsErr } = await supabaseAdmin.from("projects").delete().eq("client_id", userId);
  if (projectsErr) throw new Error(`Failed to delete projects for ${userId}: ${JSON.stringify(projectsErr)}`);

  const { error: profileDelErr } = await supabaseAdmin.from("profiles").delete().eq("id", userId);
  if (profileDelErr) throw new Error(`Failed to delete profile for ${userId}: ${JSON.stringify(profileDelErr)}`);

  const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (authErr) throw new Error(`Failed to delete auth account for ${userId}: ${JSON.stringify(authErr)}`);
}

export async function deleteUserAccounts(userIds: string[]) {
  await requireRole(["ADMIN"]);

  if (userIds.length === 0) throw new Error("No accounts selected.");

  const errors: string[] = [];
  for (const userId of userIds) {
    try {
      await deleteOneAccount(userId);
    } catch (e) {
      errors.push(e instanceof Error ? e.message : String(e));
    }
  }

  revalidatePath("/dashboard/admin/users");

  if (errors.length > 0) {
    throw new Error(`${userIds.length - errors.length}/${userIds.length} accounts deleted. Failures: ${errors.join(" | ")}`);
  }
}
