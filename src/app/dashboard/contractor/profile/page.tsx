import { requireRole } from "@/lib/auth/requireRole";
import { saveContractorProfile } from "./actions";
import Link from "next/link";
import { isProfileComplete, profileMissingFields } from "@/lib/contractor/profileComplete";

const MILITARY_BRANCHES = [
  { value: "army", label: "U.S. Army", emoji: "🪖" },
  { value: "navy", label: "U.S. Navy", emoji: "⚓" },
  { value: "marines", label: "U.S. Marine Corps", emoji: "🦅" },
  { value: "air_force", label: "U.S. Air Force", emoji: "✈️" },
  { value: "space_force", label: "U.S. Space Force", emoji: "🚀" },
  { value: "coast_guard", label: "U.S. Coast Guard", emoji: "⚓" },
  { value: "national_guard", label: "National Guard", emoji: "🛡️" },
];

export default async function ContractorProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const sp = await searchParams;
  const { supabase, user } = await requireRole(["CONTRACTOR", "ADMIN"]);

  const { data: profile } = await supabase
    .from("contractor_profiles")
    .select(
      "business_name,phone,address_line1,address_line2,city,state,address_zip,categories,description,is_listed,veteran_applied_at,veteran_verified,veteran_verified_at,veteran_credential_type,veteran_credential_reference,veteran_rejection_reason,military_branch,license_number,license_expiry,coi_provider,coi_policy_number,coi_expiry,coi_amount,directory_verified,directory_verified_at,has_no_license,has_no_insurance"
    )
    .eq("contractor_id", user.id)
    .maybeSingle();

  const categories = (profile?.categories ?? []) as string[];
  const profileDone = isProfileComplete(profile);
  const missing = profileMissingFields(profile);

  const inputStyle = {
    width: "100%",
    background: "#FFFFFF",
    border: "1px solid #d9dbdb",
    color: "var(--camo-charcoal)",
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
    color: "var(--camo-gunmetal)",
    textTransform: "uppercase" as const,
    letterSpacing: "1px",
    marginTop: "16px",
  };

  return (
    <div style={{ maxWidth: "600px" }}>
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
            My Profile
          </h1>
          <p style={{ fontSize: "13px", color: "var(--camo-gunmetal)", marginTop: "4px" }}>
            Your public profile shown to clients and in the contractor directory.
          </p>
        </div>
        <Link
          href="/dashboard/contractor"
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

      {/* Profile incomplete banner */}
      {!profileDone && (
        <div style={{
          background: "#FEF2F2",
          border: "1px solid #FCA5A5",
          borderRadius: "8px",
          padding: "14px 18px",
          marginBottom: "20px",
          fontSize: "13px",
          color: "#991B1B",
          lineHeight: 1.6,
        }}>
          <strong>Profile incomplete</strong> — you must fill in your {missing.join(", ")} before you can subscribe or submit bids.
        </div>
      )}

      {/* Success banner */}
      {sp.saved === "1" && (
        <div style={{
          background: "#F0FDF4",
          border: "1px solid #166534",
          color: "#15803D",
          padding: "14px 18px",
          borderRadius: "8px",
          fontSize: "13px",
          marginBottom: "20px",
        }}>
          ✅ Profile saved successfully.
        </div>
      )}

      {/* Status cards row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
        {/* Directory verification status */}
        <div style={{
          background: profile?.directory_verified ? "#F0FDF4" : "var(--camo-concrete)",
          border: `1px solid ${profile?.directory_verified ? "#166534" : "#d9dbdb"}`,
          borderRadius: "10px",
          padding: "14px 16px",
        }}>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "14px",
            letterSpacing: "1px",
            color: profile?.directory_verified ? "#15803D" : "var(--camo-gunmetal)",
            textTransform: "uppercase",
            marginBottom: "4px",
          }}>
            {profile?.directory_verified ? "✅ Verified" : "⏳ Not Verified"}
          </div>
          <div style={{ fontSize: "11px", color: "var(--camo-gunmetal)" }}>
            {profile?.directory_verified
              ? `Since ${profile.directory_verified_at ? new Date(profile.directory_verified_at).toLocaleDateString() : "—"}`
              : "License & COI pending review"}
          </div>
        </div>

        {/* Veteran status */}
        <div style={{
          background: profile?.veteran_verified ? "#FFF7ED" : "var(--camo-concrete)",
          border: `1px solid ${profile?.veteran_verified ? "#D97706" : "#d9dbdb"}`,
          borderRadius: "10px",
          padding: "14px 16px",
        }}>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "14px",
            letterSpacing: "1px",
            color: profile?.veteran_verified ? "#B45309" : "var(--camo-gunmetal)",
            textTransform: "uppercase",
            marginBottom: "4px",
          }}>
            {profile?.veteran_verified ? "★ Veteran Owned" : "Veteran Status"}
          </div>
          <div style={{ fontSize: "11px", color: "var(--camo-gunmetal)" }}>
            {profile?.veteran_verified
              ? "Certified veteran owned"
              : profile?.veteran_applied_at
              ? "Application pending"
              : "Not applied"}
          </div>
          {!profile?.veteran_verified && !profile?.veteran_applied_at && profile?.veteran_rejection_reason && (
            <div style={{ fontSize: "11px", color: "#991B1B", marginTop: "6px", lineHeight: 1.5 }}>
              ✗ Previous application not approved: {profile.veteran_rejection_reason}
            </div>
          )}
        </div>
      </div>

      {/* Main form */}
      <div style={{
        background: "var(--camo-concrete)",
        border: "1px solid #d9dbdb",
        borderRadius: "12px",
        padding: "24px",
        marginBottom: "20px",
      }}>
        <h2 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: "18px",
          letterSpacing: "1px",
          color: "var(--camo-charcoal)",
          textTransform: "uppercase",
          marginBottom: "4px",
        }}>
          Business Information
        </h2>
        <p style={{ fontSize: "12px", color: "var(--camo-gunmetal)", marginBottom: "16px" }}>
          Visible to clients when you submit a bid and in the public directory.
        </p>

        <form action={saveContractorProfile}>
          <div style={{
            background: "#FFFFFF",
            border: "1px solid #d9dbdb",
            borderRadius: "8px",
            padding: "10px 14px",
            marginBottom: "16px",
            fontSize: "12px",
            color: "var(--camo-gunmetal)",
          }}>
            ★ <strong style={{ color: "var(--camo-charcoal)" }}>Business name, phone, and at least one trade category are required</strong> to subscribe and submit bids.
          </div>

          <label style={{ ...labelStyle, marginTop: 0 }}>
            Business Name <span style={{ color: "var(--camo-accent-dim)" }}>*</span>
          </label>
          <input
            name="business_name"
            defaultValue={profile?.business_name ?? ""}
            style={inputStyle}
            placeholder="e.g. Bravo Roofing LLC"
            required
          />

          <label style={labelStyle}>
            Phone Number <span style={{ color: "var(--camo-accent-dim)" }}>*</span>
          </label>
          <input
            name="phone"
            type="tel"
            defaultValue={(profile as any)?.phone ?? ""}
            style={inputStyle}
            placeholder="e.g. (915) 555-0100"
            required
          />

          <label style={labelStyle}>Business Address</label>
          <input
            name="address_line1"
            defaultValue={(profile as any)?.address_line1 ?? ""}
            style={inputStyle}
            placeholder="Street address"
          />

          <label style={{ ...labelStyle, marginTop: "8px" }}>Address Line 2</label>
          <input
            name="address_line2"
            defaultValue={(profile as any)?.address_line2 ?? ""}
            style={inputStyle}
            placeholder="Suite, unit, building (optional)"
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 100px", gap: "12px" }}>
            <div>
              <label style={labelStyle}>City</label>
              <input
                name="city"
                defaultValue={profile?.city ?? ""}
                style={inputStyle}
                placeholder="e.g. El Paso"
              />
            </div>
            <div>
              <label style={labelStyle}>State</label>
              <input
                name="state"
                defaultValue={profile?.state ?? ""}
                style={inputStyle}
                placeholder="e.g. TX"
              />
            </div>
            <div>
              <label style={labelStyle}>ZIP</label>
              <input
                name="address_zip"
                defaultValue={(profile as any)?.address_zip ?? ""}
                style={inputStyle}
                placeholder="79901"
                maxLength={10}
              />
            </div>
          </div>

          <label style={labelStyle}>
            Service Categories (comma-separated) <span style={{ color: "var(--camo-accent-dim)" }}>*</span>
          </label>
          <input
            name="categories"
            defaultValue={categories.join(", ")}
            style={inputStyle}
            placeholder="Roofing, Drywall, Concrete, Electrical…"
          />
          <p style={{ fontSize: "11px", color: "var(--camo-gunmetal)", marginTop: "4px" }}>
            Used to match you with relevant projects. At least one category is required.
          </p>

          <label style={labelStyle}>Business Description</label>
          <textarea
            name="description"
            defaultValue={profile?.description ?? ""}
            style={{ ...inputStyle, minHeight: "120px", resize: "vertical" }}
            placeholder="Short public description of your company and the work you do…"
          />

          {/* Directory listing toggle */}
          <div style={{
            borderTop: "1px solid #d9dbdb",
            marginTop: "20px",
            paddingTop: "20px",
          }}>
            <label style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              cursor: "pointer",
              fontSize: "14px",
              color: "var(--camo-charcoal)",
            }}>
              <input
                type="checkbox"
                name="is_listed"
                defaultChecked={profile?.is_listed ?? true}
                style={{ width: "16px", height: "16px", accentColor: "var(--camo-accent)" }}
              />
              Show me in the public contractor directory
            </label>
            <p style={{ fontSize: "11px", color: "var(--camo-gunmetal)", marginTop: "6px" }}>
              You must also be verified by an admin before appearing in the directory.
            </p>
          </div>

          {/* License & COI Section */}
          <div style={{
            borderTop: "1px solid #d9dbdb",
            marginTop: "24px",
            paddingTop: "24px",
          }}>
            <h3 style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: "16px",
              letterSpacing: "1px",
              color: "var(--camo-gunmetal)",
              textTransform: "uppercase",
              marginBottom: "4px",
            }}>
              Get Listed in the Directory
            </h3>
            <div style={{
              background: "#FFFFFF",
              border: "1px solid #d9dbdb",
              borderRadius: "8px",
              padding: "12px 14px",
              marginBottom: "16px",
              fontSize: "12px",
              color: "var(--camo-gunmetal)",
              lineHeight: 1.6,
            }}>
              <strong style={{ color: "var(--camo-charcoal)" }}>All contractors</strong> — veteran owned or not — must submit a valid contractor's license and Certificate of Insurance (COI) to be verified and appear in the public directory. This protects clients and builds trust in the platform.
            </div>

            {/* Disclosure checkboxes */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
              <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  name="has_no_license"
                  defaultChecked={!!(profile as any)?.has_no_license}
                  style={{ width: "16px", height: "16px", accentColor: "var(--camo-accent)", marginTop: "2px", flexShrink: 0 }}
                />
                <span style={{ fontSize: "13px", color: "var(--camo-charcoal)", lineHeight: 1.5 }}>
                  I do not hold a contractor's license.{" "}
                  <span style={{ color: "#991B1B", fontSize: "12px" }}>
                    (A "No License" notice will appear on your bids.)
                  </span>
                </span>
              </label>
              <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  name="has_no_insurance"
                  defaultChecked={!!(profile as any)?.has_no_insurance}
                  style={{ width: "16px", height: "16px", accentColor: "var(--camo-accent)", marginTop: "2px", flexShrink: 0 }}
                />
                <span style={{ fontSize: "13px", color: "var(--camo-charcoal)", lineHeight: 1.5 }}>
                  I do not carry liability insurance.{" "}
                  <span style={{ color: "#991B1B", fontSize: "12px" }}>
                    (A "No Insurance" notice will appear on your bids.)
                  </span>
                </span>
              </label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={labelStyle}>Contractor License Number</label>
                <input
                  name="license_number"
                  defaultValue={profile?.license_number ?? ""}
                  style={inputStyle}
                  placeholder="e.g. TX-12345"
                />
              </div>
              <div>
                <label style={labelStyle}>License Expiry Date</label>
                <input
                  type="date"
                  name="license_expiry"
                  defaultValue={profile?.license_expiry ?? ""}
                  style={inputStyle}
                />
              </div>
            </div>

            <label style={labelStyle}>Insurance Provider</label>
            <input
              name="coi_provider"
              defaultValue={profile?.coi_provider ?? ""}
              style={inputStyle}
              placeholder="e.g. State Farm, Allstate, Nationwide…"
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={labelStyle}>COI Policy Number</label>
                <input
                  name="coi_policy_number"
                  defaultValue={profile?.coi_policy_number ?? ""}
                  style={inputStyle}
                  placeholder="e.g. POL-123456"
                />
              </div>
              <div>
                <label style={labelStyle}>COI Expiry Date</label>
                <input
                  type="date"
                  name="coi_expiry"
                  defaultValue={profile?.coi_expiry ?? ""}
                  style={inputStyle}
                />
              </div>
            </div>

            <label style={labelStyle}>Coverage Amount ($)</label>
            <input
              type="number"
              name="coi_amount"
              defaultValue={profile?.coi_amount ?? ""}
              style={inputStyle}
              placeholder="e.g. 1000000"
            />
            <p style={{ fontSize: "11px", color: "var(--camo-gunmetal)", marginTop: "4px" }}>
              Enter total coverage in dollars (e.g. 1000000 = $1,000,000).
            </p>
          </div>

          {/* Veteran section */}
          <div style={{
            borderTop: "1px solid #d9dbdb",
            marginTop: "24px",
            paddingTop: "24px",
          }}>
            <h3 style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: "16px",
              letterSpacing: "1px",
              color: "#B45309",
              textTransform: "uppercase",
              marginBottom: "4px",
            }}>
              ★ Veteran Owned Certification
            </h3>
            <div style={{
              background: "#FFFFFF",
              border: "1px solid #d9dbdb",
              borderRadius: "8px",
              padding: "12px 14px",
              marginBottom: "16px",
              fontSize: "12px",
              color: "var(--camo-gunmetal)",
              lineHeight: 1.6,
            }}>
              <strong style={{ color: "var(--camo-charcoal)" }}>Optional.</strong> If you are a veteran, you can apply for Veteran Owned Certification. This is a separate badge displayed on your bids and directory listing. Admin will verify your status.
            </div>

            <label style={labelStyle}>Military Branch</label>
            <select
              name="military_branch"
              defaultValue={profile?.military_branch ?? ""}
              style={inputStyle}
            >
              <option value="">Select branch (if applicable)…</option>
              {MILITARY_BRANCHES.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.emoji} {b.label}
                </option>
              ))}
            </select>

            <label style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              cursor: "pointer",
              fontSize: "14px",
              color: "var(--camo-charcoal)",
              marginTop: "16px",
            }}>
              <input
                type="checkbox"
                name="apply_veteran"
                defaultChecked={!!profile?.veteran_applied_at && !profile?.veteran_verified}
                style={{ width: "16px", height: "16px", accentColor: "var(--camo-accent)" }}
              />
              Apply for Veteran Owned Certification
            </label>
            <p style={{ fontSize: "11px", color: "var(--camo-gunmetal)", marginTop: "6px", marginBottom: "14px" }}>
              Checking this flags your account for admin review. Document upload coming in a future update.
            </p>

            <label style={labelStyle}>Verification Credential</label>
            <select
              name="veteran_credential_type"
              defaultValue={profile?.veteran_credential_type ?? ""}
              style={inputStyle}
            >
              <option value="">Select credential type…</option>
              <option value="TVC_VVL">Texas Veterans Commission (TVC VVL)</option>
              <option value="VA_VETCERT">VA VetCert (Vets First Verification)</option>
            </select>

            <label style={labelStyle}>Credential Number / Reference</label>
            <input
              name="veteran_credential_reference"
              defaultValue={profile?.veteran_credential_reference ?? ""}
              style={inputStyle}
              placeholder="e.g. your TVC VVL ID or VA VetCert reference number"
            />
            <p style={{ fontSize: "11px", color: "var(--camo-gunmetal)", marginTop: "6px" }}>
              Required for admin to confirm your status against the public TVC or VA registry.
            </p>
          </div>

          <button
            type="submit"
            style={{
              marginTop: "24px",
              background: "var(--camo-accent)",
              color: "var(--camo-ink)",
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
            Save Profile
          </button>
        </form>
      </div>
    </div>
  );
}
