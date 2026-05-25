import type { ReactNode } from "react";
import Link from "next/link";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "#FFFFFF" }}>
      <header style={{
        background: "#0A1628",
        borderBottom: "2px solid #C8102E",
        padding: "10px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
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

        <form action="/auth/signout" method="post">
          <button style={{
            background: "transparent",
            border: "1px solid #1B4F8A",
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
      </header>

      {/* Beta banner */}
      <div style={{
        background: "#FEF2F2",
        borderBottom: "1px solid #FCA5A5",
        padding: "6px 16px",
        textAlign: "center",
        fontSize: "11px",
        color: "#991B1B",
        lineHeight: 1.5,
      }}>
        <span style={{
          fontWeight: 700,
          color: "#991B1B",
          textTransform: "uppercase",
          letterSpacing: "1px",
          marginRight: "6px",
        }}>
          ⚠ Beta:
        </span>
        For testing only — not legitimate business transactions.
      </div>

      <main style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "20px 16px",
      }}>
        {children}
      </main>

      <footer style={{
        borderTop: "1px solid #B8D0E8",
        padding: "16px",
        textAlign: "center",
        fontSize: "11px",
        color: "#4A7FB5",
        marginTop: "40px",
      }}>
        <div style={{ marginBottom: "6px" }}>
          © {new Date().getFullYear()} Our Next Project, LLC — Honoring American Veterans
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: "20px", flexWrap: "wrap" }}>
          <Link href="/terms" style={{ color: "#4A7FB5", textDecoration: "underline" }}>Terms of Service</Link>
          <Link href="/terms/legal" style={{ color: "#4A7FB5", textDecoration: "underline" }}>Terms (Legal)</Link>
          <Link href="/privacy" style={{ color: "#4A7FB5", textDecoration: "underline" }}>Privacy Policy</Link>
          <Link href="/privacy/legal" style={{ color: "#4A7FB5", textDecoration: "underline" }}>Privacy (Legal)</Link>
        </div>
      </footer>
    </div>
  );
}