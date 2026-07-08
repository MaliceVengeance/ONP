import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  // Build the redirect URL from the incoming request's origin so this
  // works correctly on both localhost and production without an env var.
  const origin = req.nextUrl.origin;
  return NextResponse.redirect(new URL("/", origin), { status: 303 });
}
