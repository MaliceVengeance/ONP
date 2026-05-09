import type { ReactNode } from "react";
import Link from "next/link";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "#0A1628" }}>
      <header style={{
        background: "#0A1628",
        borderBottom: "2px solid #C8102E",
        padding: "14px 28px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <Link href="/dashboard" style={{ textDecoration: "none" }}>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 800,
            fontSize: "26px",
            letterSpacing: "2px",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}>
            <span style={{ color: "#C8102E" }}>★</span> ONP
          </div>
          <div style={{
            fontFamily: "'Barlow', sans-serif",
            fontWeight: 400,
            fontSize: "11px",
            letterSpacing: "3px",
            color: "#7A9CC4",
            textTransform: "uppercase",
          }}>
            Our Next Project
          </div>
        </Link>

        <form action="/auth/signout" method="post">
          <button style={{
            background: "transparent",
            border: "1px solid #1B4F8A",
            color: "#7A9CC4",
            padding: "6px 16px",
            borderRadius: "6px",
            fontFamily: "'Barlow', sans-serif",
            fontSize: "13px",
            cursor: "pointer",
          }}>
            Sign out
          </button>
        </form>
      </header>

      {/* Beta banner */}
      <div style={{
        background: "#3D0A0A",
        borderBottom: "1px solid #991B1B",
        padding: "10px 28px",
        textAlign: "center",
        fontSize: "12px",
        color: "#FCA5A5",
      }}>
        <span style={{
          fontWeight: 700,
          color: "#F87171",
          textTransform: "uppercase",
          letterSpacing: "1px",
          marginRight: "8px",
        }}>
          ⚠ Experimental Beta:
        </span>
        This platform is in beta testing. All projects, bids, and contractor profiles are for testing purposes only and should not be considered legitimate business transactions.
      </div>

      <main style={{ maxWidth: "900px", margin: "0 auto", padding: "32px 24px" }}>
        {children}
      </main>
    </div>
  );
}