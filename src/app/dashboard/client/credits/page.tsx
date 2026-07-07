import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";

export default async function CreditsPage() {
  const { user } = await requireRole(["CLIENT", "ADMIN"]);

  const { data: allCredits } = await supabaseAdmin
    .from("client_credits")
    .select(
      "id, amount_cents, source, source_reference_id, status, expires_at, used_at, used_for_reference_id, created_at"
    )
    .eq("client_id", user.id)
    .order("created_at", { ascending: false });

  const available = (allCredits ?? []).filter((c: any) => c.status === "AVAILABLE");
  const used      = (allCredits ?? []).filter((c: any) => c.status === "USED");
  const totalAvailableCents = available.reduce(
    (sum: number, c: any) => sum + (c.amount_cents ?? 0),
    0
  );

  function fmt(cents: number) {
    if (cents % 100 === 0) return `$${cents / 100}`;
    return `$${(cents / 100).toFixed(2)}`;
  }

  function fmtSource(source: string) {
    return source
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (ch) => ch.toUpperCase());
  }

  function fmtDate(dateStr: string | null) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  const hasBalance = totalAvailableCents > 0;

  return (
    <div style={{ maxWidth: "680px" }}>
      {/* Header */}
      <div
        className="mob-col mob-gap-sm"
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "28px",
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: "36px",
              letterSpacing: "1px",
              color: "#1E3A8A",
              margin: 0,
            }}
          >
            My Credits
          </h1>
          <p style={{ fontSize: "13px", color: "#1B4F8A", marginTop: "4px" }}>
            Credits apply automatically at checkout toward inspections and emergency fees.
          </p>
        </div>
        <Link
          href="/dashboard/client"
          style={{
            background: "transparent",
            color: "#1B4F8A",
            border: "1px solid #B8D0E8",
            padding: "8px 16px",
            borderRadius: "6px",
            fontFamily: "'Barlow', sans-serif",
            fontSize: "13px",
            textDecoration: "none",
          }}
        >
          ← Dashboard
        </Link>
      </div>

      {/* Balance card */}
      <div
        style={{
          background: hasBalance ? "#1E3A8A" : "#EEF4FF",
          border: `1px solid ${hasBalance ? "#1B4F8A" : "#B8D0E8"}`,
          borderRadius: "12px",
          padding: "28px 24px",
          marginBottom: "28px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: "12px",
            letterSpacing: "2px",
            textTransform: "uppercase",
            color: hasBalance ? "#B8D0E8" : "#4A7FB5",
            marginBottom: "8px",
          }}
        >
          Available Balance
        </div>
        <div
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "60px",
            color: hasBalance ? "#FFFFFF" : "#1E3A8A",
            lineHeight: 1,
          }}
        >
          {fmt(totalAvailableCents)}
        </div>
        {!hasBalance && (
          <p
            style={{
              fontSize: "13px",
              color: "#4A7FB5",
              marginTop: "12px",
              lineHeight: 1.6,
            }}
          >
            Credits are issued when an upgrade dispute is resolved in your favor,
            or through ONP promotional offers.
          </p>
        )}
      </div>

      {/* Available credits list */}
      {available.length > 0 && (
        <div style={{ marginBottom: "32px" }}>
          <h2
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: "18px",
              letterSpacing: "1px",
              color: "#1E3A8A",
              textTransform: "uppercase",
              marginBottom: "12px",
            }}
          >
            Available Credits
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {available.map((c: any) => (
              <div
                key={c.id}
                className="mob-card-stack"
                style={{
                  background: "#EEF4FF",
                  border: "1px solid #B8D0E8",
                  borderRadius: "8px",
                  padding: "14px 18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "16px",
                }}
              >
                <div>
                  <div
                    style={{ fontWeight: 600, fontSize: "14px", color: "#1E3A8A" }}
                  >
                    {fmtSource(c.source)}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#4A7FB5",
                      marginTop: "2px",
                    }}
                  >
                    Issued {fmtDate(c.created_at)}
                    {c.expires_at ? ` · Expires ${fmtDate(c.expires_at)}` : ""}
                  </div>
                </div>
                <div
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 700,
                    fontSize: "22px",
                    color: "#15803D",
                    whiteSpace: "nowrap",
                  }}
                >
                  {fmt(c.amount_cents)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Used credits history */}
      {used.length > 0 && (
        <div>
          <h2
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: "18px",
              letterSpacing: "1px",
              color: "#1E3A8A",
              textTransform: "uppercase",
              marginBottom: "12px",
            }}
          >
            Credit History
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {used.map((c: any) => (
              <div
                key={c.id}
                className="mob-card-stack"
                style={{
                  background: "#F9FAFB",
                  border: "1px solid #E5E7EB",
                  borderRadius: "8px",
                  padding: "14px 18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "16px",
                }}
              >
                <div>
                  <div
                    style={{ fontWeight: 600, fontSize: "14px", color: "#6B7280" }}
                  >
                    {fmtSource(c.source)}{" "}
                    <span style={{ fontWeight: 400 }}>— Applied</span>
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#9CA3AF",
                      marginTop: "2px",
                    }}
                  >
                    Used {fmtDate(c.used_at)}
                  </div>
                </div>
                <div
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 700,
                    fontSize: "22px",
                    color: "#9CA3AF",
                    whiteSpace: "nowrap",
                  }}
                >
                  −{fmt(c.amount_cents)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {available.length === 0 && used.length === 0 && (
        <div
          style={{
            background: "#EEF4FF",
            border: "1px solid #B8D0E8",
            borderRadius: "10px",
            padding: "40px",
            textAlign: "center",
            color: "#1B4F8A",
            fontSize: "14px",
          }}
        >
          No credit history yet.
        </div>
      )}
    </div>
  );
}
