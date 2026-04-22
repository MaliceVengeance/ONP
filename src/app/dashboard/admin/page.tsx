import { requireRole } from "@/lib/auth/requireRole";

export default async function AdminDashboard() {
  const { user } = await requireRole(["ADMIN"]);

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
      <p className="mt-2 text-sm text-gray-600">Signed in as {user.email}</p>
      <p className="mt-4 text-sm text-gray-600">
        Next: admin tools (approve inspectors/admins, vet certification, urgent override, etc.).
      </p>
    </main>
  );
}
