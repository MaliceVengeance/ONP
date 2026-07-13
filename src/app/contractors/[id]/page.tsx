import { notFound } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";
import { MarketingHeader, MarketingFooter, BetaDisclaimerBanner } from "@/components/MarketingChrome";

const eyebrow: React.CSSProperties = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: "0.72rem",
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: "var(--camo-gunmetal)",
};

export default async function ContractorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: profile } = await supabase
    .from("contractor_profiles")
    .select("contractor_id, business_name, city, state, categories, description, veteran_verified, directory_verified, is_listed")
    .eq("contractor_id", id)
    .eq("is_listed", true)
    .eq("directory_verified", true)
    .maybeSingle();

  if (!profile) notFound();

  const { data: photoRows } = await supabase
    .from("contractor_portfolio_photos")
    .select("id, storage_path, caption")
    .eq("contractor_id", id)
    .order("display_order", { ascending: true });

  const photos = (photoRows ?? []).map((p) => ({
    ...p,
    url: supabase.storage.from("contractor-portfolio").getPublicUrl(p.storage_path).data.publicUrl,
  }));

  return (
    <div style={{ minHeight: "100vh", background: "var(--camo-paper)", color: "var(--camo-ink)", fontFamily: "'Barlow', sans-serif" }}>
      <MarketingHeader active="contractors" />
      <BetaDisclaimerBanner />

      <main style={{ maxWidth: "780px", margin: "0 auto", padding: "48px 24px" }}>
        <Link href="/contractors" style={{ fontSize: "0.82rem", color: "var(--camo-gunmetal)", textDecoration: "underline" }}>
          ← Back to Contractor Directory
        </Link>

        {/* Header */}
        <div style={{ marginTop: "20px", marginBottom: "36px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "6px" }}>
            <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: "clamp(1.8rem, 4vw, 2.6rem)", color: "var(--camo-charcoal)", margin: 0, textTransform: "uppercase" }}>
              {profile.business_name ?? "Contractor"}
            </h1>
            {profile.veteran_verified && (
              <span style={{ fontSize: "0.78rem", fontWeight: 700, padding: "4px 12px", borderRadius: "20px", background: "#FFF7ED", color: "#B45309", border: "1px solid #D97706" }}>
                ★ Veteran Owned
              </span>
            )}
            <span style={{ fontSize: "0.78rem", fontWeight: 700, padding: "4px 12px", borderRadius: "20px", background: "#F0FDF4", color: "#15803D", border: "1px solid #166534" }}>
              ✓ Verified
            </span>
          </div>
          <span style={eyebrow}>{[profile.city, profile.state].filter(Boolean).join(", ") || "Service area not listed"}</span>
        </div>

        {/* Categories */}
        {(profile.categories ?? []).length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "28px" }}>
            {(profile.categories as string[]).map((cat) => (
              <span key={cat} style={{ fontSize: "0.78rem", padding: "5px 12px", borderRadius: "20px", background: "var(--camo-concrete)", border: "1px solid #d9dbdb", color: "var(--camo-gunmetal)" }}>
                {cat}
              </span>
            ))}
          </div>
        )}

        {/* Description */}
        {profile.description && (
          <p style={{ fontSize: "0.95rem", color: "var(--camo-gunmetal)", lineHeight: 1.7, marginBottom: "36px" }}>
            {profile.description}
          </p>
        )}

        {/* Portfolio photos */}
        {photos.length > 0 && (
          <div style={{ marginBottom: "40px" }}>
            <span style={{ ...eyebrow, display: "block", marginBottom: "12px" }}>PORTFOLIO</span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "14px" }}>
              {photos.map((p) => (
                <div key={p.id} style={{ background: "var(--camo-concrete)", border: "1px solid #d9dbdb", borderRadius: "8px", overflow: "hidden" }}>
                  <img src={p.url} alt={p.caption ?? "Portfolio photo"} style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", display: "block" }} />
                  {p.caption && (
                    <div style={{ padding: "8px 10px", fontSize: "0.78rem", color: "var(--camo-gunmetal)" }}>{p.caption}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div style={{ background: "var(--camo-charcoal)", borderRadius: "10px", padding: "32px", textAlign: "center" }}>
          <p style={{ fontSize: "0.95rem", color: "var(--camo-concrete)", marginBottom: "16px" }}>
            Have a project this contractor might bid on?
          </p>
          <Link href="/signup" style={{ background: "var(--camo-accent)", color: "var(--camo-ink)", padding: "12px 28px", borderRadius: "3px", textDecoration: "none", fontWeight: 700, fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.03em" }}>
            Post a Project
          </Link>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
