import Link from "next/link";

export const metadata = {
  title: "Contractor Bid Acknowledgment — ONP",
  description: "Contractor bid acknowledgment and disclaimer for the ONP platform.",
};

export default function ContractorBidDisclaimerPage() {
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
    marginBottom: "12px",
    paddingLeft: "24px",
  } as React.CSSProperties;

  const sectionHeadStyle = {
    fontFamily: "'Barlow Condensed', sans-serif",
    fontWeight: 700,
    fontSize: "16px",
    letterSpacing: "1px",
    color: "#1E3A8A",
    textTransform: "uppercase" as const,
    marginBottom: "6px",
    marginTop: "28px",
  };

  return (
    <div style={{
      maxWidth: "760px",
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
          color: "#1E3A8A",
          margin: "16px 0 6px",
        }}>
          Contractor Bid Acknowledgment
        </h1>
        <p style={{ fontSize: "13px", color: "#4A7FB5" }}>
          Version v1.0 — May 2026
        </p>
      </div>

      <p style={bodyStyle}>
        By submitting a Bid through the ONP Platform, Contractor acknowledges, represents,
        warrants, and agrees as follows:
      </p>

      <div style={sectionHeadStyle}>(a) Independent Professional Judgment</div>
      <p style={indentStyle}>
        Contractor is an independent business and submits Bids in the exercise of its own
        professional judgment. ONP does not direct, supervise, review, or approve Bids and
        provides no advice regarding pricing, scope, or feasibility.
      </p>

      <div style={sectionHeadStyle}>(b) Information Available</div>
      <p style={indentStyle}>
        Contractor's Bid is based solely on (i) information provided by the Client through
        the Platform, including project description, photographs, files, and messages;
        (ii) any ONP Inspection report made available; and (iii) any clarifications obtained
        through the Platform's RFI feature or direct communication with the Client. Contractor
        acknowledges that such information may be incomplete, inaccurate, or subject to change,
        and Contractor is responsible for evaluating its sufficiency before submitting a Bid.
      </p>

      <div style={sectionHeadStyle}>(c) No Site Visit by Default</div>
      <p style={indentStyle}>
        Unless Contractor has independently arranged and performed a site visit prior to
        submitting a Bid, Contractor acknowledges that the Bid is prepared without physical
        inspection of the project site and incorporates any contingencies Contractor deems
        necessary to account for unverified conditions.
      </p>

      <div style={sectionHeadStyle}>(d) Good-Faith Offer</div>
      <p style={indentStyle}>
        A submitted Bid constitutes a good-faith offer to perform the described scope of work
        at the stated price, subject to the parties' subsequent written agreement.
      </p>

      <div style={sectionHeadStyle}>(e) Separate Written Contract</div>
      <p style={indentStyle}>
        Upon Award, Contractor is responsible for negotiating and executing a separate written
        agreement with the Client that governs the performance of work, including but not
        limited to scope, schedule, change orders, materials, warranties, payment terms, and
        dispute resolution. The Bid alone does not constitute such an agreement.
      </p>

      <div style={sectionHeadStyle}>(f) No ONP Verification of Project Details</div>
      <p style={indentStyle}>
        ONP does not verify, validate, inspect, or warrant the accuracy or completeness of
        any Client-provided information, project description, location, or attached documentation.
      </p>

      <div style={sectionHeadStyle}>(g) Sole Responsibility for Bid Accuracy</div>
      <p style={indentStyle}>
        Contractor is solely responsible for the accuracy of its Bid, the adequacy of its
        contingencies, and the suitability of its proposed approach. Contractor shall not seek
        recourse from ONP for losses, costs, lost profits, or other damages arising from
        inaccurate or incomplete Client information, undisclosed site conditions, scope changes,
        material price fluctuations, or any other circumstance affecting Contractor's actual
        cost of performance.
      </p>

      <div style={sectionHeadStyle}>(h) No Payment Processing</div>
      <p style={indentStyle}>
        ONP does not process, hold, escrow, or guarantee payment from Clients to Contractors.
        Contractor is solely responsible for invoicing, collecting payment, and enforcing
        payment rights against the Client. ONP bears no liability for any Client's failure
        or refusal to pay.
      </p>

      <div style={sectionHeadStyle}>(i) No Dispute Mediation</div>
      <p style={indentStyle}>
        ONP does not mediate, arbitrate, or otherwise resolve pricing, performance, or payment
        disputes between Contractor and Client. Any such dispute is solely between Contractor
        and Client.
      </p>

      <div style={sectionHeadStyle}>(j) Continuing Compliance</div>
      <p style={indentStyle}>
        Contractor represents that, at the time of each Bid submission, Contractor's license,
        insurance, business registration, and (if applicable) CVOB certification are current
        and in good standing. Contractor shall promptly notify ONP of any change affecting
        these items.
      </p>

      <div style={sectionHeadStyle}>(k) Subscription Acknowledgment</div>
      <p style={indentStyle}>
        Contractor acknowledges that Subscription fees are non-refundable, that ONP makes no
        representation or warranty regarding the volume, quality, or profitability of Projects
        available through the Platform, and that maintaining a Subscription does not entitle
        Contractor to any minimum number of Projects, Bids, Awards, or revenue.
      </p>

      <div style={sectionHeadStyle}>(l) Platform-Only Status</div>
      <p style={indentStyle}>
        Contractor reaffirms its understanding and agreement that ONP is a marketplace only,
        is not a party to any agreement between Contractor and Client, and is not Contractor's
        employer, agent, partner, or joint venturer. See Terms of Service, Section 2.
      </p>

      <div style={sectionHeadStyle}>(m) Indemnification of ONP</div>
      <p style={indentStyle}>
        Contractor shall indemnify, defend, and hold harmless ONP from any claim, demand,
        liability, or expense arising out of or related to Contractor's Bids, performance,
        non-performance, conduct, or any agreement between Contractor and a Client. See Terms
        of Service, Section 18.
      </p>

      {/* Help CTA */}
      <div style={{
        background: "#EEF4FF",
        border: "1px solid #1B4F8A",
        borderRadius: "10px",
        padding: "20px 24px",
        marginTop: "32px",
        marginBottom: "28px",
      }}>
        <div style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: "18px",
          color: "#1E3A8A",
          marginBottom: "8px",
        }}>
          Questions about bidding?
        </div>
        <p style={{ fontSize: "13px", color: "#1B4F8A", marginBottom: "12px" }}>
          Read our contractor bidding guide for practical advice on pricing, RFIs, site visits,
          and handling post-award changes.
        </p>
        <Link
          href="/help/contractor-bids"
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
          Contractor Bidding Guide →
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
        <Link href="/help/contractor-bids" style={{ color: "#1B4F8A", textDecoration: "underline" }}>
          Contractor Bidding Guide
        </Link>
        <Link href="/bid-disclaimer" style={{ color: "#1B4F8A", textDecoration: "underline" }}>
          Client Bid Disclaimer
        </Link>
        <Link href="/dashboard/contractor" style={{ color: "#1B4F8A", textDecoration: "underline" }}>
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
