import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { moderateDismissalReason } from "./actions";

type DismissalRow = {
  id: string;
  project_id: string;
  contractor_id: string;
  reason_code: string | null;
  reason_other_text: string | null;
  dismissed_at: string;
  dismissed_by: string;
  contains_profanity: boolean;
  moderation_status: string;
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString();
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

export default async function AdminDismissalsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const sp = await searchParams;
  const tab = sp.tab === "flagged" ? "flagged" : "pending";

  await requireRole(["ADMIN"]);

  const { data, error } = await supabaseAdmin
    .from("bid_dismissals")
    .select("id, project_id, contractor_id, reason_code, reason_other_text, dismissed_at, dismissed_by, contains_profanity, moderation_status")
    .order("dismissed_at", { ascending: false });
  if (error) throw error;

  const dismissals = (data ?? []) as DismissalRow[];
  const pending = dismissals.filter((d) => d.moderation_status === "pending_review");
  const flagged = dismissals.filter((d) => d.contains_profanity);

  // Lookups for display — projects, contractors, clients
  const projectIds = [...new Set(dismissals.map((d) => d.project_id))];
  const contractorIds = [...new Set(dismissals.map((d) => d.contractor_id))];
  const clientIds = [...new Set(dismissals.map((d) => d.dismissed_by))];

  const [{ data: projectRows }, { data: contractorRows }, { data: clientRows }] = await Promise.all([
    projectIds.length > 0
      ? supabaseAdmin.from("projects").select("id, title").in("id", projectIds)
      : Promise.resolve({ data: [] as any[] }),
    contractorIds.length > 0
      ? supabaseAdmin.from("contractor_profiles").select("contractor_id, business_name").in("contractor_id", contractorIds)
      : Promise.resolve({ data: [] as any[] }),
    clientIds.length > 0
      ? supabaseAdmin.from("profiles").select("id, display_name").in("id", clientIds)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const projectTitle = new Map((projectRows ?? []).map((p: any) => [p.id, p.title]));
  const contractorName = new Map((contractorRows ?? []).map((c: any) => [c.contractor_id, c.business_name]));
  const clientName = new Map((clientRows ?? []).map((c: any) => [c.id, c.display_name]));

  // Group flagged content by client for pattern-tracking
  const flaggedByClient = new Map<string, DismissalRow[]>();
  flagged.forEach((d) => {
    const list = flaggedByClient.get(d.dismissed_by) ?? [];
    list.push(d);
    flaggedByClient.set(d.dismissed_by, list);
  });
  const flaggedClients = [...flaggedByClient.entries()].sort((a, b) => b[1].length - a[1].length);

  return (
    <div>
      <div className="mob-col mob-gap-sm" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "36px", letterSpacing: "1px", color: "var(--camo-charcoal)", margin: 0 }}>
            Dismissal Content Review
          </h1>
          <p style={{ fontSize: "13px", color: "var(--camo-gunmetal)", marginTop: "4px" }}>
            {pending.length} pending review · {flaggedClients.length} client{flaggedClients.length !== 1 ? "s" : ""} with flagged content
          </p>
        </div>
        <Link href="/dashboard/admin" style={{ background: "transparent", color: "var(--camo-gunmetal)", border: "1px solid #d9dbdb", padding: "8px 16px", borderRadius: "6px", fontFamily: "'Barlow', sans-serif", fontSize: "13px", textDecoration: "none", flexShrink: 0 }}>
          Back
        </Link>
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
        <Link href="/dashboard/admin/dismissals?tab=pending" style={tabStyle(tab === "pending")}>
          ⏳ Pending Review
          {pending.length > 0 && (
            <span style={{ marginLeft: "8px", background: tab === "pending" ? "#fff" : "var(--camo-accent)", color: tab === "pending" ? "var(--camo-accent)" : "var(--camo-ink)", borderRadius: "20px", padding: "1px 7px", fontSize: "11px" }}>
              {pending.length}
            </span>
          )}
        </Link>
        <Link href="/dashboard/admin/dismissals?tab=flagged" style={tabStyle(tab === "flagged")}>
          🚩 Flagged Content
          {flaggedClients.length > 0 && (
            <span style={{ marginLeft: "8px", background: tab === "flagged" ? "#fff" : "var(--camo-accent)", color: tab === "flagged" ? "var(--camo-accent)" : "var(--camo-ink)", borderRadius: "20px", padding: "1px 7px", fontSize: "11px" }}>
              {flaggedClients.length}
            </span>
          )}
        </Link>
      </div>

      {/* ── Pending Review — discriminatory/sensitive content held from delivery ── */}
      {tab === "pending" && (
        <div>
          <div style={{ background: "var(--camo-concrete)", border: "1px solid #d9dbdb", borderRadius: "8px", padding: "10px 16px", marginBottom: "20px", fontSize: "12px", color: "var(--camo-gunmetal)" }}>
            ℹ️ This text was held because it matched discriminatory/sensitive language, not general profanity. Approving delivers it to the contractor as a follow-up; rejecting means it&apos;s never sent.
          </div>

          {pending.length === 0 ? (
            <div style={{ background: "var(--camo-concrete)", border: "1px solid #d9dbdb", borderRadius: "10px", padding: "24px", textAlign: "center", color: "var(--camo-gunmetal)", fontSize: "14px" }}>
              Nothing pending review.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {pending.map((d) => (
                <div key={d.id} style={{ background: "var(--camo-concrete)", border: "1px solid #FCD34D", borderRadius: "10px", padding: "18px" }}>
                  <div style={{ fontSize: "12px", color: "var(--camo-gunmetal)", marginBottom: "8px" }}>
                    <strong style={{ color: "var(--camo-charcoal)" }}>{clientName.get(d.dismissed_by) ?? "Unknown client"}</strong>{" "}
                    dismissed a bid from <strong style={{ color: "var(--camo-charcoal)" }}>{contractorName.get(d.contractor_id) ?? "Unknown contractor"}</strong>{" "}
                    on <strong style={{ color: "var(--camo-charcoal)" }}>{projectTitle.get(d.project_id) ?? "Unknown project"}</strong> — {formatDate(d.dismissed_at)}
                    {d.contains_profanity && (
                      <span style={{ marginLeft: "8px", fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "20px", background: "#FEF2F2", color: "#991B1B", border: "1px solid #FCA5A5" }}>
                        Also flagged for profanity — will not be delivered even if approved
                      </span>
                    )}
                  </div>
                  <div style={{ background: "#FFFFFF", border: "1px solid #d9dbdb", borderRadius: "6px", padding: "12px 14px", marginBottom: "14px", fontSize: "13px", color: "var(--camo-charcoal)", fontStyle: "italic" }}>
                    &quot;{d.reason_other_text}&quot;
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <form action={moderateDismissalReason.bind(null, d.id, "approve")}>
                      <button type="submit" style={{ background: "#F0FDF4", color: "#15803D", border: "1px solid #166534", padding: "8px 20px", borderRadius: "6px", fontFamily: "'Barlow', sans-serif", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}>
                        ✅ Approve & Deliver
                      </button>
                    </form>
                    <form action={moderateDismissalReason.bind(null, d.id, "reject")}>
                      <button type="submit" style={{ background: "#FEF2F2", color: "#991B1B", border: "1px solid #FCA5A5", padding: "8px 20px", borderRadius: "6px", fontFamily: "'Barlow', sans-serif", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}>
                        ✗ Reject — Never Deliver
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Flagged Content — profanity, grouped by client for pattern-tracking ── */}
      {tab === "flagged" && (
        <div>
          <div style={{ background: "var(--camo-concrete)", border: "1px solid #d9dbdb", borderRadius: "8px", padding: "10px 16px", marginBottom: "20px", fontSize: "12px", color: "var(--camo-gunmetal)" }}>
            ℹ️ This content never reached the contractor either way — it&apos;s shown here purely so you can track a client&apos;s pattern of behavior over time and decide whether account-level action is warranted.
          </div>

          {flaggedClients.length === 0 ? (
            <div style={{ background: "var(--camo-concrete)", border: "1px solid #d9dbdb", borderRadius: "10px", padding: "24px", textAlign: "center", color: "var(--camo-gunmetal)", fontSize: "14px" }}>
              No flagged content.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {flaggedClients.map(([clientId, items]) => (
                <div key={clientId} style={{ background: "var(--camo-concrete)", border: "1px solid #d9dbdb", borderRadius: "10px", padding: "18px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "14px", flexWrap: "wrap" }}>
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "16px", color: "var(--camo-charcoal)" }}>
                      {clientName.get(clientId) ?? "Unknown client"}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{
                        fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "20px",
                        background: items.length >= 3 ? "#FEF2F2" : "#FFFBEB",
                        color: items.length >= 3 ? "#991B1B" : "#92400E",
                        border: `1px solid ${items.length >= 3 ? "#FCA5A5" : "#FCD34D"}`,
                      }}>
                        {items.length} flagged incident{items.length !== 1 ? "s" : ""}
                      </span>
                      <Link href={`/dashboard/admin/users/${clientId}`} style={{ fontSize: "12px", color: "var(--camo-gunmetal)", textDecoration: "underline" }}>
                        View account →
                      </Link>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {items.map((d) => (
                      <div key={d.id} style={{ background: "#FFFFFF", border: "1px solid #d9dbdb", borderRadius: "6px", padding: "10px 14px", fontSize: "12px" }}>
                        <div style={{ color: "var(--camo-gunmetal)", marginBottom: "4px" }}>
                          Dismissed a bid from <strong>{contractorName.get(d.contractor_id) ?? "Unknown contractor"}</strong> on{" "}
                          <strong>{projectTitle.get(d.project_id) ?? "Unknown project"}</strong> — {formatDate(d.dismissed_at)}
                        </div>
                        <div style={{ color: "var(--camo-charcoal)", fontStyle: "italic" }}>&quot;{d.reason_other_text}&quot;</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
