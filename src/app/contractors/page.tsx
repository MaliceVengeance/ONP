import Link from "next/link";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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

export default async function ContractorDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; state?: string; veteran?: string }>;
}) {
  const sp = await searchParams;
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

  const { data, error } = await query;
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

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0A1628",
      color: "#F0F4FF",
      fontFamily: "'Barlow', sans-serif",
    }}>
      {/* Header */}
      <header style={{
        background: "#0A1628",
        borderBottom: "2px solid #C8102E",
        padding: "14px 28px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <Link href="/login" style={{ textDecoration: "none" }}>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 800,
            fontSize: "26px",
            letterSpacing: "2px",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}>
            <span style={{ color: "#C8102E" }}>★</span> ONP
          </div>
          <div style={{
            fontSize: "11px",
            letterSpacing: "3px",
            color: "#7A9CC4",
            textTransform: "uppercase",
          }}>
            Our Next Project
          </div>
        </Link>
        <div style={{ display: "flex", gap: "10px" }}>
          <Link
            href="/about"
            style={{
              background: "transparent",
              color: "#7A9CC4",
              border: "1px solid #1B4F8A",
              padding: "8px 16px",
              borderRadius: "6px",
              fontSize: "13px",
              textDecoration: "none",
            }}
          >
            About
          </Link>
          <Link
            href="/login"
            style={{
              background: "#C8102E",
              color: "#fff",
              border: "none",
              padding: "8px 16px",
              borderRadius: "6px",
              fontSize: "13px",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Beta banner */}
      <div style={{
        background: "#3D0A0A",
        borderBottom: "1px solid #991B1B",
        padding: "10px 28px",
        textAlign: "center",
        fontSize: "12px",
        color: "#FCA5A5",
      }}>
        <span style={{
          fontWeight: 700,
          color: "#F87171",
          textTransform: "uppercase",
          letterSpacing: "1px",
          marginRight: "8px",
        }}>
          ⚠ Experimental Beta:
        </span>
        This platform is in beta testing. All profiles are for testing purposes only.
      </div>

      <main style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 24px" }}>
        {/* Page title */}
        <div style={{ marginBottom: "32px" }}>
          <h1 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "48px",
            letterSpacing: "1px",
            color: "#fff",
            margin: 0,
            lineHeight: 1.1,
          }}>
            Contractor Directory
          </h1>
          <div style={{ width: "60px", height: "3px", background: "#C8102E", margin: "12px 0 16px" }} />
          <p style={{ fontSize: "15px", color: "#7A9CC4", lineHeight: 1.6 }}>
            All contractors listed here have been verified by ONP — licensed, insured, and ready to bid on your project.
          </p>
        </div>

        {/* Filters */}
        <div style={{
          background: "#0F2040",
          border: "1px solid #1B4F8A",
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "28px",
        }}>
          <form style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "flex-end" }}>
            <div>
              <label style={{
                display: "block",
                fontSize: "11px",
                color: "#7A9CC4",
                textTransform: "uppercase",
                letterSpacing: "1px",
                marginBottom: "4px",
              }}>
                Category
              </label>
              <select
                name="category"
                defaultValue={sp.category ?? undefined}
                style={{
                  background: "#0A1628",
                  border: "1px solid #1B4F8A",
                  color: "#F0F4FF",
                  borderRadius: "6px",
                  padding: "8px 12px",
                  fontFamily: "'Barlow', sans-serif",
                  fontSize: "13px",
                  outline: "none",
                  minWidth: "160px",
                }}
              >
                <option value="">All Categories</option>
                {allCategories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{
                display: "block",
                fontSize: "11px",
                color: "#7A9CC4",
                textTransform: "uppercase",
                letterSpacing: "1px",
                marginBottom: "4px",
              }}>
                State
              </label>
              <select
                name="state"
                defaultValue={sp.state ?? undefined}
                style={{
                  background: "#0A1628",
                  border: "1px solid #1B4F8A",
                  color: "#F0F4FF",
                  borderRadius: "6px",
                  padding: "8px 12px",
                  fontFamily: "'Barlow', sans-serif",
                  fontSize: "13px",
                  outline: "none",
                  minWidth: "120px",
                }}
              >
                <option value="">All States</option>
                {allStates.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{
                display: "block",
                fontSize: "11px",
                color: "#7A9CC4",
                textTransform: "uppercase",
                letterSpacing: "1px",
                marginBottom: "4px",
              }}>
                Veteran Owned
              </label>
              <select
                name="veteran"
                defaultValue={sp.veteran || undefined}
                style={{
                  background: "#0A1628",
                  border: "1px solid #1B4F8A",
                  color: "#F0F4FF",
                  borderRadius: "6px",
                  padding: "8px 12px",
                  fontFamily: "'Barlow', sans-serif",
                  fontSize: "13px",
                  outline: "none",
                }}
              >
                <option value="">All Contractors</option>
                <option value="1">Veteran Owned Only</option>
              </select>
            </div>

            <button
              type="submit"
              style={{
                background: "#C8102E",
                color: "#fff",
                border: "none",
                padding: "8px 20px",
                borderRadius: "6px",
                fontFamily: "'Barlow', sans-serif",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              Filter
            </button>

            <Link
              href="/contractors"
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
              Clear
            </Link>
          </form>
        </div>

        {/* Results count */}
        <div style={{ fontSize: "13px", color: "#7A9CC4", marginBottom: "16px" }}>
          {filtered.length} verified contractor{filtered.length !== 1 ? "s" : ""} found
          {sp.category && ` in "${sp.category}"`}
          {sp.state && ` in ${sp.state}`}
          {sp.veteran === "1" && " — Veteran Owned"}
        </div>

        {/* Contractor cards */}
        {filtered.length === 0 ? (
          <div style={{
            background: "#0F2040",
            border: "1px solid #1B4F8A",
            borderRadius: "12px",
            padding: "40px",
            textAlign: "center",
            color: "#7A9CC4",
            fontSize: "14px",
          }}>
            No verified contractors found matching your filters.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {filtered.map((c) => {
              const licenseExpired = isExpired(c.license_expiry);
              const coiExpired = isExpired(c.coi_expiry);
              const hasIssues = licenseExpired || coiExpired;

              return (
                <div key={c.contractor_id} style={{
                  background: "#0F2040",
                  border: `1px solid ${c.veteran_verified ? "#92400E" : "#1B4F8A"}`,
                  borderRadius: "12px",
                  padding: "24px",
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", marginBottom: "12px" }}>
                    <div>
                      <h2 style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontWeight: 700,
                        fontSize: "24px",
                        color: "#fff",
                        margin: 0,
                        marginBottom: "4px",
                      }}>
                        {c.business_name ?? "Unnamed Business"}
                      </h2>
                      <div style={{ fontSize: "13px", color: "#7A9CC4" }}>
                        📍 {[c.city, c.state].filter(Boolean).join(", ") || "Location not listed"}
                      </div>
                    </div>

                    {/* Badges */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-end", flexShrink: 0 }}>
                      <span style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        padding: "4px 10px",
                        borderRadius: "20px",
                        background: "#0D3320",
                        color: "#4ADE80",
                        border: "1px solid #166534",
                      }}>
                        ✅ ONP Verified
                      </span>
                      {c.veteran_verified && (
                        <span style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          padding: "4px 10px",
                          borderRadius: "20px",
                          background: "#1e1a00",
                          color: "#FBBF24",
                          border: "1px solid #92400E",
                        }}>
                          ★ Veteran Owned
                        </span>
                      )}
                      {hasIssues && (
                        <span style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          padding: "4px 10px",
                          borderRadius: "20px",
                          background: "#3D0A0A",
                          color: "#F87171",
                          border: "1px solid #991B1B",
                        }}>
                          ⚠ Review Needed
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  {c.description && (
                    <p style={{
                      fontSize: "14px",
                      color: "#B0C4DE",
                      lineHeight: 1.7,
                      marginBottom: "14px",
                    }}>
                      {c.description}
                    </p>
                  )}

                  {/* Categories */}
                  {(c.categories ?? []).length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "14px" }}>
                      {(c.categories ?? []).map((cat) => (
                        <span key={cat} style={{
                          fontSize: "11px",
                          padding: "4px 10px",
                          borderRadius: "20px",
                          background: "#0A1628",
                          color: "#7A9CC4",
                          border: "1px solid #1B4F8A",
                        }}>
                          {cat}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Expiry info */}
                  <div style={{ display: "flex", gap: "16px", fontSize: "11px", color: "#3A5A7A" }}>
                    <span style={{ color: licenseExpired ? "#F87171" : "#3A5A7A" }}>
                      License: {c.license_expiry ? new Date(c.license_expiry).toLocaleDateString() : "—"}
                      {licenseExpired && " ⚠"}
                    </span>
                    <span style={{ color: coiExpired ? "#F87171" : "#3A5A7A" }}>
                      COI: {c.coi_expiry ? new Date(c.coi_expiry).toLocaleDateString() : "—"}
                      {coiExpired && " ⚠"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: "1px solid #1B4F8A",
        padding: "20px 28px",
        textAlign: "center",
        fontSize: "12px",
        color: "#3A5A7A",
        letterSpacing: "1px",
        textTransform: "uppercase",
        marginTop: "40px",
      }}>
        © {new Date().getFullYear()} Our Next Project — Honoring American Veterans
      </footer>
    </div>
  );
}