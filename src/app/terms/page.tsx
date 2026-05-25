import Link from "next/link";

export const metadata = { title: "Terms of Service — Our Next Project" };

export default function TermsPage() {
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
            Terms of Service
          </h1>
          <div style={{ width: "60px", height: "3px", background: "#C8102E", marginBottom: "20px" }} />
          <p style={{ fontSize: "14px", color: "#4A7FB5", marginBottom: "4px" }}>
            <strong>Our Next Project, LLC</strong>
          </p>
          <p style={{ fontSize: "14px", color: "#4A7FB5", marginBottom: "20px" }}>
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
            Welcome to Our Next Project. We&apos;ve written these terms in plain English so they&apos;re easy to read. There&apos;s also a{" "}
            <Link href="/terms/legal" style={{ color: "#C8102E", fontWeight: 600 }}>full legal version</Link>
            {" "}with the formal language — if anything below conflicts with the legal version, the legal version is what controls. By creating an account or using our site, you agree to both.
          </div>
        </div>

        <style>{`
          .terms-h2 {
            font-family: 'Barlow Condensed', sans-serif;
            font-weight: 700;
            font-size: 26px;
            letter-spacing: 1px;
            color: #0A1628;
            text-transform: uppercase;
            margin: 0 0 6px 0;
          }
          .terms-divider {
            width: 36px;
            height: 2px;
            background: #C8102E;
            margin-bottom: 18px;
          }
          .terms-section {
            margin-bottom: 44px;
          }
          .terms-p {
            font-size: 15px;
            color: #1B4F8A;
            line-height: 1.85;
            margin-bottom: 12px;
          }
          .terms-list {
            margin: 0 0 12px 0;
            padding-left: 24px;
          }
          .terms-list li {
            font-size: 15px;
            color: #1B4F8A;
            line-height: 1.85;
            margin-bottom: 8px;
          }
          .terms-subhead {
            font-size: 15px;
            font-weight: 700;
            color: #0A1628;
            margin: 20px 0 8px 0;
          }
        `}</style>

        {/* Section 1 */}
        <div className="terms-section">
          <h2 className="terms-h2">1. What ONP is (and what it isn&apos;t)</h2>
          <div className="terms-divider" />
          <p className="terms-p">
            ONP is an online marketplace. We help clients (homeowners and small businesses) find and connect with contractors through a sealed bidding process. We also offer optional paid inspections.
          </p>
          <div style={{
            background: "#FEF2F2",
            border: "1px solid #FCA5A5",
            borderRadius: "8px",
            padding: "16px 20px",
            fontSize: "15px",
            color: "#991B1B",
            lineHeight: 1.8,
            marginBottom: "12px",
          }}>
            <strong>Here&apos;s the most important thing to understand:</strong>
            <br /><br />
            We are a platform — we are not your contractor, your client, or a party to any project. We don&apos;t perform the work, we don&apos;t hire the contractors, we don&apos;t supervise the job, we don&apos;t handle the money between you, and we don&apos;t guarantee anyone&apos;s results. Any agreement to do work is between the client and the contractor directly. We connect you. After that, you&apos;re on your own to negotiate, contract, perform, pay, and resolve disputes.
          </div>
          <p className="terms-p" style={{ fontStyle: "italic", fontSize: "13px" }}>
            We may add direct payment processing in the future. When we do, we&apos;ll update these terms.
          </p>
        </div>

        {/* Section 2 */}
        <div className="terms-section">
          <h2 className="terms-h2">2. Who can use ONP</h2>
          <div className="terms-divider" />
          <ul className="terms-list">
            <li>You must be <strong>18 or older</strong>.</li>
            <li>You must provide accurate information and keep it up to date.</li>
            <li>You&apos;re responsible for keeping your password secure and for everything that happens under your account.</li>
            <li>If you sign up on behalf of a business, you&apos;re saying you have authority to bind that business.</li>
          </ul>
        </div>

        {/* Section 3 */}
        <div className="terms-section">
          <h2 className="terms-h2">3. Two kinds of accounts</h2>
          <div className="terms-divider" />

          <p className="terms-subhead">Clients</p>
          <p className="terms-p">
            You can post projects, receive bids, request paid inspections, message contractors, award projects, and leave reviews of contractors you&apos;ve worked with.
          </p>

          <p className="terms-subhead">Contractors</p>
          <p className="terms-p">
            You can browse projects, submit sealed bids, message clients, and (subject to verification) display badges on your profile. To be active on ONP, contractors must maintain a current paid subscription.
          </p>
        </div>

        {/* Section 4 */}
        <div className="terms-section">
          <h2 className="terms-h2">4. Contractor verification — what we check and what it means</h2>
          <div className="terms-divider" />
          <p className="terms-p">Before activating a contractor account, we check:</p>
          <ul className="terms-list">
            <li><strong>License lookup</strong> — we verify the license through the issuing state or licensing authority.</li>
            <li><strong>Insurance certification</strong> — we ask for a current certificate of insurance.</li>
            <li><strong>Better Business Bureau (BBB)</strong> — we look up the business with the BBB.</li>
            <li><strong>Certified Veteran Owned Business (CVOB)</strong> — if a contractor claims veteran-owned status, we verify it before displaying the badge.</li>
          </ul>
          <div style={{
            background: "#FFFBEB",
            border: "1px solid #FDE68A",
            borderRadius: "8px",
            padding: "14px 18px",
            fontSize: "14px",
            color: "#92400E",
            lineHeight: 1.75,
            marginTop: "4px",
          }}>
            <strong>What this means:</strong> We do a good-faith check of these things at the time of onboarding. We do not continuously monitor licenses, insurance, or business standing. Verification is not a guarantee of competence, honesty, work quality, or that the contractor&apos;s status hasn&apos;t changed since we last checked. Clients are responsible for doing their own due diligence before hiring.
          </div>
        </div>

        {/* Section 5 */}
        <div className="terms-section">
          <h2 className="terms-h2">5. Fees and payments</h2>
          <div className="terms-divider" />

          <p className="terms-subhead">Contractor subscriptions</p>
          <p className="terms-p">
            Contractors pay a recurring subscription fee to use ONP. We charge it through Stripe. Subscriptions auto-renew until you cancel.
          </p>

          <p className="terms-subhead">Inspector requests</p>
          <p className="terms-p">Clients can request a paid inspection. The fee is charged at the time of request.</p>

          <p className="terms-subhead">No refunds</p>
          <div style={{
            background: "#FEF2F2",
            border: "1px solid #FCA5A5",
            borderRadius: "8px",
            padding: "14px 18px",
            fontSize: "14px",
            color: "#991B1B",
            lineHeight: 1.75,
            marginBottom: "12px",
          }}>
            <strong>All fees are non-refundable.</strong> That includes:
            <ul style={{ margin: "8px 0 0 20px", padding: 0 }}>
              <li>Contractor subscription fees (any unused time is forfeited)</li>
              <li>Inspector request fees (once the inspection is requested, the fee is earned)</li>
            </ul>
          </div>
          <p className="terms-p">
            If a contractor cancels a subscription, they keep access until the end of the current billing period and are not charged again.
          </p>

          <p className="terms-subhead">Payments between clients and contractors</p>
          <p className="terms-p">
            <strong>We do not currently handle payments between clients and contractors.</strong> Any money that changes hands for project work happens directly between you two, outside ONP. We are not responsible for those payments, refunds, chargebacks, or disputes.
          </p>
        </div>

        {/* Section 6 */}
        <div className="terms-section">
          <h2 className="terms-h2">6. Reviews and ratings</h2>
          <div className="terms-divider" />
          <p className="terms-p">
            Clients can review contractors. Contractors can review clients. Reviews must be honest, based on actual experience, and not defamatory, harassing, or unrelated to the project.
          </p>
          <p className="terms-p">
            We don&apos;t pre-screen reviews, but we can remove them if they violate these terms. We may display reviews publicly and use them in aggregated ratings.
          </p>
        </div>

        {/* Section 7 */}
        <div className="terms-section">
          <h2 className="terms-h2">7. Your content</h2>
          <div className="terms-divider" />
          <p className="terms-p">
            When you post projects, bids, messages, photos, files, or reviews, you keep ownership. But you give us a license to display, store, copy, and share that content as needed to operate ONP and promote the platform. You promise that your content is yours to post and doesn&apos;t violate anyone&apos;s rights.
          </p>
        </div>

        {/* Section 8 */}
        <div className="terms-section">
          <h2 className="terms-h2">8. What you can&apos;t do</h2>
          <div className="terms-divider" />
          <p className="terms-p">Don&apos;t:</p>
          <ul className="terms-list">
            <li>Post false, misleading, defamatory, or illegal content</li>
            <li>Try to do deals off-platform to dodge fees</li>
            <li>Misrepresent your license, insurance, or veteran status</li>
            <li>Manipulate reviews (fake reviews, paid reviews, review trading)</li>
            <li>Try to scrape, hack, reverse engineer, or break the platform</li>
            <li>Use ONP for anything illegal, harassing, or harmful</li>
            <li>Share your account with others</li>
          </ul>
          <p className="terms-p">We can suspend or terminate accounts that violate these rules.</p>
        </div>

        {/* Section 9 */}
        <div className="terms-section">
          <h2 className="terms-h2">9. Advertising and third-party links</h2>
          <div className="terms-divider" />
          <p className="terms-p">
            ONP shows ads from third parties — for example, home improvement suppliers like Lowe&apos;s, The Home Depot, paint and tile retailers, and others. Those ads, products, and any sites they link to are not ours, and we don&apos;t endorse them or take responsibility for what happens if you click through and buy something.
          </p>
        </div>

        {/* Section 10 */}
        <div className="terms-section">
          <h2 className="terms-h2">10. Inspector services</h2>
          <div className="terms-divider" />
          <p className="terms-p">
            When a client requests an inspection, an inspector visits the property and provides a report. Inspectors may be ONP employees or independent contractors we work with. Inspections give you information; they are not warranties, structural certifications, or guarantees about the property or the work. Use the report as one input — not the final word.
          </p>
        </div>

        {/* Section 11 */}
        <div className="terms-section">
          <h2 className="terms-h2">11. Termination</h2>
          <div className="terms-divider" />
          <p className="terms-p">
            You can close your account anytime. We can suspend or close any account for any reason, especially for breaking these terms, with or without notice. Any fees already paid are non-refundable when accounts are closed.
          </p>
        </div>

        {/* Section 12 */}
        <div className="terms-section">
          <h2 className="terms-h2">12. Disclaimers — important</h2>
          <div className="terms-divider" />
          <p className="terms-p">ONP is provided <strong>&ldquo;as is&rdquo; and &ldquo;as available.&rdquo;</strong> We don&apos;t promise:</p>
          <ul className="terms-list">
            <li>That the platform will always work or be error-free</li>
            <li>That contractors will be skilled, honest, or finish the job</li>
            <li>That clients will pay</li>
            <li>That bids are accurate</li>
            <li>That inspection reports catch every issue</li>
            <li>That any information on the site is correct or current</li>
          </ul>
          <p className="terms-p">
            Use ONP at your own risk. <strong>You are responsible for your own decisions about who to hire, what to pay, and how to manage your project.</strong>
          </p>
        </div>

        {/* Section 13 */}
        <div className="terms-section">
          <h2 className="terms-h2">13. Limitation of liability</h2>
          <div className="terms-divider" />
          <p className="terms-p">
            To the maximum extent allowed by law, <strong>we are not liable</strong> for indirect, incidental, consequential, special, or punitive damages, lost profits, lost data, or harm caused by other users (contractors, clients, inspectors, or third parties). If we are found liable for anything, our <strong>total liability is capped</strong> at the greater of (a) the total fees you paid ONP in the 12 months before the claim, or (b) $100.
          </p>
        </div>

        {/* Section 14 */}
        <div className="terms-section">
          <h2 className="terms-h2">14. You&apos;ll cover us if you cause a problem (indemnification)</h2>
          <div className="terms-divider" />
          <p className="terms-p">
            If your use of ONP, your content, or your project causes a third party to come after us with a claim, you&apos;ll defend us and pay our costs and damages.
          </p>
        </div>

        {/* Section 15 — Arbitration */}
        <div className="terms-section">
          <h2 className="terms-h2">15. Arbitration and class action waiver — please read</h2>
          <div className="terms-divider" />
          <div style={{
            background: "#0A1628",
            borderRadius: "8px",
            padding: "20px 24px",
            fontSize: "14px",
            color: "#FFFFFF",
            lineHeight: 1.8,
            marginBottom: "16px",
          }}>
            <strong>Read this section carefully — it affects your legal rights.</strong>
            <br /><br />
            <strong>You and ONP agree that any dispute will be resolved by binding individual arbitration, not in court, and not as part of a class action.</strong>
            <br /><br />
            <ul style={{ margin: "0", paddingLeft: "20px" }}>
              <li style={{ marginBottom: "8px" }}>Arbitration is handled by the American Arbitration Association (AAA) under its Consumer Arbitration Rules.</li>
              <li style={{ marginBottom: "8px" }}>Location: El Paso County, Texas (or by phone/video where allowed).</li>
              <li style={{ marginBottom: "8px" }}><strong>You waive your right to a jury trial and your right to participate in a class action, collective action, or representative action against ONP.</strong></li>
              <li style={{ marginBottom: "8px" }}>You can opt out of this arbitration clause within <strong>30 days</strong> of first agreeing to these terms by emailing us at support@ournextproject.us with your name, account email, and the words &ldquo;Arbitration Opt-Out.&rdquo; If you opt out, the rest of these terms still apply.</li>
              <li><strong>Exceptions:</strong> Either of us can still bring (1) claims in small claims court that qualify, and (2) claims for injunctive relief related to intellectual property or unauthorized platform access.</li>
            </ul>
          </div>
          <p className="terms-p" style={{ fontSize: "13px", color: "#4A7FB5" }}>
            If the class action waiver is ever held unenforceable, the arbitration agreement as a whole won&apos;t apply to that specific claim.
          </p>
        </div>

        {/* Section 16 */}
        <div className="terms-section">
          <h2 className="terms-h2">16. Governing law</h2>
          <div className="terms-divider" />
          <p className="terms-p">
            These terms are governed by the laws of the <strong>State of Texas</strong>, without regard to its conflict-of-laws rules. For anything that does end up in court (e.g., the carve-outs above), the venue is El Paso County, Texas.
          </p>
        </div>

        {/* Section 17 */}
        <div className="terms-section">
          <h2 className="terms-h2">17. Changes to these terms</h2>
          <div className="terms-divider" />
          <p className="terms-p">
            We may update these terms. If we make material changes, we&apos;ll post a notice on the site or email you. Continuing to use ONP after the changes means you accept the new terms.
          </p>
        </div>

        {/* Section 18 */}
        <div className="terms-section">
          <h2 className="terms-h2">18. Other legal stuff</h2>
          <div className="terms-divider" />
          <ul className="terms-list">
            <li>These terms (plus the <Link href="/terms/legal" style={{ color: "#C8102E" }}>legal version</Link> and our <Link href="/privacy" style={{ color: "#C8102E" }}>Privacy Policy</Link>) are the entire agreement between us.</li>
            <li>If any part is found unenforceable, the rest still applies.</li>
            <li>We can assign these terms; you can&apos;t without our consent.</li>
            <li>Our not enforcing a right one time doesn&apos;t mean we&apos;ve given it up.</li>
          </ul>
        </div>

        {/* Section 19 */}
        <div className="terms-section">
          <h2 className="terms-h2">19. How to reach us</h2>
          <div className="terms-divider" />
          <p className="terms-p">Questions, complaints, legal notices:</p>
          <div style={{
            background: "#EEF4FF",
            border: "1px solid #B8D0E8",
            borderRadius: "8px",
            padding: "16px 20px",
            fontSize: "15px",
            color: "#0A1628",
            lineHeight: 1.9,
          }}>
            <strong>Our Next Project, LLC</strong><br />
            [BUSINESS ADDRESS]<br />
            <a href="mailto:support@ournextproject.us" style={{ color: "#1B4F8A" }}>support@ournextproject.us</a>
          </div>
        </div>

        {/* Cross-link */}
        <div style={{ borderTop: "1px solid #B8D0E8", paddingTop: "32px", textAlign: "center" }}>
          <p style={{ fontSize: "13px", color: "#4A7FB5", marginBottom: "12px" }}>
            Need the full legal language?
          </p>
          <Link href="/terms/legal" style={{
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
            View Full Legal Terms of Service →
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
