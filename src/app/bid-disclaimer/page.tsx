import Link from "next/link";

export const metadata = {
  title: "Bid Disclaimer — ONP",
  description: "ONP bid disclaimer: bids submitted through the platform are estimates, not fixed-price quotations.",
};

export default function BidDisclaimerPage() {
  const bodyStyle = {
    fontSize: "14px",
    color: "#1B4F8A",
    lineHeight: 1.85,
    marginBottom: "16px",
  } as React.CSSProperties;

  const indentStyle = {
    fontSize: "14px",
    color: "#1B4F8A",
    lineHeight: 1.85,
    marginBottom: "10px",
    paddingLeft: "24px",
  } as React.CSSProperties;

  return (
    <div style={{
      maxWidth: "760px",
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
          margin: "16px 0 6px",
        }}>
          Bid Disclaimer
        </h1>
        <p style={{ fontSize: "13px", color: "#4A7FB5" }}>
          Last updated: May 2026
        </p>
      </div>

      {/* Body */}
      <p style={bodyStyle}>
        All Bids submitted through the ONP Platform are estimates prepared by independent
        Contractors based solely on the information made available to them by the Client,
        including project descriptions, photographs, attached files, location data, and any
        communications exchanged through the Platform. <strong style={{ color: "#0A1628" }}>
        Bids are not fixed-price quotations and do not constitute a binding contract for work
        or price</strong> unless and until the Client and the awarded Contractor enter into a
        separate written agreement off-Platform.
      </p>

      <p style={bodyStyle}>
        Clients acknowledge and agree that:
      </p>

      <p style={indentStyle}>
        <strong style={{ color: "#0A1628" }}>(a)</strong> Contractors have not physically
        inspected the project site at the time of bidding and may identify additional conditions,
        requirements, or scope upon site visit that materially affect final pricing, including
        but not limited to concealed damage, code compliance issues, access limitations, soil or
        substrate conditions, and material availability;
      </p>

      <p style={indentStyle}>
        <strong style={{ color: "#0A1628" }}>(b)</strong> Contractors may, in the exercise of
        their professional judgment, incorporate contingencies, allowances, or worst-case
        assumptions into their Bids to protect against underbidding, and such contingencies may
        cause Bids to exceed the Client's expectations of the most favorable possible price;
      </p>

      <p style={indentStyle}>
        <strong style={{ color: "#0A1628" }}>(c)</strong> Material and labor costs are subject
        to market fluctuation between the Bid date and the date work is performed;
      </p>

      <p style={indentStyle}>
        <strong style={{ color: "#0A1628" }}>(d)</strong> Scope changes, additions, or
        modifications requested by the Client after the project is awarded will typically result
        in adjusted pricing;
      </p>

      <p style={indentStyle}>
        <strong style={{ color: "#0A1628" }}>(e)</strong> ONP does not verify, set, guarantee,
        or warrant the accuracy or completeness of any Bid; and
      </p>

      <p style={indentStyle}>
        <strong style={{ color: "#0A1628" }}>(f)</strong> Clients are responsible for
        negotiating and memorializing all pricing terms, including any cap, allowance structure,
        or change-order procedure, directly with the Contractor.
      </p>

      <div style={{
        background: "#EEF4FF",
        border: "1px solid #1B4F8A",
        borderRadius: "10px",
        padding: "20px 24px",
        marginTop: "28px",
        marginBottom: "28px",
      }}>
        <h2 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: "20px",
          letterSpacing: "1px",
          color: "#0A1628",
          marginBottom: "10px",
        }}>
          Inspector Services
        </h2>
        <p style={{ ...bodyStyle, marginBottom: "12px" }}>
          Clients seeking greater bid accuracy may request a paid Inspection through the
          Platform. An ONP Inspector will visit the property and prepare a report for use by
          bidding Contractors. While Inspections generally improve Bid accuracy, ONP does not
          warrant that any Inspection will eliminate the possibility of post-award pricing
          adjustments.
        </p>
        <Link
          href="/dashboard/inspector"
          style={{
            background: "#1B4F8A",
            color: "#fff",
            padding: "9px 20px",
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

      {/* Footer links */}
      <div style={{
        borderTop: "1px solid #B8D0E8",
        paddingTop: "20px",
        display: "flex",
        gap: "20px",
        flexWrap: "wrap",
        fontSize: "13px",
      }}>
        <Link href="/help/bids" style={{ color: "#1B4F8A", textDecoration: "underline" }}>
          Bid Help & FAQ
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
