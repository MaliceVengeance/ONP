"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function SignupClientPage() {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setBusy(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName || "Client",
            signup_role: "CLIENT",
          },
        },
      });

      if (error) throw error;

      // If email confirmations are ON, there may be no session yet.
      if (!data.session) {
        setMsg("Check your email to confirm your account, then log in.");
        return;
      }

      router.push("/dashboard");
    } catch (err: any) {
      setMsg(err?.message ?? "Signup failed");
    } finally {
      setBusy(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "#FFFFFF",
    border: "1px solid #B8D0E8",
    color: "#0A1628",
    borderRadius: "6px",
    padding: "10px 14px",
    fontFamily: "'Barlow', sans-serif",
    fontSize: "14px",
    outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "11px",
    fontWeight: 500,
    color: "#1B4F8A",
    textTransform: "uppercase",
    letterSpacing: "1px",
    marginBottom: "6px",
  };

  return (
    <main style={{
      minHeight: "100vh",
      background: "#FFFFFF",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
    }}>
      <form onSubmit={onSubmit} style={{
        width: "100%",
        maxWidth: "440px",
        background: "#EEF4FF",
        border: "1px solid #B8D0E8",
        borderRadius: "12px",
        padding: "32px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}>
        <h1 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: "28px",
          color: "#0A1628",
          letterSpacing: "1px",
          marginBottom: "8px",
        }}>Client Sign Up</h1>

        <div>
          <label style={labelStyle}>Display name</label>
          <input
            style={inputStyle}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Sam"
          />
        </div>

        <div>
          <label style={labelStyle}>Email</label>
          <input
            style={inputStyle}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label style={labelStyle}>Password</label>
          <input
            style={inputStyle}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
          <p style={{ fontSize: "12px", color: "#4A7FB5", marginTop: "4px" }}>Minimum 8 characters.</p>
        </div>

        {msg && (
          <div style={{
            background: "#FEF2F2",
            border: "1px solid #FCA5A5",
            color: "#991B1B",
            padding: "10px 14px",
            borderRadius: "6px",
            fontSize: "13px",
          }}>
            {msg}
          </div>
        )}

        <button
          disabled={busy}
          style={{
            width: "100%",
            background: busy ? "#4A7FB5" : "#C8102E",
            color: "#fff",
            border: "none",
            padding: "12px",
            borderRadius: "6px",
            fontFamily: "'Barlow', sans-serif",
            fontWeight: 600,
            fontSize: "14px",
            letterSpacing: "1px",
            textTransform: "uppercase",
            cursor: busy ? "not-allowed" : "pointer",
            opacity: busy ? 0.7 : 1,
          }}
        >
          {busy ? "Creating..." : "Sign up"}
        </button>

        <p style={{ fontSize: "13px", color: "#1B4F8A" }}>
          Contractor?{" "}
          <a style={{ color: "#0A1628", textDecoration: "underline" }} href="/signup/contractor">
            Sign up here
          </a>
        </p>

        <p style={{ fontSize: "13px", color: "#1B4F8A" }}>
          Already have an account?{" "}
          <a style={{ color: "#0A1628", textDecoration: "underline" }} href="/login">
            Log in
          </a>
        </p>
      </form>
    </main>
  );
}
