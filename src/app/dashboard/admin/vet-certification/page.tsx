import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { handleVetCertDecision, handleDirectoryDecision, updateBbbLink } from "./actions";
import { setCredentialVerified, deleteCredentialAdmin } from "../users/[id]/actions";

const CREDENTIAL_TYPE_LABELS: Record<string, string> = {
  STATE_LICENSE: "State License",
  CITY_REGISTRATION: "City Registration",
  TRADE_LICENSE: "Trade-Specific License",
  BOND: "Surety Bond",
};

type ContractorProfile = {
  contractor_id: string;
  business_name: string | null;
  city: string | null;
  state: string | null;
  veteran_applied_at: string | null;
  veteran_verified: boolean;
  veteran_verified_at: string | null;
  veteran_credential_type: string | null;
  veteran_credential_reference: string | null;
  license_number: string | null;
  license_expiry: string | null;
  coi_provider: string | null;
  coi_policy_number: string | null;
  coi_expiry: string | null;
  coi_amount: number | null;
  directory_verified: boolean | null;
  directory_verified_at: string | null;
  is_listed: boolean | null;
  bbb_url: string | null;
};

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString();
}

function isExpired(d: string | null) {
  if (!d) return false;
  return new Date(d).getTime() < Date.now();
}

function fmtMoney(n: number | null) {
  if (!n) return "—";
  return `$${n.toLocaleString("en-US")}`;
}

const noteStyle: React.CSSProperties = {
  width: "100%",
  background: "#FFFFFF",
  border: "1px solid #d9dbdb",
  color: "var(--camo-charcoal)",
  borderRadius: "6px",
  padding: "9px 12px",
  fontFamily: "'Barlow', sans-serif",
  fontSize: "13px",
  resize: "vertical",
  outline: "none",
  boxSizing: "border-box",
  marginTop: "10px",
};

