import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { awardBid } from "./actions";

type BidRow = {
  bid_id: string;
  amount_cents: number | string;
  version_number: number;
  submitted_at: string;
  notes: string | null;
};

function centsToMoney(cents: number | string) {
  const n = Number(cents);
  if (!Number.isFinite(n)) return "—";
  return `$${(n / 100).toFixed(2)}`;
}

function moneyToCents(input: string | undefined) {
  if (!input) return null;
  const normalized = input.replace(/[$, ]/g, "").trim();
  if (!normalized) return null;
  const num = Number(normalized);
  if (!Number.isFinite(num)) return null;
  return Math.round(num * 100);
}

export default async function ClientProjectBidsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ min?: string; max?: string; sort?: string; award?: string }>;
}) {
  const { supabase, user } = await requireRole(["CLIENT", "ADMIN"]);
  const { id: projectId } = await params;
  const sp = await searchParams;

  // 1) Load project (RLS restricts to owner client or admin)
  const { data: project, error: pErr } = await supabase
    .from("projects")
    .select("id,title,state,deadline_at")
    .eq("id", projectId)
    .single();

  if (pErr) {
    return (
      <main className="max-w-3xl p-6">
        <h1 className="text-2xl font-semibold">Bids</h1>
        <div className="mt-6 rounded-lg border p-4 text-sm text-red-700">
          Failed to load project: {JSON.stringify(pErr)}
        </div>
      </main>
    );
  }

  const deadline = project.deadline_at ? new Date(project.deadline_at) : null;
  const now = new Date();

  // Unlock condition:
  // - deadline passed, OR
  // - project not OPEN (e.g. AWARDED, CANCELLED, etc.)
  const unlocked =
    (deadline && deadline.getTime() <= now.getTime()) || project.state !== "OPEN";

  const sort = sp.sort === "amount_desc" ? "amount_desc" : "amount_asc";
  const minCents = moneyToCents(sp.min);
  const maxCents = moneyToCents(sp.max);

  // 2) Load bids (only if unlocked)
  let bids: BidRow[] = [];
  let bidsErrText: string | null = null;

  if (unlocked) {
    const { data, error } = await supabase.rpc("list_project_bids_for_client", {
      p_project_id: projectId,
      // BIGINT safety: send as strings or null
      p_min_cents: minCents === null ? null : String(minCents),
      p_max_cents: maxCents === null ? null : String(maxCents),
      p_sort: sort,
    });

    if (error) {
      bidsErrText = JSON.stringify(error, null, 2);
    } else {
      bids = (data ?? []) as BidRow[];
    }
  }

  // 3) Load award (only if unlocked)
  let awardErrText: string | null = null;
  let award:
    | {
        project_id: string;
        bid_id: string | null;
        contractor_id: string;
        awarded_at: string;
        contractor: any;
      }
    | undefined;

  if (unlocked) {
    const { data: awardData, error: awardErr } = await supabase.rpc(
      "get_project_award_for_client",
      { p_project_id: projectId }
    );

    if (awardErr) {
      awardErrText = JSON.stringify(awardErr, null, 2);
    } else {
      award = (awardData ?? [])[0] as any;
    }
  }

  return (
    <main className="max-w-3xl p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Bids</h1>
          <div className="mt-1 text-sm text-gray-600">
            Project:{" "}
            <span className="font-medium">{project.title ?? "Untitled"}</span>
          </div>
          <div className="mt-1 text-xs text-gray-500">
            Signed in as: {user.email}
          </div>
        </div>

        <Link
          href={`/dashboard/client/projects/${projectId}`}
          className="rounded-md border px-3 py-2 text-sm"
        >
          Back to project
        </Link>
      </div>

      {/* Deadline / state card */}
      <div className="mt-4 rounded-lg border p-4 text-sm">
        <div>
          <span className="font-medium">Deadline:</span>{" "}
          {deadline ? deadline.toLocaleString() : "—"}
        </div>
        <div>
          <span className="font-medium">State:</span> {project.state}
        </div>
      </div>

      {/* Locked / Unlocked badge */}
      <div
        className={`mt-4 rounded-lg border p-4 ${
          unlocked ? "bg-green-50" : "bg-yellow-50"
        }`}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="text-lg font-semibold">
            {unlocked ? "✅ UNLOCKED" : "🔒 LOCKED"}
          </div>
          <div className="text-sm text-gray-700">
            {unlocked
              ? award
                ? "Bids are visible (project already awarded)."
                : "Bids are visible and awardable."
              : "Bids are hidden until the deadline passes."}
          </div>
        </div>

        <div className="mt-3 text-sm text-gray-700 space-y-1">
          <div>
            <span className="font-medium">Unlock rule:</span> Bids become visible
            after the deadline passes (or if the project is no longer OPEN).
          </div>
          <div>
            <span className="font-medium">State:</span>{" "}
            <code>{project.state}</code>
          </div>
          <div>
            <span className="font-medium">Deadline:</span>{" "}
            <code>{deadline ? deadline.toISOString() : "null"}</code>
          </div>
          <div>
            <span className="font-medium">Now (browser):</span>{" "}
            <code>{now.toISOString()}</code>
          </div>
          <div>
            <span className="font-medium">Computed:</span>{" "}
            <code>{String(unlocked)}</code>
          </div>
        </div>
      </div>

      {/* Award saved banner */}
      {sp.award === "ok" && (
        <div className="mt-6 rounded-lg border p-4 text-sm">
          ✅ Award saved.
        </div>
      )}

      {/* RPC errors shown on-page */}
      {bidsErrText && (
        <div className="mt-6 rounded-lg border p-4 text-sm text-red-700">
          <div className="font-semibold">
            RPC error: list_project_bids_for_client
          </div>
          <pre className="mt-2 whitespace-pre-wrap text-xs bg-gray-50 p-2 rounded">
            {bidsErrText}
          </pre>
        </div>
      )}

      {awardErrText && (
        <div className="mt-6 rounded-lg border p-4 text-sm text-red-700">
          <div className="font-semibold">
            RPC error: get_project_award_for_client
          </div>
          <pre className="mt-2 whitespace-pre-wrap text-xs bg-gray-50 p-2 rounded">
            {awardErrText}
          </pre>
        </div>
      )}

      {/* Winner box */}
      {award && (
        <div className="mt-6 rounded-lg border p-4">
          <div className="text-sm text-gray-600">Winner selected</div>
          <div className="mt-1 text-lg font-semibold">Awarded Contractor</div>

          <div className="mt-2 text-sm text-gray-700">
            Awarded at: {new Date(award.awarded_at).toLocaleString()}
          </div>

          {/* Contractor Card Block */}
          {(() => {
            const c = award?.contractor || {};
            const hasProfile = c && Object.keys(c).length > 0;

            const name =
              (hasProfile &&
                (c.business_name ||
                  c.company_name ||
                  c.name ||
                  c.legal_name)) ||
              "Contractor profile not set up yet";

            const city =
              (hasProfile && (c.city || c.location_city || c.base_city)) || "";

            const state =
              (hasProfile && (c.state || c.location_state || c.base_state)) ||
              "";

            const veteran = hasProfile
              ? c.veteran_verified ??
                c.certified_veteran_owned ??
                c.is_veteran_owned
              : null;

            return (
              <div className="mt-3 rounded-md border p-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">{String(name)}</div>
                    <div className="text-sm text-gray-600">
                      {[city, state].filter(Boolean).join(", ") ||
                        (hasProfile
                          ? "Location not listed"
                          : "Location not set up yet")}
                    </div>
                  </div>

                  {veteran === true ? (
                    <span className="rounded-full border px-2 py-1 text-xs">
                      ✅ Veteran-owned (verified)
                    </span>
                  ) : veteran === false ? (
                    <span className="rounded-full border px-2 py-1 text-xs text-gray-500">
                      Veteran status not verified
                    </span>
                  ) : (
                    <span className="rounded-full border px-2 py-1 text-xs text-gray-500">
                      Profile pending
                    </span>
                  )}
                </div>

                {!hasProfile && (
                  <div className="mt-3 text-xs text-gray-500">
                    Contractor identity has been revealed, but the contractor
                    profile page has not been completed yet.
                  </div>
                )}

                {hasProfile && (
                  <div className="mt-3 text-xs text-gray-500">
                    (Contractor identity is revealed only after award.)
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Locked/unlocked behavior */}
      {!unlocked ? (
        <div className="mt-6 rounded-lg border p-4 text-sm text-gray-600">
          🔒 Bids are locked until the deadline passes.
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="mt-6 rounded-lg border p-4">
            <h2 className="font-semibold">Filter by price</h2>

            <form className="mt-3 flex flex-wrap gap-3 items-end">
              <div className="flex flex-col">
                <label className="text-sm text-gray-600">Min ($)</label>
                <input
                  name="min"
                  defaultValue={sp.min ?? ""}
                  className="rounded-md border px-3 py-2"
                  placeholder="e.g. 25000"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm text-gray-600">Max ($)</label>
                <input
                  name="max"
                  defaultValue={sp.max ?? ""}
                  className="rounded-md border px-3 py-2"
                  placeholder="e.g. 30000"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm text-gray-600">Sort</label>
                <select
                  name="sort"
                  defaultValue={sort}
                  className="rounded-md border px-3 py-2"
                >
                  <option value="amount_asc">Lowest first</option>
                  <option value="amount_desc">Highest first</option>
                </select>
              </div>

              <button className="rounded-md bg-black text-white px-3 py-2 text-sm">
                Apply
              </button>

              <Link
                className="rounded-md border px-3 py-2 text-sm"
                href={`/dashboard/client/projects/${projectId}/bids`}
              >
                Clear
              </Link>
            </form>

            <p className="mt-2 text-xs text-gray-500">
              Bids are anonymous. Contractor identities are not shown until an
              award is made.
            </p>
          </div>

          {/* Bid cards */}
          <div className="mt-6 space-y-3">
            {bids.length === 0 ? (
              <div className="rounded-lg border p-4 text-sm text-gray-600">
                No bids match your filters.
              </div>
            ) : (
              bids.map((b, idx) => (
                <div key={b.bid_id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="font-medium">Bid #{idx + 1}</div>
                    <div className="text-right">
                      <div className="text-lg font-semibold">
                        {centsToMoney(b.amount_cents)}
                      </div>
                      <div className="text-sm text-gray-600">
                        v{b.version_number}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 text-sm text-gray-600">
  Submitted: {new Date(b.submitted_at).toLocaleString()}
</div>
{b.notes && (
  <div className="mt-2 text-sm text-gray-700">
    <span className="font-medium">Notes:</span> {b.notes}
  </div>
)}

                  {/* Award button */}
                  {!award ? (
                    <form
                      action={awardBid.bind(null, projectId, b.bid_id)}
                      className="mt-4"
                    >
                      <button className="rounded-md bg-black text-white px-3 py-2 text-sm">
                        Award this bid
                      </button>
                      <p className="mt-2 text-xs text-gray-500">
                        This selects the winner and reveals the contractor
                        identity for this bid only.
                      </p>
                    </form>
                  ) : award.bid_id === b.bid_id ? (
                    <div className="mt-4 text-sm font-medium text-green-700">
                      ✅ Awarded bid
                    </div>
                  ) : (
                    <div className="mt-4 text-sm text-gray-500">Not selected</div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </main>
  );
}
