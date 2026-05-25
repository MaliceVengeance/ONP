import Link from "next/link";

export const metadata = { title: "Privacy Policy — Our Next Project" };

const h2Style: React.CSSProperties = {
  fontFamily: "'Barlow Condensed', sans-serif",
  fontWeight: 700,
  fontSize: "26px",
  letterSpacing: "1px",
  color: "#0A1628",
  textTransform: "uppercase",
  margin: "0 0 6px 0",
};
const dividerStyle: React.CSSProperties = {
  width: "36px",
  height: "2px",
  background: "#C8102E",
  marginBottom: "18px",
};
const sectionStyle: React.CSSProperties = { marginBottom: "44px" };
const pStyle: React.CSSProperties = {
  fontSize: "15px",
  color: "#1B4F8A",
  lineHeight: 1.85,
  marginBottom: "12px",
};
const liStyle: React.CSSProperties = {
  fontSize: "15px",
  color: "#1B4F8A",
  lineHeight: 1.85,
  marginBottom: "6px",
};
const subheadStyle: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: 700,
  color: "#0A1628",
  marginBottom: "8px",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#FFFFFF", color: "#0A1628", fontFamily: "'Barlow', sans-serif" }}>
      {/* Header */}
      <header style={{ background: "#0A1628", borderBottom: "2px solid #C8102E", padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/login" style={{ textDecoration: "none" }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: "26px", letterSpacing: "2px", color: "#fff", display: "flex", alignItems: "center", gap: "8px" }}>
            <span>★</span> ONP
          </div>
          <div style={{ fontSize: "11px", letterSpacing: "3px", color: "#FFFFFF", textTransform: "uppercase" }}>Our Next Project</div>
        </Link>
        <Link href="/login" style={{ background: "transparent", color: "#FFFFFF", border: "1px solid #1B4F8A", padding: "8px 20px", borderRadius: "6px", fontSize: "13px", textDecoration: "none" }}>Sign In</Link>
      </header>

      <main style={{ maxWidth: "800px", margin: "0 auto", padding: "60px 24px 80px" }}>
        {/* Title */}
        <div style={{ marginBottom: "40px" }}>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "48px", color: "#0A1628", marginBottom: "8px", lineHeight: 1.1 }}>Privacy Policy</h1>
          <div style={{ width: "60px", height: "3px", background: "#C8102E", marginBottom: "20px" }} />
          <p style={{ fontSize: "14px", color: "#4A7FB5", marginBottom: "4px" }}><strong>Our Next Project, LLC</strong></p>
          <p style={{ fontSize: "14px", color: "#4A7FB5", marginBottom: "20px" }}>Effective: [EFFECTIVE DATE]</p>
          <div style={{ background: "#EEF4FF", border: "1px solid #B8D0E8", borderRadius: "8px", padding: "16px 20px", fontSize: "14px", color: "#1B4F8A", lineHeight: 1.7 }}>
            This is the plain English version of how we handle your information. There&apos;s also a{" "}
            <Link href="/privacy/legal" style={{ color: "#C8102E", fontWeight: 600 }}>full legal version</Link>
            {" "}— if anything below conflicts with it, the legal version controls.
          </div>
        </div>

        {/* What we collect */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>What we collect</h2>
          <div style={dividerStyle} />
          <p style={subheadStyle}>You give us:</p>
          <ul style={{ paddingLeft: "24px", marginBottom: "12px" }}>
            <li style={liStyle}><strong>Account info:</strong> name, email, password, phone, address, business name (for contractors), license and insurance details (for contractors), veteran-status documentation if you claim a CVOB badge.</li>
            <li style={liStyle}><strong>Project info:</strong> descriptions, photos, files, location, budget — anything you put into a Project or Bid.</li>
            <li style={liStyle}><strong>Messages:</strong> what you write to other users through ONP.</li>
            <li style={liStyle}><strong>Reviews and ratings:</strong> what you say about other users.</li>
            <li style={liStyle}><strong>Payment info:</strong> your card or bank info goes to Stripe, not us. We just get back enough to know the payment worked.</li>
            <li style={liStyle}><strong>Support requests:</strong> anything you send to support@ournextproject.us.</li>
          </ul>
          <p style={subheadStyle}>We collect automatically:</p>
          <ul style={{ paddingLeft: "24px", marginBottom: "12px" }}>
            <li style={liStyle}>Device and browser info (type, OS, IP address, browser version).</li>
            <li style={liStyle}>Usage info (pages you visit, what you click, how long you stay, what you search).</li>
            <li style={liStyle}>Cookies and similar tech (see &ldquo;Cookies and tracking&rdquo; below).</li>
            <li style={liStyle}>General location based on IP — not GPS-precise unless you give it.</li>
          </ul>
          <p style={subheadStyle}>We get from others:</p>
          <ul style={{ paddingLeft: "24px" }}>
            <li style={liStyle}>License lookup results from state licensing agencies.</li>
            <li style={liStyle}>BBB lookup results.</li>
            <li style={liStyle}>CVOB verification results.</li>
            <li style={liStyle}>Insurance certificate confirmations from your insurer or broker.</li>
          </ul>
        </div>

        {/* How we use it */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>How we use it</h2>
          <div style={dividerStyle} />
          <ul style={{ paddingLeft: "24px" }}>
            <li style={liStyle}>Run and improve the Platform</li>
            <li style={liStyle}>Verify contractors (license, insurance, BBB, CVOB)</li>
            <li style={liStyle}>Match clients and contractors and process Bids</li>
            <li style={liStyle}>Process payments through Stripe</li>
            <li style={liStyle}>Send transactional emails (account, billing, project notifications)</li>
            <li style={liStyle}>Send marketing emails about ONP news, features, and updates (you can opt out anytime)</li>
            <li style={liStyle}>Show ads on the Platform</li>
            <li style={liStyle}>Detect fraud, abuse, and violations of our Terms</li>
            <li style={liStyle}>Comply with the law and enforce our agreements</li>
          </ul>
        </div>

        {/* Who we share it with */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>Who we share it with</h2>
          <div style={dividerStyle} />
          <ul style={{ paddingLeft: "24px", marginBottom: "16px" }}>
            <li style={{ ...liStyle, marginBottom: "12px" }}>
              <strong>Service providers</strong> that help us run ONP:
              <ul style={{ paddingLeft: "20px", marginTop: "4px" }}>
                <li style={liStyle}><strong>Stripe</strong> — payment processing</li>
                <li style={liStyle}><strong>Vercel</strong> — website hosting</li>
                <li style={liStyle}><strong>Supabase</strong> — database and authentication</li>
                <li style={liStyle}>Email service providers — notifications and marketing emails</li>
                <li style={liStyle}>Verification partners — license, insurance, BBB, and CVOB checks</li>
              </ul>
            </li>
            <li style={{ ...liStyle, marginBottom: "12px" }}><strong>Other users</strong> — your public profile, reviews, ratings, and Project/Bid details are visible to relevant counterparties.</li>
            <li style={{ ...liStyle, marginBottom: "12px" }}><strong>Advertisers</strong> — we display ads from third parties. Cookie-based ad activity can count as &ldquo;sale&rdquo; or &ldquo;sharing&rdquo; under some state privacy laws — see &ldquo;Your privacy choices&rdquo; below.</li>
            <li style={{ ...liStyle, marginBottom: "12px" }}><strong>Legal and safety</strong> — if we have to share with law enforcement, courts, or regulators.</li>
            <li style={liStyle}><strong>Business transfers</strong> — if ONP is acquired, merged, or sold, your info may transfer with the business.</li>
          </ul>
          <div style={{ background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: "8px", padding: "14px 18px", fontSize: "14px", color: "#166534" }}>
            <strong>We do not sell your personal information for money.</strong>
          </div>
        </div>

        {/* Marketing */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>Marketing emails and notifications</h2>
          <div style={dividerStyle} />
          <ul style={{ paddingLeft: "24px" }}>
            <li style={liStyle}><strong>Transactional emails</strong> (account, payment, project alerts): part of using ONP — you can&apos;t opt out while you have an account.</li>
            <li style={liStyle}><strong>News and updates:</strong> unsubscribe anytime via the link in those emails or by emailing support@ournextproject.us.</li>
          </ul>
        </div>

        {/* Cookies */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>Cookies and tracking</h2>
          <div style={dividerStyle} />
          <p style={pStyle}>We use cookies and similar technology to keep you logged in, remember preferences, understand how the Platform is used, and (with our ad partners) show you relevant ads.</p>
          <p style={pStyle}>You can manage cookies through your browser settings. Disabling cookies may break some features.</p>
        </div>

        {/* Privacy choices */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>Your privacy choices</h2>
          <div style={dividerStyle} />
          <ul style={{ paddingLeft: "24px", marginBottom: "16px" }}>
            <li style={liStyle}><strong>Access:</strong> ask what we have on you</li>
            <li style={liStyle}><strong>Correct:</strong> fix wrong info</li>
            <li style={liStyle}><strong>Delete:</strong> ask us to delete your info (some things we must keep for legal reasons)</li>
            <li style={liStyle}><strong>Portability:</strong> get your info in a usable file</li>
            <li style={liStyle}><strong>Opt out of marketing:</strong> anytime</li>
            <li style={liStyle}><strong>Opt out of &ldquo;sale&rdquo; or &ldquo;sharing&rdquo;</strong> of personal info for targeted advertising</li>
          </ul>
          <p style={pStyle}>Email <strong>support@ournextproject.us</strong> with your request and account info. We&apos;ll respond within the time required by law.</p>
          <p style={{ ...pStyle, fontStyle: "italic" }}>
            California, Colorado, Virginia, Connecticut, Utah, and other state residents: the{" "}
            <Link href="/privacy/legal" style={{ color: "#C8102E" }}>legal version</Link> has more detail on your specific rights.
          </p>
        </div>

        {/* Children */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>Children</h2>
          <div style={dividerStyle} />
          <p style={pStyle}>ONP is for people <strong>18 and older</strong>. We don&apos;t knowingly collect info from anyone under 18. Contact us and we&apos;ll delete it if we have it.</p>
        </div>

        {/* Security */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>Security</h2>
          <div style={dividerStyle} />
          <p style={pStyle}>We use encryption in transit, access controls, secure hosting via Vercel and Supabase, and Stripe for payments. No system is 100% secure, but we work to protect your data.</p>
        </div>

        {/* Data location */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>Where your data lives</h2>
          <div style={dividerStyle} />
          <p style={pStyle}>ONP is operated from the United States. By using the Platform, you understand your information is processed in the U.S.</p>
        </div>

        {/* Retention */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>How long we keep it</h2>
          <div style={dividerStyle} />
          <p style={pStyle}>We keep your data as long as your account is active and as long as needed to provide the Services, comply with the law, and enforce our agreements. Reviews and ratings may stay on the Platform even after you close your account.</p>
        </div>

        {/* Changes */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>Changes to this policy</h2>
          <div style={dividerStyle} />
          <p style={pStyle}>We may update this Privacy Policy. We&apos;ll post the new version with a new &ldquo;Effective&rdquo; date. Material changes will be communicated by email or a Platform notice.</p>
        </div>

        {/* Contact */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>Contact us</h2>
          <div style={dividerStyle} />
          <div style={{ background: "#EEF4FF", border: "1px solid #B8D0E8", borderRadius: "8px", padding: "16px 20px", fontSize: "15px", color: "#0A1628", lineHeight: 1.9 }}>
            <strong>Our Next Project, LLC</strong><br />
            [BUSINESS ADDRESS]<br />
            <a href="mailto:support@ournextproject.us" style={{ color: "#1B4F8A" }}>support@ournextproject.us</a>
          </div>
        </div>

        {/* Cross-link */}
        <div style={{ borderTop: "1px solid #B8D0E8", paddingTop: "32px", textAlign: "center" }}>
          <p style={{ fontSize: "13px", color: "#4A7FB5", marginBottom: "12px" }}>Need the full legal language?</p>
          <Link href="/privacy/legal" style={{ display: "inline-block", color: "#1B4F8A", border: "1px solid #B8D0E8", padding: "10px 24px", borderRadius: "6px", fontSize: "13px", textDecoration: "none", fontWeight: 500 }}>
            View Full Legal Privacy Policy →
          </Link>
        </div>
      </main>

      <div style={{ borderTop: "1px solid #B8D0E8", padding: "20px 28px", textAlign: "center", fontSize: "12px", color: "#4A7FB5", letterSpacing: "1px", textTransform: "uppercase" }}>
        © 2026 Our Next Project — Honoring American Veterans
      </div>
    </div>
  );
}
