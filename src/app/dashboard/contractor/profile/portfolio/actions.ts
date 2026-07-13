"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";

const MAX_PHOTOS = 10;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function uploadPortfolioPhoto(formData: FormData) {
  const { user } = await requireRole(["CONTRACTOR", "ADMIN"]);

  const tosAccepted = formData.get("tos_accepted") === "on";
  if (!tosAccepted) {
    throw new Error("You must confirm you have the rights to share this photo before publishing it.");
  }

  const photo = formData.get("photo");
  if (!(photo instanceof File) || photo.size === 0) {
    throw new Error("Choose a photo to upload.");
  }
  if (photo.size > MAX_FILE_BYTES) {
    throw new Error("Photo is too large. Maximum file size is 5MB.");
  }
  if (!ALLOWED_TYPES.includes(photo.type)) {
    throw new Error("Photo must be a JPEG, PNG, or WEBP image.");
  }

  const { count, error: countErr } = await supabaseAdmin
    .from("contractor_portfolio_photos")
    .select("id", { count: "exact", head: true })
    .eq("contractor_id", user.id);
  if (countErr) throw new Error(`portfolio count failed: ${JSON.stringify(countErr)}`);
  if ((count ?? 0) >= MAX_PHOTOS) {
    throw new Error(`You've reached the ${MAX_PHOTOS}-photo limit. Delete one to add another.`);
  }

  const caption = String(formData.get("caption") ?? "").trim().slice(0, 200) || null;

  const path = `${user.id}/${Date.now()}_${photo.name}`;
  const { error: uploadErr } = await supabaseAdmin.storage
    .from("contractor-portfolio")
    .upload(path, photo, { contentType: photo.type });
  if (uploadErr) throw new Error(`storage.upload(portfolio_photo) failed: ${JSON.stringify(uploadErr)}`);

  const { error: insertErr } = await supabaseAdmin.from("contractor_portfolio_photos").insert({
    contractor_id: user.id,
    storage_path: path,
    caption,
    display_order: count ?? 0,
  });
  if (insertErr) throw new Error(`portfolio insert failed: ${JSON.stringify(insertErr)}`);

  redirect("/dashboard/contractor/profile/portfolio");
}

export async function deletePortfolioPhoto(photoId: string) {
  const { user } = await requireRole(["CONTRACTOR", "ADMIN"]);

  const { data: photo, error: fetchErr } = await supabaseAdmin
    .from("contractor_portfolio_photos")
    .select("id, contractor_id, storage_path")
    .eq("id", photoId)
    .single();
  if (fetchErr || !photo) throw new Error("Photo not found.");
  if (photo.contractor_id !== user.id) throw new Error("Not authorized to delete this photo.");

  await supabaseAdmin.storage.from("contractor-portfolio").remove([photo.storage_path]);

  const { error: deleteErr } = await supabaseAdmin
    .from("contractor_portfolio_photos")
    .delete()
    .eq("id", photoId);
  if (deleteErr) throw new Error(`portfolio delete failed: ${JSON.stringify(deleteErr)}`);

  redirect("/dashboard/contractor/profile/portfolio");
}
