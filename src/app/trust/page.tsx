import Link from "next/link";
import { MarketingHeader, MarketingFooter, BetaDisclaimerBanner } from "@/components/MarketingChrome";

const eyebrow: React.CSSProperties = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: "0.72rem",
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: "var(--camo-gunmetal)",
};

const sectionHeading: React.CSSProperties = {
  fontFamily: "'Barlow Condensed', sans-serif",
  fontWeight: 800,
  fontSize: "1.6rem",
  color: "var(--camo-charcoal)",
  textTransform: "uppercase",
  margin: "8px 0 20px",
};

const protections = [
  { icon: "✓", label: "Verified contractors only", body: "Every contractor in the directory is license and insurance checked before they can ever bid." },
  { icon: "🔒", label: "Sealed bids, no favoritism", body: "Pricing stays hidden from everyone — including ONP — until the bidding window closes." },
  { icon: "📋", label: "Everything documented", body: "Bids, RFIs, and project communication are timestamped and kept on record from day one." },
  { icon: "$0", label: "Direct support, no cost", body: "Questions or concerns about a project go straight to ONP — reaching out never costs you anything." },
];

const transparencyItems = [
  "% of projects completed without a client concern",
  "Average time to respond to a client concern",
  "Number of verified contractors on the platform",
];

const faqs = [
  { q: "Does raising a concern affect my account?", a: "No. Reaching out about a project is a protected right for all ONP clients and will never result in any negative action on your account." },
  { q: "How do I reach ONP about a project?", a: "Contact us directly at support@ournextproject.us, or from your project dashboard once you're signed in. Include your project name and a clear description of the concern." },
  { q: "What information will ONP use to look into it?", a: "The full documented record for the project — bids, RFIs, and communication history — so nothing relies on memory or he-said-she-said." },
  { q: "Is there a deadline to raise a concern?", a: "No hard deadline, but the sooner you reach out, the more useful the documented record is likely to be." },
  { q: "How are contractors held accountable?", a: "ONP tracks contractor history on the platform. Contractors with a pattern of client concerns are reviewed and, if warranted, removed from the verified directory." },
];

