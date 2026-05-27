import Link from "next/link";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const next = sp.next ?? "/dashboard";
  const error = sp.error;

  return (
    <main style={{
      minHeight: "100vh",
      background: "#FFFFFF",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "0",
    }}>
      {/* Top nav bar */}
      <nav style={{
        width: "100%",
        background: "#0A1628",
        borderBottom: "2px solid #C8102E",
        padding: "10px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxSizing: "border-box",
      }}>
        <div style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 800,
          fontSize: "20px",
          letterSpacing: "2px",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}>
          <span>★</span> ONP
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <Link href="/about" style={{
            background: "transparent",
            color: "#FFFFFF",
            border: "1px solid #1B4F8A",
            padding: "6px 14px",
            borderRadius: "6px",
            fontSize: "13px",
            textDecoration: "none",
            fontWeight: 500,
          }}>
            About ONP
          </Link>
          <Link href="/why-onp" style={{
            background: "#C8102E",
            color: "#FFFFFF",
            border: "none",
            padding: "6px 14px",
            borderRadius: "6px",
            fontSize: "13px",
            textDecoration: "none",
            fontWeight: 600,
          }}>
            Why ONP?
          </Link>
        </div>
      </nav>

      {/* Centered content */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        width: "100%",
      }}>
      {/* Logo / Wordmark */}
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <div style={{
          display: "inline-block",
          background: "#0A1628",
          borderRadius: "12px",
          padding: "18px 36px 14px",
          marginBottom: "4px",
        }}>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 800,
            fontSize: "56px",
            letterSpacing: "6px",
            color: "#fff",
            lineHeight: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
          }}>
            <span style={{ color: "#fff" }}>★</span>
            ONP
            <span style={{ color: "#fff" }}>★</span>
          </div>
          <div style={{
            fontFamily: "'Barlow', sans-serif",
            fontWeight: 400,
            fontSize: "11px",
            letterSpacing: "4px",
            color: "#7A9CC4",
            textTransform: "uppercase",
            marginTop: "8px",
          }}>
            Our Next Project
          </div>
          <div style={{
            width: "60px",
            height: "2px",
            background: "#C8102E",
            margin: "12px auto 0",
          }} />
        </div>
      </div>

{/* Beta banner */}
<div style={{
  background: "#FEF2F2",
  border: "1px solid #FCA5A5",
  borderRadius: "8px",
  padding: "12px 20px",
  marginBottom: "20px",
  textAlign: "center",
  maxWidth: "380px",
  width: "100%",
}}>
  <div style={{
    fontSize: "11px",
    fontWeight: 700,
    color: "#991B1B",
    textTransform: "uppercase",
    letterSpacing: "1px",
    marginBottom: "4px",
  }}>
    ⚠ Experimental Beta
  </div>
  <div style={{ fontSize: "12px", color: "#991B1B", lineHeight: 1.5 }}>
    This platform is currently in beta testing. All projects, bids, and contractor profiles are for testing purposes only and should not be considered legitimate business transactions.
  </div>
</div>

      {/* Login card */}
      <div style={{
        width: "100%",
        maxWidth: "380px",
        background: "#EEF4FF",
        border: "1px solid #B8D0E8",
        borderRadius: "12px",
        padding: "32px",
      }}>
        <h1 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: "24px",
          letterSpacing: "1px",
          color: "#0A1628",
          marginBottom: "24px",
          textAlign: "center",
        }}>
          Sign In
        </h1>

        {error && (
          <div style={{
            background: "#FEF2F2",
            border: "1px solid #FCA5A5",
            color: "#991B1B",
            padding: "10px 14px",
            borderRadius: "6px",
            fontSize: "13px",
            marginBottom: "16px",
          }}>
            {error}
          </div>
        )}

        <form action="/auth/login" method="post" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <input type="hidden" name="next" value={next} />

          <div>
            <label style={{
              display: "block",
              fontSize: "11px",
              fontWeight: 500,
              color: "#1B4F8A",
              textTransform: "uppercase",
              letterSpacing: "1px",
              marginBottom: "6px",
            }}>
              Email
            </label>
            <input
              type="email"
              name="email"
              required
              style={{
                width: "100%",
                background: "#FFFFFF",
                border: "1px solid #B8D0E8",
                color: "#0A1628",
                borderRadius: "6px",
                padding: "10px 14px",
                fontFamily: "'Barlow', sans-serif",
                fontSize: "14px",
                outline: "none",
              }}
            />
          </div>

          <div>
            <label style={{
              display: "block",
              fontSize: "11px",
              fontWeight: 500,
              color: "#1B4F8A",
              textTransform: "uppercase",
              letterSpacing: "1px",
              marginBottom: "6px",
            }}>
              Password
            </label>
            <input
              type="password"
              name="password"
              required
              style={{
                width: "100%",
                background: "#FFFFFF",
                border: "1px solid #B8D0E8",
                color: "#0A1628",
                borderRadius: "6px",
                padding: "10px 14px",
                fontFamily: "'Barlow', sans-serif",
                fontSize: "14px",
                outline: "none",
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              width: "100%",
              background: "#C8102E",
              color: "#fff",
              border: "none",
              padding: "12px",
              borderRadius: "6px",
              fontFamily: "'Barlow', sans-serif",
              fontWeight: 600,
              fontSize: "14px",
              letterSpacing: "1px",
              textTransform: "uppercase",
              cursor: "pointer",
              marginTop: "4px",
            }}
          >
            Sign In
          </button>
        </form>

        <div style={{
          borderTop: "1px solid #B8D0E8",
          marginTop: "24px",
          paddingTop: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}>
          <p style={{ fontSize: "13px", color: "#1B4F8A", textAlign: "center" }}>
            Need a client account?{" "}
            <Link href="/signup" style={{ color: "#0A1628", textDecoration: "underline" }}>
              Sign up
            </Link>
          </p>
          <p style={{ fontSize: "13px", color: "#1B4F8A", textAlign: "center" }}>
            Contractor?{" "}
            <Link href="/signup/contractor" style={{ color: "#0A1628", textDecoration: "underline" }}>
              Sign up here
            </Link>
            <p style={{ fontSize: "13px", color: "#1B4F8A", textAlign: "center" }}>
  <Link href="/forgot-password" style={{ color: "#0A1628", textDecoration: "underline" }}>
    Forgot your password?
  </Link>
</p>
          </p>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        marginTop: "32px",
        fontSize: "11px",
        color: "#4A7FB5",
        textAlign: "center",
        letterSpacing: "1px",
        textTransform: "uppercase",
      }}>
        Honoring American Veterans
      </div>

      <div style={{ marginTop: "16px", display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center" }}>
        <Link href="/contractors" style={{ fontSize: "12px", color: "#4A7FB5", textDecoration: "underline" }}>
          Contractor Directory
        </Link>
        <Link href="/trust" style={{ fontSize: "12px", color: "#4A7FB5", textDecoration: "underline" }}>
          Client Trust
        </Link>
      </div>

      </div>{/* end centered content wrapper */}
    </main>
  );
}
