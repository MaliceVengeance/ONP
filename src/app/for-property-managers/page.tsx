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
  fontSize: "1.8rem",
  color: "var(--camo-charcoal)",
  textTransform: "uppercase",
  margin: "8px 0 24px",
};

const btnPrimary: React.CSSProperties = {
  fontFamily: "'Barlow Condensed', sans-serif",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.03em",
  padding: "15px 28px",
  borderRadius: "3px",
  textDecoration: "none",
  fontSize: "1rem",
  border: "2px solid transparent",
  background: "var(--camo-accent)",
  color: "var(--camo-ink)",
  display: "inline-block",
};

const painPoints = [
  { icon: "📁", title: "A paper trail across every vendor", body: "Every project, bid, and communication is documented and timestamped — not scattered across texts and phone calls with a dozen different contractors." },
  { icon: "🛡", title: "Licensed & insured, verified up front", body: "Every contractor in the directory is checked before they can ever bid — you're not the one chasing down a COI after the fact." },
  { icon: "⚖", title: "Competitive bids, no relationship favoritism", body: "Sealed bidding means the same vendor you've used ten times doesn't get a quiet edge over a better bid on property #11." },
];

export default function ForPropertyManagersPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--camo-paper)", color: "var(--camo-ink)", fontFamily: "'Barlow', sans-serif" }}>
      <MarketingHeader />
      <BetaDisclaimerBanner />

      {/* Hero */}
      <section style={{ padding: "70px 32px 60px", background: "var(--camo-charcoal)", color: "var(--camo-concrete)" }}>
        <div style={{ maxWidth: "780px", margin: "0 auto" }}>
          <span style={{ ...eyebrow, color: "var(--camo-steel)", display: "block", marginBottom: "12px" }}>FOR PROPERTY MANAGERS &amp; DEVELOPERS</span>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: "clamp(2.2rem, 5vw, 3.4rem)", lineHeight: 1.05, margin: "0 0 20px", textTransform: "uppercase", color: "var(--camo-concrete)" }}>
            Run competitive bids across every property, not just this one.
          </h1>
          <p style={{ fontSize: "1.05rem", color: "var(--camo-steel)", lineHeight: 1.7, maxWidth: "620px", marginBottom: "32px" }}>
            One account, as many projects and properties as you need to bid out. Documented bid history for audit and compliance purposes, and an RFI system that keeps every contractor conversation on the record — not buried in someone&apos;s inbox.
          </p>
          <Link href="/signup" style={btnPrimary}>Create a Client Account</Link>
        </div>
      </section>

      {/* Pain points */}
      <section style={{ padding: "60px 32px", background: "var(--camo-concrete)" }}>
        <div style={{ maxWidth: "1040px", margin: "0 auto" }}>
          <span style={{ ...eyebrow, textAlign: "center", display: "block" }}>BUILT FOR PORTFOLIOS, NOT JUST ONE HOUSE</span>
          <h2 style={{ ...sectionHeading, textAlign: "center" }}>What Repeat Clients Actually Need</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "18px" }}>
            {painPoints.map((p) => (
              <div key={p.title} style={{ background: "var(--camo-paper)", border: "1px solid #d9dbdb", borderRadius: "6px", padding: "24px 20px" }}>
                <div style={{ fontSize: "1.4rem", marginBottom: "14px" }}>{p.icon}</div>
                <h3 style={{ fontSize: "1rem", color: "var(--camo-charcoal)", marginBottom: "8px" }}>{p.title}</h3>
                <p style={{ fontSize: "0.85rem", color: "var(--camo-gunmetal)", lineHeight: 1.6, margin: 0 }}>{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Inspector / takeoff system */}
      <section style={{ padding: "60px 32px", background: "var(--camo-paper)" }}>
        <div style={{ maxWidth: "820px", margin: "0 auto" }}>
          <span style={{ ...eyebrow, display: "block" }}>SCOPE BEFORE YOU COMMIT BUDGET</span>
          <h2 style={sectionHeading}>Independent Inspections &amp; Takeoffs</h2>
          <p style={{ fontSize: "0.92rem", color: "var(--camo-gunmetal)", lineHeight: 1.8 }}>
            Before you commit budget across a portfolio, an ONP inspector can visit the site and perform a pre-bid takeoff — giving contractors accurate scope information and giving you a more realistic set of bids to compare, instead of guessing at conditions from photos alone.
          </p>
        </div>
      </section>

      {/* Account note — honest about what's actually built today */}
      <section style={{ padding: "60px 32px", background: "var(--camo-charcoal)" }}>
        <div style={{ maxWidth: "700px", margin: "0 auto", textAlign: "center" }}>
          <span style={{ ...eyebrow, color: "var(--camo-steel)", display: "block", marginBottom: "10px" }}>HOW ACCOUNTS WORK TODAY</span>
          <p style={{ fontSize: "0.92rem", color: "var(--camo-concrete)", lineHeight: 1.8 }}>
            One login, unlimited projects — post and bid out as many properties as you need from a single account. There&apos;s no separate multi-seat or team-role tier yet; if that&apos;s a requirement for your organization, <a href="mailto:support@ournextproject.us" style={{ color: "var(--camo-accent)" }}>tell us</a> and we&apos;ll factor it into the roadmap.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "70px 32px", background: "var(--camo-paper)", textAlign: "center" }}>
        <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: "2rem", color: "var(--camo-charcoal)", marginBottom: "12px", textTransform: "uppercase" }}>
          Ready to bid out your next project?
        </h2>
        <p style={{ fontSize: "1rem", color: "var(--camo-gunmetal)", marginBottom: "28px" }}>
          Post a project, invite competitive bids, and keep the whole record documented from day one.
        </p>
        <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/signup" style={btnPrimary}>Create a Client Account</Link>
          <Link href="/why-onp" style={{ ...btnPrimary, background: "transparent", color: "var(--camo-charcoal)", borderColor: "var(--camo-gunmetal)" }}>See How It Works</Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
