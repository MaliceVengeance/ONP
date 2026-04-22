import Link from "next/link";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const next = sp.next ?? "/dashboard";
  const error = sp.error;

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form action="/auth/login" method="post" className="w-full max-w-md rounded-xl border p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Log in</h1>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <input type="hidden" name="next" value={next} />

        <div className="space-y-2">
          <label className="text-sm font-medium">Email</label>
          <input className="w-full rounded-md border px-3 py-2" type="email" name="email" required />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Password</label>
          <input className="w-full rounded-md border px-3 py-2" type="password" name="password" required />
        </div>

        <button className="w-full rounded-md bg-black text-white py-2">Log in</button>

        <p className="text-sm">
          Need a client account? <Link className="underline" href="/signup">Sign up</Link>
        </p>
        <p className="text-sm">
          Contractor? <Link className="underline" href="/signup/contractor">Sign up as contractor</Link>
        </p>
      </form>
    </main>
  );
}
