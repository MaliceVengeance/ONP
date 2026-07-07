"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";

function clean(v: FormDataEntryValue | null) {
  return String(v ?? "").trim();
}

export async function createCoupon(formData: FormData) {
  const { user } = await requireRole(["ADMIN"]);

  const code        = clean(formData.get("code")).toUpperCase().replace(/\s+/g, "");
  const monthsFree  = parseInt(clean(formData.get("months_free")));
  const description = clean(formData.get("description")) || `${monthsFree} month(s) free`;

  if (!code) throw new Error("Coupon code is required.");
  if (!/^[A-Z0-9_-]{3,30}$/.test(code))
    throw new Error("Code must be 3–30 characters: letters, numbers, hyphens, underscores only.");
  if (!Number.isFinite(monthsFree) || monthsFree < 1 || monthsFree > 24)
    throw new Error("Months free must be between 1 and 24.");

  // Check for duplicate code in our DB
  const { data: existing } = await supabaseAdmin
    .from("coupon_codes")
    .select("id")
    .eq("code", code)
    .maybeSingle();

  if (existing) throw new Error(`Code "${code}" already exists.`);

  // Create the coupon in Stripe (100% off, repeating for N months)
  const stripeCoupon = await stripe.coupons.create({
    percent_off: 100,
    duration: "repeating",
    duration_in_months: monthsFree,
    name: description,
    metadata: { onp_code: code, created_by: user.id },
  });

  // Save to our DB
  const { error } = await supabaseAdmin.from("coupon_codes").insert({
    code,
    stripe_coupon_id: stripeCoupon.id,
    months_free: monthsFree,
    description,
    created_by: user.id,
  });

  if (error) {
    // Roll back the Stripe coupon so they stay in sync
    await stripe.coupons.del(stripeCoupon.id).catch(() => {});
    throw new Error(`DB insert failed: ${error.message}`);
  }

  revalidatePath("/dashboard/admin/coupons");
}

export async function deactivateCoupon(couponId: string) {
  await requireRole(["ADMIN"]);

  const { error } = await supabaseAdmin
    .from("coupon_codes")
    .update({ is_active: false })
    .eq("id", couponId);

  if (error) throw new Error(`Failed to deactivate coupon: ${error.message}`);

  revalidatePath("/dashboard/admin/coupons");
}

export async function reactivateCoupon(couponId: string) {
  await requireRole(["ADMIN"]);

  const { error } = await supabaseAdmin
    .from("coupon_codes")
    .update({ is_active: true })
    .eq("id", couponId);

  if (error) throw new Error(`Failed to reactivate coupon: ${error.message}`);

  revalidatePath("/dashboard/admin/coupons");
}
