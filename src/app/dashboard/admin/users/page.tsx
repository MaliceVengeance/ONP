import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { changeUserRole } from "./actions";

type Profile = {
  id: string;
  role: string;
  display_name: string | null;
  company_name: string | null;
  created_at: string;
};

const ALL_ROLES = ["CLIENT", "CONTRACTOR", "INSPECTOR", "ADMIN"];

export default async function AdminUsersPage() {
  const { supabase, user: adminUser } = await requireRole(["ADMIN"]);

  const { data, error } = await supabase
    .from("profiles")
    .select("id, role, display_name, company_name, created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;

  const profiles = (data ?? []) as Profile[];

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Users</h1>
        <Link href="/dashboard/admin" className="rounded-md border px-3 py-2 text-sm">
          Back
        </Link>
      </div>

      <p className="mt-2 text-sm text-gray-600">
        {profiles.length} total users
      </p>

      <div className="mt-6 space-y-3">
        {profiles.length === 0 ? (
          <div className="rounded-lg border p-4 text-sm text-gray-600">
            No users found.
          </div>
        ) : (
          profiles.map((p) => (
            <div key={p.id} className="rounded-lg border p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-medium">
                    {p.display_name ?? p.company_name ?? "No name set"}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {p.id}
                  </div>
                  <div className="text-xs text-gray-500">
                    Joined: {new Date(p.created_at).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs px-2 py-1 rounded-full border font-medium ${roleColor(p.role)}`}>
                    {p.role}
                  </span>

                  {/* Don't allow changing your own role */}
                  {p.id !== adminUser.id && (
                    <form action={async (formData: FormData) => {
                      "use server";
                      const newRole = formData.get("role") as string;
                      await changeUserRole(p.id, newRole);
                    }}>
                      <select
                        name="role"
                        defaultValue={p.role}
                        className="rounded-md border px-2 py-1 text-xs"
                      >
                        {ALL_ROLES.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                      <button className="ml-2 rounded-md border px-2 py-1 text-xs hover:bg-gray-50">
                        Change
                      </button>
                    </form>
                  )}

                  {p.id === adminUser.id && (
                    <span className="text-xs text-gray-400">(you)</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}

function roleColor(role: string) {
  switch (role) {
    case "ADMIN": return "border-red-300 text-red-700";
    case "CLIENT": return "border-blue-300 text-blue-700";
    case "CONTRACTOR": return "border-green-300 text-green-700";
    case "INSPECTOR": return "border-yellow-300 text-yellow-700";
    default: return "border-gray-300 text-gray-700";
  }
}