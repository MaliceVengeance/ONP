import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { approveVetCert, rejectVetCert, approveDirectoryVerification, rejectDirectoryVerification } from "./actions";

type ContractorProfile = {
  contractor_id: string;
  business_name: string | null;
  city: string | null;
  state: string | null;
  veteran_applied_at: string | null;
  veteran_verified: boolean;
  license_number: string | null;
  license_expiry: string | null;
  coi_provider: string | null;
  coi_policy_number: string | null;
  coi_expiry: string | null;
  coi_amount: number | null;
  directory_verified: boolean | null;
  directory_verified_at: string | null;
  is_listed: boolean | null;
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

export default async function VetCertificationPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const sp = await searchParams;
  const tab = sp.tab === "directory" ? "directory" : "veteran";

  const { supabase } = await requireRole(["ADMIN"]);

  const { data, error } = await supabase
    .from("contractor_profiles")
    .select("contractor_id, business_name, city, state, veteran_applied_at, veteran_verified, license_number, license_expiry, coi_provider, coi_policy_number, coi_expiry, coi_amount, directory_verified, directory_verified_at, is_listed")
    .order("veteran_applied_at", { ascending: true });

  if (error) throw error;

  const profiles = (data ?? []) as ContractorProfile[];

  // Veteran applications
  const vetPending = profiles.filter((p) => p.veteran_applied_at && !p.veteran_verified);
  const vetApproved = profiles.filter((p) => p.veteran_verified);

  // Directory verification — contractors who have submitted license info but aren't verified yet
  const dirPending = profiles.filter((p) =>
    !p.directory_verified &&
    p.is_listed &&
    (p.license_number || p.coi_provider)
  );
  const dirApproved = profiles.filter((p) => p.directory_verified);

  const tabStyle = (active: boolean) => ({
    padding: "10px 20px",
    borderRadius: "6px",
    fontFamily: "'Barlow', sans-serif",
    fontWeight: 600,
    fontSize: "13px",
    textDecoration: "none",
    display: "inline-block",
    background: active ? "#C8102E" : "transparent",
    color: active ? "#fff" : "#1B4F8A",
    border: active ? "none" : "1px solid #B8D0E8",
  } as React.CSSProperties);

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h1 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "36px",
            letterSpacing: "1px",
            color: "#0A1628",
            margin: 0,
          }}>
            Contractor Verification
          </h1>
          <p style={{ fontSize: "13px", color: "#1B4F8A", marginTop: "4px" }}>
            {dirPending.length} directory pending • {vetPending.length} veteran pending
          </p>
        </div>
        <Link
          href="/dashboard/admin"
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

      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
        <Link href="/dashboard/admin/vet-certification?tab=directory" style={tabStyle(tab === "directory")}>
          📋 Directory Verification
          {dirPending.length > 0 && (
            <span style={{
              marginLeft: "8px",
              background: "#C8102E",
              color: "#fff",
              borderRadius: "20px",
              padding: "1px 7px",
              fontSize: "11px",
            }}>
              {dirPending.length}
            </span>
          )}
        </Link>
        <Link href="/dashboard/admin/vet-certification?tab=veteran" style={tabStyle(tab === "veteran")}>
          ★ Veteran Certification
          {vetPending.length > 0 && (
            <span style={{
              marginLeft: "8px",
              background: tab === "veteran" ? "#fff" : "#C8102E",
              color: tab === "veteran" ? "#C8102E" : "#fff",
              borderRadius: "20px",
              padding: "1px 7px",
              fontSize: "11px",
            }}>
              {vetPending.length}
            </span>
          )}
        </Link>
      </div>

      {/* Directory Verification Tab */}
      {tab === "directory" && (
        <div>
          <div style={{ marginBottom: "32px" }}>
            <h2 style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: "18px",
              letterSpacing: "1px",
              color: dirPending.length > 0 ? "#1B4F8A" : "#0A1628",
              textTransform: "uppercase",
              marginBottom: "12px",
            }}>
              Pending Verification ({dirPending.length})
            </h2>

            {dirPending.length === 0 ? (
              <div style={{ background: "#EEF4FF", border: "1px solid #B8D0E8", borderRadius: "10px", padding: "24px", textAlign: "center", color: "#1B4F8A", fontSize: "14px" }}>
                No pending directory verification requests.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {dirPending.map((p) => {
                  const licenseExpired = isExpired(p.license_expiry);
                  const coiExpired = isExpired(p.coi_expiry);
                  return (
                    <div key={p.contractor_id} style={{
                      background: "#EEF4FF",
                      border: "1px solid #1B4F8A",
                      borderRadius: "10px",
                      padding: "18px",
                    }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", marginBottom: "14px" }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: "15px", color: "#0A1628", marginBottom: "3px" }}>
                            {p.business_name ?? "No business name set"}
                          </div>
                          <div style={{ fontSize: "12px", color: "#1B4F8A" }}>
                            {[p.city, p.state].filter(Boolean).join(", ") || "No location set"}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                          <form action={approveDirectoryVerification.bind(null, p.contractor_id)}>
                            <button style={{
                              background: "#F0FDF4",
                              color: "#15803D",
                              border: "1px solid #166534",
                              padding: "8px 16px",
                              borderRadius: "6px",
                              fontFamily: "'Barlow', sans-serif",
                              fontWeight: 600,
                              fontSize: "13px",
                              cursor: "pointer",
                            }}>
                              Approve
                            </button>
                          </form>
                          <form action={rejectDirectoryVerification.bind(null, p.contractor_id)}>
                            <button style={{
                              background: "#FEF2F2",
                              color: "#991B1B",
                              border: "1px solid #FCA5A5",
                              padding: "8px 16px",
                              borderRadius: "6px",
                              fontFamily: "'Barlow', sans-serif",
                              fontWeight: 600,
                              fontSize: "13px",
                              cursor: "pointer",
                            }}>
                              Reject
                            </button>
                          </form>
                        </div>
                      </div>

                      {/* License & COI details */}
                      <div style={{
                        background: "#FFFFFF",
                        border: "1px solid #B8D0E8",
                        borderRadius: "8px",
                        padding: "12px 14px",
                      }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "12px" }}>
                          <div>
                            <div style={{ color: "#1B4F8A", marginBottom: "2px" }}>License #</div>
                            <div style={{ color: "#0A1628" }}>{p.license_number ?? "—"}</div>
                          </div>
                          <div>
                            <div style={{ color: "#1B4F8A", marginBottom: "2px" }}>License Expires</div>
                            <div style={{ color: licenseExpired ? "#991B1B" : "#0A1628" }}>
                              {formatDate(p.license_expiry)}
                              {licenseExpired && " ⚠ EXPIRED"}
                            </div>
                          </div>
                          <div>
                            <div style={{ color: "#1B4F8A", marginBottom: "2px" }}>Insurance Provider</div>
                            <div style={{ color: "#0A1628" }}>{p.coi_provider ?? "—"}</div>
                          </div>
                          <div>
                            <div style={{ color: "#1B4F8A", marginBottom: "2px" }}>Policy #</div>
                            <div style={{ color: "#0A1628" }}>{p.coi_policy_number ?? "—"}</div>
                          </div>
                          <div>
                            <div style={{ color: "#1B4F8A", marginBottom: "2px" }}>COI Expires</div>
                            <div style={{ color: coiExpired ? "#991B1B" : "#0A1628" }}>
                              {formatDate(p.coi_expiry)}
                              {coiExpired && " ⚠ EXPIRED"}
                            </div>
                          </div>
                          <div>
                            <div style={{ color: "#1B4F8A", marginBottom: "2px" }}>Coverage Amount</div>
                            <div style={{ color: "#0A1628" }}>{fmtMoney(p.coi_amount)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Approved */}
          {dirApproved.length > 0 && (
            <div>
              <hr style={{ border: "none", borderTop: "1px solid #B8D0E8", margin: "0 0 20px" }} />
              <h2 style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: "18px",
                letterSpacing: "1px",
                color: "#1B4F8A",
                textTransform: "uppercase",
                marginBottom: "12px",
              }}>
                Verified ({dirApproved.length})
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {dirApproved.map((p) => (
                  <div key={p.contractor_id} style={{
                    background: "#EEF4FF",
                    border: "1px solid #B8D0E8",
                    borderRadius: "10px",
                    padding: "16px 18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    opacity: 0.8,
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "15px", color: "#0A1628", marginBottom: "3px" }}>
                        {p.business_name ?? "No name"}
                      </div>
                      <div style={{ fontSize: "12px", color: "#1B4F8A" }}>
                        {[p.city, p.state].filter(Boolean).join(", ") || "—"}
                      </div>
                      {p.directory_verified_at && (
                        <div style={{ fontSize: "11px", color: "#4A7FB5", marginTop: "2px" }}>
                          Verified: {formatDate(p.directory_verified_at)}
                        </div>
                      )}
                    </div>
                    <span style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      padding: "4px 10px",
                      borderRadius: "20px",
                      background: "#F0FDF4",
                      color: "#15803D",
                      border: "1px solid #166534",
                    }}>
                      ✅ Verified
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Veteran Certification Tab */}
      {tab === "veteran" && (
        <div>
          <div style={{ marginBottom: "32px" }}>
            <h2 style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: "18px",
              letterSpacing: "1px",
              color: vetPending.length > 0 ? "#92400E" : "#0A1628",
              textTransform: "uppercase",
              marginBottom: "12px",
            }}>
              Pending Review ({vetPending.length})
            </h2>

            {vetPending.length === 0 ? (
              <div style={{ background: "#EEF4FF", border: "1px solid #B8D0E8", borderRadius: "10px", padding: "24px", textAlign: "center", color: "#1B4F8A", fontSize: "14px" }}>
                No pending veteran applications.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {vetPending.map((a) => (
                  <div key={a.contractor_id} style={{
                    background: "#EEF4FF",
                    border: "1px solid #FCD34D",
                    borderRadius: "10px",
                    padding: "18px",
                  }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "15px", color: "#0A1628", marginBottom: "3px" }}>
                          {a.business_name ?? "No business name set"}
                        </div>
                        <div style={{ fontSize: "12px", color: "#1B4F8A", marginBottom: "3px" }}>
                          {[a.city, a.state].filter(Boolean).join(", ") || "No location set"}
                        </div>
                        <div style={{ fontSize: "11px", color: "#4A7FB5" }}>
                          Applied: {formatDate(a.veteran_applied_at)}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                        <form action={approveVetCert.bind(null, a.contractor_id)}>
                          <button style={{
                            background: "#FFF7ED",
                            color: "#B45309",
                            border: "1px solid #D97706",
                            padding: "8px 16px",
                            borderRadius: "6px",
                            fontFamily: "'Barlow', sans-serif",
                            fontWeight: 600,
                            fontSize: "13px",
                            cursor: "pointer",
                          }}>
                            ★ Approve
                          </button>
                        </form>
                        <form action={rejectVetCert.bind(null, a.contractor_id)}>
                          <button style={{
                            background: "#FEF2F2",
                            color: "#991B1B",
                            border: "1px solid #FCA5A5",
                            padding: "8px 16px",
                            borderRadius: "6px",
                            fontFamily: "'Barlow', sans-serif",
                            fontWeight: 600,
                            fontSize: "13px",
                            cursor: "pointer",
                          }}>
                            Reject
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Approved veterans */}
          {vetApproved.length > 0 && (
            <div>
              <hr style={{ border: "none", borderTop: "1px solid #B8D0E8", margin: "0 0 20px" }} />
              <h2 style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: "18px",
                letterSpacing: "1px",
                color: "#1B4F8A",
                textTransform: "uppercase",
                marginBottom: "12px",
              }}>
                Certified Veteran Owned ({vetApproved.length})
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {vetApproved.map((a) => (
                  <div key={a.contractor_id} style={{
                    background: "#EEF4FF",
                    border: "1px solid #B8D0E8",
                    borderRadius: "10px",
                    padding: "16px 18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    opacity: 0.8,
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "15px", color: "#0A1628", marginBottom: "3px" }}>
                        {a.business_name ?? "No name"}
                      </div>
                      <div style={{ fontSize: "12px", color: "#1B4F8A" }}>
                        {[a.city, a.state].filter(Boolean).join(", ") || "—"}
                      </div>
                    </div>
                    <span style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      padding: "4px 10px",
                      borderRadius: "20px",
                      background: "#FFF7ED",
                      color: "#B45309",
                      border: "1px solid #D97706",
                    }}>
                      ★ Certified
                    </span>
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
