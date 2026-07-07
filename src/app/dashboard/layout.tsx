import type { ReactNode } from "react";
import Link from "next/link";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--camo-paper)",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Header */}
      <header style={{
        background: "var(--camo-charcoal)",
        borderBottom: "2px solid var(--camo-accent)",
        padding: "10px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
      }}>
        <Link href="/dashboard" style={{ textDecoration: "none" }}>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 800,
            fontSize: "22px",
            letterSpacing: "2px",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}>
            <span style={{ color: "#fff" }}>★</span> ONP
          </div>
          <div style={{
            fontFamily: "'Barlow', sans-serif",
            fontWeight: 400,
            fontSize: "10px",
            letterSpacing: "2px",
            color: "#FFFFFF",
            textTransform: "uppercase",
          }}>
            Our Next Project
          </div>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Link href="/about" className="mob-hide" style={{
            background: "transparent",
            border: "1px solid var(--camo-gunmetal)",
            color: "#d9dbdb",
            padding: "5px 10px",
            borderRadius: "6px",
            fontFamily: "'Barlow', sans-serif",
            fontSize: "11px",
            textDecoration: "none",
          }}>
            About
          </Link>
          <Link href="/why-onp" className="mob-hide" style={{
            background: "transparent",
            border: "1px solid var(--camo-gunmetal)",
            color: "#d9dbdb",
            padding: "5px 10px",
            borderRadius: "6px",
            fontFamily: "'Barlow', sans-serif",
            fontSize: "11px",
            textDecoration: "none",
          }}>
            Why ONP
          </Link>
          <form action="/auth/signout" method="post">
            <button style={{
              background: "transparent",
              border: "1px solid var(--camo-gunmetal)",
              color: "#FFFFFF",
              padding: "6px 12px",
              borderRadius: "6px",
              fontFamily: "'Barlow', sans-serif",
              fontSize: "12px",
              cursor: "pointer",
            }}>
              Sign out
            </button>
          </form>
        </div>
      </header>

      {/* Beta banner */}
      <div style={{
        background: "var(--camo-gunmetal)",
        padding: "6px 16px",
        textAlign: "center",
        fontSize: "11px",
        color: "var(--camo-concrete)",
        lineHeight: 1.5,
        flexShrink: 0,
      }}>
        <span style={{
          fontWeight: 700,
          color: "var(--camo-accent)",
          textTransform: "uppercase",
          letterSpacing: "1px",
          marginRight: "6px",
        }}>
          ⚠ Beta:
        </span>
        For testing only — not legitimate business transactions.
      </div>

      {/* Page content */}
      <main style={{
        maxWidth: "900px",
        width: "100%",
        margin: "0 auto",
        padding: "20px 16px 40px",
        flex: "1 0 auto",
      }}>
        {children}
      </main>

      {/* Legal footer */}
      <div style={{
        background: "var(--camo-charcoal)",
        borderTop: "2px solid var(--camo-accent)",
        padding: "18px 16px",
        textAlign: "center",
        flexShrink: 0,
      }}>
        <div style={{
          fontSize: "11px",
          color: "#d9dbdb",
          marginBottom: "12px",
          letterSpacing: "0.5px",
        }}>
          © 2026 Our Next Project, LLC — Honoring American Veterans
        </div>
        <div style={{
          display: "flex",
          justifyContent: "center",
          gap: "8px",
          flexWrap: "wrap",
        }}>
          {[
            { label: "Terms of Service", href: "/terms" },
            { label: "Terms (Legal)", href: "/terms/legal" },
            { label: "Privacy Policy", href: "/privacy" },
            { label: "Privacy (Legal)", href: "/privacy/legal" },
          ].map((l) => (
            <Link key={l.href} href={l.href} style={{
              fontSize: "12px",
              color: "#FFFFFF",
              textDecoration: "underline",
              padding: "4px 12px",
              borderRadius: "4px",
              border: "1px solid var(--camo-gunmetal)",
            }}>
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
