import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { notifyWaitlistByZips } from "./actions";

type WaitlistRow = {
  id: string;
  email: string;
  zip: string;
  city: string | null;
  state: string | null;
  intended_role: string | null;
  source: string;
  notes: string | null;
  notified_at: string | null;
  created_at: string;
};

function sourceBadge(source: string) {
  switch (source) {
    case "HOMEPAGE": return { background: "#EEF4FF", color: "#1B4F8A", border: "1px solid #B8D0E8" };
    case "SIGNUP_BLOCKED": return { background: "#FFFBEB", color: "#92400E", border: "1px solid #FCD34D" };
    case "PROJECT_POST_BLOCKED": return { background: "#FEF2F2", color: "#991B1B", border: "1px solid #FCA5A5" };
    default: return { background: "#EEF4FF", color: "#1B4F8A", border: "1px solid #B8D0E8" };
  }
}

export default async function AdminWaitlistPage({
  searchParams,
}: {
  searchParams: Promise<{
    filter_state?: string;
    filter_source?: string;
    notified?: string;
    notify_error?: string;
  }>;
}) {
  await requireRole(["ADMIN"]);
  const sp = await searchParams;

  let query = supabaseAdmin
    .from("service_area_waitlist")
    .select("id, email, zip, city, state, intended_role, source, notes, notified_at, created_at")
    .order("created_at", { ascending: false });

  if (sp.filter_state) query = query.eq("state", sp.filter_state.toUpperCase());
  if (sp.filter_source) query = query.eq("source", sp.filter_source.toUpperCase());

  const { data } = await query;
  const rows = (data ?? []) as WaitlistRow[];

  // Aggregate stats
  const total = rows.length;
  const notified = rows.filter((r) => r.notified_at).length;
  const last30 = rows.filter((r) => {
    const d = new Date(r.created_at);
    return Date.now() - d.getTime() < 30 * 24 * 60 * 60 * 1000;
  }).length;

  // Top ZIPs
  const zipCounts = new Map<string, number>();
  const stateCounts = new Map<string, number>();
  for (const r of rows) {
    zipCounts.set(r.zip, (zipCounts.get(r.zip) ?? 0) + 1);
    if (r.state) stateCounts.set(r.state, (stateCounts.get(r.state) ?? 0) + 1);
  }
  const topZips = [...zipCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  const topStates = [...stateCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);

  const notifiedCount = sp.notified ? parseInt(sp.notified) : null;

  return (
    <div>
      {/* Header */}
      <div className="mob-col mob-gap-sm" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px" }}>
        <div>
          <h1 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "36px",
            letterSpacing: "1px",
            color: "#1E3A8A",
            margin: 0,
          }}>
            Expansion Waitlist
          </h1>
          <p style={{ fontSize: "13px", color: "#1B4F8A", marginTop: "4px" }}>
            {total} total · {notified} notified · {last30} in last 30 days
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <a
            href="/api/admin/waitlist-export"
            style={{
              background: "#F0FDF4",
              color: "#15803D",
              border: "1px solid #166534",
              padding: "8px 16px",
              borderRadius: "6px",
              fontFamily: "'Barlow', sans-serif",
              fontWeight: 600,
              fontSize: "13px",
              textDecoration: "none",
            }}
          >
            Export CSV
          </a>
          <Link href="/dashboard/admin" style={{
            background: "transparent",
            color: "#1B4F8A",
            border: "1px solid #B8D0E8",
            padding: "8px 16px",
            borderRadius: "6px",
            fontFamily: "'Barlow', sans-serif",
            fontSize: "13px",
            textDecoration: "none",
          }}>
            ← Admin Home
          </Link>
        </div>
      </div>

      {/* Banners */}
      {notifiedCount !== null && (
        <div style={{ background: "#F0FDF4", border: "1px solid #166534", color: "#15803D", padding: "12px 16px", borderRadius: "8px", fontSize: "13px", marginBottom: "20px" }}>
          ✅ Notified {notifiedCount} waitlist {notifiedCount === 1 ? "entry" : "entries"} successfully.
        </div>
      )}
      {sp.notify_error && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", color: "#991B1B", padding: "12px 16px", borderRadius: "8px", fontSize: "13px", marginBottom: "20px" }}>
          ❌ Error: {sp.notify_error.replace(/_/g, " ")}
        </div>
      )}

      {/* Stats grid */}
      <div className="mob-grid-1" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "28px" }}>
        {[
          { label: "Total Signups", value: total },
          { label: "Notified", value: notified },
          { label: "Last 30 Days", value: last30 },
        ].map((s) => (
          <div key={s.label} style={{ background: "#EEF4FF", border: "1px solid #B8D0E8", borderRadius: "10px", padding: "16px 20px" }}>
            <div style={{ fontSize: "11px", color: "#1B4F8A", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>{s.label}</div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "32px", color: "#1E3A8A" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Top ZIPs and States */}
      <div className="mob-grid-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "28px" }}>
        <div style={{ background: "#EEF4FF", border: "1px solid #B8D0E8", borderRadius: "10px", padding: "16px 20px" }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "14px", letterSpacing: "1px", color: "#1E3A8A", textTransform: "uppercase", marginBottom: "12px" }}>
            Top ZIPs
          </div>
          {topZips.length === 0 ? (
            <div style={{ fontSize: "13px", color: "#4A7FB5" }}>No data yet</div>
          ) : topZips.map(([zip, count]) => (
            <div key={zip} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#1E3A8A", marginBottom: "6px" }}>
              <Link href={`/dashboard/admin/waitlist?filter_state=`} style={{ color: "#1B4F8A", textDecoration: "none" }}>{zip}</Link>
              <span style={{ fontWeight: 700 }}>{count}</span>
            </div>
          ))}
        </div>
        <div style={{ background: "#EEF4FF", border: "1px solid #B8D0E8", borderRadius: "10px", padding: "16px 20px" }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "14px", letterSpacing: "1px", color: "#1E3A8A", textTransform: "uppercase", marginBottom: "12px" }}>
            Top States
          </div>
          {topStates.length === 0 ? (
            <div style={{ fontSize: "13px", color: "#4A7FB5" }}>No data yet</div>
          ) : topStates.map(([state, count]) => (
            <div key={state} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#1E3A8A", marginBottom: "6px" }}>
              <Link href={`/dashboard/admin/waitlist?filter_state=${state}`} style={{ color: "#1B4F8A", textDecoration: "none" }}>{state}</Link>
              <span style={{ fontWeight: 700 }}>{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Notify expansion tool */}
      <div style={{
        background: "#F0FDF4",
        border: "1px solid #166534",
        borderRadius: "12px",
        padding: "20px 24px",
        marginBottom: "28px",
      }}>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "16px", letterSpacing: "1px", color: "#15803D", textTransform: "uppercase", marginBottom: "12px" }}>
          Notify Waitlist on Expansion
        </div>
        <p style={{ fontSize: "12px", color: "#166534", lineHeight: 1.5, marginBottom: "14px" }}>
          Enter the ZIPs for your new expansion area. The system will find all unnotified waitlist entries matching those ZIPs, email them, and mark them as notified.
        </p>
        <form action={notifyWaitlistByZips} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div>
            <label style={{ fontSize: "11px", fontWeight: 600, color: "#15803D", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "4px" }}>
              ZIP codes (comma or newline separated)
            </label>
            <textarea
              name="zips"
              rows={3}
              placeholder="e.g. 85001, 85002, 85003"
              style={{
                width: "100%",
                background: "#FFFFFF",
                border: "1px solid #166534",
                color: "#1E3A8A",
                borderRadius: "6px",
                padding: "10px 14px",
                fontFamily: "'Barlow', sans-serif",
                fontSize: "13px",
                outline: "none",
                resize: "vertical",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: "11px", fontWeight: 600, color: "#15803D", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "4px" }}>
              Email Subject
            </label>
            <input
              name="subject"
              defaultValue="ONP has launched in your area!"
              style={{
                width: "100%",
                background: "#FFFFFF",
                border: "1px solid #166534",
                color: "#1E3A8A",
                borderRadius: "6px",
                padding: "10px 14px",
                fontFamily: "'Barlow', sans-serif",
                fontSize: "13px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: "11px", fontWeight: 600, color: "#15803D", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "4px" }}>
              Email Body
            </label>
            <textarea
              name="body"
              rows={4}
              placeholder="Great news — ONP is now serving your area! Sign up or log in to get started..."
              style={{
                width: "100%",
                background: "#FFFFFF",
                border: "1px solid #166534",
                color: "#1E3A8A",
                borderRadius: "6px",
                padding: "10px 14px",
                fontFamily: "'Barlow', sans-serif",
                fontSize: "13px",
                outline: "none",
                resize: "vertical",
                boxSizing: "border-box",
              }}
            />
          </div>
          <button
            type="submit"
            style={{
              alignSelf: "flex-start",
              background: "#15803D",
              color: "#fff",
              border: "none",
              padding: "10px 24px",
              borderRadius: "6px",
              fontFamily: "'Barlow', sans-serif",
              fontWeight: 600,
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            Preview & Send →
          </button>
        </form>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: "12px", color: "#1B4F8A", fontWeight: 600 }}>Filter:</span>
        {["HOMEPAGE", "SIGNUP_BLOCKED", "PROJECT_POST_BLOCKED"].map((src) => (
          <Link
            key={src}
            href={sp.filter_source === src ? "/dashboard/admin/waitlist" : `/dashboard/admin/waitlist?filter_source=${src}`}
            style={{
              fontSize: "11px",
              fontWeight: 600,
              padding: "4px 10px",
              borderRadius: "20px",
              textDecoration: "none",
              ...(sp.filter_source === src
                ? { background: "#1E3A8A", color: "#fff" }
                : { background: "#EEF4FF", color: "#1B4F8A", border: "1px solid #B8D0E8" }),
            }}
          >
            {src.replace(/_/g, " ")}
          </Link>
        ))}
        {(sp.filter_state || sp.filter_source) && (
          <Link href="/dashboard/admin/waitlist" style={{ fontSize: "11px", color: "#991B1B", textDecoration: "underline" }}>
            Clear filters
          </Link>
        )}
        {sp.filter_state && (
          <span style={{ fontSize: "12px", color: "#1B4F8A" }}>State: <strong>{sp.filter_state.toUpperCase()}</strong></span>
        )}
      </div>

      {/* Table */}
      {rows.length === 0 ? (
        <div style={{ background: "#EEF4FF", border: "1px solid #B8D0E8", borderRadius: "10px", padding: "32px", textAlign: "center", color: "#4A7FB5", fontSize: "14px" }}>
          No waitlist entries yet.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {rows.map((row) => (
            <div key={row.id} style={{
              background: row.notified_at ? "#F0FDF4" : "#FFFFFF",
              border: `1px solid ${row.notified_at ? "#BBF7D0" : "#B8D0E8"}`,
              borderRadius: "10px",
              padding: "14px 18px",
            }}>
              <div className="mob-col mob-gap-sm" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: "14px", color: "#1E3A8A", marginBottom: "2px" }}>
                    {row.email}
                  </div>
                  <div style={{ fontSize: "12px", color: "#1B4F8A", marginBottom: "4px" }}>
                    ZIP: <strong>{row.zip}</strong>
                    {row.city && ` · ${row.city}`}
                    {row.state && `, ${row.state}`}
                    {row.intended_role && ` · ${row.intended_role}`}
                  </div>
                  <div style={{ fontSize: "11px", color: "#4A7FB5" }}>
                    Signed up: {new Date(row.created_at).toLocaleDateString()}
                    {row.notified_at && (
                      <span style={{ color: "#15803D", marginLeft: "8px" }}>
                        ✓ Notified {new Date(row.notified_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {row.notes && (
                    <div style={{ fontSize: "12px", color: "#4A7FB5", marginTop: "4px", fontStyle: "italic" }}>
                      {row.notes}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                  <span style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    padding: "3px 8px",
                    borderRadius: "20px",
                    letterSpacing: "0.3px",
                    ...sourceBadge(row.source),
                  }}>
                    {row.source.replace(/_/g, " ")}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
