import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { createCheckoutSession } from "./actions";

export default async function ContractorSubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; canceled?: string }>;
}) {
  const sp = await searchParams;
  const { supabase, user } = await requireRole(["CONTRACTOR", "ADMIN"]);

  // Check contractor profile
  const { data: profile } = await supabase
    .from("contractor_profiles")
    .select("business_name, veteran_verified, directory_verified")
    .eq("contractor_id", user.id)
    .maybeSingle();

  // Check existing subscription
  const { data: subscription } = await supabase
    .from("contractor_subscriptions")
    .select("status, plan_type, current_period_end")
    .eq("contractor_id", user.id)
    .maybeSingle();

  const isVeteran = profile?.veteran_verified ?? false;
  const hasActiveSub = subscription?.status === "active";

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
            Subscribe to access ONP bidding platform
          </p>
        </div>
        <Link
          href="/dashboard/contractor"
          style={{
            background: "transparent",
            color: "#7A9CC4",
            border: "1px solid #1B4F8A",
            padding: "8px 16px",
            borderRadius: "6px",
            fontFamily: "'Barlow', sans-serif",
            fontSize: "13px",
            textDecoration: "none",
          }}
        >
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

      {/* Canceled banner */}
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

      {/* Active subscription */}
      {hasActiveSub && (
        <div style={{
          background: "#0D3320",
          border: "1px solid #166534",
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "24px",
        }}>
          <h2 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "20px",
            letterSpacing: "1px",
            color: "#4ADE80",
            textTransform: "uppercase",
            marginBottom: "8px",
          }}>
            ✅ Active Subscription
          </h2>
          <div style={{ fontSize: "13px", color: "#B0C4DE", marginBottom: "4px" }}>
            Plan: <strong style={{ color: "#fff" }}>{subscription?.plan_type === "veteran" ? "Veteran ($150/mo)" : "Standard ($200/mo)"}</strong>
          </div>
          {subscription?.current_period_end && (
            <div style={{ fontSize: "13px", color: "#7A9CC4" }}>
              Renews: {new Date(subscription.current_period_end).toLocaleDateString()}
            </div>
          )}
        </div>
      )}

      {/* Plans */}
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
              <button
                type="submit"
                style={{
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
                }}
              >
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
                <button
                  type="submit"
                  style={{
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
                  }}
                >
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
              <Link
                href="/dashboard/contractor/profile"
                style={{
                  fontSize: "13px",
                  color: "#7A9CC4",
                  textDecoration: "underline",
                }}
              >
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
        ⚠ Subscriptions are currently in test mode. No real charges will be made during beta testing. Use Stripe test card <strong style={{ color: "#7A9CC4" }}>4242 4242 4242 4242</strong> to test.
      </div>
    </div>
  );
}