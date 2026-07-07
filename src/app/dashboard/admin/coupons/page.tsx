import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createCoupon, deactivateCoupon, reactivateCoupon } from "./actions";

export default async function AdminCouponsPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; error?: string }>;
}) {
  await requireRole(["ADMIN"]);
  const sp = await searchParams;

  const { data: coupons } = await supabaseAdmin
    .from("coupon_codes")
    .select("id, code, months_free, description, is_active, created_at")
    .order("created_at", { ascending: false });

  const rows = (coupons ?? []) as {
    id: string;
    code: string;
    months_free: number;
    description: string | null;
    is_active: boolean;
    created_at: string;
  }[];

  const inputStyle = {
    width: "100%",
    background: "#FFFFFF",
    border: "1px solid #B8D0E8",
    color: "#1E3A8A",
    borderRadius: "6px",
    padding: "10px 14px",
    fontFamily: "'Barlow', sans-serif",
    fontSize: "14px",
    outline: "none",
    marginTop: "6px",
  } as React.CSSProperties;

  const labelStyle = {
    display: "block",
    fontSize: "11px",
    fontWeight: 500,
    color: "#1B4F8A",
    textTransform: "uppercase" as const,
    letterSpacing: "1px",
    marginTop: "16px",
  };

  return (
    <div style={{ maxWidth: "700px" }}>
      {/* Header */}
      <div className="mob-col mob-gap-sm" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h1 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "36px",
            letterSpacing: "1px",
            color: "#1E3A8A",
            margin: 0,
          }}>
            Coupon Codes
          </h1>
          <p style={{ fontSize: "13px", color: "#1B4F8A", marginTop: "4px" }}>
            Generate codes that give contractors a set number of free months.
          </p>
        </div>
        <Link href="/dashboard/admin" style={{
          background: "transparent",
          color: "#1B4F8A",
          border: "1px solid #B8D0E8",
          padding: "8px 16px",
          borderRadius: "6px",
          fontFamily: "'Barlow', sans-serif",
          fontSize: "13px",
          textDecoration: "none",
        }}>
          Back
        </Link>
      </div>

      {/* Success / error banners */}
      {sp.created === "1" && (
        <div style={{ background: "#F0FDF4", border: "1px solid #166534", color: "#15803D", padding: "12px 16px", borderRadius: "8px", fontSize: "13px", marginBottom: "20px" }}>
          ✅ Coupon created successfully.
        </div>
      )}
      {sp.error && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", color: "#991B1B", padding: "12px 16px", borderRadius: "8px", fontSize: "13px", marginBottom: "20px" }}>
          ❌ {decodeURIComponent(sp.error)}
        </div>
      )}

      {/* Create form */}
      <div style={{
        background: "#EEF4FF",
        border: "1px solid #B8D0E8",
        borderRadius: "12px",
        padding: "24px",
        marginBottom: "32px",
      }}>
        <h2 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: "20px",
          letterSpacing: "1px",
          color: "#1E3A8A",
          textTransform: "uppercase",
          marginBottom: "4px",
        }}>
          Create New Coupon
        </h2>
        <p style={{ fontSize: "12px", color: "#1B4F8A", marginBottom: "8px" }}>
          Creates a 100%-off Stripe coupon for the specified number of months. Contractors enter the code at checkout.
        </p>

        <form action={createCoupon}>
          <div className="mob-grid-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ ...labelStyle, marginTop: 0 }}>
                Coupon Code <span style={{ color: "#C8102E" }}>*</span>
              </label>
              <input
                name="code"
                style={inputStyle}
                placeholder="e.g. WELCOME3"
                required
                maxLength={30}
              />
              <p style={{ fontSize: "11px", color: "#4A7FB5", marginTop: "4px" }}>
                Letters, numbers, hyphens, underscores. Will be uppercased.
              </p>
            </div>
            <div>
              <label style={{ ...labelStyle, marginTop: 0 }}>
                Months Free <span style={{ color: "#C8102E" }}>*</span>
              </label>
              <input
                name="months_free"
                type="number"
                min={1}
                max={24}
                style={inputStyle}
                placeholder="e.g. 3"
                required
              />
              <p style={{ fontSize: "11px", color: "#4A7FB5", marginTop: "4px" }}>
                1–24 months of 100% off.
              </p>
            </div>
          </div>

          <label style={labelStyle}>Description (optional)</label>
          <input
            name="description"
            style={inputStyle}
            placeholder="e.g. Beta tester reward — 3 months free"
          />

          <button
            type="submit"
            style={{
              marginTop: "20px",
              background: "#C8102E",
              color: "#fff",
              border: "none",
              padding: "11px 28px",
              borderRadius: "6px",
              fontFamily: "'Barlow', sans-serif",
              fontWeight: 600,
              fontSize: "14px",
              cursor: "pointer",
              letterSpacing: "0.5px",
            }}
          >
            Create Coupon
          </button>
        </form>
      </div>

      {/* Existing coupons */}
      <h2 style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontWeight: 700,
        fontSize: "20px",
        letterSpacing: "1px",
        color: "#1E3A8A",
        textTransform: "uppercase",
        marginBottom: "14px",
      }}>
        All Coupons ({rows.length})
      </h2>

      {rows.length === 0 ? (
        <div style={{ background: "#EEF4FF", border: "1px solid #B8D0E8", borderRadius: "10px", padding: "24px", textAlign: "center", color: "#1B4F8A", fontSize: "14px" }}>
          No coupons created yet.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {rows.map((c) => (
            <div key={c.id} className="mob-card-stack" style={{
              background: c.is_active ? "#EEF4FF" : "#F8F8F8",
              border: `1px solid ${c.is_active ? "#B8D0E8" : "#D1D5DB"}`,
              borderRadius: "10px",
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "16px",
              opacity: c.is_active ? 1 : 0.65,
            }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                  <span style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 700,
                    fontSize: "20px",
                    letterSpacing: "2px",
                    color: "#1E3A8A",
                  }}>
                    {c.code}
                  </span>
                  <span style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "3px 10px",
                    borderRadius: "20px",
                    background: c.is_active ? "#F0FDF4" : "#FEF2F2",
                    color: c.is_active ? "#15803D" : "#991B1B",
                    border: `1px solid ${c.is_active ? "#166534" : "#FCA5A5"}`,
                  }}>
                    {c.is_active ? "ACTIVE" : "INACTIVE"}
                  </span>
                </div>
                <div style={{ fontSize: "13px", color: "#1B4F8A" }}>
                  {c.months_free} month{c.months_free !== 1 ? "s" : ""} free
                  {c.description ? ` — ${c.description}` : ""}
                </div>
                <div style={{ fontSize: "11px", color: "#4A7FB5", marginTop: "2px" }}>
                  Created {new Date(c.created_at).toLocaleDateString()}
                </div>
              </div>

              <div style={{ flexShrink: 0 }}>
                {c.is_active ? (
                  <form action={deactivateCoupon.bind(null, c.id)}>
                    <button type="submit" style={{
                      background: "transparent",
                      color: "#991B1B",
                      border: "1px solid #FCA5A5",
                      padding: "7px 16px",
                      borderRadius: "6px",
                      fontFamily: "'Barlow', sans-serif",
                      fontWeight: 600,
                      fontSize: "12px",
                      cursor: "pointer",
                    }}>
                      Deactivate
                    </button>
                  </form>
                ) : (
                  <form action={reactivateCoupon.bind(null, c.id)}>
                    <button type="submit" style={{
                      background: "transparent",
                      color: "#15803D",
                      border: "1px solid #166534",
                      padding: "7px 16px",
                      borderRadius: "6px",
                      fontFamily: "'Barlow', sans-serif",
                      fontWeight: 600,
                      fontSize: "12px",
                      cursor: "pointer",
                    }}>
                      Reactivate
                    </button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
