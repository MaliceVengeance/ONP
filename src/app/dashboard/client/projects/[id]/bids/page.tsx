import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { awardBid } from "./actions";
import { stateBadge } from "@/lib/ui";
import { supabaseAdmin } from "@/lib/supabase/admin";

type BidRow = {
  bid_id: string;
  amount_cents: number | string;
  version_number: number;
  submitted_at: string;
  notes: string | null;
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
    .select("id,title,state,deadline_at")
    .eq("id", projectId)
    .single();

  if (pErr) {
    return (
      <div style={{ maxWidth: "700px" }}>
        <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "36px", color: "#fff" }}>
          Bids
        </h1>
        <div style={{ background: "#3D0A0A", border: "1px solid #991B1B", color: "#F87171", padding: "14px", borderRadius: "8px", fontSize: "13px", marginTop: "16px" }}>
          Failed to load project: {JSON.stringify(pErr)}
        </div>
      </div>
    );
  }

  const deadline = project.deadline_at ? new Date(project.deadline_at) : null;
  const now = new Date();
  const unlocked = (deadline && deadline.getTime() <= now.getTime()) || project.state !== "OPEN";
  const sort = sp.sort === "amount_desc" ? "amount_desc" : "amount_asc";
  const minCents = moneyToCents(sp.min);
  const maxCents = moneyToCents(sp.max);

  let bids: BidRow[] = [];
  let bidsErrText: string | null = null;

  if (unlocked) {
    const { data, error } = await supabase.rpc("list_project_bids_for_client", {
      p_project_id: projectId,
      p_min_cents: minCents === null ? null : String(minCents),
      p_max_cents: maxCents === null ? null : String(maxCents),
      p_sort: sort,
    });
    if (error) bidsErrText = JSON.stringify(error, null, 2);
    else bids = (data ?? []) as BidRow[];
  }

  let award: any = undefined;
  let awardErrText: string | null = null;

  if (unlocked) {
    const { data: awardData, error: awardErr } = await supabase.rpc(
      "get_project_award_for_client",
      { p_project_id: projectId }
    );
    if (awardErr) awardErrText = JSON.stringify(awardErr, null, 2);
    else award = (awardData ?? [])[0] as any;
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
          .select("contractor_id, business_name, city, state, directory_verified, veteran_verified, license_number, license_expiry, coi_provider, coi_expiry, coi_amount")
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
    background: "#0A1628",
    border: "1px solid #1B4F8A",
    color: "#F0F4FF",
    borderRadius: "6px",
    padding: "8px 12px",
    fontFamily: "'Barlow', sans-serif",
    fontSize: "13px",
    outline: "none",
  } as React.CSSProperties;

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
            Bids
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "8px" }}>
            <span style={{ fontSize: "14px", color: "#7A9CC4" }}>
              {project.title ?? "Untitled"}
            </span>
            <span style={stateBadge(project.state)}>{project.state}</span>
          </div>
        </div>
        <Link
          href={`/dashboard/client/projects/${projectId}`}
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

      {/* Lock status */}
      <div style={{
        background: "#0F2040",
        border: `1px solid ${unlocked ? "#166534" : "#1B4F8A"}`,
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
            color: unlocked ? "#4ADE80" : "#7A9CC4",
            letterSpacing: "1px",
          }}>
            {unlocked ? "✅ BIDS UNLOCKED" : "🔒 BIDS LOCKED"}
          </div>
          <div style={{ fontSize: "13px", color: "#7A9CC4", marginTop: "4px" }}>
            {unlocked
              ? award
                ? "Project has been awarded."
                : "Bids are visible and ready to award."
              : "Bids are sealed until the deadline passes."}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: "11px", color: "#7A9CC4", textTransform: "uppercase", letterSpacing: "1px" }}>
            Deadline
          </div>
          <div style={{ fontSize: "14px", color: "#fff", fontWeight: 500, marginTop: "2px" }}>
            {deadline ? deadline.toLocaleDateString() : "—"}
          </div>
        </div>
      </div>

      {/* Award saved banner */}
      {sp.award === "ok" && (
        <div style={{
          background: "#0D3320",
          border: "1px solid #166534",
          color: "#4ADE80",
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
        <div style={{ background: "#3D0A0A", border: "1px solid #991B1B", color: "#F87171", padding: "14px", borderRadius: "8px", fontSize: "13px", marginBottom: "16px" }}>
          <div style={{ fontWeight: 600, marginBottom: "8px" }}>Error loading bids</div>
          <pre style={{ fontSize: "11px", whiteSpace: "pre-wrap" }}>{bidsErrText}</pre>
        </div>
      )}

      {/* Winner card */}
      {award && (() => {
        const c = award?.contractor || {};
        const hasProfile = c && Object.keys(c).length > 0;
        const name = (hasProfile && (c.business_name || c.company_name || c.name)) || "Contractor profile not set up yet";
        const city = (hasProfile && (c.city || c.location_city)) || "";
        const state = (hasProfile && (c.state || c.location_state)) || "";
        const veteran = hasProfile ? c.veteran_verified ?? c.certified_veteran_owned : null;

        return (
          <div style={{
            background: "#0F2040",
            border: "1px solid #5B21B6",
            borderRadius: "12px",
            padding: "20px",
            marginBottom: "24px",
          }}>
            <div style={{ fontSize: "11px", color: "#A78BFA", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>
              ★ Winner Selected
            </div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "24px", color: "#fff", marginBottom: "4px" }}>
              {String(name)}
            </div>
            <div style={{ fontSize: "13px", color: "#7A9CC4", marginBottom: "12px" }}>
              {[city, state].filter(Boolean).join(", ") || "Location not listed"}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "12px", color: "#7A9CC4" }}>
                Awarded: {new Date(award.awarded_at).toLocaleString()}
              </span>
              {veteran === true && (
                <span style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  padding: "3px 10px",
                  borderRadius: "20px",
                  background: "#1e1a00",
                  color: "#FBBF24",
                  border: "1px solid #92400E",
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
          background: "#0F2040",
          border: "1px solid #1B4F8A",
          borderRadius: "10px",
          padding: "32px",
          textAlign: "center",
          color: "#7A9CC4",
          fontSize: "14px",
        }}>
          🔒 Bids are sealed until the deadline passes. Check back after{" "}
          <span style={{ color: "#fff" }}>
            {deadline ? deadline.toLocaleDateString() : "the deadline"}
          </span>.
        </div>
      ) : (
        <>
          {/* Filters */}
          <div style={{
            background: "#0F2040",
            border: "1px solid #1B4F8A",
            borderRadius: "10px",
            padding: "20px",
            marginBottom: "20px",
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
              Filter Bids
            </h2>

            <form style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "flex-end" }}>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#7A9CC4", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>
                  Min ($)
                </label>
                <input name="min" defaultValue={sp.min ?? ""} style={{ ...inputStyle, width: "120px" }} placeholder="e.g. 25000" />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#7A9CC4", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>
                  Max ($)
                </label>
                <input name="max" defaultValue={sp.max ?? ""} style={{ ...inputStyle, width: "120px" }} placeholder="e.g. 50000" />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#7A9CC4", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>
                  Sort
                </label>
                <select name="sort" defaultValue={sort} style={inputStyle}>
                  <option value="amount_asc">Lowest first</option>
                  <option value="amount_desc">Highest first</option>
                </select>
              </div>
              <button type="submit" style={{
                background: "#1B4F8A",
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
                  color: "#7A9CC4",
                  border: "1px solid #1B4F8A",
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

            <p style={{ fontSize: "12px", color: "#3A5A7A", marginTop: "12px" }}>
              Bids are anonymous. Contractor identities are revealed only after award.
            </p>
          </div>

          {/* Bid cards */}
          {bids.length === 0 ? (
            <div style={{
              background: "#0F2040",
              border: "1px solid #1B4F8A",
              borderRadius: "10px",
              padding: "32px",
              textAlign: "center",
              color: "#7A9CC4",
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

                return (
                  <div key={b.bid_id} style={{
                    background: "#0F2040",
                    border: `1px solid ${isAwarded ? "#5B21B6" : "#1B4F8A"}`,
                    borderRadius: "10px",
                    padding: "20px",
                  }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
                      <div>
                        <div style={{
                          fontFamily: "'Barlow Condensed', sans-serif",
                          fontWeight: 700,
                          fontSize: "18px",
                          color: "#7A9CC4",
                          textTransform: "uppercase",
                          letterSpacing: "1px",
                          marginBottom: "4px",
                        }}>
                          Bid #{idx + 1}
                        </div>
                        <div style={{ fontSize: "12px", color: "#3A5A7A" }}>
                          Submitted: {new Date(b.submitted_at).toLocaleString()}
                        </div>
                        <div style={{ fontSize: "12px", color: "#3A5A7A" }}>
                          Version {b.version_number}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{
                          fontFamily: "'Barlow Condensed', sans-serif",
                          fontWeight: 700,
                          fontSize: "32px",
                          color: "#fff",
                          lineHeight: 1,
                        }}>
                          {centsToMoney(b.amount_cents)}
                        </div>
                      </div>
                    </div>

                    {/* Verification badges */}
                    {contractor && (
                      <div style={{
                        background: "#0A1628",
                        border: "1px solid #1B4F8A",
                        borderRadius: "8px",
                        padding: "12px 14px",
                        marginTop: "12px",
                      }}>
                        <div style={{
                          fontSize: "11px",
                          color: "#7A9CC4",
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
                              background: "#0D3320",
                              color: "#4ADE80",
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
                              background: "#2D2000",
                              color: "#FBBF24",
                              border: "1px solid #92400E",
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
                              background: "#1e1a00",
                              color: "#FBBF24",
                              border: "1px solid #92400E",
                            }}>
                              ★ Veteran Owned
                            </span>
                          )}
                        </div>

                        {/* License info */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "12px" }}>
                          <div>
                            <div style={{ color: "#7A9CC4", marginBottom: "2px" }}>License #</div>
                            <div style={{ color: "#F0F4FF" }}>
                              {contractor.license_number ?? "Not provided"}
                            </div>
                          </div>
                          <div>
                            <div style={{ color: "#7A9CC4", marginBottom: "2px" }}>License Expires</div>
                            <div style={{ color: licenseExpired ? "#F87171" : "#F0F4FF" }}>
                              {formatDate(contractor.license_expiry)}
                              {licenseExpired && " ⚠ Expired"}
                            </div>
                          </div>
                          <div>
                            <div style={{ color: "#7A9CC4", marginBottom: "2px" }}>Insurance Provider</div>
                            <div style={{ color: "#F0F4FF" }}>
                              {contractor.coi_provider ?? "Not provided"}
                            </div>
                          </div>
                          <div>
                            <div style={{ color: "#7A9CC4", marginBottom: "2px" }}>COI Expires</div>
                            <div style={{ color: coiExpired ? "#F87171" : "#F0F4FF" }}>
                              {formatDate(contractor.coi_expiry)}
                              {coiExpired && " ⚠ Expired"}
                            </div>
                          </div>
                          {contractor.coi_amount && (
                            <div>
                              <div style={{ color: "#7A9CC4", marginBottom: "2px" }}>Coverage Amount</div>
                              <div style={{ color: "#F0F4FF" }}>
                                {fmtMoney(contractor.coi_amount)}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {b.notes && (
                      <div style={{
                        background: "#0A1628",
                        border: "1px solid #1B4F8A",
                        borderRadius: "6px",
                        padding: "12px",
                        marginTop: "12px",
                        fontSize: "13px",
                        color: "#7A9CC4",
                      }}>
                        <span style={{ color: "#4A7FB5", fontWeight: 600 }}>Notes: </span>
                        {b.notes}
                      </div>
                    )}

                    <div style={{ marginTop: "16px" }}>
                      {!award ? (
                        <form action={awardBid.bind(null, projectId, b.bid_id)}>
                          <button
                            type="submit"
                            style={{
                              background: "#C8102E",
                              color: "#fff",
                              border: "none",
                              padding: "10px 24px",
                              borderRadius: "6px",
                              fontFamily: "'Barlow', sans-serif",
                              fontWeight: 600,
                              fontSize: "13px",
                              cursor: "pointer",
                              letterSpacing: "0.5px",
                            }}
                          >
                            Award This Bid
                          </button>
                          <p style={{ fontSize: "11px", color: "#3A5A7A", marginTop: "6px" }}>
                            Reveals contractor identity for this bid only.
                          </p>
                        </form>
                      ) : isAwarded ? (
                        <div style={{
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "#A78BFA",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}>
                          ★ Awarded Bid
                        </div>
                      ) : (
                        <div style={{ fontSize: "13px", color: "#3A5A7A" }}>
                          Not selected
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