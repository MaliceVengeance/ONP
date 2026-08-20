// Deterministic demo seed. Always resets first, then inserts everything
// fresh in FK-safe order, so repeated runs reproduce identical content.
// Contractor/client identity is kept stable across re-seeds by keying on
// the fixed emails in data.ts (find-or-create, never a blind insert), so
// every seed run reuses the same underlying auth accounts.
import { assertDemoEnvironment } from "./assertDemoEnvironment.ts";
import { buildDemoAdminClient, findUserIdByEmail } from "./supabaseAdminClient.ts";
import { resetDemoData } from "./reset.ts";
import {
  DEMO_CLIENT,
  DEMO_CONTRACTORS,
  DEMO_PROJECT,
  DEMO_PREPUBLISH_ANSWERS,
  DEMO_RFIS,
  DEMO_BIDS,
} from "./data.ts";
import type { SupabaseClient } from "@supabase/supabase-js";

const SEED_DEADLINE_DAYS_FROM_NOW = 7; // sealed by default right after seeding

async function createOrUpdateDemoUser(
  admin: SupabaseClient,
  opts: {
    email: string;
    password: string;
    signupRole: "CLIENT" | "CONTRACTOR";
    displayName: string;
    companyName: string | null;
    serviceAreaZip: string;
    phone?: string;
    addressLine1?: string;
    addressCity?: string;
    addressState?: string;
    addressZip?: string;
  }
): Promise<string> {
  // handle_new_user only copies role/display_name/company_name off
  // raw_user_meta_data on insert — service_area_zip/phone/address are never
  // read by the trigger, so both the existing-user and brand-new-user paths
  // explicitly write the full profile via an update after the account exists.
  const profileUpdate = {
    display_name: opts.displayName,
    company_name: opts.companyName,
    service_area_zip: opts.serviceAreaZip,
    ...(opts.phone !== undefined ? { phone: opts.phone } : {}),
    ...(opts.addressLine1 !== undefined ? { address_line1: opts.addressLine1 } : {}),
    ...(opts.addressCity !== undefined ? { address_city: opts.addressCity } : {}),
    ...(opts.addressState !== undefined ? { address_state: opts.addressState } : {}),
    ...(opts.addressZip !== undefined ? { address_zip: opts.addressZip } : {}),
  };

  const existingId = await findUserIdByEmail(admin, opts.email);
  if (existingId) {
    const { error } = await admin.auth.admin.updateUserById(existingId, {
      password: opts.password,
    });
    if (error) throw new Error(`updateUserById(${opts.email}) failed: ${error.message}`);
    // Keep profiles in sync too, in case data.ts changed between seed runs.
    await admin.from("profiles").update(profileUpdate).eq("id", existingId);
    return existingId;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: opts.email,
    password: opts.password,
    email_confirm: true,
    user_metadata: {
      signup_role: opts.signupRole,
      display_name: opts.displayName,
      company_name: opts.companyName,
      service_area_zip: opts.serviceAreaZip,
    },
  });
  if (error || !data.user) {
    throw new Error(`createUser(${opts.email}) failed: ${error?.message ?? "no user returned"}`);
  }
  // The trigger only sets display_name/company_name — fill in the rest now
  // that the profiles row exists.
  await admin.from("profiles").update(profileUpdate).eq("id", data.user.id);
  return data.user.id;
}

