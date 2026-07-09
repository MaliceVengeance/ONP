import Image from "next/image";
import Link from "next/link";
import { CamoCanvas } from "@/components/CamoCanvas";
import { SealedBidReveal } from "@/components/SealedBidReveal";
import { MarketingHeader, MarketingFooter, ServiceAreaBanner, BetaDisclaimerBanner } from "@/components/MarketingChrome";
import { getCamoVariant } from "@/lib/camo/session";

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
  minWidth: "270px",
  textAlign: "center",
};

const btnGhost: React.CSSProperties = {
  ...btnPrimary,
  background: "transparent",
  color: "var(--camo-concrete)",
  borderColor: "var(--camo-steel)",
};

const eyebrow: React.CSSProperties = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: "0.72rem",
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: "var(--camo-gunmetal)",
};

const differentiators = [
  { n: "01", title: "No more phone-tag bidding", body: "Every project, question, and bid lives in one record — nothing verbal, nothing lost." },
  { n: "02", title: "Bids stay sealed", body: "Contractors never see competitor pricing. No last-look advantage, no race to the bottom." },
  { n: "03", title: "Verified, not just listed", body: "License and insurance checked before a contractor ever appears in the directory." },
  { n: "04", title: "Concerns get a real answer", body: "Every bid and message is documented — reach out directly to ONP about a project, no cost, no runaround." },
  { n: "05", title: "Veteran contractors, recognized", body: "Your verified veteran status shows on every bid you submit — clients notice, and you get 25% off your subscription." },
];

const categoryTiles = [
  { label: "Landscaping", photo: "/images/tile-landscaping.jpg" },
  { label: "Roofing", photo: "/images/tile-roofing.jpg" },
  { label: "Concrete", photo: "/images/tile-concrete.jpg" },
  { label: "Drywall", photo: "/images/tile-drywall.jpg" },
  { label: "Painting", photo: "/images/tile-painting.jpg" },
  { label: "Electrical", photo: "/images/tile-electrical.jpg" },
  { label: "Plumbing", photo: "/images/tile-plumbing.jpg" },
  { label: "Fencing", photo: "/images/tile-fencing.jpg" },
];

