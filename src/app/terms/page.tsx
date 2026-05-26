import Link from "next/link";

export const metadata = { title: "Terms of Service — Our Next Project" };

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
  marginBottom: "8px",
};
const subheadStyle: React.CSSProperties = {
  fontSize: "15px",
  fontWeight: 700,
  color: "#0A1628",
  margin: "20px 0 8px 0",
};

export default function TermsPage() {
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
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "48px", color: "#0A1628", marginBottom: "8px", lineHeight: 1.1 }}>Terms of Service</h1>
          <div style={{ width: "60px", height: "3px", background: "#C8102E", marginBottom: "20px" }} />
          <p style={{ fontSize: "14px", color: "#4A7FB5", marginBottom: "4px" }}><strong>Our Next Project, LLC</strong></p>
          <p style={{ fontSize: "14px", color: "#4A7FB5", marginBottom: "20px" }}>Effective: [EFFECTIVE DATE]</p>
          <div style={{ background: "#EEF4FF", border: "1px solid #B8D0E8", borderRadius: "8px", padding: "16px 20px", fontSize: "14px", color: "#1B4F8A", lineHeight: 1.7 }}>
            Plain English version. There&apos;s also a{" "}
            <Link href="/terms/legal" style={{ color: "#C8102E", fontWeight: 600 }}>full legal version</Link>
            {" "}— if anything conflicts, the legal version controls. By creating an account or using our site, you agree to both.
          </div>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>1. What ONP is (and what it isn&apos;t)</h2>
          <div style={dividerStyle} />
          <p style={pStyle}>ONP is an online marketplace connecting clients (homeowners and small businesses) with contractors through a sealed bidding process. We also offer optional paid inspections.</p>
          <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: "8px", padding: "16px 20px", fontSize: "15px", color: "#991B1B", lineHeight: 1.8, marginBottom: "12px" }}>
            <strong>Most important:</strong> We are a platform — not your contractor, client, or a party to any project. We don&apos;t perform work, hire contractors, supervise jobs, handle money between users, or guarantee results. Any agreement to do work is directly between the client and the contractor.
          </div>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>2. Who can use ONP</h2>
          <div style={dividerStyle} />
          <ul style={{ paddingLeft: "24px" }}>
            <li style={liStyle}>You must be <strong>18 or older</strong>.</li>
            <li style={liStyle}>You must provide accurate information and keep it up to date.</li>
            <li style={liStyle}>You&apos;re responsible for keeping your password secure and for everything that happens under your account.</li>
            <li style={liStyle}>If you sign up on behalf of a business, you&apos;re confirming you have authority to bind that business.</li>
          </ul>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>3. Two kinds of accounts</h2>
          <div style={dividerStyle} />
          <p style={subheadStyle}>Clients</p>
          <p style={pStyle}>Post projects, receive bids, request paid inspections, message contractors, award projects, and leave reviews.</p>
          <p style={subheadStyle}>Contractors</p>
          <p style={pStyle}>Browse projects, submit sealed bids, message clients, and (subject to verification) display badges on your profile. Contractors must maintain a current paid subscription to bid.</p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>4. Contractor verification</h2>
          <div style={dividerStyle} />
          <p style={pStyle}>Before activating a contractor account, we check:</p>
          <ul style={{ paddingLeft: "24px", marginBottom: "12px" }}>
            <li style={liStyle}><strong>License lookup</strong> — verified through the issuing state or licensing authority.</li>
            <li style={liStyle}><strong>Insurance certification</strong> — current certificate of insurance required.</li>
            <li style={liStyle}><strong>Better Business Bureau (BBB)</strong> — business lookup.</li>
            <li style={liStyle}><strong>Certified Veteran Owned Business (CVOB)</strong> — verified before displaying the badge.</li>
          </ul>
          <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: "8px", padding: "14px 18px", fontSize: "14px", color: "#92400E", lineHeight: 1.75 }}>
            <strong>What this means:</strong> We check these at onboarding. We do not continuously monitor. Verification is not a guarantee of competence, honesty, or current status. Clients are responsible for their own due diligence before hiring.
          </div>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>5. Fees and payments</h2>
          <div style={dividerStyle} />
          <p style={subheadStyle}>Contractor subscriptions</p>
          <p style={pStyle}>Recurring subscription fee charged through Stripe. Auto-renews until cancelled.</p>
          <p style={subheadStyle}>Inspector requests</p>
          <p style={pStyle}>Inspection fee charged at the time of request.</p>
          <p style={subheadStyle}>No refunds</p>
          <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: "8px", padding: "14px 18px", fontSize: "14px", color: "#991B1B", lineHeight: 1.75, marginBottom: "12px" }}>
            <strong>All fees are non-refundable</strong> — including subscription fees (unused time is forfeited) and inspection fees (earned upon request). <strong>Exception:</strong> on-site inspection upgrade fees may be refunded if a dispute is successfully resolved through the ONP Upgrade Dispute process (see Legal Terms §5.3(c)).
          </div>
          <p style={subheadStyle}>Payments between clients and contractors</p>
          <p style={pStyle}><strong>We do not handle payments between clients and contractors.</strong> Those happen directly between you, outside ONP. We are not responsible for those payments or disputes.</p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>6. Reviews and ratings</h2>
          <div style={dividerStyle} />
          <p style={pStyle}>Clients can review contractors; contractors can review clients. Reviews must be honest, based on actual experience, and not defamatory or harassing. We can remove reviews that violate these terms.</p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>7. Your content</h2>
          <div style={dividerStyle} />
          <p style={pStyle}>You keep ownership of what you post. You give us a license to display, store, copy, and share that content as needed to operate and promote ONP. You confirm your content is yours to post and doesn&apos;t violate anyone&apos;s rights.</p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>8. What you can&apos;t do</h2>
          <div style={dividerStyle} />
          <ul style={{ paddingLeft: "24px" }}>
            <li style={liStyle}>Post false, misleading, defamatory, or illegal content</li>
            <li style={liStyle}>Try to do deals off-platform to dodge fees</li>
            <li style={liStyle}>Misrepresent your license, insurance, or veteran status</li>
            <li style={liStyle}>Manipulate reviews (fake reviews, paid reviews, review trading)</li>
            <li style={liStyle}>Scrape, hack, reverse engineer, or break the platform</li>
            <li style={liStyle}>Use ONP for anything illegal, harassing, or harmful</li>
            <li style={liStyle}>Share your account with others</li>
          </ul>
          <p style={pStyle}>We can suspend or terminate accounts that violate these rules.</p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>9. Advertising and third-party links</h2>
          <div style={dividerStyle} />
          <p style={pStyle}>ONP shows ads from third parties — for example, home improvement suppliers like Lowe&apos;s, The Home Depot, and others. Those ads and any sites they link to are not ours. We don&apos;t endorse them or take responsibility for purchases you make through them.</p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>10. Inspector services</h2>
          <div style={dividerStyle} />
          <p style={pStyle}>When a client requests an inspection, an inspector visits the property and provides a report. Inspections give you information — they are not warranties, structural certifications, or guarantees. Use the report as one input, not the final word.</p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>11. Termination</h2>
          <div style={dividerStyle} />
          <p style={pStyle}>You can close your account anytime. We can suspend or close any account for any reason, especially for breaking these terms, with or without notice. All fees paid are non-refundable on closure.</p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>12. Disclaimers</h2>
          <div style={dividerStyle} />
          <p style={pStyle}>ONP is provided <strong>&ldquo;as is&rdquo; and &ldquo;as available.&rdquo;</strong> We don&apos;t promise the platform will be error-free, that contractors will be skilled or honest, that clients will pay, that bids are accurate, or that inspection reports catch every issue. <strong>You are responsible for your own decisions.</strong></p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>13. Limitation of liability</h2>
          <div style={dividerStyle} />
          <p style={pStyle}>To the maximum extent allowed by law, we are not liable for indirect, incidental, consequential, special, or punitive damages. Our <strong>total liability is capped</strong> at the greater of (a) fees you paid ONP in the prior 12 months, or (b) $100.</p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>14. Indemnification</h2>
          <div style={dividerStyle} />
          <p style={pStyle}>If your use of ONP, your content, or your project causes a third party to make a claim against us, you&apos;ll defend us and cover our costs and damages.</p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>15. Arbitration and class action waiver</h2>
          <div style={dividerStyle} />
          <div style={{ background: "#0A1628", borderRadius: "8px", padding: "20px 24px", fontSize: "14px", color: "#FFFFFF", lineHeight: 1.8, marginBottom: "16px" }}>
            <strong>Read carefully — this affects your legal rights.</strong>
            <br /><br />
            You and ONP agree that any dispute will be resolved by <strong>binding individual arbitration, not in court, and not as a class action.</strong>
            <ul style={{ marginTop: "12px", paddingLeft: "20px" }}>
              <li style={{ marginBottom: "8px", color: "#FFFFFF" }}>Arbitration handled by the AAA under its Consumer Arbitration Rules.</li>
              <li style={{ marginBottom: "8px", color: "#FFFFFF" }}>Location: El Paso County, Texas (or by phone/video where allowed).</li>
              <li style={{ marginBottom: "8px", color: "#FFFFFF" }}><strong>You waive your right to a jury trial and to participate in a class action against ONP.</strong></li>
              <li style={{ marginBottom: "8px", color: "#FFFFFF" }}>You can opt out within <strong>30 days</strong> of first agreeing by emailing support@ournextproject.us with your name, account email, and &ldquo;Arbitration Opt-Out.&rdquo;</li>
              <li style={{ color: "#FFFFFF" }}><strong>Exceptions:</strong> small claims court and injunctive relief for IP / platform access.</li>
            </ul>
          </div>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>16. Governing law</h2>
          <div style={dividerStyle} />
          <p style={pStyle}>Governed by the laws of the <strong>State of Texas</strong>. Venue for any court proceedings: El Paso County, Texas.</p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>17. Changes to these terms</h2>
          <div style={dividerStyle} />
          <p style={pStyle}>We may update these terms. If we make material changes, we&apos;ll post a notice on the site or email you. Continuing to use ONP after changes means you accept them.</p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>18. Other legal stuff</h2>
          <div style={dividerStyle} />
          <ul style={{ paddingLeft: "24px" }}>
            <li style={liStyle}>These terms (plus the <Link href="/terms/legal" style={{ color: "#C8102E" }}>legal version</Link> and our <Link href="/privacy" style={{ color: "#C8102E" }}>Privacy Policy</Link>) are the entire agreement between us.</li>
            <li style={liStyle}>If any part is unenforceable, the rest still applies.</li>
            <li style={liStyle}>We can assign these terms; you can&apos;t without our consent.</li>
            <li style={liStyle}>Our not enforcing a right one time doesn&apos;t mean we&apos;ve given it up.</li>
          </ul>
        </div>

        <div style={{ marginBottom: "44px" }}>
          <h2 style={h2Style}>19. How to reach us</h2>
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
          <Link href="/terms/legal" style={{ display: "inline-block", color: "#1B4F8A", border: "1px solid #B8D0E8", padding: "10px 24px", borderRadius: "6px", fontSize: "13px", textDecoration: "none", fontWeight: 500 }}>
            View Full Legal Terms of Service →
          </Link>
        </div>
      </main>

      <div style={{ borderTop: "1px solid #B8D0E8", padding: "20px 28px", textAlign: "center", fontSize: "12px", color: "#4A7FB5", letterSpacing: "1px", textTransform: "uppercase" }}>
        © 2026 Our Next Project — Honoring American Veterans
      </div>
    </div>
  );
}
