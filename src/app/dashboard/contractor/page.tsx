import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";

type AwardedRow = {
  project_id: string;
  project_title: string | null;
  location_general: string | null;
  category: string | null;
  awarded_at: string;
};

export default async function ContractorDashboard() {
  const { supabase, user } = await requireRole(["CONTRACTOR", "ADMIN"]);

  const { data, error } = await supabase.rpc("list_my_awarded_projects");
  const awarded = (data ?? []) as AwardedRow[];

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Contractor Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">Signed in as {user.email}</p>
        </div>

        <form action="/auth/logout" method="post">
          <button className="rounded-md border px-3 py-2 text-sm">
            Sign out
          </button>
        </form>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          className="rounded-md bg-black text-white px-3 py-2 text-sm"
          href="/dashboard/contractor/projects"
        >
          View Open Projects
        </Link>

        <Link
          className="rounded-md border px-3 py-2 text-sm"
          href="/dashboard/contractor/bids"
        >
          My Active Bids
        </Link>

        <Link
  className="rounded-md border px-3 py-2 text-sm"
  href="/dashboard/contractor/profile"
>
  My Profile
</Link>

      </div>

      <div className="mt-10">
        <h2 className="text-lg font-semibold">Awarded Projects</h2>

        {error ? (
          <div className="mt-3 rounded-lg border p-4 text-sm text-red-700">
            Failed to load awarded projects: {JSON.stringify(error)}
          </div>
        ) : awarded.length === 0 ? (
          <div className="mt-3 rounded-lg border p-4 text-sm text-gray-600">
            No awarded projects yet.
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {awarded.map((p) => (
              <div key={p.project_id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-medium">
                      {p.project_title ?? "Untitled Project"}
                    </div>
                    <div className="text-sm text-gray-600">
                      {(p.category ?? "—") + " • " + (p.location_general ?? "—")}
                    </div>
                  </div>
                  <div className="text-sm text-green-700 font-medium">
                    ✅ You won
                  </div>
                </div>

                <div className="mt-2 text-sm text-gray-600">
                  Awarded: {new Date(p.awarded_at).toLocaleString()}
                </div>

                <div className="mt-3">
                  <Link
                    href={`/dashboard/contractor/projects/${p.project_id}`}
                    className="text-sm underline"
                  >
                    View project
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
