import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { CAMO_COOKIE, pickRandomCamoVariant } from "@/lib/camo/constants";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const pathname = req.nextUrl.pathname;

  // Protect all dashboard routes
  if (pathname.startsWith("/dashboard")) {
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

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Camo session variant — picked once per session, stays consistent across
  // every camo-rendering marketing page. No maxAge => browser-session cookie,
  // so it re-rolls on the next visit after the browser fully closes.
  if (!req.cookies.get(CAMO_COOKIE)) {
    res.cookies.set(CAMO_COOKIE, pickRandomCamoVariant());
  }

  return res;
}

// Only run middleware on these routes
export const config = {
  matcher: ["/", "/why-onp", "/contractors", "/dashboard/:path*"],
};
