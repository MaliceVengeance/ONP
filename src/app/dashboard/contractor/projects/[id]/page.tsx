import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { submitBid } from "@/app/dashboard/contractor/bids/actions";

export default async function ContractorProjectDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { supabase } = await requireRole(["CONTRACTOR", "ADMIN"]);
  const { id: projectId } = await params;

  // With the new RLS policy, this will work for:
  // - OPEN projects (via your open-project flow/RPC)
  // - AWARDED projects where the logged-in contractor is the winner
  const { data: project, error: pErr } = await supabase
    .from("projects")
    .select("id,title,description,category,location_general,state,deadline_at,created_at,updated_at")
    .eq("id", projectId)
    .single();

  if (pErr || !project) {
    return (
      <main className="max-w-3xl p-6">
        <h1 className="text-2xl font-semibold">Project not found</h1>
        <div className="mt-4 rounded-lg border p-4 text-sm text-gray-700">
          It may be closed, unpublished, or you may not have access.
        </div>
        <div className="mt-4">
          <Link className="underline text-sm" href="/dashboard/contractor/projects">
            Back to Open Projects
          </Link>
        </div>
      </main>
    );
  }

  const deadline = project.deadline_at ? new Date(project.deadline_at) : null;
  const now = new Date();
  const isOpen = project.state === "OPEN";
  const beforeDeadline = !!deadline && deadline.getTime() > now.getTime();
  const canBid = isOpen && beforeDeadline;

  // If awarded, confirm this contractor is the winner (for display text)
  const { data: awardRows } = await supabase
    .from("project_awards")
    .select("project_id, awarded_at")
    .eq("project_id", projectId)
    .limit(1);

  const award = awardRows?.[0];

  return (
    <main className="max-w-3xl p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{project.title ?? "Untitled Project"}</h1>
          <div className="mt-1 text-sm text-gray-600">
            {project.category ?? "—"} • {project.location_general ?? "—"}
          </div>
        </div>

        <Link className="rounded-md border px-3 py-2 text-sm" href="/dashboard/contractor/projects">
          Back
        </Link>
      </div>

      <div className="mt-4 rounded-lg border p-4 text-sm">
        <div>
          <span className="font-medium">State:</span> {project.state}
        </div>
        <div className="mt-1">
          <span className="font-medium">Deadline:</span>{" "}
          {deadline ? deadline.toLocaleString() : "—"}
        </div>
      </div>

      {project.description && (
        <div className="mt-4 rounded-lg border p-4 text-sm whitespace-pre-wrap">
          {project.description}
        </div>
      )}

      {/* If awarded, show a clear "you won" message */}
      {project.state === "AWARDED" && (
        <div className="mt-6 rounded-lg border p-4">
          <div className="text-lg font-semibold text-green-700">✅ This project was awarded</div>
          {award?.awarded_at && (
            <div className="mt-2 text-sm text-gray-600">
              Awarded at: {new Date(award.awarded_at).toLocaleString()}
            </div>
          )}
          <div className="mt-2 text-sm text-gray-700">
            Bidding is closed. You can no longer submit or revise bids.
          </div>
        </div>
      )}

      {/* Bid submission only if OPEN and before deadline */}
      {canBid ? (
        <div className="mt-6 rounded-lg border p-4">
          <div className="font-semibold">Submit / Revise Bid</div>

          <form action={submitBid.bind(null, projectId)} className="mt-4 space-y-3">
            <div>
              <label className="text-sm font-medium">Bid amount (USD)</label>
              <input
                name="amount"
                className="mt-1 w-full rounded-md border px-3 py-2"
                placeholder="e.g., 25000"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">Notes (optional)</label>
              <textarea
                name="notes"
                className="mt-1 w-full rounded-md border px-3 py-2 min-h-[90px]"
                placeholder="Clarifying assumptions, schedule notes, etc."
              />
            </div>

            <button className="rounded-md bg-black text-white px-4 py-2 text-sm">
              Submit bid
            </button>

            <p className="text-xs text-gray-500">
              You can revise until the deadline, unless the project is awarded.
            </p>
          </form>
        </div>
      ) : (
        project.state === "OPEN" && (
          <div className="mt-6 rounded-lg border p-4 text-sm text-gray-700">
            Bidding is closed (deadline passed).
          </div>
        )
      )}
    </main>
  );
}
