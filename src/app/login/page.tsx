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
      justifyContent: "center",
      padding: "24px",
    }}>
      {/* Logo / Wordmark */}
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <div style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 800,
          fontSize: "56px",
          letterSpacing: "6px",
          color: "#0A1628",
          lineHeight: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
        }}>
          <span style={{ color: "#1B4F8A" }}>★</span>
          ONP
          <span style={{ color: "#1B4F8A" }}>★</span>
        </div>
        <div style={{
          fontFamily: "'Barlow', sans-serif",
          fontWeight: 400,
          fontSize: "11px",
          letterSpacing: "4px",
          color: "#1B4F8A",
          textTransform: "uppercase",
          marginTop: "8px",
        }}>
          Our Next Project
        </div>
        <div style={{
          width: "60px",
          height: "2px",
          background: "#C8102E",
          margin: "16px auto 0",
        }} />
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

      <div style={{
  marginTop: "20px",
  fontSize: "12px",
  color: "#4A7FB5",
  textAlign: "center",
}}>
  <Link href="/about" style={{ color: "#1B4F8A", textDecoration: "underline" }}>
    About ONP
  </Link>
</div>
<div style={{
  marginTop: "10px",
  fontSize: "12px",
  color: "#4A7FB5",
  textAlign: "center",
}}>
  <Link href="/why-onp" style={{ color: "#1B4F8A", textDecoration: "underline" }}>
    Why ONP?
  </Link>
</div>
<div style={{
  marginTop: "10px",
  fontSize: "12px",
  color: "#4A7FB5",
  textAlign: "center",
}}>
  <Link href="/contractors" style={{ color: "#1B4F8A", textDecoration: "underline" }}>
    Contractor Directory
  </Link>
</div>
    </main>
  );
}