export default async function VetCertificationPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const sp = await searchParams;
  const tab = sp.tab === "directory" ? "directory" : sp.tab === "credentials" ? "credentials" : "veteran";

  await requireRole(["ADMIN"]);

  const { data, error } = await supabaseAdmin
    .from("contractor_profiles")
    .select(
      "contractor_id, business_name, city, state, veteran_applied_at, veteran_verified, veteran_verified_at, " +
      "veteran_credential_type, veteran_credential_reference, " +
      "license_number, license_expiry, coi_provider, coi_policy_number, coi_expiry, coi_amount, " +
      "directory_verified, directory_verified_at, is_listed, bbb_url"
    )
    .order("veteran_applied_at", { ascending: true });

  if (error) throw error;

  const profiles = (data ?? []) as unknown as ContractorProfile[];

  const vetPending  = profiles.filter((p) => p.veteran_applied_at && !p.veteran_verified);
  const vetApproved = profiles.filter((p) => p.veteran_verified);

  const dirPending  = profiles.filter((p) =>
    !p.directory_verified && p.is_listed && (p.license_number || p.coi_provider)
  );
  const dirApproved = profiles.filter((p) => p.directory_verified);

  const { data: credData, error: credError } = await supabaseAdmin
    .from("contractor_credentials")
    .select("id, contractor_id, credential_type, state, city, credential_number, issuing_authority, trade, expiration_date, bond_amount_cents, bonding_company, verified, created_at")
    .order("created_at", { ascending: true });

  if (credError) throw credError;

  const profileLookup = new Map(profiles.map((p) => [p.contractor_id, p]));
  const credentials = (credData ?? []).map((c) => ({
    ...c,
    business_name: profileLookup.get(c.contractor_id)?.business_name ?? null,
  }));

  const credPending  = credentials.filter((c) => !c.verified);
  const credApproved = credentials.filter((c) => c.verified);

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
      {/* Header */}
      <div className="mob-col mob-gap-sm" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "36px", letterSpacing: "1px", color: "var(--camo-charcoal)", margin: 0 }}>
            Contractor Verification
          </h1>
          <p style={{ fontSize: "13px", color: "var(--camo-gunmetal)", marginTop: "4px" }}>
            {dirPending.length} directory pending · {vetPending.length} veteran pending · {credPending.length} credentials pending
          </p>
        </div>
        <Link href="/dashboard/admin" style={{ background: "transparent", color: "var(--camo-gunmetal)", border: "1px solid #d9dbdb", padding: "8px 16px", borderRadius: "6px", fontFamily: "'Barlow', sans-serif", fontSize: "13px", textDecoration: "none" }}>
          Back
        </Link>
      </div>

      {/* Note requirement banner */}
      <div style={{ background: "var(--camo-concrete)", border: "1px solid #d9dbdb", borderRadius: "8px", padding: "10px 16px", marginBottom: "20px", fontSize: "12px", color: "var(--camo-gunmetal)" }}>
        ℹ️ <strong>A note is required</strong> for every approval and rejection. Your name is recorded automatically in the audit log shown on each contractor's admin profile.
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
        <Link href="/dashboard/admin/vet-certification?tab=directory" style={tabStyle(tab === "directory")}>
          📋 Directory Verification
          {dirPending.length > 0 && (
            <span style={{ marginLeft: "8px", background: "var(--camo-accent)", color: "var(--camo-ink)", borderRadius: "20px", padding: "1px 7px", fontSize: "11px" }}>
              {dirPending.length}
            </span>
          )}
        </Link>
        <Link href="/dashboard/admin/vet-certification?tab=veteran" style={tabStyle(tab === "veteran")}>
          ★ Veteran Certification
          {vetPending.length > 0 && (
            <span style={{ marginLeft: "8px", background: tab === "veteran" ? "#fff" : "var(--camo-accent)", color: tab === "veteran" ? "var(--camo-accent)" : "var(--camo-ink)", borderRadius: "20px", padding: "1px 7px", fontSize: "11px" }}>
              {vetPending.length}
            </span>
          )}
        </Link>
        <Link href="/dashboard/admin/vet-certification?tab=credentials" style={tabStyle(tab === "credentials")}>
          📜 Licenses & Bonding
          {credPending.length > 0 && (
            <span style={{ marginLeft: "8px", background: tab === "credentials" ? "#fff" : "var(--camo-accent)", color: tab === "credentials" ? "var(--camo-accent)" : "var(--camo-ink)", borderRadius: "20px", padding: "1px 7px", fontSize: "11px" }}>
              {credPending.length}
            </span>
          )}
        </Link>
      </div>

      {/* ── Directory Verification Tab ─────────────────────────────────────── */}
      {tab === "directory" && (
        <div>
          <div style={{ marginBottom: "32px" }}>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "18px", letterSpacing: "1px", color: "var(--camo-charcoal)", textTransform: "uppercase", marginBottom: "12px" }}>
              Pending Verification ({dirPending.length})
            </h2>

            {dirPending.length === 0 ? (
              <div style={{ background: "var(--camo-concrete)", border: "1px solid #d9dbdb", borderRadius: "10px", padding: "24px", textAlign: "center", color: "var(--camo-gunmetal)", fontSize: "14px" }}>
                No pending directory verification requests.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {dirPending.map((p) => {
                  const licenseExpired = isExpired(p.license_expiry);
                  const coiExpired     = isExpired(p.coi_expiry);
                  return (
                    <div key={p.contractor_id} style={{ background: "var(--camo-concrete)", border: "1px solid var(--camo-gunmetal)", borderRadius: "10px", padding: "18px" }}>
                      {/* Contractor name + link */}
                      <div style={{ fontWeight: 600, fontSize: "15px", color: "var(--camo-charcoal)", marginBottom: "2px" }}>
                        {p.business_name ?? "No business name set"}
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--camo-gunmetal)", marginBottom: "12px" }}>
                        {[p.city, p.state].filter(Boolean).join(", ") || "No location set"}
                      </div>

                      {/* License & COI details */}
                      <div style={{ background: "#FFFFFF", border: "1px solid #d9dbdb", borderRadius: "8px", padding: "12px 14px", marginBottom: "14px" }}>
                        <div className="mob-grid-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "12px" }}>
                          <div>
                            <div style={{ color: "var(--camo-gunmetal)", marginBottom: "2px" }}>License #</div>
                            <div style={{ color: "var(--camo-charcoal)" }}>{p.license_number ?? "—"}</div>
                          </div>
                          <div>
                            <div style={{ color: "var(--camo-gunmetal)", marginBottom: "2px" }}>License Expires</div>
                            <div style={{ color: licenseExpired ? "#991B1B" : "var(--camo-charcoal)" }}>
                              {formatDate(p.license_expiry)}{licenseExpired && " ⚠ EXPIRED"}
                            </div>
                          </div>
                          <div>
                            <div style={{ color: "var(--camo-gunmetal)", marginBottom: "2px" }}>Insurance Provider</div>
                            <div style={{ color: "var(--camo-charcoal)" }}>{p.coi_provider ?? "—"}</div>
                          </div>
                          <div>
                            <div style={{ color: "var(--camo-gunmetal)", marginBottom: "2px" }}>Policy #</div>
                            <div style={{ color: "var(--camo-charcoal)" }}>{p.coi_policy_number ?? "—"}</div>
                          </div>
                          <div>
                            <div style={{ color: "var(--camo-gunmetal)", marginBottom: "2px" }}>COI Expires</div>
                            <div style={{ color: coiExpired ? "#991B1B" : "var(--camo-charcoal)" }}>
                              {formatDate(p.coi_expiry)}{coiExpired && " ⚠ EXPIRED"}
                            </div>
                          </div>
                          <div>
                            <div style={{ color: "var(--camo-gunmetal)", marginBottom: "2px" }}>Coverage Amount</div>
                            <div style={{ color: "var(--camo-charcoal)" }}>{fmtMoney(p.coi_amount)}</div>
                          </div>
                        </div>
                      </div>

                      {/* BBB link — independent of the approve/reject decision; presence of a URL is itself the verification */}
                      <form action={updateBbbLink.bind(null, p.contractor_id)} style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
                        <input
                          name="bbb_url"
                          type="url"
                          defaultValue={p.bbb_url ?? ""}
                          placeholder="https://www.bbb.org/us/..."
                          style={{ flex: 1, fontSize: "12px", padding: "8px 10px", borderRadius: "4px", border: "1px solid #d9dbdb", fontFamily: "'Barlow', sans-serif" }}
                        />
                        <button
                          type="submit"
                          style={{ fontSize: "12px", padding: "8px 14px", borderRadius: "4px", border: "1px solid #d9dbdb", background: "#FFFFFF", color: "var(--camo-charcoal)", fontFamily: "'Barlow', sans-serif", fontWeight: 600, cursor: "pointer" }}
                        >
                          Save BBB Link
                        </button>
                      </form>

                      {/* Decision form — one form, approve or reject button, shared note */}
                      <form action={handleDirectoryDecision.bind(null, p.contractor_id)}>
                        <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--camo-gunmetal)", textTransform: "uppercase", letterSpacing: "1px" }}>
                          Admin Note <span style={{ color: "var(--camo-accent-dim)" }}>*</span>
                        </label>
                        <textarea
                          name="note"
                          required
                          rows={2}
                          placeholder="e.g. License verified against TX state database. COI confirmed valid through expiry."
                          style={noteStyle}
                        />
                        <div style={{ display: "flex", gap: "8px", marginTop: "10px", flexWrap: "wrap" }}>
                          <button
                            type="submit"
                            name="decision"
                            value="approve"
                            style={{ background: "#F0FDF4", color: "#15803D", border: "1px solid #166534", padding: "8px 20px", borderRadius: "6px", fontFamily: "'Barlow', sans-serif", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}
                          >
                            ✅ Approve Verification
                          </button>
                          <button
                            type="submit"
                            name="decision"
                            value="reject"
                            style={{ background: "#FEF2F2", color: "#991B1B", border: "1px solid #FCA5A5", padding: "8px 20px", borderRadius: "6px", fontFamily: "'Barlow', sans-serif", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}
                          >
                            ✗ Reject
                          </button>
                        </div>
                      </form>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Already verified */}
          {dirApproved.length > 0 && (
            <div>
              <hr style={{ border: "none", borderTop: "1px solid #d9dbdb", margin: "0 0 20px" }} />
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "18px", letterSpacing: "1px", color: "var(--camo-gunmetal)", textTransform: "uppercase", marginBottom: "12px" }}>
                Verified ({dirApproved.length})
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {dirApproved.map((p) => (
                  <div key={p.contractor_id} className="mob-card-stack" style={{ background: "var(--camo-concrete)", border: "1px solid #d9dbdb", borderRadius: "10px", padding: "16px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "15px", color: "var(--camo-charcoal)", marginBottom: "3px" }}>{p.business_name ?? "No name"}</div>
                      <div style={{ fontSize: "12px", color: "var(--camo-gunmetal)" }}>{[p.city, p.state].filter(Boolean).join(", ") || "—"}</div>
                      {p.directory_verified_at && (
                        <div style={{ fontSize: "11px", color: "var(--camo-gunmetal)", marginTop: "2px" }}>Verified: {formatDate(p.directory_verified_at)}</div>
                      )}
                      {/* BBB link — editable any time, independent of directory verification status */}
                      <form action={updateBbbLink.bind(null, p.contractor_id)} style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
                        <input
                          name="bbb_url"
                          type="url"
                          defaultValue={p.bbb_url ?? ""}
                          placeholder="BBB profile URL"
                          style={{ fontSize: "11px", padding: "5px 8px", borderRadius: "4px", border: "1px solid #d9dbdb", fontFamily: "'Barlow', sans-serif", width: "200px" }}
                        />
                        <button
                          type="submit"
                          style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "4px", border: "1px solid #d9dbdb", background: "#FFFFFF", color: "var(--camo-charcoal)", fontFamily: "'Barlow', sans-serif", cursor: "pointer" }}
                        >
                          Save
                        </button>
                      </form>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                      <span style={{ fontSize: "11px", fontWeight: 600, padding: "4px 10px", borderRadius: "20px", background: "#F0FDF4", color: "#15803D", border: "1px solid #166534" }}>
                        ✅ Verified
                      </span>
                      {/* Re-review form */}
                      <form action={handleDirectoryDecision.bind(null, p.contractor_id)} style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-end" }}>
                        <input
                          name="note"
                          required
                          placeholder="Note required to reverse…"
                          style={{ fontSize: "12px", padding: "5px 8px", borderRadius: "4px", border: "1px solid #d9dbdb", fontFamily: "'Barlow', sans-serif", width: "200px" }}
                        />
                        <button
                          type="submit"
                          name="decision"
                          value="reject"
                          style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "4px", border: "1px solid #FCA5A5", background: "#FEF2F2", color: "#991B1B", fontFamily: "'Barlow', sans-serif", cursor: "pointer" }}
                        >
                          Remove Verification
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Veteran Certification Tab ──────────────────────────────────────── */}
      {tab === "veteran" && (
        <div>
          <div style={{ marginBottom: "32px" }}>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "18px", letterSpacing: "1px", color: vetPending.length > 0 ? "#92400E" : "var(--camo-charcoal)", textTransform: "uppercase", marginBottom: "12px" }}>
              Pending Review ({vetPending.length})
            </h2>

            {vetPending.length === 0 ? (
              <div style={{ background: "var(--camo-concrete)", border: "1px solid #d9dbdb", borderRadius: "10px", padding: "24px", textAlign: "center", color: "var(--camo-gunmetal)", fontSize: "14px" }}>
                No pending veteran applications.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {vetPending.map((a) => (
                  <div key={a.contractor_id} style={{ background: "var(--camo-concrete)", border: "1px solid #FCD34D", borderRadius: "10px", padding: "18px" }}>
                    <div style={{ fontWeight: 600, fontSize: "15px", color: "var(--camo-charcoal)", marginBottom: "2px" }}>
                      {a.business_name ?? "No business name set"}
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--camo-gunmetal)", marginBottom: "2px" }}>
                      {[a.city, a.state].filter(Boolean).join(", ") || "No location set"}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--camo-gunmetal)", marginBottom: "10px" }}>
                      Applied: {formatDate(a.veteran_applied_at)}
                    </div>

                    <div style={{ background: "#FFFFFF", border: "1px solid #d9dbdb", borderRadius: "8px", padding: "10px 14px", marginBottom: "14px", fontSize: "12px" }}>
                      <div style={{ color: "var(--camo-gunmetal)", marginBottom: "2px" }}>Credential Submitted</div>
                      <div style={{ color: "var(--camo-charcoal)" }}>
                        {a.veteran_credential_type === "TVC_VVL"
                          ? "Texas Veterans Commission (TVC VVL)"
                          : a.veteran_credential_type === "VA_VETCERT"
                          ? "VA VetCert (Vets First Verification)"
                          : "— No credential type selected —"}
                        {a.veteran_credential_reference ? ` — ${a.veteran_credential_reference}` : ""}
                      </div>
                    </div>

                    <form action={handleVetCertDecision.bind(null, a.contractor_id)}>
                      <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--camo-gunmetal)", textTransform: "uppercase", letterSpacing: "1px" }}>
                        Admin Note <span style={{ color: "var(--camo-accent-dim)" }}>*</span>
                      </label>
                      <textarea
                        name="note"
                        required
                        rows={2}
                        placeholder="e.g. DD-214 reviewed and confirmed. Veteran status approved."
                        style={noteStyle}
                      />
                      <label style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginTop: "10px", fontSize: "12px", color: "var(--camo-charcoal)", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          name="registry_checked"
                          required
                          style={{ marginTop: "2px", accentColor: "var(--camo-accent)", flexShrink: 0 }}
                        />
                        I looked up this credential in the public TVC or VA VetCert registry before making this decision.
                      </label>
                      <div style={{ display: "flex", gap: "8px", marginTop: "10px", flexWrap: "wrap" }}>
                        <button
                          type="submit"
                          name="decision"
                          value="approve"
                          style={{ background: "#FFF7ED", color: "#B45309", border: "1px solid #D97706", padding: "8px 20px", borderRadius: "6px", fontFamily: "'Barlow', sans-serif", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}
                        >
                          ★ Approve Veteran Cert
                        </button>
                        <button
                          type="submit"
                          name="decision"
                          value="reject"
                          style={{ background: "#FEF2F2", color: "#991B1B", border: "1px solid #FCA5A5", padding: "8px 20px", borderRadius: "6px", fontFamily: "'Barlow', sans-serif", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}
                        >
                          ✗ Reject
                        </button>
                      </div>
                    </form>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Certified veterans */}
          {vetApproved.length > 0 && (
            <div>
              <hr style={{ border: "none", borderTop: "1px solid #d9dbdb", margin: "0 0 20px" }} />
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "18px", letterSpacing: "1px", color: "var(--camo-gunmetal)", textTransform: "uppercase", marginBottom: "12px" }}>
                Certified Veteran Owned ({vetApproved.length})
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {vetApproved.map((a) => (
                  <div key={a.contractor_id} className="mob-card-stack" style={{ background: "var(--camo-concrete)", border: "1px solid #d9dbdb", borderRadius: "10px", padding: "16px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "15px", color: "var(--camo-charcoal)", marginBottom: "3px" }}>{a.business_name ?? "No name"}</div>
                      <div style={{ fontSize: "12px", color: "var(--camo-gunmetal)" }}>{[a.city, a.state].filter(Boolean).join(", ") || "—"}</div>
                      {a.veteran_verified_at && (
                        <div style={{ fontSize: "11px", color: "var(--camo-gunmetal)", marginTop: "2px" }}>Certified: {formatDate(a.veteran_verified_at)}</div>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                      <span style={{ fontSize: "11px", fontWeight: 600, padding: "4px 10px", borderRadius: "20px", background: "#FFF7ED", color: "#B45309", border: "1px solid #D97706" }}>
                        ★ Certified
                      </span>
                      {/* Revoke form */}
                      <form action={handleVetCertDecision.bind(null, a.contractor_id)} style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-end" }}>
                        <input
                          name="note"
                          required
                          placeholder="Note required to revoke…"
                          style={{ fontSize: "12px", padding: "5px 8px", borderRadius: "4px", border: "1px solid #d9dbdb", fontFamily: "'Barlow', sans-serif", width: "200px" }}
                        />
                        <button
                          type="submit"
                          name="decision"
                          value="reject"
                          style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "4px", border: "1px solid #FCA5A5", background: "#FEF2F2", color: "#991B1B", fontFamily: "'Barlow', sans-serif", cursor: "pointer" }}
                        >
                          Revoke Certification
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Licenses & Bonding Tab ──────────────────────────────────────── */}
      {tab === "credentials" && (
        <div>
          <div style={{ marginBottom: "32px" }}>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "18px", letterSpacing: "1px", color: credPending.length > 0 ? "#92400E" : "var(--camo-charcoal)", textTransform: "uppercase", marginBottom: "12px" }}>
              Pending Review ({credPending.length})
            </h2>

            {credPending.length === 0 ? (
              <div style={{ background: "var(--camo-concrete)", border: "1px solid #d9dbdb", borderRadius: "10px", padding: "24px", textAlign: "center", color: "var(--camo-gunmetal)", fontSize: "14px" }}>
                No pending credential submissions.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {credPending.map((c) => (
                  <div key={c.id} style={{ background: "var(--camo-concrete)", border: "1px solid #FCD34D", borderRadius: "10px", padding: "18px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "10px", flexWrap: "wrap" }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "15px", color: "var(--camo-charcoal)" }}>
                          {c.business_name ?? "No business name set"}
                        </div>
                        <Link href={`/dashboard/admin/users/${c.contractor_id}`} style={{ fontSize: "11px", color: "var(--camo-gunmetal)", textDecoration: "underline" }}>
                          View full contractor profile →
                        </Link>
                      </div>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <form action={setCredentialVerified.bind(null, c.contractor_id, c.id)}>
                          <input type="hidden" name="verify" value="true" />
                          <button type="submit" style={{ background: "#F0FDF4", color: "#15803D", border: "1px solid #166534", padding: "6px 14px", borderRadius: "6px", fontFamily: "'Barlow', sans-serif", fontWeight: 600, fontSize: "12px", cursor: "pointer" }}>
                            ✅ Verify
                          </button>
                        </form>
                        <form action={deleteCredentialAdmin.bind(null, c.contractor_id, c.id)}>
                          <button type="submit" style={{ background: "#FEF2F2", color: "#991B1B", border: "1px solid #FCA5A5", padding: "6px 14px", borderRadius: "6px", fontFamily: "'Barlow', sans-serif", fontWeight: 600, fontSize: "12px", cursor: "pointer" }}>
                            ✗ Delete
                          </button>
                        </form>
                      </div>
                    </div>
                    <div className="mob-grid-1" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", fontSize: "12px" }}>
                      <div>
                        <div style={{ color: "var(--camo-gunmetal)" }}>Type</div>
                        <div style={{ color: "var(--camo-charcoal)" }}>
                          {CREDENTIAL_TYPE_LABELS[c.credential_type] ?? c.credential_type}
                          {c.trade && ` · ${c.trade}`}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: "var(--camo-gunmetal)" }}>State/City</div>
                        <div style={{ color: "var(--camo-charcoal)" }}>{[c.state, c.city].filter(Boolean).join(" / ") || "—"}</div>
                      </div>
                      <div>
                        <div style={{ color: "var(--camo-gunmetal)" }}>Number</div>
                        <div style={{ color: "var(--camo-charcoal)" }}>{c.credential_number || "—"}</div>
                      </div>
                      <div>
                        <div style={{ color: "var(--camo-gunmetal)" }}>Authority</div>
                        <div style={{ color: "var(--camo-charcoal)" }}>{c.issuing_authority || "—"}</div>
                      </div>
                      <div>
                        <div style={{ color: "var(--camo-gunmetal)" }}>Expires</div>
                        <div style={{ color: "var(--camo-charcoal)" }}>{formatDate(c.expiration_date)}</div>
                      </div>
                      {c.credential_type === "BOND" && (
                        <div>
                          <div style={{ color: "var(--camo-gunmetal)" }}>Bond</div>
                          <div style={{ color: "var(--camo-charcoal)" }}>
                            {c.bond_amount_cents ? fmtMoney(c.bond_amount_cents / 100) : "—"}
                            {c.bonding_company && ` via ${c.bonding_company}`}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {credApproved.length > 0 && (
            <div>
              <hr style={{ border: "none", borderTop: "1px solid #d9dbdb", margin: "0 0 20px" }} />
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "18px", letterSpacing: "1px", color: "var(--camo-gunmetal)", textTransform: "uppercase", marginBottom: "12px" }}>
                Verified ({credApproved.length})
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {credApproved.map((c) => (
                  <div key={c.id} className="mob-card-stack" style={{ background: "var(--camo-concrete)", border: "1px solid #d9dbdb", borderRadius: "10px", padding: "16px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "15px", color: "var(--camo-charcoal)", marginBottom: "3px" }}>{c.business_name ?? "No name"}</div>
                      <div style={{ fontSize: "12px", color: "var(--camo-gunmetal)" }}>
                        {CREDENTIAL_TYPE_LABELS[c.credential_type] ?? c.credential_type}
                        {c.trade && ` · ${c.trade}`} · {[c.state, c.city].filter(Boolean).join(", ") || "—"}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                      <span style={{ fontSize: "11px", fontWeight: 600, padding: "4px 10px", borderRadius: "20px", background: "#F0FDF4", color: "#15803D", border: "1px solid #166534" }}>
                        ✅ Verified
                      </span>
                      <form action={setCredentialVerified.bind(null, c.contractor_id, c.id)}>
                        <input type="hidden" name="verify" value="false" />
                        <button type="submit" style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "4px", border: "1px solid #FCA5A5", background: "#FEF2F2", color: "#991B1B", fontFamily: "'Barlow', sans-serif", cursor: "pointer" }}>
                          Unverify
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
