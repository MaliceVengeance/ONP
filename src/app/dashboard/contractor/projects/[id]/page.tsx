import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import CountdownTimer from "@/components/CountdownTimer";
import { stateBadge } from "@/lib/ui";
import ProjectFileLink from "./ProjectFileLink";
import ProjectMap from "@/components/ProjectMap";
import BidForm from "./BidForm";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendContractorMessage } from "./messages/actions";
import { requestCompletion } from "./completion/actions";

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
  searchParams: Promise<{ bid?: string; completion?: string }>;
}) {
  const { supabase, user } = await requireRole(["CONTRACTOR", "ADMIN"]);
  const { id: projectId } = await params;
  const sp = await searchParams;
  const bidSubmitted = sp.bid === "ok";
  const completionSignaled = sp.completion === "signaled";

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
    supabase.from("projects").select("zip_code, emergency_bid_mode, is_emergency, inspector_hold_started_at, target_start_date, completion_requested_at").eq("id", projectId).maybeSingle(),
  ]);

  const project = (rows as ProjectDetail[] | null)?.[0];
  const zipCode: string | null = (zipRow as { zip_code?: string | null } | null)?.zip_code ?? null;
  const isEmergencyBidMode = !!(zipRow as any)?.emergency_bid_mode;
  const isEmergencyPaid = !!(zipRow as any)?.is_emergency;
  const isAnyEmergency = isEmergencyBidMode || isEmergencyPaid;
  const inspectorHoldActive = !!(zipRow as any)?.inspector_hold_started_at;
  const targetStartDate: string | null = (zipRow as any)?.target_start_date ?? null;
  const completionRequestedAt: string | null = (zipRow as any)?.completion_requested_at ?? null;

  if (pErr || !project) {
    return (
      <div style={{ maxWidth: "700px" }}>
        <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "32px", color: "var(--camo-charcoal)" }}>
          Project Not Found
        </h1>
        <div style={{ background: "var(--camo-concrete)", border: "1px solid #d9dbdb", borderRadius: "10px", padding: "20px", marginTop: "16px", fontSize: "14px", color: "var(--camo-gunmetal)" }}>
          This project may be closed, unpublished, or you may not have access.
        </div>
        <Link href="/dashboard/contractor/projects" style={{ color: "var(--camo-gunmetal)", textDecoration: "underline", fontSize: "13px", display: "block", marginTop: "16px" }}>
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

  const [{ data: rfiData }, { data: catalogData }] = await Promise.all([
    supabase.from("rfis").select("id, catalog_id, response").eq("project_id", projectId),
    supabase.from("rfi_catalog").select("id, code, prompt").order("code"),
  ]);

  const totalRfis = rfiData?.length ?? 0;
  const answeredRfis = (rfiData ?? []).filter((r: any) => r.response)?.length ?? 0;

  // Catalog items the client had the opportunity to pre-answer
  const CLIENT_EXCLUDED_KEYWORDS = [
    "specific question not covered above",
    "additional photos of the area",
    "clarify the scope of work for a specific area",
  ];
  type CatalogItem = { id: string; code: string; prompt: string };
  const clientCatalog = ((catalogData ?? []) as CatalogItem[]).filter(
    (c) => !CLIENT_EXCLUDED_KEYWORDS.some((kw) =>
      c.prompt.toLowerCase().includes(kw.toLowerCase())
    )
  );

  // Map catalog_id → client's response (null = not answered)
  const rfiByCategory = new Map<string, string | null>();
  (rfiData ?? []).forEach((r: any) => {
    if (r.catalog_id) rfiByCategory.set(r.catalog_id, r.response ?? null);
  });

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

  type BidReviewResult = { review_rank: number | null; review_note: string | null; review_amount_cents: number | null };
  type Top3BidRow = { review_rank: number; review_amount_cents: number | null };

  // Bid results — only relevant once the project is awarded
  let myBidReview: BidReviewResult | null = null;
  let top3Bids: Top3BidRow[] = [];

  if (project.state === "AWARDED" && bidRow?.id) {
    // Contractor can read their own bid via RLS
    const { data: ownReview } = await supabase
      .from("bids")
      .select("review_rank, review_note, review_amount_cents")
      .eq("id", bidRow.id)
      .maybeSingle();

    if (ownReview) myBidReview = ownReview as unknown as BidReviewResult;

    // Top 3 bids — fetched via admin (anonymised, amounts only)
    const { data: top3Rows } = await supabaseAdmin
      .from("bids")
      .select("review_rank, review_amount_cents")
      .eq("project_id", projectId)
      .not("review_rank", "is", null)
      .order("review_rank", { ascending: true })
      .limit(3);

    top3Bids = (top3Rows ?? []) as unknown as Top3BidRow[];
  }

  // Fetch messages if project is AWARDED and this contractor is the awarded contractor
  type MessageRow = {
    id: string;
    sender_id: string;
    sender_role: string;
    body: string;
    created_at: string;
    sender_name: string;
  };
  let projectMessages: MessageRow[] = [];
  // award is fetched via user-scoped supabase — RLS ensures only the awarded contractor sees it
  const isAwardedContractor = !!award;

  // Mark messages as read when contractor visits this page (AWARDED/COMPLETED + awarded contractor only)
  if (["AWARDED", "COMPLETED"].includes(project.state) && isAwardedContractor) {
    await supabaseAdmin
      .from("project_message_reads")
      .upsert(
        { project_id: projectId, user_id: user.id, last_read_at: new Date().toISOString() },
        { onConflict: "project_id,user_id" }
      );
  }

  if (["AWARDED", "COMPLETED"].includes(project.state) && isAwardedContractor) {
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
            color: "var(--camo-charcoal)",
            margin: 0,
          }}>
            {project.title ?? "Untitled Project"}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "8px" }}>
            <span style={{ fontSize: "13px", color: "var(--camo-gunmetal)" }}>
              {project.category ?? "—"} • {project.location_general ?? "—"}{zipCode ? ` ${zipCode}` : ""}
            </span>
            <span style={stateBadge(project.state)}>{project.state}</span>
          </div>
        </div>
        <div className="mob-wrap" style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
          <Link
            href={`/dashboard/contractor/projects/${projectId}/rfis`}
            style={{
              background: totalRfis > 0 ? "var(--camo-concrete)" : "transparent",
              color: answeredRfis < totalRfis ? "#B45309" : "var(--camo-gunmetal)",
              border: `1px solid ${answeredRfis < totalRfis ? "#D97706" : "#d9dbdb"}`,
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
              color: "var(--camo-gunmetal)",
              border: "1px solid #d9dbdb",
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

      {/* Countdown timer / inspection hold indicator */}
      {isOpen && project.deadline_at && (
        <div style={{ marginBottom: "20px" }}>
          {inspectorHoldActive ? (
            <div style={{
              background: "#FEF3C7",
              border: "1px solid #FCD34D",
              borderRadius: "10px",
              padding: "14px 18px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}>
              <span style={{ fontSize: "20px" }}>⏸</span>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#92400E" }}>
                  Bidding timer paused
                </div>
                <div style={{ fontSize: "12px", color: "#78350F", marginTop: "2px" }}>
                  An inspector is preparing a takeoff report for this project. The deadline
                  will be extended by the time the inspection takes, so you will have the
                  full original window to bid once the report is available.
                </div>
              </div>
            </div>
          ) : (
            <CountdownTimer deadline={project.deadline_at} />
          )}
        </div>
      )}

      {/* Project info */}
      <div style={{
        background: "var(--camo-concrete)",
        border: "1px solid #d9dbdb",
        borderRadius: "10px",
        padding: "18px",
        marginBottom: "16px",
        display: "flex",
        gap: "24px",
        flexWrap: "wrap",
      }}>
        <div>
          <div style={{ fontSize: "11px", color: "var(--camo-gunmetal)", textTransform: "uppercase", letterSpacing: "1px" }}>Published</div>
          <div style={{ fontSize: "14px", color: "var(--camo-charcoal)", marginTop: "2px" }}>
            {project.published_at ? new Date(project.published_at).toLocaleDateString() : "—"}
          </div>
        </div>
        <div>
          <div style={{ fontSize: "11px", color: "var(--camo-gunmetal)", textTransform: "uppercase", letterSpacing: "1px" }}>Deadline</div>
          <div style={{ fontSize: "14px", color: "var(--camo-charcoal)", marginTop: "2px" }}>
            {deadline ? deadline.toLocaleDateString() : "—"}
          </div>
        </div>
        <div>
          <div style={{ fontSize: "11px", color: "var(--camo-gunmetal)", textTransform: "uppercase", letterSpacing: "1px" }}>Category</div>
          <div style={{ fontSize: "14px", color: "var(--camo-charcoal)", marginTop: "2px" }}>
            {project.category ?? "—"}
          </div>
        </div>
        <div>
          <div style={{ fontSize: "11px", color: "var(--camo-gunmetal)", textTransform: "uppercase", letterSpacing: "1px" }}>Location</div>
          <div style={{ fontSize: "14px", color: "var(--camo-charcoal)", marginTop: "2px" }}>
            {project.location_general ?? "—"}{zipCode ? ` ${zipCode}` : ""}
          </div>
        </div>
        {targetStartDate && (
          <div>
            <div style={{ fontSize: "11px", color: "var(--camo-gunmetal)", textTransform: "uppercase", letterSpacing: "1px" }}>Target Start</div>
            <div style={{ fontSize: "14px", color: "var(--camo-charcoal)", marginTop: "2px" }}>
              {new Date(targetStartDate + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </div>
          </div>
        )}
      </div>

      {/* Description */}
      {project.description && (
        <div style={{
          background: "var(--camo-concrete)",
          border: "1px solid #d9dbdb",
          borderRadius: "10px",
          padding: "18px",
          marginBottom: "16px",
          fontSize: "14px",
          color: "var(--camo-charcoal)",
          lineHeight: 1.7,
          whiteSpace: "pre-wrap",
        }}>
          {project.description}
        </div>
      )}

      {/* Client Q&A — all questions the client had the opportunity to answer */}
      {clientCatalog.length > 0 && (() => {
        const answeredCount = clientCatalog.filter((c) => rfiByCategory.has(c.id) && rfiByCategory.get(c.id)).length;
        return (
          <div style={{
            background: "var(--camo-concrete)",
            border: "1px solid #d9dbdb",
            borderRadius: "10px",
            marginBottom: "16px",
            overflow: "hidden",
          }}>
            {/* Header */}
            <div style={{
              background: "#FFFFFF",
              borderBottom: "1px solid #d9dbdb",
              padding: "14px 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
            }}>
              <div>
                <div style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 700,
                  fontSize: "15px",
                  letterSpacing: "1px",
                  color: "var(--camo-charcoal)",
                  textTransform: "uppercase",
                }}>
                  Client Responses
                </div>
                <div style={{ fontSize: "11px", color: "var(--camo-gunmetal)", marginTop: "2px" }}>
                  {answeredCount} of {clientCatalog.length} questions answered — unanswered items may affect your pricing
                </div>
              </div>
              <span style={{
                fontSize: "12px",
                fontWeight: 700,
                padding: "3px 12px",
                borderRadius: "20px",
                background: answeredCount === clientCatalog.length ? "#F0FDF4" : "#FFFBEB",
                color: answeredCount === clientCatalog.length ? "#15803D" : "#92400E",
                border: `1px solid ${answeredCount === clientCatalog.length ? "#166534" : "#FCD34D"}`,
                flexShrink: 0,
              }}>
                {answeredCount}/{clientCatalog.length}
              </span>
            </div>

            {/* Question rows */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
              {clientCatalog.map((item, idx) => {
                const response = rfiByCategory.get(item.id) ?? null;
                const isAnswered = !!response;
                return (
                  <div key={item.id} style={{
                    padding: "14px 18px",
                    borderBottom: idx < clientCatalog.length - 1 ? "1px solid #d9dbdb" : "none",
                    background: isAnswered ? "var(--camo-paper)" : "#FFFDF0",
                  }}>
                    <div style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "var(--camo-charcoal)",
                      marginBottom: isAnswered ? "8px" : "0",
                      lineHeight: 1.4,
                    }}>
                      {item.prompt}
                    </div>
                    {isAnswered ? (
                      <div style={{
                        background: "#F0FDF4",
                        border: "1px solid #86EFAC",
                        borderRadius: "6px",
                        padding: "10px 12px",
                        fontSize: "13px",
                        color: "var(--camo-charcoal)",
                        lineHeight: 1.6,
                        whiteSpace: "pre-wrap",
                      }}>
                        {response}
                      </div>
                    ) : (
                      <div style={{
                        fontSize: "12px",
                        color: "#92400E",
                        marginTop: "4px",
                        fontStyle: "italic",
                      }}>
                        ⚠ Not answered by client
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

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
          background: "var(--camo-concrete)",
          border: "1px solid #d9dbdb",
          borderRadius: "10px",
          padding: "18px",
          marginBottom: "16px",
        }}>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "16px",
            letterSpacing: "1px",
            color: "var(--camo-charcoal)",
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
        background: "var(--camo-concrete)",
        border: "1px solid #d9dbdb",
        borderRadius: "10px",
        padding: "16px 18px",
        marginBottom: "16px",
      }}>
        <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--camo-gunmetal)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "10px" }}>
          Platform Rules
        </div>
        <div style={{ fontSize: "13px", color: "#15803D", marginBottom: "6px" }}>
          ✅ The contractor is responsible for pulling all required permits.
        </div>
        <div style={{ fontSize: "13px", color: "#15803D" }}>
          ✅ The contractor is responsible for all debris removal and disposal.
        </div>
      </div>

      {/* Bid Results — shown after award if contractor submitted a bid */}
      {project.state === "AWARDED" && bidRow?.id && (
        <div style={{
          background: "var(--camo-concrete)",
          border: "1px solid #d9dbdb",
          borderRadius: "10px",
          overflow: "hidden",
          marginBottom: "16px",
        }}>
          {/* Header */}
          <div style={{
            background: "#FFFFFF",
            borderBottom: "1px solid #d9dbdb",
            padding: "14px 18px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}>
            <span style={{ fontSize: "20px" }}>📊</span>
            <div>
              <div style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: "15px",
                letterSpacing: "1px",
                color: "var(--camo-charcoal)",
                textTransform: "uppercase",
              }}>
                Bid Results
              </div>
              <div style={{ fontSize: "11px", color: "var(--camo-gunmetal)", marginTop: "2px" }}>
                How your bid performed — amounts shown anonymously
              </div>
            </div>
          </div>

          <div style={{ padding: "16px 18px" }}>
            {/* My placement */}
            {myBidReview?.review_rank ? (
              <div style={{
                background: myBidReview.review_rank === 1 ? "#FEF9C3" : myBidReview.review_rank === 2 ? "#F1F5F9" : myBidReview.review_rank === 3 ? "#FFF7ED" : "var(--camo-paper)",
                border: `1px solid ${myBidReview.review_rank === 1 ? "#FCD34D" : myBidReview.review_rank === 2 ? "#CBD5E1" : myBidReview.review_rank === 3 ? "#D97706" : "#d9dbdb"}`,
                borderRadius: "8px",
                padding: "14px 16px",
                marginBottom: "16px",
              }}>
                <div style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 700,
                  fontSize: "20px",
                  color: "var(--camo-charcoal)",
                  marginBottom: "4px",
                }}>
                  {myBidReview.review_rank === 1 ? "🥇 You were awarded this project!" : myBidReview.review_rank === 2 ? "🥈 Your bid ranked #2" : "🥉 Your bid ranked #3"}
                </div>
                {myBidReview.review_note && (
                  <div style={{
                    background: "#FFFFFF",
                    border: "1px solid #d9dbdb",
                    borderRadius: "6px",
                    padding: "10px 12px",
                    fontSize: "13px",
                    color: "var(--camo-charcoal)",
                    lineHeight: 1.6,
                    marginTop: "8px",
                  }}>
                    <div style={{ fontSize: "10px", color: "var(--camo-gunmetal)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>
                      Client note
                    </div>
                    {myBidReview.review_note}
                  </div>
                )}
              </div>
            ) : (
              <div style={{
                background: "var(--camo-paper)",
                border: "1px solid #d9dbdb",
                borderRadius: "8px",
                padding: "14px 16px",
                marginBottom: "16px",
                fontSize: "13px",
                color: "var(--camo-gunmetal)",
              }}>
                The client did not rank this bid in the top 3.
              </div>
            )}

            {/* Top 3 anonymous comparison */}
            {top3Bids.length > 0 && (
              <div>
                <div style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "var(--camo-gunmetal)",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  marginBottom: "10px",
                }}>
                  Top {top3Bids.length} Bids (anonymous)
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {top3Bids.map((t) => {
                    const isMe = myBidReview?.review_rank === t.review_rank;
                    const emoji = t.review_rank === 1 ? "🥇" : t.review_rank === 2 ? "🥈" : "🥉";
                    return (
                      <div key={t.review_rank} style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        background: isMe ? "var(--camo-concrete)" : "#FFFFFF",
                        border: `1px solid ${isMe ? "var(--camo-gunmetal)" : "#d9dbdb"}`,
                        borderRadius: "6px",
                        padding: "10px 14px",
                      }}>
                        <span style={{ fontSize: "14px" }}>
                          {emoji} Rank #{t.review_rank}{isMe ? " — You" : ""}
                        </span>
                        <span style={{
                          fontFamily: "'Barlow Condensed', sans-serif",
                          fontWeight: 700,
                          fontSize: "18px",
                          color: "var(--camo-charcoal)",
                        }}>
                          {t.review_amount_cents
                            ? `$${(t.review_amount_cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0 })}`
                            : "—"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Awarded banner */}
      {project.state === "AWARDED" && (
        <div style={{
          background: "var(--camo-concrete)",
          border: "1px solid var(--camo-gunmetal)",
          borderRadius: "10px",
          padding: "18px",
          marginBottom: "16px",
        }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "20px", color: "var(--camo-gunmetal)", marginBottom: "6px" }}>
            ★ This project has been awarded
          </div>
          {award?.awarded_at && (
            <div style={{ fontSize: "13px", color: "var(--camo-gunmetal)", marginBottom: "12px" }}>
              Awarded: {new Date(award.awarded_at).toLocaleString()}
            </div>
          )}
          {clientInfo ? (
            <div style={{
              background: "#FFFFFF",
              border: "1px solid #d9dbdb",
              borderRadius: "8px",
              padding: "16px",
              marginTop: "12px",
            }}>
              <div style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: "14px",
                letterSpacing: "1px",
                color: "var(--camo-gunmetal)",
                textTransform: "uppercase",
                marginBottom: "10px",
              }}>
                Client Contact Information
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px" }}>
                {clientInfo.client_name && (
                  <div>
                    <span style={{ color: "var(--camo-gunmetal)" }}>Name: </span>
                    <span style={{ color: "var(--camo-charcoal)" }}>{clientInfo.client_name}</span>
                  </div>
                )}
                {clientInfo.client_email && (
                  <div>
                    <span style={{ color: "var(--camo-gunmetal)" }}>Email: </span>
                    <a href={`mailto:${clientInfo.client_email}`} style={{ color: "var(--camo-gunmetal)" }}>
                      {clientInfo.client_email}
                    </a>
                  </div>
                )}
                {clientInfo.client_phone && (
                  <div>
                    <span style={{ color: "var(--camo-gunmetal)" }}>Phone: </span>
                    <a href={`tel:${clientInfo.client_phone}`} style={{ color: "var(--camo-gunmetal)" }}>
                      {clientInfo.client_phone}
                    </a>
                  </div>
                )}
                {clientInfo.client_address && clientInfo.client_address.trim() !== "" && (
                  <div>
                    <span style={{ color: "var(--camo-gunmetal)" }}>Address: </span>
                    <span style={{ color: "var(--camo-charcoal)" }}>{clientInfo.client_address}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: "13px", color: "var(--camo-gunmetal)", marginTop: "8px" }}>
              Bidding is closed. You can no longer submit or revise bids.
            </div>
          )}
        </div>
      )}

      {/* Completion signaled confirmation */}
      {completionSignaled && (
        <div style={{
          background: "#F0FDF4",
          border: "1px solid #166534",
          color: "#15803D",
          padding: "14px 18px",
          borderRadius: "8px",
          fontSize: "13px",
          marginBottom: "16px",
        }}>
          ✅ Work completion signaled. The client has been notified and will confirm once they have reviewed the work.
        </div>
      )}

      {/* Signal Work Complete — shown when AWARDED + awarded contractor + no pending request */}
      {project.state === "AWARDED" && isAwardedContractor && !completionRequestedAt && (
        <div style={{
          background: "#F0FDF4",
          border: "1px solid #166534",
          borderRadius: "10px",
          padding: "18px 20px",
          marginBottom: "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          flexWrap: "wrap",
        }}>
          <div>
            <div style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: "16px",
              color: "#15803D",
              marginBottom: "3px",
            }}>
              Ready to close this project?
            </div>
            <div style={{ fontSize: "12px", color: "#166534", lineHeight: 1.5 }}>
              Signal that the work is complete. The client will be notified to confirm.
            </div>
          </div>
          <form action={requestCompletion.bind(null, projectId)}>
            <button
              type="submit"
              style={{
                background: "#15803D",
                color: "#FFFFFF",
                border: "none",
                padding: "10px 22px",
                borderRadius: "6px",
                fontFamily: "'Barlow', sans-serif",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              ✓ Signal Work Complete
            </button>
          </form>
        </div>
      )}

      {/* Pending completion confirmation */}
      {project.state === "AWARDED" && isAwardedContractor && completionRequestedAt && (
        <div style={{
          background: "#FFFBEB",
          border: "1px solid #FCD34D",
          borderRadius: "10px",
          padding: "14px 18px",
          marginBottom: "16px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}>
          <span style={{ fontSize: "20px" }}>⏳</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: "13px", color: "#92400E" }}>
              Awaiting client confirmation
            </div>
            <div style={{ fontSize: "12px", color: "#92400E", marginTop: "2px" }}>
              You signaled work complete on {new Date(completionRequestedAt).toLocaleDateString()}. The client will confirm once they have reviewed the work.
            </div>
          </div>
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
          background: "var(--camo-concrete)",
          border: "1px solid #d9dbdb",
          borderRadius: "10px",
          padding: "18px",
          marginBottom: "16px",
        }}>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "16px",
            color: "var(--camo-gunmetal)",
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
              color: "var(--camo-charcoal)",
            }}>
              {fmtMoney(existingBid.amount_cents)}
            </span>
            <span style={{ fontSize: "12px", color: "var(--camo-gunmetal)" }}>
              v{existingBid.version_number}
              {existingBid.submitted_at ? ` • ${new Date(existingBid.submitted_at).toLocaleDateString()}` : ""}
            </span>
          </div>
          {existingBid.notes && (
            <div style={{
              background: "#FFFFFF",
              border: "1px solid #d9dbdb",
              borderRadius: "6px",
              padding: "10px 12px",
              fontSize: "13px",
              color: "var(--camo-gunmetal)",
            }}>
              <span style={{ color: "var(--camo-gunmetal)", fontWeight: 600 }}>Notes: </span>
              {existingBid.notes}
            </div>
          )}
        </div>
      )}

      {/* Emergency bid mode disclaimer for contractor */}
      {isAnyEmergency && isOpen && beforeDeadline && (
        <div style={{
          background: "var(--camo-charcoal)",
          border: "1px solid var(--camo-accent)",
          borderRadius: "10px",
          padding: "18px 20px",
          marginBottom: "16px",
        }}>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "14px",
            letterSpacing: "1px",
            color: "var(--camo-accent)",
            textTransform: "uppercase",
            marginBottom: "10px",
          }}>
            🚨 Emergency Bid Project
          </div>
          <p style={{ fontSize: "13px", color: "#FFFFFF", lineHeight: 1.75, marginBottom: "8px" }}>
            This project has been designated an <strong style={{ color: "#FFFFFF" }}>Emergency Bid</strong>. Bids are visible to the client as they are submitted — the standard sealed bidding process is <strong style={{ color: "#FFFFFF" }}>not in effect</strong>. Other contractors&apos; bids may already be visible.
          </p>
          <p style={{ fontSize: "13px", color: "#FFFFFF", lineHeight: 1.75, marginBottom: "8px" }}>
            <strong style={{ color: "var(--camo-accent)" }}>Your bid will be treated as preliminary and incomplete.</strong> Because no site visit has been conducted and you are responding under urgent conditions, you are not expected to have a complete picture of the scope. Do your best with the information available, but understand that your bid is a good-faith estimate only — not a firm commitment to a final price.
          </p>
          <p style={{ fontSize: "13px", color: "#d9dbdb", lineHeight: 1.75 }}>
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
          isEmergency={isAnyEmergency}
        />
      ) : isOpen && beforeDeadline && !isSubscribed ? (
        /* Subscription gate */
        <div style={{
          background: "var(--camo-concrete)",
          border: "1px solid var(--camo-accent)",
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
            color: "var(--camo-charcoal)",
            marginBottom: "8px",
          }}>
            Subscription Required to Bid
          </div>
          <div style={{ fontSize: "14px", color: "var(--camo-gunmetal)", marginBottom: "20px", lineHeight: 1.6 }}>
            An active ONP subscription is required to submit bids on projects.
            Plans start at $150/month.
          </div>
          <Link href="/dashboard/contractor/subscribe" style={{
            background: "var(--camo-accent)",
            color: "var(--camo-ink)",
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
          background: "var(--camo-concrete)",
          border: "1px solid #d9dbdb",
          borderRadius: "10px",
          padding: "20px",
          fontSize: "14px",
          color: "var(--camo-gunmetal)",
          textAlign: "center",
        }}>
          Bidding is closed — the deadline has passed.
        </div>
      ) : null}

      {/* ── Post-Award Messages ── */}
      {["AWARDED", "COMPLETED"].includes(project.state) && isAwardedContractor && (
        <div
          id="messages"
          style={{
            background: "var(--camo-concrete)",
            border: "1px solid #d9dbdb",
            borderRadius: "12px",
            overflow: "hidden",
            marginTop: "16px",
          }}
        >
          {/* Section header */}
          <div
            style={{
              background: "var(--camo-charcoal)",
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
              <div style={{ fontSize: "11px", color: "var(--camo-steel)", marginTop: "1px" }}>
                Private thread — visible only to you, the client, and ONP
              </div>
            </div>
          </div>

          {/* Message list */}
          <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "12px" }}>
            {projectMessages.length === 0 ? (
              <div
                style={{
                  fontSize: "13px",
                  color: "var(--camo-gunmetal)",
                  textAlign: "center",
                  padding: "24px 0",
                  fontStyle: "italic",
                }}
              >
                No messages yet. Send the first message below.
              </div>
            ) : (
              projectMessages.map((msg) => {
                const isMe = msg.sender_id === user.id;
                const roleBadgeColor =
                  msg.sender_role === "CLIENT"
                    ? { bg: "var(--camo-concrete)", color: "var(--camo-gunmetal)", border: "#d9dbdb" }
                    : msg.sender_role === "ADMIN"
                    ? { bg: "#FFF7ED", color: "#92400E", border: "#FCD34D" }
                    : { bg: "#F0FDF4", color: "#15803D", border: "#86EFAC" };

                return (
                  <div
                    key={msg.id}
                    style={{
                      display: "flex",
                      flexDirection: isMe ? "row-reverse" : "row",
                      gap: "10px",
                      alignItems: "flex-start",
                    }}
                  >
                    <div
                      style={{
                        maxWidth: "80%",
                        background: isMe ? "var(--camo-charcoal)" : "#FFFFFF",
                        border: `1px solid ${isMe ? "var(--camo-gunmetal)" : "#d9dbdb"}`,
                        borderRadius: isMe ? "12px 2px 12px 12px" : "2px 12px 12px 12px",
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
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: 700,
                            color: isMe ? "#d9dbdb" : "var(--camo-charcoal)",
                          }}
                        >
                          {isMe ? "You" : msg.sender_name}
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
                        <span style={{ fontSize: "10px", color: isMe ? "var(--camo-steel)" : "#9CA3AF" }}>
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
                          color: isMe ? "var(--camo-paper)" : "var(--camo-charcoal)",
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

          {/* Send form */}
          <div
            style={{
              borderTop: "1px solid #d9dbdb",
              padding: "16px 20px",
              background: "var(--camo-paper)",
            }}
          >
            <form action={sendContractorMessage.bind(null, projectId)}>
              <textarea
                name="body"
                required
                maxLength={2000}
                rows={3}
                placeholder="Type your message…"
                style={{
                  width: "100%",
                  background: "#FFFFFF",
                  border: "1px solid #d9dbdb",
                  color: "var(--camo-charcoal)",
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
                <span style={{ fontSize: "11px", color: "var(--camo-gunmetal)" }}>
                  Max 2,000 characters · Visible to client and ONP
                </span>
                <button
                  type="submit"
                  style={{
                    background: "var(--camo-charcoal)",
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
                  Send Message
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
