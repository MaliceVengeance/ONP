"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { processSignupServiceArea } from "@/lib/serviceArea/actions";
import { BetaDisclaimerBanner } from "@/components/MarketingChrome";

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

  return (
    <main style={{
      minHeight: "100vh",
      background: "var(--camo-paper)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      fontFamily: "'Barlow', sans-serif",
    }}>
      <BetaDisclaimerBanner />

      <div style={{
        flex: 1,
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}>
      {/* Logo — doubles as back-to-homepage */}
      <Link href="/" style={{ textDecoration: "none", textAlign: "center", marginBottom: "20px" }}>
        <div style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 800,
          fontSize: "1.6rem",
          letterSpacing: "0.05em",
          color: "var(--camo-charcoal)",
          textTransform: "uppercase",
        }}>
          <span style={{ color: "var(--camo-accent)" }}>★</span> ONP
        </div>
        <div style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "0.62rem",
          letterSpacing: "0.2em",
          color: "var(--camo-gunmetal)",
          textTransform: "uppercase",
          marginTop: "4px",
        }}>
          Our Next Project
        </div>
      </Link>

      <form onSubmit={onSubmit} style={{
        width: "100%",
        maxWidth: "440px",
        background: "var(--camo-concrete)",
        border: "1px solid #d9dbdb",
        borderRadius: "8px",
        padding: "32px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}>
        <h1 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: "28px",
          color: "var(--camo-charcoal)",
          letterSpacing: "1px",
          marginBottom: "8px",
          textTransform: "uppercase",
        }}>Client Sign Up</h1>

        {/* Service area notice */}
        <div style={{
          background: "var(--camo-gunmetal)",
          borderRadius: "6px",
          padding: "10px 14px",
          fontSize: "12px",
          color: "var(--camo-concrete)",
          lineHeight: 1.5,
        }}>
          📍 <strong>ONP</strong> is currently serving <strong>El Paso, TX and Las Cruces, NM</strong>. Out-of-area? You can still sign up and join the waitlist.
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
          <p style={{ fontSize: "12px", color: "var(--camo-gunmetal)", marginTop: "4px" }}>Minimum 8 characters.</p>
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
          <p style={{ fontSize: "12px", color: "var(--camo-gunmetal)", marginTop: "4px" }}>
            Used to verify service area coverage.
          </p>
        </div>

        {msg && (
          <div style={{
            background: msg.includes("Check your email") ? "rgba(92,138,107,0.1)" : "rgba(180,80,80,0.1)",
            border: `1px solid ${msg.includes("Check your email") ? "var(--camo-good)" : "#B45050"}`,
            color: msg.includes("Check your email") ? "var(--camo-good)" : "#943A3A",
            padding: "10px 14px",
            borderRadius: "4px",
            fontSize: "13px",
          }}>
            {msg}
          </div>
        )}

        <button
          disabled={busy}
          style={{
            width: "100%",
            background: busy ? "var(--camo-steel)" : "var(--camo-accent)",
            color: "var(--camo-ink)",
            border: "none",
            padding: "12px",
            borderRadius: "4px",
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "14px",
            letterSpacing: "1px",
            textTransform: "uppercase",
            cursor: busy ? "not-allowed" : "pointer",
            opacity: busy ? 0.7 : 1,
          }}
        >
          {busy ? "Creating..." : "Sign up"}
        </button>

        <p style={{ fontSize: "13px", color: "var(--camo-gunmetal)" }}>
          Contractor?{" "}
          <a style={{ color: "var(--camo-charcoal)", fontWeight: 600, textDecoration: "underline" }} href="/signup/contractor">
            Sign up here
          </a>
        </p>

        <p style={{ fontSize: "13px", color: "var(--camo-gunmetal)" }}>
          Already have an account?{" "}
          <a style={{ color: "var(--camo-charcoal)", fontWeight: 600, textDecoration: "underline" }} href="/login">
            Log in
          </a>
        </p>
      </form>
      </div>
    </main>
  );
}
