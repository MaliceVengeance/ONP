import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";

export default async function InspectorDashboard() {
  const { supabase, user } = await requireRole(["INSPECTOR", "ADMIN"]);

  const { data, error } = await supabase
    .from("project_inspector_assignments")
    .select("project_id, projects(id, title, category, city, state, deadline_at)")
    .eq("inspector_id", user.id)
    .limit(20);

  const assignments = (data ?? []) as any[];

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold">Inspector Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">Signed in as {user.email}</p>
      </div>

      {/* Quick stats */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-lg border-2 border-blue-200 p-4 text-center">
          <div className="text-2xl font-bold">{assignments.length}</div>
          <div className="text-xs text-gray-600 mt-1">Assigned Projects</div>
        </div>
        <div className="rounded-lg border-2 border-green-200 p-4 text-center">
          <div className="text-2xl font-bold">
            {assignments.filter((a) => a.projects?.state === "OPEN").length}
          </div>
          <div className="text-xs text-gray-600 mt-1">Active</div>
        </div>
      </div>

      {/* Assigned projects */}
      <div className="mt-8">
        <h2 className="font-semibold text-lg">Assigned Projects</h2>

        {error ? (
          <div className="mt-3 rounded-lg border p-4 text-sm text-red-700">
            Failed to load assignments.
          </div>
        ) : assignments.length === 0 ? (
          <div className="mt-3 rounded-lg border p-4 text-sm text-gray-600">
            No projects assigned yet.
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {assignments.map((a) => {
              const p = a.projects;
              if (!p) return null;
              return (
                <div key={a.project_id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-medium">{p.title ?? "Untitled"}</div>
                      <div className="text-sm text-gray-600">
                        {p.category ?? "—"} • {p.city ?? "—"}
                      </div>
                      {p.deadline_at && (
                        <div className="text-xs text-gray-500 mt-1">
                          Deadline: {new Date(p.deadline_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full border font-medium shrink-0 border-blue-300 text-blue-700">
                      {p.state}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}