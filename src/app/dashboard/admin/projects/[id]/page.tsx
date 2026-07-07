import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { stateBadge } from "@/lib/ui";
import { sendAdminMessage } from "./messages/actions";

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
        <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "32px", color: "#1E3A8A" }}>
          Project Not Found
        </h1>
        <Link href="/dashboard/admin/projects" style={{ color: "#1B4F8A", textDecoration: "underline", fontSize: "13px", display: "block", marginTop: "16px" }}>
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

  // Fetch bids (admin client bypasses RLS — bids are only readable by the contractor who owns them)
  const { data: bids } = await supabaseAdmin
    .from("bids")
    .select("id, contractor_id, status, created_at, updated_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  // Fetch bid versions for amounts
  const bidIds = (bids ?? []).map((b) => b.id);
  const { data: bidVersions } = await supabaseAdmin
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

  // Fetch messages if AWARDED
  type MessageRow = {
    id: string;
    sender_id: string;
    sender_role: string;
    body: string;
    created_at: string;
    sender_name: string;
  };
  let projectMessages: MessageRow[] = [];

  if (project.state === "AWARDED") {
    const { data: rawMessages } = await supabaseAdmin
      .from("project_messages")
      .select("id, sender_id, sender_role, body, created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });

    if (rawMessages && rawMessages.length > 0) {
      const senderIds = [...new Set((rawMessages as any[]).map((m) => m.sender_id))];
      const { data: senderProfiles } = await supabaseAdmin
        .from("profiles")
        .select("id, display_name")
        .in("id", senderIds);

      const nameMap = new Map<string, string>();
      (senderProfiles ?? []).forEach((p: any) => nameMap.set(p.id, p.display_name || "ONP User"));

      projectMessages = (rawMessages as any[]).map((m) => ({
        ...m,
        sender_name: nameMap.get(m.sender_id) ?? "ONP User",
      }));
    }
  }

  function fmtMoney(cents: number) {
    return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0 })}`;
  }

  const deadline = project.deadline_at ? new Date(project.deadline_at) : null;
  const now = new Date();
  const deadlinePassed = !!deadline && deadline.getTime() <= now.getTime();

  return (
    <div style={{ maxWidth: "700px" }}>
      {/* Header */}
      <div className="mob-col mob-gap-sm" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h1 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "36px",
            letterSpacing: "1px",
            color: "#1E3A8A",
            margin: 0,
          }}>
            {project.title ?? "Untitled Project"}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "8px" }}>
            <span style={stateBadge(project.state)}>{project.state}</span>
            <span style={{ fontSize: "13px", color: "#1B4F8A" }}>
              {project.category ?? "—"} • {project.city ?? "—"}
            </span>
          </div>
        </div>
        <Link
          href="/dashboard/admin/projects"
          style={{
            background: "transparent",
            color: "#1B4F8A",
            border: "1px solid #B8D0E8",
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
        background: "#EEF4FF",
        border: "1px solid #B8D0E8",
        borderRadius: "12px",
        padding: "20px",
        marginBottom: "16px",
      }}>
        <h2 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: "16px",
          letterSpacing: "1px",
          color: "#1E3A8A",
          textTransform: "uppercase",
          marginBottom: "14px",
        }}>
          Project Details
        </h2>
        <div className="mob-grid-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
          {[
            { label: "Created", value: new Date(project.created_at).toLocaleDateString() },
            { label: "Published", value: project.published_at ? new Date(project.published_at).toLocaleDateString() : "—" },
            { label: "Deadline", value: deadline ? `${deadline.toLocaleDateString()} ${deadlinePassed ? "(passed)" : ""}` : "—" },
            { label: "Revision #", value: String(project.revision_number ?? 0) },
          ].map((item) => (
            <div key={item.label}>
              <div style={{ fontSize: "11px", color: "#1B4F8A", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "3px" }}>
                {item.label}
              </div>
              <div style={{ fontSize: "13px", color: "#1E3A8A" }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
        {project.description && (
          <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #B8D0E8" }}>
            <div style={{ fontSize: "11px", color: "#1B4F8A", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>
              Description
            </div>
            <div style={{ fontSize: "13px", color: "#1E3A8A", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
              {project.description}
            </div>
          </div>
        )}
      </div>

      {/* Client info */}
      <div style={{
        background: "#EEF4FF",
        border: "1px solid #B8D0E8",
        borderRadius: "12px",
        padding: "20px",
        marginBottom: "16px",
      }}>
        <h2 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: "16px",
          letterSpacing: "1px",
          color: "#1E3A8A",
          textTransform: "uppercase",
          marginBottom: "14px",
        }}>
          Client
        </h2>
        <div style={{ fontSize: "14px", color: "#1E3A8A", marginBottom: "4px" }}>
          {clientProfile?.display_name ?? clientProfile?.company_name ?? "No name set"}
        </div>
        {clientProfile?.phone && (
          <div style={{ fontSize: "13px", color: "#1B4F8A", marginBottom: "3px" }}>
            📞 {clientProfile.phone}
          </div>
        )}
        {(clientProfile?.address_city || clientProfile?.address_state) && (
          <div style={{ fontSize: "13px", color: "#1B4F8A", marginBottom: "3px" }}>
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
        background: "#EEF4FF",
        border: "1px solid #B8D0E8",
        borderRadius: "12px",
        padding: "20px",
        marginBottom: "16px",
      }}>
        <h2 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: "16px",
          letterSpacing: "1px",
          color: "#1E3A8A",
          textTransform: "uppercase",
          marginBottom: "14px",
        }}>
          Bids ({(bids ?? []).length})
        </h2>
        {(bids ?? []).length === 0 ? (
          <div style={{ fontSize: "13px", color: "#1B4F8A" }}>No bids submitted yet.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {(bids ?? []).map((b, idx) => {
              const amount = latestAmounts.get(b.id);
              const isAwarded = award?.bid_id === b.id;
              return (
                <div key={b.id} className="mob-card-stack" style={{
                  background: "#FFFFFF",
                  border: `1px solid ${isAwarded ? "#1B4F8A" : "#B8D0E8"}`,
                  borderRadius: "8px",
                  padding: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}>
                  <div>
                    <div style={{ fontSize: "13px", color: "#1E3A8A", fontWeight: 500, marginBottom: "3px" }}>
                      Bid #{idx + 1}
                      {isAwarded && (
                        <span style={{ marginLeft: "8px", fontSize: "11px", color: "#1B4F8A" }}>★ AWARDED</span>
                      )}
                    </div>
                    <div style={{ fontSize: "11px", color: "#4A7FB5" }}>
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
                      color: "#1E3A8A",
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
          background: "#EEF4FF",
          border: "1px solid #B8D0E8",
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "16px",
        }}>
          <h2 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "16px",
            letterSpacing: "1px",
            color: "#1E3A8A",
            textTransform: "uppercase",
            marginBottom: "14px",
          }}>
            RFIs ({(rfis ?? []).length})
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {(rfis ?? []).map((r: any) => (
              <div key={r.id} style={{
                background: "#FFFFFF",
                border: "1px solid #B8D0E8",
                borderRadius: "8px",
                padding: "14px",
              }}>
                <div style={{ fontSize: "13px", color: "#1E3A8A", fontWeight: 500, marginBottom: "6px" }}>
                  {r.rfi_catalog?.prompt ?? "Question"}
                </div>
                {r.question && (
                  <div style={{ fontSize: "12px", color: "#1B4F8A", marginBottom: "8px" }}>
                    {r.question}
                  </div>
                )}
                {r.response ? (
                  <div style={{ fontSize: "12px", color: "#15803D" }}>
                    ✅ {r.response}
                  </div>
                ) : (
                  <div style={{ fontSize: "12px", color: "#92400E" }}>
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
          background: "#EEF4FF",
          border: "1px solid #1B4F8A",
          borderRadius: "12px",
          padding: "20px",
        }}>
          <h2 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "16px",
            letterSpacing: "1px",
            color: "#1B4F8A",
            textTransform: "uppercase",
            marginBottom: "10px",
          }}>
            ★ Award
          </h2>
          <div style={{ fontSize: "13px", color: "#1B4F8A" }}>
            Awarded: {new Date(award.awarded_at).toLocaleDateString()}
          </div>
          <Link
            href={`/dashboard/admin/users/${award.contractor_id}`}
            style={{ fontSize: "12px", color: "#4A7FB5", textDecoration: "underline", display: "block", marginTop: "6px" }}
          >
            View awarded contractor →
          </Link>
        </div>
      )}

      {/* ── Post-Award Messages (Admin View) ── */}
      {project.state === "AWARDED" && (
        <div
          id="messages"
          style={{
            background: "#EEF4FF",
            border: "1px solid #B8D0E8",
            borderRadius: "12px",
            overflow: "hidden",
            marginTop: "20px",
          }}
        >
          {/* Section header */}
          <div
            style={{
              background: "#1E3A8A",
              padding: "14px 20px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <span style={{ fontSize: "18px" }}>💬</span>
            <div>
              <div
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 700,
                  fontSize: "16px",
                  letterSpacing: "1px",
                  color: "#FFFFFF",
                  textTransform: "uppercase",
                }}
              >
                Project Messages
              </div>
              <div style={{ fontSize: "11px", color: "#7A9CC4", marginTop: "1px" }}>
                Admin view — full thread between client, contractor, and ONP
              </div>
            </div>
          </div>

          {/* Message list */}
          <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "12px" }}>
            {projectMessages.length === 0 ? (
              <div
                style={{
                  fontSize: "13px",
                  color: "#4A7FB5",
                  textAlign: "center",
                  padding: "24px 0",
                  fontStyle: "italic",
                }}
              >
                No messages yet on this project.
              </div>
            ) : (
              projectMessages.map((msg) => {
                const isAdmin = msg.sender_role === "ADMIN";
                const roleBadgeColor =
                  msg.sender_role === "CLIENT"
                    ? { bg: "#EEF4FF", color: "#1B4F8A", border: "#B8D0E8" }
                    : msg.sender_role === "ADMIN"
                    ? { bg: "#FFF7ED", color: "#92400E", border: "#FCD34D" }
                    : { bg: "#F0FDF4", color: "#15803D", border: "#86EFAC" };

                return (
                  <div
                    key={msg.id}
                    style={{
                      display: "flex",
                      flexDirection: isAdmin ? "row-reverse" : "row",
                      gap: "10px",
                      alignItems: "flex-start",
                    }}
                  >
                    <div
                      style={{
                        maxWidth: "80%",
                        background: isAdmin ? "#FFF7ED" : "#FFFFFF",
                        border: `1px solid ${isAdmin ? "#FCD34D" : "#B8D0E8"}`,
                        borderRadius: isAdmin ? "12px 2px 12px 12px" : "2px 12px 12px 12px",
                        padding: "10px 14px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom: "6px",
                          flexWrap: "wrap",
                        }}
                      >
                        <span style={{ fontSize: "12px", fontWeight: 700, color: "#1E3A8A" }}>
                          {msg.sender_name}
                        </span>
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: 700,
                            padding: "1px 7px",
                            borderRadius: "20px",
                            background: roleBadgeColor.bg,
                            color: roleBadgeColor.color,
                            border: `1px solid ${roleBadgeColor.border}`,
                          }}
                        >
                          {msg.sender_role === "ADMIN" ? "ONP" : msg.sender_role}
                        </span>
                        <span style={{ fontSize: "10px", color: "#9CA3AF" }}>
                          {new Date(msg.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}{" "}
                          {new Date(msg.created_at).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#1E3A8A",
                          lineHeight: 1.6,
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                        }}
                      >
                        {msg.body}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Admin send form */}
          <div
            style={{
              borderTop: "1px solid #B8D0E8",
              padding: "16px 20px",
              background: "#FFFBEB",
            }}
          >
            <div style={{ fontSize: "11px", color: "#92400E", marginBottom: "8px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px" }}>
              Send as ONP Support
            </div>
            <form action={sendAdminMessage.bind(null, projectId)}>
              <textarea
                name="body"
                required
                maxLength={2000}
                rows={3}
                placeholder="Type your message to the client and contractor…"
                style={{
                  width: "100%",
                  background: "#FFFFFF",
                  border: "1px solid #FCD34D",
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
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: "10px",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                <span style={{ fontSize: "11px", color: "#92400E" }}>
                  Visible to client and contractor as a message from ONP
                </span>
                <button
                  type="submit"
                  style={{
                    background: "#D97706",
                    color: "#FFFFFF",
                    border: "none",
                    padding: "9px 22px",
                    borderRadius: "6px",
                    fontFamily: "'Barlow', sans-serif",
                    fontWeight: 600,
                    fontSize: "13px",
                    cursor: "pointer",
                    letterSpacing: "0.5px",
                  }}
                >
                  Send as ONP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
