import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  try {
    await requireRole(["ADMIN"]);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("service_area_waitlist")
    .select("email, zip, city, state, intended_role, source, notes, notified_at, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(
      `[serviceArea:waitlistExport] failed to load waitlist rows code=${error.code ?? "unknown"} message=${error.message}`
    );
    return NextResponse.json({ error: "Failed to generate export. Please try again." }, { status: 500 });
  }

  const rows = data ?? [];

  const headers = ["email", "zip", "city", "state", "intended_role", "source", "notes", "notified_at", "created_at"];
  const csv = [
    headers.join(","),
    ...rows.map((r: any) =>
      headers.map((h) => {
        const val = r[h] ?? "";
        // Escape commas and quotes
        const str = String(val).replace(/"/g, '""');
        return str.includes(",") || str.includes('"') || str.includes("\n") ? `"${str}"` : str;
      }).join(",")
    ),
  ].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="waitlist-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
