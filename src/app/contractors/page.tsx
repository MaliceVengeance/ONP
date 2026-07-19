import Link from "next/link";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { MarketingHeader, MarketingFooter, BetaDisclaimerBanner } from "@/components/MarketingChrome";
import { CamoCanvas } from "@/components/CamoCanvas";
import { getCamoVariant } from "@/lib/camo/session";

type ContractorListing = {
  contractor_id: string;
  business_name: string | null;
  city: string | null;
  state: string | null;
  categories: string[] | null;
  description: string | null;
  veteran_verified: boolean | null;
  directory_verified: boolean | null;
  license_expiry: string | null;
  coi_expiry: string | null;
};

const eyebrow: React.CSSProperties = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: "0.72rem",
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: "var(--camo-gunmetal)",
};

function pillStyle(active: boolean): React.CSSProperties {
  return {
    display: "inline-block",
    fontSize: "0.8rem",
    padding: "7px 16px",
    borderRadius: "20px",
    textDecoration: "none",
    border: active ? "1px solid var(--camo-accent)" : "1px solid #d9dbdb",
    background: active ? "var(--camo-accent)" : "var(--camo-paper)",
    color: active ? "var(--camo-ink)" : "var(--camo-gunmetal)",
    fontWeight: active ? 700 : 500,
  };
}

