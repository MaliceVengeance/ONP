import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { uploadPortfolioPhoto, deletePortfolioPhoto } from "./actions";

const MAX_PHOTOS = 10;

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "11px",
  fontWeight: 600,
  color: "var(--camo-gunmetal)",
  textTransform: "uppercase",
  letterSpacing: "1px",
  marginTop: "16px",
  marginBottom: "6px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#FFFFFF",
  border: "1px solid #d9dbdb",
  color: "var(--camo-charcoal)",
  borderRadius: "6px",
  padding: "10px 12px",
  fontFamily: "'Barlow', sans-serif",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box",
};

export default async function ContractorPortfolioPage() {
  const { user } = await requireRole(["CONTRACTOR", "ADMIN"]);

  const { data } = await supabaseAdmin
    .from("contractor_portfolio_photos")
    .select("id, storage_path, caption, display_order")
    .eq("contractor_id", user.id)
    .order("display_order", { ascending: true });

  const photos = data ?? [];
  const atLimit = photos.length >= MAX_PHOTOS;

  const photoUrl = (path: string) =>
    supabaseAdmin.storage.from("contractor-portfolio").getPublicUrl(path).data.publicUrl;

  return (
    <div>
      <div className="mob-col mob-gap-sm" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "36px", letterSpacing: "1px", color: "var(--camo-charcoal)", margin: 0 }}>
            Portfolio Photos
          </h1>
          <p style={{ fontSize: "13px", color: "var(--camo-gunmetal)", marginTop: "4px" }}>
            {photos.length} of {MAX_PHOTOS} photos — shown on your public directory profile.
          </p>
        </div>
        <Link href="/dashboard/contractor/profile" style={{ background: "transparent", color: "var(--camo-gunmetal)", border: "1px solid #d9dbdb", padding: "8px 16px", borderRadius: "6px", fontFamily: "'Barlow', sans-serif", fontSize: "13px", textDecoration: "none" }}>
          Back to Profile
        </Link>
      </div>

      {/* Existing photos */}
      {photos.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "16px", marginBottom: "32px" }}>
          {photos.map((p) => (
            <div key={p.id} style={{ background: "var(--camo-concrete)", border: "1px solid #d9dbdb", borderRadius: "8px", overflow: "hidden" }}>
              <img src={photoUrl(p.storage_path)} alt={p.caption ?? "Portfolio photo"} style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", display: "block" }} />
              <div style={{ padding: "10px 12px" }}>
                {p.caption && (
                  <div style={{ fontSize: "12px", color: "var(--camo-gunmetal)", marginBottom: "8px" }}>{p.caption}</div>
                )}
                <form action={deletePortfolioPhoto.bind(null, p.id)}>
                  <button
                    type="submit"
                    style={{ fontSize: "11px", padding: "5px 10px", borderRadius: "4px", border: "1px solid #FCA5A5", background: "#FEF2F2", color: "#991B1B", fontFamily: "'Barlow', sans-serif", cursor: "pointer" }}
                  >
                    Delete
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload form */}
      <div style={{ background: "var(--camo-concrete)", border: "1px solid #d9dbdb", borderRadius: "12px", padding: "24px", maxWidth: "480px" }}>
        <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "18px", letterSpacing: "1px", color: "var(--camo-charcoal)", textTransform: "uppercase", marginBottom: "4px" }}>
          Add a Photo
        </h2>

        {atLimit ? (
          <p style={{ fontSize: "13px", color: "var(--camo-gunmetal)", marginTop: "12px" }}>
            You&apos;ve reached the {MAX_PHOTOS}-photo limit. Delete one above to add another.
          </p>
        ) : (
          <form action={uploadPortfolioPhoto} encType="multipart/form-data">
            <label style={{ ...labelStyle, marginTop: "12px" }}>
              Photo <span style={{ color: "var(--camo-accent-dim)" }}>*</span>
            </label>
            <input type="file" name="photo" accept="image/jpeg,image/png,image/webp" required style={inputStyle} />
            <p style={{ fontSize: "11px", color: "var(--camo-gunmetal)", marginTop: "4px" }}>
              JPEG, PNG, or WEBP. Maximum 5MB.
            </p>

            <label style={labelStyle}>Caption (optional)</label>
            <input name="caption" maxLength={200} placeholder="e.g. Full roof tear-off and replacement, El Paso" style={inputStyle} />

            <label style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              cursor: "pointer",
              padding: "12px 14px",
              marginTop: "18px",
              background: "#FFFFFF",
              border: "1px solid #d9dbdb",
              borderRadius: "6px",
              fontSize: "12px",
              color: "var(--camo-charcoal)",
              lineHeight: 1.6,
            }}>
              <input
                type="checkbox"
                name="tos_accepted"
                required
                style={{ marginTop: "2px", accentColor: "var(--camo-accent)", flexShrink: 0 }}
              />
              I own the rights to this photo, or have permission to share it, and agree it may be published on my
              public {" "}<strong>ONP</strong> directory profile in accordance with the{" "}
              <Link href="/terms" target="_blank" style={{ color: "var(--camo-gunmetal)", textDecoration: "underline" }}>
                Terms of Service
              </Link>.
            </label>

            <button
              type="submit"
              style={{
                marginTop: "18px",
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
              Upload Photo
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
