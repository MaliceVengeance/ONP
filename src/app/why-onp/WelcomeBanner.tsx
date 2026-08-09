"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

/** Post-subscription welcome banner, shown only when the URL has ?welcome=1. */
export function WelcomeBanner() {
  const searchParams = useSearchParams();
  const isWelcome = searchParams.get("welcome") === "1";

  if (!isWelcome) return null;

  return (
    <div style={{ background: "var(--camo-concrete)", border: "2px solid var(--camo-accent)", borderRadius: "10px", padding: "28px", marginBottom: "40px", textAlign: "center" }}>
      <div style={{ fontSize: "48px", marginBottom: "12px" }}>🎉</div>
      <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "32px", color: "var(--camo-charcoal)", marginBottom: "8px", textTransform: "uppercase" }}>
        Welcome to <strong>ONP</strong>!
      </h2>
      <p style={{ fontSize: "15px", color: "var(--camo-gunmetal)", marginBottom: "20px", lineHeight: 1.6 }}>
        Your subscription is active. You now have full access to the <strong>ONP</strong> bidding platform. Here&apos;s everything you need to know to get started.
      </p>
      <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
        <Link href="/dashboard/contractor/projects" style={{ background: "var(--camo-accent)", color: "var(--camo-ink)", padding: "12px 24px", borderRadius: "3px", textDecoration: "none", fontWeight: 700, fontSize: "14px" }}>
          Browse Open Projects →
        </Link>
        <Link href="/dashboard/contractor/profile" style={{ background: "transparent", color: "var(--camo-gunmetal)", border: "1px solid var(--camo-steel)", padding: "12px 24px", borderRadius: "3px", textDecoration: "none", fontSize: "14px" }}>
          Complete Your Profile
        </Link>
      </div>
    </div>
  );
}
