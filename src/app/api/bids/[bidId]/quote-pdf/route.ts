import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Redirects to a freshly-generated signed URL on every request, rather than
// embedding one signed URL in the Bid Detail Page — avoids the link going
// stale if a client sits on the page before clicking download.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ bidId: string }> }
) {
  const { supabase } = await requireRole(["CLIENT", "ADMIN"]);
  const { bidId } = await params;

  const { data: bid } = await supabaseAdmin
    .from("bids")
    .select("id, project_id")
    .eq("id", bidId)
    .maybeSingle();

  if (!bid) {
    return NextResponse.json({ error: "Bid not found" }, { status: 404 });
  }

  // RLS-scoped fetch — resolves to null if this user doesn't have access to the project
  const { data: project } = await supabase
    .from("projects")
    .select("id, state, deadline_at, emergency_bid_mode, is_emergency")
    .eq("id", bid.project_id)
    .maybeSingle();

  if (!project) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const deadline = project.deadline_at ? new Date(project.deadline_at) : null;
  const deadlinePassed = !!(deadline && deadline.getTime() <= Date.now());
  const unlocked =
    deadlinePassed ||
    project.state !== "OPEN" ||
    !!(project as any).emergency_bid_mode ||
    !!(project as any).is_emergency;

  if (!unlocked) {
    return NextResponse.json({ error: "Bids are still sealed for this project" }, { status: 403 });
  }

  const { data: version } = await supabaseAdmin
    .from("bid_versions")
    .select("quote_pdf_path, quote_pdf_filename")
    .eq("bid_id", bidId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!version?.quote_pdf_path) {
    return NextResponse.json({ error: "No quote PDF attached to this bid" }, { status: 404 });
  }

  const { data: signed, error } = await supabaseAdmin.storage
    .from("bid-quotes")
    .createSignedUrl(version.quote_pdf_path, 60, {
      download: version.quote_pdf_filename ?? undefined,
    });

  if (error || !signed?.signedUrl) {
    return NextResponse.json({ error: "Could not generate download link" }, { status: 500 });
  }

  return NextResponse.redirect(signed.signedUrl);
}
