import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { markProblemReportResolved } from "./actions";

function formatDate(d: string) {
  return new Date(d).toLocaleString();
}

export default async function AdminProblemReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const sp = await searchParams;
  const tab = sp.tab === "resolved" ? "resolved" : "open";

  await requireRole(["ADMIN"]);

  const { data, error } = await supabaseAdmin
    .from("problem_reports")
    .select("id, page_url, description, screenshot_path, user_email, user_role, status, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;

  const reports = data ?? [];
  const open = reports.filter((r) => r.status === "OPEN");
  const resolved = reports.filter((r) => r.status === "RESOLVED");
  const shown = tab === "resolved" ? resolved : open;

  // Signed URLs for screenshots (private bucket)
  const screenshotUrls = new Map<string, string>();
  for (const r of shown) {
    if (r.screenshot_path) {
      const { data: signed } = await supabaseAdmin.storage
        .from("problem-report-screenshots")
        .createSignedUrl(r.screenshot_path, 300);
      if (signed?.signedUrl) screenshotUrls.set(r.id, signed.signedUrl);
    }
  }

  const tabStyle = (active: boolean) =>
    ({
      padding: "10px 20px",
      borderRadius: "6px",
      fontFamily: "'Barlow', sans-serif",
      fontWeight: 600,
      fontSize: "13px",
      textDecoration: "none",
      display: "inline-block",
      background: active ? "var(--camo-accent)" : "transparent",
      color: active ? "var(--camo-ink)" : "var(--camo-gunmetal)",
      border: active ? "none" : "1px solid #d9dbdb",
    } as React.CSSProperties);

  return (
    <div>
      <div className="mob-col mob-gap-sm" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "36px", letterSpacing: "1px", color: "var(--camo-charcoal)", margin: 0 }}>
            Problem Reports
          </h1>
          <p style={{ fontSize: "13px", color: "var(--camo-gunmetal)", marginTop: "4px" }}>
            {open.length} open · {resolved.length} resolved
          </p>
        </div>
        <Link href="/dashboard/admin" style={{ background: "transparent", color: "var(--camo-gunmetal)", border: "1px solid #d9dbdb", padding: "8px 16px", borderRadius: "6px", fontFamily: "'Barlow', sans-serif", fontSize: "13px", textDecoration: "none", flexShrink: 0 }}>
          Back
        </Link>
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
        <Link href="/dashboard/admin/problem-reports?tab=open" style={tabStyle(tab === "open")}>
          Open
          {open.length > 0 && (
            <span style={{ marginLeft: "8px", background: tab === "open" ? "#fff" : "var(--camo-accent)", color: tab === "open" ? "var(--camo-accent)" : "var(--camo-ink)", borderRadius: "20px", padding: "1px 7px", fontSize: "11px" }}>
              {open.length}
            </span>
          )}
        </Link>
        <Link href="/dashboard/admin/problem-reports?tab=resolved" style={tabStyle(tab === "resolved")}>
          Resolved
        </Link>
      </div>

      {shown.length === 0 ? (
        <div style={{ background: "var(--camo-concrete)", border: "1px solid #d9dbdb", borderRadius: "10px", padding: "24px", textAlign: "center", color: "var(--camo-gunmetal)", fontSize: "14px" }}>
          Nothing here.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {shown.map((r) => (
            <div key={r.id} style={{ background: "var(--camo-concrete)", border: "1px solid #d9dbdb", borderRadius: "10px", padding: "18px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "10px", flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "14px", color: "var(--camo-charcoal)" }}>
                    {r.page_url}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--camo-gunmetal)", marginTop: "2px" }}>
                    {r.user_email ? `${r.user_email}${r.user_role ? ` (${r.user_role})` : ""}` : "Not logged in"} · {formatDate(r.created_at)}
                  </div>
                </div>
                <form action={markProblemReportResolved.bind(null, r.id, r.status !== "RESOLVED")}>
                  <button
                    type="submit"
                    style={{
                      fontSize: "12px", padding: "6px 14px", borderRadius: "6px", fontFamily: "'Barlow', sans-serif", fontWeight: 600, cursor: "pointer",
                      ...(r.status === "RESOLVED"
                        ? { background: "#FEF2F2", color: "#991B1B", border: "1px solid #FCA5A5" }
                        : { background: "#F0FDF4", color: "#15803D", border: "1px solid #166534" }),
                    }}
                  >
                    {r.status === "RESOLVED" ? "Reopen" : "Mark Resolved"}
                  </button>
                </form>
              </div>
              <div style={{ background: "#FFFFFF", border: "1px solid #d9dbdb", borderRadius: "6px", padding: "12px 14px", fontSize: "13px", color: "var(--camo-charcoal)", whiteSpace: "pre-wrap", marginBottom: screenshotUrls.has(r.id) ? "12px" : 0 }}>
                {r.description}
              </div>
              {screenshotUrls.has(r.id) && (
                <img
                  src={screenshotUrls.get(r.id)}
                  alt="Screenshot"
                  style={{ maxWidth: "100%", maxHeight: "400px", borderRadius: "6px", border: "1px solid #d9dbdb" }}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
