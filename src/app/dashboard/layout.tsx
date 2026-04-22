import type { ReactNode } from "react";
import Link from "next/link";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="font-semibold">
            ONP Dashboard
          </Link>

          <form action="/auth/signout" method="post">
            <button className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-6">{children}</main>
    </div>
  );
}
