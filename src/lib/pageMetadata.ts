import type { Metadata } from "next";

/**
 * Builds a page's full Metadata object (title, description, canonical,
 * text-only Open Graph, Twitter card) from one shared shape, so all 16
 * public pages stay consistent instead of hand-duplicating the same
 * og:/twitter: boilerplate per file. `path` is passed straight through to
 * `alternates.canonical` and `openGraph.url` as a relative URL — Next.js
 * resolves both against the root layout's `metadataBase` (always the
 * production origin), so this never needs to know or care what origin is
 * actually serving the request.
 */
export function buildPageMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description?: string;
  path: string;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}
