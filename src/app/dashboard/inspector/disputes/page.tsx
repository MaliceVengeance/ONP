import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";

function slaChipStyle(daysLeft: number, passed: boolean) {
  if (passed || daysLeft === 0)
    return {
      background: "#FEF2F2",
      border: "1px solid #FCA5A5",
      color: "#991B1B",
    };
  if (daysLeft <= 2)
    return {
      background: "#FFFBEB",
      border: "1px solid #FCD34D",
      color: "#92400E",
    };
  return {
    background: "#EEF4FF",
    border: "1px solid #B8D0E8",
    color: "#1B4F8A",
  };
}

export default async function MasterInspectorDisputesPage({
  searchParams,
}: {
  searchParams: Promise<{ resolved?: string }>;
}) {
  const { user, role } = await requireRole(["INSPECTOR", "ADMIN"]);
  const sp = await searchParams;

  // Check master inspector flag
  const { data: myProfile } = await supabaseAdmin
    .from("profiles")
    .select("is_master_inspector")
    .eq("id", user.id)
    .single();

  const isMasterInspector = (myProfile as any)?.is_master_inspector === true;

  if (role !== "ADMIN" && !isMasterInspector) {
    redirect("/dashboard/inspector");
  }

  // Fetch assigned open disputes (oldest first for SLA)
  const { data: disputes } = await supabaseAdmin
    .from("inspector_upgrade_disputes")
    .select(
      "id, status, created_at, assigned_at, upgrade_charge_cents, project_id, original_inspector_id"
    )
    .eq("master_inspector_id", user.id)
    .in("status", ["SUBMITTED", "UNDER_REVIEW"])
    .order("created_at", { ascending: true });

  const disputeList = (disputes ?? []) as any[];

  // Batch-fetch projects and inspector profiles
  const projectIds  = [...new Set(disputeList.map((d) => d.project_id).filter(Boolean))];
  const inspectorIds = [...new Set(disputeList.map((d) => d.original_inspector_id).filter(Boolean))];

  const [{ data: projects }, { data: inspectorProfiles }] = await Promise.all([
    projectIds.length > 0
      ? supabaseAdmin.from("projects").select("id, title, category, city").in("id", projectIds)
      : Promise.resolve({ data: [] }),
    inspectorIds.length > 0
      ? supabaseAdmin.from("profiles").select("id, display_name").in("id", inspectorIds)
      : Promise.resolve({ data: [] }),
  ]);

  const projectMap  = new Map((projects  ?? []).map((p: any) => [p.id, p]));
  const inspectorMap = new Map((inspectorProfiles ?? []).map((p: any) => [p.id, p]));
  const now         = Date.now();

  function getSla(d: any) {
    const base = d.assigned_at ?? d.created_at;
    // 5 business days ≈ 7 calendar days
    const deadline = new Date(new Date(base).getTime() + 7 * 24 * 60 * 60 * 1000);
    const msLeft   = deadline.getTime() - now;
    const daysLeft = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
    return { deadline, daysLeft, passed: msLeft <= 0 };
  }

  return (
    <div style={{ maxWidth: "800px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "28px",
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: "36px",
              letterSpacing: "1px",
              color: "#0A1628",
              margin: 0,
            }}
          >
            Dispute Reviews
          </h1>
          <p style={{ fontSize: "13px", color: "#1B4F8A", marginTop: "4px" }}>
            Master Inspector — assigned cases
          </p>
        </div>
        <Link
          href="/dashboard/inspector"
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
          Dashboard
        </Link>
      </div>

      {/* Resolved success banner */}
      {sp.resolved === "1" && (
        <div
          style={{
            background: "#F0FDF4",
            border: "1px solid #166534",
            borderRadius: "10px",
            padding: "14px 18px",
            marginBottom: "20px",
            fontSize: "13px",
            color: "#15803D",
            fontWeight: 600,
          }}
        >
          ✅ Decision submitted. Client and inspector have been notified.
        </div>
      )}

      {/* Dispute list */}
      {disputeList.length === 0 ? (
        <div
          style={{
            background: "#EEF4FF",
            border: "1px solid #B8D0E8",
            borderRadius: "12px",
            padding: "48px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: "18px",
              color: "#1B4F8A",
              marginBottom: "8px",
            }}
          >
            No Disputes Assigned
          </div>
          <p style={{ fontSize: "13px", color: "#4A7FB5", margin: 0 }}>
            You have no pending dispute reviews. New assignments will appear here automatically.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {disputeList.map((d: any) => {
            const project  = projectMap.get(d.project_id);
            const inspector = inspectorMap.get(d.original_inspector_id);
            const sla       = getSla(d);
            const chipStyle = slaChipStyle(sla.daysLeft, sla.passed);

            return (
              <Link
                key={d.id}
                href={`/dashboard/inspector/disputes/${d.id}`}
                style={{ textDecoration: "none" }}
              >
                <div
                  style={{
                    background: "#EEF4FF",
                    border: "1px solid #B8D0E8",
                    borderRadius: "10px",
                    padding: "18px 20px",
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: "12px",
                    alignItems: "center",
                    cursor: "pointer",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: "15px",
                        color: "#0A1628",
                        marginBottom: "4px",
                      }}
                    >
                      {project?.title ?? "Untitled Project"}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#1B4F8A",
                        marginBottom: "4px",
                      }}
                    >
                      {project?.category?.replaceAll("_", " ") ?? "—"} • {project?.city ?? "—"}
                    </div>
                    <div style={{ fontSize: "11px", color: "#4A7FB5" }}>
                      Original inspector: {inspector?.display_name ?? "—"} · Filed:{" "}
                      {new Date(d.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      gap: "6px",
                    }}
                  >
                    <span
                      style={{
                        padding: "3px 10px",
                        borderRadius: "10px",
                        fontSize: "11px",
                        fontWeight: 700,
                        letterSpacing: "0.5px",
                        background:
                          d.status === "UNDER_REVIEW" ? "#DBEAFE" : "#FEF9C3",
                        color:
                          d.status === "UNDER_REVIEW" ? "#1D4ED8" : "#92400E",
                        border: `1px solid ${
                          d.status === "UNDER_REVIEW" ? "#93C5FD" : "#FCD34D"
                        }`,
                      }}
                    >
                      {d.status.replaceAll("_", " ")}
                    </span>
                    <span
                      style={{
                        padding: "3px 10px",
                        borderRadius: "10px",
                        fontSize: "11px",
                        fontWeight: 600,
                        ...chipStyle,
                      }}
                    >
                      {sla.passed
                        ? "⚠ SLA Passed"
                        : sla.daysLeft === 0
                        ? "⚠ Due today"
                        : `${sla.daysLeft}d remaining`}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
