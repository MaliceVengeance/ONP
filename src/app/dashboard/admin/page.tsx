import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";

export default async function AdminDashboard() {
  const { supabase, user } = await requireRole(["ADMIN"]);

  const [
    { count: userCount },
    { count: projectCount },
    { count: supportCount },
    { count: vetCount },
    { count: inspectorCount },
    { count: overrideCount },
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("projects").select("id", { count: "exact", head: true }),
    supabase.from("support_requests").select("id", { count: "exact", head: true }).eq("status", "OPEN"),
    supabase.from("contractor_profiles").select("id", { count: "exact", head: true }).eq("veteran_verified", false).not("veteran_applied_at", "is", null),
    supabase.from("project_inspector_assignments").select("id", { count: "exact", head: true }).eq("request_status", "PENDING"),
    supabase.from("projects").select("id", { count: "exact", head: true }).not("override_requested_at", "is", null).eq("urgent_override", false),
  ]);

  const cards = [
    {
      title: "Users",
      description: "View and manage all user accounts and roles.",
      href: "/dashboard/admin/users",
      stat: userCount ?? 0,
      statLabel: "total users",
      accent: "#1B4F8A",
    },
    {
      title: "Projects",
      description: "View all projects across all clients.",
      href: "/dashboard/admin/projects",
      stat: projectCount ?? 0,
      statLabel: "total projects",
      accent: "#1B4F8A",
    },
    {
      title: "Vet Certification",
      description: "Review and approve veteran-owned contractor applications.",
      href: "/dashboard/admin/vet-certification",
      stat: vetCount ?? 0,
      statLabel: "pending reviews",
      accent: (vetCount ?? 0) > 0 ? "#C8102E" : "#1B4F8A",
    },
    {
      title: "Support Requests",
      description: "Manage open support tickets from users.",
      href: "/dashboard/admin/support",
      stat: supportCount ?? 0,
      statLabel: "open tickets",
      accent: (supportCount ?? 0) > 0 ? "#C8102E" : "#1B4F8A",
    },
    {
      title: "Inspector Requests",
      description: "Assign inspectors to client takeoff requests.",
      href: "/dashboard/admin/inspector-requests",
      stat: inspectorCount ?? 0,
      statLabel: "pending",
      accent: (inspectorCount ?? 0) > 0 ? "#C8102E" : "#1B4F8A",
    },
    {
      title: "Override Requests",
      description: "Review and approve client deadline extension requests.",
      href: "/dashboard/admin/override-requests",
      stat: overrideCount ?? 0,
      statLabel: "pending",
      accent: (overrideCount ?? 0) > 0 ? "#C8102E" : "#1B4F8A",
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
          color: "#fff",
          margin: 0,
        }}>
          Admin Dashboard
        </h1>
        <p style={{ fontSize: "13px", color: "#7A9CC4", marginTop: "4px" }}>
          {user.email}
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
        {cards.map((card) => (
          <Link key={card.href} href={card.href} style={{ textDecoration: "none" }}>
            <div style={{
              background: "#0F2040",
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
                    color: "#fff",
                    marginBottom: "6px",
                  }}>
                    {card.title}
                  </div>
                  <div style={{ fontSize: "13px", color: "#7A9CC4", lineHeight: 1.5 }}>
                    {card.description}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 700,
                    fontSize: "40px",
                    color: card.accent === "#C8102E" ? "#C8102E" : "#fff",
                    lineHeight: 1,
                  }}>
                    {card.stat}
                  </div>
                  <div style={{
                    fontSize: "11px",
                    color: "#7A9CC4",
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
                borderTop: "1px solid #1B4F8A",
                fontSize: "12px",
                color: "#4A7FB5",
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