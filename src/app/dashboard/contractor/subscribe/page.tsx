import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createCheckoutSession, cancelSubscription } from "./actions";
import { isProfileComplete, profileMissingFields } from "@/lib/contractor/profileComplete";
import CouponInput from "./CouponInput";
import { SERVICE_AREA_LABEL } from "@/lib/serviceArea/launchZips";

export default async function ContractorSubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; canceled?: string; canceled_sub?: string }>;
}) {
  const sp = await searchParams;
  const { supabase, user } = await requireRole(["CONTRACTOR", "ADMIN"]);

  // Service area gate
  const { data: profileStatus } = await supabaseAdmin
    .from("profiles")
    .select("service_area_status, service_area_zip")
    .eq("id", user.id)
    .single();
  const isOutOfArea = profileStatus?.service_area_status === "OUT_OF_AREA";

  const { data: profile } = await supabase
    .from("contractor_profiles")
    .select("business_name, phone, categories, veteran_verified, directory_verified")
    .eq("contractor_id", user.id)
    .maybeSingle();

  const profileComplete = isProfileComplete(profile as any);
  const missingFields = profileMissingFields(profile as any);

  const { data: subscription } = await supabase
  .from("contractor_subscriptions")
  .select("status, plan_type, current_period_end, price_cents, plan_interval, cancel_at_period_end")
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
      case "ACTIVE": return { color: "#15803D", bg: "#F0FDF4", border: "#166534" };
      case "TRIALING": return { color: "var(--camo-gunmetal)", bg: "var(--camo-concrete)", border: "#d9dbdb" };
      case "PAST_DUE": return { color: "#92400E", bg: "#FFFBEB", border: "#FCD34D" };
      case "CANCELED": return { color: "#991B1B", bg: "#FEF2F2", border: "#FCA5A5" };
      case "EXPIRED": return { color: "var(--camo-gunmetal)", bg: "var(--camo-concrete)", border: "#d9dbdb" };
      default: return { color: "var(--camo-gunmetal)", bg: "var(--camo-concrete)", border: "#d9dbdb" };
    }
  }

  const colors = statusColor(subscription?.status ?? null);

  return (
    <div style={{ maxWidth: "600px" }}>
      {/* Header */}
      <div className="mob-col mob-gap-sm" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h1 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "36px",
            letterSpacing: "1px",
            color: "var(--camo-charcoal)",
            margin: 0,
          }}>
            Subscription
          </h1>
          <p style={{ fontSize: "13px", color: "var(--camo-gunmetal)", marginTop: "4px" }}>
            Manage your ONP bidding platform access
          </p>
        </div>
        <Link href="/dashboard/contractor" style={{
          background: "transparent",
          color: "var(--camo-gunmetal)",
          border: "1px solid #d9dbdb",
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
          background: "#F0FDF4",
          border: "1px solid #166534",
          color: "#15803D",
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
          background: "#FFFBEB",
          border: "1px solid #FCD34D",
          color: "#92400E",
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
          background: "#FEF2F2",
          border: "1px solid #FCA5A5",
          color: "#991B1B",
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
                color: "var(--camo-charcoal)",
                marginBottom: "4px",
              }}>
                {planLabel(subscription.plan_type)} Plan
              </div>
              <div style={{ fontSize: "13px", color: "var(--camo-gunmetal)" }}>
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
                <div style={{ fontSize: "12px", color: "var(--camo-gunmetal)" }}>
                  {subscription.status === "CANCELED" ? "Expires" : "Renews"}:{" "}
                  <span style={{ color: "var(--camo-charcoal)" }}>
                    {fmtDate(subscription.current_period_end)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Cancel button — only show if active and not already pending cancellation */}
          {hasActiveSub && !subscription.cancel_at_period_end && (
            <div style={{ marginTop: "20px", borderTop: "1px solid #d9dbdb", paddingTop: "16px" }}>
              <form action={cancelSubscription}>
                <button
                  type="submit"
                  style={{
                    background: "transparent",
                    color: "#991B1B",
                    border: "1px solid #FCA5A5",
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
              <div style={{ fontSize: "11px", color: "var(--camo-gunmetal)", marginTop: "8px" }}>
                You'll keep access until {fmtDate(subscription.current_period_end)}. No refunds for partial months.
              </div>
            </div>
          )}

          {/* Pending cancellation notice */}
          {hasActiveSub && subscription.cancel_at_period_end && (
            <div style={{ marginTop: "20px", borderTop: "1px solid #d9dbdb", paddingTop: "16px" }}>
              <div style={{
                padding: "12px 14px",
                background: "#FFFBEB",
                border: "1px solid #FCD34D",
                borderRadius: "8px",
                fontSize: "13px",
                color: "#92400E",
              }}>
                ⚠ Cancellation scheduled — you'll keep full access until{" "}
                <strong>{fmtDate(subscription.current_period_end)}</strong>.
              </div>
            </div>
          )}

          {/* Past due warning */}
          {subscription.status === "PAST_DUE" && (
            <div style={{
              marginTop: "14px",
              padding: "12px 14px",
              background: "#FFFBEB",
              border: "1px solid #FCD34D",
              borderRadius: "8px",
              fontSize: "13px",
              color: "#92400E",
            }}>
              ⚠ Your last payment failed. Please update your payment method in Stripe to restore access.
            </div>
          )}

          {/* Canceled warning */}
          {subscription.status === "CANCELED" && (
            <div style={{
              marginTop: "14px",
              padding: "12px 14px",
              background: "#FEF2F2",
              border: "1px solid #FCA5A5",
              borderRadius: "8px",
              fontSize: "13px",
              color: "#991B1B",
            }}>
              ✖ Your subscription has been canceled. Subscribe below to restore access.
            </div>
          )}
        </div>
      )}

      {/* Plans — show if no active sub AND profile is complete */}
      {!hasActiveSub && profileComplete && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Coupon code section */}
          <div style={{
            background: "var(--camo-concrete)",
            border: "1px solid #d9dbdb",
            borderRadius: "12px",
            padding: "16px 20px",
          }}>
            <div style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: "15px",
              letterSpacing: "1px",
              color: "var(--camo-charcoal)",
              textTransform: "uppercase",
              marginBottom: "8px",
            }}>
              Have a Coupon Code?
            </div>
            <p style={{ fontSize: "12px", color: "var(--camo-gunmetal)", marginBottom: "10px" }}>
              Enter your code below. It will be applied automatically when you click Subscribe.
            </p>
            <CouponInput />
          </div>

          {/* Standard plan */}
          <div style={{
            background: "var(--camo-concrete)",
            border: "1px solid #d9dbdb",
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
                  color: "var(--camo-charcoal)",
                  margin: 0,
                }}>
                  Standard
                </h2>
                <p style={{ fontSize: "13px", color: "var(--camo-gunmetal)", marginTop: "4px" }}>
                  Full access to ONP bidding platform
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 700,
                  fontSize: "36px",
                  color: "var(--camo-charcoal)",
                  lineHeight: 1,
                }}>
                  $200
                </div>
                <div style={{ fontSize: "12px", color: "var(--camo-gunmetal)" }}>per month</div>
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
                <div key={feature} style={{ fontSize: "13px", color: "var(--camo-gunmetal)" }}>
                  ✅ {feature}
                </div>
              ))}
            </div>
            <form action={createCheckoutSession.bind(null, "standard")}>
              <input type="hidden" name="coupon_code" defaultValue="" />
              <button type="submit" style={{
                width: "100%",
                background: "var(--camo-accent)",
                color: "var(--camo-ink)",
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
              background: "#FFF7ED",
              border: "2px solid #D97706",
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
                      color: "#B45309",
                      margin: 0,
                    }}>
                      Veteran
                    </h2>
                    <span style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "3px 8px",
                      borderRadius: "20px",
                      background: "#D97706",
                      color: "#FFFFFF",
                    }}>
                      ★ EXCLUSIVE
                    </span>
                  </div>
                  <p style={{ fontSize: "13px", color: "#D97706", marginTop: "4px" }}>
                    Everything in Standard — veteran discount applied
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 700,
                    fontSize: "36px",
                    color: "#B45309",
                    lineHeight: 1,
                  }}>
                    $150
                  </div>
                  <div style={{ fontSize: "12px", color: "#D97706" }}>per month</div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
                {[
                  "Everything in Standard",
                  "★ Veteran Owned badge on bids",
                  "★ Featured in contractor directory",
                  "25% discount vs Standard plan",
                ].map((feature) => (
                  <div key={feature} style={{ fontSize: "13px", color: "#B45309" }}>
                    ✅ {feature}
                  </div>
                ))}
              </div>
              <form action={createCheckoutSession.bind(null, "veteran")}>
                <input type="hidden" name="coupon_code" defaultValue="" />
                <button type="submit" style={{
                  width: "100%",
                  background: "#D97706",
                  color: "#FFFFFF",
                  border: "2px solid #B45309",
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
              background: "var(--camo-concrete)",
              border: "1px solid #d9dbdb",
              borderRadius: "12px",
              padding: "20px",
              opacity: 0.6,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <h2 style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 700,
                  fontSize: "24px",
                  color: "var(--camo-gunmetal)",
                  margin: 0,
                }}>
                  Veteran Plan — $150/month
                </h2>
              </div>
              <p style={{ fontSize: "13px", color: "var(--camo-gunmetal)", marginBottom: "12px" }}>
                This plan is exclusively for verified veteran-owned businesses.
              </p>
              <Link href="/dashboard/contractor/profile" style={{
                fontSize: "13px",
                color: "var(--camo-gunmetal)",
                textDecoration: "underline",
              }}>
                Apply for Veteran Owned Certification →
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Profile incomplete gate */}
      {!profileComplete && !hasActiveSub && (
        <div style={{
          background: "#FEF2F2",
          border: "1px solid #FCA5A5",
          borderRadius: "10px",
          padding: "20px 24px",
          marginBottom: "24px",
        }}>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "18px",
            letterSpacing: "1px",
            color: "#991B1B",
            marginBottom: "8px",
          }}>
            Complete Your Profile First
          </div>
          <p style={{ fontSize: "13px", color: "#991B1B", lineHeight: 1.6, marginBottom: "14px" }}>
            You must fill in your <strong>{missingFields.join(", ")}</strong> before subscribing.
          </p>
          <Link href="/dashboard/contractor/profile" style={{
            background: "var(--camo-accent)",
            color: "var(--camo-ink)",
            padding: "10px 20px",
            borderRadius: "6px",
            fontFamily: "'Barlow', sans-serif",
            fontWeight: 600,
            fontSize: "13px",
            textDecoration: "none",
            display: "inline-block",
          }}>
            Complete My Profile →
          </Link>
        </div>
      )}

      {/* Out-of-area gate — blocks subscription */}
      {isOutOfArea && (
        <div style={{
          background: "#FFFBEB",
          border: "1px solid #FCD34D",
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "24px",
        }}>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "20px",
            color: "#92400E",
            marginBottom: "10px",
          }}>
            📍 Outside our current service area
          </div>
          <p style={{ fontSize: "13px", color: "#92400E", lineHeight: 1.6, marginBottom: "12px" }}>
            Your business address ({profileStatus?.service_area_zip ?? "unknown ZIP"}) is outside our current service area.
            ONP is currently serving <strong>{SERVICE_AREA_LABEL}</strong> only. We can't activate your subscription until we expand to your area.
          </p>
          <p style={{ fontSize: "13px", color: "#92400E", lineHeight: 1.6, marginBottom: "16px" }}>
            If you operate in El Paso or Las Cruces but your business address is elsewhere,{" "}
            <a href="mailto:support@ournextproject.us" style={{ color: "#92400E", fontWeight: 600 }}>
              contact support
            </a>{" "}
            so we can verify your service area manually.
          </p>
          <Link
            href="/login#waitlist"
            style={{
              display: "inline-block",
              background: "#92400E",
              color: "#fff",
              padding: "9px 20px",
              borderRadius: "6px",
              fontFamily: "'Barlow', sans-serif",
              fontWeight: 600,
              fontSize: "13px",
              textDecoration: "none",
            }}
          >
            Join the Expansion Waitlist →
          </Link>
        </div>
      )}

      {/* Beta notice */}
      <div style={{
        background: "var(--camo-concrete)",
        border: "1px solid #d9dbdb",
        borderRadius: "8px",
        padding: "14px 16px",
        marginTop: "20px",
        fontSize: "12px",
        color: "var(--camo-gunmetal)",
        lineHeight: 1.6,
      }}>
        ⚠ Subscriptions are currently in test mode. No real charges will be made during beta testing. Use Stripe test card{" "}
        <strong style={{ color: "var(--camo-gunmetal)" }}>4242 4242 4242 4242</strong> to test.
      </div>
    </div>
  );
}
