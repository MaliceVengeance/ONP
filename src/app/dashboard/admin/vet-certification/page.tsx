import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { handleVetCertDecision } from "./actions";

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
};

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString();
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

export default async function VetCertificationPage() {
  await requireRole(["ADMIN"]);

  const { data, error } = await supabaseAdmin
    .from("contractor_profiles")
    .select(
      "contractor_id, business_name, city, state, veteran_applied_at, veteran_verified, veteran_verified_at, " +
      "veteran_credential_type, veteran_credential_reference"
    )
    .order("veteran_applied_at", { ascending: true });

  if (error) throw error;

  const profiles = (data ?? []) as unknown as ContractorProfile[];

  const vetPending  = profiles.filter((p) => p.veteran_applied_at && !p.veteran_verified);
  const vetApproved = profiles.filter((p) => p.veteran_verified);

  return (
    <div>
      {/* Header */}
      <div className="mob-col mob-gap-sm" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "36px", letterSpacing: "1px", color: "var(--camo-charcoal)", margin: 0 }}>
            ★ Veteran Certification
          </h1>
          <p style={{ fontSize: "13px", color: "var(--camo-gunmetal)", marginTop: "4px" }}>
            {vetPending.length} pending review
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
  );
}
