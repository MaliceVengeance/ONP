import type { MetadataRoute } from "next";
import { PRODUCTION_SITE_URL } from "@/lib/siteUrl";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/dashboard/*",
        "/api",
        "/api/*",
        "/login",
        "/signup",
        "/signup/*",
        "/forgot-password",
        "/reset-password",
      ],
    },
    sitemap: `${PRODUCTION_SITE_URL}/sitemap.xml`,
  };
}
