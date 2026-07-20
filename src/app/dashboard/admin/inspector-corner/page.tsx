import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";

export default async function InspectorCornerPage() {
  await requireRole(["ADMIN"]);

  const [
    { count: inspectorCount },
    { count: flaggedInspectorCount },
    { count: openDisputeCount },
    { count: masterInspectorCount },
  ] = await Promise.all([
    supabaseAdmin.from("project_inspector_assignments").select("id", { count: "exact", head: true }).eq("request_status", "PENDING"),
    supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).eq("upgrade_blocked", true).eq("role", "INSPECTOR"),
    supabaseAdmin.from("inspector_upgrade_disputes").select("id", { count: "exact", head: true }).in("status", ["SUBMITTED", "UNDER_REVIEW"]),
    supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).eq("is_master_inspector", true),
  ]);

  const cards = [
    {
      title: "Inspector Requests",
      description: "Assign inspectors to client takeoff requests.",
      href: "/dashboard/admin/inspector-requests",
      stat: inspectorCount ?? 0,
      statLabel: "pending",
      accent: (inspectorCount ?? 0) > 0 ? "var(--camo-accent)" : "var(--camo-gunmetal)",
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
      title: "Dispute Oversight",
      description: "Monitor all upgrade disputes, SLA status, and override resolved decisions.",
      href: "/dashboard/admin/disputes",
      stat: openDisputeCount ?? 0,
      statLabel: "open disputes",
      accent: (openDisputeCount ?? 0) > 0 ? "var(--camo-accent)" : "var(--camo-gunmetal)",
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
      title: "Inspector Revenue",
      description: "Monthly revenue, ONP share, and per-inspector earnings summary.",
      href: "/dashboard/admin/inspector-revenue",
      stat: null,
      statLabel: "revenue & stats",
      accent: "var(--camo-gunmetal)",
    },
  ];

  return (
    <div>
      <div className="mob-col mob-gap-sm" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "36px", letterSpacing: "1px", color: "var(--camo-charcoal)", margin: 0 }}>
            Inspector Corner
          </h1>
          <p style={{ fontSize: "13px", color: "var(--camo-gunmetal)", marginTop: "4px" }}>
            Requests, flags, disputes, Master Inspectors, and revenue for the inspector program.
          </p>
        </div>
        <Link href="/dashboard/admin" style={{ background: "transparent", color: "var(--camo-gunmetal)", border: "1px solid #d9dbdb", padding: "8px 16px", borderRadius: "6px", fontFamily: "'Barlow', sans-serif", fontSize: "13px", textDecoration: "none", flexShrink: 0 }}>
          Back
        </Link>
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
