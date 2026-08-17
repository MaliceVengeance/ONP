import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Server-only — never NEXT_PUBLIC_. Controls the temporary public-launch
// gate. src/app/page.tsx reads the same var independently to decide what
// "/" itself renders; middleware has no reason to redirect "/" to "/".
const LAUNCH_GATE_ENABLED = process.env.LAUNCH_GATE_ENABLED === "true";

// Explicit allowlist, not a wildcard — a future new route stays public by
// default unless deliberately added here. Legal/support pages, auth pages,
// /dashboard/**, and /api/** are structurally excluded by simply never
// appearing in this list or the matcher below.
const LAUNCH_GATED_PATHS = [
  "/why-onp",
  "/for-contractors",
  "/for-property-managers",
  "/contractors",
  "/about",
  "/trust",
  "/help/bids",
  "/help/contractor-bids",
  "/signup",
];

function isLaunchGatedPath(pathname: string): boolean {
  return LAUNCH_GATED_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  if (LAUNCH_GATE_ENABLED && isLaunchGatedPath(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url, 307);
  }

  const res = NextResponse.next();

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

  return res;
}

// Only run middleware on these routes
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/why-onp",
    "/for-contractors",
    "/for-property-managers",
    "/contractors/:path*",
    "/about",
    "/trust",
    "/help/:path*",
    "/signup/:path*",
  ],
};
