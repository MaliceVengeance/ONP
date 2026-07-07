import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { stateBadge } from "@/lib/ui";
import { supabaseAdmin } from "@/lib/supabase/admin";
import AwardButton from "./AwardButton";

type BidRow = {
  bid_id: string;
  amount_cents: number | string;
  version_number: number;
  submitted_at: string;
  notes: string | null;
  review_rank: number | null;
};

type ContractorInfo = {
  contractor_id: string;
  business_name: string | null;
  city: string | null;
  state: string | null;
  directory_verified: boolean | null;
  veteran_verified: boolean | null;
  license_number: string | null;
  license_expiry: string | null;
  coi_provider: string | null;
  coi_expiry: string | null;
  coi_amount: number | null;
  has_no_license: boolean | null;
  has_no_insurance: boolean | null;
};

function centsToMoney(cents: number | string) {
  const n = Number(cents);
  if (!Number.isFinite(n)) return "—";
  return `$${(n / 100).toLocaleString("en-US", { minimumFractionDigits: 0 })}`;
}

function moneyToCents(input: string | undefined) {
  if (!input) return null;
  const normalized = input.replace(/[$, ]/g, "").trim();
  if (!normalized) return null;
  const num = Number(normalized);
  if (!Number.isFinite(num)) return null;
  return Math.round(num * 100);
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString();
}

function isExpired(dateStr: string | null) {
  if (!dateStr) return false;
  return new Date(dateStr).getTime() < Date.now();
}

function fmtMoney(amount: number | null) {
  if (!amount) return "—";
  return `$${amount.toLocaleString("en-US")}`;
}

