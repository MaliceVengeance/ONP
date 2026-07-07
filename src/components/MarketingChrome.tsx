import Link from "next/link";

const navLinkStyle: React.CSSProperties = {
  color: "var(--camo-steel)",
  textDecoration: "none",
  fontSize: "0.85rem",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

export function MarketingHeader({ active }: { active?: "why-onp" | "contractors" | "about" }) {
  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "18px 32px",
        background: "var(--camo-charcoal)",
        color: "var(--camo-concrete)",
        flexWrap: "wrap",
        gap: "16px",
      }}
    >
      <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ color: "var(--camo-concrete)", fontSize: "1.1rem" }}>★</span>
        <span
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 800,
            fontSize: "1.3rem",
            color: "var(--camo-concrete)",
            textTransform: "uppercase",
            letterSpacing: "0.01em",
          }}
        >
          ONP
        </span>
      </Link>
      <div style={{ display: "flex", gap: "26px", flexWrap: "wrap", alignItems: "center" }}>
        <Link href="/why-onp" style={{ ...navLinkStyle, color: active === "why-onp" ? "var(--camo-accent)" : navLinkStyle.color }}>
          Why ONP
        </Link>
        <Link href="/contractors" style={{ ...navLinkStyle, color: active === "contractors" ? "var(--camo-accent)" : navLinkStyle.color }}>
          Contractors
        </Link>
        <Link href="/about" style={{ ...navLinkStyle, color: active === "about" ? "var(--camo-accent)" : navLinkStyle.color }}>
          About
        </Link>
        <Link
          href="/login"
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.03em",
            fontSize: "0.8rem",
            padding: "8px 16px",
            borderRadius: "3px",
            border: "1px solid var(--camo-gunmetal)",
            color: "var(--camo-concrete)",
          }}
        >
          Sign In
        </Link>
      </div>
    </nav>
  );
}

export function ServiceAreaBanner() {
  return (
    <div
      style={{
        background: "var(--camo-gunmetal)",
        color: "var(--camo-concrete)",
        padding: "12px 32px",
        fontSize: "0.85rem",
        textAlign: "center",
        letterSpacing: "0.02em",
      }}
    >
      📍 Now serving El Paso, TX and Las Cruces, NM. Expanding soon.
      <Link href="/login#waitlist" style={{ color: "var(--camo-accent)", textDecoration: "none", fontWeight: 600, marginLeft: "8px" }}>
        Join the waitlist →
      </Link>
    </div>
  );
}

export function BetaDisclaimerBanner() {
  return (
    <div
      style={{
        background: "var(--camo-gunmetal)",
        padding: "8px 32px",
        textAlign: "center",
        fontSize: "0.72rem",
        color: "var(--camo-concrete)",
        lineHeight: 1.5,
      }}
    >
      <span style={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--camo-accent)", marginRight: "6px" }}>
        ⚠ Experimental Beta —
      </span>
      This platform is currently in beta testing. All projects, bids, and contractor profiles are for testing purposes only and should not be considered legitimate business transactions.
    </div>
  );
}

export function MarketingFooter() {
  return (
    <footer
      style={{
        padding: "24px 32px",
        background: "var(--camo-ink)",
        color: "var(--camo-steel)",
        fontSize: "0.78rem",
        textAlign: "center",
      }}
    >
      © {new Date().getFullYear()} Our Next Project — Honoring American Veterans
    </footer>
  );
}
