import Link from "next/link";

export default function AboutPage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#0A1628",
      color: "#F0F4FF",
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
            <span style={{ color: "#C8102E" }}>★</span> ONP
          </div>
          <div style={{
            fontSize: "11px",
            letterSpacing: "3px",
            color: "#7A9CC4",
            textTransform: "uppercase",
          }}>
            Our Next Project
          </div>
        </Link>

        <Link
          href="/login"
          style={{
            background: "transparent",
            color: "#7A9CC4",
            border: "1px solid #1B4F8A",
            padding: "8px 20px",
            borderRadius: "6px",
            fontFamily: "'Barlow', sans-serif",
            fontSize: "13px",
            textDecoration: "none",
          }}
        >
          Sign In
        </Link>
      </header>

      {/* Beta banner */}
      <div style={{
        background: "#3D0A0A",
        borderBottom: "1px solid #991B1B",
        padding: "10px 28px",
        textAlign: "center",
        fontSize: "12px",
        color: "#FCA5A5",
      }}>
        <span style={{
          fontWeight: 700,
          color: "#F87171",
          textTransform: "uppercase",
          letterSpacing: "1px",
          marginRight: "8px",
        }}>
          ⚠ Experimental Beta:
        </span>
        This platform is in beta testing. All projects, bids, and contractor profiles are for testing purposes only and should not be considered legitimate business transactions.
      </div>

      {/* Content */}
      <main style={{ maxWidth: "800px", margin: "0 auto", padding: "60px 24px" }}>

        {/* Hero */}
        <div style={{ marginBottom: "60px" }}>
          <h1 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "52px",
            letterSpacing: "1px",
            color: "#fff",
            marginBottom: "8px",
            lineHeight: 1.1,
          }}>
            About Us
          </h1>
          <div style={{
            width: "60px",
            height: "3px",
            background: "#C8102E",
            marginBottom: "32px",
          }} />
          <p style={{
            fontSize: "20px",
            color: "#7A9CC4",
            lineHeight: 1.7,
            fontStyle: "italic",
          }}>
            Our Next Project (ONP) was built on a simple idea:
          </p>
          <p style={{
            fontSize: "22px",
            color: "#fff",
            lineHeight: 1.7,
            fontWeight: 600,
            marginTop: "12px",
          }}>
            Small businesses and homeowners deserve the same bidding advantages that large corporations have relied on for years.
          </p>
        </div>

        {/* Intro */}
        <div style={{ marginBottom: "48px" }}>
          <p style={{ fontSize: "16px", color: "#B0C4DE", lineHeight: 1.9, marginBottom: "16px" }}>
            For most people, hiring contractors is stressful, unclear, and heavily dependent on trust alone. Pricing can vary wildly, communication can break down, and many clients are left wondering whether they are truly getting fair competition or accurate information.
          </p>
          <p style={{ fontSize: "16px", color: "#B0C4DE", lineHeight: 1.9, marginBottom: "16px" }}>
            ONP was created to change that.
          </p>
          <p style={{ fontSize: "16px", color: "#B0C4DE", lineHeight: 1.9 }}>
            We are an online bid depository designed to bring structure, transparency, and accountability to the project bidding process for homeowners, property owners, and small businesses.
          </p>
        </div>

        {/* What Makes ONP Different */}
        <div style={{ marginBottom: "48px" }}>
          <h2 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "32px",
            letterSpacing: "1px",
            color: "#fff",
            marginBottom: "8px",
            textTransform: "uppercase",
          }}>
            What Makes ONP Different
          </h2>
          <div style={{ width: "40px", height: "2px", background: "#C8102E", marginBottom: "24px" }} />

          <p style={{ fontSize: "16px", color: "#B0C4DE", lineHeight: 1.9, marginBottom: "16px" }}>
            Traditional contractor searches often rely on phone calls, referrals, or rushed estimates. ONP introduces a more organized and transparent process designed to protect both clients and contractors.
          </p>
          <p style={{ fontSize: "16px", color: "#B0C4DE", lineHeight: 1.9, marginBottom: "16px" }}>
            Projects are submitted through our platform and opened to competitive bidding within controlled timeframes. Contractors submit blind bids, meaning pricing remains hidden until the bidding period closes. This helps reduce price manipulation and encourages honest competition.
          </p>
          <p style={{ fontSize: "16px", color: "#B0C4DE", lineHeight: 1.9, marginBottom: "16px" }}>
            To improve project clarity, ONP also allows for independent project inspections and take-offs when needed. This gives contractors more accurate information before bidding and helps clients receive more realistic proposals.
          </p>
          <p style={{ fontSize: "16px", color: "#B0C4DE", lineHeight: 1.9 }}>
            Our platform also limits unnecessary back-and-forth communication that often leads to confusion or off-platform negotiations. Instead, contractors can submit structured RFIs (Requests for Information) directly through the system to keep communication organized and documented.
          </p>
        </div>

        {/* Built for Contractors Too */}
        <div style={{
          background: "#0F2040",
          border: "1px solid #1B4F8A",
          borderRadius: "12px",
          padding: "32px",
          marginBottom: "48px",
        }}>
          <h2 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "32px",
            letterSpacing: "1px",
            color: "#fff",
            marginBottom: "8px",
            textTransform: "uppercase",
          }}>
            Built for Contractors Too
          </h2>
          <div style={{ width: "40px", height: "2px", background: "#C8102E", marginBottom: "24px" }} />

          <p style={{ fontSize: "16px", color: "#B0C4DE", lineHeight: 1.9, marginBottom: "16px" }}>
            ONP is not designed to race contractors to the bottom.
          </p>
          <p style={{ fontSize: "16px", color: "#B0C4DE", lineHeight: 1.9, marginBottom: "16px" }}>
            We believe skilled contractors deserve access to legitimate opportunities without wasting time chasing incomplete scopes, unclear expectations, or leads that were never serious to begin with.
          </p>
          <p style={{ fontSize: "16px", color: "#B0C4DE", lineHeight: 1.9, marginBottom: "16px" }}>
            By creating standardized project information, structured bidding windows, and monitored communication, we aim to create a system where professionalism and quality work stand out.
          </p>
          <p style={{ fontSize: "16px", color: "#4ADE80", lineHeight: 1.9, fontWeight: 500 }}>
            We are especially proud to support veteran-owned businesses and contractors who take pride in craftsmanship, accountability, and service.
          </p>
        </div>

        {/* Our Mission */}
        <div style={{ marginBottom: "48px" }}>
          <h2 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "32px",
            letterSpacing: "1px",
            color: "#fff",
            marginBottom: "8px",
            textTransform: "uppercase",
          }}>
            Our Mission
          </h2>
          <div style={{ width: "40px", height: "2px", background: "#C8102E", marginBottom: "24px" }} />

          <p style={{ fontSize: "16px", color: "#B0C4DE", lineHeight: 1.9, marginBottom: "20px" }}>
            Our mission is to create a fairer, more transparent project marketplace where:
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "24px" }}>
            {[
              "Clients can make informed decisions with confidence",
              "Contractors compete on a level playing field",
              "Communication stays organized and professional",
              "Projects begin with clearer expectations for everyone involved",
            ].map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                <span style={{ color: "#C8102E", fontSize: "18px", flexShrink: 0, marginTop: "2px" }}>★</span>
                <span style={{ fontSize: "16px", color: "#F0F4FF", lineHeight: 1.7 }}>{item}</span>
              </div>
            ))}
          </div>

          <p style={{ fontSize: "16px", color: "#B0C4DE", lineHeight: 1.9, marginBottom: "8px" }}>
            We believe better projects start with better processes.
          </p>
          <p style={{ fontSize: "18px", color: "#fff", fontWeight: 600, lineHeight: 1.7 }}>
            And this is only the beginning.
          </p>
        </div>

        {/* Founder */}
        <div style={{
          background: "#1e1a00",
          border: "1px solid #92400E",
          borderRadius: "12px",
          padding: "32px",
          marginBottom: "48px",
        }}>
          <h2 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "32px",
            letterSpacing: "1px",
            color: "#FBBF24",
            marginBottom: "8px",
            textTransform: "uppercase",
          }}>
            ★ Our Founder
          </h2>
          <div style={{ width: "40px", height: "2px", background: "#92400E", marginBottom: "24px" }} />
          <p style={{ fontSize: "16px", color: "#FDE68A", lineHeight: 1.9 }}>
            ONP was founded by Samuel Bravo, a CAD and infrastructure design professional with years of experience coordinating real-world project documentation, revisions, and contractor workflows. His firsthand experience with unclear scopes, field discrepancies, and communication breakdowns gave ONP its foundation — and its purpose.
          </p>
        </div>

        {/* CTA */}
        <div style={{ textAlign: "center", paddingTop: "20px", paddingBottom: "40px" }}>
          <div style={{ fontSize: "13px", color: "#7A9CC4", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "1px" }}>
            Ready to get started?
          </div>
          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              href="/signup"
              style={{
                background: "#C8102E",
                color: "#fff",
                border: "none",
                padding: "14px 32px",
                borderRadius: "6px",
                fontFamily: "'Barlow', sans-serif",
                fontWeight: 600,
                fontSize: "14px",
                letterSpacing: "0.5px",
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              Create a Client Account
            </Link>
            <Link
              href="/signup/contractor"
              style={{
                background: "transparent",
                color: "#7A9CC4",
                border: "1px solid #1B4F8A",
                padding: "14px 32px",
                borderRadius: "6px",
                fontFamily: "'Barlow', sans-serif",
                fontWeight: 500,
                fontSize: "14px",
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              Join as a Contractor
            </Link>
            <Link
              href="/login"
              style={{
                background: "transparent",
                color: "#7A9CC4",
                border: "1px solid #1B4F8A",
                padding: "14px 32px",
                borderRadius: "6px",
                fontFamily: "'Barlow', sans-serif",
                fontWeight: 500,
                fontSize: "14px",
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              Sign In
            </Link>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer style={{
        borderTop: "1px solid #1B4F8A",
        padding: "20px 28px",
        textAlign: "center",
        fontSize: "12px",
        color: "#3A5A7A",
        letterSpacing: "1px",
        textTransform: "uppercase",
      }}>
        © {new Date().getFullYear()} Our Next Project — Honoring American Veterans
      </footer>
    </div>
  );
}