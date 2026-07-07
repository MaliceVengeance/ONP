import Link from "next/link";

export const metadata = { title: "Terms of Service (Legal) — Our Next Project" };

const h2Style: React.CSSProperties = {
  fontFamily: "'Barlow Condensed', sans-serif",
  fontWeight: 700,
  fontSize: "24px",
  letterSpacing: "1px",
  color: "#1E3A8A",
  textTransform: "uppercase",
  margin: "0 0 6px 0",
};
const h3Style: React.CSSProperties = {
  fontSize: "15px",
  fontWeight: 700,
  color: "#1E3A8A",
  margin: "20px 0 8px 0",
};
const dividerStyle: React.CSSProperties = {
  width: "36px",
  height: "2px",
  background: "#C8102E",
  marginBottom: "18px",
};
const sectionStyle: React.CSSProperties = {
  marginBottom: "44px",
  paddingBottom: "44px",
  borderBottom: "1px solid #EEF4FF",
};
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
const capsStyle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 700,
  color: "#1E3A8A",
  lineHeight: 1.8,
  marginBottom: "12px",
};

export default function TermsLegalPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#FFFFFF", color: "#1E3A8A", fontFamily: "'Barlow', sans-serif" }}>
      {/* Header */}
      <header style={{ background: "#1E3A8A", borderBottom: "2px solid #C8102E", padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/login" style={{ textDecoration: "none" }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: "26px", letterSpacing: "2px", color: "#fff", display: "flex", alignItems: "center", gap: "8px" }}>
            <span>★</span> ONP
          </div>
          <div style={{ fontSize: "11px", letterSpacing: "3px", color: "#FFFFFF", textTransform: "uppercase" }}>Our Next Project</div>
        </Link>
        <Link href="/login" style={{ background: "transparent", color: "#FFFFFF", border: "1px solid #1B4F8A", padding: "8px 20px", borderRadius: "6px", fontSize: "13px", textDecoration: "none" }}>Sign In</Link>
      </header>

      <main style={{ maxWidth: "820px", margin: "0 auto", padding: "60px 24px 80px" }}>
        {/* Title */}
        <div style={{ marginBottom: "40px" }}>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "44px", color: "#1E3A8A", marginBottom: "8px", lineHeight: 1.1 }}>Terms of Service</h1>
          <div style={{ width: "60px", height: "3px", background: "#C8102E", marginBottom: "20px" }} />
          <p style={{ fontSize: "14px", color: "#4A7FB5", marginBottom: "4px" }}><strong>Our Next Project, LLC</strong></p>
          <p style={{ fontSize: "14px", color: "#4A7FB5", marginBottom: "4px" }}>Effective Date: [EFFECTIVE DATE]</p>
          <p style={{ fontSize: "14px", color: "#4A7FB5", marginBottom: "20px" }}>Last Updated: [LAST UPDATED DATE]</p>
          <p style={pStyle}>These Terms of Service (the &ldquo;<strong>Terms</strong>&rdquo;) constitute a binding legal agreement between you and <strong>Our Next Project, LLC</strong>, a Texas limited liability company (&ldquo;<strong>ONP</strong>&rdquo;), governing your access to and use of the website at ournextproject.us and related services (the &ldquo;<strong>Platform</strong>&rdquo;).</p>
          <p style={pStyle}>A plain-English summary is available <Link href="/terms" style={{ color: "#C8102E" }}>here</Link>. In the event of any conflict, <strong>these Terms control.</strong></p>
          <div style={{ background: "#1E3A8A", borderRadius: "8px", padding: "16px 20px", fontSize: "13px", color: "#FFFFFF", fontWeight: 600, lineHeight: 1.7, marginBottom: "12px" }}>
            BY CREATING AN ACCOUNT, ACCESSING, OR USING THE PLATFORM, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY THESE TERMS AND BY OUR{" "}
            <Link href="/privacy/legal" style={{ color: "#B8D0E8" }}>PRIVACY POLICY</Link>.
            {" "}IF YOU DO NOT AGREE, DO NOT USE THE PLATFORM.
          </div>
          <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: "8px", padding: "14px 18px", fontSize: "13px", color: "#991B1B", fontWeight: 600, lineHeight: 1.7 }}>
            SECTION 15 CONTAINS A BINDING ARBITRATION AGREEMENT, A CLASS ACTION WAIVER, AND A JURY TRIAL WAIVER. PLEASE READ IT CAREFULLY.
          </div>
        </div>

        {/* Section 1 */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>1. Definitions</h2>
          <div style={dividerStyle} />
          <ul style={{ paddingLeft: "24px" }}>
            <li style={liStyle}><strong>1.1 &ldquo;Bid&rdquo;</strong> — a proposal submitted by a Contractor in response to a Project posted by a Client.</li>
            <li style={liStyle}><strong>1.2 &ldquo;Client&rdquo;</strong> — a User who posts Projects and/or requests Inspections.</li>
            <li style={liStyle}><strong>1.3 &ldquo;Content&rdquo;</strong> — any text, images, files, video, project descriptions, Bids, messages, reviews, ratings, or other materials submitted to or generated on the Platform.</li>
            <li style={liStyle}><strong>1.4 &ldquo;Contractor&rdquo;</strong> — a User who maintains a paid subscription and submits Bids on Projects.</li>
            <li style={liStyle}><strong>1.5 &ldquo;CVOB&rdquo;</strong> — Certified Veteran Owned Business.</li>
            <li style={liStyle}><strong>1.6 &ldquo;Inspection&rdquo;</strong> — a paid property inspection requested by a Client and performed by an Inspector.</li>
            <li style={liStyle}><strong>1.7 &ldquo;Inspector&rdquo;</strong> — a person designated by ONP to perform Inspections, whether an employee or independent contractor.</li>
            <li style={liStyle}><strong>1.8 &ldquo;Project&rdquo;</strong> — a job or scope of work posted by a Client.</li>
            <li style={liStyle}><strong>1.9 &ldquo;Subscription&rdquo;</strong> — a recurring paid plan granting a Contractor access to bid on the Platform.</li>
            <li style={liStyle}><strong>1.10 &ldquo;User&rdquo;</strong> — any person who accesses or uses the Platform, including Clients, Contractors, and visitors.</li>
          </ul>
        </div>

        {/* Section 2 */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>2. Nature of the Platform; Disclaimer of Agency</h2>
          <div style={dividerStyle} />
          <p style={pStyle}><strong>2.1 Marketplace Only.</strong> The Platform facilitates the introduction of Clients and Contractors and the optional procurement of Inspections. ONP does not perform contracting services, employ or endorse any Contractor, and is not a party to any transaction between a Client and a Contractor.</p>
          <p style={pStyle}><strong>2.2 No Agency.</strong> No agency, partnership, joint venture, employer-employee, franchise, or fiduciary relationship is created between ONP and any User.</p>
          <p style={pStyle}><strong>2.3 No Payment Processing Between Users.</strong> ONP does <strong>not</strong> receive, hold, or process funds exchanged between Clients and Contractors for Project work. All such payments are made directly between them, outside the Platform. ONP bears no responsibility for those payments, non-payments, refunds, chargebacks, fraud, or disputes.</p>
          <p style={pStyle}><strong>2.4 Independent Judgment Required.</strong> Users are solely responsible for evaluating the qualifications, fitness, legality, safety, and reliability of any counterparty, Bid, Project, or work product.</p>
        </div>

        {/* Section 3 */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>3. Eligibility and Accounts</h2>
          <div style={dividerStyle} />
          <p style={pStyle}><strong>3.1 Age.</strong> You must be at least <strong>18 years of age</strong> and capable of forming a legally binding contract.</p>
          <p style={pStyle}><strong>3.2 Accurate Information.</strong> You agree to provide accurate, current, and complete information and to keep it updated.</p>
          <p style={pStyle}><strong>3.3 Authority to Bind Entities.</strong> If you register on behalf of a business entity, you represent that you are authorized to bind that entity.</p>
          <p style={pStyle}><strong>3.4 Account Security.</strong> You are responsible for all activity under your account and must notify ONP immediately of any unauthorized use.</p>
          <p style={pStyle}><strong>3.5 One Account.</strong> You may not maintain more than one account or transfer your account without ONP&apos;s written consent.</p>
        </div>

        {/* Section 4 */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>4. Contractor Verification</h2>
          <div style={dividerStyle} />
          <p style={pStyle}><strong>4.1 Scope of Verification.</strong> Prior to activating a Contractor account, ONP will perform a good-faith review of: (a) License Verification; (b) Insurance Verification; (c) BBB Lookup; and (d) CVOB Verification where claimed.</p>
          <p style={pStyle}><strong>4.2 Limitations.</strong> Verifications are conducted at onboarding and are not continuously updated. ONP makes no warranty that any Contractor&apos;s credentials remain current or that verification predicts competence or integrity. <strong>Clients remain solely responsible for their own due diligence.</strong></p>
          <p style={pStyle}><strong>4.3 Contractor Obligations.</strong> Each Contractor warrants that all submitted information is true and current, and must promptly notify ONP of any change affecting eligibility.</p>
        </div>

        {/* Section 5 */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>5. Fees, Subscriptions, and No Refunds</h2>
          <div style={dividerStyle} />
          <p style={pStyle}><strong>5.1 Contractor Subscription Fees.</strong> Subscriptions auto-renew on a recurring basis until cancelled. Payment is processed by Stripe, Inc. and is subject to Stripe&apos;s terms.</p>
          <p style={pStyle}><strong>5.2 Inspector Request Fees.</strong> Inspection fees are charged at the time the Inspection is requested by the Client.</p>
          <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: "8px", padding: "14px 18px", marginBottom: "12px" }}>
            <p style={{ ...capsStyle, marginBottom: "8px", color: "#991B1B" }}>5.3 No Refunds. ALL FEES PAID TO ONP ARE FINAL AND NON-REFUNDABLE, EXCEPT AS PROVIDED IN SUBSECTION (c) BELOW.</p>
            <ul style={{ paddingLeft: "20px" }}>
              <li style={{ ...liStyle, color: "#991B1B" }}>(a) Contractor Subscription fees are non-refundable for any reason including account closure, suspension, or non-use.</li>
              <li style={{ ...liStyle, color: "#991B1B" }}>(b) Inspection fees are deemed earned upon the Client&apos;s request and are non-refundable regardless of outcome.</li>
              <li style={{ ...liStyle, color: "#7F1D1D" }}>(c) <strong>Upgrade Dispute Exception.</strong> Notwithstanding subclause (b), if a Client files a timely dispute of an on-site inspection upgrade through the ONP Upgrade Dispute process and an independent Master Inspector determines the upgrade was not justified, ONP will refund the upgrade differential fee only (the amount charged above the original base inspection fee). The base inspection fee and all other fees remain non-refundable. A credit in lieu of a full refund may be issued at the Master Inspector&apos;s discretion. Disputes must be filed within 14 days of the upgrade charge. This exception applies solely to on-site upgrade charges and to no other fee.</li>
            </ul>
          </div>
          <p style={pStyle}><strong>5.4 Cancellation.</strong> Upon cancellation, the Contractor retains access through the end of the current billing period and will not be charged again.</p>
          <p style={pStyle}><strong>5.5 Price Changes.</strong> ONP may modify fees with reasonable advance notice. Continued use after the effective date constitutes acceptance.</p>
          <p style={pStyle}><strong>5.6 Taxes.</strong> Fees exclude applicable taxes. You are responsible for any such taxes other than taxes on ONP&apos;s income.</p>
        </div>

        {/* Section 6 */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>6. Inspections</h2>
          <div style={dividerStyle} />
          <p style={pStyle}><strong>6.1</strong> Inspections provide informational reports based on visual observation at a point in time. They do <strong>not</strong> constitute warranties, structural certifications, code compliance opinions, or guarantees of any kind.</p>
          <p style={pStyle}><strong>6.2</strong> ONP does not warrant the accuracy or completeness of any Inspection report. Users rely on Inspection reports at their own risk.</p>
        </div>

        {/* Section 7 */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>7. Bids, Awards, and Project Performance</h2>
          <div style={dividerStyle} />
          <p style={pStyle}><strong>7.1</strong> Contractors may submit sealed Bids in accordance with Platform rules. ONP may modify, suspend, or terminate any bidding feature.</p>
          <p style={pStyle}><strong>7.2</strong> Award decisions are the Client&apos;s sole responsibility. ONP does not select Contractors or recommend Bid amounts.</p>
          <p style={pStyle}><strong>7.3</strong> All Project performance, payment, change orders, and dispute resolution occur <strong>between the Client and Contractor directly</strong>, outside the Platform.</p>
          <p style={pStyle}><strong>7.4</strong> Users may not circumvent Platform fees by conducting on-Platform-initiated transactions off-Platform.</p>
        </div>

        {/* Section 8 */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>8. Reviews and Ratings</h2>
          <div style={dividerStyle} />
          <p style={pStyle}><strong>8.1</strong> Reviews must reflect genuine first-hand experience, be truthful, and not contain unlawful, defamatory, or harassing content, nor be procured for compensation.</p>
          <p style={pStyle}><strong>8.2</strong> By posting a review, you grant ONP the license in Section 9.2 and acknowledge ONP may display it publicly.</p>
          <p style={pStyle}><strong>8.3</strong> ONP does not pre-screen reviews but reserves the right to remove any review that violates these Terms.</p>
        </div>

        {/* Section 9 */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>9. User Content</h2>
          <div style={dividerStyle} />
          <p style={pStyle}><strong>9.1 Ownership.</strong> You retain ownership of the Content you submit.</p>
          <p style={pStyle}><strong>9.2 License to ONP.</strong> You grant ONP a worldwide, non-exclusive, royalty-free, sublicensable, transferable license to host, store, reproduce, modify (for formatting), publicly display, distribute, and otherwise use your Content to operate, provide, improve, market, and promote the Platform. This license survives termination for Content shared with other Users.</p>
          <p style={pStyle}><strong>9.3 Representations.</strong> You represent that (a) you own or have all rights necessary to grant the license in 9.2, (b) your Content does not infringe any third-party right, and (c) your Content does not violate any law or these Terms.</p>
        </div>

        {/* Section 10 */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>10. Prohibited Conduct</h2>
          <div style={dividerStyle} />
          <p style={pStyle}>You agree not to:</p>
          <ul style={{ paddingLeft: "24px" }}>
            <li style={liStyle}>(a) violate any applicable law or regulation;</li>
            <li style={liStyle}>(b) post Content that is false, misleading, defamatory, obscene, harassing, or infringing;</li>
            <li style={liStyle}>(c) misrepresent your identity, license, insurance, qualifications, or veteran status;</li>
            <li style={liStyle}>(d) manipulate reviews, ratings, or Bids;</li>
            <li style={liStyle}>(e) circumvent Platform fees by conducting on-Platform-initiated transactions off-Platform;</li>
            <li style={liStyle}>(f) interfere with or attempt to gain unauthorized access to any part of the Platform;</li>
            <li style={liStyle}>(g) use automated means to access the Platform except as expressly permitted;</li>
            <li style={liStyle}>(h) reverse engineer or decompile any part of the Platform;</li>
            <li style={liStyle}>(i) use the Platform to send spam or malware; or</li>
            <li style={liStyle}>(j) use the Platform for any purpose other than its intended use.</li>
          </ul>
        </div>

        {/* Section 11 */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>11. Advertising and Third-Party Content</h2>
          <div style={dividerStyle} />
          <p style={pStyle}><strong>11.1</strong> The Platform may display advertisements from third parties including home improvement retailers. ONP receives compensation in connection with such advertising.</p>
          <p style={pStyle}><strong>11.2</strong> ONP does not endorse or assume responsibility for any advertised product, service, or transaction with an advertiser.</p>
          <p style={pStyle}><strong>11.3</strong> The Platform may contain links to third-party websites not under ONP&apos;s control.</p>
        </div>

        {/* Section 12 */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>12. Intellectual Property</h2>
          <div style={dividerStyle} />
          <p style={pStyle}><strong>12.1</strong> The Platform, including all software, design, logos, trademarks, and service marks (including &ldquo;Our Next Project&rdquo; and the ONP wordmark), is owned by ONP or its licensors. No rights are granted except the limited license to use the Platform in accordance with these Terms.</p>
          <p style={pStyle}><strong>12.2 Feedback.</strong> If you submit suggestions or feedback, you grant ONP a perpetual, irrevocable, worldwide, royalty-free license to use them for any purpose.</p>
        </div>

        {/* Section 13 */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>13. Suspension and Termination</h2>
          <div style={dividerStyle} />
          <p style={pStyle}><strong>13.1</strong> You may terminate your account at any time by contacting support@ournextproject.us.</p>
          <p style={pStyle}><strong>13.2</strong> ONP may suspend, restrict, or terminate your account at any time, with or without notice and with or without cause.</p>
          <p style={pStyle}><strong>13.3</strong> Upon termination: your right to use the Platform ceases; fees paid are non-refundable; ONP may delete your Content; and Sections 2, 5.3, 9.2, 12, 14, 15, 16, 17, and 18 survive.</p>
        </div>

        {/* Section 14 */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>14. Disclaimers</h2>
          <div style={dividerStyle} />
          <div style={{ background: "#F8FAFC", border: "1px solid #CBD5E1", borderRadius: "8px", padding: "16px 20px" }}>
            <p style={capsStyle}>14.1 THE PLATFORM AND ALL SERVICES ARE PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE,&rdquo; WITH ALL FAULTS AND WITHOUT WARRANTY OF ANY KIND, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.</p>
            <p style={capsStyle}>14.2 ONP DOES NOT WARRANT THAT (A) THE PLATFORM WILL BE UNINTERRUPTED OR ERROR-FREE; (B) ANY CONTRACTOR WILL PERFORM AS PROMISED; (C) ANY CLIENT WILL PAY; (D) ANY BID IS ACCURATE; (E) ANY INSPECTION REPORT IS COMPLETE; OR (F) ANY CONTENT IS RELIABLE.</p>
            <p style={{ ...capsStyle, marginBottom: 0 }}>14.3 ONP IS NOT RESPONSIBLE FOR THE CONDUCT OF ANY USER, INSPECTOR, ADVERTISER, OR OTHER THIRD PARTY.</p>
          </div>
        </div>

        {/* Section 15 */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>15. Binding Arbitration; Class Action Waiver; Jury Trial Waiver</h2>
          <div style={dividerStyle} />
          <div style={{ background: "#FEF2F2", border: "2px solid #C8102E", borderRadius: "8px", padding: "16px 20px", marginBottom: "16px" }}>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "#991B1B", lineHeight: 1.7, margin: 0 }}>PLEASE READ THIS SECTION CAREFULLY. IT AFFECTS YOUR RIGHT TO FILE A LAWSUIT IN COURT, TO HAVE A TRIAL BY JURY, AND TO PARTICIPATE IN A CLASS ACTION.</p>
          </div>
          <p style={pStyle}><strong>15.1 Agreement to Arbitrate.</strong> You and ONP agree that any Dispute arising out of or relating to these Terms, the Platform, or the Services will be resolved by <strong>binding individual arbitration</strong>, except as provided in Section 15.5.</p>
          <p style={pStyle}><strong>15.2 Rules.</strong> Administered by the <strong>American Arbitration Association (AAA)</strong> under its Consumer Arbitration Rules. The arbitrator&apos;s decision will be final and binding.</p>
          <p style={pStyle}><strong>15.3 Location.</strong> El Paso County, Texas, or by telephone/video conference where permitted.</p>
          <div style={{ background: "#1E3A8A", borderRadius: "8px", padding: "14px 18px", marginBottom: "12px" }}>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "#FFFFFF", lineHeight: 1.8, margin: 0 }}>
              15.4 Class Action Waiver. YOU AND ONP MAY BRING CLAIMS ONLY IN AN INDIVIDUAL CAPACITY, NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY CLASS, COLLECTIVE, OR REPRESENTATIVE PROCEEDING.
            </p>
          </div>
          <p style={pStyle}><strong>15.5 Exceptions.</strong> Either party may bring: (a) individual actions in small claims court; and (b) claims for injunctive relief related to intellectual property or unauthorized platform access.</p>
          <div style={{ background: "#1E3A8A", borderRadius: "8px", padding: "14px 18px", marginBottom: "12px" }}>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "#FFFFFF", lineHeight: 1.8, margin: 0 }}>15.6 Jury Trial Waiver. YOU AND ONP WAIVE ANY RIGHT TO TRIAL BY JURY.</p>
          </div>
          <p style={pStyle}><strong>15.7 Opt-Out.</strong> You may opt out within <strong>30 days</strong> of first agreeing by emailing support@ournextproject.us with your name, account email, and &ldquo;Arbitration Opt-Out.&rdquo; If you opt out, no other portion of these Terms is affected.</p>
          <p style={pStyle}><strong>15.8</strong> If the class action waiver is found unenforceable as to a particular claim, that claim will be severed and brought in court in El Paso County, Texas.</p>
          <p style={pStyle}><strong>15.9</strong> This Section 15 survives termination.</p>
        </div>

        {/* Section 16 */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>16. Governing Law and Venue</h2>
          <div style={dividerStyle} />
          <p style={pStyle}><strong>16.1</strong> These Terms are governed by the laws of the <strong>State of Texas</strong>, without regard to conflict-of-laws principles.</p>
          <p style={pStyle}><strong>16.2</strong> For claims excepted from arbitration, the exclusive venue is the state and federal courts in <strong>El Paso County, Texas</strong>.</p>
        </div>

        {/* Section 17 */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>17. Limitation of Liability</h2>
          <div style={dividerStyle} />
          <div style={{ background: "#F8FAFC", border: "1px solid #CBD5E1", borderRadius: "8px", padding: "16px 20px" }}>
            <p style={capsStyle}>17.1 TO THE MAXIMUM EXTENT PERMITTED BY LAW, ONP AND ITS OFFICERS, DIRECTORS, MEMBERS, EMPLOYEES, AND AGENTS WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL, EXEMPLARY, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, REVENUE, DATA, OR GOODWILL.</p>
            <p style={capsStyle}>17.2 ONP&apos;S TOTAL AGGREGATE LIABILITY WILL NOT EXCEED THE GREATER OF (A) TOTAL AMOUNTS YOU PAID TO ONP IN THE TWELVE MONTHS PRECEDING THE CLAIM, OR (B) US$100.</p>
            <p style={{ ...capsStyle, marginBottom: 0 }}>17.3 THESE LIMITATIONS ARE AN ESSENTIAL BASIS OF THE BARGAIN AND APPLY EVEN IF A REMEDY FAILS OF ITS ESSENTIAL PURPOSE.</p>
          </div>
        </div>

        {/* Section 18 */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>18. Indemnification</h2>
          <div style={dividerStyle} />
          <p style={pStyle}>You agree to indemnify, defend, and hold harmless ONP and its officers, directors, members, managers, employees, agents, and licensors from all claims, liabilities, damages, losses, costs, and expenses (including reasonable attorneys&apos; fees) arising out of or related to: (a) your use of the Platform; (b) your Content; (c) any Project, Bid, or payment between you and another User; (d) your violation of these Terms; or (e) your violation of any law or third-party right.</p>
        </div>

        {/* Section 19 */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>19. Modifications to the Terms</h2>
          <div style={dividerStyle} />
          <p style={pStyle}>ONP may modify these Terms from time to time. Material changes will be communicated by posting on the Platform and updating the &ldquo;Last Updated&rdquo; date. Continued use after the effective date constitutes acceptance.</p>
        </div>

        {/* Section 20 */}
        <div style={{ marginBottom: "44px" }}>
          <h2 style={h2Style}>20. General Provisions</h2>
          <div style={dividerStyle} />
          <p style={pStyle}><strong>20.1 Entire Agreement.</strong> These Terms, together with the <Link href="/privacy/legal" style={{ color: "#C8102E" }}>Privacy Policy</Link>, constitute the entire agreement between you and ONP.</p>
          <p style={pStyle}><strong>20.2 Severability.</strong> If any provision is unenforceable, the remaining provisions continue in full force.</p>
          <p style={pStyle}><strong>20.3 No Waiver.</strong> Failure to enforce any provision is not a waiver of that provision.</p>
          <p style={pStyle}><strong>20.4 Assignment.</strong> ONP may assign these Terms. You may not assign without ONP&apos;s prior written consent.</p>
          <p style={pStyle}><strong>20.5 Notices.</strong> ONP may provide notice via your registered email or via the Platform. Legal notices to ONP: support@ournextproject.us / [BUSINESS ADDRESS].</p>
          <p style={pStyle}><strong>20.6 Force Majeure.</strong> ONP is not liable for delays or failures caused by events beyond its reasonable control.</p>
          <h3 style={h3Style}>20.8 Contact</h3>
          <div style={{ background: "#EEF4FF", border: "1px solid #B8D0E8", borderRadius: "8px", padding: "16px 20px", fontSize: "15px", color: "#1E3A8A", lineHeight: 1.9 }}>
            <strong>Our Next Project, LLC</strong><br />
            [BUSINESS ADDRESS]<br />
            <a href="mailto:support@ournextproject.us" style={{ color: "#1B4F8A" }}>support@ournextproject.us</a>
          </div>
        </div>

        {/* Cross-link */}
        <div style={{ borderTop: "1px solid #B8D0E8", paddingTop: "32px", textAlign: "center" }}>
          <p style={{ fontSize: "13px", color: "#4A7FB5", marginBottom: "12px" }}>Looking for the plain English version?</p>
          <Link href="/terms" style={{ display: "inline-block", color: "#1B4F8A", border: "1px solid #B8D0E8", padding: "10px 24px", borderRadius: "6px", fontSize: "13px", textDecoration: "none", fontWeight: 500 }}>
            ← Plain English Terms of Service
          </Link>
        </div>
      </main>

      <div style={{ borderTop: "1px solid #B8D0E8", padding: "20px 28px", textAlign: "center", fontSize: "12px", color: "#4A7FB5", letterSpacing: "1px", textTransform: "uppercase" }}>
        © 2026 Our Next Project — Honoring American Veterans
      </div>
    </div>
  );
}
