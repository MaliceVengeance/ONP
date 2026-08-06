import Link from "next/link";
import WaitlistForm from "@/components/WaitlistForm";

export default async function OutOfAreaPage({
  searchParams,
}: {
  searchParams: Promise<{ zip?: string; waitlist?: string; role?: string }>;
}) {
  const sp = await searchParams;
  const zip = sp.zip ?? "your area";

  // Reflects the real result of the waitlist enrollment attempt made during
  // signup — never assume success. "joined" is the only state where a
  // waitlist entry is actually confirmed to exist.
  const waitlistState: "joined" | "failed" | "unknown" =
    sp.waitlist === "joined" ? "joined" : sp.waitlist === "failed" ? "failed" : "unknown";

  const intendedRole: "CLIENT" | "CONTRACTOR" = sp.role === "CONTRACTOR" ? "CONTRACTOR" : "CLIENT";

  return (
    <main style={{
      minHeight: "100vh",
      background: "var(--camo-paper)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      fontFamily: "'Barlow', sans-serif",
    }}>
      <div style={{
        flex: 1,
        width: "100%",
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
        {/* Logo — doubles as back-to-homepage */}
        <Link href="/" style={{ textDecoration: "none", textAlign: "center" }}>
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

        {/* Welcome card */}
        <div style={{
          background: "var(--camo-concrete)",
          border: "1px solid #d9dbdb",
          borderRadius: "8px",
          padding: "32px",
        }}>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "28px",
            letterSpacing: "1px",
            color: "var(--camo-charcoal)",
            marginBottom: "16px",
            textTransform: "uppercase",
          }}>
            Welcome to <strong>ONP</strong>!
          </div>

          <div style={{
            background: "#FFFBEB",
            border: "1px solid #FCD34D",
            borderRadius: "6px",
            padding: "14px 16px",
            fontSize: "13px",
            color: "#92400E",
            lineHeight: 1.6,
            marginBottom: "20px",
          }}>
            <strong>Your ZIP ({zip}) is outside our current launch area</strong> — El Paso, TX and Las Cruces, NM.
            You can explore the platform, but you won&apos;t be able to post projects or activate a contractor subscription until we expand to your area.
          </div>

          {waitlistState === "joined" && (
            <p style={{ fontSize: "14px", color: "var(--camo-gunmetal)", lineHeight: 1.6, marginBottom: "20px" }}>
              You&apos;ve been added to our expansion waitlist — we&apos;ll email you when <strong>ONP</strong> launches near you.
              If you actually operate in El Paso or Las Cruces but your ZIP was entered incorrectly,{" "}
              <a href="mailto:support@ournextproject.us" style={{ color: "var(--camo-charcoal)", fontWeight: 600 }}>
                contact support
              </a>{" "}
              to have it corrected.
            </p>
          )}

          {waitlistState === "failed" && (
            <>
              <p style={{ fontSize: "14px", color: "var(--camo-gunmetal)", lineHeight: 1.6, marginBottom: "12px" }}>
                Your account was created, but we ran into a problem adding you to our expansion waitlist.
                You can try again below, or{" "}
                <a href="mailto:support@ournextproject.us" style={{ color: "var(--camo-charcoal)", fontWeight: 600 }}>
                  contact support
                </a>{" "}
                and we&apos;ll add you manually.
              </p>
              <div style={{ marginBottom: "20px" }}>
                <WaitlistForm
                  source="SIGNUP_BLOCKED"
                  intendedRole={intendedRole}
                  defaultZip={sp.zip}
                  lockZip={!!sp.zip}
                  theme="amber"
                />
              </div>
            </>
          )}

          {waitlistState === "unknown" && (
            <>
              <p style={{ fontSize: "14px", color: "var(--camo-gunmetal)", lineHeight: 1.6, marginBottom: "12px" }}>
                Your account was created, but we couldn&apos;t confirm whether you were added to our expansion waitlist.
                You can join below, or{" "}
                <a href="mailto:support@ournextproject.us" style={{ color: "var(--camo-charcoal)", fontWeight: 600 }}>
                  contact support
                </a>{" "}
                if you&apos;d like to confirm your status.
              </p>
              <div style={{ marginBottom: "20px" }}>
                <WaitlistForm
                  source="SIGNUP_BLOCKED"
                  intendedRole={intendedRole}
                  defaultZip={sp.zip}
                  lockZip={!!sp.zip}
                  theme="amber"
                />
              </div>
            </>
          )}

          <Link
            href="/dashboard"
            style={{
              display: "block",
              background: "var(--camo-accent)",
              color: "var(--camo-ink)",
              border: "none",
              padding: "12px",
              borderRadius: "4px",
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: "14px",
              letterSpacing: "0.5px",
              textDecoration: "none",
              textAlign: "center",
              textTransform: "uppercase",
            }}
          >
            Continue to Dashboard →
          </Link>
        </div>
      </div>
      </div>
    </main>
  );
}
