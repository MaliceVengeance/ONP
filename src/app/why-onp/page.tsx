import Link from "next/link";
import Image from "next/image";
import { MarketingHeader, MarketingFooter, BetaDisclaimerBanner } from "@/components/MarketingChrome";
import { getFeatureFlag, FLAGS } from "@/lib/featureFlags";

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
  { traditional: "Vague project scopes and unclear expectations", onp: "RFIs and file attachments — every question and answer on record" },
  { traditional: "Race to the bottom on pricing", onp: "Sealed bids — compete on quality, not desperation" },
  { traditional: "No paper trail — disputes happen", onp: "Full documented bid and communication history" },
  { traditional: "Clients contact random unverified contractors", onp: "Only verified, licensed, and insured contractors" },
  { traditional: "Wasted time on leads that go nowhere", onp: "Serious clients posting real projects" },
  { traditional: "Your veteran status goes unrecognized", onp: "Veteran Owned badge — clients notice and care" },
  { traditional: "No one to call when something's wrong", onp: "ONP reviews concerns directly — no cost to ask" },
];

const steps = [
  { step: "01", title: "Create Your Profile", desc: "Set up your contractor profile with your business info, service categories, and credentials. Get verified by ONP to appear in the public directory." },
  { step: "02", title: "Browse Open Projects", desc: "See all available projects in your area and categories. Client identities are hidden until award — no favoritism, no politics." },
  { step: "03", title: "Ask Questions", desc: "Use the RFI system to submit structured questions about the project. All answers are visible to every contractor — a level playing field." },
  { step: "04", title: "Submit Your Bid", desc: "Submit your sealed bid before the deadline. Bids are completely hidden from everyone — including the client — until the deadline passes." },
  { step: "05", title: "Win the Work", desc: "If awarded, you receive the client's full contact information and can begin the project. Your reputation and bid win the work — nothing else." },
];

const supportTiles = [
  { icon: "📋", label: "Everything's on record", body: "Bids, RFIs, and project communication are documented from day one — nothing relies on memory." },
  { icon: "💬", label: "Talk to a real person", body: "Questions or concerns about a project go straight to ONP — no bouncing between departments." },
  { icon: "$0", label: "No cost to ask", body: "Reaching out about a project never costs you anything." },
];

const inspectionTile = { icon: "🔍", label: "Request a paid inspection", body: "Want an extra layer of certainty before you award? Request a documented ONP site inspection — available to reference for every contractor bidding on the project." };

export default async function WhyOnpPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const sp = await searchParams;
  const isWelcome = sp.welcome === "1";
  const inspectorEnabled = await getFeatureFlag(FLAGS.INSPECTOR_ENABLED);
  const tiles = inspectorEnabled ? [...supportTiles, inspectionTile] : supportTiles;

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
        )}

        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: "50px" }}>
          <div
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 800,
              fontSize: "clamp(1.8rem, 4.5vw, 3.15rem)",
              lineHeight: 1,
              letterSpacing: "0.02em",
              textTransform: "uppercase",
              color: "var(--camo-charcoal)",
              marginBottom: "20px",
            }}
          >
            Our Next Project
          </div>
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
              Every project on <strong>ONP</strong> — from a backyard install to a full renovation — runs through the same sealed-bid process. Scope, questions, bids, and disputes all live in one record.
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
                  <span style={{ color: "#B45050", fontSize: "1.3rem", fontWeight: 800, flexShrink: 0 }}>✗</span>
                  <span style={{ fontSize: "0.88rem", color: "var(--camo-gunmetal)", lineHeight: 1.5 }}>{row.traditional}</span>
                </div>
                <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", background: "var(--camo-concrete)", border: "1px solid var(--camo-good)", borderRadius: "6px", padding: "16px 18px" }}>
                  <span style={{ color: "var(--camo-good)", fontSize: "1.3rem", fontWeight: 800, flexShrink: 0 }}>✓</span>
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

        {/* Support / documentation callout — icon tiles */}
        <div style={{ marginBottom: "60px" }}>
          <span style={{ ...eyebrow, display: "block" }}>CLIENT PROTECTION</span>
          <h2 style={sectionHeading}>Real Support, Not Just a Platform</h2>
          <p style={{ fontSize: "0.92rem", color: "var(--camo-gunmetal)", lineHeight: 1.7, marginBottom: "28px", maxWidth: "700px" }}>
            If something about a project doesn&apos;t feel right, you&apos;re never on your own. Every project&apos;s full bid and communication history is already documented, so there&apos;s always a clear record to work from.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "20px" }}>
            {tiles.map((t) => (
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
            Join <strong>ONP</strong> and start bidding on real projects from serious clients today.
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