export default async function ClientProjectBidsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ min?: string; max?: string; sort?: string; award?: string }>;
}) {
  const { supabase } = await requireRole(["CLIENT", "ADMIN"]);
  const { id: projectId } = await params;
  const sp = await searchParams;

  const { data: project, error: pErr } = await supabase
    .from("projects")
    .select("id,title,state,deadline_at,emergency_bid_mode,is_emergency")
    .eq("id", projectId)
    .single();

  if (pErr) {
    return (
      <div style={{ maxWidth: "700px" }}>
        <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "36px", color: "var(--camo-charcoal)" }}>
          Bids
        </h1>
        <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", color: "#991B1B", padding: "14px", borderRadius: "8px", fontSize: "13px", marginTop: "16px" }}>
          Failed to load project: {JSON.stringify(pErr)}
        </div>
      </div>
    );
  }

  const deadline = project.deadline_at ? new Date(project.deadline_at) : null;
  const now = new Date();
  const isEmergencyBidMode = !!(project as any).emergency_bid_mode;
  const isEmergencyPaid = !!(project as any).is_emergency;
  const deadlinePassed = !!(deadline && deadline.getTime() <= now.getTime());
  const unlocked = deadlinePassed || project.state !== "OPEN" || isEmergencyBidMode || isEmergencyPaid;
  const sort = sp.sort === "amount_desc" ? "amount_desc" : "amount_asc";
  const minCents = moneyToCents(sp.min);
  const maxCents = moneyToCents(sp.max);

  let bids: BidRow[] = [];
  let bidsErrText: string | null = null;

  if (unlocked) {
    // Fetch bids directly via admin client (bypasses RLS which would block client user)
    const { data: bidRows, error: bidRowsErr } = await supabaseAdmin
      .from("bids")
      .select("id, review_rank")
      .eq("project_id", projectId);

    if (bidRowsErr) {
      bidsErrText = JSON.stringify(bidRowsErr, null, 2);
    } else {
      const bidIds = (bidRows ?? []).map((b) => b.id);
      // Build review rank lookup
      const reviewRankLookup = new Map<string, number | null>();
      (bidRows ?? []).forEach((b) => reviewRankLookup.set(b.id, b.review_rank ?? null));

      if (bidIds.length > 0) {
        // Get latest bid_version for each bid
        const { data: versionRows, error: vErr } = await supabaseAdmin
          .from("bid_versions")
          .select("bid_id, amount_cents, version_number, notes, created_at")
          .in("bid_id", bidIds)
          .order("version_number", { ascending: false });

        if (vErr) {
          bidsErrText = JSON.stringify(vErr, null, 2);
        } else {
          // Keep only the latest version per bid
          const latestMap = new Map<string, any>();
          (versionRows ?? []).forEach((v) => {
            if (!latestMap.has(v.bid_id)) latestMap.set(v.bid_id, v);
          });

          let rawBids: BidRow[] = bidIds
            .map((id) => {
              const v = latestMap.get(id);
              if (!v) return null;
              return {
                bid_id: id,
                amount_cents: v.amount_cents,
                version_number: v.version_number,
                submitted_at: v.created_at,
                notes: v.notes ?? null,
                review_rank: reviewRankLookup.get(id) ?? null,
              } as BidRow;
            })
            .filter(Boolean) as BidRow[];

          // Apply min/max filters
          if (minCents !== null) rawBids = rawBids.filter((b) => Number(b.amount_cents) >= minCents!);
          if (maxCents !== null) rawBids = rawBids.filter((b) => Number(b.amount_cents) <= maxCents!);

          // Sort
          rawBids.sort((a, b) => {
            const diff = Number(a.amount_cents) - Number(b.amount_cents);
            return sort === "amount_desc" ? -diff : diff;
          });

          bids = rawBids;
        }
      }
    }
  }

  let award: any = undefined;
  let awardErrText: string | null = null;

  if (unlocked) {
    const { data: awardRows, error: awardErr } = await supabaseAdmin
      .from("project_awards")
      .select("bid_id, contractor_id, awarded_at")
      .eq("project_id", projectId)
      .limit(1);
    if (awardErr) awardErrText = JSON.stringify(awardErr, null, 2);
    else award = awardRows?.[0] ?? undefined;
  }

  // Fetch contractor profiles for all bids using admin client
  const contractorMap = new Map<string, ContractorInfo>();
  if (unlocked && bids.length > 0) {
    try {
      // Get bid contractor IDs
      const { data: bidRows } = await supabaseAdmin
        .from("bids")
        .select("id, contractor_id")
        .in("id", bids.map((b) => b.bid_id));

      const contractorIds = (bidRows ?? []).map((b) => b.contractor_id).filter(Boolean);

      if (contractorIds.length > 0) {
        const { data: contractorProfiles } = await supabaseAdmin
          .from("contractor_profiles")
          .select("contractor_id, business_name, city, state, directory_verified, veteran_verified, license_number, license_expiry, coi_provider, coi_expiry, coi_amount, has_no_license, has_no_insurance")
          .in("contractor_id", contractorIds);

        // Map bid_id -> contractor info
        (bidRows ?? []).forEach((bidRow) => {
          const profile = (contractorProfiles ?? []).find(
            (p) => p.contractor_id === bidRow.contractor_id
          );
          if (profile) {
            contractorMap.set(bidRow.id, profile as ContractorInfo);
          }
        });
      }
    } catch (e) {
      console.error("Failed to fetch contractor profiles:", e);
    }
  }

  const inputStyle = {
    background: "#FFFFFF",
    border: "1px solid #d9dbdb",
    color: "var(--camo-charcoal)",
    borderRadius: "6px",
    padding: "8px 12px",
    fontFamily: "'Barlow', sans-serif",
    fontSize: "13px",
    outline: "none",
  } as React.CSSProperties;

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
            Bids
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "8px" }}>
            <span style={{ fontSize: "14px", color: "var(--camo-gunmetal)" }}>
              {project.title ?? "Untitled"}
            </span>
            <span style={stateBadge(project.state)}>{project.state}</span>
          </div>
        </div>
        <Link
          href={`/dashboard/client/projects/${projectId}`}
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

      {/* Lock status */}
      <div style={{
        background: "var(--camo-concrete)",
        border: `1px solid ${unlocked ? "#166534" : "#d9dbdb"}`,
        borderRadius: "10px",
        padding: "16px 20px",
        marginBottom: "20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "16px",
      }}>
        <div>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "20px",
            color: unlocked ? "#15803D" : "var(--camo-gunmetal)",
            letterSpacing: "1px",
          }}>
            {unlocked ? "✅ BIDS UNLOCKED" : "🔒 BIDS LOCKED"}
          </div>
          <div style={{ fontSize: "13px", color: "var(--camo-gunmetal)", marginTop: "4px" }}>
            {unlocked
              ? (isEmergencyBidMode || isEmergencyPaid) && !deadlinePassed
                ? "Emergency bid request — bids are visible as contractors submit them."
                : award
                  ? "Project has been awarded."
                  : "Bids are visible and ready to award."
              : "Bids are sealed until the deadline passes."}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: "11px", color: "var(--camo-gunmetal)", textTransform: "uppercase", letterSpacing: "1px" }}>
            Deadline
          </div>
          <div style={{ fontSize: "14px", color: "var(--camo-charcoal)", fontWeight: 500, marginTop: "2px" }}>
            {deadline ? deadline.toLocaleDateString() : "—"}
          </div>
        </div>
      </div>

      {/* Emergency bid mode disclaimer */}
      {(isEmergencyBidMode || isEmergencyPaid) && !deadlinePassed && (
        <div style={{
          background: "var(--camo-charcoal)",
          border: "1px solid var(--camo-accent)",
          borderRadius: "10px",
          padding: "18px 20px",
          marginBottom: "20px",
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
            🚨 Emergency Bid Mode Active
          </div>
          <p style={{ fontSize: "13px", color: "#FFFFFF", lineHeight: 1.75, marginBottom: "8px" }}>
            This project is operating in Emergency Bid Mode. Bids are being revealed as contractors submit them — the standard sealed bidding process is not in effect for this project.
          </p>
          <p style={{ fontSize: "13px", color: "#FFFFFF", lineHeight: 1.75, marginBottom: "8px" }}>
            <strong style={{ color: "var(--camo-accent)" }}>These bids are preliminary and incomplete.</strong> Because no site visit has been conducted and contractors are responding to an urgent request, bids may reflect significant contingency padding, missing scope items, or worst-case pricing assumptions. They are not accurate final estimates.
          </p>
          <p style={{ fontSize: "13px", color: "#d9dbdb", lineHeight: 1.75 }}>
            ONP is not responsible for pricing differences, disputes, or outcomes arising from bids submitted under emergency conditions. Award any contractor at your own risk and expect to negotiate final scope and pricing after a proper site visit.
          </p>
        </div>
      )}

      {/* Award saved banner */}
      {sp.award === "ok" && (
        <div style={{
          background: "#F0FDF4",
          border: "1px solid #166534",
          color: "#15803D",
          padding: "14px 18px",
          borderRadius: "8px",
          fontSize: "13px",
          marginBottom: "20px",
        }}>
          ✅ Award saved successfully.
        </div>
      )}

      {/* RPC errors */}
      {bidsErrText && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", color: "#991B1B", padding: "14px", borderRadius: "8px", fontSize: "13px", marginBottom: "16px" }}>
          <div style={{ fontWeight: 600, marginBottom: "8px" }}>Error loading bids</div>
          <pre style={{ fontSize: "11px", whiteSpace: "pre-wrap" }}>{bidsErrText}</pre>
        </div>
      )}

      {/* Winner card */}
      {award && (() => {
        const c = contractorMap.get(award.bid_id) || null;
        const name = c?.business_name || "Contractor profile not set up yet";
        const city = c?.city || "";
        const state = c?.state || "";
        const veteran = c?.veteran_verified ?? null;

        return (
          <div style={{
            background: "var(--camo-concrete)",
            border: "1px solid var(--camo-gunmetal)",
            borderRadius: "12px",
            padding: "20px",
            marginBottom: "24px",
          }}>
            <div style={{ fontSize: "11px", color: "var(--camo-gunmetal)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>
              ★ Winner Selected
            </div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "24px", color: "var(--camo-charcoal)", marginBottom: "4px" }}>
              {String(name)}
            </div>
            <div style={{ fontSize: "13px", color: "var(--camo-gunmetal)", marginBottom: "12px" }}>
              {[city, state].filter(Boolean).join(", ") || "Location not listed"}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "12px", color: "var(--camo-gunmetal)" }}>
                Awarded: {new Date(award.awarded_at).toLocaleString()}
              </span>
              {veteran === true && (
                <span style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  padding: "3px 10px",
                  borderRadius: "20px",
                  background: "#FFF7ED",
                  color: "#B45309",
                  border: "1px solid #D97706",
                }}>
                  ★ Veteran Owned
                </span>
              )}
            </div>
          </div>
        );
      })()}

      {/* Locked state */}
      {!unlocked ? (
        <div style={{
          background: "var(--camo-concrete)",
          border: "1px solid #d9dbdb",
          borderRadius: "10px",
          padding: "32px",
          textAlign: "center",
          color: "var(--camo-gunmetal)",
          fontSize: "14px",
        }}>
          🔒 Bids are sealed until the deadline passes. Check back after{" "}
          <span style={{ color: "var(--camo-charcoal)" }}>
            {deadline ? deadline.toLocaleDateString() : "the deadline"}
          </span>.
        </div>
      ) : (
        <>
          {/* Filters */}
          <div style={{
            background: "var(--camo-concrete)",
            border: "1px solid #d9dbdb",
            borderRadius: "10px",
            padding: "20px",
            marginBottom: "20px",
          }}>
            <h2 style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: "16px",
              letterSpacing: "1px",
              color: "var(--camo-charcoal)",
              textTransform: "uppercase",
              marginBottom: "14px",
            }}>
              Filter Bids
            </h2>

            <form className="mob-col-stretch" style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "flex-end" }}>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "var(--camo-gunmetal)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>
                  Min ($)
                </label>
                <input name="min" defaultValue={sp.min ?? ""} style={{ ...inputStyle, width: "120px" }} placeholder="e.g. 25000" />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "var(--camo-gunmetal)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>
                  Max ($)
                </label>
                <input name="max" defaultValue={sp.max ?? ""} style={{ ...inputStyle, width: "120px" }} placeholder="e.g. 50000" />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "var(--camo-gunmetal)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>
                  Sort
                </label>
                <select name="sort" defaultValue={sort} style={inputStyle}>
                  <option value="amount_asc">Lowest first</option>
                  <option value="amount_desc">Highest first</option>
                </select>
              </div>
              <button type="submit" style={{
                background: "var(--camo-gunmetal)",
                color: "#fff",
                border: "none",
                padding: "8px 20px",
                borderRadius: "6px",
                fontFamily: "'Barlow', sans-serif",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
              }}>
                Apply
              </button>
              <Link
                href={`/dashboard/client/projects/${projectId}/bids`}
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
                Clear
              </Link>
            </form>

            <p style={{ fontSize: "12px", color: "var(--camo-gunmetal)", marginTop: "12px" }}>
              Bids are anonymous. Contractor identities are revealed only after award.
            </p>
          </div>

          {/* Inline bid estimate notice */}
          <div style={{
            background: "#FFFBEB",
            border: "1px solid #FCD34D",
            borderRadius: "10px",
            padding: "14px 18px",
            marginBottom: "16px",
            fontSize: "13px",
            color: "#92400E",
            lineHeight: 1.6,
          }}>
            <strong>ℹ️ Bids are estimates</strong> based on the information you provided. Final pricing
            may change after a site visit reveals conditions that weren't visible in your description,
            photos, or files. Contractors may also include worst-case allowances to avoid underbidding.{" "}
            <a href="/help/bids" target="_blank" style={{ color: "#92400E", fontWeight: 600 }}>
              Learn more
            </a>{" "}·{" "}
            <a href="/dashboard/inspector" target="_blank" style={{ color: "#92400E", fontWeight: 600 }}>
              Request an ONP Inspector for more accurate bids →
            </a>
          </div>

          {/* Bid cards */}
          {bids.length === 0 ? (
            <div style={{
              background: "var(--camo-concrete)",
              border: "1px solid #d9dbdb",
              borderRadius: "10px",
              padding: "32px",
              textAlign: "center",
              color: "var(--camo-gunmetal)",
              fontSize: "14px",
            }}>
              No bids match your filters.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {bids.map((b, idx) => {
                const isAwarded = award?.bid_id === b.bid_id;
                const contractor = contractorMap.get(b.bid_id);
                const licenseExpired = isExpired(contractor?.license_expiry ?? null);
                const coiExpired = isExpired(contractor?.coi_expiry ?? null);
                const rank = b.review_rank;
                const rankLabel = rank === 1 ? "🥇 #1" : rank === 2 ? "🥈 #2" : rank === 3 ? "🥉 #3" : null;

                return (
                  <div key={b.bid_id} style={{
                    background: "var(--camo-concrete)",
                    border: `1px solid ${isAwarded ? "var(--camo-gunmetal)" : "#d9dbdb"}`,
                    borderRadius: "10px",
                    padding: "20px",
                  }}>
                    <div className="mob-card-stack" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                          <div style={{
                            fontFamily: "'Barlow Condensed', sans-serif",
                            fontWeight: 700,
                            fontSize: "18px",
                            color: "var(--camo-gunmetal)",
                            textTransform: "uppercase",
                            letterSpacing: "1px",
                          }}>
                            Bid #{idx + 1}
                          </div>
                          {rankLabel && (
                            <span style={{
                              fontSize: "12px",
                              fontWeight: 700,
                              padding: "2px 10px",
                              borderRadius: "20px",
                              background: rank === 1 ? "#FEF9C3" : rank === 2 ? "#F1F5F9" : "#FFF7ED",
                              color: rank === 1 ? "#78350F" : rank === 2 ? "#334155" : "#92400E",
                              border: `1px solid ${rank === 1 ? "#FCD34D" : rank === 2 ? "#CBD5E1" : "#D97706"}`,
                            }}>
                              {rankLabel}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--camo-gunmetal)" }}>
                          Submitted: {new Date(b.submitted_at).toLocaleString()}
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--camo-gunmetal)" }}>
                          Version {b.version_number}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{
                          fontFamily: "'Barlow Condensed', sans-serif",
                          fontWeight: 700,
                          fontSize: "32px",
                          color: "var(--camo-charcoal)",
                          lineHeight: 1,
                        }}>
                          {centsToMoney(b.amount_cents)}
                        </div>
                      </div>
                    </div>

                    {/* Verification badges */}
                    {contractor && (
                      <div style={{
                        background: "#FFFFFF",
                        border: "1px solid #d9dbdb",
                        borderRadius: "8px",
                        padding: "12px 14px",
                        marginTop: "12px",
                      }}>
                        <div style={{
                          fontSize: "11px",
                          color: "var(--camo-gunmetal)",
                          textTransform: "uppercase",
                          letterSpacing: "1px",
                          marginBottom: "10px",
                          fontWeight: 600,
                        }}>
                          Contractor Credentials
                        </div>

                        {/* Verification status badges */}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "12px" }}>
                          {contractor.directory_verified ? (
                            <span style={{
                              fontSize: "11px",
                              fontWeight: 600,
                              padding: "4px 10px",
                              borderRadius: "20px",
                              background: "#F0FDF4",
                              color: "#15803D",
                              border: "1px solid #166534",
                            }}>
                              ✅ ONP Verified
                            </span>
                          ) : (
                            <span style={{
                              fontSize: "11px",
                              fontWeight: 600,
                              padding: "4px 10px",
                              borderRadius: "20px",
                              background: "#FFFBEB",
                              color: "#92400E",
                              border: "1px solid #FCD34D",
                            }}>
                              ⏳ Verification Pending
                            </span>
                          )}

                          {contractor.veteran_verified && (
                            <span style={{
                              fontSize: "11px",
                              fontWeight: 600,
                              padding: "4px 10px",
                              borderRadius: "20px",
                              background: "#FFF7ED",
                              color: "#B45309",
                              border: "1px solid #D97706",
                            }}>
                              ★ Veteran Owned
                            </span>
                          )}

                          {contractor.has_no_license && (
                            <span style={{
                              fontSize: "11px",
                              fontWeight: 600,
                              padding: "4px 10px",
                              borderRadius: "20px",
                              background: "#FEF2F2",
                              color: "#991B1B",
                              border: "1px solid #FCA5A5",
                            }}>
                              ⚠ No License
                            </span>
                          )}

                          {contractor.has_no_insurance && (
                            <span style={{
                              fontSize: "11px",
                              fontWeight: 600,
                              padding: "4px 10px",
                              borderRadius: "20px",
                              background: "#FEF2F2",
                              color: "#991B1B",
                              border: "1px solid #FCA5A5",
                            }}>
                              ⚠ No Insurance
                            </span>
                          )}
                        </div>

                        {/* License info */}
                        <div className="mob-grid-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "12px" }}>
                          <div>
                            <div style={{ color: "var(--camo-gunmetal)", marginBottom: "2px" }}>License #</div>
                            <div style={{ color: "var(--camo-charcoal)" }}>
                              {contractor.license_number ?? "Not provided"}
                            </div>
                          </div>
                          <div>
                            <div style={{ color: "var(--camo-gunmetal)", marginBottom: "2px" }}>License Expires</div>
                            <div style={{ color: licenseExpired ? "#991B1B" : "var(--camo-charcoal)" }}>
                              {formatDate(contractor.license_expiry)}
                              {licenseExpired && " ⚠ Expired"}
                            </div>
                          </div>
                          <div>
                            <div style={{ color: "var(--camo-gunmetal)", marginBottom: "2px" }}>Insurance Provider</div>
                            <div style={{ color: "var(--camo-charcoal)" }}>
                              {contractor.coi_provider ?? "Not provided"}
                            </div>
                          </div>
                          <div>
                            <div style={{ color: "var(--camo-gunmetal)", marginBottom: "2px" }}>COI Expires</div>
                            <div style={{ color: coiExpired ? "#991B1B" : "var(--camo-charcoal)" }}>
                              {formatDate(contractor.coi_expiry)}
                              {coiExpired && " ⚠ Expired"}
                            </div>
                          </div>
                          {contractor.coi_amount && (
                            <div>
                              <div style={{ color: "var(--camo-gunmetal)", marginBottom: "2px" }}>Coverage Amount</div>
                              <div style={{ color: "var(--camo-charcoal)" }}>
                                {fmtMoney(contractor.coi_amount)}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {b.notes && (
                      <div style={{
                        background: "#FFFFFF",
                        border: "1px solid #d9dbdb",
                        borderRadius: "6px",
                        padding: "12px",
                        marginTop: "12px",
                        fontSize: "13px",
                        color: "var(--camo-gunmetal)",
                      }}>
                        <span style={{ color: "var(--camo-gunmetal)", fontWeight: 600 }}>Notes: </span>
                        {b.notes}
                      </div>
                    )}

                    <div style={{ marginTop: "12px" }}>
                      <Link
                        href={`/dashboard/client/projects/${projectId}/bids/${b.bid_id}?index=${idx + 1}`}
                        style={{
                          display: "inline-block",
                          background: "var(--camo-charcoal)",
                          color: "#fff",
                          padding: "8px 16px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: 600,
                          textDecoration: "none",
                        }}
                      >
                        View Full Bid Details →
                      </Link>
                    </div>

                    <div style={{ marginTop: "16px" }}>
                      {!award ? (
                        <>
                          <AwardButton
                            projectId={projectId}
                            bidId={b.bid_id}
                            bidDisplayIndex={idx + 1}
                            otherBids={bids
                              .filter((ob) => ob.bid_id !== b.bid_id)
                              .map((ob, i) => ({
                                bidId: ob.bid_id,
                                displayIndex: bids.indexOf(ob) + 1,
                              }))}
                          />
                          <p style={{ fontSize: "11px", color: "var(--camo-gunmetal)", marginTop: "6px" }}>
                            Reveals contractor identity for this bid only.
                          </p>
                        </>
                      ) : isAwarded ? (
                        <div style={{
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "var(--camo-gunmetal)",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}>
                          ★ Awarded Bid
                        </div>
                      ) : (
                        <div style={{ fontSize: "13px", color: "var(--camo-gunmetal)" }}>
                          {rankLabel ? `Ranked ${rankLabel}` : "Not ranked"}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
