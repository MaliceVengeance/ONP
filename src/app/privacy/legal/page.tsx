import Link from "next/link";

export const metadata = { title: "Privacy Policy (Legal) — Our Next Project" };

export default function PrivacyLegalPage() {
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
            Privacy Policy
          </h1>
          <div style={{ width: "60px", height: "3px", background: "#C8102E", marginBottom: "20px" }} />
          <p style={{ fontSize: "14px", color: "#4A7FB5", marginBottom: "4px" }}><strong>Our Next Project, LLC</strong></p>
          <p style={{ fontSize: "14px", color: "#4A7FB5", marginBottom: "4px" }}>Effective Date: [EFFECTIVE DATE]</p>
          <p style={{ fontSize: "14px", color: "#4A7FB5", marginBottom: "20px" }}>Last Updated: [LAST UPDATED DATE]</p>

          <p style={{ fontSize: "15px", color: "#1B4F8A", lineHeight: 1.8, marginBottom: "16px" }}>
            This Privacy Policy (the &ldquo;<strong>Policy</strong>&rdquo;) describes how <strong>Our Next Project, LLC</strong> (&ldquo;<strong>ONP</strong>,&rdquo; &ldquo;<strong>we</strong>,&rdquo; &ldquo;<strong>us</strong>,&rdquo; or &ldquo;<strong>our</strong>&rdquo;) collects, uses, discloses, and otherwise processes personal information about Users of the website located at ournextproject.us and any related subdomains, applications, features, content, and services (collectively, the &ldquo;<strong>Platform</strong>&rdquo; or &ldquo;<strong>Services</strong>&rdquo;).
          </p>
          <p style={{ fontSize: "15px", color: "#1B4F8A", lineHeight: 1.8, marginBottom: "16px" }}>
            A plain-English summary of this Policy is available{" "}
            <Link href="/privacy" style={{ color: "#C8102E" }}>here</Link>.
            {" "}In the event of any conflict, <strong>this Policy controls</strong>. This Policy is incorporated into, and forms part of, our{" "}
            <Link href="/terms/legal" style={{ color: "#C8102E" }}>Terms of Service</Link>.
            {" "}Capitalized terms not defined here have the meanings given in the Terms of Service.
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
          }}>
            BY ACCESSING OR USING THE PLATFORM, YOU ACKNOWLEDGE THAT YOU HAVE READ AND UNDERSTOOD THIS POLICY.
          </div>
        </div>

        {/* Shared styles */}
        <style>{`
          .legal-h2 {
            font-family: 'Barlow Condensed', sans-serif;
            font-weight: 700;
            font-size: 24px;
            letter-spacing: 1px;
            color: #0A1628;
            text-transform: uppercase;
            margin: 0 0 6px 0;
          }
          .legal-h3 {
            font-size: 15px;
            font-weight: 700;
            color: #0A1628;
            margin: 20px 0 8px 0;
          }
          .legal-divider {
            width: 36px;
            height: 2px;
            background: #C8102E;
            margin-bottom: 18px;
          }
          .legal-section {
            margin-bottom: 44px;
            padding-bottom: 44px;
            border-bottom: 1px solid #EEF4FF;
          }
          .legal-section:last-of-type {
            border-bottom: none;
          }
          .legal-p {
            font-size: 15px;
            color: #1B4F8A;
            line-height: 1.85;
            margin-bottom: 12px;
          }
          .legal-list {
            margin: 0 0 12px 0;
            padding-left: 24px;
          }
          .legal-list li {
            font-size: 15px;
            color: #1B4F8A;
            line-height: 1.85;
            margin-bottom: 8px;
          }
        `}</style>

        {/* Section 1 */}
        <div className="legal-section">
          <h2 className="legal-h2">1. Information We Collect</h2>
          <div className="legal-divider" />

          <h3 className="legal-h3">1.1 Information You Provide Directly</h3>
          <ul className="legal-list">
            <li><strong>(a) Account Registration Information.</strong> Name, email address, password (hashed), telephone number, mailing address, account type (Client, Contractor, Inspector, or Administrator), and, for business accounts, business legal name, DBA, and entity type.</li>
            <li><strong>(b) Contractor Verification Information.</strong> Contractor license number, issuing authority, license status, certificate of insurance (carrier, policy number, coverage limits, effective dates, named insured), Better Business Bureau (&ldquo;BBB&rdquo;) business identifier and rating, and, where applicable, Certified Veteran Owned Business (&ldquo;CVOB&rdquo;) documentation.</li>
            <li><strong>(c) Project and Bid Information.</strong> Project descriptions, scope of work, photographs, plans, attachments, location information, timing, budget, requests for information, Bids (including amount and version history), Awards, and related communications.</li>
            <li><strong>(d) Inspection Information.</strong> Inspection requests, scheduling information, on-site notes, photographs, and Inspection reports.</li>
            <li><strong>(e) Messages and Communications.</strong> Content of messages exchanged between Users through the Platform, communications with ONP, and content of reviews and ratings.</li>
            <li><strong>(f) Payment Information.</strong> When you submit payment, your card data is collected and processed by <strong>Stripe, Inc.</strong> (&ldquo;Stripe&rdquo;). ONP receives a limited token or summary (e.g., card brand, last four digits, transaction status) but does not store full payment card numbers on its systems.</li>
            <li><strong>(g) Support and Correspondence.</strong> Information you provide when contacting support@ournextproject.us or otherwise corresponding with us.</li>
          </ul>

          <h3 className="legal-h3">1.2 Information Collected Automatically</h3>
          <ul className="legal-list">
            <li><strong>(a) Device and Connection Data.</strong> IP address, device type, operating system, browser type and version, language, time zone, and similar technical identifiers.</li>
            <li><strong>(b) Usage Data.</strong> Pages visited, features used, click and tap activity, referring/exit URLs, session duration, search queries within the Platform, and timestamps.</li>
            <li><strong>(c) Cookies, Pixels, and Similar Technologies.</strong> See Section 6.</li>
            <li><strong>(d) Approximate Location.</strong> Derived from IP address. Precise geolocation is not collected unless you affirmatively provide it.</li>
          </ul>

          <h3 className="legal-h3">1.3 Information from Third Parties</h3>
          <ul className="legal-list">
            <li><strong>(a)</strong> <strong>State Licensing Authorities</strong> — confirmation of Contractor license status, license number validity, and disciplinary status.</li>
            <li><strong>(b)</strong> <strong>Insurance Carriers/Brokers</strong> — confirmation of insurance certificate validity.</li>
            <li><strong>(c)</strong> <strong>Better Business Bureau</strong> — public business profile, rating, and complaint information.</li>
            <li><strong>(d)</strong> <strong>CVOB Registry or Equivalent</strong> — confirmation of veteran-owned business certification.</li>
            <li><strong>(e)</strong> <strong>Service Providers and Advertising Partners</strong> — analytics, fraud detection, and limited demographic or behavioral attributes used for service improvement and advertising.</li>
          </ul>
        </div>

        {/* Section 2 */}
        <div className="legal-section">
          <h2 className="legal-h2">2. Sources, Categories, and Purposes of Processing</h2>
          <div className="legal-divider" />
          <p className="legal-p">
            The following table summarizes the categories of personal information we process (for purposes of state privacy laws), their sources, and our purposes.
          </p>
          <div style={{ overflowX: "auto" }}>
            <table style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "13px",
              color: "#0A1628",
              marginBottom: "16px",
            }}>
              <thead>
                <tr style={{ background: "#0A1628", color: "#fff" }}>
                  <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600 }}>Category</th>
                  <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600 }}>Examples</th>
                  <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600 }}>Sources</th>
                  <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600 }}>Purposes</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Identifiers", "Name, email, phone, IP, account ID", "You, automatic", "Account creation, authentication, communication, fraud prevention"],
                  ["Customer records", "Postal address, business info, payment summary", "You, Stripe", "Billing, service delivery, compliance"],
                  ["Commercial information", "Projects, Bids, transactions, subscription status", "You, Platform", "Service delivery, analytics"],
                  ["Internet / network activity", "Browsing, usage, cookie data", "Automatic", "Analytics, security, advertising"],
                  ["Geolocation (approximate)", "IP-derived location", "Automatic", "Service localization, fraud prevention"],
                  ["Professional information", "Contractor license, insurance, BBB, CVOB", "You, third parties", "Verification, badge display"],
                  ["Inferences", "Engagement preferences, contractor categories of interest", "Derived", "Personalization, marketing"],
                  ["Sensitive (limited)", "Veteran status (where claimed)", "You, CVOB registry", "CVOB badge display (only with your submission)"],
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
          <p className="legal-p">
            We do <strong>not</strong> knowingly collect Social Security numbers, driver&apos;s license numbers, financial account numbers, precise geolocation, biometric data, health data, or other sensitive categories beyond those listed.
          </p>
        </div>

        {/* Section 3 */}
        <div className="legal-section">
          <h2 className="legal-h2">3. How We Use Personal Information</h2>
          <div className="legal-divider" />
          <p className="legal-p">We process personal information for the following purposes:</p>
          <ul className="legal-list">
            <li>(a) to provide, operate, maintain, secure, and improve the Platform and the Services;</li>
            <li>(b) to verify Contractor licensing, insurance, BBB status, and CVOB status;</li>
            <li>(c) to facilitate Project posting, bidding, Awards, communications, and Inspections;</li>
            <li>(d) to process payments via Stripe and to administer subscriptions and Inspection fees;</li>
            <li>(e) to send transactional communications (account, security, billing, Project notifications), which you cannot opt out of while maintaining an account;</li>
            <li>(f) to send marketing and informational communications about ONP news, features, and updates, from which you may opt out at any time;</li>
            <li>(g) to display advertisements on the Platform, including advertisements from third-party suppliers and retailers;</li>
            <li>(h) to measure, analyze, and improve Platform usage, performance, and content;</li>
            <li>(i) to detect, investigate, and prevent fraud, abuse, security incidents, and violations of the Terms of Service;</li>
            <li>(j) to comply with legal obligations, respond to lawful requests from authorities, and exercise or defend legal claims; and</li>
            <li>(k) for any other purpose disclosed to you at the point of collection or for which you provide consent.</li>
          </ul>
        </div>

        {/* Section 4 */}
        <div className="legal-section">
          <h2 className="legal-h2">4. Disclosure of Personal Information</h2>
          <div className="legal-divider" />
          <p className="legal-p">We disclose personal information to the following categories of recipients:</p>

          <h3 className="legal-h3">4.1 Service Providers and Processors</h3>
          <p className="legal-p">We share personal information with third-party vendors who process it on our behalf and under contractual obligations restricting their use. Categories and specific vendors include:</p>
          <ul className="legal-list">
            <li><strong>Payment Processing:</strong> Stripe, Inc.</li>
            <li><strong>Hosting and Infrastructure:</strong> Vercel, Inc.</li>
            <li><strong>Database, Authentication, and Storage:</strong> Supabase, Inc.</li>
            <li><strong>Email Delivery (Transactional and Marketing):</strong> [EMAIL SERVICE PROVIDER]</li>
            <li><strong>Verification Partners:</strong> state licensing portals, insurance verification services, BBB, CVOB registry, and similar verification providers.</li>
            <li><strong>Analytics and Performance:</strong> [ANALYTICS PROVIDER(S), IF ANY]</li>
            <li><strong>Customer Support Tools:</strong> [SUPPORT PROVIDER(S), IF ANY]</li>
          </ul>

          <h3 className="legal-h3">4.2 Other Users</h3>
          <p className="legal-p">Certain information is disclosed to other Users to enable the Platform:</p>
          <ul className="legal-list">
            <li>(a) Contractor public profile information (business name, location, categories, badges, ratings, reviews) is visible to Clients.</li>
            <li>(b) Project information is visible to Contractors invited or eligible to Bid.</li>
            <li>(c) Bid information is visible to the Client who posted the Project.</li>
            <li>(d) Messages exchanged between Users are visible to the recipient.</li>
            <li>(e) Reviews and ratings are visible publicly on the Platform.</li>
          </ul>

          <h3 className="legal-h3">4.3 Advertisers and Advertising Partners</h3>
          <p className="legal-p">
            We display advertising from third parties. Depending on the advertising relationship, these partners may set cookies, pixels, or other identifiers to measure ad performance and to deliver tailored advertising on or off the Platform. The disclosure of online identifiers and usage data to such partners may constitute a &ldquo;sale&rdquo; or &ldquo;share&rdquo; of personal information under certain state laws (see Section 7).
          </p>

          <h3 className="legal-h3">4.4 Corporate Transactions</h3>
          <p className="legal-p">
            In the event of a merger, acquisition, financing, reorganization, dissolution, sale of all or part of our assets, or similar transaction, personal information may be transferred to the successor entity as part of the transaction.
          </p>

          <h3 className="legal-h3">4.5 Legal and Safety Disclosures</h3>
          <p className="legal-p">
            We may disclose personal information if we believe in good faith that disclosure is necessary to (a) comply with applicable law, regulation, legal process, or governmental request; (b) enforce the Terms of Service; (c) detect, investigate, or address fraud, security, or technical issues; or (d) protect the rights, property, or safety of ONP, our Users, or the public.
          </p>

          <h3 className="legal-h3">4.6 With Your Direction or Consent</h3>
          <p className="legal-p">We may disclose personal information for other purposes with your direction or consent.</p>

          <h3 className="legal-h3">4.7 No Sale for Money</h3>
          <p className="legal-p">
            ONP does <strong>not</strong> sell personal information for monetary consideration. Certain advertising-related disclosures may, however, constitute a &ldquo;sale&rdquo; or &ldquo;sharing&rdquo; under specific state privacy statutes; opt-out instructions are in Section 7.
          </p>
        </div>

        {/* Section 5 */}
        <div className="legal-section">
          <h2 className="legal-h2">5. Marketing and Communications</h2>
          <div className="legal-divider" />
          <p className="legal-p">
            <strong>5.1 Transactional Communications.</strong> Communications regarding your account, security, payments, Bids, Awards, Inspections, and related operational matters are integral to the Service and are not subject to marketing opt-out while you maintain an account.
          </p>
          <p className="legal-p">
            <strong>5.2 Marketing Communications.</strong> Marketing emails relate to ONP news, features, promotions, and updates. You may opt out at any time by using the unsubscribe link in any such email or by contacting support@ournextproject.us. Opt-out requests are processed promptly.
          </p>
          <p className="legal-p">
            <strong>5.3 SMS/Text Communications.</strong> If you opt in to receive text messages, message and data rates may apply. Reply STOP to opt out.
          </p>
        </div>

        {/* Section 6 */}
        <div className="legal-section">
          <h2 className="legal-h2">6. Cookies and Similar Technologies</h2>
          <div className="legal-divider" />
          <p className="legal-p">
            <strong>6.1 Cookies.</strong> We use first-party and third-party cookies, web beacons, pixels, local storage, and similar technologies to authenticate Users, remember preferences, analyze usage, secure the Platform, and deliver and measure advertising.
          </p>
          <p className="legal-p"><strong>6.2 Types of Cookies Used.</strong></p>
          <ul className="legal-list">
            <li><strong>(a) Strictly Necessary</strong> — required for core Platform functionality (e.g., authentication, security).</li>
            <li><strong>(b) Functional</strong> — remember preferences and settings.</li>
            <li><strong>(c) Analytics</strong> — measure usage and performance.</li>
            <li><strong>(d) Advertising</strong> — used by ad partners to measure performance and tailor advertising.</li>
          </ul>
          <p className="legal-p">
            <strong>6.3 Managing Cookies.</strong> You may control cookies through your browser settings. Some Platform features may not function correctly if cookies are disabled.
          </p>
          <p className="legal-p">
            <strong>6.4 Do Not Track.</strong> We do not currently respond to &ldquo;Do Not Track&rdquo; browser signals. Where required by law (e.g., California), we honor recognized Global Privacy Control (&ldquo;GPC&rdquo;) signals as an opt-out of the &ldquo;sale&rdquo; or &ldquo;sharing&rdquo; of personal information.
          </p>
        </div>

        {/* Section 7 */}
        <div className="legal-section">
          <h2 className="legal-h2">7. State Privacy Rights</h2>
          <div className="legal-divider" />
          <p className="legal-p">Subject to verification and applicable law, residents of certain U.S. states have the following rights:</p>
          <ul className="legal-list">
            <li><strong>(a) Right to Know / Access</strong> the categories and specific pieces of personal information we have collected and disclosed.</li>
            <li><strong>(b) Right to Correct</strong> inaccurate personal information.</li>
            <li><strong>(c) Right to Delete</strong> personal information, subject to legal and operational exceptions.</li>
            <li><strong>(d) Right to Data Portability</strong> — receive your personal information in a portable, machine-readable format.</li>
            <li><strong>(e) Right to Opt Out of Sale or Sharing</strong> of personal information, including for targeted advertising.</li>
            <li><strong>(f) Right to Limit Use of Sensitive Personal Information</strong> (where applicable).</li>
            <li><strong>(g) Right to Non-Discrimination</strong> for exercising privacy rights.</li>
            <li><strong>(h) Right to Appeal</strong> a denial of a privacy request (Colorado, Virginia, Connecticut, and similar).</li>
          </ul>

          <h3 className="legal-h3">7.1 How to Exercise Rights</h3>
          <p className="legal-p">
            Submit a request by emailing <strong>support@ournextproject.us</strong> with the subject line &ldquo;Privacy Request&rdquo; and including your full name, account email address, state of residence, and the specific right being exercised. We will verify your identity by matching your request against your account information and may request additional information if necessary. Responses will be provided within the time required by applicable law (typically 45 days, extendable as permitted).
          </p>

          <h3 className="legal-h3">7.2 Authorized Agents</h3>
          <p className="legal-p">
            You may designate an authorized agent to submit a request on your behalf. We require written, signed authorization and may require you to verify your identity directly.
          </p>

          <h3 className="legal-h3">7.3 Opt-Out of &ldquo;Sale&rdquo; or &ldquo;Sharing&rdquo;</h3>
          <p className="legal-p">
            To opt out of advertising-related disclosures that may constitute a &ldquo;sale&rdquo; or &ldquo;share&rdquo; of personal information, email support@ournextproject.us with &ldquo;Opt Out — Sale/Sharing&rdquo; in the subject, or transmit a recognized GPC signal from your browser.
          </p>
        </div>

        {/* Section 8 */}
        <div className="legal-section">
          <h2 className="legal-h2">8. Children&apos;s Privacy</h2>
          <div className="legal-divider" />
          <p className="legal-p">
            The Platform is intended for individuals <strong>at least 18 years of age</strong>. We do not knowingly collect personal information from anyone under 18. If we learn that we have collected personal information from a person under 18, we will delete it. Parents or guardians who believe a minor has provided information to us should contact support@ournextproject.us.
          </p>
        </div>

        {/* Section 9 */}
        <div className="legal-section">
          <h2 className="legal-h2">9. Data Security</h2>
          <div className="legal-divider" />
          <p className="legal-p">
            ONP implements administrative, technical, and physical safeguards reasonably designed to protect personal information against unauthorized access, disclosure, alteration, and destruction. Measures include encryption in transit, access controls, the use of vetted infrastructure providers (Vercel, Supabase), and the use of Stripe for payment card processing in accordance with PCI DSS. No method of transmission or storage is completely secure, and we cannot guarantee absolute security.
          </p>
        </div>

        {/* Section 10 */}
        <div className="legal-section">
          <h2 className="legal-h2">10. Data Retention</h2>
          <div className="legal-divider" />
          <p className="legal-p">
            We retain personal information for as long as your account is active, for as long as necessary to provide the Services, and for additional periods as required to comply with legal obligations, resolve disputes, prevent fraud or abuse, and enforce our agreements. Public Content (e.g., reviews and ratings) may persist on the Platform after account closure in accordance with the Terms of Service. When personal information is no longer needed, we will delete, anonymize, or aggregate it.
          </p>
        </div>

        {/* Section 11 */}
        <div className="legal-section">
          <h2 className="legal-h2">11. International Users; Data Location</h2>
          <div className="legal-divider" />
          <p className="legal-p">
            The Platform is operated from, and personal information is processed in, the <strong>United States</strong>. If you access the Platform from outside the United States, you understand and consent that your personal information will be transferred to and processed in the United States, which may have data protection laws that differ from those in your jurisdiction.
          </p>
          <p className="legal-p">
            ONP does not market the Services outside the United States and does not currently rely on the GDPR or UK GDPR transfer mechanisms.
          </p>
        </div>

        {/* Section 12 */}
        <div className="legal-section">
          <h2 className="legal-h2">12. Third-Party Sites and Services</h2>
          <div className="legal-divider" />
          <p className="legal-p">
            The Platform may contain links to third-party websites and services, and may display third-party advertising. This Policy does not apply to those sites or services. We encourage you to review their privacy policies before providing information.
          </p>
        </div>

        {/* Section 13 */}
        <div className="legal-section">
          <h2 className="legal-h2">13. Changes to This Policy</h2>
          <div className="legal-divider" />
          <p className="legal-p">
            We may update this Policy from time to time. Material changes will be communicated by posting the updated Policy on the Platform with a revised &ldquo;Last Updated&rdquo; date and, where appropriate, by email notice. Continued use of the Platform after the effective date of any update constitutes acceptance.
          </p>
        </div>

        {/* Section 14 */}
        <div className="legal-section">
          <h2 className="legal-h2">14. Contact</h2>
          <div className="legal-divider" />
          <p className="legal-p">For questions, complaints, or to submit a privacy request:</p>
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
            Attn: Privacy<br />
            [BUSINESS ADDRESS]<br />
            <a href="mailto:support@ournextproject.us" style={{ color: "#1B4F8A" }}>support@ournextproject.us</a>
          </div>
        </div>

        {/* Cross-link */}
        <div style={{ borderTop: "1px solid #B8D0E8", paddingTop: "32px", textAlign: "center" }}>
          <p style={{ fontSize: "13px", color: "#4A7FB5", marginBottom: "12px" }}>
            Looking for the plain English version?
          </p>
          <Link href="/privacy" style={{
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
            ← Plain English Privacy Policy
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
