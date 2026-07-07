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

const steps = [
  { step: "01", title: "You File a Dispute", desc: "From your project dashboard, submit a dispute statement explaining why you believe the upgrade was not justified. You have 14 days from the upgrade charge to file. Filing is free." },
  { step: "02", title: "Inspector Submits a Response", desc: "The original inspector is given 3 days to submit a written response explaining their reasoning for the upgrade. You will see their response when you log in." },
  { step: "03", title: "A Master Inspector Is Assigned", desc: "An independent Master Inspector — a senior inspector from our network who was not involved in your project — is assigned within 24 hours of filing." },
  { step: "04", title: "Full Review of All Evidence", desc: "The Master Inspector reviews the project description, the inspector's justification, the on-site report, your statement, and the inspector's response. No detail is left unread." },
  { step: "05", title: "Written Decision — Within 5 Business Days", desc: "You receive a written decision with full reasoning. One of three outcomes: (1) upgrade was justified — charge stands; (2) upgrade was a reasonable call — charge stands, you receive a store credit; (3) upgrade was not justified — full $200 refund." },
];

const outcomes = [
  { label: "Upgrade Justified", color: "var(--camo-gunmetal)", desc: "The Master Inspector finds the on-site upgrade was warranted given the scope. The $200 charge stands. You receive the decision with full written reasoning." },
  { label: "Partial Credit", color: "var(--camo-good)", desc: "The upgrade was a borderline call. The charge stands, but you receive a store credit (typically $50–$200) applied to your ONP account for future inspections." },
  { label: "Full Refund", color: "var(--camo-accent)", desc: "The Master Inspector finds the upgrade was not justified. You receive a full $200 refund — processed to your original payment method or as a credit if paid by credits." },
];

const transparencyItems = [
  "% of inspection reports completed without any dispute",
  "% of disputes resulting in a client refund",
  "Average dispute resolution time (business days)",
  "Number of active Master Inspectors on the platform",
];

