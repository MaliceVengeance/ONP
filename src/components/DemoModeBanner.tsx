// Persistent on-screen disclosure for the instructional-video demo
// environment. Gated ONLY by an explicit demo-only env var — never by
// NODE_ENV (a production build run locally still has NODE_ENV=production
// or "development" depending on how it's invoked, neither of which is a
// safe signal here). NEXT_PUBLIC_DEMO_MODE must never be set in
// .env.local, .env.staging.local, .env.staging.example, or any Vercel
// project environment — it exists only in .env.demo.local.
//
// Server component (no "use client") — this is static, non-interactive
// content, so no client-side JS is needed to render it.
const DEMO_MODE_ENABLED = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export default function DemoModeBanner() {
  if (!DEMO_MODE_ENABLED) return null;

  return (
    <div
      role="status"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 9999,
        background: "#B45309",
        color: "#FFFFFF",
        textAlign: "center",
        padding: "6px 12px",
        fontFamily: "'Barlow', sans-serif",
        fontWeight: 600,
        fontSize: "13px",
        letterSpacing: "0.02em",
      }}
    >
      ONP Demonstration — Fictional project and contractor data
    </div>
  );
}
