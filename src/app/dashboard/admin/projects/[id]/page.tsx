import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { stateBadge } from "@/lib/ui";

export default async function AdminProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { supabase } = await requireRole(["ADMIN"]);
  const { id: projectId } = await params;

  const { data: project, error } = await supabase
    .from("projects")
    .select("id, title, description, category, city, location_general, state, created_at, deadline_at, published_at, revision_number, client_id, urgent_override, urgent_reason")
    .eq("id", projectId)
    .single();

  if (error || !project) {
    return (
      <div style={{ maxWidth: "700px" }}>
        <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "32px", color: "#fff" }}>
          Project Not Found
        </h1>
        <Link href="/dashboard/admin/projects" style={{ color: "#7A9CC4", textDecoration: "underline", fontSize: "13px", display: "block", marginTop: "16px" }}>
          ← Back to Projects
        </Link>
      </div>
    );
  }

  // Fetch client profile
  const { data: clientProfile } = await supabase
    .from("profiles")
    .select("display_name, company_name, phone, address_city, address_state")
    .eq("id", project.client_id)
    .single();

  // Fetch bids
  const { data: bids } = await supabase
    .from("bids")
    .select("id, contractor_id, status, created_at, updated_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  // Fetch bid versions for amounts
  const bidIds = (bids ?? []).map((b) => b.id);
  const { data: bidVersions } = await supabase
    .from("bid_versions")
    .select("bid_id, amount_cents, version_number")
    .in("bid_id", bidIds.length > 0 ? bidIds : ["none"])
    .order("version_number", { ascending: false });

  // Get latest amount per bid
  const latestAmounts = new Map<string, number>();
  (bidVersions ?? []).forEach((v) => {
    if (!latestAmounts.has(v.bid_id)) {
      latestAmounts.set(v.bid_id, v.amount_cents);
    }
  });

  // Fetch RFIs
  const { data: rfis } = await supabase
    .from("rfis")
    .select("id, catalog_id, question, response, status, created_at, rfi_catalog(code, prompt)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  // Fetch award
  const { data: awardRows } = await supabase
    .from("project_awards")
    .select("bid_id, contractor_id, awarded_at")
    .eq("project_id", projectId)
    .limit(1);

  const award = awardRows?.[0];

  function fmtMoney(cents: number) {
    return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0 })}`;
  }

  const deadline = project.deadline_at ? new Date(project.deadline_at) : null;
  const now = new Date();
  const deadlinePassed = !!deadline && deadline.getTime() <= now.getTime();

  return (
    <div style={{ maxWidth: "700px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h1 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "36px",
            letterSpacing: "1px",
            color: "#fff",
            margin: 0,
          }}>
            {project.title ?? "Untitled Project"}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "8px" }}>
            <span style={stateBadge(project.state)}>{project.state}</span>
            <span style={{ fontSize: "13px", color: "#7A9CC4" }}>
              {project.category ?? "—"} • {project.city ?? "—"}
            </span>
          </div>
        </div>
        <Link
          href="/dashboard/admin/projects"
          style={{
            background: "transparent",
            color: "#7A9CC4",
            border: "1px solid #1B4F8A",
            padding: "8px 16px",
            borderRadius: "6px",
            fontFamily: "'Barlow', sans-serif",
            fontSize: "13px",
            textDecoration: "none",
          }}
        >
          Back
        </Link>
      </div>

      {/* Project details */}
      <div style={{
        background: "#0F2040",
        border: "1px solid #1B4F8A",
        borderRadius: "12px",
        padding: "20px",
        marginBottom: "16px",
      }}>
        <h2 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: "16px",
          letterSpacing: "1px",
          color: "#fff",
          textTransform: "uppercase",
          marginBottom: "14px",
        }}>
          Project Details
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
          {[
            { label: "Created", value: new Date(project.created_at).toLocaleDateString() },
            { label: "Published", value: project.published_at ? new Date(project.published_at).toLocaleDateString() : "—" },
            { label: "Deadline", value: deadline ? `${deadline.toLocaleDateString()} ${deadlinePassed ? "(passed)" : ""}` : "—" },
            { label: "Revision #", value: String(project.revision_number ?? 0) },
          ].map((item) => (
            <div key={item.label}>
              <div style={{ fontSize: "11px", color: "#7A9CC4", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "3px" }}>
                {item.label}
              </div>
              <div style={{ fontSize: "13px", color: "#F0F4FF" }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
        {project.description && (
          <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #1B4F8A" }}>
            <div style={{ fontSize: "11px", color: "#7A9CC4", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>
              Description
            </div>
            <div style={{ fontSize: "13px", color: "#F0F4FF", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
              {project.description}
            </div>
          </div>
        )}
      </div>

      {/* Client info */}
      <div style={{
        background: "#0F2040",
        border: "1px solid #1B4F8A",
        borderRadius: "12px",
        padding: "20px",
        marginBottom: "16px",
      }}>
        <h2 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: "16px",
          letterSpacing: "1px",
          color: "#fff",
          textTransform: "uppercase",
          marginBottom: "14px",
        }}>
          Client
        </h2>
        <div style={{ fontSize: "14px", color: "#F0F4FF", marginBottom: "4px" }}>
          {clientProfile?.display_name ?? clientProfile?.company_name ?? "No name set"}
        </div>
        {clientProfile?.phone && (
          <div style={{ fontSize: "13px", color: "#7A9CC4", marginBottom: "3px" }}>
            📞 {clientProfile.phone}
          </div>
        )}
        {(clientProfile?.address_city || clientProfile?.address_state) && (
          <div style={{ fontSize: "13px", color: "#7A9CC4", marginBottom: "3px" }}>
            📍 {[clientProfile.address_city, clientProfile.address_state].filter(Boolean).join(", ")}
          </div>
        )}
        <Link
          href={`/dashboard/admin/users/${project.client_id}`}
          style={{ fontSize: "12px", color: "#4A7FB5", textDecoration: "underline", display: "block", marginTop: "8px" }}
        >
          View full client profile →
        </Link>
      </div>

      {/* Bids */}
      <div style={{
        background: "#0F2040",
        border: "1px solid #1B4F8A",
        borderRadius: "12px",
        padding: "20px",
        marginBottom: "16px",
      }}>
        <h2 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: "16px",
          letterSpacing: "1px",
          color: "#fff",
          textTransform: "uppercase",
          marginBottom: "14px",
        }}>
          Bids ({(bids ?? []).length})
        </h2>
        {(bids ?? []).length === 0 ? (
          <div style={{ fontSize: "13px", color: "#7A9CC4" }}>No bids submitted yet.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {(bids ?? []).map((b, idx) => {
              const amount = latestAmounts.get(b.id);
              const isAwarded = award?.bid_id === b.id;
              return (
                <div key={b.id} style={{
                  background: "#0A1628",
                  border: `1px solid ${isAwarded ? "#5B21B6" : "#1B4F8A"}`,
                  borderRadius: "8px",
                  padding: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}>
                  <div>
                    <div style={{ fontSize: "13px", color: "#fff", fontWeight: 500, marginBottom: "3px" }}>
                      Bid #{idx + 1}
                      {isAwarded && (
                        <span style={{ marginLeft: "8px", fontSize: "11px", color: "#A78BFA" }}>★ AWARDED</span>
                      )}
                    </div>
                    <div style={{ fontSize: "11px", color: "#3A5A7A" }}>
                      Submitted: {new Date(b.created_at).toLocaleDateString()}
                    </div>
                    <Link
                      href={`/dashboard/admin/users/${b.contractor_id}`}
                      style={{ fontSize: "11px", color: "#4A7FB5", textDecoration: "underline" }}
                    >
                      View contractor →
                    </Link>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: 700,
                      fontSize: "24px",
                      color: "#fff",
                    }}>
                      {amount ? fmtMoney(amount) : "—"}
                    </div>
                    <div style={stateBadge(b.status ?? "DRAFT")}>
                      {b.status ?? "—"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* RFIs */}
      {(rfis ?? []).length > 0 && (
        <div style={{
          background: "#0F2040",
          border: "1px solid #1B4F8A",
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "16px",
        }}>
          <h2 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "16px",
            letterSpacing: "1px",
            color: "#fff",
            textTransform: "uppercase",
            marginBottom: "14px",
          }}>
            RFIs ({(rfis ?? []).length})
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {(rfis ?? []).map((r: any) => (
              <div key={r.id} style={{
                background: "#0A1628",
                border: "1px solid #1B4F8A",
                borderRadius: "8px",
                padding: "14px",
              }}>
                <div style={{ fontSize: "13px", color: "#fff", fontWeight: 500, marginBottom: "6px" }}>
                  {r.rfi_catalog?.prompt ?? "Question"}
                </div>
                {r.question && (
                  <div style={{ fontSize: "12px", color: "#7A9CC4", marginBottom: "8px" }}>
                    {r.question}
                  </div>
                )}
                {r.response ? (
                  <div style={{ fontSize: "12px", color: "#4ADE80" }}>
                    ✅ {r.response}
                  </div>
                ) : (
                  <div style={{ fontSize: "12px", color: "#FBBF24" }}>
                    ⏳ Awaiting response
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Award info */}
      {award && (
        <div style={{
          background: "#2D1B69",
          border: "1px solid #5B21B6",
          borderRadius: "12px",
          padding: "20px",
        }}>
          <h2 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "16px",
            letterSpacing: "1px",
            color: "#A78BFA",
            textTransform: "uppercase",
            marginBottom: "10px",
          }}>
            ★ Award
          </h2>
          <div style={{ fontSize: "13px", color: "#7A9CC4" }}>
            Awarded: {new Date(award.awarded_at).toLocaleDateString()}
          </div>
          <Link
            href={`/dashboard/admin/users/${award.contractor_id}`}
            style={{ fontSize: "12px", color: "#A78BFA", textDecoration: "underline", display: "block", marginTop: "6px" }}
          >
            View awarded contractor →
          </Link>
        </div>
      )}
    </div>
  );
}