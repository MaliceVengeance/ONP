import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";
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
  is_emergency?: boolean;
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
  const { supabase, user } = await requireRole(["CONTRACTOR", "ADMIN"]);
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

  const rpcProjects = (data ?? []) as OpenProject[];

  // Fetch is_emergency for all returned projects in one query
  let emergencyMap = new Map<string, boolean>();
  if (rpcProjects.length > 0) {
    const { data: emergencyRows } = await supabaseAdmin
      .from("projects")
      .select("id, is_emergency")
      .in("id", rpcProjects.map((p) => p.id));
    (emergencyRows ?? []).forEach((r: any) => {
      if (r.is_emergency) emergencyMap.set(r.id, true);
    });
  }

  // Merge is_emergency into project objects
  const mergedProjects = rpcProjects.map((p) => ({
    ...p,
    is_emergency: emergencyMap.get(p.id) ?? false,
  }));

  // Fetch this contractor's bid project IDs so we can keep past-deadline
  // projects they've already bid on
  const { data: myBids } = await supabase
    .from("bids")
    .select("project_id")
    .eq("contractor_id", user.id);

  const biddedProjectIds = new Set((myBids ?? []).map((b) => b.project_id));

  const now = Date.now();
  const allProjects = mergedProjects.filter((p) => {
    const deadlinePassed = p.deadline_at
      ? new Date(p.deadline_at).getTime() <= now
      : false;
    // Hide past-deadline projects unless this contractor has bid on them
    if (deadlinePassed && !biddedProjectIds.has(p.id)) return false;
    return true;
  });

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
  const filtered = allProjects.filter((p) => {
    const matchesCategory = !categoryFilter ||
      p.category?.toLowerCase() === categoryFilter.toLowerCase();
    const matchesLocation = !locationFilter ||
      p.location_general?.toLowerCase().includes(locationFilter.toLowerCase());
    return matchesCategory && matchesLocation;
  });

  // Sort emergency projects to the top (preserve existing sort order within each group)
  const projects = [
    ...filtered.filter((p) => p.is_emergency),
    ...filtered.filter((p) => !p.is_emergency),
  ];

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
      <div className="mob-col mob-gap-sm" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "20px" }}>
        <div>
          <h1 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "36px",
            letterSpacing: "1px",
            color: "var(--camo-charcoal)",
            margin: 0,
          }}>
            Open Projects
          </h1>
          <p style={{ fontSize: "13px", color: "var(--camo-gunmetal)", marginTop: "4px" }}>
            {projects.length} of {allProjects.length} project{allProjects.length !== 1 ? "s" : ""} shown • Client identities hidden until award
          </p>
        </div>

        {/* Sort controls + Back */}
        <div className="mob-wrap" style={{ display: "flex", gap: "8px" }}>
          {[
            { label: "By Deadline", value: "deadline" },
            { label: "Newest", value: "newest" },
          ].map((s) => (
            <Link
              key={s.value}
              href={buildUrl({ sort: s.value })}
              style={{
                background: sort === s.value ? "var(--camo-gunmetal)" : "transparent",
                color: sort === s.value ? "#fff" : "var(--camo-gunmetal)",
                border: "1px solid var(--camo-gunmetal)",
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
          <Link
            href="/dashboard/contractor"
            style={{
              background: "transparent",
              color: "var(--camo-gunmetal)",
              border: "1px solid #d9dbdb",
              padding: "8px 16px",
              borderRadius: "6px",
              fontFamily: "'Barlow', sans-serif",
              fontSize: "13px",
              textDecoration: "none",
            }}
          >
            ← Back
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        background: "var(--camo-concrete)",
        border: "1px solid #d9dbdb",
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
              color: "var(--camo-gunmetal)",
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
                border: "1px solid #d9dbdb",
                color: "var(--camo-charcoal)",
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
              color: "var(--camo-gunmetal)",
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
                border: "1px solid #d9dbdb",
                color: "var(--camo-charcoal)",
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
              background: "var(--camo-gunmetal)",
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
                color: "var(--camo-gunmetal)",
                border: "1px solid #d9dbdb",
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
                color: "var(--camo-gunmetal)",
                border: "1px solid #d9dbdb",
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
                color: "var(--camo-gunmetal)",
                border: "1px solid #d9dbdb",
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
          background: "var(--camo-concrete)",
          border: "1px solid #d9dbdb",
          borderRadius: "10px",
          padding: "48px",
          textAlign: "center",
          color: "var(--camo-gunmetal)",
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
            const isEmergency = !!p.is_emergency;

            return (
              <Link
                key={p.id}
                href={`/dashboard/contractor/projects/${p.id}`}
                style={{ textDecoration: "none" }}
              >
                <HoverCard style={{
                  background: isEmergency ? "#180800" : "var(--camo-concrete)",
                  border: `1px solid ${isEmergency ? "#C2410C" : "#d9dbdb"}`,
                  borderRadius: "10px",
                  padding: "20px",
                  cursor: "pointer",
                }}>
                  <div className="mob-card-stack" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                        <div style={{ fontWeight: 600, fontSize: "16px", color: isEmergency ? "#FED7AA" : "var(--camo-charcoal)" }}>
                          {p.title ?? "Untitled Project"}
                        </div>
                        {isEmergency && (
                          <span style={{
                            fontSize: "10px",
                            fontWeight: 700,
                            padding: "2px 10px",
                            borderRadius: "20px",
                            background: "#C2410C",
                            color: "#FFFFFF",
                            letterSpacing: "0.5px",
                          }}>
                            🚨 EMERGENCY
                          </span>
                        )}
                        {!isEmergency && isUrgent && (
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
                      <div style={{ fontSize: "13px", color: isEmergency ? "#FDBA74" : "var(--camo-gunmetal)", marginBottom: "8px" }}>
                        <span style={{
                          background: isEmergency ? "#7C1A00" : "#FFFFFF",
                          border: `1px solid ${isEmergency ? "#C2410C" : "#d9dbdb"}`,
                          borderRadius: "4px",
                          padding: "2px 8px",
                          fontSize: "11px",
                          marginRight: "8px",
                          color: isEmergency ? "#FED7AA" : "var(--camo-gunmetal)",
                        }}>
                          {p.category?.replaceAll("_", " ") ?? "—"}
                        </span>
                        {p.location_general ?? "—"}
                      </div>
                      {p.description && (
                        <div style={{
                          fontSize: "13px",
                          color: isEmergency ? "#FCA974" : "var(--camo-gunmetal)",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}>
                          {p.description}
                        </div>
                      )}
                      {isEmergency && (
                        <div style={{ fontSize: "12px", color: "#FCA5A5", marginTop: "6px", fontWeight: 600 }}>
                          ⚡ Bids visible immediately — respond now
                        </div>
                      )}
                    </div>

                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{
                        fontSize: "11px",
                        color: isEmergency ? "#FDBA74" : "var(--camo-gunmetal)",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                        marginBottom: "4px",
                      }}>
                        {isEmergency ? "Closes" : "Deadline"}
                      </div>
                      <div style={{
                        fontSize: "13px",
                        color: isEmergency ? "#FDBA74" : isUrgent ? "#991B1B" : "var(--camo-charcoal)",
                        fontWeight: 500,
                        marginBottom: "4px",
                      }}>
                        {p.deadline_at ? new Date(p.deadline_at).toLocaleDateString() : "—"}
                      </div>
                      {remaining && (
                        <div style={{
                          fontSize: "12px",
                          color: isEmergency ? "#FCA5A5" : isUrgent ? "#991B1B" : "#15803D",
                          fontWeight: 600,
                        }}>
                          {remaining}
                        </div>
                      )}
                      <div style={{
                        fontSize: "11px",
                        color: isEmergency ? "#9A5030" : "var(--camo-gunmetal)",
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
