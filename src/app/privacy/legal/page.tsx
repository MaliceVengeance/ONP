import Link from "next/link";

export const metadata = { title: "Privacy Policy (Legal) — Our Next Project" };

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

export default function PrivacyLegalPage() {
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
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "44px", color: "#1E3A8A", marginBottom: "8px", lineHeight: 1.1 }}>Privacy Policy</h1>
          <div style={{ width: "60px", height: "3px", background: "#C8102E", marginBottom: "20px" }} />
          <p style={{ fontSize: "14px", color: "#4A7FB5", marginBottom: "4px" }}><strong>Our Next Project, LLC</strong></p>
          <p style={{ fontSize: "14px", color: "#4A7FB5", marginBottom: "4px" }}>Effective Date: [EFFECTIVE DATE]</p>
          <p style={{ fontSize: "14px", color: "#4A7FB5", marginBottom: "20px" }}>Last Updated: [LAST UPDATED DATE]</p>
          <p style={pStyle}>This Privacy Policy (the &ldquo;<strong>Policy</strong>&rdquo;) describes how <strong>Our Next Project, LLC</strong> (&ldquo;<strong>ONP</strong>&rdquo;) collects, uses, discloses, and otherwise processes personal information about Users of the website located at ournextproject.us and any related subdomains, applications, features, content, and services (collectively, the &ldquo;<strong>Platform</strong>&rdquo; or &ldquo;<strong>Services</strong>&rdquo;).</p>
          <p style={pStyle}>A plain-English summary is available <Link href="/privacy" style={{ color: "#C8102E" }}>here</Link>. In the event of any conflict, <strong>this Policy controls</strong>. This Policy is incorporated into our <Link href="/terms/legal" style={{ color: "#C8102E" }}>Terms of Service</Link>.</p>
          <div style={{ background: "#1E3A8A", borderRadius: "8px", padding: "16px 20px", fontSize: "13px", color: "#FFFFFF", fontWeight: 600, lineHeight: 1.7 }}>
            BY ACCESSING OR USING THE PLATFORM, YOU ACKNOWLEDGE THAT YOU HAVE READ AND UNDERSTOOD THIS POLICY.
          </div>
        </div>

        {/* Section 1 */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>1. Information We Collect</h2>
          <div style={dividerStyle} />
          <h3 style={h3Style}>1.1 Information You Provide Directly</h3>
          <ul style={{ paddingLeft: "24px", marginBottom: "12px" }}>
            <li style={liStyle}><strong>(a) Account Registration.</strong> Name, email, password (hashed), phone, mailing address, account type, and for business accounts, business legal name, DBA, and entity type.</li>
            <li style={liStyle}><strong>(b) Contractor Verification.</strong> License number, issuing authority, license status, certificate of insurance, BBB identifier and rating, and CVOB documentation where applicable.</li>
            <li style={liStyle}><strong>(c) Project and Bid Information.</strong> Descriptions, scope, photos, plans, location, timing, budget, Bids (including amount and version history), Awards, and related communications.</li>
            <li style={liStyle}><strong>(d) Inspection Information.</strong> Inspection requests, scheduling, on-site notes, photographs, and reports.</li>
            <li style={liStyle}><strong>(e) Messages and Communications.</strong> Content of messages exchanged through the Platform, communications with ONP, and content of reviews and ratings.</li>
            <li style={liStyle}><strong>(f) Payment Information.</strong> Card data is collected and processed by <strong>Stripe, Inc.</strong> ONP receives only a limited token (card brand, last four digits, transaction status) and does not store full card numbers.</li>
            <li style={liStyle}><strong>(g) Support and Correspondence.</strong> Information provided when contacting support@ournextproject.us.</li>
          </ul>
          <h3 style={h3Style}>1.2 Information Collected Automatically</h3>
          <ul style={{ paddingLeft: "24px", marginBottom: "12px" }}>
            <li style={liStyle}><strong>(a) Device and Connection Data.</strong> IP address, device type, OS, browser type and version, language, time zone.</li>
            <li style={liStyle}><strong>(b) Usage Data.</strong> Pages visited, features used, click activity, referring/exit URLs, session duration, search queries, and timestamps.</li>
            <li style={liStyle}><strong>(c) Cookies, Pixels, and Similar Technologies.</strong> See Section 6.</li>
            <li style={liStyle}><strong>(d) Approximate Location.</strong> Derived from IP address. Precise geolocation is not collected unless you provide it.</li>
          </ul>
          <h3 style={h3Style}>1.3 Information from Third Parties</h3>
          <ul style={{ paddingLeft: "24px" }}>
            <li style={liStyle}><strong>(a) State Licensing Authorities</strong> — license status, validity, and disciplinary status.</li>
            <li style={liStyle}><strong>(b) Insurance Carriers/Brokers</strong> — certificate validity.</li>
            <li style={liStyle}><strong>(c) Better Business Bureau</strong> — public business profile, rating, and complaint information.</li>
            <li style={liStyle}><strong>(d) CVOB Registry</strong> — veteran-owned business certification confirmation.</li>
            <li style={liStyle}><strong>(e) Service Providers and Advertising Partners</strong> — analytics, fraud detection, and limited demographic attributes.</li>
          </ul>
        </div>

        {/* Section 2 */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>2. Sources, Categories, and Purposes</h2>
          <div style={dividerStyle} />
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", marginBottom: "16px" }}>
              <thead>
                <tr style={{ background: "#1E3A8A", color: "#fff" }}>
                  {["Category", "Examples", "Sources", "Purposes"].map((h) => (
                    <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["Identifiers", "Name, email, phone, IP, account ID", "You, automatic", "Account creation, authentication, fraud prevention"],
                  ["Customer records", "Address, business info, payment summary", "You, Stripe", "Billing, service delivery, compliance"],
                  ["Commercial information", "Projects, Bids, transactions", "You, Platform", "Service delivery, analytics"],
                  ["Internet / network activity", "Browsing, usage, cookie data", "Automatic", "Analytics, security, advertising"],
                  ["Geolocation (approximate)", "IP-derived location", "Automatic", "Service localization, fraud prevention"],
                  ["Professional information", "License, insurance, BBB, CVOB", "You, third parties", "Verification, badge display"],
                  ["Inferences", "Engagement preferences", "Derived", "Personalization, marketing"],
                  ["Sensitive (limited)", "Veteran status (where claimed)", "You, CVOB registry", "CVOB badge display only"],
                ].map(([cat, ex, src, purp], i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? "#FFFFFF" : "#EEF4FF" }}>
                    <td style={{ padding: "9px 12px", borderBottom: "1px solid #B8D0E8", fontWeight: 600 }}>{cat}</td>
                    <td style={{ padding: "9px 12px", borderBottom: "1px solid #B8D0E8", color: "#4A7FB5" }}>{ex}</td>
                    <td style={{ padding: "9px 12px", borderBottom: "1px solid #B8D0E8", color: "#4A7FB5" }}>{src}</td>
                    <td style={{ padding: "9px 12px", borderBottom: "1px solid #B8D0E8", color: "#4A7FB5" }}>{purp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={pStyle}>We do <strong>not</strong> knowingly collect Social Security numbers, driver&apos;s license numbers, financial account numbers, precise geolocation, biometric data, or health data.</p>
        </div>

        {/* Section 3 */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>3. How We Use Personal Information</h2>
          <div style={dividerStyle} />
          <ul style={{ paddingLeft: "24px" }}>
            {[
              "to provide, operate, maintain, secure, and improve the Platform and the Services;",
              "to verify Contractor licensing, insurance, BBB status, and CVOB status;",
              "to facilitate Project posting, bidding, Awards, communications, and Inspections;",
              "to process payments via Stripe and to administer subscriptions and Inspection fees;",
              "to send transactional communications, which you cannot opt out of while maintaining an account;",
              "to send marketing communications about ONP news, features, and updates, from which you may opt out at any time;",
              "to display advertisements on the Platform from third-party suppliers and retailers;",
              "to measure, analyze, and improve Platform usage, performance, and content;",
              "to detect, investigate, and prevent fraud, abuse, security incidents, and Terms violations;",
              "to comply with legal obligations and respond to lawful requests from authorities; and",
              "for any other purpose disclosed to you at the point of collection or for which you provide consent.",
            ].map((item, i) => (
              <li key={i} style={liStyle}>({String.fromCharCode(97 + i)}) {item}</li>
            ))}
          </ul>
        </div>

        {/* Section 4 */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>4. Disclosure of Personal Information</h2>
          <div style={dividerStyle} />
          <h3 style={h3Style}>4.1 Service Providers and Processors</h3>
          <ul style={{ paddingLeft: "24px", marginBottom: "12px" }}>
            <li style={liStyle}><strong>Payment Processing:</strong> Stripe, Inc.</li>
            <li style={liStyle}><strong>Hosting and Infrastructure:</strong> Vercel, Inc.</li>
            <li style={liStyle}><strong>Database, Authentication, and Storage:</strong> Supabase, Inc.</li>
            <li style={liStyle}><strong>Email Delivery:</strong> [EMAIL SERVICE PROVIDER]</li>
            <li style={liStyle}><strong>Verification Partners:</strong> state licensing portals, insurance verification services, BBB, CVOB registry.</li>
            <li style={liStyle}><strong>Analytics and Performance:</strong> [ANALYTICS PROVIDER(S), IF ANY]</li>
            <li style={liStyle}><strong>Customer Support Tools:</strong> [SUPPORT PROVIDER(S), IF ANY]</li>
          </ul>
          <h3 style={h3Style}>4.2 Other Users</h3>
          <ul style={{ paddingLeft: "24px", marginBottom: "12px" }}>
            <li style={liStyle}>(a) Contractor public profile is visible to Clients.</li>
            <li style={liStyle}>(b) Project information is visible to Contractors eligible to Bid.</li>
            <li style={liStyle}>(c) Bid information is visible to the Client who posted the Project.</li>
            <li style={liStyle}>(d) Messages are visible to the recipient.</li>
            <li style={liStyle}>(e) Reviews and ratings are visible publicly.</li>
          </ul>
          <h3 style={h3Style}>4.3 Advertisers and Advertising Partners</h3>
          <p style={pStyle}>We display advertising from third parties. These partners may set cookies or pixels to measure ad performance and deliver tailored advertising. Such disclosures may constitute a &ldquo;sale&rdquo; or &ldquo;share&rdquo; under certain state laws (see Section 7).</p>
          <h3 style={h3Style}>4.4 Corporate Transactions</h3>
          <p style={pStyle}>In the event of a merger, acquisition, or sale of assets, personal information may be transferred to the successor entity.</p>
          <h3 style={h3Style}>4.5 Legal and Safety Disclosures</h3>
          <p style={pStyle}>We may disclose personal information to comply with applicable law, enforce the Terms of Service, address fraud or security issues, or protect the rights and safety of ONP, our Users, or the public.</p>
          <h3 style={h3Style}>4.6 No Sale for Money</h3>
          <p style={pStyle}>ONP does <strong>not</strong> sell personal information for monetary consideration. Certain advertising-related disclosures may constitute a &ldquo;sale&rdquo; or &ldquo;sharing&rdquo; under specific state statutes; opt-out instructions are in Section 7.</p>
        </div>

        {/* Section 5 */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>5. Marketing and Communications</h2>
          <div style={dividerStyle} />
          <p style={pStyle}><strong>5.1 Transactional Communications.</strong> Communications regarding your account, security, payments, Bids, Awards, and Inspections are integral to the Service and are not subject to marketing opt-out while you maintain an account.</p>
          <p style={pStyle}><strong>5.2 Marketing Communications.</strong> You may opt out at any time by using the unsubscribe link in any marketing email or by contacting support@ournextproject.us.</p>
          <p style={pStyle}><strong>5.3 SMS/Text Communications.</strong> If you opt in to receive text messages, message and data rates may apply. Reply STOP to opt out.</p>
        </div>

        {/* Section 6 */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>6. Cookies and Similar Technologies</h2>
          <div style={dividerStyle} />
          <p style={pStyle}><strong>6.1</strong> We use first-party and third-party cookies, web beacons, pixels, and local storage to authenticate Users, remember preferences, analyze usage, and deliver and measure advertising.</p>
          <p style={pStyle}><strong>6.2 Types:</strong></p>
          <ul style={{ paddingLeft: "24px", marginBottom: "12px" }}>
            <li style={liStyle}><strong>(a) Strictly Necessary</strong> — required for core functionality.</li>
            <li style={liStyle}><strong>(b) Functional</strong> — remember preferences and settings.</li>
            <li style={liStyle}><strong>(c) Analytics</strong> — measure usage and performance.</li>
            <li style={liStyle}><strong>(d) Advertising</strong> — used by ad partners to measure performance and tailor advertising.</li>
          </ul>
          <p style={pStyle}><strong>6.3</strong> You may control cookies through your browser settings. Some Platform features may not function correctly if cookies are disabled.</p>
          <p style={pStyle}><strong>6.4 Do Not Track.</strong> We do not currently respond to &ldquo;Do Not Track&rdquo; signals. Where required by law, we honor recognized Global Privacy Control (&ldquo;GPC&rdquo;) signals as an opt-out of sale or sharing.</p>
        </div>

        {/* Section 7 */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>7. State Privacy Rights</h2>
          <div style={dividerStyle} />
          <ul style={{ paddingLeft: "24px", marginBottom: "16px" }}>
            <li style={liStyle}><strong>(a) Right to Know / Access</strong> the categories and specific pieces of personal information we have collected.</li>
            <li style={liStyle}><strong>(b) Right to Correct</strong> inaccurate personal information.</li>
            <li style={liStyle}><strong>(c) Right to Delete</strong> personal information, subject to legal and operational exceptions.</li>
            <li style={liStyle}><strong>(d) Right to Data Portability</strong> — receive your data in a portable, machine-readable format.</li>
            <li style={liStyle}><strong>(e) Right to Opt Out of Sale or Sharing</strong> of personal information, including for targeted advertising.</li>
            <li style={liStyle}><strong>(f) Right to Limit Use of Sensitive Personal Information</strong> (where applicable).</li>
            <li style={liStyle}><strong>(g) Right to Non-Discrimination</strong> for exercising privacy rights.</li>
            <li style={liStyle}><strong>(h) Right to Appeal</strong> a denial of a privacy request (Colorado, Virginia, Connecticut, and similar).</li>
          </ul>
          <h3 style={h3Style}>7.1 How to Exercise Rights</h3>
          <p style={pStyle}>Email <strong>support@ournextproject.us</strong> with subject &ldquo;Privacy Request,&rdquo; including your full name, account email, state of residence, and the specific right being exercised. We will respond within the time required by applicable law (typically 45 days).</p>
          <h3 style={h3Style}>7.2 Authorized Agents</h3>
          <p style={pStyle}>You may designate an authorized agent to submit a request. We require written, signed authorization and may require you to verify your identity directly.</p>
          <h3 style={h3Style}>7.3 Opt-Out of Sale or Sharing</h3>
          <p style={pStyle}>Email support@ournextproject.us with &ldquo;Opt Out — Sale/Sharing&rdquo; in the subject, or transmit a recognized GPC signal from your browser.</p>
        </div>

        {/* Sections 8–14 */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>8. Children&apos;s Privacy</h2>
          <div style={dividerStyle} />
          <p style={pStyle}>The Platform is intended for individuals <strong>at least 18 years of age</strong>. We do not knowingly collect personal information from anyone under 18. Parents or guardians who believe a minor has provided information to us should contact support@ournextproject.us.</p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>9. Data Security</h2>
          <div style={dividerStyle} />
          <p style={pStyle}>ONP implements administrative, technical, and physical safeguards including encryption in transit, access controls, vetted infrastructure providers (Vercel, Supabase), and Stripe for payment card processing in accordance with PCI DSS. No method of transmission or storage is completely secure.</p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>10. Data Retention</h2>
          <div style={dividerStyle} />
          <p style={pStyle}>We retain personal information for as long as your account is active and as long as necessary to provide the Services, comply with legal obligations, resolve disputes, and enforce our agreements. Public Content (e.g., reviews and ratings) may persist after account closure. When no longer needed, we will delete, anonymize, or aggregate it.</p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>11. International Users; Data Location</h2>
          <div style={dividerStyle} />
          <p style={pStyle}>The Platform is operated from, and personal information is processed in, the <strong>United States</strong>. If you access the Platform from outside the United States, you consent to the transfer and processing of your personal information in the United States.</p>
          <p style={pStyle}>ONP does not market the Services outside the United States and does not currently rely on the GDPR or UK GDPR transfer mechanisms.</p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>12. Third-Party Sites and Services</h2>
          <div style={dividerStyle} />
          <p style={pStyle}>The Platform may contain links to third-party websites and services, and may display third-party advertising. This Policy does not apply to those sites or services.</p>
        </div>

        <div style={sectionStyle}>
          <h2 style={h2Style}>13. Changes to This Policy</h2>
          <div style={dividerStyle} />
          <p style={pStyle}>We may update this Policy from time to time. Material changes will be communicated by posting the updated Policy with a revised &ldquo;Last Updated&rdquo; date and, where appropriate, by email notice. Continued use of the Platform after any update constitutes acceptance.</p>
        </div>

        <div style={{ marginBottom: "44px" }}>
          <h2 style={h2Style}>14. Contact</h2>
          <div style={dividerStyle} />
          <div style={{ background: "#EEF4FF", border: "1px solid #B8D0E8", borderRadius: "8px", padding: "16px 20px", fontSize: "15px", color: "#1E3A8A", lineHeight: 1.9 }}>
            <strong>Our Next Project, LLC</strong><br />
            Attn: Privacy<br />
            [BUSINESS ADDRESS]<br />
            <a href="mailto:support@ournextproject.us" style={{ color: "#1B4F8A" }}>support@ournextproject.us</a>
          </div>
        </div>

        {/* Cross-link */}
        <div style={{ borderTop: "1px solid #B8D0E8", paddingTop: "32px", textAlign: "center" }}>
          <p style={{ fontSize: "13px", color: "#4A7FB5", marginBottom: "12px" }}>Looking for the plain English version?</p>
          <Link href="/privacy" style={{ display: "inline-block", color: "#1B4F8A", border: "1px solid #B8D0E8", padding: "10px 24px", borderRadius: "6px", fontSize: "13px", textDecoration: "none", fontWeight: 500 }}>
            ← Plain English Privacy Policy
          </Link>
        </div>
      </main>

      <div style={{ borderTop: "1px solid #B8D0E8", padding: "20px 28px", textAlign: "center", fontSize: "12px", color: "#4A7FB5", letterSpacing: "1px", textTransform: "uppercase" }}>
        © 2026 Our Next Project — Honoring American Veterans
      </div>
    </div>
  );
}
