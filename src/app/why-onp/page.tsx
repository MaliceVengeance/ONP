import Link from "next/link";
import Image from "next/image";
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
  fontSize: "2rem",
  color: "var(--camo-charcoal)",
  textTransform: "uppercase",
  margin: "8px 0 32px",
};

const comparisonRows = [
  { traditional: "Cold calling and chasing leads", onp: "Projects come directly to you" },
  { traditional: "Unknown competition — who else is bidding?", onp: "Structured blind bidding — fair for everyone" },
  { traditional: "Vague project scopes and unclear expectations", onp: "RFIs, file attachments, and inspector takeoffs" },
  { traditional: "Race to the bottom on pricing", onp: "Sealed bids — compete on quality, not desperation" },
  { traditional: "No paper trail — disputes happen", onp: "Full documented bid and communication history" },
  { traditional: "Clients contact random unverified contractors", onp: "Only verified, licensed, and insured contractors" },
  { traditional: "Wasted time on leads that go nowhere", onp: "Serious clients posting real projects" },
  { traditional: "Your veteran status goes unrecognized", onp: "Veteran Owned badge — clients notice and care" },
  { traditional: "On-site upgrade disputes go nowhere", onp: "Independent Master Inspector review — free, within 5 business days" },
];

const steps = [
  { step: "01", title: "Create Your Profile", desc: "Set up your contractor profile with your business info, service categories, and credentials. Get verified by ONP to appear in the public directory." },
  { step: "02", title: "Browse Open Projects", desc: "See all available projects in your area and categories. Client identities are hidden until award — no favoritism, no politics." },
  { step: "03", title: "Ask Questions", desc: "Use the RFI system to submit structured questions about the project. All answers are visible to every contractor — a level playing field." },
  { step: "04", title: "Submit Your Bid", desc: "Submit your sealed bid before the deadline. Bids are completely hidden from everyone — including the client — until the deadline passes." },
  { step: "05", title: "Win the Work", desc: "If awarded, you receive the client's full contact information and can begin the project. Your reputation and bid win the work — nothing else." },
];

const disputeTiles = [
  { icon: "⚖", label: "Independent reviewer", body: "A senior Master Inspector with no connection to your original inspection." },
  { icon: "📋", label: "Full evidence review", body: "Photos, notes, and the full project record are reviewed before a decision." },
  { icon: "✍", label: "Written explanation", body: "You get a written decision within 5 business days — not a verbal shrug." },
  { icon: "$0", label: "Free to file", body: "No cost to dispute an on-site upgrade. If it wasn't warranted, you're refunded." },
];

