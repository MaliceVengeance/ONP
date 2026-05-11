"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    // Listen for the auth state change when the token is processed
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "PASSWORD_RECOVERY") {
          setReady(true);
        }
        if (event === "SIGNED_IN" && session) {
          setReady(true);
        }
      }
    );

    // Also check if we already have a session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    await supabase.auth.signOut();
    setTimeout(() => router.push("/login"), 3000);
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "#0A1628",
    border: "1px solid #1B4F8A",
    color: "#F0F4FF",
    borderRadius: "6px",
    padding: "10px 14px",
    fontFamily: "'Barlow', sans-serif",
    fontSize: "14px",
    outline: "none",
  };

  return (
    <main style={{
      minHeight: "100vh",
      background: "#0A1628",
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
          color: "#fff",
          lineHeight: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
        }}>
          <span style={{ color: "#C8102E" }}>★</span>
          ONP
          <span style={{ color: "#C8102E" }}>★</span>
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
          margin: "16px auto 0",
        }} />
      </div>

      {/* Card */}
      <div style={{
        width: "100%",
        maxWidth: "380px",
        background: "#0F2040",
        border: "1px solid #1B4F8A",
        borderRadius: "12px",
        padding: "32px",
      }}>
        <h1 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: "24px",
          letterSpacing: "1px",
          color: "#fff",
          marginBottom: "8px",
          textAlign: "center",
        }}>
          Set New Password
        </h1>
        <p style={{
          fontSize: "13px",
          color: "#7A9CC4",
          textAlign: "center",
          marginBottom: "24px",
        }}>
          Choose a strong password for your account.
        </p>

        {success ? (
          <div style={{
            background: "#0D3320",
            border: "1px solid #166534",
            color: "#4ADE80",
            padding: "14px 18px",
            borderRadius: "8px",
            fontSize: "13px",
            textAlign: "center",
            lineHeight: 1.6,
          }}>
            ✅ Password updated successfully! Redirecting to sign in...
          </div>
        ) : !ready ? (
          <div style={{
            textAlign: "center",
            padding: "20px",
            color: "#7A9CC4",
            fontSize: "13px",
          }}>
            Verifying reset link...
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{
                background: "#3D0A0A",
                border: "1px solid #991B1B",
                color: "#F87171",
                padding: "12px 16px",
                borderRadius: "8px",
                fontSize: "13px",
                marginBottom: "16px",
              }}>
                ❌ {error}
              </div>
            )}

            <div style={{ marginBottom: "16px" }}>
              <label style={{
                display: "block",
                fontSize: "11px",
                fontWeight: 500,
                color: "#7A9CC4",
                textTransform: "uppercase",
                letterSpacing: "1px",
                marginBottom: "6px",
              }}>
                New Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={inputStyle}
                placeholder="Min 8 characters"
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{
                display: "block",
                fontSize: "11px",
                fontWeight: 500,
                color: "#7A9CC4",
                textTransform: "uppercase",
                letterSpacing: "1px",
                marginBottom: "6px",
              }}>
                Confirm Password
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                style={inputStyle}
                placeholder="Re-enter password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                background: loading ? "#3A5A7A" : "#C8102E",
                color: "#fff",
                border: "none",
                padding: "12px",
                borderRadius: "6px",
                fontFamily: "'Barlow', sans-serif",
                fontWeight: 600,
                fontSize: "14px",
                letterSpacing: "1px",
                textTransform: "uppercase",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        )}
      </div>

      <div style={{
        marginTop: "32px",
        fontSize: "11px",
        color: "#3A5A7A",
        textAlign: "center",
        letterSpacing: "1px",
        textTransform: "uppercase",
      }}>
        Honoring American Veterans
      </div>
    </main>
  );
}