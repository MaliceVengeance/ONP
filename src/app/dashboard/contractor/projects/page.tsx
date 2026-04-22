import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";

type OpenProject = {
  id: string;
  title: string | null;
  category: string | null;
  location_general: string | null;
  description: string | null;
  published_at: string | null;
  deadline_at: string | null;
  min_open_days: number | null;
  max_open_days: number | null;
};

function fmt(dt: string | null) {
  if (!dt) return "—";
  return new Date(dt).toLocaleString();
}

export default async function ContractorOpenProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const { supabase } = await requireRole(["CONTRACTOR", "ADMIN"]);
  const sp = await searchParams;

  const sort = sp.sort === "newest" ? "newest" : "deadline";

  const { data, error } = await supabase.rpc("list_open_projects", {
    p_sort: sort,
  });

  if (error) {
    throw new Error(`RPC list_open_projects failed: ${JSON.stringify(error)}`);
  }

  const projects = (data ?? []) as OpenProject[];

  return (
    <main>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Open Projects</h1>

        <div className="flex gap-2">
          <Link
            href="/dashboard/contractor/projects?sort=deadline"
            className={`rounded-md border px-3 py-2 text-sm ${
              sort === "deadline" ? "bg-gray-50" : ""
            }`}
          >
            Sort: Deadline
          </Link>
          <Link
            href="/dashboard/contractor/projects?sort=newest"
            className={`rounded-md border px-3 py-2 text-sm ${
              sort === "newest" ? "bg-gray-50" : ""
            }`}
          >
            Sort: Newest
          </Link>
        </div>
      </div>

      <p className="mt-2 text-sm text-gray-600">
        Client identities and exact addresses are hidden. Only general location
        is shown.
      </p>

      <div className="mt-6 space-y-3">
        {projects.length === 0 ? (
          <div className="rounded-lg border p-4 text-sm text-gray-600">
            No open projects at the moment.
          </div>
        ) : (
          projects.map((p) => (
            <Link
              key={p.id}
              href={`/dashboard/contractor/projects/${p.id}`}
              className="block rounded-lg border p-4 hover:bg-gray-50"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-medium">
                    {p.title ?? "Untitled Project"}
                  </div>
                  <div className="text-sm text-gray-600">
                    {p.category ?? "—"} • {p.location_general ?? "—"}
                  </div>
                </div>

                <div className="text-sm text-gray-600 text-right">
                  <div>
                    <span className="font-medium">Deadline:</span>{" "}
                    {fmt(p.deadline_at)}
                  </div>
                  <div>
                    <span className="font-medium">Published:</span>{" "}
                    {fmt(p.published_at)}
                  </div>
                </div>
              </div>

              {p.description && (
                <p className="mt-3 text-sm text-gray-700 line-clamp-3">
                  {p.description}
                </p>
              )}
            </Link>
          ))
        )}
      </div>
    </main>
  );
}
