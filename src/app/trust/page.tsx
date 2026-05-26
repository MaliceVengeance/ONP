import Link from "next/link";

export default function TrustPage() {
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
          <div style={{ fontSize: "11px", letterSpacing: "3px", color: "#FFFFFF", textTransform: "uppercase" }}>
            Our Next Project
          </div>
        </Link>
        <div style={{ display: "flex", gap: "10px" }}>
          <Link href="/about" style={{ background: "transparent", color: "#FFFFFF", border: "1px solid #1B4F8A", padding: "8px 16px", borderRadius: "6px", fontSize: "13px", textDecoration: "none" }}>
            About
          </Link>
          <Link href="/why-onp" style={{ background: "transparent", color: "#FFFFFF", border: "1px solid #1B4F8A", padding: "8px 16px", borderRadius: "6px", fontSize: "13px", textDecoration: "none" }}>
            Why ONP
          </Link>
          <Link href="/login" style={{ background: "#C8102E", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "6px", fontSize: "13px", textDecoration: "none", fontWeight: 600 }}>
            Sign In
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: "840px", margin: "0 auto", padding: "60px 24px" }}>

        {/* Hero */}
        <div style={{ marginBottom: "48px" }}>
          <h1 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "52px",
            letterSpacing: "1px",
            color: "#0A1628",
            marginBottom: "8px",
            lineHeight: 1.1,
          }}>
            Client Trust & Protection
          </h1>
          <div style={{ width: "60px", height: "3px", background: "#C8102E", marginBottom: "24px" }} />
          <p style={{ fontSize: "18px", color: "#1B4F8A", lineHeight: 1.8, maxWidth: "620px" }}>
            ONP is built on the principle that every client interaction should be transparent,
            documented, and — when something goes wrong — reviewable by an independent third party.
          </p>
        </div>

        {/* The core promise */}
        <div style={{
          background: "#EEF4FF",
          border: "2px solid #1B4F8A",
          borderRadius: "12px",
          padding: "28px 32px",
          marginBottom: "40px",
          borderLeft: "6px solid #1B4F8A",
        }}>
          <p style={{ fontSize: "19px", color: "#0A1628", lineHeight: 1.9, margin: 0, fontStyle: "italic" }}>
            &ldquo;Every on-site upgrade is reviewable. If you believe an upgrade was unjustified,
            an independent Master Inspector will review your case within 5 business days —
            at no cost to you. This is part of our commitment to client trust.&rdquo;
          </p>
        </div>

        {/* What is an on-site upgrade */}
        <div style={{ marginBottom: "40px" }}>
          <h2 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "28px",
            letterSpacing: "1px",
            color: "#0A1628",
            textTransform: "uppercase",
            marginBottom: "8px",
          }}>
            What Is an On-Site Upgrade?
          </h2>
          <div style={{ width: "40px", height: "2px", background: "#C8102E", marginBottom: "20px" }} />
          <p style={{ fontSize: "15px", color: "#1B4F8A", lineHeight: 1.9, marginBottom: "12px" }}>
            When you request a Standard Inspection, an ONP inspector visits your site and performs
            a pre-bid takeoff to help contractors prepare accurate bids. In some cases, the inspector
            determines on-site that the scope of work is significantly more complex than described —
            and upgrades the inspection to a Comprehensive level. This upgrade carries an additional
            fee of $200.
          </p>
          <p style={{ fontSize: "15px", color: "#1B4F8A", lineHeight: 1.9 }}>
            We recognize that an unexpected charge — especially one added at the site visit —
            can feel surprising. That is why every upgrade can be formally disputed.
          </p>
        </div>

        {/* How the dispute process works */}
        <div style={{ marginBottom: "40px" }}>
          <h2 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "28px",
            letterSpacing: "1px",
            color: "#0A1628",
            textTransform: "uppercase",
            marginBottom: "8px",
          }}>
            How the Dispute Process Works
          </h2>
          <div style={{ width: "40px", height: "2px", background: "#C8102E", marginBottom: "20px" }} />

          <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            {[
              {
                step: "01",
                title: "You File a Dispute",
                desc: "From your project dashboard, submit a dispute statement explaining why you believe the upgrade was not justified. You have 14 days from the upgrade charge to file. Filing is free.",
              },
              {
                step: "02",
                title: "Inspector Submits a Response",
                desc: "The original inspector is given 3 days to submit a written response explaining their reasoning for the upgrade. You will see their response when you log in.",
              },
              {
                step: "03",
                title: "A Master Inspector Is Assigned",
                desc: "An independent Master Inspector — a senior inspector from our network who was not involved in your project — is assigned within 24 hours of filing.",
              },
              {
                step: "04",
                title: "Full Review of All Evidence",
                desc: "The Master Inspector reviews the project description, the inspector's justification, the on-site report, your statement, and the inspector's response. No detail is left unread.",
              },
              {
                step: "05",
                title: "Written Decision — Within 5 Business Days",
                desc: "You receive a written decision with full reasoning. One of three outcomes: (1) upgrade was justified — charge stands; (2) upgrade was a reasonable call — charge stands, you receive a store credit; (3) upgrade was not justified — full $200 refund.",
              },
            ].map((s, idx) => (
              <div key={s.step} style={{
                display: "flex",
                gap: "0",
                position: "relative",
              }}>
                {/* Step number + connector */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "56px", flexShrink: 0 }}>
                  <div style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    background: "#0A1628",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 700,
                    fontSize: "16px",
                    flexShrink: 0,
                    zIndex: 1,
                  }}>
                    {s.step}
                  </div>
                  {idx < 4 && (
                    <div style={{ width: "2px", flex: 1, background: "#B8D0E8", minHeight: "24px" }} />
                  )}
                </div>
                {/* Content */}
                <div style={{ paddingLeft: "16px", paddingBottom: idx < 4 ? "24px" : 0 }}>
                  <div style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 700,
                    fontSize: "18px",
                    color: "#0A1628",
                    marginBottom: "6px",
                    marginTop: "8px",
                    letterSpacing: "0.3px",
                  }}>
                    {s.title}
                  </div>
                  <p style={{ fontSize: "14px", color: "#1B4F8A", lineHeight: 1.8, margin: 0 }}>
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Possible outcomes */}
        <div style={{ marginBottom: "40px" }}>
          <h2 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "28px",
            letterSpacing: "1px",
            color: "#0A1628",
            textTransform: "uppercase",
            marginBottom: "8px",
          }}>
            Possible Outcomes
          </h2>
          <div style={{ width: "40px", height: "2px", background: "#C8102E", marginBottom: "20px" }} />

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[
              {
                label: "Upgrade Justified",
                bg: "#F0F9FF",
                border: "#1B4F8A",
                text: "#1E3A5F",
                desc: "The Master Inspector finds the on-site upgrade was warranted given the scope. The $200 charge stands. You receive the decision with full written reasoning.",
              },
              {
                label: "Partial Credit",
                bg: "#F0FDF4",
                border: "#166534",
                text: "#14532D",
                desc: "The upgrade was a borderline call. The charge stands, but you receive a store credit (typically $50–$200) applied to your ONP account for future inspections.",
              },
              {
                label: "Full Refund",
                bg: "#FEF3C7",
                border: "#D97706",
                text: "#78350F",
                desc: "The Master Inspector finds the upgrade was not justified. You receive a full $200 refund — processed to your original payment method or as a credit if paid by credits.",
              },
            ].map((o) => (
              <div key={o.label} style={{
                background: o.bg,
                border: `1px solid ${o.border}`,
                borderRadius: "10px",
                padding: "16px 20px",
                display: "flex",
                gap: "16px",
                alignItems: "flex-start",
              }}>
                <div style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 700,
                  fontSize: "14px",
                  color: o.border,
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  flexShrink: 0,
                  minWidth: "130px",
                  paddingTop: "1px",
                }}>
                  {o.label}
                </div>
                <p style={{ fontSize: "14px", color: o.text, lineHeight: 1.7, margin: 0 }}>
                  {o.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Master Inspectors */}
        <div style={{
          background: "#F8FAFF",
          border: "1px solid #B8D0E8",
          borderRadius: "12px",
          padding: "28px 32px",
          marginBottom: "40px",
        }}>
          <h2 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "28px",
            letterSpacing: "1px",
            color: "#0A1628",
            textTransform: "uppercase",
            marginBottom: "8px",
          }}>
            Who Are Master Inspectors?
          </h2>
          <div style={{ width: "40px", height: "2px", background: "#C8102E", marginBottom: "20px" }} />
          <p style={{ fontSize: "15px", color: "#1B4F8A", lineHeight: 1.9, marginBottom: "12px" }}>
            Master Inspectors are senior inspectors who have been individually vetted and approved by ONP
            administration to review disputes. They are selected based on experience, inspection history,
            and completion of an internal competency review.
          </p>
          <p style={{ fontSize: "15px", color: "#1B4F8A", lineHeight: 1.9 }}>
            They are independent: the system automatically excludes the original inspector and, where possible,
            any inspector who has previously worked on the same project. Assignment is based on availability
            to ensure disputes are resolved quickly and without conflict of interest.
          </p>
        </div>

        {/* Platform Transparency — placeholder for live stats */}
        <div style={{
          background: "#EEF4FF",
          border: "1px solid #B8D0E8",
          borderRadius: "12px",
          padding: "28px 32px",
          marginBottom: "40px",
        }}>
          <h2 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "28px",
            letterSpacing: "1px",
            color: "#0A1628",
            textTransform: "uppercase",
            marginBottom: "8px",
          }}>
            Platform Transparency
          </h2>
          <div style={{ width: "40px", height: "2px", background: "#C8102E", marginBottom: "20px" }} />
          <p style={{ fontSize: "15px", color: "#1B4F8A", lineHeight: 1.9, marginBottom: "16px" }}>
            We are committed to publishing aggregate dispute statistics once our data set is large enough
            to be meaningful — typically after 90 days of live dispute activity and a minimum of 30
            completed cases.
          </p>
          <p style={{ fontSize: "15px", color: "#1B4F8A", lineHeight: 1.9, marginBottom: "20px" }}>
            Once available, you will see:
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
            {[
              "% of inspection reports completed without any dispute",
              "% of disputes resulting in a client refund",
              "Average dispute resolution time (business days)",
              "Number of active Master Inspectors on the platform",
            ].map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <span style={{ color: "#4A7FB5", fontSize: "14px", flexShrink: 0, marginTop: "3px" }}>○</span>
                <span style={{ fontSize: "14px", color: "#1B4F8A", lineHeight: 1.7 }}>{item}</span>
              </div>
            ))}
          </div>
          <div style={{
            background: "#DBEAFE",
            border: "1px solid #93C5FD",
            borderRadius: "8px",
            padding: "12px 16px",
            fontSize: "13px",
            color: "#1E40AF",
            fontStyle: "italic",
          }}>
            Stats will appear here once the platform has accumulated sufficient dispute history.
            Check back after our first 90 days of live operation.
          </div>
        </div>

        {/* FAQ */}
        <div style={{ marginBottom: "48px" }}>
          <h2 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "28px",
            letterSpacing: "1px",
            color: "#0A1628",
            textTransform: "uppercase",
            marginBottom: "8px",
          }}>
            Common Questions
          </h2>
          <div style={{ width: "40px", height: "2px", background: "#C8102E", marginBottom: "20px" }} />

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {[
              {
                q: "Does filing a dispute affect my account?",
                a: "No. Disputes are a protected right for all ONP clients. Filing a dispute will never result in any negative action on your account.",
              },
              {
                q: "What if I miss the 14-day window?",
                a: "The 14-day window begins from the date of the upgrade charge. After 14 days, the charge is final. If you have an exceptional circumstance, contact support@ournextproject.us.",
              },
              {
                q: "Can I appeal the Master Inspector's decision?",
                a: "The Master Inspector's decision is final in the normal course. ONP administration may review cases where there is clear evidence of procedural error — contact support for exceptional cases.",
              },
              {
                q: "How long does the process actually take?",
                a: "Most disputes are resolved within 3–5 business days. The SLA is 5 business days from the date the Master Inspector is assigned. If the SLA is missed, the case is automatically escalated to ONP administration.",
              },
              {
                q: "How is the inspector held accountable?",
                a: "ONP tracks each inspector's dispute history. Inspectors with a high rate of refund outcomes are flagged internally, placed under compliance review, and — if patterns persist — suspended from accepting new upgrade requests.",
              },
            ].map((faq) => (
              <div key={faq.q} style={{
                background: "#FFFFFF",
                border: "1px solid #B8D0E8",
                borderRadius: "10px",
                padding: "18px 20px",
              }}>
                <div style={{
                  fontFamily: "'Barlow', sans-serif",
                  fontWeight: 700,
                  fontSize: "15px",
                  color: "#0A1628",
                  marginBottom: "8px",
                }}>
                  {faq.q}
                </div>
                <p style={{ fontSize: "14px", color: "#1B4F8A", lineHeight: 1.8, margin: 0 }}>
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{
          background: "#EEF4FF",
          border: "1px solid #B8D0E8",
          borderRadius: "12px",
          padding: "36px",
          textAlign: "center",
        }}>
          <h3 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "28px",
            color: "#0A1628",
            marginBottom: "10px",
          }}>
            Questions about a charge?
          </h3>
          <p style={{ fontSize: "14px", color: "#1B4F8A", marginBottom: "20px", lineHeight: 1.7 }}>
            Log into your account and open a dispute from your project dashboard.
            It takes less than five minutes and costs nothing.
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/login" style={{ background: "#C8102E", color: "#fff", padding: "12px 28px", borderRadius: "6px", textDecoration: "none", fontWeight: 600, fontSize: "14px" }}>
              Sign In to File a Dispute
            </Link>
            <Link href="/signup" style={{ background: "transparent", color: "#1B4F8A", border: "1px solid #B8D0E8", padding: "12px 28px", borderRadius: "6px", textDecoration: "none", fontSize: "14px" }}>
              Create an Account
            </Link>
          </div>
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
        marginTop: "60px",
      }}>
        © {new Date().getFullYear()} Our Next Project — Honoring American Veterans
      </footer>
    </div>
  );
}
