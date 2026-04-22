import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";

export default async function ClientDashboard() {
  const { user } = await requireRole(["CLIENT", "ADMIN"]);

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold">Client Dashboard</h1>
      <p className="mt-2 text-sm text-gray-600">Signed in as {user.email}</p>

      <div className="mt-6 flex gap-3">
        <Link className="rounded-md bg-black text-white px-3 py-2 text-sm" href="/dashboard/client/projects">
          My Draft Projects
        </Link>
        <Link className="rounded-md border px-3 py-2 text-sm" href="/dashboard/client/projects/new">
          New Draft
        </Link>
      </div>
    </main>
  );
}
