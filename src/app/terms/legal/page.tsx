import Link from "next/link";

export const metadata = { title: "Terms of Service (Legal) — Our Next Project" };

export default function TermsLegalPage() {
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
      <main style={{ maxWidth: "820px", margin: "0 auto", padding: "60px 24px 80px" }}>

        {/* Title */}
        <div style={{ marginBottom: "40px" }}>
          <h1 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "44px",
            letterSpacing: "1px",
            color: "#0A1628",
            marginBottom: "8px",
            lineHeight: 1.1,
          }}>
            Terms of Service
          </h1>
          <div style={{ width: "60px", height: "3px", background: "#C8102E", marginBottom: "20px" }} />
          <p style={{ fontSize: "14px", color: "#4A7FB5", marginBottom: "4px" }}><strong>Our Next Project, LLC</strong></p>
          <p style={{ fontSize: "14px", color: "#4A7FB5", marginBottom: "4px" }}>Effective Date: [EFFECTIVE DATE]</p>
          <p style={{ fontSize: "14px", color: "#4A7FB5", marginBottom: "20px" }}>Last Updated: [LAST UPDATED DATE]</p>

          <p style={{ fontSize: "15px", color: "#1B4F8A", lineHeight: 1.8, marginBottom: "16px" }}>
            These Terms of Service (the &ldquo;<strong>Terms</strong>&rdquo;) constitute a binding legal agreement between you (&ldquo;<strong>User</strong>,&rdquo; &ldquo;<strong>you</strong>,&rdquo; or &ldquo;<strong>your</strong>&rdquo;) and <strong>Our Next Project, LLC</strong>, a Texas limited liability company (&ldquo;<strong>ONP</strong>,&rdquo; &ldquo;<strong>we</strong>,&rdquo; &ldquo;<strong>us</strong>,&rdquo; or &ldquo;<strong>our</strong>&rdquo;), governing your access to and use of the website located at ournextproject.us and any related subdomains, applications, features, content, and services (collectively, the &ldquo;<strong>Platform</strong>&rdquo; or the &ldquo;<strong>Services</strong>&rdquo;).
          </p>
          <p style={{ fontSize: "15px", color: "#1B4F8A", lineHeight: 1.8, marginBottom: "16px" }}>
            A plain-English summary of these Terms is available{" "}
            <Link href="/terms" style={{ color: "#C8102E" }}>here</Link>
            {" "}for convenience. In the event of any conflict between the plain-English summary and these Terms, <strong>these Terms control.</strong>
          </p>
          <div style={{
            background: "#0A1628",
            borderRadius: "8px",
            padding: "16px 20px",
            fontSize: "13px",
            color: "#FFFFFF",
            fontWeight: 600,
            lineHeight: 1.7,
            letterSpacing: "0.3px",
            marginBottom: "12px",
          }}>
            BY CREATING AN ACCOUNT, ACCESSING, OR USING THE PLATFORM, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY THESE TERMS AND BY OUR{" "}
            <Link href="/privacy/legal" style={{ color: "#B8D0E8" }}>PRIVACY POLICY</Link>.
            {" "}IF YOU DO NOT AGREE, DO NOT ACCESS OR USE THE PLATFORM.
          </div>
          <div style={{
            background: "#FEF2F2",
            border: "1px solid #FCA5A5",
            borderRadius: "8px",
            padding: "14px 18px",
            fontSize: "13px",
            color: "#991B1B",
            fontWeight: 600,
            lineHeight: 1.7,
          }}>
            SECTION 15 CONTAINS A BINDING ARBITRATION AGREEMENT, A CLASS ACTION WAIVER, AND A JURY TRIAL WAIVER. PLEASE READ IT CAREFULLY. IT AFFECTS YOUR LEGAL RIGHTS.
          </div>
        </div>

        {/* Shared styles */}
        <style>{`
          .tl-h2 {
            font-family: 'Barlow Condensed', sans-serif;
            font-weight: 700;
            font-size: 24px;
            letter-spacing: 1px;
            color: #0A1628;
            text-transform: uppercase;
            margin: 0 0 6px 0;
          }
          .tl-h3 {
            font-size: 15px;
            font-weight: 700;
            color: #0A1628;
            margin: 20px 0 8px 0;
          }
          .tl-divider {
            width: 36px;
            height: 2px;
            background: #C8102E;
            margin-bottom: 18px;
          }
          .tl-section {
            margin-bottom: 44px;
            padding-bottom: 44px;
            border-bottom: 1px solid #EEF4FF;
          }
          .tl-section:last-of-type {
            border-bottom: none;
          }
          .tl-p {
            font-size: 15px;
            color: #1B4F8A;
            line-height: 1.85;
            margin-bottom: 12px;
          }
          .tl-list {
            margin: 0 0 12px 0;
            padding-left: 24px;
          }
          .tl-list li {
            font-size: 15px;
            color: #1B4F8A;
            line-height: 1.85;
            margin-bottom: 8px;
          }
          .tl-caps {
            font-size: 13px;
            font-weight: 700;
            color: #0A1628;
            line-height: 1.8;
            margin-bottom: 12px;
            letter-spacing: 0.2px;
          }
        `}</style>

        {/* Section 1 — Definitions */}
        <div className="tl-section">
          <h2 className="tl-h2">1. Definitions</h2>
          <div className="tl-divider" />
          <ul className="tl-list">
            <li><strong>1.1 &ldquo;Bid&rdquo;</strong> means a proposal submitted by a Contractor in response to a Project posted by a Client.</li>
            <li><strong>1.2 &ldquo;Client&rdquo;</strong> means a User who posts Projects and/or requests Inspections through the Platform.</li>
            <li><strong>1.3 &ldquo;Content&rdquo;</strong> means any text, images, files, photographs, video, project descriptions, Bids, messages, reviews, ratings, or other materials submitted to, uploaded to, or generated on the Platform.</li>
            <li><strong>1.4 &ldquo;Contractor&rdquo;</strong> means a User who maintains a paid subscription and uses the Platform to submit Bids on Projects.</li>
            <li><strong>1.5 &ldquo;CVOB&rdquo;</strong> means Certified Veteran Owned Business.</li>
            <li><strong>1.6 &ldquo;Inspection&rdquo;</strong> means a paid property inspection requested by a Client through the Platform and performed by an Inspector.</li>
            <li><strong>1.7 &ldquo;Inspector&rdquo;</strong> means a person designated by ONP to perform Inspections, whether an ONP employee or an independent contractor engaged by ONP.</li>
            <li><strong>1.8 &ldquo;Project&rdquo;</strong> means a job or scope of work posted by a Client on the Platform.</li>
            <li><strong>1.9 &ldquo;Subscription&rdquo;</strong> means a recurring paid plan that grants a Contractor access to the Platform.</li>
            <li><strong>1.10 &ldquo;User&rdquo;</strong> means any person who accesses or uses the Platform, including Clients, Contractors, and visitors.</li>
          </ul>
        </div>

        {/* Section 2 */}
        <div className="tl-section">
          <h2 className="tl-h2">2. Nature of the Platform; Disclaimer of Agency</h2>
          <div className="tl-divider" />
          <p className="tl-p">
            <strong>2.1 Marketplace Only.</strong> The Platform is an online marketplace that facilitates the introduction of Clients and Contractors and the optional procurement of Inspections. ONP does not perform construction, repair, improvement, design, or other contracting services. ONP does not employ, sponsor, supervise, control, or endorse any Contractor. ONP is not a party to any contract, agreement, or transaction formed between a Client and a Contractor.
          </p>
          <p className="tl-p">
            <strong>2.2 No Agency.</strong> No agency, partnership, joint venture, employer-employee, franchise, or fiduciary relationship is created between ONP and any User by these Terms or by use of the Platform.
          </p>
          <p className="tl-p">
            <strong>2.3 No Payment Processing Between Users.</strong> As of the Effective Date, ONP does <strong>not</strong> receive, hold, process, transmit, escrow, or otherwise handle funds exchanged between Clients and Contractors for Project work. All such payments are made directly between the Client and Contractor, outside the Platform, and on terms agreed between them. ONP bears no responsibility for any such payments, non-payments, refunds, chargebacks, fraud, or disputes. ONP may, in the future, introduce optional payment-processing functionality, at which time these Terms will be updated.
          </p>
          <p className="tl-p">
            <strong>2.4 Independent Judgment Required.</strong> Users are solely responsible for evaluating the qualifications, fitness, legality, safety, quality, and reliability of any counterparty, Bid, Project, or work product. ONP makes no representation or warranty regarding any User or any work performed.
          </p>
        </div>

        {/* Section 3 */}
        <div className="tl-section">
          <h2 className="tl-h2">3. Eligibility and Accounts</h2>
          <div className="tl-divider" />
          <p className="tl-p"><strong>3.1 Age.</strong> You must be at least <strong>eighteen (18) years of age</strong> and capable of forming a legally binding contract to use the Platform.</p>
          <p className="tl-p"><strong>3.2 Accurate Information.</strong> You agree to provide accurate, current, and complete information during registration and to keep that information updated.</p>
          <p className="tl-p"><strong>3.3 Authority to Bind Entities.</strong> If you register on behalf of a business entity, you represent that you are authorized to bind that entity to these Terms, and &ldquo;you&rdquo; includes that entity.</p>
          <p className="tl-p"><strong>3.4 Account Security.</strong> You are responsible for safeguarding your account credentials and for all activity occurring under your account, whether authorized or not. You must notify ONP immediately of any unauthorized use.</p>
          <p className="tl-p"><strong>3.5 One Account.</strong> You may not maintain more than one account, transfer your account, or permit any other person to use your account without ONP&apos;s written consent.</p>
        </div>

        {/* Section 4 */}
        <div className="tl-section">
          <h2 className="tl-h2">4. Contractor Verification</h2>
          <div className="tl-divider" />
          <p className="tl-p"><strong>4.1 Scope of Verification.</strong> Prior to activating a Contractor account, ONP will perform a good-faith review of the following:</p>
          <ul className="tl-list">
            <li><strong>(a) License Verification</strong> through the relevant state licensing authority or equivalent;</li>
            <li><strong>(b) Insurance Verification</strong> by collecting a current certificate of insurance from the Contractor;</li>
            <li><strong>(c) Better Business Bureau (&ldquo;BBB&rdquo;) Lookup</strong> of the business; and</li>
            <li><strong>(d) CVOB Verification</strong> where the Contractor claims veteran-owned status and requests the corresponding badge.</li>
          </ul>
          <p className="tl-p">
            <strong>4.2 Limitations of Verification.</strong> The verifications described in Section 4.1 are conducted at the time of onboarding and are not continuously updated. ONP makes no representation, warranty, or guarantee that any Contractor&apos;s license, insurance, business standing, or veteran-owned status remains current at any later time, nor that verification of these items predicts a Contractor&apos;s competence, integrity, workmanship, or financial responsibility. <strong>Clients remain solely responsible for conducting their own due diligence prior to engaging a Contractor.</strong>
          </p>
          <p className="tl-p">
            <strong>4.3 Contractor Obligations.</strong> Each Contractor represents and warrants that all license, insurance, and veteran-status information submitted is true, accurate, and current. Contractors must promptly notify ONP of any change affecting eligibility, including license suspension or revocation, lapse of insurance, or change in business standing.
          </p>
        </div>

        {/* Section 5 */}
        <div className="tl-section">
          <h2 className="tl-h2">5. Fees, Subscriptions, and No Refunds</h2>
          <div className="tl-divider" />
          <p className="tl-p"><strong>5.1 Contractor Subscription Fees.</strong> Contractors must pay the Subscription fee disclosed at the point of sign-up. Subscriptions auto-renew on a recurring basis until cancelled. Payment is processed by Stripe, Inc. (&ldquo;Stripe&rdquo;) and is subject to Stripe&apos;s terms.</p>
          <p className="tl-p"><strong>5.2 Inspector Request Fees.</strong> Inspection fees are charged at the time the Inspection is requested by the Client.</p>
          <div style={{
            background: "#FEF2F2",
            border: "1px solid #FCA5A5",
            borderRadius: "8px",
            padding: "14px 18px",
            marginBottom: "12px",
          }}>
            <p className="tl-caps" style={{ marginBottom: "8px" }}>5.3 No Refunds. ALL FEES PAID TO ONP ARE FINAL AND NON-REFUNDABLE. Without limiting the foregoing:</p>
            <ul className="tl-list" style={{ color: "#991B1B" }}>
              <li style={{ color: "#991B1B" }}>(a) Contractor Subscription fees are non-refundable, in whole or in part, for any reason, including but not limited to account closure, suspension, termination, dissatisfaction, non-use, lack of awarded Projects, or any other circumstance.</li>
              <li style={{ color: "#991B1B" }}>(b) Inspection fees are deemed earned upon the Client&apos;s request and are non-refundable, regardless of the Inspection outcome, Client dissatisfaction, or subsequent cancellation.</li>
            </ul>
          </div>
          <p className="tl-p"><strong>5.4 Cancellation by Contractor.</strong> A Contractor may cancel a Subscription at any time. Upon cancellation, the Contractor will retain access through the end of the then-current billing period and will not be charged again, except for any outstanding amounts owed.</p>
          <p className="tl-p"><strong>5.5 Price Changes.</strong> ONP may modify Subscription pricing or Inspection fees with reasonable advance notice. Continued use after the effective date of any price change constitutes acceptance.</p>
          <p className="tl-p"><strong>5.6 Taxes.</strong> Fees do not include any applicable taxes, levies, or duties. You are responsible for any such taxes other than taxes imposed on ONP&apos;s income.</p>
        </div>

        {/* Section 6 */}
        <div className="tl-section">
          <h2 className="tl-h2">6. Inspections</h2>
          <div className="tl-divider" />
          <p className="tl-p">
            <strong>6.1 Nature of Inspections.</strong> Inspections provide informational reports based on visual observation and the Inspector&apos;s professional judgment at a point in time. Inspections do <strong>not</strong> constitute warranties, structural certifications, code compliance opinions, or guarantees of any kind regarding the property, the proposed work, any Contractor, or future conditions.
          </p>
          <p className="tl-p">
            <strong>6.2 No Liability for Inspection Findings.</strong> ONP does not warrant the accuracy, completeness, or fitness for any particular purpose of any Inspection report. Users rely on Inspection reports at their own risk.
          </p>
        </div>

        {/* Section 7 */}
        <div className="tl-section">
          <h2 className="tl-h2">7. Bids, Awards, and Project Performance</h2>
          <div className="tl-divider" />
          <p className="tl-p"><strong>7.1 Bidding Process.</strong> Contractors may submit sealed Bids on Projects in accordance with the Platform&apos;s bidding rules in effect from time to time. ONP may, in its discretion, modify, suspend, or terminate any bidding feature.</p>
          <p className="tl-p"><strong>7.2 Award.</strong> A Client&apos;s decision to award a Project to a Contractor is the Client&apos;s sole responsibility. ONP does not select Contractors, recommend Bid amounts, or otherwise direct Award decisions.</p>
          <p className="tl-p"><strong>7.3 Off-Platform Performance.</strong> All Project performance, scheduling, communications regarding execution, payment, change orders, warranties, and dispute resolution occur <strong>between the Client and the Contractor directly</strong>, outside the Platform. Users are encouraged to memorialize their agreement in a written contract.</p>
          <p className="tl-p"><strong>7.4 No Circumvention.</strong> Users may not solicit, encourage, or accept any arrangement intended to circumvent Platform fees or to remove Project transactions from the Platform in violation of these Terms.</p>
        </div>

        {/* Section 8 */}
        <div className="tl-section">
          <h2 className="tl-h2">8. Reviews and Ratings</h2>
          <div className="tl-divider" />
          <p className="tl-p"><strong>8.1 User Reviews.</strong> Both Clients and Contractors may post reviews and ratings of the other party following a Project interaction. All reviews must (a) reflect the User&apos;s genuine, first-hand experience, (b) be truthful and not misleading, (c) not contain unlawful, defamatory, harassing, obscene, or otherwise objectionable content, and (d) not be procured for compensation or other consideration.</p>
          <p className="tl-p"><strong>8.2 License to Reviews.</strong> By posting a review, you grant ONP the rights described in Section 9.2 and acknowledge that ONP may display the review publicly and incorporate it into aggregated ratings or analytics.</p>
          <p className="tl-p"><strong>8.3 Moderation.</strong> ONP does not pre-screen reviews but reserves the right, without obligation, to remove any review that, in ONP&apos;s sole judgment, violates these Terms.</p>
        </div>

        {/* Section 9 */}
        <div className="tl-section">
          <h2 className="tl-h2">9. User Content</h2>
          <div className="tl-divider" />
          <p className="tl-p"><strong>9.1 Ownership.</strong> As between you and ONP, you retain ownership of the Content you submit. ONP does not claim ownership of your Content.</p>
          <p className="tl-p"><strong>9.2 License to ONP.</strong> You grant ONP a worldwide, non-exclusive, royalty-free, sublicensable, transferable license to host, store, reproduce, modify (for formatting purposes), publicly display, publicly perform, distribute, and otherwise use your Content for the purposes of operating, providing, improving, marketing, and promoting the Platform and the Services. This license survives termination with respect to Content that has been displayed publicly or shared with other Users.</p>
          <p className="tl-p"><strong>9.3 Representations.</strong> You represent and warrant that (a) you own or have all rights necessary to grant the license in Section 9.2, (b) your Content does not infringe or violate any third-party right, including intellectual property, privacy, or publicity rights, and (c) your Content does not violate any law or these Terms.</p>
        </div>

        {/* Section 10 */}
        <div className="tl-section">
          <h2 className="tl-h2">10. Prohibited Conduct</h2>
          <div className="tl-divider" />
          <p className="tl-p">You agree not to:</p>
          <ul className="tl-list">
            <li>(a) violate any applicable law or regulation;</li>
            <li>(b) post Content that is false, misleading, defamatory, obscene, harassing, hateful, infringing, or otherwise objectionable;</li>
            <li>(c) misrepresent your identity, license, insurance, qualifications, or veteran status;</li>
            <li>(d) manipulate reviews, ratings, or Bids, including by submitting fake reviews, exchanging reviews for compensation, or coordinated rating activity;</li>
            <li>(e) circumvent, attempt to circumvent, or assist others in circumventing Platform fees, including by conducting on-Platform-initiated transactions off-Platform to avoid fees;</li>
            <li>(f) interfere with, disrupt, probe, scan, test the vulnerability of, or attempt to gain unauthorized access to any part of the Platform or any related systems;</li>
            <li>(g) use any automated means (bots, scrapers, crawlers) to access the Platform except as expressly permitted;</li>
            <li>(h) reverse engineer, decompile, or disassemble any part of the Platform;</li>
            <li>(i) use the Platform to send spam, malware, or other harmful content; or</li>
            <li>(j) use the Platform for any purpose other than its intended use.</li>
          </ul>
        </div>

        {/* Section 11 */}
        <div className="tl-section">
          <h2 className="tl-h2">11. Advertising and Third-Party Content</h2>
          <div className="tl-divider" />
          <p className="tl-p"><strong>11.1 Advertisements.</strong> The Platform may display advertisements from third parties, including but not limited to home improvement retailers (e.g., The Home Depot, Lowe&apos;s), suppliers of paint, tile, materials, tools, and related services, and other relevant advertisers. ONP receives compensation in connection with such advertising.</p>
          <p className="tl-p"><strong>11.2 No Endorsement.</strong> ONP does not endorse, guarantee, or assume responsibility for any advertised product, service, or advertiser, or for any transaction you may enter into with any advertiser. Any such transaction is solely between you and the third party.</p>
          <p className="tl-p"><strong>11.3 Third-Party Links.</strong> The Platform may contain links to third-party websites. Those sites are not under ONP&apos;s control, and ONP is not responsible for their content, policies, or practices.</p>
        </div>

        {/* Section 12 */}
        <div className="tl-section">
          <h2 className="tl-h2">12. Intellectual Property</h2>
          <div className="tl-divider" />
          <p className="tl-p"><strong>12.1 ONP IP.</strong> The Platform, including all software, design, logos, trademarks, service marks (including &ldquo;Our Next Project,&rdquo; the ONP wordmark, and associated designs), trade dress, text, graphics, and selection and arrangement thereof, is owned by ONP or its licensors and is protected by U.S. and international intellectual property laws. Except for the limited license to use the Platform in accordance with these Terms, no rights are granted to you.</p>
          <p className="tl-p"><strong>12.2 Feedback.</strong> If you submit suggestions, ideas, or feedback regarding the Platform, you grant ONP a perpetual, irrevocable, worldwide, royalty-free, sublicensable license to use them for any purpose, without compensation or attribution.</p>
        </div>

        {/* Section 13 */}
        <div className="tl-section">
          <h2 className="tl-h2">13. Suspension and Termination</h2>
          <div className="tl-divider" />
          <p className="tl-p"><strong>13.1 By You.</strong> You may terminate your account at any time by following the in-Platform procedure or by contacting support@ournextproject.us.</p>
          <p className="tl-p"><strong>13.2 By ONP.</strong> ONP may suspend, restrict, or terminate your account or your access to all or part of the Platform at any time, with or without notice and with or without cause, including for any breach of these Terms or any conduct ONP determines, in its sole discretion, to be harmful to other Users, third parties, ONP, or the Platform.</p>
          <p className="tl-p"><strong>13.3 Effect of Termination.</strong> Upon termination: (a) your right to use the Platform ceases; (b) any fees paid are non-refundable pursuant to Section 5.3; (c) ONP may, but is not required to, delete your Content; and (d) Sections that by their nature should survive termination (including Sections 2, 5.3, 9.2, 12, 14, 15, 16, 17, and 18) will survive.</p>
        </div>

        {/* Section 14 */}
        <div className="tl-section">
          <h2 className="tl-h2">14. Disclaimers</h2>
          <div className="tl-divider" />
          <div style={{
            background: "#F8FAFC",
            border: "1px solid #CBD5E1",
            borderRadius: "8px",
            padding: "16px 20px",
          }}>
            <p className="tl-caps">14.1 AS-IS. TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE PLATFORM AND ALL SERVICES, CONTENT, INSPECTIONS, BIDS, AND ANY OTHER INFORMATION PROVIDED THROUGH THE PLATFORM ARE PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE,&rdquo; WITH ALL FAULTS AND WITHOUT WARRANTY OF ANY KIND, EXPRESS, IMPLIED, OR STATUTORY, INCLUDING WITHOUT LIMITATION ANY WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, NON-INFRINGEMENT, ACCURACY, OR QUIET ENJOYMENT.</p>
            <p className="tl-caps">14.2 No Guarantee of Outcomes. ONP DOES NOT WARRANT THAT (A) THE PLATFORM WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE; (B) ANY CONTRACTOR WILL PERFORM AS PROMISED OR AT ALL; (C) ANY CLIENT WILL PAY ANY CONTRACTOR; (D) ANY BID IS ACCURATE OR FAIR; (E) ANY INSPECTION REPORT IS COMPLETE OR ACCURATE; OR (F) ANY CONTENT IS RELIABLE.</p>
            <p className="tl-caps" style={{ marginBottom: 0 }}>14.3 User Conduct. ONP IS NOT RESPONSIBLE FOR THE CONDUCT OF ANY USER, INSPECTOR, ADVERTISER, OR OTHER THIRD PARTY, WHETHER ONLINE OR OFFLINE.</p>
          </div>
        </div>

        {/* Section 15 — Arbitration */}
        <div className="tl-section">
          <h2 className="tl-h2">15. Binding Arbitration; Class Action Waiver; Jury Trial Waiver</h2>
          <div className="tl-divider" />
          <div style={{
            background: "#FEF2F2",
            border: "2px solid #C8102E",
            borderRadius: "8px",
            padding: "16px 20px",
            marginBottom: "16px",
          }}>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "#991B1B", lineHeight: 1.7, margin: 0 }}>
              PLEASE READ THIS SECTION CAREFULLY. IT AFFECTS YOUR LEGAL RIGHTS, INCLUDING YOUR RIGHT TO FILE A LAWSUIT IN COURT, TO HAVE A TRIAL BY JURY, AND TO PARTICIPATE IN A CLASS ACTION.
            </p>
          </div>
          <p className="tl-p"><strong>15.1 Agreement to Arbitrate.</strong> You and ONP agree that any dispute, claim, or controversy arising out of or relating to these Terms, the Platform, the Services, any Inspection, any Bid, any Content, or the relationship between you and ONP (a &ldquo;<strong>Dispute</strong>&rdquo;) will be resolved by <strong>binding individual arbitration</strong> rather than in court, except as expressly provided in Section 15.5.</p>
          <p className="tl-p"><strong>15.2 Arbitration Rules and Administrator.</strong> The arbitration will be administered by the <strong>American Arbitration Association (&ldquo;AAA&rdquo;)</strong> under its <strong>Consumer Arbitration Rules</strong> (the &ldquo;<strong>AAA Rules</strong>&rdquo;), as modified by these Terms. The AAA Rules are available at www.adr.org. The arbitrator&apos;s decision will be final and binding, and judgment on the award may be entered in any court of competent jurisdiction.</p>
          <p className="tl-p"><strong>15.3 Location.</strong> Arbitration will take place in <strong>El Paso County, Texas</strong>, or, where permitted by the AAA Rules, by telephone, video conference, or written submission.</p>
          <div style={{
            background: "#0A1628",
            borderRadius: "8px",
            padding: "14px 18px",
            marginBottom: "12px",
          }}>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "#FFFFFF", lineHeight: 1.8, margin: 0 }}>
              15.4 Class Action Waiver. YOU AND ONP AGREE THAT EACH MAY BRING CLAIMS AGAINST THE OTHER ONLY IN YOUR OR ITS INDIVIDUAL CAPACITY, AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS, COLLECTIVE, CONSOLIDATED, OR REPRESENTATIVE PROCEEDING. The arbitrator may not consolidate more than one person&apos;s claims, may not preside over any form of representative or class proceeding, and may award relief only in favor of the individual party seeking relief and only to the extent necessary to provide relief warranted by that individual&apos;s claim.
            </p>
          </div>
          <p className="tl-p"><strong>15.5 Exceptions.</strong> Notwithstanding the foregoing:</p>
          <ul className="tl-list">
            <li>(a) Either party may bring an individual action in <strong>small claims court</strong> for Disputes within that court&apos;s jurisdiction;</li>
            <li>(b) Either party may seek <strong>injunctive or other equitable relief</strong> in a court of competent jurisdiction to prevent the actual or threatened infringement, misappropriation, or violation of intellectual property rights or unauthorized access to the Platform.</li>
          </ul>
          <div style={{
            background: "#0A1628",
            borderRadius: "8px",
            padding: "14px 18px",
            marginBottom: "12px",
          }}>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "#FFFFFF", lineHeight: 1.8, margin: 0 }}>
              15.6 Jury Trial Waiver. YOU AND ONP WAIVE ANY RIGHT TO TRIAL BY JURY in any proceeding arising out of or related to these Terms, the Platform, or the Services.
            </p>
          </div>
          <p className="tl-p"><strong>15.7 Opt-Out.</strong> You may opt out of this Section 15 by sending written notice to support@ournextproject.us within <strong>thirty (30) days</strong> of first becoming subject to this Section 15, stating: your full name, your account email address, and that you wish to opt out of arbitration (&ldquo;<strong>Arbitration Opt-Out</strong>&rdquo;). If you opt out, no other portion of these Terms is affected.</p>
          <p className="tl-p"><strong>15.8 Severability of Class Action Waiver.</strong> If the class action waiver in Section 15.4 is found unenforceable as to a particular claim or request for relief, then that claim or request will be severed and brought in a court of competent jurisdiction in El Paso County, Texas, while the remainder of Section 15 continues to apply to all other claims.</p>
          <p className="tl-p"><strong>15.9 Survival.</strong> This Section 15 survives termination of these Terms.</p>
        </div>

        {/* Section 16 */}
        <div className="tl-section">
          <h2 className="tl-h2">16. Governing Law and Venue</h2>
          <div className="tl-divider" />
          <p className="tl-p"><strong>16.1 Governing Law.</strong> These Terms and any Dispute are governed by the laws of the <strong>State of Texas</strong>, without regard to its conflict-of-laws principles, and by applicable U.S. federal law. The United Nations Convention on Contracts for the International Sale of Goods does not apply.</p>
          <p className="tl-p"><strong>16.2 Venue for Excepted Claims.</strong> For Disputes carved out from arbitration under Section 15.5, the exclusive venue is the state and federal courts located in <strong>El Paso County, Texas</strong>, and the parties consent to personal jurisdiction there.</p>
        </div>

        {/* Section 17 */}
        <div className="tl-section">
          <h2 className="tl-h2">17. Limitation of Liability</h2>
          <div className="tl-divider" />
          <div style={{
            background: "#F8FAFC",
            border: "1px solid #CBD5E1",
            borderRadius: "8px",
            padding: "16px 20px",
          }}>
            <p className="tl-caps">17.1 Excluded Damages. TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT WILL ONP OR ITS OFFICERS, DIRECTORS, MEMBERS, EMPLOYEES, AGENTS, AFFILIATES, OR LICENSORS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL, EXEMPLARY, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION DAMAGES FOR LOSS OF PROFITS, REVENUE, GOODWILL, USE, DATA, OR OTHER INTANGIBLE LOSSES, ARISING OUT OF OR RELATED TO THESE TERMS, THE PLATFORM, THE SERVICES, ANY USER, ANY PROJECT, OR ANY INSPECTION, WHETHER BASED ON CONTRACT, TORT (INCLUDING NEGLIGENCE), STRICT LIABILITY, OR ANY OTHER LEGAL THEORY, AND WHETHER OR NOT ONP HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.</p>
            <p className="tl-caps">17.2 Aggregate Cap. TO THE MAXIMUM EXTENT PERMITTED BY LAW, ONP&apos;S TOTAL AGGREGATE LIABILITY ARISING OUT OF OR RELATED TO THESE TERMS, THE PLATFORM, OR THE SERVICES WILL NOT EXCEED THE GREATER OF (A) THE TOTAL AMOUNTS YOU PAID TO ONP IN THE TWELVE (12) MONTHS PRECEDING THE EVENT GIVING RISE TO THE CLAIM, OR (B) ONE HUNDRED U.S. DOLLARS (US$100).</p>
            <p className="tl-caps">17.3 Basis of the Bargain. The disclaimers and limitations in Sections 14 and 17 are an essential basis of the bargain between you and ONP, and apply even if a remedy fails of its essential purpose.</p>
            <p className="tl-caps" style={{ marginBottom: 0 }}>17.4 Jurisdictional Limits. Some jurisdictions do not allow the exclusion or limitation of certain damages. To the extent any limitation in this Section 17 is held unenforceable, ONP&apos;s liability is limited to the maximum extent permitted by applicable law.</p>
          </div>
        </div>

        {/* Section 18 */}
        <div className="tl-section">
          <h2 className="tl-h2">18. Indemnification</h2>
          <div className="tl-divider" />
          <p className="tl-p">
            You agree to indemnify, defend, and hold harmless ONP and its officers, directors, members, managers, employees, agents, affiliates, and licensors from and against any and all claims, demands, liabilities, damages, losses, costs, and expenses (including reasonable attorneys&apos; fees) arising out of or related to: (a) your access to or use of the Platform; (b) your Content; (c) any Project, Bid, Award, work performance, or payment between you and another User; (d) your violation of these Terms; or (e) your violation of any law or third-party right. ONP reserves the right, at its own expense, to assume the exclusive defense and control of any matter otherwise subject to indemnification, in which case you will cooperate with ONP&apos;s defense.
          </p>
        </div>

        {/* Section 19 */}
        <div className="tl-section">
          <h2 className="tl-h2">19. Modifications to the Terms</h2>
          <div className="tl-divider" />
          <p className="tl-p">
            ONP may modify these Terms from time to time. Material changes will be communicated by posting on the Platform, updating the &ldquo;Last Updated&rdquo; date, and, where appropriate, by notice to your registered email address. Your continued use of the Platform after the effective date of any modification constitutes acceptance of the modified Terms. If you do not agree, you must stop using the Platform.
          </p>
        </div>

        {/* Section 20 */}
        <div className="tl-section">
          <h2 className="tl-h2">20. General Provisions</h2>
          <div className="tl-divider" />
          <p className="tl-p"><strong>20.1 Entire Agreement.</strong> These Terms, together with the <Link href="/privacy/legal" style={{ color: "#C8102E" }}>Privacy Policy</Link> and any other policies or terms expressly incorporated by reference, constitute the entire agreement between you and ONP and supersede all prior agreements or understandings, oral or written, regarding the subject matter.</p>
          <p className="tl-p"><strong>20.2 Severability.</strong> If any provision is found unenforceable, that provision will be enforced to the maximum extent permitted, and the remaining provisions will continue in full force.</p>
          <p className="tl-p"><strong>20.3 No Waiver.</strong> ONP&apos;s failure to enforce any provision is not a waiver of that or any other provision.</p>
          <p className="tl-p"><strong>20.4 Assignment.</strong> ONP may assign these Terms in whole or in part. You may not assign these Terms without ONP&apos;s prior written consent, and any unauthorized assignment is void.</p>
          <p className="tl-p"><strong>20.5 Notices.</strong> ONP may provide notice to you at the email address associated with your account or via the Platform. You must send notice to ONP at support@ournextproject.us (with a copy to [BUSINESS ADDRESS] for legal notices).</p>
          <p className="tl-p"><strong>20.6 Force Majeure.</strong> ONP is not liable for any delay or failure to perform caused by events beyond its reasonable control.</p>
          <p className="tl-p"><strong>20.7 Headings.</strong> Headings are for convenience only and have no legal effect.</p>
          <p className="tl-p"><strong>20.8 Contact.</strong></p>
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
            Looking for the plain English version?
          </p>
          <Link href="/terms" style={{
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
            ← Plain English Terms of Service
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
