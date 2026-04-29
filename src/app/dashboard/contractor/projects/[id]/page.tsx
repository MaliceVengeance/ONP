import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { submitBid } from "@/app/dashboard/contractor/bids/actions";
import CountdownTimer from "@/components/CountdownTimer";

type ProjectDetail = {
  id: string;
  title: string | null;
  description: string | null;
  category: string | null;
  location_general: string | null;
  state: string;
  deadline_at: string | null;
  published_at: string | null;
  revision_number: number | null;
  created_at: string | null;
  updated_at: string | null;
};

type ExistingBid = {
  id: string;
  amount_cents: number;
  notes: string | null;
  version_number: number;
  submitted_at: string | null;
};

export default async function ContractorProjectDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ bid?: string }>;
}) {
  const { supabase, user } = await requireRole(["CONTRACTOR", "ADMIN"]);
  const { id: projectId } = await params;
  const sp = await searchParams;
  const bidSubmitted = sp.bid === "ok";

  const { data: rows, error: pErr } = await supabase.rpc(
    "get_open_project_detail",
    { p_project_id: projectId }
  );

  const project = (rows as ProjectDetail[] | null)?.[0];

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

  // Fetch existing bid for this contractor on this project
  const { data: bidRow } = await supabase
    .from("bids")
    .select("id")
    .eq("project_id", projectId)
    .eq("contractor_id", user.id)
    .maybeSingle();

  let existingBid: ExistingBid | null = null;

  if (bidRow?.id) {
    const { data: versionRow } = await supabase
      .from("bid_versions")
      .select("id, amount_cents, notes, version_number, submitted_at")
      .eq("bid_id", bidRow.id)
      .order("version_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (versionRow) {
      existingBid = versionRow as ExistingBid;
    }
  }

  const deadline = project.deadline_at ? new Date(project.deadline_at) : null;
  const now = new Date();
  const isOpen = project.state === "OPEN";
  const beforeDeadline = !!deadline && deadline.getTime() > now.getTime();
  const canBid = isOpen && beforeDeadline;

  const { data: awardRows } = await supabase
    .from("project_awards")
    .select("project_id, awarded_at")
    .eq("project_id", projectId)
    .limit(1);

  const award = awardRows?.[0];

  function fmtMoney(cents: number) {
    return `$${(cents / 100).toFixed(2)}`;
  }

  return (
    <main className="max-w-3xl p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            {project.title ?? "Untitled Project"}
          </h1>
          <div className="mt-1 text-sm text-gray-600">
            {project.category ?? "—"} • {project.location_general ?? "—"}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isOpen && (
            <Link
              className="rounded-md border px-3 py-2 text-sm"
              href={`/dashboard/contractor/projects/${projectId}/rfis`}
            >
              Questions (RFIs)
            </Link>
          )}
          <Link
            className="rounded-md border px-3 py-2 text-sm"
            href="/dashboard/contractor/projects"
          >
            Back
          </Link>
        </div>
      </div>

      {/* Status info */}
      <div className="mt-4 rounded-lg border p-4 text-sm space-y-1">
        <div>
          <span className="font-medium">Status:</span> {project.state}
        </div>
        <div>
          <span className="font-medium">Deadline:</span>{" "}
          {deadline ? deadline.toLocaleString() : "—"}
        </div>
        <div>
          <span className="font-medium">Published:</span>{" "}
          {project.published_at
            ? new Date(project.published_at).toLocaleString()
            : "—"}
        </div>
      </div>

      {/* Countdown timer */}
      {isOpen && project.deadline_at && (
        <div className="mt-4">
          <CountdownTimer deadline={project.deadline_at} />
        </div>
      )}

      {/* Description */}
      {project.description && (
        <div className="mt-4 rounded-lg border p-4 text-sm whitespace-pre-wrap">
          {project.description}
        </div>
      )}

      {/* Platform rules */}
      <div className="mt-4 rounded-lg border p-4 text-sm space-y-2 bg-gray-50">
        <div className="font-medium text-gray-700">Platform Rules</div>
        <div className="text-gray-600">✅ The contractor is responsible for pulling all required permits.</div>
        <div className="text-gray-600">✅ The contractor is responsible for all debris removal and disposal.</div>
      </div>

      {/* Awarded */}
      {project.state === "AWARDED" && (
        <div className="mt-6 rounded-lg border p-4">
          <div className="text-lg font-semibold text-green-700">
            ✅ This project was awarded
          </div>
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

      {/* Success banner */}
      {bidSubmitted && (
        <div className="mt-6 rounded-lg border border-green-300 bg-green-50 p-4 text-sm text-green-800">
          ✅ Your bid was submitted successfully.
        </div>
      )}

      {/* Existing bid summary */}
      {existingBid && (
        <div className="mt-6 rounded-lg border p-4 space-y-1">
          <div className="font-semibold">Your Current Bid</div>
          <div className="text-sm text-gray-700">
            <span className="font-medium">Amount:</span>{" "}
            {fmtMoney(existingBid.amount_cents)}
          </div>
          {existingBid.notes && (
            <div className="text-sm text-gray-700">
              <span className="font-medium">Notes:</span> {existingBid.notes}
            </div>
          )}
          <div className="text-xs text-gray-500">
            Version {existingBid.version_number}
            {existingBid.submitted_at
              ? ` • Submitted ${new Date(existingBid.submitted_at).toLocaleString()}`
              : ""}
          </div>
        </div>
      )}

      {/* Bid form */}
      {canBid ? (
        <div className="mt-6 rounded-lg border p-4">
          <div className="font-semibold">
            {existingBid ? "Revise Your Bid" : "Submit a Bid"}
          </div>

          <form
            action={submitBid.bind(null, projectId)}
            className="mt-4 space-y-3"
          >
            <div>
              <label className="text-sm font-medium">Bid amount (USD)</label>
              <input
                name="amount"
                className="mt-1 w-full rounded-md border px-3 py-2"
                placeholder="e.g., 25000"
                defaultValue={
                  existingBid
                    ? (existingBid.amount_cents / 100).toFixed(2)
                    : ""
                }
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">Notes (optional)</label>
              <textarea
                name="notes"
                className="mt-1 w-full rounded-md border px-3 py-2 min-h-[90px]"
                placeholder="Clarifying assumptions, schedule notes, etc."
                defaultValue={existingBid?.notes ?? ""}
              />
            </div>

            <button className="rounded-md bg-black text-white px-4 py-2 text-sm">
              {existingBid ? "Revise Bid" : "Submit Bid"}
            </button>

            <p className="text-xs text-gray-500">
              You can revise until the deadline. Bids are sealed until bidding closes.
            </p>
          </form>
        </div>
      ) : (
        isOpen && (
          <div className="mt-6 rounded-lg border p-4 text-sm text-gray-700">
            Bidding is closed (deadline passed).
          </div>
        )
      )}
    </main>
  );
}