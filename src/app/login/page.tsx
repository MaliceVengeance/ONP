import Link from "next/link";
import { joinWaitlist } from "@/lib/serviceArea/actions";
import { ServiceAreaBanner, BetaDisclaimerBanner, MarketingFooter } from "@/components/MarketingChrome";

const eyebrow: React.CSSProperties = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: "0.72rem",
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: "var(--camo-gunmetal)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--camo-paper)",
  border: "1px solid #d9dbdb",
  color: "var(--camo-charcoal)",
  borderRadius: "4px",
  padding: "10px 14px",
  fontFamily: "'Barlow', sans-serif",
  fontSize: "14px",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "11px",
  fontWeight: 500,
  color: "var(--camo-gunmetal)",
  textTransform: "uppercase",
  letterSpacing: "1px",
  marginBottom: "6px",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; waitlist?: string }>;
}) {
  const sp = await searchParams;
  const next = sp.next ?? "/dashboard";
  const error = sp.error;
  const waitlistJoined = sp.waitlist === "joined";

  return (
    <div style={{ minHeight: "100vh", background: "var(--camo-paper)", color: "var(--camo-ink)", fontFamily: "'Barlow', sans-serif", display: "flex", flexDirection: "column" }}>
      <BetaDisclaimerBanner />
      <ServiceAreaBanner />

      {/* Centered content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 24px" }}>

        {/* Logo — doubles as "back to homepage" */}
        <Link href="/" style={{ textDecoration: "none", marginBottom: "28px" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 800,
            fontSize: "1.6rem",
            letterSpacing: "0.05em",
            color: "var(--camo-charcoal)",
            textTransform: "uppercase",
          }}>
            <span style={{ color: "var(--camo-accent)" }}>★</span> ONP
          </div>
          <div style={{ ...eyebrow, textAlign: "center", marginTop: "4px" }}>Our Next Project</div>
        </Link>

        {/* Sign-in card */}
        <div style={{ width: "100%", maxWidth: "380px", background: "var(--camo-concrete)", border: "1px solid #d9dbdb", borderRadius: "8px", padding: "32px" }}>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: "1.4rem", letterSpacing: "0.02em", color: "var(--camo-charcoal)", marginBottom: "24px", textAlign: "center", textTransform: "uppercase" }}>
            Sign In
          </h1>

          {error && (
            <div style={{ background: "rgba(180,80,80,0.1)", border: "1px solid #B45050", color: "#943A3A", padding: "10px 14px", borderRadius: "4px", fontSize: "13px", marginBottom: "16px" }}>
              {error}
            </div>
          )}

          <form action="/auth/login" method="post" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <input type="hidden" name="next" value={next} />

            <div>
              <label style={labelStyle}>Email</label>
              <input type="email" name="email" required style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Password</label>
              <input type="password" name="password" required style={inputStyle} />
            </div>

            <button
              type="submit"
              style={{
                width: "100%",
                background: "var(--camo-accent)",
                color: "var(--camo-ink)",
                border: "none",
                padding: "12px",
                borderRadius: "4px",
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: "14px",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                cursor: "pointer",
                marginTop: "4px",
              }}
            >
              Sign In
            </button>
          </form>

          <div style={{ borderTop: "1px solid #d9dbdb", marginTop: "24px", paddingTop: "18px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <p style={{ fontSize: "13px", color: "var(--camo-gunmetal)", textAlign: "center" }}>
              New here?{" "}
              <Link href="/signup" style={{ color: "var(--camo-charcoal)", fontWeight: 600, textDecoration: "underline" }}>
                Sign up as a client
              </Link>
              {" "}/{" "}
              <Link href="/signup/contractor" style={{ color: "var(--camo-charcoal)", fontWeight: 600, textDecoration: "underline" }}>
                as a contractor
              </Link>
            </p>
            <p style={{ fontSize: "13px", color: "var(--camo-gunmetal)", textAlign: "center" }}>
              <Link href="/forgot-password" style={{ color: "var(--camo-gunmetal)", textDecoration: "underline" }}>
                Forgot your password?
              </Link>
            </p>
          </div>
        </div>

        {/* Waitlist section — anchor target for the "Join the waitlist" link site-wide */}
        <div id="waitlist" style={{ width: "100%", maxWidth: "380px", marginTop: "28px" }}>
          <div style={{ background: "var(--camo-concrete)", border: "1px solid #d9dbdb", borderRadius: "8px", padding: "24px" }}>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "1.15rem", color: "var(--camo-charcoal)", marginBottom: "8px", textTransform: "uppercase" }}>
              Not in El Paso or Las Cruces yet?
            </div>
            <p style={{ fontSize: "13px", color: "var(--camo-gunmetal)", lineHeight: 1.6, marginBottom: "16px" }}>
              We&apos;re starting local and growing intentionally. Drop your email and ZIP — we&apos;ll let you know when <strong>ONP</strong> launches in your area.
            </p>

            {waitlistJoined ? (
              <div style={{ background: "rgba(92,138,107,0.12)", border: "1px solid var(--camo-good)", borderRadius: "4px", padding: "14px 16px", fontSize: "13px", color: "var(--camo-good)", textAlign: "center" }}>
                ✓ Thanks — we&apos;ll be in touch when ONP launches near you.
              </div>
            ) : (
              <form
                action={async (formData: FormData) => {
                  "use server";
                  await joinWaitlist(formData);
                }}
                style={{ display: "flex", flexDirection: "column", gap: "10px" }}
              >
                <input type="hidden" name="source" value="HOMEPAGE" />
                <input type="hidden" name="intended_role" value="UNKNOWN" />

                <div style={{ display: "flex", gap: "8px" }}>
                  <input name="zip" required maxLength={10} placeholder="ZIP code" style={{ ...inputStyle, flex: "0 0 100px" }} />
                  <input name="email" type="email" required placeholder="your@email.com" style={{ ...inputStyle, flex: 1 }} />
                </div>
                <button
                  type="submit"
                  style={{
                    width: "100%",
                    background: "var(--camo-charcoal)",
                    color: "var(--camo-concrete)",
                    border: "none",
                    padding: "11px",
                    borderRadius: "4px",
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 700,
                    fontSize: "13px",
                    textTransform: "uppercase",
                    letterSpacing: "0.03em",
                    cursor: "pointer",
                  }}
                >
                  Join Waitlist
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Quick links */}
        <div style={{ marginTop: "24px", display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center" }}>
          <Link href="/contractors" style={{ fontSize: "12px", color: "var(--camo-gunmetal)", textDecoration: "underline" }}>
            Contractor Directory
          </Link>
          <Link href="/trust" style={{ fontSize: "12px", color: "var(--camo-gunmetal)", textDecoration: "underline" }}>
            Client Trust
          </Link>
          <Link href="/why-onp" style={{ fontSize: "12px", color: "var(--camo-gunmetal)", textDecoration: "underline" }}>
            Why ONP
          </Link>
        </div>
      </div>

      <MarketingFooter />
    </div>
  );
}
