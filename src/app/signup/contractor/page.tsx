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
      alignItems: "flex-start",
      justifyContent: "center",
      padding: "48px 24px",
    }}>
      <form onSubmit={onSubmit} style={{
        width: "100%",
        maxWidth: "480px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "8px" }}>
          <div style={{
            display: "inline-block",
            background: "#1E3A8A",
            borderRadius: "12px",
            padding: "14px 28px 10px",
          }}>
            <span style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: "32px",
              letterSpacing: "3px",
              color: "#fff",
            }}>
              <span style={{ color: "#fff" }}>★</span> ONP <span style={{ color: "#fff" }}>★</span>
            </span>
          </div>
        </div>

        <h1 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: "28px",
          color: "#1E3A8A",
          letterSpacing: "1px",
          textAlign: "center",
          marginBottom: "4px",
        }}>
          Contractor Sign Up
        </h1>

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

        {/* Account fields */}
        <div style={{
          background: "#EEF4FF",
          border: "1px solid #B8D0E8",
          borderRadius: "12px",
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
            <div style={{ fontSize: "11px", color: "#4A7FB5", marginTop: "4px" }}>
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
            <div style={{ fontSize: "11px", color: "#4A7FB5", marginTop: "4px" }}>
              Used to verify service area coverage.
            </div>
          </div>
        </div>

        {/* Formal disclaimer */}
        <div style={{
          background: "#EEF4FF",
          border: "1px solid #B8D0E8",
          borderRadius: "12px",
          padding: "20px 24px",
        }}>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "16px",
            letterSpacing: "1px",
            color: "#1E3A8A",
            textTransform: "uppercase",
            marginBottom: "10px",
          }}>
            Contractor Acknowledgment
          </div>

          <div style={{
            fontSize: "12px",
            color: "#1B4F8A",
            lineHeight: 1.7,
            marginBottom: "14px",
          }}>
            By creating an account, you acknowledge that:
            <ul style={{ margin: "8px 0 0 16px", padding: 0 }}>
              <li style={{ marginBottom: "6px" }}>
                You are an independent business and will submit bids using your own professional judgment.
                ONP does not direct, supervise, or approve bids.
              </li>
              <li style={{ marginBottom: "6px" }}>
                Bids are good-faith offers based on Client-provided information. ONP does not verify
                Client information and is not responsible for site conditions, scope changes, or payment.
              </li>
              <li style={{ marginBottom: "6px" }}>
                Subscription fees are non-refundable. ONP makes no representation regarding the volume,
                quality, or profitability of available projects.
              </li>
              <li style={{ marginBottom: 0 }}>
                ONP is a marketplace only — not your employer, agent, or partner.
              </li>
            </ul>
          </div>

          <div style={{ fontSize: "12px", color: "#4A7FB5", marginBottom: "16px" }}>
            <Link href="/contractor-bid-disclaimer" target="_blank" style={{ color: "#1B4F8A", fontWeight: 600 }}>
              Read the full Contractor Bid Acknowledgment →
            </Link>
          </div>

          {/* Typed name acknowledgment */}
          <div style={{ marginBottom: "14px" }}>
            <label style={{
              ...labelStyle,
              marginBottom: "6px",
              color: nameMatches && typedName ? "#15803D" : "#1B4F8A",
            }}>
              Type your business name to confirm you agree
            </label>
            <input
              style={{
                ...inputStyle,
                border: `1px solid ${nameMatches && typedName ? "#166534" : "#B8D0E8"}`,
                background: nameMatches && typedName ? "#F0FDF4" : "#FFFFFF",
              }}
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              placeholder={businessName || "Your business name"}
            />
            {typedName && !nameMatches && (
              <div style={{ fontSize: "11px", color: "#991B1B", marginTop: "4px" }}>
                Must match the business name above exactly.
              </div>
            )}
            {nameMatches && typedName && (
              <div style={{ fontSize: "11px", color: "#15803D", marginTop: "4px" }}>
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
            background: termsChecked ? "#F0FDF4" : "#FFFFFF",
            border: `1px solid ${termsChecked ? "#166534" : "#B8D0E8"}`,
            borderRadius: "8px",
          }}>
            <input
              type="checkbox"
              checked={termsChecked}
              onChange={(e) => setTermsChecked(e.target.checked)}
              style={{ marginTop: "2px", accentColor: "#1B4F8A", flexShrink: 0 }}
            />
            <span style={{ fontSize: "12px", color: "#1E3A8A", lineHeight: 1.5 }}>
              I have read and agree to the{" "}
              <Link href="/contractor-bid-disclaimer" target="_blank" style={{ color: "#1B4F8A" }}>
                Contractor Bid Acknowledgment
              </Link>
              {" "}and{" "}
              <Link href="/bid-disclaimer" target="_blank" style={{ color: "#1B4F8A" }}>
                Bid Disclaimer
              </Link>.
            </span>
          </label>
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
          disabled={busy || !canSubmit}
          style={{
            width: "100%",
            background: canSubmit && !busy ? "#C8102E" : "#B8D0E8",
            color: "#fff",
            border: "none",
            padding: "14px",
            borderRadius: "6px",
            fontFamily: "'Barlow', sans-serif",
            fontWeight: 600,
            fontSize: "14px",
            letterSpacing: "1px",
            textTransform: "uppercase",
            cursor: canSubmit && !busy ? "pointer" : "not-allowed",
          }}
        >
          {busy ? "Creating Account…" : "Create Account"}
        </button>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <p style={{ fontSize: "13px", color: "#1B4F8A", textAlign: "center" }}>
            Client?{" "}
            <Link style={{ color: "#1E3A8A", textDecoration: "underline" }} href="/signup">
              Sign up here
            </Link>
          </p>
          <p style={{ fontSize: "13px", color: "#1B4F8A", textAlign: "center" }}>
            Already have an account?{" "}
            <Link style={{ color: "#1E3A8A", textDecoration: "underline" }} href="/login">
              Log in
            </Link>
          </p>
        </div>
      </form>
    </main>
  );
}
