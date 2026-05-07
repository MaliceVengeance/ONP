import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { createUser } from "./actions";

export default async function CreateUserPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; error?: string }>;
}) {
  const sp = await searchParams;
  await requireRole(["ADMIN"]);

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
    <div style={{ maxWidth: "500px" }}>
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
            Create User
          </h1>
          <p style={{ fontSize: "13px", color: "#7A9CC4", marginTop: "4px" }}>
            Create a new admin or inspector account.
          </p>
        </div>
        <Link
          href="/dashboard/admin/users"
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
      {sp.created === "1" && (
        <div style={{
          background: "#0D3320",
          border: "1px solid #166534",
          color: "#4ADE80",
          padding: "14px 18px",
          borderRadius: "8px",
          fontSize: "13px",
          marginBottom: "20px",
        }}>
          ✅ User created successfully. They can now log in with their email and password.
        </div>
      )}

      {/* Error banner */}
      {sp.error && (
        <div style={{
          background: "#3D0A0A",
          border: "1px solid #991B1B",
          color: "#F87171",
          padding: "14px 18px",
          borderRadius: "8px",
          fontSize: "13px",
          marginBottom: "20px",
        }}>
          ❌ {decodeURIComponent(sp.error)}
        </div>
      )}

      {/* Form */}
      <div style={{
        background: "#0F2040",
        border: "1px solid #1B4F8A",
        borderRadius: "12px",
        padding: "24px",
      }}>
        <form action={createUser}>
          <label style={{ ...labelStyle, marginTop: 0 }}>Full Name</label>
          <input
            name="display_name"
            style={inputStyle}
            placeholder="e.g. Jane Smith"
            required
          />

          <label style={labelStyle}>Email Address</label>
          <input
            name="email"
            type="email"
            style={inputStyle}
            placeholder="e.g. jane@example.com"
            required
          />

          <label style={labelStyle}>Temporary Password</label>
          <input
            name="password"
            type="password"
            style={inputStyle}
            placeholder="Min 8 characters"
            required
          />

          <label style={labelStyle}>Role</label>
          <select
            name="role"
            style={inputStyle}
            required
          >
            <option value="">Select a role…</option>
            <option value="ADMIN">Admin</option>
            <option value="INSPECTOR">Inspector</option>
          </select>

          <div style={{
            background: "#0A1628",
            border: "1px solid #1B4F8A",
            borderRadius: "8px",
            padding: "14px",
            marginTop: "20px",
            fontSize: "12px",
            color: "#7A9CC4",
          }}>
            The user will be able to log in immediately with these credentials. 
            They should change their password after first login.
          </div>

          <button
            type="submit"
            style={{
              marginTop: "20px",
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
              width: "100%",
            }}
          >
            Create User
          </button>
        </form>
      </div>
    </div>
  );
}