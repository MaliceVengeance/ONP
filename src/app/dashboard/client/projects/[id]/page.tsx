import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { PROJECT_CATEGORIES } from "@/lib/projects/categories";
import { updateDraftProject, publishProject, repostProject } from "../actions";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { supabase } = await requireRole(["CLIENT", "ADMIN"]);
  const { id } = await params;

  const { data: project, error } = await supabase
    .from("projects")
    .select(
      "id,title,description,category,city,location_general,state,deadline_at,published_at,max_open_days"
    )
    .eq("id", id)
    .single();

  if (error) throw error;

  const locParts = String(project.location_general ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const defaultCity = project.city ?? locParts[0] ?? "";
  const defaultState = locParts[1] ?? "";

  const isDraft = project.state === "DRAFT";

  return (
    <main className="max-w-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            {isDraft ? "Edit Draft" : "Project"}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Status: <span className="font-medium">{project.state}</span>
          </p>
          {!isDraft && project.deadline_at && (
            <p className="mt-1 text-sm text-gray-600">
              Deadline:{" "}
              <span className="font-medium">
                {new Date(project.deadline_at).toLocaleString()}
              </span>
            </p>
          )}
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* Repost (new bid round) */}
          <form action={repostProject.bind(null, id)}>
            <button
              type="submit"
              className="rounded-md border px-3 py-2 text-sm"
              title="Creates a new draft copy with a new bidding window"
            >
              Repost
            </button>
          </form>

          <Link
            className="rounded-md border px-3 py-2 text-sm"
            href="/dashboard/client/projects"
          >
            Back
          </Link>
        </div>
      </div>

      {/* Edit form (draft only) */}
      <form
        action={updateDraftProject.bind(null, id)}
        className="mt-6 space-y-4"
      >
        <fieldset disabled={!isDraft} className={!isDraft ? "opacity-60" : ""}>
          <div>
            <label className="text-sm font-medium">Title</label>
            <input
              name="title"
              defaultValue={project.title ?? ""}
              className="mt-1 w-full rounded-md border px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Category</label>
            <select
              name="category"
              defaultValue={project.category ?? ""}
              className="mt-1 w-full rounded-md border px-3 py-2"
              required
            >
              <option value="">Select…</option>
              {PROJECT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">City</label>
              <input
                name="city"
                defaultValue={defaultCity}
                className="mt-1 w-full rounded-md border px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">State</label>
              <input
                name="us_state"
                defaultValue={defaultState}
                className="mt-1 w-full rounded-md border px-3 py-2"
                required
                placeholder="TX"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea
              name="description"
              defaultValue={project.description ?? ""}
              className="mt-1 w-full rounded-md border px-3 py-2"
              rows={6}
            />
          </div>

          {isDraft && (
            <button className="rounded-md bg-black text-white px-3 py-2 text-sm">
              Save Draft
            </button>
          )}
        </fieldset>
      </form>

      {/* Publish controls */}
      {isDraft ? (
        <div className="mt-8 rounded-lg border p-4">
          <h2 className="text-lg font-semibold">Publish to Contractors</h2>
          <p className="mt-1 text-sm text-gray-600">
            Choose how long bidding stays open (min 5 days, max 10 days).
          </p>

          <form
            action={publishProject.bind(null, id)}
            className="mt-4 flex items-center gap-3"
          >
            <label className="text-sm font-medium">Bid duration</label>
            <select
              name="bid_days"
              defaultValue="7"
              className="rounded-md border px-3 py-2 text-sm"
            >
              {[5, 6, 7, 8, 9, 10].map((d) => (
                <option key={d} value={d}>
                  {d} days
                </option>
              ))}
            </select>

            <button className="ml-auto rounded-md bg-black text-white px-3 py-2 text-sm">
              Publish
            </button>
          </form>
        </div>
      ) : (
        <div className="mt-8 rounded-lg border p-4 text-sm text-gray-600">
          This project is published. Edits will later trigger a revision workflow
          (Step 6).
        </div>
      )}
    </main>
  );
}
