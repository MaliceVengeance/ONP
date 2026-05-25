import Link from "next/link";

export const metadata = {
  title: "Contractor Bidding Guide — ONP Help",
  description: "How to price your bids, use RFIs, and understand your obligations on the ONP platform.",
};

export default function HelpContractorBidsPage() {
  const sectionStyle = {
    background: "#EEF4FF",
    border: "1px solid #B8D0E8",
    borderRadius: "12px",
    padding: "24px 28px",
    marginBottom: "20px",
  } as React.CSSProperties;

  const h2Style = {
    fontFamily: "'Barlow Condensed', sans-serif",
    fontWeight: 700,
    fontSize: "22px",
    letterSpacing: "1px",
    color: "#0A1628",
    marginBottom: "10px",
  } as React.CSSProperties;

  const bodyStyle = {
    fontSize: "14px",
    color: "#1B4F8A",
    lineHeight: 1.75,
  } as React.CSSProperties;

  const liStyle = { marginBottom: "10px" };

  return (
    <div style={{
      maxWidth: "720px",
      margin: "0 auto",
      padding: "48px 24px 80px",
      fontFamily: "'Barlow', sans-serif",
    }}>
      {/* Header */}
      <div style={{ marginBottom: "36px" }}>
        <Link href="/dashboard/contractor" style={{ fontSize: "13px", color: "#1B4F8A", textDecoration: "none" }}>
          ← Back to Dashboard
        </Link>
        <h1 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: "42px",
          letterSpacing: "1px",
          color: "#0A1628",
          margin: "16px 0 8px",
        }}>
          Contractor Bidding Guide
        </h1>
        <p style={{ fontSize: "15px", color: "#1B4F8A", lineHeight: 1.6 }}>
          How to price accurately, protect yourself, and get the most out of the ONP platform.
        </p>
      </div>

      {/* Q1 */}
      <div style={sectionStyle}>
        <h2 style={h2Style}>How should I price my bid?</h2>
        <p style={bodyStyle}>
          You're submitting a bid based on what the Client has posted — description, photos, files,
          and any inspector report. You have not visited the site unless you've arranged one independently.
        </p>
        <p style={{ ...bodyStyle, marginTop: "12px" }}>A few things to keep in mind:</p>
        <ul style={{ ...bodyStyle, paddingLeft: "20px", marginTop: "8px" }}>
          <li style={liStyle}>
            <strong style={{ color: "#0A1628" }}>Build in appropriate contingencies.</strong> If
            the information is thin, your bid should reflect that uncertainty. Don't price as if
            you've seen the job when you haven't.
          </li>
          <li style={liStyle}>
            <strong style={{ color: "#0A1628" }}>Use RFIs.</strong> ONP's Request for Information
            feature lets you ask the Client clarifying questions before submitting. Use it. A
            5-minute RFI can save you thousands.
          </li>
          <li style={liStyle}>
            <strong style={{ color: "#0A1628" }}>Check for an inspector report.</strong> Projects
            with an ONP Inspector report give you measurements, photos, and condition notes that
            dramatically improve your accuracy. Bid more confidently — and more competitively —
            on those.
          </li>
          <li style={{ ...liStyle, marginBottom: 0 }}>
            <strong style={{ color: "#0A1628" }}>Request a site visit if needed.</strong> For larger
            or complex projects, you can message the Client to arrange a walkthrough before submitting
            your final bid. Many Clients welcome this.
          </li>
        </ul>
      </div>

      {/* Q2 */}
      <div style={sectionStyle}>
        <h2 style={h2Style}>Is my bid legally binding?</h2>
        <p style={bodyStyle}>
          Your bid is a good-faith offer to the Client. Once awarded, you and the Client should enter
          into a <strong style={{ color: "#0A1628" }}>written contract</strong> that governs the actual
          work, pricing, change-order process, payment schedule, warranties, and dispute resolution.
        </p>
        <p style={{ ...bodyStyle, marginTop: "10px" }}>
          Your contract with the Client — not the bid alone — is the binding document for performing
          the work. <strong style={{ color: "#0A1628" }}>ONP is not a party to your agreement with the Client.</strong>
        </p>
      </div>

      {/* Q3 */}
      <div style={sectionStyle}>
        <h2 style={h2Style}>What if the actual job is different than the bid?</h2>
        <p style={bodyStyle}>That happens. Standard practice:</p>
        <ul style={{ ...bodyStyle, paddingLeft: "20px", marginTop: "8px" }}>
          <li style={liStyle}>Identify the difference in writing (photos, notes)</li>
          <li style={liStyle}>Issue a written change order to the Client with revised pricing</li>
          <li style={liStyle}>Get the Client's written approval before proceeding</li>
          <li style={{ ...liStyle, marginBottom: 0 }}>Update your project record on ONP for documentation</li>
        </ul>
        <p style={{ ...bodyStyle, marginTop: "12px" }}>
          ONP does not mediate pricing disputes between you and the Client. We provide the messaging
          history and project documentation if needed, but resolution is between you and the Client.
        </p>
      </div>

      {/* Q4 */}
      <div style={sectionStyle}>
        <h2 style={h2Style}>What about non-payment?</h2>
        <p style={bodyStyle}>
          ONP does not currently process payments between Clients and Contractors. You collect payment
          directly from the Client per your contract. If the Client doesn't pay, your remedies are with
          the Client directly — mechanics' liens (where applicable), small claims court, collections,
          or other lawful means. ONP is not responsible for Client payment or non-payment.
        </p>
      </div>

      {/* Q5 */}
      <div style={sectionStyle}>
        <h2 style={h2Style}>Why is my subscription non-refundable?</h2>
        <p style={bodyStyle}>
          Your subscription gives you ongoing access to bid on projects across the Platform. Like most
          software-as-a-service products, fees are not pro-rated or refunded when you cancel. You retain
          access through the end of your current billing period.
        </p>
      </div>

      {/* Q6 */}
      <div style={sectionStyle}>
        <h2 style={h2Style}>Why was a contractor verified but the job still went sideways?</h2>
        <p style={bodyStyle}>
          ONP verifies license, insurance, BBB status, and (when claimed) Certified Veteran Owned
          Business status at the time of onboarding. We do not continuously monitor these items,
          and verification doesn't predict performance, integrity, or business conditions over time.
          Verification is a starting point — not a guarantee.
        </p>
      </div>

      {/* Footer links */}
      <div style={{
        borderTop: "1px solid #B8D0E8",
        paddingTop: "20px",
        marginTop: "8px",
        display: "flex",
        gap: "20px",
        flexWrap: "wrap",
        fontSize: "13px",
      }}>
        <Link href="/contractor-bid-disclaimer" style={{ color: "#1B4F8A", textDecoration: "underline" }}>
          Full Contractor Bid Acknowledgment
        </Link>
        <Link href="/help/bids" style={{ color: "#1B4F8A", textDecoration: "underline" }}>
          Client Bid FAQ
        </Link>
        <Link href="/dashboard/contractor" style={{ color: "#1B4F8A", textDecoration: "underline" }}>
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