export default async function HomePage() {
  const camoVariant = await getCamoVariant();

  return (
    <div style={{ minHeight: "100vh", background: "var(--camo-paper)", color: "var(--camo-ink)", fontFamily: "'Barlow', sans-serif" }}>
      <MarketingHeader />
      <BetaDisclaimerBanner />
      <ServiceAreaBanner />

      {/* ─── Hero ─── */}
      <section style={{ position: "relative", color: "var(--camo-concrete)", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
          <Image
            src="/images/hero-framer.jpg"
            alt="Framer working on a residential stud wall against open sky"
            fill
            priority
            sizes="100vw"
            style={{ objectFit: "cover", objectPosition: "center 30%" }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(180deg, rgba(21,23,26,0.55) 0%, rgba(21,23,26,0.75) 55%, var(--camo-charcoal) 100%)",
            }}
          />
          <div style={{ position: "absolute", bottom: 0, right: 0, width: "38%", height: "55%", opacity: 0.4 }}>
            <CamoCanvas variant={camoVariant} cell={9} seed={7}
              style={{ maskImage: "linear-gradient(135deg, transparent 20%, black 70%)", WebkitMaskImage: "linear-gradient(135deg, transparent 20%, black 70%)" }}
            />
          </div>
        </div>

        <div style={{ position: "relative", zIndex: 2, maxWidth: "960px", margin: "0 auto", padding: "70px 32px 90px" }}>
          <div
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 800,
              fontSize: "clamp(2.4rem, 6vw, 4.2rem)",
              lineHeight: 1,
              letterSpacing: "0.02em",
              textTransform: "uppercase",
              color: "var(--camo-concrete)",
              marginBottom: "20px",
            }}
          >
            Our Next Project
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "14px" }}>
            <span style={{ ...eyebrow, color: "var(--camo-steel)" }}>SEALED BID PLATFORM</span>
            <span
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "0.72rem",
                letterSpacing: "0.08em",
                padding: "4px 10px",
                borderRadius: "20px",
                border: "1px solid var(--camo-accent)",
                color: "var(--camo-accent)",
              }}
            >
              ★ VETERAN OWNED
            </span>
          </div>

          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: "clamp(1.8rem, 4.5vw, 3.15rem)", lineHeight: 0.98, color: "var(--camo-concrete)", margin: "0 0 22px", textTransform: "uppercase" }}>
            Bid blind.<br /><span style={{ color: "var(--camo-accent)" }}>Build honest.</span>
          </h1>

          <p style={{ fontSize: "1.1rem", color: "var(--camo-concrete)", maxWidth: "620px", marginBottom: "14px", lineHeight: 1.6 }}>
            The sealed-bid marketplace for verified contractors and the clients who hire them.
          </p>
          <p style={{ fontSize: "1rem", color: "var(--camo-steel)", maxWidth: "600px", marginBottom: "34px", lineHeight: 1.6 }}>
            Your identity stays sealed until you choose a bid — no favoritism, no back-channel deals.
          </p>

          <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", flexWrap: "wrap" }}>
            <div>
              <Link href="/signup" style={btnPrimary}>I&apos;m Hiring a Contractor</Link>
              <div style={{ fontSize: "0.78rem", color: "var(--camo-steel)", marginTop: "8px" }}>Including multi-property portfolios</div>
            </div>
            <Link href="/signup/contractor" style={btnGhost}>I&apos;m a Contractor</Link>
          </div>

          <div style={{ marginTop: "22px" }}>
            <Link href="/login" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.8rem", padding: "8px 16px", color: "var(--camo-steel)", border: "1px solid var(--camo-gunmetal)", borderRadius: "3px", textDecoration: "none", textTransform: "uppercase", letterSpacing: "0.03em" }}>
              Sign in →
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Sealed-bid marketing moment (one-time, not a product pattern) ─── */}
      <section style={{ padding: "70px 32px", background: "var(--camo-concrete)" }}>
        <div style={{ maxWidth: "640px", margin: "0 auto", textAlign: "center" }}>
          <span style={{ ...eyebrow, marginBottom: "8px", display: "block" }}>THE SIGNATURE MOMENT</span>
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: "2rem", marginBottom: "10px", color: "var(--camo-charcoal)", textTransform: "uppercase" }}>
            Every bid stays concealed until it opens.
          </h2>
          <p style={{ color: "var(--camo-gunmetal)", marginBottom: "30px", lineHeight: 1.6 }}>
            Tap the card. This is what a sealed bid looks like on <strong>ONP</strong> — hidden like cover, revealed only when the bidding window closes.
          </p>
          <SealedBidReveal variant={camoVariant} />
        </div>
      </section>

      {/* ─── Category tiles ─── */}
      <section style={{ padding: "70px 32px", background: "var(--camo-paper)" }}>
        <div style={{ maxWidth: "1040px", margin: "0 auto" }}>
          <span style={{ ...eyebrow, textAlign: "center", display: "block" }}>BROWSE BY TRADE</span>
          <h2 style={{ textAlign: "center", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: "2rem", margin: "8px 0 40px", color: "var(--camo-charcoal)", textTransform: "uppercase" }}>
            What do you need done?
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "18px" }}>
            {categoryTiles.map((tile) => (
              <Link
                key={tile.label}
                href={`/contractors?category=${encodeURIComponent(tile.label)}`}
                style={{
                  position: "relative",
                  display: "block",
                  height: "160px",
                  borderRadius: "6px",
                  overflow: "hidden",
                  textDecoration: "none",
                  border: "1px solid #d9dbdb",
                }}
              >
                {tile.photo ? (
                  <>
                    <Image src={tile.photo} alt={tile.label} fill sizes="(max-width: 768px) 100vw, 25vw" style={{ objectFit: "cover" }} />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(21,23,26,0.1) 0%, rgba(21,23,26,0.75) 100%)" }} />
                  </>
                ) : (
                  <>
                    <div style={{ position: "absolute", inset: 0, opacity: 0.35 }}>
                      <CamoCanvas variant={camoVariant} cell={8} seed={tile.label.length} />
                    </div>
                    <div style={{ position: "absolute", inset: 0, background: "var(--camo-charcoal)", opacity: 0.55 }} />
                  </>
                )}
                <div style={{ position: "absolute", bottom: "16px", left: "18px", zIndex: 2 }}>
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "1.2rem", color: "var(--camo-concrete)", textTransform: "uppercase", letterSpacing: "0.02em" }}>
                    {tile.label}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How it's different ─── */}
      <section style={{ padding: "70px 32px", background: "var(--camo-concrete)" }}>
        <div style={{ maxWidth: "1040px", margin: "0 auto" }}>
          <span style={{ ...eyebrow, textAlign: "center", display: "block" }}>HOW IT&apos;S DIFFERENT</span>
          <h2 style={{ textAlign: "center", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: "2rem", margin: "8px 0 40px", color: "var(--camo-charcoal)", textTransform: "uppercase" }}>
            The old way vs. the ONP way
          </h2>
          <div className="mob-grid-1" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "18px" }}>
            {differentiators.map((d) => (
              <div key={d.n} style={{ background: "var(--camo-paper)", border: "1px solid #d9dbdb", borderRadius: "6px", padding: "26px 22px" }}>
                <div style={{ width: "38px", height: "38px", borderRadius: "4px", background: "var(--camo-charcoal)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--camo-accent)", fontSize: "1.1rem", marginBottom: "16px", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600 }}>
                  {d.n}
                </div>
                <h3 style={{ fontSize: "1.05rem", color: "var(--camo-charcoal)", marginBottom: "8px", letterSpacing: 0 }}>{d.title}</h3>
                <p style={{ fontSize: "0.88rem", color: "var(--camo-gunmetal)", margin: 0 }}>{d.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Trust / stat bar ─── */}
      <div style={{ display: "flex", justifyContent: "center", gap: "60px", flexWrap: "wrap", padding: "44px 32px", background: "var(--camo-charcoal)", color: "var(--camo-concrete)" }}>
        {[
          { num: "★", label: "Veteran-Owned Company" },
          { num: "2", label: "Markets Live" },
          { num: "$0", label: "Cost to Bid" },
        ].map((s) => (
          <div key={s.label} style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "1.8rem", color: "var(--camo-accent)", fontWeight: 600 }}>{s.num}</div>
            <div style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--camo-steel)", marginTop: "4px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ─── Veteran-owned callout ─── */}
      <section style={{ padding: "60px 32px", background: "var(--camo-paper)" }}>
        <div
          style={{
            maxWidth: "860px",
            margin: "0 auto",
            display: "flex",
            gap: "24px",
            alignItems: "flex-start",
            background: "var(--camo-concrete)",
            border: `2px solid var(--camo-accent)`,
            borderRadius: "10px",
            padding: "32px",
          }}
        >
          <div style={{ fontSize: "36px", flexShrink: 0, lineHeight: 1, color: "var(--camo-accent)" }}>★</div>
          <div>
            <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: "1.4rem", letterSpacing: "0.02em", color: "var(--camo-charcoal)", margin: "0 0 10px 0", textTransform: "uppercase" }}>
              Built by a veteran, for the trades
            </h3>
            <p style={{ fontSize: "0.95rem", color: "var(--camo-gunmetal)", lineHeight: 1.7, margin: 0 }}>
              <strong>ONP</strong> is veteran-owned from the ground up. Verified veteran contractors get a visible badge, a 25% discount, and featured placement in the directory — recognition that&apos;s earned, not buried in fine print.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Dual closing CTA ─── */}
      <section style={{ padding: "70px 32px", background: "var(--camo-charcoal)", textAlign: "center" }}>
        <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: "2rem", color: "var(--camo-concrete)", marginBottom: "12px", textTransform: "uppercase" }}>
          Ready to get started?
        </h2>
        <p style={{ fontSize: "1rem", color: "var(--camo-steel)", marginBottom: "28px" }}>
          Post a project or start bidding — either way, nothing verbal, everything documented.
        </p>
        <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/signup" style={btnPrimary}>I&apos;m Hiring a Contractor</Link>
          <Link href="/signup/contractor" style={btnGhost}>I&apos;m a Contractor</Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
