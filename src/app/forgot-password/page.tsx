import Link from "next/link";
import { forgotPassword } from "./actions";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const sp = await searchParams;

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
      {/* Logo */}
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

      {/* Card */}
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
          marginBottom: "8px",
          textAlign: "center",
        }}>
          Reset Password
        </h1>
        <p style={{
          fontSize: "13px",
          color: "#1B4F8A",
          textAlign: "center",
          marginBottom: "24px",
          lineHeight: 1.6,
        }}>
          Enter your email address and we'll send you a link to reset your password.
        </p>

        {/* Success */}
        {sp.sent === "1" && (
          <div style={{
            background: "#F0FDF4",
            border: "1px solid #166534",
            color: "#15803D",
            padding: "14px 18px",
            borderRadius: "8px",
            fontSize: "13px",
            marginBottom: "20px",
            textAlign: "center",
            lineHeight: 1.6,
          }}>
            ✅ Check your email for a password reset link. It may take a minute to arrive.
          </div>
        )}

        {/* Error */}
        {sp.error && (
          <div style={{
            background: "#FEF2F2",
            border: "1px solid #FCA5A5",
            color: "#991B1B",
            padding: "14px 18px",
            borderRadius: "8px",
            fontSize: "13px",
            marginBottom: "20px",
          }}>
            ❌ {decodeURIComponent(sp.error)}
          </div>
        )}

        {sp.sent !== "1" && (
          <form action={forgotPassword}>
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
                Email Address
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
                marginTop: "16px",
              }}
            >
              Send Reset Link
            </button>
          </form>
        )}

        <div style={{
          borderTop: "1px solid #B8D0E8",
          marginTop: "24px",
          paddingTop: "20px",
          textAlign: "center",
        }}>
          <Link href="/login" style={{ fontSize: "13px", color: "#1B4F8A", textDecoration: "underline" }}>
            Back to Sign In
          </Link>
        </div>
      </div>

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
    </main>
  );
}
