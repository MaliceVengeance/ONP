import Link from "next/link";

export const metadata = {
  title: "Understanding Bids — ONP Help",
  description: "Why contractor bids may not be the final price, and how to get more accurate bids.",
};

export default function HelpBidsPage() {
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

  const liStyle = {
    marginBottom: "10px",
  } as React.CSSProperties;

  return (
    <div style={{
      maxWidth: "720px",
      margin: "0 auto",
      padding: "48px 24px 80px",
      fontFamily: "'Barlow', sans-serif",
    }}>
      {/* Header */}
      <div style={{ marginBottom: "36px" }}>
        <Link href="/" style={{ fontSize: "13px", color: "#1B4F8A", textDecoration: "none" }}>
          ← Back to ONP
        </Link>
        <h1 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: "42px",
          letterSpacing: "1px",
          color: "#0A1628",
          margin: "16px 0 8px",
        }}>
          Understanding Bids
        </h1>
        <p style={{ fontSize: "15px", color: "#1B4F8A", lineHeight: 1.6 }}>
          Why the bid amount you see may not be the final price — and how to get more accurate bids.
        </p>
      </div>

      {/* Q1 */}
      <div style={sectionStyle}>
        <h2 style={h2Style}>Why isn't this bid the final price?</h2>
        <p style={bodyStyle}>
          Contractors on ONP submit bids based on the information you provide in your project
          posting — description, photos, files, location, and any messages exchanged. They have
          not physically inspected your property.
        </p>
        <p style={{ ...bodyStyle, marginTop: "12px" }}>A few realities of contractor bidding:</p>
        <ul style={{ ...bodyStyle, paddingLeft: "20px", marginTop: "8px" }}>
          <li style={liStyle}>
            <strong style={{ color: "#0A1628" }}>Hidden conditions exist.</strong> Rotted decking
            under a roof, outdated wiring inside a wall, soft subfloor under tile — none of these
            show up in photos. They can only be discovered on-site.
          </li>
          <li style={liStyle}>
            <strong style={{ color: "#0A1628" }}>Contractors protect themselves.</strong> A contractor
            who drastically underbids loses money on the job. To avoid that, many include allowances
            or contingencies for the most likely "worst case." This protects them — and it means honest
            contractors may bid higher than someone planning to come back and ask for change orders.
          </li>
          <li style={liStyle}>
            <strong style={{ color: "#0A1628" }}>Materials and labor fluctuate.</strong> Lumber, copper,
            asphalt, and other materials can move significantly between the bid date and the work start date.
          </li>
          <li style={{ ...liStyle, marginBottom: 0 }}>
            <strong style={{ color: "#0A1628" }}>Scope changes happen.</strong> If you change your mind
            about a finish, add a feature, or expand the work, pricing changes.
          </li>
        </ul>
      </div>

      {/* Q2 */}
      <div style={sectionStyle}>
        <h2 style={h2Style}>How can I get more accurate bids?</h2>
        <p style={bodyStyle}>
          <strong style={{ color: "#0A1628" }}>Request an ONP Inspector.</strong> For a flat fee, a
          qualified inspector visits the property and prepares a detailed report — measurements,
          photos, condition notes, and any issues a contractor should know about. This report is
          shared with bidding contractors and almost always results in:
        </p>
        <ul style={{ ...bodyStyle, paddingLeft: "20px", marginTop: "8px" }}>
          <li style={liStyle}>Tighter, more competitive bids (less padding needed)</li>
          <li style={liStyle}>Fewer surprises after work begins</li>
          <li style={{ ...liStyle, marginBottom: 0 }}>
            A stronger basis for holding a contractor to their number
          </li>
        </ul>
        <p style={{ ...bodyStyle, marginTop: "12px" }}>
          For larger projects, the inspection fee typically pays for itself many times over in
          bid accuracy.
        </p>
        <div style={{ marginTop: "16px" }}>
          <Link
            href="/dashboard/inspector"
            style={{
              background: "#C8102E",
              color: "#fff",
              padding: "10px 24px",
              borderRadius: "6px",
              fontFamily: "'Barlow', sans-serif",
              fontWeight: 600,
              fontSize: "13px",
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            Request an ONP Inspector →
          </Link>
        </div>
      </div>

      {/* Q3 */}
      <div style={sectionStyle}>
        <h2 style={h2Style}>Does ONP guarantee the bid amount?</h2>
        <p style={bodyStyle}>
          No. ONP is a platform that connects clients and contractors. We do not set prices,
          guarantee bids, or become a party to your agreement with the contractor. Any binding
          price commitment must come from a <strong style={{ color: "#0A1628" }}>written
          contract between you and the contractor.</strong>
        </p>
      </div>

      {/* Q4 */}
      <div style={sectionStyle}>
        <h2 style={h2Style}>What should I do before awarding a bid?</h2>
        <ul style={{ ...bodyStyle, paddingLeft: "20px" }}>
          <li style={liStyle}>
            Review all bids alongside the contractor's credentials, license status, and insurance details.
          </li>
          <li style={liStyle}>
            Check whether any RFIs (contractor questions) were answered — unanswered questions
            often lead to inaccurate bids.
          </li>
          <li style={liStyle}>
            Consider scheduling a brief phone or in-person conversation with your top candidate
            before awarding, especially on larger projects.
          </li>
          <li style={{ ...liStyle, marginBottom: 0 }}>
            Once you award, get a written contract that specifies the price, scope, any
            allowances or contingencies, and a change-order procedure.
          </li>
        </ul>
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
        <Link href="/bid-disclaimer" style={{ color: "#1B4F8A", textDecoration: "underline" }}>
          Full Bid Disclaimer
        </Link>
        <Link href="/why-onp" style={{ color: "#1B4F8A", textDecoration: "underline" }}>
          Why ONP?
        </Link>
        <Link href="/" style={{ color: "#1B4F8A", textDecoration: "underline" }}>
          Back to ONP
        </Link>
      </div>
    </div>
  );
}
