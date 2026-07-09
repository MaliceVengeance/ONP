"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { processSignupServiceArea } from "@/lib/serviceArea/actions";

export default function SignupContractorPage() {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();

  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [zip, setZip] = useState("");
  const [typedName, setTypedName] = useState("");
  const [termsChecked, setTermsChecked] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const nameMatches = typedName.trim().toLowerCase() === businessName.trim().toLowerCase();
  const canSubmit = businessName.trim() && email && password.length >= 8 && zip.trim().length >= 5 && nameMatches && termsChecked;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setMsg(null);
    setBusy(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: businessName.trim() || "Contractor",
            signup_role: "CONTRACTOR",
            service_area_zip: zip.trim().slice(0, 5),
            bid_disclaimer_agreed: true,
            bid_disclaimer_version: "v1.0-2026-05-25",
          },
        },
      });

      if (error) throw error;

      if (!data.session) {
        setMsg("Check your email to confirm your account, then log in.");
        return;
      }

      // Set service_area_status and auto-enroll waitlist if out-of-area
      const { inArea } = await processSignupServiceArea(data.user!.id, zip, email, "CONTRACTOR");

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
      alignItems: "flex-start",
      justifyContent: "center",
      padding: "48px 24px",
      fontFamily: "'Barlow', sans-serif",
    }}>
      <form onSubmit={onSubmit} style={{
        width: "100%",
        maxWidth: "480px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}>
        {/* Logo — doubles as back-to-homepage */}
        <Link href="/" style={{ textDecoration: "none", textAlign: "center", marginBottom: "8px" }}>
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

        <h1 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: "28px",
          color: "var(--camo-charcoal)",
          letterSpacing: "1px",
          textAlign: "center",
          marginBottom: "4px",
          textTransform: "uppercase",
        }}>
          Contractor Sign Up
        </h1>

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

        {/* Account fields */}
        <div style={{
          background: "var(--camo-concrete)",
          border: "1px solid #d9dbdb",
          borderRadius: "8px",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}>
          <div>
            <label style={labelStyle}>Business Name</label>
            <input
              style={inputStyle}
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Your business name"
              required
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
            <div style={{ fontSize: "11px", color: "var(--camo-gunmetal)", marginTop: "4px" }}>
              Minimum 8 characters
            </div>
          </div>

          <div>
            <label style={labelStyle}>Business ZIP Code</label>
            <input
              style={inputStyle}
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              required
              maxLength={10}
              placeholder="e.g. 79912"
            />
            <div style={{ fontSize: "11px", color: "var(--camo-gunmetal)", marginTop: "4px" }}>
              Used to verify service area coverage.
            </div>
          </div>
        </div>

        {/* Formal disclaimer */}
        <div style={{
          background: "var(--camo-concrete)",
          border: "1px solid #d9dbdb",
          borderRadius: "8px",
          padding: "20px 24px",
        }}>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "16px",
            letterSpacing: "1px",
            color: "var(--camo-charcoal)",
            textTransform: "uppercase",
            marginBottom: "10px",
          }}>
            Contractor Acknowledgment
          </div>

          <div style={{
            fontSize: "12px",
            color: "var(--camo-gunmetal)",
            lineHeight: 1.7,
            marginBottom: "14px",
          }}>
            By creating an account, you acknowledge that:
            <ul style={{ margin: "8px 0 0 16px", padding: 0 }}>
              <li style={{ marginBottom: "6px" }}>
                You are an independent business and will submit bids using your own professional judgment.
                <strong> ONP</strong> does not direct, supervise, or approve bids.
              </li>
              <li style={{ marginBottom: "6px" }}>
                Bids are good-faith offers based on Client-provided information. <strong>ONP</strong> does not verify
                Client information and is not responsible for site conditions, scope changes, or payment.
              </li>
              <li style={{ marginBottom: "6px" }}>
                Subscription fees are non-refundable. <strong>ONP</strong> makes no representation regarding the volume,
                quality, or profitability of available projects.
              </li>
              <li style={{ marginBottom: 0 }}>
                <strong>ONP</strong> is a marketplace only — not your employer, agent, or partner.
              </li>
            </ul>
          </div>

          <div style={{ fontSize: "12px", color: "var(--camo-gunmetal)", marginBottom: "16px" }}>
            <Link href="/contractor-bid-disclaimer" target="_blank" style={{ color: "var(--camo-gunmetal)", fontWeight: 600 }}>
              Read the full Contractor Bid Acknowledgment →
            </Link>
          </div>

          {/* Typed name acknowledgment */}
          <div style={{ marginBottom: "14px" }}>
            <label style={{
              ...labelStyle,
              marginBottom: "6px",
              color: nameMatches && typedName ? "var(--camo-good)" : "var(--camo-gunmetal)",
            }}>
              Type your business name to confirm you agree
            </label>
            <input
              style={{
                ...inputStyle,
                border: `1px solid ${nameMatches && typedName ? "var(--camo-good)" : "#d9dbdb"}`,
                background: nameMatches && typedName ? "rgba(92,138,107,0.1)" : "#FFFFFF",
              }}
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              placeholder={businessName || "Your business name"}
            />
            {typedName && !nameMatches && (
              <div style={{ fontSize: "11px", color: "#B45050", marginTop: "4px" }}>
                Must match the business name above exactly.
              </div>
            )}
            {nameMatches && typedName && (
              <div style={{ fontSize: "11px", color: "var(--camo-good)", marginTop: "4px" }}>
                ✓ Confirmed
              </div>
            )}
          </div>

          {/* Terms checkbox */}
          <label style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "10px",
            cursor: "pointer",
            padding: "10px 12px",
            background: termsChecked ? "rgba(92,138,107,0.1)" : "#FFFFFF",
            border: `1px solid ${termsChecked ? "var(--camo-good)" : "#d9dbdb"}`,
            borderRadius: "6px",
          }}>
            <input
              type="checkbox"
              checked={termsChecked}
              onChange={(e) => setTermsChecked(e.target.checked)}
              style={{ marginTop: "2px", accentColor: "var(--camo-gunmetal)", flexShrink: 0 }}
            />
            <span style={{ fontSize: "12px", color: "var(--camo-charcoal)", lineHeight: 1.5 }}>
              I have read and agree to the{" "}
              <Link href="/contractor-bid-disclaimer" target="_blank" style={{ color: "var(--camo-gunmetal)" }}>
                Contractor Bid Acknowledgment
              </Link>
              {" "}and{" "}
              <Link href="/bid-disclaimer" target="_blank" style={{ color: "var(--camo-gunmetal)" }}>
                Bid Disclaimer
              </Link>.
            </span>
          </label>
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
          disabled={busy || !canSubmit}
          style={{
            width: "100%",
            background: canSubmit && !busy ? "var(--camo-accent)" : "#d9dbdb",
            color: "var(--camo-ink)",
            border: "none",
            padding: "14px",
            borderRadius: "4px",
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "14px",
            letterSpacing: "1px",
            textTransform: "uppercase",
            cursor: canSubmit && !busy ? "pointer" : "not-allowed",
          }}
        >
          {busy ? "Creating Account…" : "Create Account"}
        </button>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <p style={{ fontSize: "13px", color: "var(--camo-gunmetal)", textAlign: "center" }}>
            Client?{" "}
            <Link style={{ color: "var(--camo-charcoal)", fontWeight: 600, textDecoration: "underline" }} href="/signup">
              Sign up here
            </Link>
          </p>
          <p style={{ fontSize: "13px", color: "var(--camo-gunmetal)", textAlign: "center" }}>
            Already have an account?{" "}
            <Link style={{ color: "var(--camo-charcoal)", fontWeight: 600, textDecoration: "underline" }} href="/login">
              Log in
            </Link>
          </p>
        </div>
      </form>
    </main>
  );
}