export default async function WhyOnpPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const sp = await searchParams;
  const isWelcome = sp.welcome === "1";

  return (
    <div style={{ minHeight: "100vh", background: "var(--camo-paper)", color: "var(--camo-ink)", fontFamily: "'Barlow', sans-serif" }}>
      <MarketingHeader active="why-onp" />
      <BetaDisclaimerBanner />

      <main style={{ maxWidth: "1040px", margin: "0 auto", padding: "40px 24px" }}>

        {/* Welcome banner — only shown after successful subscription */}
        {isWelcome && (
          <div style={{ background: "var(--camo-concrete)", border: "2px solid var(--camo-accent)", borderRadius: "10px", padding: "28px", marginBottom: "40px", textAlign: "center" }}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>🎉</div>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "32px", color: "var(--camo-charcoal)", marginBottom: "8px", textTransform: "uppercase" }}>
              Welcome to ONP!
            </h2>
            <p style={{ fontSize: "15px", color: "var(--camo-gunmetal)", marginBottom: "20px", lineHeight: 1.6 }}>
              Your subscription is active. You now have full access to the ONP bidding platform. Here&apos;s everything you need to know to get started.
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
        )}

        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: "50px" }}>
          <span style={{ ...eyebrow, display: "block", marginBottom: "8px" }}>WHY ONP</span>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: "clamp(2.2rem, 5vw, 3.4rem)", color: "var(--camo-charcoal)", margin: 0, lineHeight: 1.05, textTransform: "uppercase" }}>
            The traditional way is broken.<br />ONP fixes it.
          </h1>
        </div>

        {/* Photo anchor + How it's different framing */}
        <div className="mob-grid-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "28px", alignItems: "center", marginBottom: "60px" }}>
          <div style={{ position: "relative", borderRadius: "8px", overflow: "hidden", aspectRatio: "4/3" }}>
            <Image src="/images/detail-sod-roll.jpg" alt="Sod roll ready for landscaping install" fill sizes="(max-width: 768px) 100vw, 500px" style={{ objectFit: "cover" }} />
          </div>
          <div>
            <span style={{ ...eyebrow, display: "block", marginBottom: "8px" }}>REAL WORK, REAL RECORDS</span>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: "1.6rem", color: "var(--camo-charcoal)", margin: "0 0 12px", textTransform: "uppercase" }}>
              Nothing verbal. Everything documented.
            </h2>
            <p style={{ fontSize: "0.95rem", color: "var(--camo-gunmetal)", lineHeight: 1.7 }}>
              Every project on ONP — from a backyard install to a full renovation — runs through the same sealed-bid process. Scope, questions, bids, and disputes all live in one record.
            </p>
          </div>
        </div>

        {/* ONP vs Traditional comparison — paired icon cards */}
        <div style={{ marginBottom: "60px" }}>
          <span style={{ ...eyebrow, display: "block" }}>HOW IT&apos;S DIFFERENT</span>
          <h2 style={sectionHeading}>ONP vs. The Old Way</h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {comparisonRows.map((row, idx) => (
              <div key={idx} className="mob-grid-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", background: "var(--camo-concrete)", border: "1px solid #d9dbdb", borderRadius: "6px", padding: "16px 18px" }}>
                  <span style={{ color: "#B45050", fontSize: "1.1rem", flexShrink: 0 }}>✗</span>
                  <span style={{ fontSize: "0.88rem", color: "var(--camo-gunmetal)", lineHeight: 1.5 }}>{row.traditional}</span>
                </div>
                <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", background: "var(--camo-concrete)", border: "1px solid var(--camo-good)", borderRadius: "6px", padding: "16px 18px" }}>
                  <span style={{ color: "var(--camo-good)", fontSize: "1.1rem", flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: "0.88rem", color: "var(--camo-charcoal)", lineHeight: 1.5, fontWeight: 500 }}>{row.onp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How it works — step cards */}
        <div style={{ marginBottom: "60px" }}>
          <span style={{ ...eyebrow, display: "block" }}>THE PROCESS</span>
          <h2 style={sectionHeading}>How It Works</h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {steps.map((s) => (
              <div key={s.step} style={{ background: "var(--camo-concrete)", border: "1px solid #d9dbdb", borderRadius: "8px", padding: "22px 24px", display: "flex", gap: "22px", alignItems: "flex-start" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "4px", background: "var(--camo-charcoal)", color: "var(--camo-accent)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, fontSize: "1.1rem", flexShrink: 0 }}>
                  {s.step}
                </div>
                <div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "1.15rem", color: "var(--camo-charcoal)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.02em" }}>
                    {s.title}
                  </div>
                  <div style={{ fontSize: "0.9rem", color: "var(--camo-gunmetal)", lineHeight: 1.6 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing */}
        <div style={{ marginBottom: "60px" }}>
          <span style={{ ...eyebrow, display: "block" }}>PRICING</span>
          <h2 style={sectionHeading}>Simple Pricing</h2>

          <div className="mob-grid-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            {/* Standard */}
            <div style={{ background: "var(--camo-concrete)", border: "1px solid #d9dbdb", borderRadius: "8px", padding: "28px" }}>
              <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "1.4rem", color: "var(--camo-charcoal)", marginBottom: "4px", textTransform: "uppercase" }}>Standard</h3>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, fontSize: "2.6rem", color: "var(--camo-charcoal)", lineHeight: 1, marginBottom: "4px" }}>$200</div>
              <div style={{ fontSize: "0.8rem", color: "var(--camo-gunmetal)", marginBottom: "20px" }}>per month</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "24px" }}>
                {["Access to all open projects", "Unlimited bid submissions", "RFI communication system", "File downloads", "Bid history tracking", "ONP Verified badge"].map((f) => (
                  <div key={f} style={{ fontSize: "0.82rem", color: "var(--camo-gunmetal)" }}>✅ {f}</div>
                ))}
              </div>
              <Link href="/signup/contractor" style={{ display: "block", background: "var(--camo-charcoal)", color: "var(--camo-concrete)", padding: "12px", borderRadius: "3px", textDecoration: "none", fontWeight: 700, fontSize: "0.85rem", textAlign: "center", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                Get Started
              </Link>
            </div>

            {/* Veteran — tightened hierarchy: discount + exclusivity read first */}
            <div style={{ background: "var(--camo-charcoal)", border: "2px solid var(--camo-accent)", borderRadius: "8px", padding: "28px", position: "relative" }}>
              <span style={{ position: "absolute", top: "-12px", right: "20px", fontSize: "0.7rem", fontWeight: 700, padding: "4px 12px", borderRadius: "20px", background: "var(--camo-accent)", color: "var(--camo-ink)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                ★ Exclusive
              </span>
              <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "1.4rem", color: "var(--camo-concrete)", margin: "4px 0", textTransform: "uppercase" }}>Veteran</h3>
              <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "4px" }}>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, fontSize: "2.6rem", color: "var(--camo-accent)", lineHeight: 1 }}>$150</span>
                <span style={{ fontSize: "0.8rem", color: "var(--camo-good)", fontWeight: 600 }}>25% OFF STANDARD</span>
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--camo-steel)", marginBottom: "20px" }}>per month — verified veterans only</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "24px" }}>
                {["Everything in Standard", "★ Veteran Owned badge on bids", "★ Featured in contractor directory", "Priority recognition from clients"].map((f) => (
                  <div key={f} style={{ fontSize: "0.82rem", color: "var(--camo-concrete)" }}>✅ {f}</div>
                ))}
              </div>
              <Link href="/signup/contractor" style={{ display: "block", background: "var(--camo-accent)", color: "var(--camo-ink)", padding: "12px", borderRadius: "3px", textDecoration: "none", fontWeight: 700, fontSize: "0.85rem", textAlign: "center", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                ★ Get Started — Veteran
              </Link>
            </div>
          </div>

          <p style={{ fontSize: "0.75rem", color: "var(--camo-gunmetal)", textAlign: "center", marginTop: "16px" }}>
            No setup fees. No long-term contracts. Cancel anytime.
          </p>
        </div>

        {/* Inspector Protection callout — icon tiles */}
        <div style={{ marginBottom: "60px" }}>
          <span style={{ ...eyebrow, display: "block" }}>CLIENT PROTECTION</span>
          <h2 style={sectionHeading}>Every On-Site Upgrade Is Reviewable</h2>
          <p style={{ fontSize: "0.92rem", color: "var(--camo-gunmetal)", lineHeight: 1.7, marginBottom: "28px", maxWidth: "700px" }}>
            If your inspector upgrades the scope of work on-site and you believe it wasn&apos;t justified, you can file a dispute at no cost — reviewed independently, decided in writing.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "20px" }}>
            {disputeTiles.map((t) => (
              <div key={t.label} style={{ background: "var(--camo-concrete)", border: "1px solid #d9dbdb", borderRadius: "6px", padding: "20px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "4px", background: "var(--camo-charcoal)", color: "var(--camo-accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", marginBottom: "12px", fontFamily: "'IBM Plex Mono', monospace" }}>
                  {t.icon}
                </div>
                <h3 style={{ fontSize: "0.95rem", color: "var(--camo-charcoal)", marginBottom: "6px" }}>{t.label}</h3>
                <p style={{ fontSize: "0.82rem", color: "var(--camo-gunmetal)", margin: 0, lineHeight: 1.5 }}>{t.body}</p>
              </div>
            ))}
          </div>
          <Link href="/trust" style={{ fontSize: "0.85rem", color: "var(--camo-gunmetal)", fontWeight: 600, textDecoration: "underline" }}>
            How our client protection works →
          </Link>
        </div>

        {/* CTA */}
        <div style={{ background: "var(--camo-charcoal)", borderRadius: "10px", padding: "44px", textAlign: "center", marginBottom: "40px" }}>
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: "1.9rem", color: "var(--camo-concrete)", marginBottom: "12px", textTransform: "uppercase" }}>
            Ready to Work Smarter?
          </h2>
          <p style={{ fontSize: "0.95rem", color: "var(--camo-steel)", marginBottom: "24px" }}>
            Join ONP and start bidding on real projects from serious clients today.
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/signup/contractor" style={{ background: "var(--camo-accent)", color: "var(--camo-ink)", padding: "14px 32px", borderRadius: "3px", textDecoration: "none", fontWeight: 700, fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.03em" }}>
              Create Contractor Account
            </Link>
            <Link href="/contractors" style={{ background: "transparent", color: "var(--camo-concrete)", border: "1px solid var(--camo-steel)", padding: "14px 32px", borderRadius: "3px", textDecoration: "none", fontSize: "0.9rem" }}>
              View Contractor Directory
            </Link>
          </div>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
