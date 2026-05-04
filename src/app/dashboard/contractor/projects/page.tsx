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

function fmt(dt: string | null) {
  if (!dt) return "—";
  return new Date(dt).toLocaleString();
}

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
  searchParams: Promise<{ sort?: string }>;
}) {
  const { supabase } = await requireRole(["CONTRACTOR", "ADMIN"]);
  const sp = await searchParams;
  const sort = sp.sort === "newest" ? "newest" : "deadline";

  const { data, error } = await supabase.rpc("list_open_projects", {
    p_sort: sort,
  });

  if (error) {
    throw new Error(`RPC list_open_projects failed: ${JSON.stringify(error)}`);
  }

  const projects = (data ?? []) as OpenProject[];

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px" }}>
        <div>
          <h1 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "36px",
            letterSpacing: "1px",
            color: "#fff",
            margin: 0,
          }}>
            Open Projects
          </h1>
          <p style={{ fontSize: "13px", color: "#7A9CC4", marginTop: "4px" }}>
            {projects.length} project{projects.length !== 1 ? "s" : ""} available • Client identities hidden until award
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
              href={`/dashboard/contractor/projects?sort=${s.value}`}
              style={{
                background: sort === s.value ? "#1B4F8A" : "transparent",
                color: sort === s.value ? "#fff" : "#7A9CC4",
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

      {/* Project list */}
      {projects.length === 0 ? (
        <div style={{
          background: "#0F2040",
          border: "1px solid #1B4F8A",
          borderRadius: "10px",
          padding: "48px",
          textAlign: "center",
          color: "#7A9CC4",
          fontSize: "14px",
        }}>
          No open projects at the moment. Check back soon.
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
                  background: "#0F2040",
                  border: "1px solid #1B4F8A",
                  borderRadius: "10px",
                  padding: "20px",
                  cursor: "pointer",
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                        <div style={{ fontWeight: 600, fontSize: "16px", color: "#fff" }}>
                          {p.title ?? "Untitled Project"}
                        </div>
                        {isUrgent && (
                          <span style={{
                            fontSize: "10px",
                            fontWeight: 600,
                            padding: "2px 8px",
                            borderRadius: "20px",
                            background: "#3D0A0A",
                            color: "#F87171",
                            border: "1px solid #991B1B",
                            letterSpacing: "0.5px",
                          }}>
                            CLOSING SOON
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: "13px", color: "#7A9CC4", marginBottom: "8px" }}>
                        {p.category ?? "—"} • {p.location_general ?? "—"}
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
                        color: "#7A9CC4",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                        marginBottom: "4px",
                      }}>
                        Deadline
                      </div>
                      <div style={{
                        fontSize: "13px",
                        color: isUrgent ? "#F87171" : "#fff",
                        fontWeight: 500,
                        marginBottom: "4px",
                      }}>
                        {p.deadline_at ? new Date(p.deadline_at).toLocaleDateString() : "—"}
                      </div>
                      {remaining && (
                        <div style={{
                          fontSize: "12px",
                          color: isUrgent ? "#F87171" : "#4ADE80",
                          fontWeight: 600,
                        }}>
                          {remaining}
                        </div>
                      )}
                      <div style={{
                        fontSize: "11px",
                        color: "#3A5A7A",
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