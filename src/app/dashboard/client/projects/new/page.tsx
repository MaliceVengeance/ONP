import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { PROJECT_CATEGORIES } from "@/lib/projects/categories";
import { createDraftProject } from "../actions";

export default async function NewDraftProjectPage() {
  await requireRole(["CLIENT", "ADMIN"]);

  return (
    <main className="max-w-xl">
      <h1 className="text-2xl font-semibold">New Draft Project</h1>

      <form action={createDraftProject} className="mt-6 space-y-4">
        <div>
          <label className="text-sm font-medium">Title</label>
          <input name="title" className="mt-1 w-full rounded-md border px-3 py-2" required />
        </div>

        <div>
          <label className="text-sm font-medium">Category</label>
          <select name="category" className="mt-1 w-full rounded-md border px-3 py-2" required>
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
            <input name="city" className="mt-1 w-full rounded-md border px-3 py-2" required />
          </div>
          <div>
            <label className="text-sm font-medium">State</label>
            {/* IMPORTANT: us_state to avoid conflict with projects.state */}
            <input
              name="us_state"
              className="mt-1 w-full rounded-md border px-3 py-2"
              required
              placeholder="TX"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Description</label>
          <textarea name="description" className="mt-1 w-full rounded-md border px-3 py-2" rows={6} />
        </div>

        <div className="flex gap-3">
          <button className="rounded-md bg-black text-white px-3 py-2 text-sm">Create Draft</button>
          <Link className="rounded-md border px-3 py-2 text-sm" href="/dashboard/client/projects">
            Cancel
          </Link>
        </div>
      </form>
    </main>
  );
}
