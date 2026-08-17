"use client";

/**
 * Thin wrapper around gtag(), mirroring the same "no-op if gtag isn't
 * loaded" guard already used by GoogleAnalytics.tsx's page-view tracker.
 * Centralizes new custom event names in one place instead of scattering
 * raw gtag() calls across components.
 *
 * Never pass email, ZIP, contractor trade, or any other directly
 * identifying/location value as a param — GA4 params here are limited to
 * low-cardinality category labels (role, video progress percent, failure
 * reason). See src/app/dashboard/admin/early-access/page.tsx for the
 * authoritative, precise demand data.
 */
export function trackEvent(name: string, params?: Record<string, string | number | boolean>): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", name, params ?? {});
}
