import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { redirect } from "next/navigation";



export default async function ClientProjectsPage() {
  const { supabase } = await requireRole(["CLIENT", "ADMIN"]);

  // You may want to filter only drafts; depends on your schema column name for state/status.
  const { data, error } = await supabase
    .from("projects")
    .select("id,title,category,city,state,created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;

  return (
    <main>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Projects</h1>
        <Link className="rounded-md bg-black text-white px-3 py-2 text-sm" href="/dashboard/client/projects/new">
          New Draft
        </Link>
      </div>

      <div className="mt-6 space-y-3">
        {(data ?? []).length === 0 ? (
          <div className="rounded-lg border p-4 text-sm text-gray-600">
            No projects yet. Create your first draft.
          </div>
        ) : (
          data!.map((p) => (
            <Link
              key={p.id}
              href={`/dashboard/client/projects/${p.id}`}
              className="block rounded-lg border p-4 hover:bg-gray-50"
            >
              <div className="font-medium">{p.title}</div>
              <div className="text-sm text-gray-600">
                {p.category} • {p.city}, {p.state}
              </div>
            </Link>
          ))
        )}
      </div>
    </main>
  );
}
