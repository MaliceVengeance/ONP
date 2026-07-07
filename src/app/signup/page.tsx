"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { processSignupServiceArea } from "@/lib/serviceArea/actions";

export default function SignupClientPage() {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [zip, setZip] = useState("");
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
            service_area_zip: zip.trim().slice(0, 5),
          },
        },
      });

      if (error) throw error;

      if (!data.session) {
        setMsg("Check your email to confirm your account, then log in.");
        return;
      }

      // Set service_area_status and auto-enroll waitlist if out-of-area
      const { inArea } = await processSignupServiceArea(data.user!.id, zip, email, "CLIENT");

      if (!inArea) {
        router.push(`/signup/out-of-area?zip=${encodeURIComponent(zip.trim().slice(0, 5))}`);
      } else {
        router.push("/dashboard");
      }
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
    color: "#1E3A8A",
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
          color: "#1E3A8A",
          letterSpacing: "1px",
          marginBottom: "8px",
        }}>Client Sign Up</h1>

        {/* Service area notice */}
        <div style={{
          background: "#DBEAFE",
          border: "1px solid #93C5FD",
          borderRadius: "8px",
          padding: "10px 14px",
          fontSize: "12px",
          color: "#1E40AF",
          lineHeight: 1.5,
        }}>
          📍 ONP is currently serving <strong>El Paso, TX and Las Cruces, NM</strong>. Out-of-area? You can still sign up and join the waitlist.
        </div>

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

        <div>
          <label style={labelStyle}>ZIP Code</label>
          <input
            style={inputStyle}
            value={zip}
            onChange={(e) => setZip(e.target.value)}
            required
            maxLength={10}
            placeholder="e.g. 79912"
          />
          <p style={{ fontSize: "12px", color: "#4A7FB5", marginTop: "4px" }}>
            Used to verify service area coverage.
          </p>
        </div>

        {msg && (
          <div style={{
            background: msg.includes("Check your email") ? "#F0FDF4" : "#FEF2F2",
            border: `1px solid ${msg.includes("Check your email") ? "#166534" : "#FCA5A5"}`,
            color: msg.includes("Check your email") ? "#15803D" : "#991B1B",
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
          <a style={{ color: "#1E3A8A", textDecoration: "underline" }} href="/signup/contractor">
            Sign up here
          </a>
        </p>

        <p style={{ fontSize: "13px", color: "#1B4F8A" }}>
          Already have an account?{" "}
          <a style={{ color: "#1E3A8A", textDecoration: "underline" }} href="/login">
            Log in
          </a>
        </p>
      </form>
    </main>
  );
}
