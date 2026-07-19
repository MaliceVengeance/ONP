import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { addCredential, deleteCredential } from "./actions";

const TYPE_LABELS: Record<string, string> = {
  STATE_LICENSE: "State License",
  CITY_REGISTRATION: "City Registration",
  TRADE_LICENSE: "Trade-Specific License",
  BOND: "Surety Bond",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "11px",
  fontWeight: 600,
  color: "var(--camo-gunmetal)",
  textTransform: "uppercase",
  letterSpacing: "1px",
  marginTop: "14px",
  marginBottom: "6px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#FFFFFF",
  border: "1px solid #d9dbdb",
  color: "var(--camo-charcoal)",
  borderRadius: "6px",
  padding: "9px 12px",
  fontFamily: "'Barlow', sans-serif",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box",
};

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString();
}

export default async function ContractorCredentialsPage() {
  const { user } = await requireRole(["CONTRACTOR", "ADMIN"]);

  const { data } = await supabaseAdmin
    .from("contractor_credentials")
    .select("id, credential_type, state, city, credential_number, issuing_authority, trade, expiration_date, bond_amount_cents, bonding_company, verified")
    .eq("contractor_id", user.id)
    .order("created_at", { ascending: false });

  const credentials = data ?? [];

  return (
    <div>
      <div className="mob-col mob-gap-sm" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "36px", letterSpacing: "1px", color: "var(--camo-charcoal)", margin: 0 }}>
            Licenses, Registrations & Bonding
          </h1>
          <p style={{ fontSize: "13px", color: "var(--camo-gunmetal)", marginTop: "4px", maxWidth: "560px" }}>
            Add one entry per credential — a state license, city registration, trade-specific license, or bond. Most contractors in Texas and New Mexico need more than one.
          </p>
        </div>
        <Link href="/dashboard/contractor/profile" style={{ background: "transparent", color: "var(--camo-gunmetal)", border: "1px solid #d9dbdb", padding: "8px 16px", borderRadius: "6px", fontFamily: "'Barlow', sans-serif", fontSize: "13px", textDecoration: "none", flexShrink: 0 }}>
          Back to Profile
        </Link>
      </div>

      <div style={{ background: "#FFFBEB", border: "1px solid #FCD34D", borderRadius: "8px", padding: "12px 16px", marginBottom: "24px", fontSize: "12px", color: "#92400E", lineHeight: 1.6 }}>
        <strong>Insurance protects you if something goes wrong on the job. A bond guarantees the contractor will follow through on their obligations, and gives you recourse if they don&apos;t.</strong>{" "}
        These are entered separately — insurance stays on your main profile, licenses/registrations/bonds go here.
      </div>

      {credentials.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px" }}>
          {credentials.map((c) => (
            <div key={c.id} style={{ background: "var(--camo-concrete)", border: "1px solid #d9dbdb", borderRadius: "10px", padding: "16px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "15px", color: "var(--camo-charcoal)", textTransform: "uppercase" }}>
                    {TYPE_LABELS[c.credential_type] ?? c.credential_type}
                  </span>
                  {c.trade && (
                    <span style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "20px", background: "var(--camo-paper)", border: "1px solid #d9dbdb", color: "var(--camo-gunmetal)" }}>
                      {c.trade}
                    </span>
                  )}
                  {c.verified ? (
                    <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "20px", background: "#F0FDF4", color: "#15803D", border: "1px solid #166534" }}>
                      ✅ Verified
                    </span>
                  ) : (
                    <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "20px", background: "#FFFBEB", color: "#92400E", border: "1px solid #FCD34D" }}>
                      ⏳ Pending Review
                    </span>
                  )}
                </div>
                <form action={deleteCredential.bind(null, c.id)}>
                  <button type="submit" style={{ fontSize: "11px", padding: "5px 10px", borderRadius: "4px", border: "1px solid #FCA5A5", background: "#FEF2F2", color: "#991B1B", fontFamily: "'Barlow', sans-serif", cursor: "pointer" }}>
                    Delete
                  </button>
                </form>
              </div>
              <div className="mob-grid-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", fontSize: "12px" }}>
                <div>
                  <div style={{ color: "var(--camo-gunmetal)", marginBottom: "2px" }}>State / City</div>
                  <div style={{ color: "var(--camo-charcoal)" }}>{[c.state, c.city].filter(Boolean).join(" / ") || "—"}</div>
                </div>
                <div>
                  <div style={{ color: "var(--camo-gunmetal)", marginBottom: "2px" }}>Number</div>
                  <div style={{ color: "var(--camo-charcoal)" }}>{c.credential_number || "—"}</div>
                </div>
                <div>
                  <div style={{ color: "var(--camo-gunmetal)", marginBottom: "2px" }}>Issuing Authority</div>
                  <div style={{ color: "var(--camo-charcoal)" }}>{c.issuing_authority || "—"}</div>
                </div>
                <div>
                  <div style={{ color: "var(--camo-gunmetal)", marginBottom: "2px" }}>Expires</div>
                  <div style={{ color: "var(--camo-charcoal)" }}>{formatDate(c.expiration_date)}</div>
                </div>
                {c.credential_type === "BOND" && (
                  <>
                    <div>
                      <div style={{ color: "var(--camo-gunmetal)", marginBottom: "2px" }}>Bond Amount</div>
                      <div style={{ color: "var(--camo-charcoal)" }}>{c.bond_amount_cents ? `$${(c.bond_amount_cents / 100).toLocaleString()}` : "—"}</div>
                    </div>
                    <div>
                      <div style={{ color: "var(--camo-gunmetal)", marginBottom: "2px" }}>Bonding Company</div>
                      <div style={{ color: "var(--camo-charcoal)" }}>{c.bonding_company || "—"}</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ background: "var(--camo-concrete)", border: "1px solid #d9dbdb", borderRadius: "12px", padding: "24px", maxWidth: "560px" }}>
        <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "18px", letterSpacing: "1px", color: "var(--camo-charcoal)", textTransform: "uppercase", marginBottom: "4px" }}>
          Add a Credential
        </h2>

        <form action={addCredential}>
          <label style={{ ...labelStyle, marginTop: "12px" }}>
            Credential Type <span style={{ color: "var(--camo-accent-dim)" }}>*</span>
          </label>
          <select name="credential_type" required style={inputStyle}>
            <option value="">Select type…</option>
            <option value="STATE_LICENSE">State License</option>
            <option value="CITY_REGISTRATION">City Registration</option>
            <option value="TRADE_LICENSE">Trade-Specific License (e.g. TDLR electrician)</option>
            <option value="BOND">Surety Bond</option>
          </select>

          <div className="mob-grid-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={labelStyle}>State</label>
              <input name="state" maxLength={2} placeholder="TX" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>City (if city-level)</label>
              <input name="city" placeholder="El Paso" style={inputStyle} />
            </div>
          </div>

          <label style={labelStyle}>Trade</label>
          <input name="trade" placeholder="e.g. General, Electrical, Plumbing, HVAC" style={inputStyle} />

          <div className="mob-grid-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={labelStyle}>License/Registration Number</label>
              <input name="credential_number" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Issuing Authority</label>
              <input name="issuing_authority" placeholder="e.g. City of El Paso, TDLR" style={inputStyle} />
            </div>
          </div>

          <label style={labelStyle}>Expiration Date</label>
          <input type="date" name="expiration_date" style={inputStyle} />

          <div style={{ borderTop: "1px solid #d9dbdb", marginTop: "16px", paddingTop: "12px" }}>
            <p style={{ fontSize: "11px", color: "var(--camo-gunmetal)", marginBottom: "4px" }}>
              Only fill these in if the credential type above is a Bond:
            </p>
            <div className="mob-grid-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={labelStyle}>Bond Amount ($)</label>
                <input type="number" name="bond_amount" step="0.01" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Bonding Company</label>
                <input name="bonding_company" style={inputStyle} />
              </div>
            </div>
          </div>

          <button
            type="submit"
            style={{
              marginTop: "20px",
              background: "var(--camo-accent)",
              color: "var(--camo-ink)",
              border: "none",
              padding: "12px 24px",
              borderRadius: "6px",
              fontFamily: "'Barlow', sans-serif",
              fontWeight: 600,
              fontSize: "14px",
              letterSpacing: "0.5px",
              cursor: "pointer",
            }}
          >
            Add Credential
          </button>
        </form>
      </div>
    </div>
  );
}
