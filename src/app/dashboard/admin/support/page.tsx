import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";

type SupportRequest = {
  id: string;
  subject: string | null;
  description: string | null;
  type: string | null;
  status: string;
  created_at: string;
  created_by: string | null;
  project_id: string | null;
};

export default async function AdminSupportPage() {
  const { supabase } = await requireRole(["ADMIN"]);

  const { data, error } = await supabase
    .from("support_requests")
    .select("id, subject, description, type, status, created_at, created_by, project_id")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;

  const requests = (data ?? []) as SupportRequest[];
  const open = requests.filter((r) => r.status === "OPEN");
  const others = requests.filter((r) => r.status !== "OPEN");

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Support Requests</h1>
        <Link href="/dashboard/admin" className="rounded-md border px-3 py-2 text-sm">
          Back
        </Link>
      </div>

      {/* Open tickets */}
      <div className="mt-6">
        <h2 className="font-semibold text-lg">Open ({open.length})</h2>
        <div className="mt-3 space-y-3">
          {open.length === 0 ? (
            <div className="rounded-lg border p-4 text-sm text-gray-600">
              No open requests.
            </div>
          ) : (
            open.map((r) => <SupportCard key={r.id} r={r} />)
          )}
        </div>
      </div>

      {/* Other tickets */}
      {others.length > 0 && (
        <div className="mt-8">
          <h2 className="font-semibold text-lg">Other ({others.length})</h2>
          <div className="mt-3 space-y-3">
            {others.map((r) => <SupportCard key={r.id} r={r} />)}
          </div>
        </div>
      )}
    </main>
  );
}

function SupportCard({ r }: { r: SupportRequest }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="font-medium">
            {r.subject ?? "No subject"}
          </div>
          {r.type && (
            <div className="text-xs text-gray-500 mt-0.5">
              Type: {r.type}
            </div>
          )}
          {r.description && (
            <div className="mt-2 text-sm text-gray-700 line-clamp-2">
              {r.description}
            </div>
          )}
          <div className="mt-2 text-xs text-gray-500">
            Submitted: {new Date(r.created_at).toLocaleString()}
            {r.project_id && (
              <> •{" "}
                <Link
                  href={`/dashboard/admin/projects`}
                  className="underline"
                >
                  View project
                </Link>
              </>
            )}
          </div>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full border font-medium shrink-0 ${statusColor(r.status)}`}>
          {r.status}
        </span>
      </div>
    </div>
  );
}

function statusColor(status: string) {
  switch (status) {
    case "OPEN": return "border-red-300 text-red-700";
    case "ASSIGNED": return "border-yellow-300 text-yellow-700";
    case "WAITING_ON_USER": return "border-blue-300 text-blue-700";
    case "CLOSED": return "border-gray-300 text-gray-600";
    default: return "border-gray-300 text-gray-600";
  }
}