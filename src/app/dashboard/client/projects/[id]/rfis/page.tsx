import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { respondToRfi } from "./actions";

type RfiRow = {
  id: string;
  catalog_id: string;
  question: string | null;
  response: string | null;
  responded_at: string | null;
  status: string;
  created_at: string;
  rfi_catalog: { code: string; prompt: string } | null;
};

export default async function ClientRfiPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { supabase } = await requireRole(["CLIENT", "ADMIN"]);
  const { id: projectId } = await params;
  const sp = await searchParams;

  const { data: project } = await supabase
    .from("projects")
    .select("id, title, category, state")
    .eq("id", projectId)
    .single();

  const { data: rfis, error } = await supabase
    .from("rfis")
    .select("id, catalog_id, question, response, responded_at, status, created_at, rfi_catalog(code, prompt)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  const rfiRows = (rfis ?? []) as unknown as RfiRow[];
  const unanswered = rfiRows.filter((r) => !r.response);
  const answered = rfiRows.filter((r) => r.response);

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Project RFIs</h1>
          <p className="mt-1 text-sm text-gray-600">
            {project?.title ?? "Untitled"} • {project?.category ?? "—"}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Your responses are visible to all contractors on this project.
          </p>
        </div>
        <Link
          href={`/dashboard/client/projects/${projectId}`}
          className="rounded-md border px-3 py-2 text-sm"
        >
          Back
        </Link>
      </div>

      {sp.saved === "1" && (
        <div className="mt-4 rounded-lg border border-green-300 bg-green-50 p-4 text-sm text-green-800">
          ✅ Response saved.
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-lg border p-4 text-sm text-red-700">
          Failed to load RFIs.
        </div>
      )}

      {/* Unanswered */}
      <div className="mt-6">
        <h2 className="font-semibold text-lg">
          Needs Response ({unanswered.length})
        </h2>

        {unanswered.length === 0 ? (
          <div className="mt-3 rounded-lg border p-4 text-sm text-gray-600">
            No pending questions.
          </div>
        ) : (
          <div className="mt-3 space-y-4">
            {unanswered.map((r) => (
              <div key={r.id} className="rounded-lg border p-4">
                <div className="font-medium text-sm">
                  {r.rfi_catalog?.prompt ?? "Question"}
                </div>
                {r.question && (
                  <div className="mt-2 text-sm text-gray-700 bg-gray-50 rounded p-2">
                    {r.question}
                  </div>
                )}
                <form
                  action={respondToRfi.bind(null, projectId, r.id)}
                  className="mt-3 space-y-2"
                >
                  <textarea
                    name="response"
                    className="w-full rounded-md border px-3 py-2 text-sm min-h-[80px]"
                    placeholder="Type your response here…"
                    required
                  />
                  <button className="rounded-md bg-black text-white px-3 py-2 text-sm">
                    Post Response
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Answered */}
      {answered.length > 0 && (
        <div className="mt-8">
          <h2 className="font-semibold text-lg">
            Answered ({answered.length})
          </h2>
          <div className="mt-3 space-y-3">
            {answered.map((r) => (
              <div key={r.id} className="rounded-lg border p-4">
                <div className="font-medium text-sm">
                  {r.rfi_catalog?.prompt ?? "Question"}
                </div>
                {r.question && (
                  <div className="mt-2 text-sm text-gray-700 bg-gray-50 rounded p-2">
                    {r.question}
                  </div>
                )}
                <div className="mt-3">
                  <div className="text-xs font-medium text-green-700 mb-1">
                    ✅ Your Response:
                  </div>
                  <div className="text-sm text-gray-700 bg-green-50 rounded p-2">
                    {r.response}
                  </div>
                  {r.responded_at && (
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(r.responded_at).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {rfiRows.length === 0 && !error && (
        <div className="mt-6 rounded-lg border p-4 text-sm text-gray-600">
          No questions have been submitted yet.
        </div>
      )}
    </main>
  );
}