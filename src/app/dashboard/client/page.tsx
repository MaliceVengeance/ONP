import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";

type Project = {
  id: string;
  title: string | null;
  category: string | null;
  state: string;
  city: string | null;
  deadline_at: string | null;
  created_at: string;
};

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

export default async function ClientDashboard() {
  const { supabase, user } = await requireRole(["CLIENT", "ADMIN"]);

  const { data, error } = await supabase
    .from("projects")
    .select("id, title, category, state, city, deadline_at, created_at")
    .eq("client_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const projects = (data ?? []) as Project[];

  const drafts = projects.filter((p) => p.state === "DRAFT");
  const open = projects.filter((p) => p.state === "OPEN");
  const needsAction = projects.filter((p) =>
    ["BIDDING_CLOSED", "BIDS_UNLOCKED"].includes(p.state)
  );
  const awarded = projects.filter((p) => p.state === "AWARDED");

  return (
    <main className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Client Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">Signed in as {user.email}</p>
        </div>
        <Link
          href="/dashboard/client/projects/new"
          className="rounded-md bg-black text-white px-4 py-2 text-sm"
        >
          + New Project
        </Link>
      </div>

      {/* Quick stats */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Drafts", count: drafts.length, color: "border-gray-200" },
          { label: "Open", count: open.length, color: "border-green-200" },
          { label: "Needs Action", count: needsAction.length, color: "border-yellow-200" },
          { label: "Awarded", count: awarded.length, color: "border-purple-200" },
        ].map((s) => (
          <div key={s.label} className={`rounded-lg border-2 ${s.color} p-4 text-center`}>
            <div className="text-2xl font-bold">{s.count}</div>
            <div className="text-xs text-gray-600 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Needs action — show first if any */}
      {needsAction.length > 0 && (
        <div className="mt-8">
          <h2 className="font-semibold text-lg text-yellow-700">
            ⚠️ Needs Your Attention ({needsAction.length})
          </h2>
          <div className="mt-3 space-y-3">
            {needsAction.map((p) => (
              <ProjectCard key={p.id} p={p} />
            ))}
          </div>
        </div>
      )}

      {/* Recent projects */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">Recent Projects</h2>
          <Link
            href="/dashboard/client/projects"
            className="text-sm underline text-gray-600"
          >
            View all
          </Link>
        </div>

        {error ? (
          <div className="mt-3 rounded-lg border p-4 text-sm text-red-700">
            Failed to load projects.
          </div>
        ) : projects.length === 0 ? (
          <div className="mt-3 rounded-lg border p-4 text-sm text-gray-600">
            No projects yet.{" "}
            <Link href="/dashboard/client/projects/new" className="underline">
              Create your first project
            </Link>
            .
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {projects.map((p) => (
              <ProjectCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function ProjectCard({ p }: { p: Project }) {
  const deadline = p.deadline_at ? new Date(p.deadline_at) : null;
  const now = new Date();
  const deadlinePassed = !!deadline && deadline.getTime() <= now.getTime();
  const bidsUnlocked = deadlinePassed || !["DRAFT", "OPEN"].includes(p.state);

  return (
    <Link
      href={`/dashboard/client/projects/${p.id}`}
      className="block rounded-lg border p-4 hover:bg-gray-50 transition"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-medium">{p.title ?? "Untitled"}</div>
          <div className="text-sm text-gray-600">
            {p.category ?? "—"} • {p.city ?? "—"}
          </div>
          {deadline && (
            <div className={`text-xs mt-1 ${deadlinePassed ? "text-red-600" : "text-gray-500"}`}>
              {deadlinePassed ? "Deadline passed" : `Deadline: ${deadline.toLocaleDateString()}`}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className={`text-xs px-2 py-1 rounded-full border font-medium ${stateColor(p.state)}`}>
            {p.state}
          </span>
          {bidsUnlocked && p.state !== "DRAFT" && (
            <span className="text-xs text-green-700">✅ Bids unlocked</span>
          )}
        </div>
      </div>
    </Link>
  );
}