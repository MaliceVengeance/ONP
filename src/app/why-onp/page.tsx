import Link from "next/link";

export default async function WhyOnpPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const sp = await searchParams;
  const isWelcome = sp.welcome === "1";

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
        <div style={{ display: "flex", gap: "10px" }}>
          <Link href="/contractors" style={{
            background: "transparent",
            color: "#7A9CC4",
            border: "1px solid #1B4F8A",
            padding: "8px 16px",
            borderRadius: "6px",
            fontSize: "13px",
            textDecoration: "none",
          }}>
            Directory
          </Link>
          <Link href="/about" style={{
            background: "transparent",
            color: "#7A9CC4",
            border: "1px solid #1B4F8A",
            padding: "8px 16px",
            borderRadius: "6px",
            fontSize: "13px",
            textDecoration: "none",
          }}>
            About
          </Link>
          <Link href="/login" style={{
            background: "#C8102E",
            color: "#fff",
            border: "none",
            padding: "8px 16px",
            borderRadius: "6px",
            fontSize: "13px",
            textDecoration: "none",
            fontWeight: 600,
          }}>
            Sign In
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 24px" }}>

        {/* Welcome banner — only shown after successful subscription */}
        {isWelcome && (
          <div style={{
            background: "#2D1B69",
            border: "2px solid #5B21B6",
            borderRadius: "12px",
            padding: "28px",
            marginBottom: "40px",
            textAlign: "center",
          }}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>🎉</div>
            <h2 style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: "32px",
              letterSpacing: "1px",
              color: "#A78BFA",
              marginBottom: "8px",
            }}>
              Welcome to ONP!
            </h2>
            <p style={{ fontSize: "15px", color: "#B0C4DE", marginBottom: "20px", lineHeight: 1.6 }}>
              Your subscription is active. You now have full access to the ONP bidding platform. Here's everything you need to know to get started.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/dashboard/contractor/projects" style={{
                background: "#C8102E",
                color: "#fff",
                padding: "12px 24px",
                borderRadius: "6px",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: "14px",
              }}>
                Browse Open Projects →
              </Link>
              <Link href="/dashboard/contractor/profile" style={{
                background: "transparent",
                color: "#A78BFA",
                border: "1px solid #5B21B6",
                padding: "12px 24px",
                borderRadius: "6px",
                textDecoration: "none",
                fontSize: "14px",
              }}>
                Complete Your Profile
              </Link>
            </div>
          </div>
        )}

        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: "60px" }}>
          <h1 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "56px",
            letterSpacing: "1px",
            color: "#fff",
            margin: 0,
            lineHeight: 1.1,
          }}>
            Why Choose ONP?
          </h1>
          <div style={{ width: "60px", height: "3px", background: "#C8102E", margin: "16px auto" }} />
          <p style={{ fontSize: "18px", color: "#7A9CC4", lineHeight: 1.7, maxWidth: "600px", margin: "0 auto" }}>
            The traditional way of finding contracting work is broken. ONP fixes it.
          </p>
        </div>

        {/* ONP vs Traditional comparison */}
        <div style={{ marginBottom: "60px" }}>
          <h2 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "32px",
            letterSpacing: "1px",
            color: "#fff",
            textTransform: "uppercase",
            marginBottom: "8px",
          }}>
            ONP vs. The Old Way
          </h2>
          <div style={{ width: "40px", height: "2px", background: "#C8102E", marginBottom: "28px" }} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0" }}>
            {/* Headers */}
            <div style={{
              background: "#3D0A0A",
              border: "1px solid #991B1B",
              borderRadius: "10px 0 0 0",
              padding: "14px 20px",
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: "18px",
              color: "#F87171",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}>
              ✗ Traditional Way
            </div>
            <div style={{
              background: "#0D3320",
              border: "1px solid #166534",
              borderLeft: "none",
              borderRadius: "0 10px 0 0",
              padding: "14px 20px",
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: "18px",
              color: "#4ADE80",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}>
              ✓ With ONP
            </div>

            {/* Rows */}
            {[
              {
                traditional: "Cold calling and chasing leads",
                onp: "Projects come directly to you",
              },
              {
                traditional: "Unknown competition — who else is bidding?",
                onp: "Structured blind bidding — fair for everyone",
              },
              {
                traditional: "Vague project scopes and unclear expectations",
                onp: "RFIs, file attachments, and inspector takeoffs",
              },
              {
                traditional: "Race to the bottom on pricing",
                onp: "Sealed bids — compete on quality, not desperation",
              },
              {
                traditional: "No paper trail — disputes happen",
                onp: "Full documented bid and communication history",
              },
              {
                traditional: "Clients contact random unverified contractors",
                onp: "Only verified, licensed, and insured contractors",
              },
              {
                traditional: "Wasted time on leads that go nowhere",
                onp: "Serious clients posting real projects",
              },
              {
                traditional: "Your veteran status goes unrecognized",
                onp: "Veteran Owned badge — clients notice and care",
              },
            ].map((row, idx) => (
              <>
                <div key={`trad-${idx}`} style={{
                  background: idx % 2 === 0 ? "#1A0808" : "#140606",
                  border: "1px solid #991B1B",
                  borderTop: "none",
                  borderRadius: idx === 7 ? "0 0 0 10px" : "0",
                  padding: "14px 20px",
                  fontSize: "14px",
                  color: "#FCA5A5",
                  lineHeight: 1.5,
                }}>
                  {row.traditional}
                </div>
                <div key={`onp-${idx}`} style={{
                  background: idx % 2 === 0 ? "#071A10" : "#051408",
                  border: "1px solid #166534",
                  borderTop: "none",
                  borderLeft: "none",
                  borderRadius: idx === 7 ? "0 0 10px 0" : "0",
                  padding: "14px 20px",
                  fontSize: "14px",
                  color: "#86EFAC",
                  lineHeight: 1.5,
                }}>
                  {row.onp}
                </div>
              </>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div style={{ marginBottom: "60px" }}>
          <h2 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "32px",
            letterSpacing: "1px",
            color: "#fff",
            textTransform: "uppercase",
            marginBottom: "8px",
          }}>
            How It Works
          </h2>
          <div style={{ width: "40px", height: "2px", background: "#C8102E", marginBottom: "28px" }} />

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {[
              {
                step: "01",
                title: "Create Your Profile",
                desc: "Set up your contractor profile with your business info, service categories, and credentials. Get verified by ONP to appear in the public directory.",
              },
              {
                step: "02",
                title: "Browse Open Projects",
                desc: "See all available projects in your area and categories. Client identities are hidden until award — no favoritism, no politics.",
              },
              {
                step: "03",
                title: "Ask Questions",
                desc: "Use the RFI system to submit structured questions about the project. All answers are visible to every contractor — a level playing field.",
              },
              {
                step: "04",
                title: "Submit Your Bid",
                desc: "Submit your sealed bid before the deadline. Bids are completely hidden from everyone — including the client — until the deadline passes.",
              },
              {
                step: "05",
                title: "Win the Work",
                desc: "If awarded, you receive the client's full contact information and can begin the project. Your reputation and bid win the work — nothing else.",
              },
            ].map((s) => (
              <div key={s.step} style={{
                background: "#0F2040",
                border: "1px solid #1B4F8A",
                borderRadius: "12px",
                padding: "20px 24px",
                display: "flex",
                gap: "20px",
                alignItems: "flex-start",
              }}>
                <div style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 700,
                  fontSize: "36px",
                  color: "#C8102E",
                  lineHeight: 1,
                  flexShrink: 0,
                  minWidth: "48px",
                }}>
                  {s.step}
                </div>
                <div>
                  <div style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 700,
                    fontSize: "20px",
                    color: "#fff",
                    marginBottom: "6px",
                    letterSpacing: "0.5px",
                  }}>
                    {s.title}
                  </div>
                  <div style={{ fontSize: "14px", color: "#B0C4DE", lineHeight: 1.7 }}>
                    {s.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing */}
        <div style={{ marginBottom: "60px" }}>
          <h2 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "32px",
            letterSpacing: "1px",
            color: "#fff",
            textTransform: "uppercase",
            marginBottom: "8px",
          }}>
            Simple Pricing
          </h2>
          <div style={{ width: "40px", height: "2px", background: "#C8102E", marginBottom: "28px" }} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            {/* Standard */}
            <div style={{
              background: "#0F2040",
              border: "1px solid #1B4F8A",
              borderRadius: "12px",
              padding: "28px",
            }}>
              <h3 style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: "24px",
                color: "#fff",
                marginBottom: "4px",
              }}>
                Standard
              </h3>
              <div style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: "48px",
                color: "#fff",
                lineHeight: 1,
                marginBottom: "4px",
              }}>
                $200
              </div>
              <div style={{ fontSize: "13px", color: "#7A9CC4", marginBottom: "20px" }}>per month</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "24px" }}>
                {[
                  "Access to all open projects",
                  "Unlimited bid submissions",
                  "RFI communication system",
                  "File downloads",
                  "Bid history tracking",
                  "ONP Verified badge",
                ].map((f) => (
                  <div key={f} style={{ fontSize: "13px", color: "#B0C4DE" }}>✅ {f}</div>
                ))}
              </div>
              <Link href="/signup/contractor" style={{
                display: "block",
                background: "#C8102E",
                color: "#fff",
                padding: "12px",
                borderRadius: "6px",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: "14px",
                textAlign: "center",
              }}>
                Get Started
              </Link>
            </div>

            {/* Veteran */}
            <div style={{
              background: "#1e1a00",
              border: "2px solid #92400E",
              borderRadius: "12px",
              padding: "28px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <h3 style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 700,
                  fontSize: "24px",
                  color: "#FBBF24",
                  margin: 0,
                }}>
                  Veteran
                </h3>
                <span style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "3px 8px",
                  borderRadius: "20px",
                  background: "#92400E",
                  color: "#FBBF24",
                }}>
                  ★ EXCLUSIVE
                </span>
              </div>
              <div style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: "48px",
                color: "#FBBF24",
                lineHeight: 1,
                marginBottom: "4px",
              }}>
                $150
              </div>
              <div style={{ fontSize: "13px", color: "#92400E", marginBottom: "20px" }}>per month — verified veterans only</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "24px" }}>
                {[
                  "Everything in Standard",
                  "★ Veteran Owned badge on bids",
                  "★ Featured in contractor directory",
                  "25% discount vs Standard",
                  "Priority recognition from clients",
                ].map((f) => (
                  <div key={f} style={{ fontSize: "13px", color: "#FBBF24" }}>✅ {f}</div>
                ))}
              </div>
              <Link href="/signup/contractor" style={{
                display: "block",
                background: "#92400E",
                color: "#FBBF24",
                border: "2px solid #FBBF24",
                padding: "12px",
                borderRadius: "6px",
                textDecoration: "none",
                fontWeight: 700,
                fontSize: "14px",
                textAlign: "center",
              }}>
                ★ Get Started — Veteran
              </Link>
            </div>
          </div>

          <p style={{ fontSize: "12px", color: "#3A5A7A", textAlign: "center", marginTop: "16px" }}>
            No setup fees. No long-term contracts. Cancel anytime.
          </p>
        </div>

        {/* CTA */}
        <div style={{
          background: "#0F2040",
          border: "1px solid #1B4F8A",
          borderRadius: "12px",
          padding: "40px",
          textAlign: "center",
          marginBottom: "40px",
        }}>
          <h2 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "36px",
            letterSpacing: "1px",
            color: "#fff",
            marginBottom: "12px",
          }}>
            Ready to Work Smarter?
          </h2>
          <p style={{ fontSize: "15px", color: "#7A9CC4", marginBottom: "24px", lineHeight: 1.6 }}>
            Join ONP and start bidding on real projects from serious clients today.
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/signup/contractor" style={{
              background: "#C8102E",
              color: "#fff",
              padding: "14px 32px",
              borderRadius: "6px",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "15px",
            }}>
              Create Contractor Account
            </Link>
            <Link href="/contractors" style={{
              background: "transparent",
              color: "#7A9CC4",
              border: "1px solid #1B4F8A",
              padding: "14px 32px",
              borderRadius: "6px",
              textDecoration: "none",
              fontSize: "15px",
            }}>
              View Contractor Directory
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