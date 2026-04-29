import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { submitRfi } from "./actions";

type RfiCatalogItem = {
  id: string;
  code: string;
  prompt: string;
};

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

export default async function ContractorRfiPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { supabase, user } = await requireRole(["CONTRACTOR", "ADMIN"]);
  const { id: projectId } = await params;

  // Get project details
  const { data: rows } = await supabase.rpc("get_open_project_detail", {
    p_project_id: projectId,
  });
  const project = (rows as any[])?.[0];

  if (!project) {
    return (
      <main className="p-6 max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold">Project not found</h1>
        <Link href="/dashboard/contractor/projects" className="text-sm underline mt-4 block">
          Back to projects
        </Link>
      </main>
    );
  }

  // Get RFI catalog
  const { data: catalog } = await supabase
    .from("rfi_catalog")
    .select("id, code, prompt")
    .order("code");

  const catalogItems = (catalog ?? []) as RfiCatalogItem[]; 

  // Get existing RFIs for this project (all contractors)
  const { data: rfis, error: rfisErr } = await supabase
    .from("rfis")
    .select("id, catalog_id, question, response, responded_at, status, created_at, rfi_catalog(code, prompt)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  const rfiRows = (rfis ?? []) as unknown as RfiRow[];

  // Check how many RFIs this contractor has already submitted
  const myRfis = rfiRows.filter((r) => true); // all visible
  const canSubmit = project.state === "OPEN";
  console.log("project state:", project?.state, "canSubmit:", canSubmit);

// Get catalog_ids already asked on this project
const askedCatalogIds = rfiRows.map((r) => r.catalog_id);
const availableCatalog = catalogItems.filter(
  (c) => !askedCatalogIds.includes(c.id)
);

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Project RFIs</h1>
          <p className="mt-1 text-sm text-gray-600">
            {project.title ?? "Untitled"} • {project.category ?? "—"}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Questions and answers are visible to all contractors on this project.
          </p>
        </div>
        <Link
          href={`/dashboard/contractor/projects/${projectId}`}
          className="rounded-md border px-3 py-2 text-sm"
        >
          Back
        </Link>
      </div>

      {/* Platform rules */}
      <div className="mt-6 rounded-lg border p-4 text-sm space-y-2 bg-gray-50">
        <div className="font-medium text-gray-700">Platform Rules</div>
        <div className="text-gray-600">✅ The contractor is responsible for pulling all required permits.</div>
        <div className="text-gray-600">✅ The contractor is responsible for all debris removal and disposal.</div>
      </div>

      {/* Existing RFIs */}
      <div className="mt-6">
        <h2 className="font-semibold text-lg">
          Questions & Answers ({rfiRows.length})
        </h2>

        {rfisErr && (
          <div className="mt-3 rounded-lg border p-4 text-sm text-red-700">
            Failed to load RFIs.
          </div>
        )}

        {rfiRows.length === 0 ? (
          <div className="mt-3 rounded-lg border p-4 text-sm text-gray-600">
            No questions have been asked yet.
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {rfiRows.map((r) => (
              <div key={r.id} className="rounded-lg border p-4">
                <div className="font-medium text-sm">
                  {r.rfi_catalog?.prompt ?? "Question"}
                </div>
                {r.question && (
                  <div className="mt-2 text-sm text-gray-700 bg-gray-50 rounded p-2">
                    {r.question}
                  </div>
                )}
                {r.response ? (
                  <div className="mt-3">
                    <div className="text-xs font-medium text-green-700 mb-1">
                      ✅ Client Response:
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
                ) : (
                  <div className="mt-3 text-xs text-yellow-700">
                    ⏳ Awaiting client response
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit new RFI */}
      {canSubmit && availableCatalog.length > 0 && (
        <div className="mt-8 rounded-lg border p-4">
          <h2 className="font-semibold">Ask a Question</h2>
          <p className="mt-1 text-xs text-gray-500">
            Select a question type and add any specific details.
          </p>

          <form action={submitRfi.bind(null, projectId)} className="mt-4 space-y-3">
            <div>
              <label className="text-sm font-medium">Question Type</label>
              <select
                name="catalog_id"
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                required
              >
                <option value="">Select a question type…</option>
                {availableCatalog.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.prompt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">
                Additional Details (optional)
              </label>
              <textarea
                name="question"
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm min-h-[80px]"
                placeholder="Add any specific details about your question…"
              />
            </div>

            <button className="rounded-md bg-black text-white px-4 py-2 text-sm">
              Submit Question
            </button>
          </form>
        </div>
      )}

      {!canSubmit && (
        <div className="mt-8 rounded-lg border p-4 text-sm text-gray-600">
          RFIs can only be submitted while the project is open for bidding.
        </div>
      )}

      {canSubmit && availableCatalog.length === 0 && (
        <div className="mt-8 rounded-lg border p-4 text-sm text-gray-600">
          All available question types have been asked.
        </div>
      )}
    </main>
  );
}