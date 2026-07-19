import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getFeatureFlag, FLAGS } from "@/lib/featureFlags";

export default async function AdminDashboard() {
  const { user } = await requireRole(["ADMIN"]);

  const [
    { count: userCount },
    { count: projectCount },
    { count: supportCount },
    { count: vetCount },
    { count: inspectorCount },
    { count: overrideCount },
    { count: emergencyActiveCount },
    { count: openDisputeCount },
    { count: masterInspectorCount },
    { count: flaggedInspectorCount },
    { count: waitlistCount },
    { count: credCount },
    { data: dirCandidates },
  ] = await Promise.all([
    supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("projects").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("support_requests").select("id", { count: "exact", head: true }).eq("status", "OPEN"),
    supabaseAdmin.from("contractor_profiles").select("id", { count: "exact", head: true }).eq("veteran_verified", false).not("veteran_applied_at", "is", null),
    supabaseAdmin.from("project_inspector_assignments").select("id", { count: "exact", head: true }).eq("request_status", "PENDING"),
    supabaseAdmin.from("projects").select("id", { count: "exact", head: true }).not("override_requested_at", "is", null).eq("urgent_override", false),
    supabaseAdmin.from("emergency_request_log").select("id", { count: "exact", head: true }).eq("payment_status", "PAID").is("closed_at", null),
    supabaseAdmin.from("inspector_upgrade_disputes").select("id", { count: "exact", head: true }).in("status", ["SUBMITTED", "UNDER_REVIEW"]),
    supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).eq("is_master_inspector", true),
    supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).eq("upgrade_blocked", true).eq("role", "INSPECTOR"),
    supabaseAdmin.from("service_area_waitlist").select("id", { count: "exact", head: true }).is("notified_at", null),
    supabaseAdmin.from("contractor_credentials").select("id", { count: "exact", head: true }).eq("verified", false),
    // Directory pending has no simple column filter (mirrors contractor-verification page's
    // JS-side logic: not yet verified, listed, and has submitted license or COI info).
    supabaseAdmin.from("contractor_profiles").select("directory_verified, is_listed, license_number, coi_provider"),
  ]);

  const dirPendingCount = (dirCandidates ?? []).filter(
    (p) => !p.directory_verified && p.is_listed && (p.license_number || p.coi_provider)
  ).length;

  const inspectorFeatureEnabled = await getFeatureFlag(FLAGS.INSPECTOR_ENABLED);

  const cards = [
    {
      title: "Users",
      description: "View and manage all user accounts and roles.",
      href: "/dashboard/admin/users",
      stat: userCount ?? 0,
      statLabel: "total users",
      accent: "var(--camo-gunmetal)",
    },
    {
      title: "Projects",
      description: "View all projects across all clients.",
      href: "/dashboard/admin/projects",
      stat: projectCount ?? 0,
      statLabel: "total projects",
      accent: "var(--camo-gunmetal)",
    },
    {
      title: "Vet Certification",
      description: "Review and approve veteran-owned contractor applications.",
      href: "/dashboard/admin/vet-certification",
      stat: vetCount ?? 0,
      statLabel: "pending reviews",
      accent: (vetCount ?? 0) > 0 ? "var(--camo-accent)" : "var(--camo-gunmetal)",
    },
    {
      title: "Contractor Verification",
      description: "Directory (license & insurance) and licenses/bonding review for contractors.",
      href: "/dashboard/admin/contractor-verification",
      stat: dirPendingCount + (credCount ?? 0),
      statLabel: "pending reviews",
      accent: dirPendingCount + (credCount ?? 0) > 0 ? "var(--camo-accent)" : "var(--camo-gunmetal)",
    },
    {
      title: "Support Requests",
      description: "Manage open support tickets from users.",
      href: "/dashboard/admin/support",
      stat: supportCount ?? 0,
      statLabel: "open tickets",
      accent: (supportCount ?? 0) > 0 ? "var(--camo-accent)" : "var(--camo-gunmetal)",
    },
    {
      title: "Inspector Requests",
      description: "Assign inspectors to client takeoff requests.",
      href: "/dashboard/admin/inspector-requests",
      stat: inspectorCount ?? 0,
      statLabel: "pending",
      accent: (inspectorCount ?? 0) > 0 ? "var(--camo-accent)" : "var(--camo-gunmetal)",
    },
    {
      title: "Override Requests",
      description: "Review and approve client deadline extension requests.",
      href: "/dashboard/admin/override-requests",
      stat: overrideCount ?? 0,
      statLabel: "pending",
      accent: (overrideCount ?? 0) > 0 ? "var(--camo-accent)" : "var(--camo-gunmetal)",
    },
    {
      title: "Emergency Requests",
      description: "Monitor paid emergency bids, grant bonus slots, unsuspend disputed clients.",
      href: "/dashboard/admin/emergency-requests",
      stat: emergencyActiveCount ?? 0,
      statLabel: "active now",
      accent: (emergencyActiveCount ?? 0) > 0 ? "#C2410C" : "var(--camo-gunmetal)",
    },
    {
      title: "Analytics",
      description: "Platform growth, bid volume, and activity metrics.",
      href: "/dashboard/admin/analytics",
      stat: projectCount ?? 0,
      statLabel: "total projects",
      accent: "var(--camo-gunmetal)",
    },
    {
      title: "Inspector Pricing",
      description: "Edit inspection fees, inspector share %, and active tiers.",
      href: "/dashboard/admin/inspector-pricing",
      stat: null,
      statLabel: "pricing tiers",
      accent: "var(--camo-gunmetal)",
    },
    {
      title: "Inspector Revenue",
      description: "Monthly revenue, ONP share, and per-inspector earnings summary.",
      href: "/dashboard/admin/inspector-revenue",
      stat: null,
      statLabel: "revenue & stats",
      accent: "var(--camo-gunmetal)",
    },
    {
      title: "Master Inspectors",
      description: "Promote or demote inspectors to the Master Inspector role for dispute reviews.",
      href: "/dashboard/admin/master-inspectors",
      stat: masterInspectorCount ?? 0,
      statLabel: "active MIs",
      accent: "var(--camo-gunmetal)",
    },
    {
      title: "Dispute Oversight",
      description: "Monitor all upgrade disputes, SLA status, and override resolved decisions.",
      href: "/dashboard/admin/disputes",
      stat: openDisputeCount ?? 0,
      statLabel: "open disputes",
      accent: (openDisputeCount ?? 0) > 0 ? "var(--camo-accent)" : "var(--camo-gunmetal)",
    },
    {
      title: "Inspector Flags",
      description: "Rate-based flag dashboard. Block or clear inspectors with high dispute rates.",
      href: "/dashboard/admin/inspector-flags",
      stat: flaggedInspectorCount ?? 0,
      statLabel: "blocked inspectors",
      accent: (flaggedInspectorCount ?? 0) > 0 ? "var(--camo-accent)" : "var(--camo-gunmetal)",
    },
    {
      title: "Expansion Waitlist",
      description: "View and notify users waiting for ONP to expand to their area.",
      href: "/dashboard/admin/waitlist",
      stat: waitlistCount ?? 0,
      statLabel: "unnotified",
      accent: (waitlistCount ?? 0) > 0 ? "#C2410C" : "var(--camo-gunmetal)",
    },
    {
      title: "Coupon Codes",
      description: "Generate free-month promo codes for contractors. Codes are created directly in Stripe.",
      href: "/dashboard/admin/coupons",
      stat: null,
      statLabel: "promo codes",
      accent: "var(--camo-gunmetal)",
    },
    {
      title: "Platform Settings",
      description: `Feature flags & toggles. Inspector feature is currently ${inspectorFeatureEnabled ? "ON" : "OFF"}.`,
      href: "/dashboard/admin/settings",
      stat: null,
      statLabel: inspectorFeatureEnabled ? "inspector ON" : "inspector OFF",
      accent: inspectorFeatureEnabled ? "var(--camo-gunmetal)" : "var(--camo-accent)",
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: "36px",
          letterSpacing: "1px",
          color: "var(--camo-charcoal)",
          margin: 0,
        }}>
          Admin Dashboard
        </h1>
        <p style={{ fontSize: "13px", color: "var(--camo-gunmetal)", marginTop: "4px" }}>
          {user.email}
        </p>
      </div>

      <div className="mob-grid-1" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
        {cards.map((card) => (
          <Link key={card.href} href={card.href} style={{ textDecoration: "none" }}>
            <div style={{
              background: "var(--camo-concrete)",
              border: `1px solid ${card.accent}`,
              borderRadius: "12px",
              padding: "24px",
              cursor: "pointer",
              height: "100%",
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
                <div>
                  <div style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 700,
                    fontSize: "22px",
                    letterSpacing: "0.5px",
                    color: "var(--camo-charcoal)",
                    marginBottom: "6px",
                  }}>
                    {card.title}
                  </div>
                  <div style={{ fontSize: "13px", color: "var(--camo-gunmetal)", lineHeight: 1.5 }}>
                    {card.description}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 700,
                    fontSize: "40px",
                    color: card.accent === "var(--camo-accent)" ? "var(--camo-accent)" : "var(--camo-charcoal)",
                    lineHeight: 1,
                  }}>
                    {card.stat ?? "—"}
                  </div>
                  <div style={{
                    fontSize: "11px",
                    color: "var(--camo-gunmetal)",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    marginTop: "4px",
                  }}>
                    {card.statLabel}
                  </div>
                </div>
              </div>
              <div style={{
                marginTop: "16px",
                paddingTop: "16px",
                borderTop: "1px solid #d9dbdb",
                fontSize: "12px",
                color: "var(--camo-gunmetal)",
              }}>
                View {card.title} →
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
