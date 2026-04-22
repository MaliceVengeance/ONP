import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";

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
  bid_updated_at: string | null;
};

function fmtMoney(cents: number | string) {
  const n = Number(cents);
  if (!Number.isFinite(n)) return "—";
  return `$${(n / 100).toFixed(2)}`;
}

function fmtDate(dt: string | null) {
  if (!dt) return "—";
  return new Date(dt).toLocaleString();
}

export default async function ContractorMyBidsPage() {
  const { supabase } = await requireRole(["CONTRACTOR", "ADMIN"]);

  const { data, error } = await supabase.rpc("list_my_active_bids");

  if (error) {
    throw new Error(`RPC list_my_active_bids failed: ${JSON.stringify(error)}`);
  }

  const bids = (data ?? []) as MyBidRow[];

  return (
    <main>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Active Bids</h1>
        <Link
          href="/dashboard/contractor/projects"
          className="rounded-md border px-3 py-2 text-sm"
        >
          Browse Projects
        </Link>
      </div>

      <p className="mt-2 text-sm text-gray-600">
        Showing your latest bid per project.
      </p>

      <div className="mt-6 space-y-3">
        {bids.length === 0 ? (
          <div className="rounded-lg border p-4 text-sm text-gray-600">
            You haven’t placed any bids yet.
          </div>
        ) : (
          bids.map((b) => {
            const closed = b.project_state !== "OPEN";
            return (
              <div key={b.bid_id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-medium">
                      {b.project_title ?? "Untitled Project"}
                    </div>
                    <div className="text-sm text-gray-600">
                      {b.category ?? "—"} • {b.location_general ?? "—"}
                    </div>
                  </div>

                  <div className="text-right text-sm">
                    <div>
                      <span className="font-medium">Bid:</span>{" "}
                      {fmtMoney(b.latest_amount_cents)}
                    </div>
                    <div className="text-gray-600">
                      v{b.version_number}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Deadline:</span>{" "}
                    {fmtDate(b.deadline_at)}
                  </div>
                  <div>
                    Status:{" "}
                    <span className={closed ? "text-gray-500" : "text-green-600"}>
                      {closed ? "CLOSED" : "OPEN"}
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <Link
                    href={`/dashboard/contractor/projects/${b.project_id}`}
                    className="text-sm underline"
                  >
                    View project
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}
