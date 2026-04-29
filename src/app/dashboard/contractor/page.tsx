import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";

type AwardedRow = {
  project_id: string;
  project_title: string | null;
  location_general: string | null;
  category: string | null;
  awarded_at: string;
};

type MyBidRow = {
  project_id: string;
  project_title: string | null;
  category: string | null;
  location_general: string | null;
  deadline_at: string | null;
  project_state: string;
  bid_id: string;
  latest_amount_cents: number | string;
  version_number: number;
};

function fmtMoney(cents: number | string) {
  const n = Number(cents);
  if (!Number.isFinite(n)) return "—";
  return `$${(n / 100).toFixed(2)}`;
}

export default async function ContractorDashboard() {
  const { supabase, user } = await requireRole(["CONTRACTOR", "ADMIN"]);

  const [{ data: awardedData, error: awardErr }, { data: bidsData, error: bidsErr }] =
    await Promise.all([
      supabase.rpc("list_my_awarded_projects"),
      supabase.rpc("list_my_active_bids"),
    ]);

  const awarded = (awardedData ?? []) as AwardedRow[];
  const activeBids = (bidsData ?? []) as MyBidRow[];
  const openBids = activeBids.filter((b) => b.project_state === "OPEN");

  return (
    <main className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Contractor Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">Signed in as {user.email}</p>
        </div>
        <Link
          href="/dashboard/contractor/projects"
          className="rounded-md bg-black text-white px-4 py-2 text-sm"
        >
          Browse Projects
        </Link>
      </div>

      {/* Quick stats */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        {[
          { label: "Active Bids", count: openBids.length, color: "border-green-200" },
          { label: "Total Bids", count: activeBids.length, color: "border-blue-200" },
          { label: "Won", count: awarded.length, color: "border-purple-200" },
        ].map((s) => (
          <div key={s.label} className={`rounded-lg border-2 ${s.color} p-4 text-center`}>
            <div className="text-2xl font-bold">{s.count}</div>
            <div className="text-xs text-gray-600 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/dashboard/contractor/bids" className="rounded-md border px-3 py-2 text-sm">
          My Active Bids
        </Link>
        <Link href="/dashboard/contractor/profile" className="rounded-md border px-3 py-2 text-sm">
          My Profile
        </Link>
      </div>

      {/* Active bids */}
      <div className="mt-8">
        <h2 className="font-semibold text-lg">Active Bids</h2>
        {bidsErr ? (
          <div className="mt-3 rounded-lg border p-4 text-sm text-red-700">
            Failed to load bids.
          </div>
        ) : openBids.length === 0 ? (
          <div className="mt-3 rounded-lg border p-4 text-sm text-gray-600">
            No active bids.{" "}
            <Link href="/dashboard/contractor/projects" className="underline">
              Browse open projects
            </Link>
            .
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {openBids.map((b) => (
              <Link
                key={b.bid_id}
                href={`/dashboard/contractor/projects/${b.project_id}`}
                className="block rounded-lg border p-4 hover:bg-gray-50 transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-medium">
                      {b.project_title ?? "Untitled Project"}
                    </div>
                    <div className="text-sm text-gray-600">
                      {b.category ?? "—"} • {b.location_general ?? "—"}
                    </div>
                    {b.deadline_at && (
                      <div className="text-xs text-gray-500 mt-1">
                        Deadline: {new Date(b.deadline_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-semibold">
                      {fmtMoney(b.latest_amount_cents)}
                    </div>
                    <div className="text-xs text-gray-500">v{b.version_number}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Awarded projects */}
      {awarded.length > 0 && (
        <div className="mt-8">
          <h2 className="font-semibold text-lg">Won Projects</h2>
          <div className="mt-3 space-y-3">
            {awarded.map((p) => (
              <Link
                key={p.project_id}
                href={`/dashboard/contractor/projects/${p.project_id}`}
                className="block rounded-lg border p-4 hover:bg-gray-50 transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-medium">
                      {p.project_title ?? "Untitled Project"}
                    </div>
                    <div className="text-sm text-gray-600">
                      {p.category ?? "—"} • {p.location_general ?? "—"}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Awarded: {new Date(p.awarded_at).toLocaleDateString()}
                    </div>
                  </div>
                  <span className="text-sm text-green-700 font-medium shrink-0">
                    ✅ Won
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}