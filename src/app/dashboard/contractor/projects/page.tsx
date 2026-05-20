import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import HoverCard from "@/components/HoverCard";

type OpenProject = {
  id: string;
  title: string | null;
  category: string | null;
  location_general: string | null;
  description: string | null;
  published_at: string | null;
  deadline_at: string | null;
  min_open_days: number | null;
  max_open_days: number | null;
};

function timeRemaining(deadline: string | null) {
  if (!deadline) return null;
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return null;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days}d ${hours}h remaining`;
  return `${hours}h remaining`;
}

export default async function ContractorOpenProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; category?: string; location?: string }>;
}) {
  const { supabase } = await requireRole(["CONTRACTOR", "ADMIN"]);
  const sp = await searchParams;
  const sort = sp.sort === "newest" ? "newest" : "deadline";
  const categoryFilter = sp.category ?? "";
  const locationFilter = sp.location ?? "";

  const { data, error } = await supabase.rpc("list_open_projects", {
    p_sort: sort,
  });

  if (error) {
    throw new Error(`RPC list_open_projects failed: ${JSON.stringify(error)}`);
  }

  const allProjects = (data ?? []) as OpenProject[];

  // Get unique categories and locations for filter dropdowns
  const allCategories = [...new Set(
    allProjects.map((p) => p.category).filter((c): c is string => !!c)
  )].sort();

  const allLocations = [...new Set(
    allProjects
      .map((p) => p.location_general?.split(",")[1]?.trim())
      .filter((l): l is string => !!l)
  )].sort();

  // Apply filters
  const projects = allProjects.filter((p) => {
    const matchesCategory = !categoryFilter ||
      p.category?.toLowerCase() === categoryFilter.toLowerCase();
    const matchesLocation = !locationFilter ||
      p.location_general?.toLowerCase().includes(locationFilter.toLowerCase());
    return matchesCategory && matchesLocation;
  });

  const buildUrl = (params: Record<string, string>) => {
    const base = new URLSearchParams();
    if (sort !== "deadline") base.set("sort", sort);
    if (categoryFilter) base.set("category", categoryFilter);
    if (locationFilter) base.set("location", locationFilter);
    Object.entries(params).forEach(([k, v]) => {
      if (v) base.set(k, v);
      else base.delete(k);
    });
    const str = base.toString();
    return `/dashboard/contractor/projects${str ? `?${str}` : ""}`;
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "20px" }}>
        <div>
          <h1 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "36px",
            letterSpacing: "1px",
            color: "#0A1628",
            margin: 0,
          }}>
            Open Projects
          </h1>
          <p style={{ fontSize: "13px", color: "#1B4F8A", marginTop: "4px" }}>
            {projects.length} of {allProjects.length} project{allProjects.length !== 1 ? "s" : ""} shown • Client identities hidden until award
          </p>
        </div>

        {/* Sort controls */}
        <div style={{ display: "flex", gap: "8px" }}>
          {[
            { label: "By Deadline", value: "deadline" },
            { label: "Newest", value: "newest" },
          ].map((s) => (
            <Link
              key={s.value}
              href={buildUrl({ sort: s.value })}
              style={{
                background: sort === s.value ? "#1B4F8A" : "transparent",
                color: sort === s.value ? "#fff" : "#1B4F8A",
                border: "1px solid #1B4F8A",
                padding: "8px 16px",
                borderRadius: "6px",
                fontFamily: "'Barlow', sans-serif",
                fontWeight: 500,
                fontSize: "13px",
                textDecoration: "none",
              }}
            >
              {s.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div style={{
        background: "#EEF4FF",
        border: "1px solid #B8D0E8",
        borderRadius: "10px",
        padding: "16px 20px",
        marginBottom: "20px",
      }}>
        <form style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "flex-end" }}>
          {/* Keep sort param */}
          {sort !== "deadline" && <input type="hidden" name="sort" value={sort} />}

          <div>
            <label style={{
              display: "block",
              fontSize: "11px",
              color: "#1B4F8A",
              textTransform: "uppercase",
              letterSpacing: "1px",
              marginBottom: "4px",
            }}>
              Category
            </label>
            <select
              name="category"
              defaultValue={categoryFilter}
              style={{
                background: "#FFFFFF",
                border: "1px solid #B8D0E8",
                color: "#0A1628",
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
                <option key={cat} value={cat}>{cat.replaceAll("_", " ")}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{
              display: "block",
              fontSize: "11px",
              color: "#1B4F8A",
              textTransform: "uppercase",
              letterSpacing: "1px",
              marginBottom: "4px",
            }}>
              State
            </label>
            <select
              name="location"
              defaultValue={locationFilter}
              style={{
                background: "#FFFFFF",
                border: "1px solid #B8D0E8",
                color: "#0A1628",
                borderRadius: "6px",
                padding: "8px 12px",
                fontFamily: "'Barlow', sans-serif",
                fontSize: "13px",
                outline: "none",
                minWidth: "120px",
              }}
            >
              <option value="">All States</option>
              {allLocations.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            style={{
              background: "#1B4F8A",
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

          {(categoryFilter || locationFilter) && (
            <Link
              href={buildUrl({ category: "", location: "" })}
              style={{
                background: "transparent",
                color: "#1B4F8A",
                border: "1px solid #B8D0E8",
                padding: "8px 16px",
                borderRadius: "6px",
                fontFamily: "'Barlow', sans-serif",
                fontSize: "13px",
                textDecoration: "none",
              }}
            >
              Clear Filters
            </Link>
          )}
        </form>

        {/* Active filter indicators */}
        {(categoryFilter || locationFilter) && (
          <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
            {categoryFilter && (
              <span style={{
                fontSize: "11px",
                padding: "3px 10px",
                borderRadius: "20px",
                background: "#FFFFFF",
                color: "#1B4F8A",
                border: "1px solid #B8D0E8",
              }}>
                Category: {categoryFilter.replaceAll("_", " ")}
              </span>
            )}
            {locationFilter && (
              <span style={{
                fontSize: "11px",
                padding: "3px 10px",
                borderRadius: "20px",
                background: "#FFFFFF",
                color: "#1B4F8A",
                border: "1px solid #B8D0E8",
              }}>
                State: {locationFilter}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Project list */}
      {projects.length === 0 ? (
        <div style={{
          background: "#EEF4FF",
          border: "1px solid #B8D0E8",
          borderRadius: "10px",
          padding: "48px",
          textAlign: "center",
          color: "#1B4F8A",
          fontSize: "14px",
        }}>
          {categoryFilter || locationFilter
            ? "No projects match your filters. Try clearing them."
            : "No open projects at the moment. Check back soon."}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {projects.map((p) => {
            const remaining = timeRemaining(p.deadline_at);
            const isUrgent = remaining && remaining.includes("h remaining") && !remaining.includes("d");

            return (
              <Link
                key={p.id}
                href={`/dashboard/contractor/projects/${p.id}`}
                style={{ textDecoration: "none" }}
              >
                <HoverCard style={{
                  background: "#EEF4FF",
                  border: "1px solid #B8D0E8",
                  borderRadius: "10px",
                  padding: "20px",
                  cursor: "pointer",
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                        <div style={{ fontWeight: 600, fontSize: "16px", color: "#0A1628" }}>
                          {p.title ?? "Untitled Project"}
                        </div>
                        {isUrgent && (
                          <span style={{
                            fontSize: "10px",
                            fontWeight: 600,
                            padding: "2px 8px",
                            borderRadius: "20px",
                            background: "#FEF2F2",
                            color: "#991B1B",
                            border: "1px solid #FCA5A5",
                            letterSpacing: "0.5px",
                          }}>
                            CLOSING SOON
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: "13px", color: "#1B4F8A", marginBottom: "8px" }}>
                        <span style={{
                          background: "#FFFFFF",
                          border: "1px solid #B8D0E8",
                          borderRadius: "4px",
                          padding: "2px 8px",
                          fontSize: "11px",
                          marginRight: "8px",
                          color: "#1B4F8A",
                        }}>
                          {p.category?.replaceAll("_", " ") ?? "—"}
                        </span>
                        {p.location_general ?? "—"}
                      </div>
                      {p.description && (
                        <div style={{
                          fontSize: "13px",
                          color: "#4A7FB5",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}>
                          {p.description}
                        </div>
                      )}
                    </div>

                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{
                        fontSize: "11px",
                        color: "#1B4F8A",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                        marginBottom: "4px",
                      }}>
                        Deadline
                      </div>
                      <div style={{
                        fontSize: "13px",
                        color: isUrgent ? "#991B1B" : "#0A1628",
                        fontWeight: 500,
                        marginBottom: "4px",
                      }}>
                        {p.deadline_at ? new Date(p.deadline_at).toLocaleDateString() : "—"}
                      </div>
                      {remaining && (
                        <div style={{
                          fontSize: "12px",
                          color: isUrgent ? "#991B1B" : "#15803D",
                          fontWeight: 600,
                        }}>
                          {remaining}
                        </div>
                      )}
                      <div style={{
                        fontSize: "11px",
                        color: "#4A7FB5",
                        marginTop: "8px",
                      }}>
                        Published {p.published_at ? new Date(p.published_at).toLocaleDateString() : "—"}
                      </div>
                    </div>
                  </div>
                </HoverCard>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
