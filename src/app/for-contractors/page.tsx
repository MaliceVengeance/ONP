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
  { icon: "💸", title: "Pay-per-lead, whether you win or not", body: "Angi, Thumbtack, and HomeAdvisor charge you to compete — you pay just to get a shot, win or lose." },
  { icon: "⚠", title: "Unlicensed competition undercuts your bid", body: "You carry the license and insurance costs. Unverified competitors don't, and still get to bid against you." },
  { icon: "📋", title: "No paper trail when disputes happen", body: "Verbal scope changes and handshake agreements leave you exposed when a client disputes what was promised." },
];

const comparisonRows = [
  { old: "Pay to compete — per lead, every time, win or lose", onp: "One flat subscription. No per-lead fees, ever." },
  { old: "Broadcast leads to unknown numbers of competitors", onp: "Structured blind bidding — you know the rules, not who else is bidding, and neither does anyone else" },
  { old: "Unverified contractors bid alongside you", onp: "Every contractor in the directory is license + insurance verified before they can bid" },
  { old: "No documentation if a client disputes scope", onp: "RFIs and files — everything lives in one documented record" },
];

const disqualifiers = [
  "You want guaranteed leads without any competition",
  "You're not licensed and insured",
  "You prefer negotiating off-platform, verbally",
  "Your business model depends on high lead volume, not close rate",
  "You're not comfortable with a structured digital bidding process",
  "You already have a full pipeline and aren't looking for more work",
];

export default function ForContractorsPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--camo-paper)", color: "var(--camo-ink)", fontFamily: "'Barlow', sans-serif" }}>
      <MarketingHeader />
      <BetaDisclaimerBanner />

      {/* Hero */}
      <section style={{ padding: "70px 32px 60px", background: "var(--camo-charcoal)", color: "var(--camo-concrete)" }}>
        <div style={{ maxWidth: "780px", margin: "0 auto" }}>
          <span style={{ ...eyebrow, color: "var(--camo-steel)", display: "block", marginBottom: "12px" }}>FOR CONTRACTORS</span>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: "clamp(2.2rem, 5vw, 3.4rem)", lineHeight: 1.05, margin: "0 0 20px", textTransform: "uppercase", color: "var(--camo-concrete)" }}>
            Stop paying to compete blind against strangers.
          </h1>
          <p style={{ fontSize: "1.05rem", color: "var(--camo-steel)", lineHeight: 1.7, maxWidth: "620px", marginBottom: "32px" }}>
            You already know the game: pay per lead, race unlicensed competitors to the bottom, and hope the client remembers what was verbally agreed to when something goes wrong. <strong>ONP</strong> fixes the parts of the job that have nothing to do with your craftsmanship.
          </p>
          <Link href="/signup/contractor" style={btnPrimary}>Create Contractor Account</Link>
        </div>
      </section>

      {/* Pain points */}
      <section style={{ padding: "60px 32px", background: "var(--camo-concrete)" }}>
        <div style={{ maxWidth: "1040px", margin: "0 auto" }}>
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

      {/* Honest comparison */}
      <section style={{ padding: "60px 32px", background: "var(--camo-paper)" }}>
        <div style={{ maxWidth: "820px", margin: "0 auto" }}>
          <span style={{ ...eyebrow, display: "block" }}>HONEST COMPARISON</span>
          <h2 style={sectionHeading}>ONP vs. Pay-Per-Lead Platforms</h2>
          <p style={{ fontSize: "0.9rem", color: "var(--camo-gunmetal)", lineHeight: 1.7, marginBottom: "28px", maxWidth: "620px" }}>
            To be direct: you already bid blind on <strong>ONP</strong>, same as anywhere else. The difference isn&apos;t lead exclusivity — it&apos;s that you&apos;re not paying per lead to find that out, and every contractor across the table is actually verified.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {comparisonRows.map((row, idx) => (
              <div key={idx} className="mob-grid-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", background: "var(--camo-concrete)", border: "1px solid #d9dbdb", borderRadius: "6px", padding: "14px 16px" }}>
                  <span style={{ color: "#B45050", fontSize: "1rem", flexShrink: 0 }}>✗</span>
                  <span style={{ fontSize: "0.85rem", color: "var(--camo-gunmetal)", lineHeight: 1.5 }}>{row.old}</span>
                </div>
                <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", background: "var(--camo-concrete)", border: "1px solid var(--camo-good)", borderRadius: "6px", padding: "14px 16px" }}>
                  <span style={{ color: "var(--camo-good)", fontSize: "1rem", flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: "0.85rem", color: "var(--camo-charcoal)", lineHeight: 1.5, fontWeight: 500 }}>{row.onp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Honest disqualifier */}
      <section style={{ padding: "60px 32px", background: "var(--camo-charcoal)" }}>
        <div style={{ maxWidth: "700px", margin: "0 auto" }}>
          <span style={{ ...eyebrow, color: "var(--camo-steel)", display: "block" }}>BEFORE YOU SIGN UP</span>
          <h2 style={{ ...sectionHeading, color: "var(--camo-concrete)" }}>ONP May Not Be For You If:</h2>
          <p style={{ fontSize: "0.88rem", color: "var(--camo-steel)", lineHeight: 1.7, marginBottom: "22px" }}>
            We&apos;d rather tell you now than waste your subscription. <strong>ONP</strong> probably isn&apos;t the right fit if:
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {disqualifiers.map((d) => (
              <div key={d} style={{ display: "flex", gap: "12px", alignItems: "flex-start", background: "var(--camo-gunmetal)", borderRadius: "6px", padding: "12px 16px" }}>
                <span style={{ color: "var(--camo-steel)", fontSize: "0.95rem", flexShrink: 0 }}>○</span>
                <span style={{ fontSize: "0.85rem", color: "var(--camo-concrete)", lineHeight: 1.5 }}>{d}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Veteran callout */}
      <section style={{ padding: "60px 32px", background: "var(--camo-paper)" }}>
        <div style={{ maxWidth: "780px", margin: "0 auto", display: "flex", gap: "20px", alignItems: "flex-start", background: "var(--camo-concrete)", border: "2px solid var(--camo-accent)", borderRadius: "10px", padding: "28px" }}>
          <div style={{ fontSize: "32px", flexShrink: 0, color: "var(--camo-accent)" }}>★</div>
          <div>
            <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: "1.3rem", color: "var(--camo-charcoal)", margin: "0 0 8px", textTransform: "uppercase" }}>
              Veteran-Owned? You get more.
            </h3>
            <p style={{ fontSize: "0.9rem", color: "var(--camo-gunmetal)", lineHeight: 1.7, margin: 0 }}>
              Verified veteran-owned businesses get 25% off the standard subscription, a Veteran Owned badge on every bid, and featured placement in the contractor directory.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "70px 32px", background: "var(--camo-charcoal)", textAlign: "center" }}>
        <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: "2rem", color: "var(--camo-concrete)", marginBottom: "12px", textTransform: "uppercase" }}>
          Ready to bid on your terms?
        </h2>
        <p style={{ fontSize: "1rem", color: "var(--camo-steel)", marginBottom: "28px" }}>
          One flat subscription. No per-lead fees, no long-term contract. Pricing shown when you sign up.
        </p>
        <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/signup/contractor" style={btnPrimary}>Create Contractor Account</Link>
          <Link href="/why-onp" style={{ ...btnPrimary, background: "transparent", color: "var(--camo-concrete)", borderColor: "var(--camo-steel)" }}>See How It Works</Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
