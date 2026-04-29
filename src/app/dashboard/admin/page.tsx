import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";

export default async function AdminDashboard() {
  const { supabase, user } = await requireRole(["ADMIN"]);

  // Quick stats
  const [
    { count: userCount },
    { count: projectCount },
    { count: supportCount },
    { count: vetCount },
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("projects").select("id", { count: "exact", head: true }),
    supabase
      .from("support_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "OPEN"),
    supabase
      .from("contractor_profiles")
      .select("id", { count: "exact", head: true })
      .eq("veteran_verified", false)
      .not("veteran_applied_at", "is", null),
  ]);

  const cards = [
    {
      title: "Users",
      description: "View and manage all user accounts and roles.",
      href: "/dashboard/admin/users",
      stat: userCount ?? 0,
      statLabel: "total users",
      color: "border-blue-200",
    },
    {
      title: "Projects",
      description: "View all projects across all clients.",
      href: "/dashboard/admin/projects",
      stat: projectCount ?? 0,
      statLabel: "total projects",
      color: "border-purple-200",
    },
    {
      title: "Vet Certification",
      description: "Review and approve veteran-owned contractor applications.",
      href: "/dashboard/admin/vet-certification",
      stat: vetCount ?? 0,
      statLabel: "pending reviews",
      color: "border-yellow-200",
    },
    {
      title: "Support Requests",
      description: "Manage open support tickets from users.",
      href: "/dashboard/admin/support",
      stat: supportCount ?? 0,
      statLabel: "open tickets",
      color: "border-red-200",
    },
  ];

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">Signed in as {user.email}</p>
      </div>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className={`block rounded-lg border-2 ${card.color} p-5 hover:bg-gray-50 transition`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-semibold text-lg">{card.title}</div>
                <div className="mt-1 text-sm text-gray-600">
                  {card.description}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-2xl font-bold">{card.stat}</div>
                <div className="text-xs text-gray-500">{card.statLabel}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}