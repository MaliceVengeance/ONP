import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { PROJECT_CATEGORIES } from "@/lib/projects/categories";
import { createDraftProject } from "../actions";

export default async function NewDraftProjectPage() {
  await requireRole(["CLIENT", "ADMIN"]);

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
            New Project
          </h1>
          <p style={{ fontSize: "13px", color: "#7A9CC4", marginTop: "4px" }}>
            Fill in the details below. You can publish when ready.
          </p>
        </div>
        <Link
          href="/dashboard/client/projects"
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
          Cancel
        </Link>
      </div>

      {/* Form card */}
      <div style={{
        background: "#0F2040",
        border: "1px solid #1B4F8A",
        borderRadius: "12px",
        padding: "28px",
        marginBottom: "20px",
      }}>
        <form action={createDraftProject}>
          <label style={{ ...labelStyle, marginTop: 0 }}>Project Title</label>
          <input
            name="title"
            style={inputStyle}
            placeholder="e.g. Kitchen Remodel"
            required
          />

          <label style={labelStyle}>Category</label>
          <select name="category" style={inputStyle} required>
            <option value="">Select a category…</option>
            {PROJECT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c.replaceAll("_", " ")}
              </option>
            ))}
          </select>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={labelStyle}>City</label>
              <input
                name="city"
                style={inputStyle}
                placeholder="e.g. Phoenix"
                required
              />
            </div>
            <div>
              <label style={labelStyle}>State</label>
              <input
                name="us_state"
                style={inputStyle}
                placeholder="e.g. TX"
                required
              />
            </div>
          </div>

          <label style={labelStyle}>Description</label>
          <textarea
            name="description"
            style={{ ...inputStyle, minHeight: "140px", resize: "vertical" }}
            placeholder="Describe the work needed in as much detail as possible…"
            rows={6}
          />

          {/* Platform rules */}
          <div style={{
            background: "#0A1628",
            border: "1px solid #1B4F8A",
            borderRadius: "8px",
            padding: "16px",
            marginTop: "20px",
          }}>
            <div style={{
              fontSize: "11px",
              fontWeight: 600,
              color: "#7A9CC4",
              textTransform: "uppercase",
              letterSpacing: "1px",
              marginBottom: "10px",
            }}>
              Platform Rules — Shown to All Contractors
            </div>
            <div style={{ fontSize: "13px", color: "#4ADE80", marginBottom: "6px" }}>
              ✅ The contractor is responsible for pulling all required permits.
            </div>
            <div style={{ fontSize: "13px", color: "#4ADE80" }}>
              ✅ The contractor is responsible for all debris removal and disposal.
            </div>
          </div>

          {/* Submit */}
          <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
            <button
              type="submit"
              style={{
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
              Create Draft
            </button>
            <Link
              href="/dashboard/client/projects"
              style={{
                background: "transparent",
                color: "#7A9CC4",
                border: "1px solid #1B4F8A",
                padding: "12px 24px",
                borderRadius: "6px",
                fontFamily: "'Barlow', sans-serif",
                fontSize: "14px",
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}