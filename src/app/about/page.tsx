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

const differentiators = [
  { icon: "🔒", title: "Blind, sealed bidding", body: "Contractors submit pricing without seeing competitors' numbers, reducing price manipulation and encouraging honest competition." },
  { icon: "📐", title: "Optional independent inspections & takeoffs", body: "Available as an add-on for any project — on-site pre-bid inspections give contractors accurate scope information and clients more realistic proposals." },
  { icon: "📝", title: "Structured RFIs, not side-channels", body: "Questions go through the system as documented Requests for Information — no off-platform negotiation, no confusion." },
];

const contractorPoints = [
  { icon: "🎯", body: "Not designed to race contractors to the bottom — skilled contractors deserve access to legitimate opportunities." },
  { icon: "⏱", body: "No wasted time chasing incomplete scopes, unclear expectations, or leads that were never serious." },
  { icon: "📋", body: "Standardized project info, structured bidding windows, and monitored communication let professionalism stand out." },
];

const missionPoints = [
  "Clients can make informed decisions with confidence",
  "Contractors compete on a level playing field",
  "Communication stays organized and professional",
  "Projects begin with clearer expectations for everyone involved",
];

export default function AboutPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--camo-paper)", color: "var(--camo-ink)", fontFamily: "'Barlow', sans-serif" }}>
      <MarketingHeader active="about" />
      <BetaDisclaimerBanner />

      <main style={{ maxWidth: "840px", margin: "0 auto", padding: "60px 24px" }}>

        {/* Hero */}
        <div style={{ marginBottom: "48px" }}>
          <span style={{ ...eyebrow, display: "block", marginBottom: "8px" }}>ABOUT ONP</span>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: "clamp(2.2rem, 5vw, 3.2rem)", color: "var(--camo-charcoal)", margin: "0 0 20px", lineHeight: 1.05, textTransform: "uppercase" }}>
            About Us
          </h1>
          <p style={{ fontSize: "1.15rem", color: "var(--camo-gunmetal)", lineHeight: 1.7, fontStyle: "italic", marginBottom: "10px" }}>
            Our Next Project (ONP) was built on a simple idea:
          </p>
          <p style={{ fontSize: "1.25rem", color: "var(--camo-charcoal)", lineHeight: 1.6, fontWeight: 600 }}>
            Small businesses and homeowners deserve the same bidding advantages that large corporations have relied on for years.
          </p>
        </div>

        {/* Intro */}
        <div style={{ marginBottom: "48px" }}>
          <p style={{ fontSize: "0.95rem", color: "var(--camo-gunmetal)", lineHeight: 1.8, marginBottom: "14px" }}>
            For most people, hiring contractors is stressful and unclear. Pricing can vary wildly, and clients are often left wondering whether they&apos;re getting fair competition or accurate information. ONP was created to change that.
          </p>
          <p style={{ fontSize: "0.95rem", color: "var(--camo-gunmetal)", lineHeight: 1.8 }}>
            We&apos;re an online bid depository designed to bring structure, transparency, and accountability to the project bidding process for homeowners, property owners, and small businesses.
          </p>
        </div>

        {/* What Makes ONP Different */}
        <div style={{ marginBottom: "48px" }}>
          <span style={{ ...eyebrow, display: "block" }}>HOW IT WORKS</span>
          <h2 style={sectionHeading}>What Makes ONP Different</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
            {differentiators.map((d) => (
              <div key={d.title} style={{ background: "var(--camo-concrete)", border: "1px solid #d9dbdb", borderRadius: "6px", padding: "22px 20px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "4px", background: "var(--camo-charcoal)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", marginBottom: "14px" }}>
                  {d.icon}
                </div>
                <h3 style={{ fontSize: "0.98rem", color: "var(--camo-charcoal)", marginBottom: "8px", letterSpacing: 0 }}>{d.title}</h3>
                <p style={{ fontSize: "0.85rem", color: "var(--camo-gunmetal)", lineHeight: 1.6, margin: 0 }}>{d.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Client Trust & Protection — shortened, full detail lives on /trust */}
        <div style={{ background: "var(--camo-charcoal)", borderRadius: "10px", padding: "28px 32px", marginBottom: "40px" }}>
          <h2 style={{ ...sectionHeading, color: "var(--camo-concrete)", margin: "0 0 12px" }}>Built-In Client Protection</h2>
          <p style={{ fontSize: "0.78rem", color: "var(--camo-steel)", fontWeight: 600, marginBottom: "8px" }}>
            For projects where inspection services have been added:
          </p>
          <p style={{ fontSize: "0.92rem", color: "var(--camo-steel)", lineHeight: 1.8, marginBottom: "16px" }}>
            If an inspector upgrades a project&apos;s scope on-site, that upgrade is always reviewable. An independent Master Inspector — with no connection to your original inspection — investigates at no cost and issues a written decision within 5 business days.
          </p>
          <Link href="/trust" style={{ display: "inline-block", fontSize: "0.85rem", color: "var(--camo-accent)", fontWeight: 600, textDecoration: "underline" }}>
            Learn more about how we protect clients →
          </Link>
        </div>

        {/* Built for Contractors Too */}
        <div style={{ marginBottom: "48px" }}>
          <span style={{ ...eyebrow, display: "block" }}>FOR CONTRACTORS</span>
          <h2 style={sectionHeading}>Built for Contractors Too</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
            {contractorPoints.map((c, idx) => (
              <div key={idx} style={{ display: "flex", gap: "14px", alignItems: "flex-start", background: "var(--camo-concrete)", border: "1px solid #d9dbdb", borderRadius: "6px", padding: "16px 18px" }}>
                <span style={{ fontSize: "1.1rem", flexShrink: 0 }}>{c.icon}</span>
                <span style={{ fontSize: "0.88rem", color: "var(--camo-gunmetal)", lineHeight: 1.6 }}>{c.body}</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: "0.92rem", color: "var(--camo-good)", lineHeight: 1.7, fontWeight: 600 }}>
            We&apos;re especially proud to support veteran-owned businesses and contractors who take pride in craftsmanship, accountability, and service.
          </p>
        </div>

        {/* Our Mission */}
        <div style={{ marginBottom: "48px" }}>
          <span style={{ ...eyebrow, display: "block" }}>THE GOAL</span>
          <h2 style={sectionHeading}>Our Mission</h2>
          <p style={{ fontSize: "0.92rem", color: "var(--camo-gunmetal)", lineHeight: 1.8, marginBottom: "16px" }}>
            Our mission is to create a fairer, more transparent project marketplace where:
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
            {missionPoints.map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                <span style={{ color: "var(--camo-accent)", fontSize: "1.05rem", flexShrink: 0, marginTop: "1px" }}>★</span>
                <span style={{ fontSize: "0.92rem", color: "var(--camo-charcoal)", lineHeight: 1.6 }}>{item}</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: "0.92rem", color: "var(--camo-gunmetal)", lineHeight: 1.8, marginBottom: "6px" }}>
            We believe better projects start with better processes.
          </p>
          <p style={{ fontSize: "1rem", color: "var(--camo-charcoal)", fontWeight: 600, lineHeight: 1.6 }}>
            And this is only the beginning.
          </p>
        </div>

        {/* Founder */}
        <div style={{ background: "var(--camo-concrete)", border: "2px solid var(--camo-accent)", borderRadius: "10px", padding: "28px 32px", marginBottom: "48px" }}>
          <h2 style={{ ...sectionHeading, margin: "0 0 12px" }}>★ Our Founder</h2>
          <p style={{ fontSize: "0.92rem", color: "var(--camo-gunmetal)", lineHeight: 1.8, margin: 0 }}>
            ONP was founded by Samuel Bravo, a CAD and infrastructure design professional with years of experience coordinating real-world project documentation, revisions, and contractor workflows. His firsthand experience with unclear scopes, field discrepancies, and communication breakdowns gave ONP its foundation — and its purpose.
          </p>
        </div>

        {/* CTA */}
        <div style={{ textAlign: "center", paddingTop: "10px", paddingBottom: "40px" }}>
          <div style={{ ...eyebrow, marginBottom: "16px" }}>Ready to get started?</div>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/signup" style={{ background: "var(--camo-accent)", color: "var(--camo-ink)", padding: "14px 32px", borderRadius: "3px", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.03em", textDecoration: "none" }}>
              Create a Client Account
            </Link>
            <Link href="/signup/contractor" style={{ background: "transparent", color: "var(--camo-charcoal)", border: "1px solid var(--camo-gunmetal)", padding: "14px 32px", borderRadius: "3px", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.03em", textDecoration: "none" }}>
              Join as a Contractor
            </Link>
            <Link href="/login" style={{ background: "transparent", color: "var(--camo-gunmetal)", border: "1px solid #d9dbdb", padding: "14px 32px", borderRadius: "3px", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.03em", textDecoration: "none" }}>
              Sign In
            </Link>
          </div>
        </div>

      </main>

      <MarketingFooter />
    </div>
  );
}
