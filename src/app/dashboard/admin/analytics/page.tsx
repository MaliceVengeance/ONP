import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";
import AdminCharts from "./AdminCharts";

export default async function AdminAnalyticsPage() {
  const { supabase } = await requireRole(["ADMIN"]);

  // Fetch all the data we need
  const [
    { count: totalUsers },
    { count: totalClients },
    { count: totalContractors },
    { count: totalInspectors },
    { count: totalProjects },
    { count: totalBids },
    { count: openProjects },
    { count: awardedProjects },
    { count: pendingVerifications },
    { count: pendingVetCerts },
    { count: unansweredRfis },
    { count: pendingInspectors },
    { count: pendingOverrides },
    { data: bidVolumeData },
    { data: projectsData },
    { data: usersData },
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "CLIENT"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "CONTRACTOR"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "INSPECTOR"),
    supabase.from("projects").select("id", { count: "exact", head: true }),
    supabase.from("bids").select("id", { count: "exact", head: true }),
    supabase.from("projects").select("id", { count: "exact", head: true }).eq("state", "OPEN"),
    supabase.from("projects").select("id", { count: "exact", head: true }).eq("state", "AWARDED"),
    supabase.from("contractor_profiles").select("id", { count: "exact", head: true }).eq("directory_verified", false).not("license_number", "is", null),
    supabase.from("contractor_profiles").select("id", { count: "exact", head: true }).eq("veteran_verified", false).not("veteran_applied_at", "is", null),
    supabase.from("rfis").select("id", { count: "exact", head: true }).is("response", null),
    supabase.from("project_inspector_assignments").select("id", { count: "exact", head: true }).eq("request_status", "PENDING"),
    supabase.from("projects").select("id", { count: "exact", head: true }).not("override_requested_at", "is", null).eq("urgent_override", false),
    // Bid volume by month
    supabase.from("bid_versions").select("amount_cents, submitted_at").order("submitted_at", { ascending: true }),
    // Projects by month
    supabase.from("projects").select("created_at, state, published_at").order("created_at", { ascending: true }),
    // Users by week
    supabase.from("profiles").select("created_at, role").order("created_at", { ascending: true }),
  ]);

  // Process bid volume by month
  const bidsByMonth: Record<string, number> = {};
  (bidVolumeData ?? []).forEach((b: any) => {
    if (!b.submitted_at) return;
    const month = b.submitted_at.slice(0, 7); // YYYY-MM
    bidsByMonth[month] = (bidsByMonth[month] ?? 0) + Number(b.amount_cents);
  });

  const bidVolumeChartData = Object.entries(bidsByMonth)
    .slice(-12)
    .map(([month, cents]) => ({
      month: new Date(month + "-01").toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      volume: Math.round(cents / 100),
    }));

  // Process projects by month
  const projectsByMonth: Record<string, { created: number; awarded: number }> = {};
  (projectsData ?? []).forEach((p: any) => {
    if (!p.created_at) return;
    const month = p.created_at.slice(0, 7);
    if (!projectsByMonth[month]) projectsByMonth[month] = { created: 0, awarded: 0 };
    projectsByMonth[month].created++;
    if (p.state === "AWARDED") projectsByMonth[month].awarded++;
  });

  const projectsChartData = Object.entries(projectsByMonth)
    .slice(-12)
    .map(([month, data]) => ({
      month: new Date(month + "-01").toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      created: data.created,
      awarded: data.awarded,
    }));

  // Process users by week
  const usersByWeek: Record<string, { clients: number; contractors: number }> = {};
  (usersData ?? []).forEach((u: any) => {
    if (!u.created_at) return;
    const date = new Date(u.created_at);
    // Get week start (Monday)
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const weekStart = new Date(date.setDate(diff));
    const week = weekStart.toISOString().slice(0, 10);
    if (!usersByWeek[week]) usersByWeek[week] = { clients: 0, contractors: 0 };
    if (u.role === "CLIENT") usersByWeek[week].clients++;
    if (u.role === "CONTRACTOR") usersByWeek[week].contractors++;
  });

  const usersChartData = Object.entries(usersByWeek)
    .slice(-12)
    .map(([week, data]) => ({
      week: new Date(week).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      clients: data.clients,
      contractors: data.contractors,
    }));

  // Total bid volume
  const totalBidVolume = (bidVolumeData ?? []).reduce(
    (sum: number, b: any) => sum + Number(b.amount_cents), 0
  );

  const stats = {
    totalUsers: totalUsers ?? 0,
    totalClients: totalClients ?? 0,
    totalContractors: totalContractors ?? 0,
    totalInspectors: totalInspectors ?? 0,
    totalProjects: totalProjects ?? 0,
    totalBids: totalBids ?? 0,
    openProjects: openProjects ?? 0,
    awardedProjects: awardedProjects ?? 0,
    totalBidVolume,
    pendingVerifications: pendingVerifications ?? 0,
    pendingVetCerts: pendingVetCerts ?? 0,
    unansweredRfis: unansweredRfis ?? 0,
    pendingInspectors: pendingInspectors ?? 0,
    pendingOverrides: pendingOverrides ?? 0,
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
        <div>
          <h1 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "36px",
            letterSpacing: "1px",
            color: "#fff",
            margin: 0,
          }}>
            Analytics
          </h1>
          <p style={{ fontSize: "13px", color: "#7A9CC4", marginTop: "4px" }}>
            Platform overview and growth metrics
          </p>
        </div>
        <Link
          href="/dashboard/admin"
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

      {/* Platform Health */}
      {(stats.pendingVerifications + stats.pendingVetCerts + stats.unansweredRfis + stats.pendingInspectors + stats.pendingOverrides) > 0 && (
        <div style={{
          background: "#2D2000",
          border: "1px solid #92400E",
          borderRadius: "12px",
          padding: "16px 20px",
          marginBottom: "24px",
        }}>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "16px",
            letterSpacing: "1px",
            color: "#FBBF24",
            textTransform: "uppercase",
            marginBottom: "12px",
          }}>
            ⚠ Needs Attention
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            {stats.pendingVerifications > 0 && (
              <Link href="/dashboard/admin/vet-certification?tab=directory" style={{ textDecoration: "none" }}>
                <span style={{
                  fontSize: "12px",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  background: "#0A1628",
                  color: "#FBBF24",
                  border: "1px solid #92400E",
                  display: "block",
                }}>
                  {stats.pendingVerifications} directory verification{stats.pendingVerifications !== 1 ? "s" : ""} pending →
                </span>
              </Link>
            )}
            {stats.pendingVetCerts > 0 && (
              <Link href="/dashboard/admin/vet-certification?tab=veteran" style={{ textDecoration: "none" }}>
                <span style={{
                  fontSize: "12px",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  background: "#0A1628",
                  color: "#FBBF24",
                  border: "1px solid #92400E",
                  display: "block",
                }}>
                  {stats.pendingVetCerts} veteran cert{stats.pendingVetCerts !== 1 ? "s" : ""} pending →
                </span>
              </Link>
            )}
            {stats.unansweredRfis > 0 && (
              <span style={{
                fontSize: "12px",
                padding: "6px 12px",
                borderRadius: "6px",
                background: "#0A1628",
                color: "#FBBF24",
                border: "1px solid #92400E",
              }}>
                {stats.unansweredRfis} unanswered RFI{stats.unansweredRfis !== 1 ? "s" : ""}
              </span>
            )}
            {stats.pendingInspectors > 0 && (
              <Link href="/dashboard/admin/inspector-requests" style={{ textDecoration: "none" }}>
                <span style={{
                  fontSize: "12px",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  background: "#0A1628",
                  color: "#FBBF24",
                  border: "1px solid #92400E",
                  display: "block",
                }}>
                  {stats.pendingInspectors} inspector request{stats.pendingInspectors !== 1 ? "s" : ""} →
                </span>
              </Link>
            )}
            {stats.pendingOverrides > 0 && (
              <Link href="/dashboard/admin/override-requests" style={{ textDecoration: "none" }}>
                <span style={{
                  fontSize: "12px",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  background: "#0A1628",
                  color: "#FBBF24",
                  border: "1px solid #92400E",
                  display: "block",
                }}>
                  {stats.pendingOverrides} deadline override{stats.pendingOverrides !== 1 ? "s" : ""} →
                </span>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Key stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "24px" }}>
        {[
          { label: "Total Users", value: stats.totalUsers, sub: `${stats.totalClients} clients • ${stats.totalContractors} contractors • ${stats.totalInspectors} inspectors` },
          { label: "Total Projects", value: stats.totalProjects, sub: `${stats.openProjects} open • ${stats.awardedProjects} awarded` },
          { label: "Total Bids", value: stats.totalBids, sub: `Across all projects` },
        ].map((s) => (
          <div key={s.label} style={{
            background: "#0F2040",
            border: "1px solid #1B4F8A",
            borderRadius: "12px",
            padding: "20px",
          }}>
            <div style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: "40px",
              color: "#fff",
              lineHeight: 1,
              marginBottom: "4px",
            }}>
              {s.value.toLocaleString()}
            </div>
            <div style={{
              fontSize: "11px",
              color: "#7A9CC4",
              textTransform: "uppercase",
              letterSpacing: "1px",
              marginBottom: "6px",
            }}>
              {s.label}
            </div>
            <div style={{ fontSize: "11px", color: "#3A5A7A" }}>
              {s.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Bid volume card */}
      <div style={{
        background: "#0F2040",
        border: "1px solid #1B4F8A",
        borderRadius: "12px",
        padding: "20px",
        marginBottom: "24px",
      }}>
        <div style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: "14px",
          letterSpacing: "1px",
          color: "#7A9CC4",
          textTransform: "uppercase",
          marginBottom: "4px",
        }}>
          Total Bid Volume
        </div>
        <div style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: "48px",
          color: "#4ADE80",
          lineHeight: 1,
          marginBottom: "4px",
        }}>
          ${(stats.totalBidVolume / 100).toLocaleString("en-US", { minimumFractionDigits: 0 })}
        </div>
        <div style={{ fontSize: "12px", color: "#3A5A7A" }}>
          Total value of all bids submitted through ONP
        </div>
      </div>

      {/* Charts */}
      <AdminCharts
        bidVolumeData={bidVolumeChartData}
        projectsData={projectsChartData}
        usersData={usersChartData}
      />

      {/* Revenue placeholder */}
      <div style={{
        background: "#0F2040",
        border: "1px solid #1B4F8A",
        borderRadius: "12px",
        padding: "24px",
        marginTop: "24px",
      }}>
        <h2 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: "18px",
          letterSpacing: "1px",
          color: "#fff",
          textTransform: "uppercase",
          marginBottom: "8px",
        }}>
          Revenue Tracking
        </h2>
        <p style={{ fontSize: "13px", color: "#7A9CC4", marginBottom: "16px" }}>
          Coming soon — will track contractor subscriptions and inspector fees.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
          {[
            { label: "Standard Subscriptions", value: "—", note: "$200/mo per contractor" },
            { label: "Veteran Subscriptions", value: "—", note: "$150/mo per contractor" },
            { label: "Inspector Fees (ONP 50%)", value: "—", note: "Coming soon" },
          ].map((r) => (
            <div key={r.label} style={{
              background: "#0A1628",
              border: "1px solid #1B4F8A",
              borderRadius: "8px",
              padding: "16px",
              textAlign: "center",
            }}>
              <div style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: "28px",
                color: "#3A5A7A",
              }}>
                {r.value}
              </div>
              <div style={{ fontSize: "11px", color: "#7A9CC4", textTransform: "uppercase", letterSpacing: "1px", marginTop: "4px" }}>
                {r.label}
              </div>
              <div style={{ fontSize: "11px", color: "#3A5A7A", marginTop: "4px" }}>
                {r.note}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}