import Link from "next/link";

export const metadata = { title: "Privacy Policy — Our Next Project" };

export default function PrivacyPage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#FFFFFF",
      color: "#0A1628",
      fontFamily: "'Barlow', sans-serif",
    }}>
      {/* Header */}
      <header style={{
        background: "#0A1628",
        borderBottom: "2px solid #C8102E",
        padding: "14px 28px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <Link href="/login" style={{ textDecoration: "none" }}>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 800,
            fontSize: "26px",
            letterSpacing: "2px",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}>
            <span style={{ color: "#fff" }}>★</span> ONP
          </div>
          <div style={{
            fontSize: "11px",
            letterSpacing: "3px",
            color: "#FFFFFF",
            textTransform: "uppercase",
          }}>
            Our Next Project
          </div>
        </Link>
        <Link href="/login" style={{
          background: "transparent",
          color: "#FFFFFF",
          border: "1px solid #1B4F8A",
          padding: "8px 20px",
          borderRadius: "6px",
          fontFamily: "'Barlow', sans-serif",
          fontSize: "13px",
          textDecoration: "none",
        }}>
          Sign In
        </Link>
      </header>

      {/* Content */}
      <main style={{ maxWidth: "800px", margin: "0 auto", padding: "60px 24px 80px" }}>

        {/* Title */}
        <div style={{ marginBottom: "40px" }}>
          <h1 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "48px",
            letterSpacing: "1px",
            color: "#0A1628",
            marginBottom: "8px",
            lineHeight: 1.1,
          }}>
            Privacy Policy
          </h1>
          <div style={{ width: "60px", height: "3px", background: "#C8102E", marginBottom: "20px" }} />
          <p style={{ fontSize: "14px", color: "#4A7FB5", marginBottom: "4px" }}>
            <strong>Our Next Project, LLC</strong>
          </p>
          <p style={{ fontSize: "14px", color: "#4A7FB5", marginBottom: "16px" }}>
            Effective: [EFFECTIVE DATE]
          </p>
          <div style={{
            background: "#EEF4FF",
            border: "1px solid #B8D0E8",
            borderRadius: "8px",
            padding: "16px 20px",
            fontSize: "14px",
            color: "#1B4F8A",
            lineHeight: 1.7,
          }}>
            This is the plain English version of how we handle your information. There&apos;s also a{" "}
            <Link href="/privacy/legal" style={{ color: "#C8102E", fontWeight: 600 }}>full legal version</Link>
            {" "}— if anything below conflicts with it, the legal version controls.
          </div>
        </div>

        {/* Section helper styles */}
        <style>{`
          .policy-h2 {
            font-family: 'Barlow Condensed', sans-serif;
            font-weight: 700;
            font-size: 26px;
            letter-spacing: 1px;
            color: #0A1628;
            text-transform: uppercase;
            margin-bottom: 6px;
            margin-top: 0;
          }
          .policy-divider {
            width: 36px;
            height: 2px;
            background: #C8102E;
            margin-bottom: 18px;
          }
          .policy-section {
            margin-bottom: 44px;
          }
          .policy-p {
            font-size: 15px;
            color: #1B4F8A;
            line-height: 1.85;
            margin-bottom: 12px;
          }
          .policy-list {
            margin: 0 0 12px 0;
            padding-left: 24px;
          }
          .policy-list li {
            font-size: 15px;
            color: #1B4F8A;
            line-height: 1.85;
            margin-bottom: 6px;
          }
          .policy-subhead {
            font-size: 14px;
            font-weight: 700;
            color: #0A1628;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
        `}</style>

        {/* What we collect */}
        <div className="policy-section">
          <h2 className="policy-h2">What we collect</h2>
          <div className="policy-divider" />

          <p className="policy-subhead">You give us:</p>
          <ul className="policy-list">
            <li><strong>Account info:</strong> name, email, password, phone, address, business name (for contractors), license and insurance details (for contractors), veteran-status documentation if you claim a CVOB badge.</li>
            <li><strong>Project info:</strong> descriptions, photos, files, location, budget — anything you put into a Project or Bid.</li>
            <li><strong>Messages:</strong> what you write to other users through ONP.</li>
            <li><strong>Reviews and ratings:</strong> what you say about other users.</li>
            <li><strong>Payment info:</strong> your card or bank info goes to Stripe, not us. We just get back enough to know the payment worked.</li>
            <li><strong>Support requests:</strong> anything you send to support@ournextproject.us.</li>
          </ul>

          <p className="policy-subhead">We collect automatically:</p>
          <ul className="policy-list">
            <li>Device and browser info (type, OS, IP address, browser version).</li>
            <li>Usage info (pages you visit, what you click, how long you stay, what you search).</li>
            <li>Cookies and similar tech (see &ldquo;Cookies and tracking&rdquo; below).</li>
            <li>General location based on IP — not GPS-precise unless you give it.</li>
          </ul>

          <p className="policy-subhead">We get from others:</p>
          <ul className="policy-list">
            <li>License lookup results from state licensing agencies.</li>
            <li>BBB lookup results.</li>
            <li>CVOB verification results.</li>
            <li>Insurance certificate confirmations from your insurer or broker.</li>
          </ul>
        </div>

        {/* How we use it */}
        <div className="policy-section">
          <h2 className="policy-h2">How we use it</h2>
          <div className="policy-divider" />
          <p className="policy-p">We use your information to:</p>
          <ul className="policy-list">
            <li>Run and improve the Platform</li>
            <li>Verify contractors (license, insurance, BBB, CVOB)</li>
            <li>Match clients and contractors and process Bids</li>
            <li>Process payments through Stripe</li>
            <li>Send transactional emails (account, billing, project notifications)</li>
            <li>Send marketing emails about ONP news, features, and updates (you can opt out anytime)</li>
            <li>Show ads on the Platform</li>
            <li>Detect fraud, abuse, and violations of our Terms</li>
            <li>Comply with the law and enforce our agreements</li>
          </ul>
        </div>

        {/* Who we share it with */}
        <div className="policy-section">
          <h2 className="policy-h2">Who we share it with</h2>
          <div className="policy-divider" />

          <p className="policy-p">We share information with:</p>

          <ul className="policy-list">
            <li>
              <strong>Service providers</strong> that help us run ONP. The main ones:
              <ul style={{ marginTop: "6px" }}>
                <li><strong>Stripe</strong> — payment processing</li>
                <li><strong>Vercel</strong> — website hosting</li>
                <li><strong>Supabase</strong> — database and authentication</li>
                <li>Email service providers — to send you notifications and marketing emails</li>
                <li>Verification partners — for license, insurance, BBB, and CVOB checks</li>
              </ul>
            </li>
            <li style={{ marginTop: "10px" }}>
              <strong>Other users</strong> — your public profile, reviews, ratings, and Project/Bid details are visible to relevant counterparties (e.g., Contractors bidding on a Project see the Project; Clients see Contractor profiles).
            </li>
            <li style={{ marginTop: "10px" }}>
              <strong>Advertisers</strong> — we display ads from third parties like home improvement retailers and suppliers. Depending on the ad partner, they may use cookies or pixels to measure performance or to show you more relevant ads. We don&apos;t sell your name, email, or contact info to advertisers, but cookie-based ad activity can count as &ldquo;sale&rdquo; or &ldquo;sharing&rdquo; under some state privacy laws — see &ldquo;Your privacy choices&rdquo; below.
            </li>
            <li style={{ marginTop: "10px" }}>
              <strong>Legal and safety</strong> — if we have to share with law enforcement, courts, regulators, or to protect ONP, our users, or the public.
            </li>
            <li style={{ marginTop: "10px" }}>
              <strong>Business transfers</strong> — if ONP is acquired, merged, or sold (in whole or in part), your info may transfer along with the business.
            </li>
          </ul>

          <div style={{
            background: "#F0FDF4",
            border: "1px solid #86EFAC",
            borderRadius: "8px",
            padding: "14px 18px",
            fontSize: "14px",
            color: "#166534",
            marginTop: "16px",
          }}>
            <strong>We do not sell your personal information for money.</strong> Some ad-related sharing may qualify as &ldquo;sharing&rdquo; or &ldquo;sale&rdquo; under certain state laws — you can opt out below.
          </div>
        </div>

        {/* Marketing */}
        <div className="policy-section">
          <h2 className="policy-h2">Marketing emails and notifications</h2>
          <div className="policy-divider" />
          <ul className="policy-list">
            <li><strong>Transactional emails</strong> (account, payment, project alerts): part of using ONP — you can&apos;t opt out of these while you have an account.</li>
            <li><strong>News and updates:</strong> you can unsubscribe anytime using the link at the bottom of those emails, or by emailing support@ournextproject.us.</li>
          </ul>
        </div>

        {/* Cookies */}
        <div className="policy-section">
          <h2 className="policy-h2">Cookies and tracking</h2>
          <div className="policy-divider" />
          <p className="policy-p">
            We use cookies and similar technology to keep you logged in, remember preferences, understand how the Platform is used, and (with our ad partners) show you relevant ads.
          </p>
          <p className="policy-p">
            You can manage cookies through your browser settings. Disabling cookies may break some features.
          </p>
        </div>

        {/* Your privacy choices */}
        <div className="policy-section">
          <h2 className="policy-h2">Your privacy choices</h2>
          <div className="policy-divider" />
          <p className="policy-p">Depending on where you live, you may have these rights:</p>
          <ul className="policy-list">
            <li><strong>Access:</strong> ask what we have on you</li>
            <li><strong>Correct:</strong> fix wrong info</li>
            <li><strong>Delete:</strong> ask us to delete your info (some things we have to keep for legal or business reasons)</li>
            <li><strong>Portability:</strong> get your info in a usable file</li>
            <li><strong>Opt out of marketing:</strong> anytime</li>
            <li><strong>Opt out of &ldquo;sale&rdquo; or &ldquo;sharing&rdquo; of personal info</strong> (e.g., for targeted advertising, where applicable)</li>
          </ul>
          <p className="policy-p">
            To exercise any of these, email <strong>support@ournextproject.us</strong> with the request and your account info. We&apos;ll respond within the time required by law.
          </p>
          <p className="policy-p" style={{ fontStyle: "italic" }}>
            California, Colorado, Virginia, Connecticut, Utah, and other state residents: the{" "}
            <Link href="/privacy/legal" style={{ color: "#C8102E" }}>legal version of this policy</Link>{" "}
            has more detailed sections on your specific rights.
          </p>
        </div>

        {/* Children */}
        <div className="policy-section">
          <h2 className="policy-h2">Children</h2>
          <div className="policy-divider" />
          <p className="policy-p">
            ONP is for people <strong>18 and older</strong>. We don&apos;t knowingly collect info from anyone under 18. If you think a child has given us info, email us and we&apos;ll delete it.
          </p>
        </div>

        {/* Security */}
        <div className="policy-section">
          <h2 className="policy-h2">Security</h2>
          <div className="policy-divider" />
          <p className="policy-p">
            We use reasonable security measures (encryption in transit, access controls, secure hosting via Vercel and Supabase, payments through Stripe). No system is 100% secure — we can&apos;t guarantee absolute security, but we work to protect your data.
          </p>
        </div>

        {/* Data location */}
        <div className="policy-section">
          <h2 className="policy-h2">Where your data lives</h2>
          <div className="policy-divider" />
          <p className="policy-p">
            ONP is operated from the United States. By using the Platform, you understand your information is processed in the U.S.
          </p>
        </div>

        {/* Retention */}
        <div className="policy-section">
          <h2 className="policy-h2">How long we keep it</h2>
          <div className="policy-divider" />
          <p className="policy-p">
            We keep your data as long as your account is active and as long as needed to provide the Services, comply with the law, resolve disputes, and enforce our agreements. Reviews and ratings may stay on the Platform even after you close your account.
          </p>
        </div>

        {/* Changes */}
        <div className="policy-section">
          <h2 className="policy-h2">Changes to this policy</h2>
          <div className="policy-divider" />
          <p className="policy-p">
            We may update this Privacy Policy. We&apos;ll post the new version with a new &ldquo;Effective&rdquo; date. Material changes will be communicated by email or a Platform notice.
          </p>
        </div>

        {/* Contact */}
        <div className="policy-section">
          <h2 className="policy-h2">Contact us</h2>
          <div className="policy-divider" />
          <p className="policy-p">Privacy questions, requests, complaints:</p>
          <div style={{
            background: "#EEF4FF",
            border: "1px solid #B8D0E8",
            borderRadius: "8px",
            padding: "16px 20px",
            fontSize: "15px",
            color: "#0A1628",
            lineHeight: 1.8,
          }}>
            <strong>Our Next Project, LLC</strong><br />
            [BUSINESS ADDRESS]<br />
            <a href="mailto:support@ournextproject.us" style={{ color: "#1B4F8A" }}>support@ournextproject.us</a>
          </div>
        </div>

        {/* Cross-link */}
        <div style={{
          borderTop: "1px solid #B8D0E8",
          paddingTop: "32px",
          textAlign: "center",
        }}>
          <p style={{ fontSize: "13px", color: "#4A7FB5", marginBottom: "12px" }}>
            Need the full legal language?
          </p>
          <Link href="/privacy/legal" style={{
            display: "inline-block",
            background: "transparent",
            color: "#1B4F8A",
            border: "1px solid #B8D0E8",
            padding: "10px 24px",
            borderRadius: "6px",
            fontSize: "13px",
            textDecoration: "none",
            fontWeight: 500,
          }}>
            View Full Legal Privacy Policy →
          </Link>
        </div>

      </main>

      {/* Footer */}
      <footer style={{
        borderTop: "1px solid #B8D0E8",
        padding: "20px 28px",
        textAlign: "center",
        fontSize: "12px",
        color: "#4A7FB5",
        letterSpacing: "1px",
        textTransform: "uppercase",
      }}>
        © {new Date().getFullYear()} Our Next Project — Honoring American Veterans
      </footer>
    </div>
  );
}
