import Link from "next/link";

export default async function OutOfAreaPage({
  searchParams,
}: {
  searchParams: Promise<{ zip?: string }>;
}) {
  const sp = await searchParams;
  const zip = sp.zip ?? "your area";

  return (
    <main style={{
      minHeight: "100vh",
      background: "#FFFFFF",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
    }}>
      <div style={{
        width: "100%",
        maxWidth: "480px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center" }}>
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
              <span>★</span> ONP <span>★</span>
            </span>
          </div>
        </div>

        {/* Welcome card */}
        <div style={{
          background: "#EEF4FF",
          border: "1px solid #B8D0E8",
          borderRadius: "12px",
          padding: "32px",
        }}>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "28px",
            letterSpacing: "1px",
            color: "#1E3A8A",
            marginBottom: "16px",
          }}>
            Welcome to ONP!
          </div>

          <div style={{
            background: "#FFFBEB",
            border: "1px solid #FCD34D",
            borderRadius: "8px",
            padding: "14px 16px",
            fontSize: "13px",
            color: "#92400E",
            lineHeight: 1.6,
            marginBottom: "20px",
          }}>
            <strong>Your ZIP ({zip}) is outside our current launch area</strong> — El Paso, TX and Las Cruces, NM.
            You can explore the platform, but you won't be able to post projects or activate a contractor subscription until we expand to your area.
          </div>

          <p style={{ fontSize: "14px", color: "#1B4F8A", lineHeight: 1.6, marginBottom: "20px" }}>
            We've automatically added you to our expansion waitlist — we'll notify you when ONP launches near you. If you operate in El Paso or Las Cruces, <Link href="/dashboard/client/profile" style={{ color: "#1E3A8A", fontWeight: 600 }}>update your ZIP in your profile</Link> to unlock full access.
          </p>

          <Link
            href="/dashboard"
            style={{
              display: "block",
              background: "#C8102E",
              color: "#fff",
              border: "none",
              padding: "12px",
              borderRadius: "6px",
              fontFamily: "'Barlow', sans-serif",
              fontWeight: 600,
              fontSize: "14px",
              letterSpacing: "0.5px",
              textDecoration: "none",
              textAlign: "center",
            }}
          >
            Continue to Dashboard →
          </Link>
        </div>
      </div>
    </main>
  );
}