export default async function ContractorDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; state?: string; veteran?: string }>;
}) {
  const sp = await searchParams;
  const cookieStore = await cookies();
  const camoVariant = await getCamoVariant();

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

  let query = supabase
    .from("contractor_profiles")
    .select("contractor_id, business_name, city, state, categories, description, veteran_verified, directory_verified, license_expiry, coi_expiry")
    .eq("is_listed", true)
    .eq("directory_verified", true)
    .order("business_name", { ascending: true });

  if (sp.state) {
    query = query.eq("state", sp.state.toUpperCase());
  }

  if (sp.veteran === "1") {
    query = query.eq("veteran_verified", true);
  }

  const { data } = await query;
  const contractors = (data ?? []) as ContractorListing[];

  // Filter by category client-side since categories is an array
  const filtered = sp.category
    ? contractors.filter((c) =>
        (c.categories ?? []).some((cat) =>
          cat.toLowerCase().includes(sp.category!.toLowerCase())
        )
      )
    : contractors;

  // Get unique states for filter
  const allStates = [...new Set(contractors.map((c) => c.state).filter((s): s is string => !!s))].sort();

  // Get unique categories
  const allCategories = [...new Set(
    contractors.flatMap((c) => c.categories ?? []).filter((c): c is string => !!c)
  )].sort();

  function isExpired(d: string | null) {
    if (!d) return false;
    return new Date(d).getTime() < Date.now();
  }

  function filterHref(updates: { category?: string | null; state?: string | null; veteran?: string | null }) {
    const params = new URLSearchParams();
    const category = updates.category !== undefined ? updates.category : sp.category;
    const state = updates.state !== undefined ? updates.state : sp.state;
    const veteran = updates.veteran !== undefined ? updates.veteran : sp.veteran;
    if (category) params.set("category", category);
    if (state) params.set("state", state);
    if (veteran) params.set("veteran", veteran);
    const qs = params.toString();
    return qs ? `/contractors?${qs}` : "/contractors";
  }

  // Directory-health signal: don't let a low-inventory marketplace read as broken/abandoned.
  const isEarlyStage = contractors.length <= 3;

  return (
    <div style={{ minHeight: "100vh", background: "var(--camo-paper)", color: "var(--camo-ink)", fontFamily: "'Barlow', sans-serif" }}>
      <MarketingHeader active="contractors" />
      <BetaDisclaimerBanner />

      <main style={{ maxWidth: "1040px", margin: "0 auto", padding: "40px 24px" }}>
        {/* Page title */}
        <div style={{ marginBottom: "32px" }}>
          <span style={{ ...eyebrow, display: "block", marginBottom: "8px" }}>VERIFIED CONTRACTORS</span>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: "clamp(2rem, 5vw, 3rem)", color: "var(--camo-charcoal)", margin: 0, lineHeight: 1.1, textTransform: "uppercase" }}>
            Contractor Directory
          </h1>
          <p style={{ fontSize: "0.95rem", color: "var(--camo-gunmetal)", lineHeight: 1.6, marginTop: "12px", maxWidth: "600px" }}>
            All contractors listed here have been verified by <strong>ONP</strong> — licensed, insured, and ready to bid on your project.
          </p>
        </div>

        {/* Filters — pill buttons */}
        <div style={{ marginBottom: "28px", display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <div style={{ ...eyebrow, marginBottom: "8px" }}>Category</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              <Link href={filterHref({ category: null })} style={pillStyle(!sp.category)}>All</Link>
              {allCategories.map((cat) => (
                <Link key={cat} href={filterHref({ category: cat })} style={pillStyle(sp.category === cat)}>
                  {cat}
                </Link>
              ))}
            </div>
          </div>

          {allStates.length > 0 && (
            <div>
              <div style={{ ...eyebrow, marginBottom: "8px" }}>State</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                <Link href={filterHref({ state: null })} style={pillStyle(!sp.state)}>All</Link>
                {allStates.map((s) => (
                  <Link key={s} href={filterHref({ state: s })} style={pillStyle(sp.state === s)}>
                    {s}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div>
            <div style={{ ...eyebrow, marginBottom: "8px" }}>Veteran Owned</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              <Link href={filterHref({ veteran: null })} style={pillStyle(sp.veteran !== "1")}>All Contractors</Link>
              <Link href={filterHref({ veteran: "1" })} style={pillStyle(sp.veteran === "1")}>★ Veteran Owned Only</Link>
            </div>
          </div>

          {(sp.category || sp.state || sp.veteran) && (
            <Link href="/contractors" style={{ fontSize: "0.8rem", color: "var(--camo-gunmetal)", textDecoration: "underline", alignSelf: "flex-start" }}>
              Clear filters
            </Link>
          )}
        </div>

        {/* Results count */}
        <div style={{ fontSize: "0.85rem", color: "var(--camo-gunmetal)", marginBottom: "16px" }}>
          {filtered.length} verified contractor{filtered.length !== 1 ? "s" : ""} found
          {sp.category && ` in "${sp.category}"`}
          {sp.state && ` in ${sp.state}`}
          {sp.veteran === "1" && " — Veteran Owned"}
        </div>

        {/* Contractor cards */}
        {filtered.length === 0 && contractors.length > 0 ? (
          <div style={{ background: "var(--camo-concrete)", border: "1px solid #d9dbdb", borderRadius: "8px", padding: "40px", textAlign: "center", color: "var(--camo-gunmetal)", fontSize: "0.9rem", marginBottom: "16px" }}>
            No verified contractors match these filters yet.{" "}
            <Link href="/contractors" style={{ color: "var(--camo-gunmetal)", textDecoration: "underline" }}>Clear filters</Link> to see everyone.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: filtered.length > 0 ? "16px" : 0 }}>
            {filtered.map((c) => {
              const coiExpired = isExpired(c.coi_expiry);
              const hasIssues = coiExpired;

              return (
                <div key={c.contractor_id} style={{ position: "relative", overflow: "hidden", background: "var(--camo-concrete)", border: `1px solid ${c.veteran_verified ? "var(--camo-accent)" : "#d9dbdb"}`, borderRadius: "8px", padding: "24px" }}>
                  <div style={{ position: "absolute", top: 0, right: 0, width: "120px", height: "120px", opacity: 0.12, pointerEvents: "none" }}>
                    <CamoCanvas
                      variant={camoVariant}
                      cell={7}
                      seed={c.contractor_id.length}
                      style={{ maskImage: "radial-gradient(circle at top right, black 0%, transparent 70%)", WebkitMaskImage: "radial-gradient(circle at top right, black 0%, transparent 70%)" }}
                    />
                  </div>
                  <div style={{ position: "relative", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", marginBottom: "12px", flexWrap: "wrap" }}>
                    <div>
                      <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "1.4rem", color: "var(--camo-charcoal)", margin: "0 0 4px", textTransform: "uppercase" }}>
                        {c.business_name ?? "Unnamed Business"}
                      </h2>
                      <div style={{ fontSize: "0.82rem", color: "var(--camo-gunmetal)" }}>
                        📍 {[c.city, c.state].filter(Boolean).join(", ") || "Location not listed"}
                      </div>
                    </div>

                    {/* Badges */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-end", flexShrink: 0 }}>
                      <span style={{ fontSize: "0.7rem", fontWeight: 600, padding: "4px 10px", borderRadius: "20px", background: "rgba(92,138,107,0.15)", color: "var(--camo-good)", border: "1px solid var(--camo-good)" }}>
                        ✓ ONP Verified
                      </span>
                      {c.veteran_verified && (
                        <span style={{ fontSize: "0.7rem", fontWeight: 600, padding: "4px 10px", borderRadius: "20px", background: "var(--camo-charcoal)", color: "var(--camo-accent)", border: "1px solid var(--camo-accent)" }}>
                          ★ Veteran Owned
                        </span>
                      )}
                      {hasIssues && (
                        <span style={{ fontSize: "0.7rem", fontWeight: 600, padding: "4px 10px", borderRadius: "20px", background: "#FFFBEB", color: "#92400E", border: "1px solid #FCD34D" }}>
                          ⚠ Review Needed
                        </span>
                      )}
                    </div>
                  </div>

                  {c.description && (
                    <p style={{ position: "relative", fontSize: "0.88rem", color: "var(--camo-gunmetal)", lineHeight: 1.7, marginBottom: "14px" }}>
                      {c.description}
                    </p>
                  )}

                  {(c.categories ?? []).length > 0 && (
                    <div style={{ position: "relative", display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "14px" }}>
                      {(c.categories ?? []).map((cat) => (
                        <span key={cat} style={{ fontSize: "0.7rem", padding: "4px 10px", borderRadius: "20px", background: "var(--camo-paper)", color: "var(--camo-gunmetal)", border: "1px solid #d9dbdb" }}>
                          {cat}
                        </span>
                      ))}
                    </div>
                  )}

                  <div style={{ position: "relative", display: "flex", gap: "16px", fontSize: "0.72rem", color: "var(--camo-gunmetal)", flexWrap: "wrap" }}>
                    <span style={{ color: coiExpired ? "#B45050" : "var(--camo-gunmetal)" }}>
                      COI: {c.coi_expiry ? new Date(c.coi_expiry).toLocaleDateString() : "—"}
                      {coiExpired && " ⚠"}
                    </span>
                  </div>

                  <Link href={`/contractors/${c.contractor_id}`} style={{ position: "relative", display: "inline-block", marginTop: "14px", fontSize: "0.8rem", color: "var(--camo-charcoal)", fontWeight: 600, textDecoration: "underline" }}>
                    View full profile →
                  </Link>
                </div>
              );
            })}
          </div>
        )}

        {/* Early-stage growth card — keeps a low-inventory directory from reading as abandoned */}
        {isEarlyStage && (
          <div
            style={{
              background: "var(--camo-charcoal)",
              border: "1px dashed var(--camo-accent)",
              borderRadius: "8px",
              padding: "28px",
              display: "flex",
              alignItems: "center",
              gap: "20px",
              flexWrap: "wrap",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--camo-accent)", marginBottom: "8px" }}>
                New contractors joining weekly
              </div>
              <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "1.2rem", color: "var(--camo-concrete)", margin: 0, textTransform: "uppercase" }}>
                Want to be featured here?
              </h3>
              <p style={{ fontSize: "0.85rem", color: "var(--camo-steel)", margin: "6px 0 0", maxWidth: "440px" }}>
                <strong>ONP</strong> is actively verifying and onboarding contractors in El Paso and Las Cruces. Get listed early.
              </p>
            </div>
            <Link href="/signup/contractor" style={{ background: "var(--camo-accent)", color: "var(--camo-ink)", padding: "12px 24px", borderRadius: "3px", textDecoration: "none", fontWeight: 700, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.03em", whiteSpace: "nowrap" }}>
              Join the Directory
            </Link>
          </div>
        )}
      </main>

      <MarketingFooter />
    </div>
  );
}