export default function TrustPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--camo-paper)", color: "var(--camo-ink)", fontFamily: "'Barlow', sans-serif" }}>
      <MarketingHeader active="about" />
      <BetaDisclaimerBanner />

      <main style={{ maxWidth: "840px", margin: "0 auto", padding: "60px 24px" }}>

        {/* Hero */}
        <div style={{ marginBottom: "40px" }}>
          <span style={{ ...eyebrow, display: "block", marginBottom: "8px" }}>CLIENT PROTECTION</span>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: "clamp(2.2rem, 5vw, 3.2rem)", color: "var(--camo-charcoal)", margin: "0 0 16px", lineHeight: 1.05, textTransform: "uppercase" }}>
            Client Trust &amp; Protection
          </h1>
          <p style={{ fontSize: "1rem", color: "var(--camo-gunmetal)", lineHeight: 1.7, maxWidth: "620px" }}>
            <strong>ONP</strong> is built on the principle that every client interaction should be transparent, documented, and — when something feels wrong — easy to raise directly with us.
          </p>
        </div>

        {/* The core promise */}
        <div style={{ background: "var(--camo-charcoal)", borderRadius: "10px", padding: "26px 30px", marginBottom: "40px", borderLeft: "6px solid var(--camo-accent)" }}>
          <p style={{ fontSize: "1.05rem", color: "var(--camo-concrete)", lineHeight: 1.8, margin: 0, fontStyle: "italic" }}>
            &ldquo;Sealed bids, verified contractors, and a fully documented record of every project. If something doesn&apos;t feel right, you can reach us directly — at no cost, any time.&rdquo;
          </p>
        </div>

        {/* How we protect you */}
        <div style={{ marginBottom: "40px" }}>
          <h2 style={sectionHeading}>How We Protect You</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
            {protections.map((p) => (
              <div key={p.label} style={{ background: "var(--camo-concrete)", border: "1px solid #d9dbdb", borderRadius: "6px", padding: "20px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "4px", background: "var(--camo-charcoal)", color: "var(--camo-accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", marginBottom: "12px", fontFamily: "'IBM Plex Mono', monospace" }}>
                  {p.icon}
                </div>
                <h3 style={{ fontSize: "0.95rem", color: "var(--camo-charcoal)", marginBottom: "6px" }}>{p.label}</h3>
                <p style={{ fontSize: "0.82rem", color: "var(--camo-gunmetal)", margin: 0, lineHeight: 1.5 }}>{p.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Questions or concerns */}
        <div style={{ background: "var(--camo-concrete)", border: "1px solid #d9dbdb", borderRadius: "10px", padding: "26px 30px", marginBottom: "40px" }}>
          <h2 style={{ ...sectionHeading, margin: "0 0 14px" }}>Questions or Concerns About a Project?</h2>
          <p style={{ fontSize: "0.88rem", color: "var(--camo-gunmetal)", lineHeight: 1.8, marginBottom: "12px" }}>
            You&apos;re never on your own. Contact <strong>ONP</strong> directly — from your dashboard once signed in, or at{" "}
            <a href="mailto:support@ournextproject.us" style={{ color: "var(--camo-gunmetal)", fontWeight: 600 }}>support@ournextproject.us</a> — and we&apos;ll look into it using the project&apos;s full documented history.
          </p>
          <p style={{ fontSize: "0.88rem", color: "var(--camo-gunmetal)", lineHeight: 1.8 }}>
            Because every bid, RFI, and message is already on record, we&apos;re working from the same facts you are — not relying on memory or a verbal he-said-she-said.
          </p>
        </div>

        {/* Platform Transparency — placeholder for live stats */}
        <div style={{ background: "var(--camo-charcoal)", borderRadius: "10px", padding: "26px 30px", marginBottom: "40px" }}>
          <h2 style={{ ...sectionHeading, color: "var(--camo-concrete)", margin: "0 0 14px" }}>Platform Transparency</h2>
          <p style={{ fontSize: "0.88rem", color: "var(--camo-steel)", lineHeight: 1.8, marginBottom: "14px" }}>
            We are committed to publishing aggregate trust statistics once our data set is large enough to be meaningful. Once available, you will see:
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "18px" }}>
            {transparencyItems.map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <span style={{ color: "var(--camo-accent)", fontSize: "0.8rem", flexShrink: 0, marginTop: "4px" }}>○</span>
                <span style={{ fontSize: "0.85rem", color: "var(--camo-steel)", lineHeight: 1.6 }}>{item}</span>
              </div>
            ))}
          </div>
          <div style={{ background: "rgba(255,158,27,0.1)", border: "1px solid var(--camo-accent)", borderRadius: "6px", padding: "12px 16px", fontSize: "0.78rem", color: "var(--camo-concrete)", fontStyle: "italic" }}>
            Stats will appear here once the platform has accumulated sufficient history. Check back as we grow.
          </div>
        </div>

        {/* FAQ */}
        <div style={{ marginBottom: "48px" }}>
          <h2 style={sectionHeading}>Common Questions</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {faqs.map((faq) => (
              <div key={faq.q} style={{ background: "var(--camo-concrete)", border: "1px solid #d9dbdb", borderRadius: "8px", padding: "16px 20px" }}>
                <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--camo-charcoal)", marginBottom: "8px" }}>{faq.q}</div>
                <p style={{ fontSize: "0.85rem", color: "var(--camo-gunmetal)", lineHeight: 1.7, margin: 0 }}>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ background: "var(--camo-concrete)", border: "1px solid #d9dbdb", borderRadius: "10px", padding: "32px", textAlign: "center" }}>
          <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: "1.5rem", color: "var(--camo-charcoal)", marginBottom: "10px", textTransform: "uppercase" }}>
            Have a Concern About a Project?
          </h3>
          <p style={{ fontSize: "0.85rem", color: "var(--camo-gunmetal)", marginBottom: "20px", lineHeight: 1.6 }}>
            Sign in and reach out from your project dashboard, or email us directly. It costs nothing and takes minutes.
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/login" style={{ background: "var(--camo-accent)", color: "var(--camo-ink)", padding: "12px 28px", borderRadius: "3px", textDecoration: "none", fontWeight: 700, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.03em" }}>
              Sign In
            </Link>
            <Link href="/signup" style={{ background: "transparent", color: "var(--camo-charcoal)", border: "1px solid var(--camo-gunmetal)", padding: "12px 28px", borderRadius: "3px", textDecoration: "none", fontSize: "0.85rem" }}>
              Create an Account
            </Link>
          </div>
        </div>

      </main>

      <MarketingFooter />
    </div>
  );
}