const faqs = [
  { q: "Does filing a dispute affect my account?", a: "No. Disputes are a protected right for all ONP clients. Filing a dispute will never result in any negative action on your account." },
  { q: "What if I miss the 14-day window?", a: "The 14-day window begins from the date of the upgrade charge. After 14 days, the charge is final. If you have an exceptional circumstance, contact support@ournextproject.us." },
  { q: "Can I appeal the Master Inspector's decision?", a: "The Master Inspector's decision is final in the normal course. ONP administration may review cases where there is clear evidence of procedural error — contact support for exceptional cases." },
  { q: "How long does the process actually take?", a: "Most disputes are resolved within 3–5 business days. The SLA is 5 business days from the date the Master Inspector is assigned. If the SLA is missed, the case is automatically escalated to ONP administration." },
  { q: "How is the inspector held accountable?", a: "ONP tracks each inspector's dispute history. Inspectors with a high rate of refund outcomes are flagged internally, placed under compliance review, and — if patterns persist — suspended from accepting new upgrade requests." },
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
            ONP is built on the principle that every client interaction should be transparent, documented, and — when something goes wrong — reviewable by an independent third party.
          </p>
        </div>

        {/* The core promise */}
        <div style={{ background: "var(--camo-charcoal)", borderRadius: "10px", padding: "26px 30px", marginBottom: "40px", borderLeft: "6px solid var(--camo-accent)" }}>
          <p style={{ fontSize: "1.05rem", color: "var(--camo-concrete)", lineHeight: 1.8, margin: 0, fontStyle: "italic" }}>
            &ldquo;Every on-site upgrade is reviewable. If you believe an upgrade was unjustified, an independent Master Inspector will review your case within 5 business days — at no cost to you. This is part of our commitment to client trust.&rdquo;
          </p>
        </div>

        {/* What is an on-site upgrade */}
        <div style={{ marginBottom: "40px" }}>
          <h2 style={sectionHeading}>What Is an On-Site Upgrade?</h2>
          <p style={{ fontSize: "0.9rem", color: "var(--camo-gunmetal)", lineHeight: 1.8, marginBottom: "12px" }}>
            When you request a Standard Inspection, an ONP inspector visits your site and performs a pre-bid takeoff to help contractors prepare accurate bids. In some cases, the inspector determines on-site that the scope of work is significantly more complex than described — and upgrades the inspection to a Comprehensive level. This upgrade carries an additional fee of $200.
          </p>
          <p style={{ fontSize: "0.9rem", color: "var(--camo-gunmetal)", lineHeight: 1.8 }}>
            We recognize that an unexpected charge — especially one added at the site visit — can feel surprising. That is why every upgrade can be formally disputed.
          </p>
        </div>

        {/* How the dispute process works — real sequence, numbering earned */}
        <div style={{ marginBottom: "40px" }}>
          <h2 style={sectionHeading}>How the Dispute Process Works</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            {steps.map((s, idx) => (
              <div key={s.step} style={{ display: "flex", gap: "0", position: "relative" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "56px", flexShrink: 0 }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "4px", background: "var(--camo-charcoal)", color: "var(--camo-accent)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, fontSize: "0.95rem", flexShrink: 0, zIndex: 1 }}>
                    {s.step}
                  </div>
                  {idx < 4 && <div style={{ width: "2px", flex: 1, background: "#d9dbdb", minHeight: "24px" }} />}
                </div>
                <div style={{ paddingLeft: "16px", paddingBottom: idx < 4 ? "24px" : 0 }}>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "1.05rem", color: "var(--camo-charcoal)", marginBottom: "6px", marginTop: "8px", textTransform: "uppercase", letterSpacing: "0.02em" }}>
                    {s.title}
                  </div>
                  <p style={{ fontSize: "0.85rem", color: "var(--camo-gunmetal)", lineHeight: 1.7, margin: 0 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Possible outcomes */}
        <div style={{ marginBottom: "40px" }}>
          <h2 style={sectionHeading}>Possible Outcomes</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {outcomes.map((o) => (
              <div key={o.label} style={{ background: "var(--camo-concrete)", border: `1px solid ${o.color}`, borderRadius: "8px", padding: "16px 20px", display: "flex", gap: "16px", alignItems: "flex-start", flexWrap: "wrap" }}>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.82rem", color: o.color, textTransform: "uppercase", letterSpacing: "0.05em", flexShrink: 0, minWidth: "130px", paddingTop: "1px" }}>
                  {o.label}
                </div>
                <p style={{ fontSize: "0.85rem", color: "var(--camo-gunmetal)", lineHeight: 1.6, margin: 0 }}>{o.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Master Inspectors */}
        <div style={{ background: "var(--camo-concrete)", border: "1px solid #d9dbdb", borderRadius: "10px", padding: "26px 30px", marginBottom: "40px" }}>
          <h2 style={{ ...sectionHeading, margin: "0 0 14px" }}>Who Are Master Inspectors?</h2>
          <p style={{ fontSize: "0.88rem", color: "var(--camo-gunmetal)", lineHeight: 1.8, marginBottom: "12px" }}>
            Master Inspectors are senior inspectors who have been individually vetted and approved by ONP administration to review disputes. They are selected based on experience, inspection history, and completion of an internal competency review.
          </p>
          <p style={{ fontSize: "0.88rem", color: "var(--camo-gunmetal)", lineHeight: 1.8 }}>
            They are independent: the system automatically excludes the original inspector and, where possible, any inspector who has previously worked on the same project. Assignment is based on availability to ensure disputes are resolved quickly and without conflict of interest.
          </p>
        </div>

        {/* Platform Transparency — placeholder for live stats */}
        <div style={{ background: "var(--camo-charcoal)", borderRadius: "10px", padding: "26px 30px", marginBottom: "40px" }}>
          <h2 style={{ ...sectionHeading, color: "var(--camo-concrete)", margin: "0 0 14px" }}>Platform Transparency</h2>
          <p style={{ fontSize: "0.88rem", color: "var(--camo-steel)", lineHeight: 1.8, marginBottom: "14px" }}>
            We are committed to publishing aggregate dispute statistics once our data set is large enough to be meaningful — typically after 90 days of live dispute activity and a minimum of 30 completed cases. Once available, you will see:
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
            Stats will appear here once the platform has accumulated sufficient dispute history. Check back after our first 90 days of live operation.
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
            Questions about a charge?
          </h3>
          <p style={{ fontSize: "0.85rem", color: "var(--camo-gunmetal)", marginBottom: "20px", lineHeight: 1.6 }}>
            Log into your account and open a dispute from your project dashboard. It takes less than five minutes and costs nothing.
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/login" style={{ background: "var(--camo-accent)", color: "var(--camo-ink)", padding: "12px 28px", borderRadius: "3px", textDecoration: "none", fontWeight: 700, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.03em" }}>
              Sign In to File a Dispute
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
