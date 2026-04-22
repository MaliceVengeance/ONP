"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function SignupClientPage() {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setBusy(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName || "Client",
            signup_role: "CLIENT",
          },
        },
      });

      if (error) throw error;

      // If email confirmations are ON, there may be no session yet.
      if (!data.session) {
        setMsg("Check your email to confirm your account, then log in.");
        return;
      }

      router.push("/dashboard");
    } catch (err: any) {
      setMsg(err?.message ?? "Signup failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-xl border p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Client Sign Up</h1>

        <div className="space-y-2">
          <label className="text-sm font-medium">Display name</label>
          <input
            className="w-full rounded-md border px-3 py-2"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Sam"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Email</label>
          <input
            className="w-full rounded-md border px-3 py-2"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Password</label>
          <input
            className="w-full rounded-md border px-3 py-2"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
          <p className="text-xs text-gray-500">Minimum 8 characters.</p>
        </div>

        {msg && <p className="text-sm text-red-600">{msg}</p>}

        <button disabled={busy} className="w-full rounded-md bg-black text-white py-2 disabled:opacity-50">
          {busy ? "Creating..." : "Sign up"}
        </button>

        <p className="text-sm">
          Contractor?{" "}
          <a className="underline" href="/signup/contractor">
            Sign up here
          </a>
        </p>

        <p className="text-sm">
          Already have an account?{" "}
          <a className="underline" href="/login">
            Log in
          </a>
        </p>
      </form>
    </main>
  );
}
