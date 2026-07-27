import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { resolveSubscriptionDispute } from "./actions";

function formatDate(d: string) {
  return new Date(d).toLocaleString();
}

function fmtMoney(cents: number | null) {
  if (!cents) return "—";
  return `$${(cents / 100).toFixed(2)}`;
}

export default async function AdminSubscriptionDisputesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const sp = await searchParams;
  const tab = sp.tab === "resolved" ? "resolved" : "open";

  await requireRole(["ADMIN"]);

  const { data, error } = await supabaseAdmin
    .from("subscription_disputes")
    .select("id, contractor_id, amount_cents, currency, reason, stripe_status, status, admin_note, created_at, resolved_at")
    .order("created_at", { ascending: false });
  if (error) throw error;

  const disputes = data ?? [];
  const contractorIds = [...new Set(disputes.map((d) => d.contractor_id).filter(Boolean))] as string[];
  const { data: contractorRows } = contractorIds.length > 0
    ? await supabaseAdmin.from("contractor_profiles").select("contractor_id, business_name").in("contractor_id", contractorIds)
    : { data: [] as any[] };
  const businessName = new Map((contractorRows ?? []).map((c: any) => [c.contractor_id, c.business_name]));

  const open = disputes.filter((d) => d.status === "OPEN");
  const resolved = disputes.filter((d) => d.status === "RESOLVED");
  const shown = tab === "resolved" ? resolved : open;

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
            Subscription Disputes
          </h1>
          <p style={{ fontSize: "13px", color: "var(--camo-gunmetal)", marginTop: "4px" }}>
            {open.length} open · {resolved.length} resolved
          </p>
        </div>
        <Link href="/dashboard/admin" style={{ background: "transparent", color: "var(--camo-gunmetal)", border: "1px solid #d9dbdb", padding: "8px 16px", borderRadius: "6px", fontFamily: "'Barlow', sans-serif", fontSize: "13px", textDecoration: "none", flexShrink: 0 }}>
          Back
        </Link>
      </div>

      <div style={{ background: "var(--camo-concrete)", border: "1px solid #d9dbdb", borderRadius: "8px", padding: "10px 16px", marginBottom: "20px", fontSize: "12px", color: "var(--camo-gunmetal)" }}>
        ℹ️ These are contractor subscription-charge disputes only — a different, narrower case from the emergency-bid-payment chargeback flow (which auto-suspends the client and isn&apos;t shown here). Full dispute detail and response is in the Stripe Dashboard; this queue exists so a dispute doesn&apos;t go unnoticed.
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
        <Link href="/dashboard/admin/subscription-disputes?tab=open" style={tabStyle(tab === "open")}>
          Open
          {open.length > 0 && (
            <span style={{ marginLeft: "8px", background: tab === "open" ? "#fff" : "var(--camo-accent)", color: tab === "open" ? "var(--camo-accent)" : "var(--camo-ink)", borderRadius: "20px", padding: "1px 7px", fontSize: "11px" }}>
              {open.length}
            </span>
          )}
        </Link>
        <Link href="/dashboard/admin/subscription-disputes?tab=resolved" style={tabStyle(tab === "resolved")}>
          Resolved
        </Link>
      </div>

      {shown.length === 0 ? (
        <div style={{ background: "var(--camo-concrete)", border: "1px solid #d9dbdb", borderRadius: "10px", padding: "24px", textAlign: "center", color: "var(--camo-gunmetal)", fontSize: "14px" }}>
          Nothing here.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {shown.map((d) => (
            <div key={d.id} style={{ background: "var(--camo-concrete)", border: "1px solid #d9dbdb", borderRadius: "10px", padding: "18px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "10px", flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "15px", color: "var(--camo-charcoal)" }}>
                    {d.contractor_id ? (businessName.get(d.contractor_id) ?? "Unknown contractor") : "Unmatched customer"}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--camo-gunmetal)", marginTop: "2px" }}>
                    {fmtMoney(d.amount_cents)} {d.currency} · {d.reason ?? "no reason given"} · {formatDate(d.created_at)}
                  </div>
                </div>
                <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "20px", background: "#FEF2F2", color: "#991B1B", border: "1px solid #FCA5A5" }}>
                  Stripe: {d.stripe_status ?? "unknown"}
                </span>
              </div>

              {d.status === "OPEN" ? (
                <form action={resolveSubscriptionDispute.bind(null, d.id)} style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <input
                    name="note"
                    placeholder="Note (optional) — e.g. resolved manually in Stripe Dashboard"
                    style={{ flex: 1, minWidth: "220px", fontSize: "12px", padding: "8px 10px", borderRadius: "4px", border: "1px solid #d9dbdb", fontFamily: "'Barlow', sans-serif" }}
                  />
                  <button type="submit" style={{ background: "#F0FDF4", color: "#15803D", border: "1px solid #166534", padding: "8px 16px", borderRadius: "6px", fontFamily: "'Barlow', sans-serif", fontWeight: 600, fontSize: "12px", cursor: "pointer" }}>
                    Mark Resolved
                  </button>
                </form>
              ) : (
                <div style={{ fontSize: "12px", color: "var(--camo-gunmetal)" }}>
                  Resolved {d.resolved_at ? formatDate(d.resolved_at) : ""}{d.admin_note ? ` — ${d.admin_note}` : ""}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
