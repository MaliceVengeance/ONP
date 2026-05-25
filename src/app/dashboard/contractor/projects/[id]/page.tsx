import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import CountdownTimer from "@/components/CountdownTimer";
import { stateBadge } from "@/lib/ui";
import ProjectFileLink from "./ProjectFileLink";
import ProjectMap from "@/components/ProjectMap";
import BidForm from "./BidForm";

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

  // Fetch contractor's own credential expiry for warnings
  const { data: contractorProfile } = await supabase
    .from("contractor_profiles")
    .select("license_expiry, coi_expiry")
    .eq("contractor_id", user.id)
    .maybeSingle();

  function daysUntil(dateStr: string | null): number | null {
    if (!dateStr) return null;
    const diff = new Date(dateStr).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  function expiryWarning(dateStr: string | null, label: string): string | null {
    const days = daysUntil(dateStr);
    if (days === null) return null;
    if (days < 0) return `${label} expired`;
    if (days <= 30) return `${label}: ${new Date(dateStr!).toLocaleDateString()} (${days}d)`;
    return null;
  }

  const licenseExpiresSoon = expiryWarning(contractorProfile?.license_expiry ?? null, "License");
  const coiExpiresSoon = expiryWarning(contractorProfile?.coi_expiry ?? null, "Insurance");

  const [{ data: rows, error: pErr }, { data: zipRow }] = await Promise.all([
    supabase.rpc("get_open_project_detail", { p_project_id: projectId }),
    supabase.from("projects").select("zip_code, emergency_bid_mode").eq("id", projectId).maybeSingle(),
  ]);

  const project = (rows as ProjectDetail[] | null)?.[0];
  const zipCode: string | null = (zipRow as { zip_code?: string | null } | null)?.zip_code ?? null;
  const isEmergencyBidMode = !!(zipRow as any)?.emergency_bid_mode;

  if (pErr || !project) {
    return (
      <div style={{ maxWidth: "700px" }}>
        <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "32px", color: "#0A1628" }}>
          Project Not Found
        </h1>
        <div style={{ background: "#EEF4FF", border: "1px solid #B8D0E8", borderRadius: "10px", padding: "20px", marginTop: "16px", fontSize: "14px", color: "#1B4F8A" }}>
          This project may be closed, unpublished, or you may not have access.
        </div>
        <Link href="/dashboard/contractor/projects" style={{ color: "#1B4F8A", textDecoration: "underline", fontSize: "13px", display: "block", marginTop: "16px" }}>
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
            color: "#0A1628",
            margin: 0,
          }}>
            {project.title ?? "Untitled Project"}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "8px" }}>
            <span style={{ fontSize: "13px", color: "#1B4F8A" }}>
              {project.category ?? "—"} • {project.location_general ?? "—"}{zipCode ? ` ${zipCode}` : ""}
            </span>
            <span style={stateBadge(project.state)}>{project.state}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
          <Link
            href={`/dashboard/contractor/projects/${projectId}/rfis`}
            style={{
              background: totalRfis > 0 ? "#EEF4FF" : "transparent",
              color: answeredRfis < totalRfis ? "#B45309" : "#1B4F8A",
              border: `1px solid ${answeredRfis < totalRfis ? "#D97706" : "#B8D0E8"}`,
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
      </div>

      {/* Countdown timer */}
      {isOpen && project.deadline_at && (
        <div style={{ marginBottom: "20px" }}>
          <CountdownTimer deadline={project.deadline_at} />
        </div>
      )}

      {/* Project info */}
      <div style={{
        background: "#EEF4FF",
        border: "1px solid #B8D0E8",
        borderRadius: "10px",
        padding: "18px",
        marginBottom: "16px",
        display: "flex",
        gap: "24px",
        flexWrap: "wrap",
      }}>
        <div>
          <div style={{ fontSize: "11px", color: "#1B4F8A", textTransform: "uppercase", letterSpacing: "1px" }}>Published</div>
          <div style={{ fontSize: "14px", color: "#0A1628", marginTop: "2px" }}>
            {project.published_at ? new Date(project.published_at).toLocaleDateString() : "—"}
          </div>
        </div>
        <div>
          <div style={{ fontSize: "11px", color: "#1B4F8A", textTransform: "uppercase", letterSpacing: "1px" }}>Deadline</div>
          <div style={{ fontSize: "14px", color: "#0A1628", marginTop: "2px" }}>
            {deadline ? deadline.toLocaleDateString() : "—"}
          </div>
        </div>
        <div>
          <div style={{ fontSize: "11px", color: "#1B4F8A", textTransform: "uppercase", letterSpacing: "1px" }}>Category</div>
          <div style={{ fontSize: "14px", color: "#0A1628", marginTop: "2px" }}>
            {project.category ?? "—"}
          </div>
        </div>
        <div>
          <div style={{ fontSize: "11px", color: "#1B4F8A", textTransform: "uppercase", letterSpacing: "1px" }}>Location</div>
          <div style={{ fontSize: "14px", color: "#0A1628", marginTop: "2px" }}>
            {project.location_general ?? "—"}{zipCode ? ` ${zipCode}` : ""}
          </div>
        </div>
      </div>

      {/* Description */}
      {project.description && (
        <div style={{
          background: "#EEF4FF",
          border: "1px solid #B8D0E8",
          borderRadius: "10px",
          padding: "18px",
          marginBottom: "16px",
          fontSize: "14px",
          color: "#0A1628",
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
          background: "#EEF4FF",
          border: "1px solid #B8D0E8",
          borderRadius: "10px",
          padding: "18px",
          marginBottom: "16px",
        }}>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "16px",
            letterSpacing: "1px",
            color: "#0A1628",
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
        background: "#EEF4FF",
        border: "1px solid #B8D0E8",
        borderRadius: "10px",
        padding: "16px 18px",
        marginBottom: "16px",
      }}>
        <div style={{ fontSize: "11px", fontWeight: 600, color: "#1B4F8A", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "10px" }}>
          Platform Rules
        </div>
        <div style={{ fontSize: "13px", color: "#15803D", marginBottom: "6px" }}>
          ✅ The contractor is responsible for pulling all required permits.
        </div>
        <div style={{ fontSize: "13px", color: "#15803D" }}>
          ✅ The contractor is responsible for all debris removal and disposal.
        </div>
      </div>

      {/* Awarded banner */}
      {project.state === "AWARDED" && (
        <div style={{
          background: "#EEF4FF",
          border: "1px solid #1B4F8A",
          borderRadius: "10px",
          padding: "18px",
          marginBottom: "16px",
        }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "20px", color: "#1B4F8A", marginBottom: "6px" }}>
            ★ This project has been awarded
          </div>
          {award?.awarded_at && (
            <div style={{ fontSize: "13px", color: "#4A7FB5", marginBottom: "12px" }}>
              Awarded: {new Date(award.awarded_at).toLocaleString()}
            </div>
          )}
          {clientInfo ? (
            <div style={{
              background: "#FFFFFF",
              border: "1px solid #B8D0E8",
              borderRadius: "8px",
              padding: "16px",
              marginTop: "12px",
            }}>
              <div style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: "14px",
                letterSpacing: "1px",
                color: "#1B4F8A",
                textTransform: "uppercase",
                marginBottom: "10px",
              }}>
                Client Contact Information
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px" }}>
                {clientInfo.client_name && (
                  <div>
                    <span style={{ color: "#1B4F8A" }}>Name: </span>
                    <span style={{ color: "#0A1628" }}>{clientInfo.client_name}</span>
                  </div>
                )}
                {clientInfo.client_email && (
                  <div>
                    <span style={{ color: "#1B4F8A" }}>Email: </span>
                    <a href={`mailto:${clientInfo.client_email}`} style={{ color: "#1B4F8A" }}>
                      {clientInfo.client_email}
                    </a>
                  </div>
                )}
                {clientInfo.client_phone && (
                  <div>
                    <span style={{ color: "#1B4F8A" }}>Phone: </span>
                    <a href={`tel:${clientInfo.client_phone}`} style={{ color: "#1B4F8A" }}>
                      {clientInfo.client_phone}
                    </a>
                  </div>
                )}
                {clientInfo.client_address && clientInfo.client_address.trim() !== "" && (
                  <div>
                    <span style={{ color: "#1B4F8A" }}>Address: </span>
                    <span style={{ color: "#0A1628" }}>{clientInfo.client_address}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: "13px", color: "#1B4F8A", marginTop: "8px" }}>
              Bidding is closed. You can no longer submit or revise bids.
            </div>
          )}
        </div>
      )}

      {/* Success banner */}
      {bidSubmitted && (
        <div style={{
          background: "#F0FDF4",
          border: "1px solid #166534",
          color: "#15803D",
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
          background: "#EEF4FF",
          border: "1px solid #B8D0E8",
          borderRadius: "10px",
          padding: "18px",
          marginBottom: "16px",
        }}>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "16px",
            color: "#1B4F8A",
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
              color: "#0A1628",
            }}>
              {fmtMoney(existingBid.amount_cents)}
            </span>
            <span style={{ fontSize: "12px", color: "#1B4F8A" }}>
              v{existingBid.version_number}
              {existingBid.submitted_at ? ` • ${new Date(existingBid.submitted_at).toLocaleDateString()}` : ""}
            </span>
          </div>
          {existingBid.notes && (
            <div style={{
              background: "#FFFFFF",
              border: "1px solid #B8D0E8",
              borderRadius: "6px",
              padding: "10px 12px",
              fontSize: "13px",
              color: "#1B4F8A",
            }}>
              <span style={{ color: "#4A7FB5", fontWeight: 600 }}>Notes: </span>
              {existingBid.notes}
            </div>
          )}
        </div>
      )}

      {/* Emergency bid mode disclaimer for contractor */}
      {isEmergencyBidMode && isOpen && beforeDeadline && (
        <div style={{
          background: "#0A1628",
          border: "1px solid #C8102E",
          borderRadius: "10px",
          padding: "18px 20px",
          marginBottom: "16px",
        }}>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "14px",
            letterSpacing: "1px",
            color: "#C8102E",
            textTransform: "uppercase",
            marginBottom: "10px",
          }}>
            🚨 Emergency Bid Project
          </div>
          <p style={{ fontSize: "13px", color: "#FFFFFF", lineHeight: 1.75, marginBottom: "8px" }}>
            This project has been designated an <strong style={{ color: "#FFFFFF" }}>Emergency Bid</strong>. Bids are visible to the client as they are submitted — the standard sealed bidding process is <strong style={{ color: "#FFFFFF" }}>not in effect</strong>. Other contractors&apos; bids may already be visible.
          </p>
          <p style={{ fontSize: "13px", color: "#FFFFFF", lineHeight: 1.75, marginBottom: "8px" }}>
            <strong style={{ color: "#C8102E" }}>Your bid will be treated as preliminary and incomplete.</strong> Because no site visit has been conducted and you are responding under urgent conditions, you are not expected to have a complete picture of the scope. Do your best with the information available, but understand that your bid is a good-faith estimate only — not a firm commitment to a final price.
          </p>
          <p style={{ fontSize: "13px", color: "#B8D0E8", lineHeight: 1.75 }}>
            You are encouraged to note all assumptions and uncertainties clearly in your bid notes. Scope, materials, and conditions should be confirmed in a site visit before any final agreement is made with the client. ONP is not responsible for disputes or losses arising from emergency bid pricing.
          </p>
        </div>
      )}

      {/* Bid form or subscription gate */}
      {canBid ? (
        <BidForm
          projectId={projectId}
          existingBid={existingBid}
          licenseExpiresSoon={licenseExpiresSoon}
          coiExpiresSoon={coiExpiresSoon}
          isEmergency={isEmergencyBidMode}
        />
      ) : isOpen && beforeDeadline && !isSubscribed ? (
        /* Subscription gate */
        <div style={{
          background: "#EEF4FF",
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
            color: "#0A1628",
            marginBottom: "8px",
          }}>
            Subscription Required to Bid
          </div>
          <div style={{ fontSize: "14px", color: "#1B4F8A", marginBottom: "20px", lineHeight: 1.6 }}>
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
          background: "#EEF4FF",
          border: "1px solid #B8D0E8",
          borderRadius: "10px",
          padding: "20px",
          fontSize: "14px",
          color: "#1B4F8A",
          textAlign: "center",
        }}>
          Bidding is closed — the deadline has passed.
        </div>
      ) : null}
    </div>
  );
}
