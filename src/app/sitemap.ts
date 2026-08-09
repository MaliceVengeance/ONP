import type { MetadataRoute } from "next";
import { PRODUCTION_SITE_URL } from "@/lib/siteUrl";

// Static, hand-curated list of public/indexable routes. Deliberately does not
// include dynamic per-contractor profile pages (/contractors/[id]) yet — that
// would require querying live contractor data at build/request time, which is
// a separate, larger change; see the SEO foundation report for why it's
// intentionally deferred rather than fabricated here.
const STATIC_ROUTES: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  { path: "/", changeFrequency: "weekly", priority: 1.0 },
  { path: "/why-onp", changeFrequency: "monthly", priority: 0.8 },
  { path: "/for-contractors", changeFrequency: "monthly", priority: 0.8 },
  { path: "/for-property-managers", changeFrequency: "monthly", priority: 0.8 },
  { path: "/about", changeFrequency: "monthly", priority: 0.6 },
  { path: "/trust", changeFrequency: "monthly", priority: 0.6 },
  { path: "/contractors", changeFrequency: "daily", priority: 0.7 },
  { path: "/help/bids", changeFrequency: "monthly", priority: 0.5 },
  { path: "/help/contractor-bids", changeFrequency: "monthly", priority: 0.5 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms/legal", changeFrequency: "yearly", priority: 0.3 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/privacy/legal", changeFrequency: "yearly", priority: 0.3 },
  { path: "/legal", changeFrequency: "yearly", priority: 0.2 },
  { path: "/bid-disclaimer", changeFrequency: "yearly", priority: 0.2 },
  { path: "/contractor-bid-disclaimer", changeFrequency: "yearly", priority: 0.2 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return STATIC_ROUTES.map((route) => ({
    url: `${PRODUCTION_SITE_URL}${route.path === "/" ? "" : route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
