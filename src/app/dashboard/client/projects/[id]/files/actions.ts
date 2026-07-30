"use server";

import sharp from "sharp";
import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

const MAX_FILE_BYTES = 10 * 1024 * 1024;

export async function uploadProjectFile(projectId: string, formData: FormData) {
  const { supabase } = await requireRole(["CLIENT", "ADMIN"]);

  // RLS-bound select — confirms this user can actually see this project
  // (client owner or admin) before we touch storage with the service role.
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .maybeSingle();
  if (!project) throw new Error("Project not found or you don't have access to it.");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Choose a file to upload.");
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error(`${file.name} is too large. Maximum file size is 10MB.`);
  }

  const inputBuffer = Buffer.from(await file.arrayBuffer());
  const isImage = file.type.startsWith("image/");

  // Strip EXIF/GPS metadata from every uploaded photo, regardless of who's
  // viewing it later — phone photos routinely embed exact GPS coordinates
  // that would otherwise leak a project's precise address. .rotate() with
  // no args auto-orients from the EXIF tag before it's discarded, so visual
  // orientation is preserved even though the metadata itself is gone.
  const outputBuffer = isImage
    ? await sharp(inputBuffer).rotate().toBuffer()
    : inputBuffer;

  const path = `${projectId}/${Date.now()}_${file.name}`;
  const { error: uploadErr } = await supabaseAdmin.storage
    .from("project-files")
    .upload(path, outputBuffer, { contentType: file.type });
  if (uploadErr) throw new Error(`storage.upload(project_file) failed: ${JSON.stringify(uploadErr)}`);

  revalidatePath(`/dashboard/client/projects/${projectId}/files`);
}
