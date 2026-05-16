import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { createCheckoutSession, cancelSubscription } from "./actions";

export default async function ContractorSubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; canceled?: string; canceled_sub?: string }>;
}) {
  const sp = await searchParams;
  const { supabase, user } = await requireRole(["CONTRACTOR", "ADMIN"]);

  const { data: profile } = await supabase
    .from("contractor_profiles")
    .select("business_name, veteran_verified, directory_verified")
    .eq("contractor_id", user.id)
    .maybeSingle();

  const { data: subscription } = await supabase
    .from("contractor_subscriptions")
    .select("status, plan_type, current_period_end, price_cents, plan_interval")
    .eq("contractor_id", user.id)
    .maybeSingle();

  const isVeteran = profile?.veteran_verified ?? false;
  const hasActiveSub =
    subscription?.status === "ACTIVE" || subscription?.status === "TRIALING";

  function fmtDate(iso: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  function planLabel(planType: string | null) {
    if (planType === "veteran") return "Veteran";
    if (planType === "standard") return "Standard";
    return planType ?? "—";
  }

  function statusColor(status: string | null) {
    switch (status) {
      case "ACTIVE": return { color: "#4ADE80", bg: "#0D3320", border: "#166534" };
      case "TRIALING": return { color: "#60A5FA", bg: "#0D1F40", border: "#1B4F8A" };
      case "PAST_DUE": return { color: "#FBBF24", bg: "#2D2000", border: "#92400E" };
      case "CANCELED": return { color: "#F87171", bg: "#2D0A0A", border: "#7F1D1D" };
      case "EXPIRED": return { color: "#9CA3AF", bg: "#111827", border: "#374151" };
      default: return { color: "#7A9CC4", bg: "#0F2040", border: "#1B4F8A" };
    }
  }

  const colors = statusColor(subscription?.status ?? null);

  return (
    <div style={{ maxWidth: "600px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h1 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "36px",
            letterSpacing: "1px",
            color: "#fff",
            margin: 0,
          }}>
            Subscription
          </h1>
          <p style={{ fontSize: "13px", color: "#7A9CC4", marginTop: "4px" }}>
            Manage your ONP bidding platform access
          </p>
        </div>
        <Link href="/dashboard/contractor" style={{
          background: "transparent",
          color: "#7A9CC4",
          border: "1px solid #1B4F8A",
          padding: "8px 16px",
          borderRadius: "6px",
          fontFamily: "'Barlow', sans-serif",
          fontSize: "13px",
          textDecoration: "none",
        }}>
          Back
        </Link>
      </div>

      {/* Success banner */}
      {sp.success === "1" && (
        <div style={{
          background: "#0D3320",
          border: "1px solid #166534",
          color: "#4ADE80",
          padding: "14px 18px",
          borderRadius: "8px",
          fontSize: "13px",
          marginBottom: "20px",
        }}>
          ✅ Subscription activated successfully! Welcome to ONP.
        </div>
      )}

      {/* Checkout canceled banner */}
      {sp.canceled === "1" && (
        <div style={{
          background: "#2D2000",
          border: "1px solid #92400E",
          color: "#FBBF24",
          padding: "14px 18px",
          borderRadius: "8px",
          fontSize: "13px",
          marginBottom: "20px",
        }}>
          ⚠ Checkout was canceled. You can try again anytime.
        </div>
      )}

      {/* Subscription canceled banner */}
      {sp.canceled_sub === "1" && (
        <div style={{
          background: "#2D0A0A",
          border: "1px solid #7F1D1D",
          color: "#F87171",
          padding: "14px 18px",
          borderRadius: "8px",
          fontSize: "13px",
          marginBottom: "20px",
        }}>
          ✖ Your subscription has been canceled. You'll keep access until the end of your billing period.
        </div>
      )}

      {/* Current subscription status card */}
      {subscription && (
        <div style={{
          background: colors.bg,
          border: `1px solid ${colors.border}`,
          borderRadius: "12px",
          padding: "20px 24px",
          marginBottom: "24px",
        }}>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "13px",
            letterSpacing: "2px",
            textTransform: "uppercase",
            color: colors.color,
            marginBottom: "12px",
          }}>
            Current Subscription
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <div style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: "28px",
                color: "#fff",
                marginBottom: "4px",
              }}>
                {planLabel(subscription.plan_type)} Plan
              </div>
              <div style={{ fontSize: "13px", color: "#7A9CC4" }}>
                {subscription.price_cents
                  ? `$${(subscription.price_cents / 100).toFixed(0)}/month`
                  : "—"}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{
                display: "inline-block",
                fontSize: "12px",
                fontWeight: 700,
                padding: "5px 14px",
                borderRadius: "20px",
                background: colors.bg,
                color: colors.color,
                border: `1px solid ${colors.border}`,
                letterSpacing: "1px",
                marginBottom: "8px",
              }}>
                {subscription.status}
              </div>
              {subscription.current_period_end && (
                <div style={{ fontSize: "12px", color: "#7A9CC4" }}>
                  {subscription.status === "CANCELED" ? "Expires" : "Renews"}:{" "}
                  <span style={{ color: "#fff" }}>
                    {fmtDate(subscription.current_period_end)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Cancel button — only show if active */}
          {hasActiveSub && (
            <div style={{ marginTop: "20px", borderTop: "1px solid #1B4F8A", paddingTop: "16px" }}>
              <form action={cancelSubscription}>
                <button
                  type="submit"
                  style={{
                    background: "transparent",
                    color: "#F87171",
                    border: "1px solid #7F1D1D",
                    padding: "8px 18px",
                    borderRadius: "6px",
                    fontFamily: "'Barlow', sans-serif",
                    fontWeight: 600,
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  Cancel Subscription
                </button>
              </form>
              <div style={{ fontSize: "11px", color: "#3A5A7A", marginTop: "8px" }}>
                You'll keep access until {fmtDate(subscription.current_period_end)}. No refunds for partial months.
              </div>
            </div>
          )}

          {/* Past due warning */}
          {subscription.status === "PAST_DUE" && (
            <div style={{
              marginTop: "14px",
              padding: "12px 14px",
              background: "#1A1000",
              border: "1px solid #92400E",
              borderRadius: "8px",
              fontSize: "13px",
              color: "#FBBF24",
            }}>
              ⚠ Your last payment failed. Please update your payment method in Stripe to restore access.
            </div>
          )}

          {/* Canceled warning */}
          {subscription.status === "CANCELED" && (
            <div style={{
              marginTop: "14px",
              padding: "12px 14px",
              background: "#1A0000",
              border: "1px solid #7F1D1D",
              borderRadius: "8px",
              fontSize: "13px",
              color: "#F87171",
            }}>
              ✖ Your subscription has been canceled. Subscribe below to restore access.
            </div>
          )}
        </div>
      )}

      {/* Plans — show if no active sub */}
      {!hasActiveSub && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Standard plan */}
          <div style={{
            background: "#0F2040",
            border: "1px solid #1B4F8A",
            borderRadius: "12px",
            padding: "24px",
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px" }}>
              <div>
                <h2 style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 700,
                  fontSize: "24px",
                  letterSpacing: "1px",
                  color: "#fff",
                  margin: 0,
                }}>
                  Standard
                </h2>
                <p style={{ fontSize: "13px", color: "#7A9CC4", marginTop: "4px" }}>
                  Full access to ONP bidding platform
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 700,
                  fontSize: "36px",
                  color: "#fff",
                  lineHeight: 1,
                }}>
                  $200
                </div>
                <div style={{ fontSize: "12px", color: "#7A9CC4" }}>per month</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
              {[
                "Access to all open projects",
                "Unlimited bid submissions",
                "RFI communication system",
                "File downloads",
                "Bid history tracking",
              ].map((feature) => (
                <div key={feature} style={{ fontSize: "13px", color: "#B0C4DE" }}>
                  ✅ {feature}
                </div>
              ))}
            </div>
            <form action={createCheckoutSession.bind(null, "standard")}>
              <button type="submit" style={{
                width: "100%",
                background: "#C8102E",
                color: "#fff",
                border: "none",
                padding: "12px",
                borderRadius: "6px",
                fontFamily: "'Barlow', sans-serif",
                fontWeight: 600,
                fontSize: "14px",
                cursor: "pointer",
                letterSpacing: "0.5px",
              }}>
                Subscribe — $200/month
              </button>
            </form>
          </div>

          {/* Veteran plan */}
          {isVeteran ? (
            <div style={{
              background: "#1e1a00",
              border: "2px solid #92400E",
              borderRadius: "12px",
              padding: "24px",
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <h2 style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: 700,
                      fontSize: "24px",
                      letterSpacing: "1px",
                      color: "#FBBF24",
                      margin: 0,
                    }}>
                      Veteran
                    </h2>
                    <span style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "3px 8px",
                      borderRadius: "20px",
                      background: "#92400E",
                      color: "#FBBF24",
                    }}>
                      ★ EXCLUSIVE
                    </span>
                  </div>
                  <p style={{ fontSize: "13px", color: "#92400E", marginTop: "4px" }}>
                    Everything in Standard — veteran discount applied
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 700,
                    fontSize: "36px",
                    color: "#FBBF24",
                    lineHeight: 1,
                  }}>
                    $150
                  </div>
                  <div style={{ fontSize: "12px", color: "#92400E" }}>per month</div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
                {[
                  "Everything in Standard",
                  "★ Veteran Owned badge on bids",
                  "★ Featured in contractor directory",
                  "25% discount vs Standard plan",
                ].map((feature) => (
                  <div key={feature} style={{ fontSize: "13px", color: "#FBBF24" }}>
                    ✅ {feature}
                  </div>
                ))}
              </div>
              <form action={createCheckoutSession.bind(null, "veteran")}>
                <button type="submit" style={{
                  width: "100%",
                  background: "#92400E",
                  color: "#FBBF24",
                  border: "2px solid #FBBF24",
                  padding: "12px",
                  borderRadius: "6px",
                  fontFamily: "'Barlow', sans-serif",
                  fontWeight: 700,
                  fontSize: "14px",
                  cursor: "pointer",
                  letterSpacing: "0.5px",
                }}>
                  ★ Subscribe — $150/month
                </button>
              </form>
            </div>
          ) : (
            <div style={{
              background: "#0F2040",
              border: "1px solid #1B4F8A",
              borderRadius: "12px",
              padding: "20px",
              opacity: 0.6,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <h2 style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 700,
                  fontSize: "24px",
                  color: "#7A9CC4",
                  margin: 0,
                }}>
                  Veteran Plan — $150/month
                </h2>
              </div>
              <p style={{ fontSize: "13px", color: "#3A5A7A", marginBottom: "12px" }}>
                This plan is exclusively for verified veteran-owned businesses.
              </p>
              <Link href="/dashboard/contractor/profile" style={{
                fontSize: "13px",
                color: "#7A9CC4",
                textDecoration: "underline",
              }}>
                Apply for Veteran Owned Certification →
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Beta notice */}
      <div style={{
        background: "#0A1628",
        border: "1px solid #1B4F8A",
        borderRadius: "8px",
        padding: "14px 16px",
        marginTop: "20px",
        fontSize: "12px",
        color: "#3A5A7A",
        lineHeight: 1.6,
      }}>
        ⚠ Subscriptions are currently in test mode. No real charges will be made during beta testing. Use Stripe test card{" "}
        <strong style={{ color: "#7A9CC4" }}>4242 4242 4242 4242</strong> to test.
      </div>
    </div>
  );
}