import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");
  const nextPath = String(form.get("next") ?? "/dashboard");

  if (!email || !password) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent("Missing email or password")}`, req.url),
      { status: 303 }
    );
  }

  // Prepare the redirect response FIRST (this is what we'll attach cookies to)
  const redirectUrl = new URL(nextPath, req.url);
  const res = NextResponse.redirect(redirectUrl, { status: 303 });

  // Create Supabase server client wired to request cookies + response cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, req.url),
      { status: 303 }
    );
  }

  // Return the redirect response that now includes auth cookies
  return res;
}
