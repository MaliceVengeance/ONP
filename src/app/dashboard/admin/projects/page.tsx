import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";

type Project = {
  id: string;
  title: string | null;
  category: string | null;
  state: string;
  city: string | null;
  created_at: string;
  deadline_at: string | null;
};

export default async function AdminProjectsPage() {
  const { supabase } = await requireRole(["ADMIN"]);

  const { data, error } = await supabase
    .from("projects")
    .select("id, title, category, state, city, created_at, deadline_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;

  const projects = (data ?? []) as Project[];

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">All Projects</h1>
        <Link href="/dashboard/admin" className="rounded-md border px-3 py-2 text-sm">
          Back
        </Link>
      </div>

      <div className="mt-6 space-y-3">
        {projects.length === 0 ? (
          <div className="rounded-lg border p-4 text-sm text-gray-600">
            No projects found.
          </div>
        ) : (
          projects.map((p) => (
            <div key={p.id} className="rounded-lg border p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-medium">{p.title ?? "Untitled"}</div>
                  <div className="text-sm text-gray-600">
                    {p.category ?? "—"} • {p.city ?? "—"}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Created: {new Date(p.created_at).toLocaleDateString()}
                    {p.deadline_at && (
                      <> • Deadline: {new Date(p.deadline_at).toLocaleDateString()}</>
                    )}
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full border font-medium shrink-0 ${stateColor(p.state)}`}>
                  {p.state}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}

function stateColor(state: string) {
  switch (state) {
    case "DRAFT": return "border-gray-300 text-gray-600";
    case "OPEN": return "border-green-300 text-green-700";
    case "BIDDING_CLOSED": return "border-yellow-300 text-yellow-700";
    case "BIDS_UNLOCKED": return "border-blue-300 text-blue-700";
    case "AWARDED": return "border-purple-300 text-purple-700";
    case "COMPLETED": return "border-emerald-300 text-emerald-700";
    case "CANCELED": return "border-red-300 text-red-700";
    default: return "border-gray-300 text-gray-600";
  }
}