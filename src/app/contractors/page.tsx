export default function ContractorsPage() {
  return (
    <main className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold">Contractors</h1>
      <p className="mt-2 text-sm text-gray-600">
        Public directory (data will load once Supabase + RLS is configured).
      </p>

      <div className="mt-6 rounded-lg border p-4">
        <p className="text-sm">
          Next step: connect Supabase and create the contractor_directory_public table.
        </p>
      </div>
    </main>
  );
}