export async function seedDemoData(admin: SupabaseClient, accountPassword: string): Promise<void> {
  await resetDemoData(admin);

  // --- Client -----------------------------------------------------------
  const clientId = await createOrUpdateDemoUser(admin, {
    email: DEMO_CLIENT.email,
    password: accountPassword,
    signupRole: "CLIENT",
    displayName: DEMO_CLIENT.displayName,
    companyName: DEMO_CLIENT.companyName,
    serviceAreaZip: DEMO_CLIENT.serviceAreaZip,
    phone: DEMO_CLIENT.phone,
    addressLine1: DEMO_CLIENT.addressLine1,
    addressCity: DEMO_CLIENT.addressCity,
    addressState: DEMO_CLIENT.addressState,
    addressZip: DEMO_CLIENT.addressZip,
  });

  // --- Contractors --------------------------------------------------------
  const contractorIdByEmail = new Map<string, string>();
  for (const c of DEMO_CONTRACTORS) {
    const id = await createOrUpdateDemoUser(admin, {
      email: c.email,
      password: accountPassword,
      signupRole: "CONTRACTOR",
      displayName: c.displayName,
      companyName: c.businessName,
      serviceAreaZip: c.serviceAreaZip,
    });
    contractorIdByEmail.set(c.email, id);

    const { error: cpError } = await admin.from("contractor_profiles").upsert(
      {
        contractor_id: id,
        business_name: c.businessName,
        categories: c.categories,
        city: c.city,
        state: c.state,
        address_zip: c.serviceAreaZip,
        phone: c.phone,
        license_number: c.primaryLicenseNumber,
        license_expiry: c.primaryLicenseExpiry,
        directory_verified: c.directoryVerified,
        is_listed: true,
        bbb_url: c.bbbUrl,
        veteran_verified: c.veteranVerified,
        military_branch: c.militaryBranch,
        description: c.description,
      },
      { onConflict: "contractor_id" }
    );
    if (cpError) throw new Error(`contractor_profiles upsert(${c.email}) failed: ${cpError.message}`);

    // Detailed "Licenses, Registrations & Bonding" rows — only what's
    // explicitly earned per the canonical brief. No STATE_LICENSE row is
    // fabricated for contractors whose trade doesn't require a TX general
    // license (see report).
    for (const cred of c.credentials) {
      const { error: credError } = await admin.from("contractor_credentials").insert({
        contractor_id: id,
        credential_type: cred.credentialType,
        state: cred.state ?? null,
        city: cred.city ?? null,
        credential_number: cred.credentialNumber ?? null,
        issuing_authority: cred.issuingAuthority ?? null,
        trade: cred.trade ?? null,
        expiration_date: cred.expirationDate ?? null,
        verified: true,
      });
      if (credError) throw new Error(`contractor_credentials insert(${c.email}) failed: ${credError.message}`);
    }

    if (c.bonded) {
      const { error: bondError } = await admin.from("contractor_credentials").insert({
        contractor_id: id,
        credential_type: "BOND",
        state: c.state,
        verified: true,
      });
      if (bondError) throw new Error(`contractor_credentials (BOND) insert(${c.email}) failed: ${bondError.message}`);
    }

    const now = new Date();
    const oneYearOut = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    const { error: subError } = await admin.from("contractor_subscriptions").insert({
      contractor_id: id,
      status: "ACTIVE",
      plan_interval: "YEARLY",
      price_cents: 150000,
      current_period_start: now.toISOString(),
      current_period_end: oneYearOut.toISOString(),
      auto_renew: false,
      provider: "DEMO_FIXTURE",
    });
    if (subError) throw new Error(`contractor_subscriptions insert(${c.email}) failed: ${subError.message}`);
  }

  // --- Project --------------------------------------------------------
  // Inserted as DRAFT first: a real trigger (enforce_published_qa_lock,
  // migration 023) refuses to write contractor_id-IS-NULL rfis rows once a
  // project leaves DRAFT state ("Published project Q&A cannot be modified
  // after publication"). The pre-publish Q&A must be seeded before
  // publishing, exactly like the real client flow (answer questions, then
  // publish) — discovered empirically when the first attempt at inserting
  // directly as OPEN was rejected by this trigger.
  const now = new Date();
  const deadlineAt = new Date(now.getTime() + SEED_DEADLINE_DAYS_FROM_NOW * 24 * 60 * 60 * 1000);
  const targetStartDate = new Date(now.getTime() + DEMO_PROJECT.targetStartDaysFromNow * 24 * 60 * 60 * 1000);
  const { data: projectRow, error: projectError } = await admin
    .from("projects")
    .insert({
      client_id: clientId,
      state: "DRAFT",
      title: DEMO_PROJECT.title,
      category: DEMO_PROJECT.category,
      description: DEMO_PROJECT.description,
      city: DEMO_PROJECT.city,
      zip_code: DEMO_PROJECT.zipCode,
      min_open_days: DEMO_PROJECT.minOpenDays,
      max_open_days: DEMO_PROJECT.maxOpenDays,
      target_start_date: targetStartDate.toISOString().slice(0, 10),
    })
    .select("id, information_revision_number")
    .single();
  if (projectError || !projectRow) {
    throw new Error(`projects insert failed: ${projectError?.message ?? "no row returned"}`);
  }
  const projectId = projectRow.id as string;

  // --- Pre-publish client Q&A (contractor_id IS NULL) --------------------
  // Rendered on the client's own project page as "PROJECT QUESTIONS" — the
  // answers bidders saw when the project was published. Must be written
  // while the project is still DRAFT (see note above).
  for (const item of DEMO_PREPUBLISH_ANSWERS) {
    const { data: catalogRow, error: catalogError } = await admin
      .from("rfi_catalog")
      .select("id")
      .eq("code", item.catalogCode)
      .single();
    if (catalogError || !catalogRow) {
      throw new Error(
        `rfi_catalog lookup for code="${item.catalogCode}" failed: ${catalogError?.message ?? "not found"} ` +
          `(run migration 026 against this demo project if rfi_catalog is empty)`
      );
    }
    const { error: answerError } = await admin.from("rfis").insert({
      project_id: projectId,
      contractor_id: null,
      revision_number: 1,
      catalog_id: catalogRow.id,
      question: null,
      status: "ANSWERED",
      response: item.answer,
      responded_at: now.toISOString(),
      responded_by: clientId,
    });
    if (answerError) throw new Error(`pre-publish rfis insert failed: ${answerError.message}`);
  }

  // --- Publish -------------------------------------------------------------
  const { error: publishError } = await admin
    .from("projects")
    .update({
      state: "OPEN",
      published_at: now.toISOString(),
      deadline_at: deadlineAt.toISOString(),
    })
    .eq("id", projectId);
  if (publishError) throw new Error(`project publish failed: ${publishError.message}`);

  // --- Canonical contractor-initiated RFIs --------------------------------
  for (const rfi of DEMO_RFIS) {
    const { data: catalogRow, error: catalogError } = await admin
      .from("rfi_catalog")
      .select("id")
      .eq("code", rfi.catalogCode)
      .single();
    if (catalogError || !catalogRow) {
      throw new Error(
        `rfi_catalog lookup for code="${rfi.catalogCode}" failed: ${catalogError?.message ?? "not found"} ` +
          `(run migration 026 against this demo project if rfi_catalog is empty)`
      );
    }
    const contractorId = contractorIdByEmail.get(rfi.askedByContractorEmail);
    if (!contractorId) throw new Error(`unknown demo contractor email in DEMO_RFIS: ${rfi.askedByContractorEmail}`);

    const { error: rfiError } = await admin.from("rfis").insert({
      project_id: projectId,
      contractor_id: contractorId,
      revision_number: 1,
      catalog_id: catalogRow.id,
      question: rfi.question,
      status: "ANSWERED",
      response: rfi.answer,
      responded_at: now.toISOString(),
      responded_by: clientId,
    });
    if (rfiError) throw new Error(`rfis insert failed: ${rfiError.message}`);
  }

  // --- Bids ---------------------------------------------------------------
  for (const bid of DEMO_BIDS) {
    const contractorId = contractorIdByEmail.get(bid.contractorEmail);
    if (!contractorId) throw new Error(`unknown demo contractor email in DEMO_BIDS: ${bid.contractorEmail}`);

    const { data: bidRow, error: bidError } = await admin
      .from("bids")
      .insert({ project_id: projectId, contractor_id: contractorId })
      .select("id")
      .single();
    if (bidError || !bidRow) throw new Error(`bids insert failed: ${bidError?.message ?? "no row returned"}`);
    const bidId = bidRow.id as string;

    const { data: versionRow, error: versionError } = await admin
      .from("bid_versions")
      .insert({
        bid_id: bidId,
        version_number: 1,
        project_revision_number: projectRow.information_revision_number ?? 0,
        amount_cents: bid.amountCents,
        duration_days: bid.durationDays,
        start_window: bid.startWindow,
        inclusions: bid.inclusions,
        exclusions: bid.exclusions,
        notes: bid.notes,
        warranty_terms: bid.warrantyTerms,
        deposit_terms: bid.depositTerms,
        scope_disclaimers: bid.scopeDisclaimers,
        submitted_at: new Date().toISOString(),
        version_kind: "ORIGINAL",
        acknowledgment_affirmed: true,
      })
      .select("id")
      .single();
    if (versionError || !versionRow) {
      throw new Error(`bid_versions insert failed: ${versionError?.message ?? "no row returned"}`);
    }
    const versionId = versionRow.id as string;

    const { error: updateBidError } = await admin
      .from("bids")
      .update({ latest_version_id: versionId })
      .eq("id", bidId);
    if (updateBidError) throw new Error(`bids.latest_version_id update failed: ${updateBidError.message}`);

    for (const [i, item] of bid.lineItems.entries()) {
      const { error: lineItemError } = await admin.from("bid_line_items").insert({
        bid_version_id: versionId,
        description: item.description,
        quantity: item.quantity,
        unit_price_cents: item.unitPriceCents,
        sort_order: i,
      });
      if (lineItemError) throw new Error(`bid_line_items insert failed: ${lineItemError.message}`);
    }
  }
}

async function main() {
  const env = await assertDemoEnvironment();
  const accountPassword = process.env.DEMO_ACCOUNT_PASSWORD;
  if (!accountPassword) {
    throw new Error("DEMO_ACCOUNT_PASSWORD is not set — required to create/update demo accounts.");
  }
  const admin = buildDemoAdminClient(env);
  await seedDemoData(admin, accountPassword);
  console.log(`[demo:seed] done — demo project ref=${env.projectRef}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
