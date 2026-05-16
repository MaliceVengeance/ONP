import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { submitBid } from "@/app/dashboard/contractor/bids/actions";
import CountdownTimer from "@/components/CountdownTimer";
import { stateBadge } from "@/lib/ui";
import ProjectFileLink from "./ProjectFileLink";
import ProjectMap from "@/components/ProjectMap";

type ProjectDetail = {
  id: string;
  title: string | null;
  description: string | null;
  category: string | null;
  location_general: string | null;
  state: string;
  deadline_at: string | null;
  published_at: string | null;
  revision_number: number | null;
  created_at: string | null;
  updated_at: string | null;
};

type ExistingBid = {
  id: string;
  amount_cents: number;
  notes: string | null;
  version_number: number;
  submitted_at: string | null;
};

export default async function ContractorProjectDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ bid?: string }>;
}) {
  const { supabase, user } = await requireRole(["CONTRACTOR", "ADMIN"]);
  const { id: projectId } = await params;
  const sp = await searchParams;
  const bidSubmitted = sp.bid === "ok";

  // Check subscription status
  const { data: subData } = await supabase
    .from("contractor_subscriptions")
    .select("status")
    .eq("contractor_id", user.id)
    .maybeSingle();

  const isSubscribed = subData?.status === "ACTIVE" || subData?.status === "TRIALING";

  const { data: rows, error: pErr } = await supabase.rpc(
    "get_open_project_detail",
    { p_project_id: projectId }
  );

  const project = (rows as ProjectDetail[] | null)?.[0];

  if (pErr || !project) {
    return (
      <div style={{ maxWidth: "700px" }}>
        <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "32px", color: "#fff" }}>
          Project Not Found
        </h1>
        <div style={{ background: "#0F2040", border: "1px solid #1B4F8A", borderRadius: "10px", padding: "20px", marginTop: "16px", fontSize: "14px", color: "#7A9CC4" }}>
          This project may be closed, unpublished, or you may not have access.
        </div>
        <Link href="/dashboard/contractor/projects" style={{ color: "#7A9CC4", textDecoration: "underline", fontSize: "13px", display: "block", marginTop: "16px" }}>
          ← Back to Open Projects
        </Link>
      </div>
    );
  }

  const { data: bidRow } = await supabase
    .from("bids")
    .select("id")
    .eq("project_id", projectId)
    .eq("contractor_id", user.id)
    .maybeSingle();

  let existingBid: ExistingBid | null = null;

  if (bidRow?.id) {
    const { data: versionRow } = await supabase
      .from("bid_versions")
      .select("id, amount_cents, notes, version_number, submitted_at")
      .eq("bid_id", bidRow.id)
      .order("version_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (versionRow) existingBid = versionRow as ExistingBid;
  }

  const { data: rfiData } = await supabase
    .from("rfis")
    .select("id, response")
    .eq("project_id", projectId);

  const totalRfis = rfiData?.length ?? 0;
  const answeredRfis = rfiData?.filter((r) => r.response)?.length ?? 0;

  const { data: projectFiles } = await supabase.storage
    .from("project-files")
    .list(projectId, {
      sortBy: { column: "created_at", order: "desc" },
    });

  const deadline = project.deadline_at ? new Date(project.deadline_at) : null;
  const now = new Date();
  const isOpen = project.state === "OPEN";
  const beforeDeadline = !!deadline && deadline.getTime() > now.getTime();
  const canBid = isOpen && beforeDeadline && isSubscribed;

  const { data: awardRows } = await supabase
    .from("project_awards")
    .select("project_id, awarded_at")
    .eq("project_id", projectId)
    .limit(1);

  const award = awardRows?.[0];

  const { data: clientInfoRows } = await supabase.rpc(
    "get_awarded_project_client_info",
    { p_project_id: projectId }
  );

  const clientInfo = (clientInfoRows as any[])?.[0] ?? null;

  function fmtMoney(cents: number) {
    return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0 })}`;
  }

  const inputStyle = {
    width: "100%",
    background: "#0A1628",
    border: "1px solid #1B4F8A",
    color: "#F0F4FF",
    borderRadius: "6px",
    padding: "10px 14px",
    fontFamily: "'Barlow', sans-serif",
    fontSize: "14px",
    outline: "none",
    marginTop: "6px",
  } as React.CSSProperties;

  const labelStyle = {
    display: "block",
    fontSize: "11px",
    fontWeight: 500,
    color: "#7A9CC4",
    textTransform: "uppercase" as const,
    letterSpacing: "1px",
    marginTop: "16px",
  };

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
            <span style={{ fontSize: "13px", color: "#7A9CC4" }}>
              {project.category ?? "—"} • {project.location_general ?? "—"}
            </span>
            <span style={stateBadge(project.state)}>{project.state}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
          <Link
            href={`/dashboard/contractor/projects/${projectId}/rfis`}
            style={{
              background: totalRfis > 0 ? "#0D2040" : "transparent",
              color: answeredRfis < totalRfis ? "#FBBF24" : "#7A9CC4",
              border: `1px solid ${answeredRfis < totalRfis ? "#92400E" : "#1B4F8A"}`,
              padding: "8px 16px",
              borderRadius: "6px",
              fontFamily: "'Barlow', sans-serif",
              fontSize: "13px",
              textDecoration: "none",
            }}
          >
            {totalRfis > 0
              ? `Questions (${answeredRfis}/${totalRfis} answered)`
              : "Questions"}
          </Link>
          <Link
            href="/dashboard/contractor/projects"
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
      </div>

      {/* Countdown timer */}
      {isOpen && project.deadline_at && (
        <div style={{ marginBottom: "20px" }}>
          <CountdownTimer deadline={project.deadline_at} />
        </div>
      )}

      {/* Project info */}
      <div style={{
        background: "#0F2040",
        border: "1px solid #1B4F8A",
        borderRadius: "10px",
        padding: "18px",
        marginBottom: "16px",
        display: "flex",
        gap: "24px",
        flexWrap: "wrap",
      }}>
        <div>
          <div style={{ fontSize: "11px", color: "#7A9CC4", textTransform: "uppercase", letterSpacing: "1px" }}>Published</div>
          <div style={{ fontSize: "14px", color: "#fff", marginTop: "2px" }}>
            {project.published_at ? new Date(project.published_at).toLocaleDateString() : "—"}
          </div>
        </div>
        <div>
          <div style={{ fontSize: "11px", color: "#7A9CC4", textTransform: "uppercase", letterSpacing: "1px" }}>Deadline</div>
          <div style={{ fontSize: "14px", color: "#fff", marginTop: "2px" }}>
            {deadline ? deadline.toLocaleDateString() : "—"}
          </div>
        </div>
        <div>
          <div style={{ fontSize: "11px", color: "#7A9CC4", textTransform: "uppercase", letterSpacing: "1px" }}>Category</div>
          <div style={{ fontSize: "14px", color: "#fff", marginTop: "2px" }}>
            {project.category ?? "—"}
          </div>
        </div>
      </div>

      {/* Description */}
      {project.description && (
        <div style={{
          background: "#0F2040",
          border: "1px solid #1B4F8A",
          borderRadius: "10px",
          padding: "18px",
          marginBottom: "16px",
          fontSize: "14px",
          color: "#F0F4FF",
          lineHeight: 1.7,
          whiteSpace: "pre-wrap",
        }}>
          {project.description}
        </div>
      )}

      {/* General area map */}
      {project.location_general && (
        <ProjectMap
          city={project.location_general.split(",")[0]?.trim() ?? ""}
          state={project.location_general.split(",")[1]?.trim() ?? ""}
        />
      )}

      {/* Project files */}
      {(projectFiles ?? []).length > 0 && (
        <div style={{
          background: "#0F2040",
          border: "1px solid #1B4F8A",
          borderRadius: "10px",
          padding: "18px",
          marginBottom: "16px",
        }}>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "16px",
            letterSpacing: "1px",
            color: "#fff",
            textTransform: "uppercase",
            marginBottom: "12px",
          }}>
            📁 Project Files ({projectFiles?.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {projectFiles?.map((file) => (
              <ProjectFileLink
                key={file.name}
                projectId={projectId}
                fileName={file.name}
              />
            ))}
          </div>
        </div>
      )}

      {/* Platform rules */}
      <div style={{
        background: "#0A1628",
        border: "1px solid #1B4F8A",
        borderRadius: "10px",
        padding: "16px 18px",
        marginBottom: "16px",
      }}>
        <div style={{ fontSize: "11px", fontWeight: 600, color: "#7A9CC4", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "10px" }}>
          Platform Rules
        </div>
        <div style={{ fontSize: "13px", color: "#4ADE80", marginBottom: "6px" }}>
          ✅ The contractor is responsible for pulling all required permits.
        </div>
        <div style={{ fontSize: "13px", color: "#4ADE80" }}>
          ✅ The contractor is responsible for all debris removal and disposal.
        </div>
      </div>

      {/* Awarded banner */}
      {project.state === "AWARDED" && (
        <div style={{
          background: "#2D1B69",
          border: "1px solid #5B21B6",
          borderRadius: "10px",
          padding: "18px",
          marginBottom: "16px",
        }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "20px", color: "#A78BFA", marginBottom: "6px" }}>
            ★ This project has been awarded
          </div>
          {award?.awarded_at && (
            <div style={{ fontSize: "13px", color: "#7A9CC4", marginBottom: "12px" }}>
              Awarded: {new Date(award.awarded_at).toLocaleString()}
            </div>
          )}
          {clientInfo ? (
            <div style={{
              background: "#1B1040",
              border: "1px solid #4C1D95",
              borderRadius: "8px",
              padding: "16px",
              marginTop: "12px",
            }}>
              <div style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: "14px",
                letterSpacing: "1px",
                color: "#A78BFA",
                textTransform: "uppercase",
                marginBottom: "10px",
              }}>
                Client Contact Information
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px" }}>
                {clientInfo.client_name && (
                  <div>
                    <span style={{ color: "#7A9CC4" }}>Name: </span>
                    <span style={{ color: "#F0F4FF" }}>{clientInfo.client_name}</span>
                  </div>
                )}
                {clientInfo.client_email && (
                  <div>
                    <span style={{ color: "#7A9CC4" }}>Email: </span>
                    <a href={`mailto:${clientInfo.client_email}`} style={{ color: "#60A5FA" }}>
                      {clientInfo.client_email}
                    </a>
                  </div>
                )}
                {clientInfo.client_phone && (
                  <div>
                    <span style={{ color: "#7A9CC4" }}>Phone: </span>
                    <a href={`tel:${clientInfo.client_phone}`} style={{ color: "#60A5FA" }}>
                      {clientInfo.client_phone}
                    </a>
                  </div>
                )}
                {clientInfo.client_address && clientInfo.client_address.trim() !== "" && (
                  <div>
                    <span style={{ color: "#7A9CC4" }}>Address: </span>
                    <span style={{ color: "#F0F4FF" }}>{clientInfo.client_address}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: "13px", color: "#7A9CC4", marginTop: "8px" }}>
              Bidding is closed. You can no longer submit or revise bids.
            </div>
          )}
        </div>
      )}

      {/* Success banner */}
      {bidSubmitted && (
        <div style={{
          background: "#0D3320",
          border: "1px solid #166534",
          color: "#4ADE80",
          padding: "14px 18px",
          borderRadius: "8px",
          fontSize: "13px",
          marginBottom: "16px",
        }}>
          ✅ Your bid was submitted successfully.
        </div>
      )}

      {/* Existing bid summary */}
      {existingBid && (
        <div style={{
          background: "#0F2040",
          border: "1px solid #1B4F8A",
          borderRadius: "10px",
          padding: "18px",
          marginBottom: "16px",
        }}>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "16px",
            color: "#7A9CC4",
            textTransform: "uppercase",
            letterSpacing: "1px",
            marginBottom: "12px",
          }}>
            Your Current Bid
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "8px" }}>
            <span style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: "32px",
              color: "#fff",
            }}>
              {fmtMoney(existingBid.amount_cents)}
            </span>
            <span style={{ fontSize: "12px", color: "#7A9CC4" }}>
              v{existingBid.version_number}
              {existingBid.submitted_at ? ` • ${new Date(existingBid.submitted_at).toLocaleDateString()}` : ""}
            </span>
          </div>
          {existingBid.notes && (
            <div style={{
              background: "#0A1628",
              border: "1px solid #1B4F8A",
              borderRadius: "6px",
              padding: "10px 12px",
              fontSize: "13px",
              color: "#7A9CC4",
            }}>
              <span style={{ color: "#4A7FB5", fontWeight: 600 }}>Notes: </span>
              {existingBid.notes}
            </div>
          )}
        </div>
      )}

      {/* Bid form or subscription gate */}
      {canBid ? (
        <div style={{
          background: "#0F2040",
          border: "1px solid #1B4F8A",
          borderRadius: "12px",
          padding: "24px",
        }}>
          <h2 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "20px",
            letterSpacing: "1px",
            color: "#fff",
            textTransform: "uppercase",
            marginBottom: "4px",
          }}>
            {existingBid ? "Revise Your Bid" : "Submit a Bid"}
          </h2>
          <p style={{ fontSize: "12px", color: "#7A9CC4", marginBottom: "4px" }}>
            Bids are sealed until the deadline. You can revise anytime before it closes.
          </p>
          <form action={submitBid.bind(null, projectId)}>
            <label style={{ ...labelStyle, marginTop: "16px" }}>Bid Amount (USD)</label>
            <input
              name="amount"
              style={inputStyle}
              placeholder="e.g. 25000"
              defaultValue={existingBid ? (existingBid.amount_cents / 100).toFixed(2) : ""}
              required
            />
            <label style={labelStyle}>Notes (optional)</label>
            <textarea
              name="notes"
              style={{ ...inputStyle, minHeight: "90px", resize: "vertical" }}
              placeholder="Clarifying assumptions, schedule notes, material preferences…"
              defaultValue={existingBid?.notes ?? ""}
            />
            <button
              type="submit"
              style={{
                marginTop: "20px",
                background: "#C8102E",
                color: "#fff",
                border: "none",
                padding: "12px 28px",
                borderRadius: "6px",
                fontFamily: "'Barlow', sans-serif",
                fontWeight: 600,
                fontSize: "14px",
                letterSpacing: "0.5px",
                cursor: "pointer",
              }}
            >
              {existingBid ? "Revise Bid" : "Submit Bid"}
            </button>
          </form>
        </div>
      ) : isOpen && beforeDeadline && !isSubscribed ? (
        /* Subscription gate */
        <div style={{
          background: "#0F1A2E",
          border: "1px solid #C8102E",
          borderRadius: "12px",
          padding: "28px 24px",
          textAlign: "center",
        }}>
          <div style={{ fontSize: "36px", marginBottom: "12px" }}>🔒</div>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "22px",
            letterSpacing: "1px",
            color: "#fff",
            marginBottom: "8px",
          }}>
            Subscription Required to Bid
          </div>
          <div style={{ fontSize: "14px", color: "#7A9CC4", marginBottom: "20px", lineHeight: 1.6 }}>
            An active ONP subscription is required to submit bids on projects.
            Plans start at $150/month.
          </div>
          <Link href="/dashboard/contractor/subscribe" style={{
            background: "#C8102E",
            color: "#fff",
            padding: "12px 28px",
            borderRadius: "6px",
            fontFamily: "'Barlow', sans-serif",
            fontWeight: 600,
            fontSize: "14px",
            textDecoration: "none",
            display: "inline-block",
          }}>
            View Subscription Plans →
          </Link>
        </div>
      ) : isOpen ? (
        <div style={{
          background: "#0F2040",
          border: "1px solid #1B4F8A",
          borderRadius: "10px",
          padding: "20px",
          fontSize: "14px",
          color: "#7A9CC4",
          textAlign: "center",
        }}>
          Bidding is closed — the deadline has passed.
        </div>
      ) : null}
    </div>
  );
}