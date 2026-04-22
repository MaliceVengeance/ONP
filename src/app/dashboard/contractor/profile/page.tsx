import { requireRole } from "@/lib/auth/requireRole";
import { saveContractorProfile } from "./actions";
import Link from "next/link";

export default async function ContractorProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const sp = await searchParams;
  const { supabase, user } = await requireRole(["CONTRACTOR", "ADMIN"]);

  const { data: profile } = await supabase
    .from("contractor_profiles")
    .select(
      "business_name,city,state,categories,description,is_listed,veteran_applied_at,veteran_verified,veteran_verified_at"
    )
    .eq("contractor_id", user.id)
    .maybeSingle();

  const categories = (profile?.categories ?? []) as string[];

  return (
    <main className="max-w-3xl mx-auto p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Contractor Profile</h1>
          <p className="mt-1 text-sm text-gray-600">
            This info appears in the public directory and after a bid is awarded.
          </p>
        </div>

        <Link href="/dashboard/contractor" className="rounded-md border px-3 py-2 text-sm">
          Back
        </Link>
      </div>

      {sp.saved === "1" && (
        <div className="mt-4 rounded-lg border p-4 text-sm">✅ Saved.</div>
      )}

      <div className="mt-4 rounded-lg border p-4 text-sm">
        <div>
          <span className="font-medium">Veteran verification:</span>{" "}
          {profile?.veteran_verified ? (
            <span className="text-green-700 font-medium">Verified ✅</span>
          ) : profile?.veteran_applied_at ? (
            <span className="text-gray-700">Pending review</span>
          ) : (
            <span className="text-gray-700">Not applied</span>
          )}
        </div>
        {profile?.veteran_verified_at && (
          <div className="mt-1 text-xs text-gray-500">
            Verified at: {new Date(profile.veteran_verified_at).toLocaleString()}
          </div>
        )}
      </div>

      <form action={saveContractorProfile} className="mt-6 space-y-4">
        <div>
          <label className="text-sm font-medium">Business name</label>
          <input
            name="business_name"
            defaultValue={profile?.business_name ?? ""}
            className="mt-1 w-full rounded-md border px-3 py-2"
            placeholder="e.g., Bravo Roofing LLC"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">City</label>
            <input
              name="city"
              defaultValue={profile?.city ?? ""}
              className="mt-1 w-full rounded-md border px-3 py-2"
              placeholder="e.g., El Paso"
            />
          </div>

          <div>
            <label className="text-sm font-medium">State</label>
            <input
              name="state"
              defaultValue={profile?.state ?? ""}
              className="mt-1 w-full rounded-md border px-3 py-2"
              placeholder="e.g., TX"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Categories (comma-separated)</label>
          <input
            name="categories"
            defaultValue={categories.join(", ")}
            className="mt-1 w-full rounded-md border px-3 py-2"
            placeholder="Roofing, Drywall, Concrete, Electrical…"
          />
          <p className="mt-1 text-xs text-gray-500">
            These will power directory filters later.
          </p>
        </div>

        <div>
          <label className="text-sm font-medium">Description</label>
          <textarea
            name="description"
            defaultValue={profile?.description ?? ""}
            className="mt-1 w-full rounded-md border px-3 py-2 min-h-[120px]"
            placeholder="Short public description of your company…"
          />
        </div>

        <div className="flex flex-col gap-2 rounded-lg border p-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="is_listed" defaultChecked={profile?.is_listed ?? true} />
            Show me in the public contractor directory
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="apply_veteran" defaultChecked={!!profile?.veteran_applied_at && !profile?.veteran_verified} />
            Apply for Certified Veteran Owned (admin must verify)
          </label>

          <p className="text-xs text-gray-500">
            For now, this flags your account for review. Later we’ll add document upload.
          </p>
        </div>

        <button className="rounded-md bg-black text-white px-4 py-2 text-sm">
          Save Profile
        </button>
      </form>
    </main>
  );
}
