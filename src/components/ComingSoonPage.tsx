import Link from "next/link";
import { MarketingFooter } from "@/components/MarketingChrome";
import EarlyAccessForm from "@/components/EarlyAccessForm";
import VideoSection from "@/components/VideoSection";

const eyebrow: React.CSSProperties = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: "0.72rem",
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: "var(--camo-accent)",
};

// Truthful, drawn from the existing /why-onp positioning — no claims about
// guaranteed fairness, contractor quality, verification outcomes, or savings.
const valueProps = [
  "Post a project and get sealed bids — contractors never see competitor pricing.",
  "Every question, answer, and bid lives in one documented record.",
  "Only license- and insurance-checked contractors appear in the directory.",
];

/**
 * Temporary public-launch landing page, rendered at "/" while
 * LAUNCH_GATE_ENABLED is true (see src/app/page.tsx and
 * src/middleware.ts). No video-hosting dependency yet — see
 * VideoSection.tsx.
 */
export default function ComingSoonPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--camo-paper)", color: "var(--camo-ink)", fontFamily: "'Barlow', sans-serif" }}>
      {/* Minimal header — no marketing nav during the gate; Sign In preserved. */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 32px", background: "var(--camo-charcoal)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ color: "var(--camo-concrete)", fontSize: "1.1rem" }} aria-hidden="true">★</span>
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: "1.3rem", color: "var(--camo-concrete)", textTransform: "uppercase" }}>
            ONP
          </span>
        </div>
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
            textDecoration: "none",
          }}
        >
          Sign In
        </Link>
      </nav>

      {/* Hero */}
      <section style={{ padding: "60px 24px 40px", textAlign: "center" }}>
        <span style={eyebrow}>PUBLIC LAUNCH COMING SOON</span>
        <h1
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 800,
            fontSize: "clamp(2.2rem, 5vw, 3.4rem)",
            color: "var(--camo-charcoal)",
            margin: "12px 0 20px",
            textTransform: "uppercase",
          }}
        >
          Our Next Project
        </h1>
        <p style={{ fontSize: "1.05rem", color: "var(--camo-gunmetal)", maxWidth: "640px", margin: "0 auto", lineHeight: 1.7 }}>
          We&apos;re putting the finishing touches on Our Next Project before opening the platform publicly. Watch the
          short video to see how ONP works, then join the Early Access List to tell us where you&apos;d like to see
          ONP launch.
        </p>
      </section>

      {/* Value proposition */}
      <section style={{ padding: "0 24px 50px" }}>
        <div style={{ maxWidth: "720px", margin: "0 auto", display: "grid", gap: "12px" }}>
          {valueProps.map((v) => (
            <div
              key={v}
              style={{
                display: "flex",
                gap: "10px",
                alignItems: "flex-start",
                background: "var(--camo-concrete)",
                border: "1px solid #d9dbdb",
                borderRadius: "8px",
                padding: "14px 18px",
              }}
            >
              <span style={{ color: "var(--camo-good)", fontWeight: 800 }} aria-hidden="true">✓</span>
              <span style={{ fontSize: "0.9rem", color: "var(--camo-charcoal)", lineHeight: 1.6 }}>{v}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Video (empty-slot placeholder until a hosted asset exists) */}
      <section style={{ padding: "0 24px 60px" }}>
        <VideoSection />
      </section>

      {/* Early Access form */}
      <section style={{ padding: "0 24px 70px" }}>
        <div style={{ maxWidth: "480px", margin: "0 auto", background: "var(--camo-concrete)", border: "1px solid #d9dbdb", borderRadius: "12px", padding: "32px" }}>
          <h2
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 800,
              fontSize: "1.5rem",
              color: "var(--camo-charcoal)",
              textTransform: "uppercase",
              textAlign: "center",
              marginBottom: "6px",
            }}
          >
            Join the ONP Early Access List
          </h2>
          <p style={{ fontSize: "0.85rem", color: "var(--camo-gunmetal)", textAlign: "center", marginBottom: "22px" }}>
            Tell us where ONP should launch next.
          </p>
          <EarlyAccessForm />
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
