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
      "business_name,city,state,categories,description,is_listed,veteran_applied_at,veteran_verified,veteran_verified_at,military_branch"
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
            This info appears in the public directory and after a bid is awarded.
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

      {/* Veteran status card */}
      <div style={{
        background: profile?.veteran_verified ? "#1e1a00" : "#0F2040",
        border: `1px solid ${profile?.veteran_verified ? "#92400E" : "#1B4F8A"}`,
        borderRadius: "12px",
        padding: "20px",
        marginBottom: "20px",
      }}>
        <div style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: "18px",
          letterSpacing: "1px",
          color: profile?.veteran_verified ? "#FBBF24" : "#fff",
          textTransform: "uppercase",
          marginBottom: "8px",
        }}>
          {profile?.veteran_verified ? "★ Veteran Owned — Verified" : "Veteran Status"}
        </div>
        <div style={{ fontSize: "13px", color: "#7A9CC4" }}>
          {profile?.veteran_verified ? (
            <>
              Your veteran-owned status has been verified.
              {profile?.veteran_verified_at && (
                <span style={{ display: "block", fontSize: "11px", color: "#3A5A7A", marginTop: "4px" }}>
                  Verified: {new Date(profile.veteran_verified_at).toLocaleDateString()}
                </span>
              )}
            </>
          ) : profile?.veteran_applied_at ? (
            "Your application is pending admin review."
          ) : (
            "Apply below to receive Veteran Owned certification."
          )}
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
          marginBottom: "16px",
        }}>
          Business Information
        </h2>

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
            These will power directory filters.
          </p>

          <label style={labelStyle}>Business Description</label>
          <textarea
            name="description"
            defaultValue={profile?.description ?? ""}
            style={{ ...inputStyle, minHeight: "120px", resize: "vertical" }}
            placeholder="Short public description of your company…"
          />

          {/* Directory listing */}
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
          </div>

          {/* Veteran section */}
          <div style={{
            borderTop: "1px solid #1B4F8A",
            marginTop: "20px",
            paddingTop: "20px",
          }}>
            <h3 style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: "16px",
              letterSpacing: "1px",
              color: "#FBBF24",
              textTransform: "uppercase",
              marginBottom: "12px",
            }}>
              ★ Veteran Information
            </h3>

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
              Apply for Certified Veteran Owned status (admin must verify)
            </label>
            <p style={{ fontSize: "11px", color: "#3A5A7A", marginTop: "6px" }}>
              This flags your account for admin review. Document upload will be added in a future update.
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