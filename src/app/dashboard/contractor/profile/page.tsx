import { requireRole } from "@/lib/auth/requireRole";
import { saveContractorProfile } from "./actions";
import Link from "next/link";

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
      "business_name,city,state,categories,description,is_listed,veteran_applied_at,veteran_verified,veteran_verified_at,military_branch,license_number,license_expiry,coi_provider,coi_policy_number,coi_expiry,coi_amount,directory_verified,directory_verified_at"
    )
    .eq("contractor_id", user.id)
    .maybeSingle();

  const categories = (profile?.categories ?? []) as string[];

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
    <div style={{ maxWidth: "600px" }}>
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
            My Profile
          </h1>
          <p style={{ fontSize: "13px", color: "#7A9CC4", marginTop: "4px" }}>
            Your public profile shown to clients and in the contractor directory.
          </p>
        </div>
        <Link
          href="/dashboard/contractor"
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

      {/* Success banner */}
      {sp.saved === "1" && (
        <div style={{
          background: "#0D3320",
          border: "1px solid #166534",
          color: "#4ADE80",
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
          background: profile?.directory_verified ? "#0D3320" : "#0F2040",
          border: `1px solid ${profile?.directory_verified ? "#166534" : "#1B4F8A"}`,
          borderRadius: "10px",
          padding: "14px 16px",
        }}>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "14px",
            letterSpacing: "1px",
            color: profile?.directory_verified ? "#4ADE80" : "#7A9CC4",
            textTransform: "uppercase",
            marginBottom: "4px",
          }}>
            {profile?.directory_verified ? "✅ Verified" : "⏳ Not Verified"}
          </div>
          <div style={{ fontSize: "11px", color: "#3A5A7A" }}>
            {profile?.directory_verified
              ? `Since ${profile.directory_verified_at ? new Date(profile.directory_verified_at).toLocaleDateString() : "—"}`
              : "License & COI pending review"}
          </div>
        </div>

        {/* Veteran status */}
        <div style={{
          background: profile?.veteran_verified ? "#1e1a00" : "#0F2040",
          border: `1px solid ${profile?.veteran_verified ? "#92400E" : "#1B4F8A"}`,
          borderRadius: "10px",
          padding: "14px 16px",
        }}>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "14px",
            letterSpacing: "1px",
            color: profile?.veteran_verified ? "#FBBF24" : "#7A9CC4",
            textTransform: "uppercase",
            marginBottom: "4px",
          }}>
            {profile?.veteran_verified ? "★ Veteran Owned" : "Veteran Status"}
          </div>
          <div style={{ fontSize: "11px", color: "#3A5A7A" }}>
            {profile?.veteran_verified
              ? "Certified veteran owned"
              : profile?.veteran_applied_at
              ? "Application pending"
              : "Not applied"}
          </div>
        </div>
      </div>

      {/* Main form */}
      <div style={{
        background: "#0F2040",
        border: "1px solid #1B4F8A",
        borderRadius: "12px",
        padding: "24px",
        marginBottom: "20px",
      }}>
        <h2 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: "18px",
          letterSpacing: "1px",
          color: "#fff",
          textTransform: "uppercase",
          marginBottom: "4px",
        }}>
          Business Information
        </h2>
        <p style={{ fontSize: "12px", color: "#7A9CC4", marginBottom: "16px" }}>
          Visible to clients when you submit a bid and in the public directory.
        </p>

        <form action={saveContractorProfile}>
          <label style={{ ...labelStyle, marginTop: 0 }}>Business Name</label>
          <input
            name="business_name"
            defaultValue={profile?.business_name ?? ""}
            style={inputStyle}
            placeholder="e.g. Bravo Roofing LLC"
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
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
          </div>

          <label style={labelStyle}>Service Categories (comma-separated)</label>
          <input
            name="categories"
            defaultValue={categories.join(", ")}
            style={inputStyle}
            placeholder="Roofing, Drywall, Concrete, Electrical…"
          />
          <p style={{ fontSize: "11px", color: "#3A5A7A", marginTop: "4px" }}>
            Used to match you with relevant projects in the directory.
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
            borderTop: "1px solid #1B4F8A",
            marginTop: "20px",
            paddingTop: "20px",
          }}>
            <label style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              cursor: "pointer",
              fontSize: "14px",
              color: "#F0F4FF",
            }}>
              <input
                type="checkbox"
                name="is_listed"
                defaultChecked={profile?.is_listed ?? true}
                style={{ width: "16px", height: "16px", accentColor: "#C8102E" }}
              />
              Show me in the public contractor directory
            </label>
            <p style={{ fontSize: "11px", color: "#3A5A7A", marginTop: "6px" }}>
              You must also be verified by an admin before appearing in the directory.
            </p>
          </div>

          {/* License & COI Section */}
          <div style={{
            borderTop: "1px solid #1B4F8A",
            marginTop: "24px",
            paddingTop: "24px",
          }}>
            <h3 style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: "16px",
              letterSpacing: "1px",
              color: "#60A5FA",
              textTransform: "uppercase",
              marginBottom: "4px",
            }}>
              Get Listed in the Directory
            </h3>
            <div style={{
              background: "#0A1628",
              border: "1px solid #1B4F8A",
              borderRadius: "8px",
              padding: "12px 14px",
              marginBottom: "16px",
              fontSize: "12px",
              color: "#7A9CC4",
              lineHeight: 1.6,
            }}>
              <strong style={{ color: "#F0F4FF" }}>All contractors</strong> — veteran owned or not — must submit a valid contractor's license and Certificate of Insurance (COI) to be verified and appear in the public directory. This protects clients and builds trust in the platform.
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
            <p style={{ fontSize: "11px", color: "#3A5A7A", marginTop: "4px" }}>
              Enter total coverage in dollars (e.g. 1000000 = $1,000,000).
            </p>
          </div>

          {/* Veteran section */}
          <div style={{
            borderTop: "1px solid #1B4F8A",
            marginTop: "24px",
            paddingTop: "24px",
          }}>
            <h3 style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: "16px",
              letterSpacing: "1px",
              color: "#FBBF24",
              textTransform: "uppercase",
              marginBottom: "4px",
            }}>
              ★ Veteran Owned Certification
            </h3>
            <div style={{
              background: "#0A1628",
              border: "1px solid #1B4F8A",
              borderRadius: "8px",
              padding: "12px 14px",
              marginBottom: "16px",
              fontSize: "12px",
              color: "#7A9CC4",
              lineHeight: 1.6,
            }}>
              <strong style={{ color: "#F0F4FF" }}>Optional.</strong> If you are a veteran, you can apply for Veteran Owned Certification. This is a separate badge displayed on your bids and directory listing. Admin will verify your status.
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
              color: "#F0F4FF",
              marginTop: "16px",
            }}>
              <input
                type="checkbox"
                name="apply_veteran"
                defaultChecked={!!profile?.veteran_applied_at && !profile?.veteran_verified}
                style={{ width: "16px", height: "16px", accentColor: "#C8102E" }}
              />
              Apply for Veteran Owned Certification
            </label>
            <p style={{ fontSize: "11px", color: "#3A5A7A", marginTop: "6px" }}>
              Checking this flags your account for admin review. Document upload coming in a future update.
            </p>
          </div>

          <button
            type="submit"
            style={{
              marginTop: "24px",
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
            Save Profile
          </button>
        </form>
      </div>
    </div>
  );
}