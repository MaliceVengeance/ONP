// Environment-aware site base URL, used everywhere the app needs to build an
// absolute link back to itself (Stripe success/cancel URLs, Auth redirect
// URLs, links inside transactional emails). Falls back to the production
// apex domain — not www — when NEXT_PUBLIC_SITE_URL isn't set, so any
// environment (local dev, staging, a future Vercel preview) that sets its
// own NEXT_PUBLIC_SITE_URL automatically gets correct links with no code
// change, and any environment that doesn't set it degrades to production
// rather than silently breaking.

// Exported (not just an internal fallback) because SEO-facing metadata
// (canonical URLs, robots.txt, sitemap.xml) must always declare the real
// production origin, never wherever the app instance actually happens to be
// running — unlike SITE_URL below, which deliberately reflects the current
// environment for things like Stripe redirect URLs.
export const PRODUCTION_SITE_URL = "https://ournextproject.us";

function stripTrailingSlashes(url: string): string {
  return url.replace(/\/+$/, "");
}

export const SITE_URL = stripTrailingSlashes(process.env.NEXT_PUBLIC_SITE_URL || PRODUCTION_SITE_URL);

/**
 * Builds an absolute URL under SITE_URL. `path` may be passed with or
 * without a leading slash — either way the result has exactly one slash
 * between the base and the path, never a double slash.
 */
export function siteUrl(path: string = ""): string {
  const cleanPath = path.replace(/^\/+/, "");
  return cleanPath ? `${SITE_URL}/${cleanPath}` : SITE_URL;
}
