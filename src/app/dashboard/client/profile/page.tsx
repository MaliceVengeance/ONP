import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { saveClientProfile } from "./actions";

export default async function ClientProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const sp = await searchParams;
  const { supabase, user } = await requireRole(["CLIENT", "ADMIN"]);

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, phone, address_line1, address_line2, address_city, address_state, address_zip")
    .eq("id", user.id)
    .single();

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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
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
            {user.email}
          </p>
        </div>
        <Link
          href="/dashboard/client"
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

      {/* Personal info */}
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
          Personal Information
        </h2>
        <p style={{ fontSize: "12px", color: "#7A9CC4", marginBottom: "8px" }}>
          This information is kept private and is not shared with contractors.
        </p>

        <form action={saveClientProfile}>
          <label style={{ ...labelStyle, marginTop: "8px" }}>Full Name</label>
          <input
            name="display_name"
            defaultValue={profile?.display_name ?? ""}
            style={inputStyle}
            placeholder="e.g. John Smith"
          />

          <label style={labelStyle}>Phone Number</label>
          <input
            name="phone"
            defaultValue={profile?.phone ?? ""}
            style={inputStyle}
            placeholder="e.g. (555) 555-5555"
          />

          <div style={{
            borderTop: "1px solid #1B4F8A",
            marginTop: "24px",
            paddingTop: "20px",
          }}>
            <h3 style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: "16px",
              letterSpacing: "1px",
              color: "#fff",
              textTransform: "uppercase",
              marginBottom: "4px",
            }}>
              Address
            </h3>
            <p style={{ fontSize: "12px", color: "#7A9CC4", marginBottom: "8px" }}>
              Used for billing and project location purposes only.
            </p>

            <label style={{ ...labelStyle, marginTop: "8px" }}>Address Line 1</label>
            <input
              name="address_line1"
              defaultValue={profile?.address_line1 ?? ""}
              style={inputStyle}
              placeholder="e.g. 123 Main St"
            />

            <label style={labelStyle}>Address Line 2</label>
            <input
              name="address_line2"
              defaultValue={profile?.address_line2 ?? ""}
              style={inputStyle}
              placeholder="e.g. Apt 4B (optional)"
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
              <div>
                <label style={labelStyle}>City</label>
                <input
                  name="address_city"
                  defaultValue={profile?.address_city ?? ""}
                  style={inputStyle}
                  placeholder="e.g. Phoenix"
                />
              </div>
              <div>
                <label style={labelStyle}>State</label>
                <input
                  name="address_state"
                  defaultValue={profile?.address_state ?? ""}
                  style={inputStyle}
                  placeholder="e.g. AZ"
                />
              </div>
              <div>
                <label style={labelStyle}>ZIP Code</label>
                <input
                  name="address_zip"
                  defaultValue={profile?.address_zip ?? ""}
                  style={inputStyle}
                  placeholder="e.g. 85001"
                />
              </div>
            </div>
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

      {/* Billing note */}
      <div style={{
        background: "#0F2040",
        border: "1px solid #1B4F8A",
        borderRadius: "12px",
        padding: "20px",
        fontSize: "13px",
        color: "#7A9CC4",
      }}>
        <div style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: "16px",
          color: "#fff",
          textTransform: "uppercase",
          marginBottom: "8px",
        }}>
          Billing Information
        </div>
        Billing and payment processing will be available in a future update. 
        Your address above will be used for billing purposes when payments are enabled.
      </div>
    </div>
  );
}