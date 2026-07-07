import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { stateBadge } from "@/lib/ui";

type Project = {
  id: string;
  title: string | null;
  state: string;
  created_at: string;
  zip_code: string | null;
  category: string | null;
  bid_deadline: string | null;
};

type Bid = {
  id: string;
  project_id: string;
  status: string | null;
  created_at: string;
  amount: number | null;
  project_title: string | null;
  project_zip: string | null;
};

export default async function AdminUserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["ADMIN"]);
  const { id: userId } = await params;

  // Fetch profile first so we can check existence before other queries
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select(
      "id, role, display_name, company_name, created_at, deactivated, phone, " +
      "address_line1, address_line2, address_city, address_state, address_zip, " +
      "is_master_inspector, upgrade_blocked"
    )
    .eq("id", userId)
    .single() as { data: Record<string, any> | null; error: any };

  // Separately fetch service area columns (added by migration 005 — may not exist yet)
  const { data: saData } = await supabaseAdmin
    .from("profiles")
    .select("service_area_zip, service_area_status")
    .eq("id", userId)
    .maybeSingle()
    .then((res) => res.error ? { data: null } : res);

  if (!profile) {
    return (
      <div style={{ maxWidth: "760px" }}>
        <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "32px", color: "var(--camo-charcoal)" }}>
          User Not Found
        </h1>
        <Link href="/dashboard/admin/users" style={{ color: "var(--camo-gunmetal)", textDecoration: "underline", fontSize: "13px", display: "block", marginTop: "16px" }}>
          ← Back to Users
        </Link>
      </div>
    );
  }

  const results = await Promise.all([
    supabaseAdmin.auth.admin.getUserById(userId),
    supabaseAdmin
      .from("contractor_profiles")
      .select(
        "business_name, phone, address_line1, address_line2, city, state, address_zip, categories, description, is_listed, " +
        "veteran_applied_at, veteran_verified, veteran_verified_at, military_branch, " +
        "license_number, license_expiry, coi_provider, coi_policy_number, coi_expiry, coi_amount, " +
        "directory_verified, directory_verified_at, has_no_license, has_no_insurance"
      )
      .eq("contractor_id", userId)
      .maybeSingle(),
    supabaseAdmin
      .from("projects")
      .select("id, title, state, created_at, zip_code, category, bid_deadline")
      .eq("client_id", userId)
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("bids")
      .select("id, project_id, status, created_at, amount, projects(title, zip_code)")
      .eq("contractor_id", userId)
      .order("created_at", { ascending: false }),
  ]) as any[];

  const authUser = results[0]?.data?.user ?? null;
  const contractorProfile = results[1]?.data ?? null;
  const rawProjects = results[2]?.data ?? [];
  const rawBids = results[3]?.data ?? [];

  // Normalize projects
  const projects: Project[] = (rawProjects ?? []) as Project[];

  // Normalize bids (flatten the nested projects join)
  const bids: Bid[] = (rawBids ?? []).map((b: any) => ({
    id: b.id,
    project_id: b.project_id,
    status: b.status,
    created_at: b.created_at,
    amount: b.amount,
    project_title: b.projects?.title ?? null,
    project_zip: b.projects?.zip_code ?? null,
  }));

  // Fetch verification audit log for contractors
  const verificationLog: Array<{
    id: string;
    action_type: string;
    admin_email: string;
    note: string;
    created_at: string;
  }> = [];
  if (profile.role === "CONTRACTOR") {
    const { data: logRows } = await supabaseAdmin
      .from("contractor_verification_log")
      .select("id, action_type, admin_email, note, created_at")
      .eq("contractor_id", userId)
      .order("created_at", { ascending: false });
    verificationLog.push(...(logRows ?? []));
  }

  // Build bid count map for projects
  const bidCountMap = new Map<string, number>();
  for (const bid of bids) {
    bidCountMap.set(bid.project_id, (bidCountMap.get(bid.project_id) ?? 0) + 1);
  }
  // Also fetch bid counts for client projects (bids placed BY others on their projects)
  let clientBidCounts = new Map<string, number>();
  if (profile.role === "CLIENT" && projects.length > 0) {
    const projectIds = projects.map((p) => p.id);
    const { data: projectBidRows } = await supabaseAdmin
      .from("bids")
      .select("project_id")
      .in("project_id", projectIds);
    for (const row of projectBidRows ?? []) {
      clientBidCounts.set(row.project_id, (clientBidCounts.get(row.project_id) ?? 0) + 1);
    }
  }

  // Group projects by status
  const draftProjects = projects.filter((p) => p.state === "DRAFT");
  const forBidProjects = projects.filter((p) => p.state === "FOR_BID");
  const awardedProjects = projects.filter((p) => p.state === "AWARDED");
  const closedProjects = projects.filter((p) => !["DRAFT", "FOR_BID", "AWARDED"].includes(p.state));

  function roleColor(role: string) {
    switch (role) {
      case "ADMIN": return { background: "#FEF2F2", color: "#991B1B", border: "1px solid #FCA5A5" };
      case "CLIENT": return { background: "var(--camo-concrete)", color: "var(--camo-gunmetal)", border: "1px solid #d9dbdb" };
      case "CONTRACTOR": return { background: "#F0FDF4", color: "#15803D", border: "1px solid #166534" };
      case "INSPECTOR": return { background: "#FFFBEB", color: "#92400E", border: "1px solid #FCD34D" };
      default: return { background: "var(--camo-concrete)", color: "var(--camo-gunmetal)", border: "1px solid #d9dbdb" };
    }
  }

  function serviceAreaBadge(status: string | null) {
    switch (status) {
      case "IN_AREA": return { background: "#F0FDF4", color: "#15803D", border: "1px solid #166534" };
      case "OUT_OF_AREA": return { background: "#FFFBEB", color: "#92400E", border: "1px solid #FCD34D" };
      default: return { background: "#F1F5F9", color: "#475569", border: "1px solid #CBD5E1" };
    }
  }

  const sectionCard = {
    background: "var(--camo-concrete)",
    border: "1px solid #d9dbdb",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "16px",
  };

  const sectionTitle = {
    fontFamily: "'Barlow Condensed', sans-serif",
    fontWeight: 700,
    fontSize: "16px",
    letterSpacing: "1px",
    color: "var(--camo-charcoal)",
    textTransform: "uppercase" as const,
    marginBottom: "14px",
    marginTop: 0,
  };

  function ProjectRow({ project }: { project: Project }) {
    const bidCount = clientBidCounts.get(project.id) ?? 0;
    return (
      <div style={{
        background: "#FFFFFF",
        border: "1px solid #d9dbdb",
        borderRadius: "8px",
        padding: "12px 16px",
        marginBottom: "8px",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--camo-charcoal)", marginBottom: "3px" }}>
              {project.title ?? "Untitled Project"}
            </div>
            <div style={{ fontSize: "12px", color: "var(--camo-gunmetal)", marginBottom: "4px" }}>
              {[project.category, project.zip_code].filter(Boolean).join(" · ") || "—"}
            </div>
            <div style={{ fontSize: "11px", color: "var(--camo-gunmetal)" }}>
              Created: {new Date(project.created_at).toLocaleDateString()}
              {project.bid_deadline && (
                <span style={{ marginLeft: "10px" }}>
                  Deadline: {new Date(project.bid_deadline).toLocaleDateString()}
                </span>
              )}
              {bidCount > 0 && (
                <span style={{ marginLeft: "10px", fontWeight: 600, color: "#15803D" }}>
                  {bidCount} bid{bidCount !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
            <span style={stateBadge(project.state)}>{project.state}</span>
            <Link
              href={`/dashboard/admin/projects/${project.id}`}
              style={{
                fontSize: "11px",
                color: "var(--camo-gunmetal)",
                border: "1px solid #d9dbdb",
                borderRadius: "4px",
                padding: "3px 8px",
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              View →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "760px" }}>
      {/* Header */}
      <div className="mob-col mob-gap-sm" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px" }}>
        <div>
          <h1 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "36px",
            letterSpacing: "1px",
            color: "var(--camo-charcoal)",
            margin: 0,
          }}>
            {profile.display_name ?? profile.company_name ?? "No Name"}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px", flexWrap: "wrap" }}>
            <span style={{
              fontSize: "11px",
              fontWeight: 600,
              padding: "4px 10px",
              borderRadius: "20px",
              letterSpacing: "0.5px",
              ...roleColor(profile.role),
            }}>
              {profile.role}
            </span>
            {profile.deactivated && (
              <span style={{
                fontSize: "11px",
                fontWeight: 600,
                padding: "4px 10px",
                borderRadius: "20px",
                background: "#FEF2F2",
                color: "#991B1B",
                border: "1px solid #FCA5A5",
              }}>
                DEACTIVATED
              </span>
            )}
            {(profile as any).is_master_inspector && (
              <span style={{
                fontSize: "11px",
                fontWeight: 600,
                padding: "4px 10px",
                borderRadius: "20px",
                background: "#FFFBEB",
                color: "#92400E",
                border: "1px solid #FCD34D",
              }}>
                MASTER INSPECTOR
              </span>
            )}
            {(profile as any).upgrade_blocked && (
              <span style={{
                fontSize: "11px",
                fontWeight: 600,
                padding: "4px 10px",
                borderRadius: "20px",
                background: "#FEF2F2",
                color: "#991B1B",
                border: "1px solid #FCA5A5",
              }}>
                UPGRADE BLOCKED
              </span>
            )}
          </div>
        </div>
        <Link
          href="/dashboard/admin/users"
          style={{
            background: "transparent",
            color: "var(--camo-gunmetal)",
            border: "1px solid #d9dbdb",
            padding: "8px 16px",
            borderRadius: "6px",
            fontFamily: "'Barlow', sans-serif",
            fontSize: "13px",
            textDecoration: "none",
            flexShrink: 0,
          }}
        >
          ← Users
        </Link>
      </div>

      {/* Account Information */}
      <div style={sectionCard}>
        <h2 style={sectionTitle}>Account Information</h2>
        <div className="mob-grid-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
          {[
            { label: "Email", value: authUser?.email ?? "—" },
            { label: "Email Confirmed", value: authUser?.email_confirmed_at ? `Yes — ${new Date(authUser.email_confirmed_at).toLocaleDateString()}` : "Not confirmed" },
            { label: "User ID", value: profile.id },
            { label: "Role", value: profile.role },
            { label: "Joined", value: new Date(profile.created_at).toLocaleDateString() },
            { label: "Last Login", value: authUser?.last_sign_in_at ? new Date(authUser.last_sign_in_at).toLocaleDateString() : "Never" },
            { label: "Account Status", value: profile.deactivated ? "Deactivated" : "Active" },
            { label: "Display Name", value: profile.display_name ?? "—" },
            { label: "Company Name", value: profile.company_name ?? "—" },
          ].map((item) => (
            <div key={item.label}>
              <div style={{ fontSize: "11px", color: "var(--camo-gunmetal)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "3px" }}>
                {item.label}
              </div>
              <div style={{ fontSize: "13px", color: "var(--camo-charcoal)", wordBreak: "break-all" }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact & Service Area */}
      <div style={sectionCard}>
        <h2 style={sectionTitle}>Contact & Service Area</h2>
        <div className="mob-grid-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
          <div>
            <div style={{ fontSize: "11px", color: "var(--camo-gunmetal)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "3px" }}>Phone</div>
            <div style={{ fontSize: "13px", color: "var(--camo-charcoal)" }}>
              {(profile.role === "CONTRACTOR" ? (contractorProfile as any)?.phone : profile.phone) ?? "—"}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "11px", color: "var(--camo-gunmetal)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "3px" }}>Service Area ZIP</div>
            <div style={{ fontSize: "13px", color: "var(--camo-charcoal)" }}>{saData?.service_area_zip ?? "—"}</div>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <div style={{ fontSize: "11px", color: "var(--camo-gunmetal)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "3px" }}>Address</div>
            <div style={{ fontSize: "13px", color: "var(--camo-charcoal)" }}>
              {profile.address_line1 ? (
                <>
                  {profile.address_line1}
                  {profile.address_line2 && `, ${profile.address_line2}`}
                  {profile.address_city && `, ${profile.address_city}`}
                  {profile.address_state && `, ${profile.address_state}`}
                  {profile.address_zip && ` ${profile.address_zip}`}
                </>
              ) : "—"}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "11px", color: "var(--camo-gunmetal)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>Service Area Status</div>
            {saData?.service_area_status ? (
              <span style={{
                fontSize: "11px",
                fontWeight: 600,
                padding: "4px 10px",
                borderRadius: "20px",
                letterSpacing: "0.3px",
                ...serviceAreaBadge(saData.service_area_status),
              }}>
                {saData.service_area_status.replace(/_/g, " ")}
              </span>
            ) : (
              <span style={{ fontSize: "13px", color: "var(--camo-charcoal)" }}>—</span>
            )}
          </div>
        </div>
      </div>

      {/* Contractor Profile */}
      {profile.role === "CONTRACTOR" && (
        <div style={sectionCard}>
          <h2 style={sectionTitle}>Contractor Profile</h2>
          {contractorProfile ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div className="mob-grid-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                {[
                  { label: "Business Name", value: contractorProfile.business_name ?? "—" },
                  { label: "Listed in Directory", value: contractorProfile.is_listed ? "Yes" : "No" },
                  { label: "Military Branch", value: contractorProfile.military_branch ?? "—" },
                ].map((item) => (
                  <div key={item.label}>
                    <div style={{ fontSize: "11px", color: "var(--camo-gunmetal)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "3px" }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: "13px", color: "var(--camo-charcoal)" }}>{item.value}</div>
                  </div>
                ))}
                {/* Business Address — full field */}
                <div style={{ gridColumn: "1 / -1" }}>
                  <div style={{ fontSize: "11px", color: "var(--camo-gunmetal)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "3px" }}>Business Address</div>
                  <div style={{ fontSize: "13px", color: "var(--camo-charcoal)" }}>
                    {contractorProfile.address_line1 ? (
                      <>
                        {contractorProfile.address_line1}
                        {contractorProfile.address_line2 && `, ${contractorProfile.address_line2}`}
                        {contractorProfile.city && `, ${contractorProfile.city}`}
                        {contractorProfile.state && `, ${contractorProfile.state}`}
                        {contractorProfile.address_zip && ` ${contractorProfile.address_zip}`}
                      </>
                    ) : (
                      [contractorProfile.city, contractorProfile.state].filter(Boolean).join(", ") || "—"
                    )}
                  </div>
                </div>
              </div>
              {contractorProfile.categories && (contractorProfile.categories as string[]).length > 0 && (
                <div>
                  <div style={{ fontSize: "11px", color: "var(--camo-gunmetal)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>
                    Trade Categories
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {(contractorProfile.categories as string[]).map((cat) => (
                      <span key={cat} style={{
                        fontSize: "11px",
                        padding: "3px 10px",
                        borderRadius: "20px",
                        background: "#DBEAFE",
                        color: "#1E40AF",
                        border: "1px solid #93C5FD",
                      }}>
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {contractorProfile.veteran_verified && (
                <div style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "12px",
                  fontWeight: 600,
                  padding: "6px 14px",
                  borderRadius: "20px",
                  background: "#FFF7ED",
                  color: "#B45309",
                  border: "1px solid #D97706",
                  width: "fit-content",
                }}>
                  ★ Veteran Owned — Verified
                  {contractorProfile.veteran_verified_at && (
                    <span style={{ fontWeight: 400, color: "#D97706" }}>
                      ({new Date(contractorProfile.veteran_verified_at).toLocaleDateString()})
                    </span>
                  )}
                </div>
              )}
              {contractorProfile.description && (
                <div>
                  <div style={{ fontSize: "11px", color: "var(--camo-gunmetal)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>
                    Business Description
                  </div>
                  <div style={{ fontSize: "13px", color: "var(--camo-charcoal)", lineHeight: 1.6, background: "var(--camo-paper)", border: "1px solid #d9dbdb", borderRadius: "6px", padding: "10px 14px" }}>
                    {contractorProfile.description}
                  </div>
                </div>
              )}

              {/* License & Insurance */}
              <div style={{ borderTop: "1px solid #d9dbdb", paddingTop: "16px", marginTop: "4px" }}>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--camo-charcoal)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>
                  License & Insurance
                </div>

                {/* Directory verification badge */}
                <div style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "12px",
                  fontWeight: 600,
                  padding: "4px 12px",
                  borderRadius: "20px",
                  marginBottom: "14px",
                  ...(contractorProfile.directory_verified
                    ? { background: "#F0FDF4", color: "#15803D", border: "1px solid #166534" }
                    : { background: "#FFFBEB", color: "#92400E", border: "1px solid #FCD34D" }),
                }}>
                  {contractorProfile.directory_verified
                    ? `✅ Directory Verified${contractorProfile.directory_verified_at ? ` — ${new Date(contractorProfile.directory_verified_at).toLocaleDateString()}` : ""}`
                    : "⏳ Not Yet Verified"}
                </div>

                <div className="mob-grid-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <div style={{ fontSize: "11px", color: "var(--camo-gunmetal)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "3px" }}>License Number</div>
                    <div style={{ fontSize: "13px", color: "var(--camo-charcoal)" }}>
                      {(contractorProfile as any).has_no_license
                        ? <span style={{ color: "#991B1B", fontStyle: "italic" }}>No license disclosed</span>
                        : (contractorProfile as any).license_number || "—"}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", color: "var(--camo-gunmetal)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "3px" }}>License Expiry</div>
                    <div style={{ fontSize: "13px", color: "var(--camo-charcoal)" }}>
                      {(contractorProfile as any).license_expiry
                        ? new Date((contractorProfile as any).license_expiry).toLocaleDateString()
                        : "—"}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", color: "var(--camo-gunmetal)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "3px" }}>Insurance Provider</div>
                    <div style={{ fontSize: "13px", color: "var(--camo-charcoal)" }}>
                      {(contractorProfile as any).has_no_insurance
                        ? <span style={{ color: "#991B1B", fontStyle: "italic" }}>No insurance disclosed</span>
                        : (contractorProfile as any).coi_provider || "—"}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", color: "var(--camo-gunmetal)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "3px" }}>COI Policy #</div>
                    <div style={{ fontSize: "13px", color: "var(--camo-charcoal)" }}>{(contractorProfile as any).coi_policy_number || "—"}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", color: "var(--camo-gunmetal)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "3px" }}>COI Expiry</div>
                    <div style={{ fontSize: "13px", color: "var(--camo-charcoal)" }}>
                      {(contractorProfile as any).coi_expiry
                        ? new Date((contractorProfile as any).coi_expiry).toLocaleDateString()
                        : "—"}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", color: "var(--camo-gunmetal)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "3px" }}>Coverage Amount</div>
                    <div style={{ fontSize: "13px", color: "var(--camo-charcoal)" }}>
                      {(contractorProfile as any).coi_amount
                        ? `$${Number((contractorProfile as any).coi_amount).toLocaleString()}`
                        : "—"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: "13px", color: "var(--camo-gunmetal)", margin: 0 }}>No contractor profile created yet.</p>
          )}
        </div>
      )}

      {/* Client Projects */}
      {profile.role === "CLIENT" && (
        <div style={sectionCard}>
          <h2 style={sectionTitle}>
            Projects ({projects.length} total)
          </h2>
          {projects.length === 0 ? (
            <p style={{ fontSize: "13px", color: "var(--camo-gunmetal)", margin: 0 }}>No projects yet.</p>
          ) : (
            <>
              {/* For Bid */}
              {forBidProjects.length > 0 && (
                <div style={{ marginBottom: "20px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#15803D", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px", paddingBottom: "6px", borderBottom: "1px solid #BBF7D0" }}>
                    For Bid ({forBidProjects.length})
                  </div>
                  {forBidProjects.map((p) => <ProjectRow key={p.id} project={p} />)}
                </div>
              )}

              {/* Draft */}
              {draftProjects.length > 0 && (
                <div style={{ marginBottom: "20px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--camo-gunmetal)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px", paddingBottom: "6px", borderBottom: "1px solid #d9dbdb" }}>
                    Drafts ({draftProjects.length})
                  </div>
                  {draftProjects.map((p) => <ProjectRow key={p.id} project={p} />)}
                </div>
              )}

              {/* Awarded */}
              {awardedProjects.length > 0 && (
                <div style={{ marginBottom: "20px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#92400E", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px", paddingBottom: "6px", borderBottom: "1px solid #FCD34D" }}>
                    Awarded ({awardedProjects.length})
                  </div>
                  {awardedProjects.map((p) => <ProjectRow key={p.id} project={p} />)}
                </div>
              )}

              {/* Closed / Other */}
              {closedProjects.length > 0 && (
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--camo-gunmetal)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px", paddingBottom: "6px", borderBottom: "1px solid #d9dbdb" }}>
                    Closed / Other ({closedProjects.length})
                  </div>
                  {closedProjects.map((p) => <ProjectRow key={p.id} project={p} />)}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Verification History */}
      {profile.role === "CONTRACTOR" && (
        <div style={sectionCard}>
          <h2 style={sectionTitle}>Verification History ({verificationLog.length})</h2>
          {verificationLog.length === 0 ? (
            <p style={{ fontSize: "13px", color: "var(--camo-gunmetal)", margin: 0 }}>No verification actions recorded yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {verificationLog.map((entry) => {
                const isApproval = entry.action_type.endsWith("_APPROVED");
                const isVet = entry.action_type.startsWith("VET_");
                const label = entry.action_type === "VET_APPROVED"   ? "★ Veteran Cert Approved"
                            : entry.action_type === "VET_REJECTED"   ? "Veteran Cert Rejected"
                            : entry.action_type === "DIR_APPROVED"   ? "✅ Directory Verified"
                            : entry.action_type === "DIR_REJECTED"   ? "Directory Verification Rejected"
                            : entry.action_type;
                const colors = isApproval
                  ? { background: "#F0FDF4", border: "1px solid #BBF7D0", badge: { background: "#F0FDF4", color: "#15803D", border: "1px solid #166534" } }
                  : { background: "#FEF2F2", border: "1px solid #FECACA", badge: { background: "#FEF2F2", color: "#991B1B", border: "1px solid #FCA5A5" } };
                return (
                  <div key={entry.id} style={{ background: colors.background, border: colors.border, borderRadius: "8px", padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "6px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 700, padding: "3px 10px", borderRadius: "20px", ...colors.badge }}>
                        {label}
                      </span>
                      <span style={{ fontSize: "11px", color: "var(--camo-gunmetal)", whiteSpace: "nowrap", flexShrink: 0 }}>
                        {new Date(entry.created_at).toLocaleDateString()} {new Date(entry.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--camo-gunmetal)", marginBottom: "4px" }}>
                      By: <strong>{entry.admin_email || "Admin"}</strong>
                    </div>
                    <div style={{ fontSize: "13px", color: "var(--camo-charcoal)", fontStyle: "italic", lineHeight: 1.5 }}>
                      "{entry.note}"
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Contractor Bids */}
      {profile.role === "CONTRACTOR" && (
        <div style={sectionCard}>
          <h2 style={sectionTitle}>Bids Submitted ({bids.length} total)</h2>
          {bids.length === 0 ? (
            <p style={{ fontSize: "13px", color: "var(--camo-gunmetal)", margin: 0 }}>No bids submitted yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {bids.map((b) => (
                <div key={b.id} style={{
                  background: "#FFFFFF",
                  border: "1px solid #d9dbdb",
                  borderRadius: "8px",
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: "12px",
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--camo-charcoal)", marginBottom: "3px" }}>
                      {b.project_title ?? "Unknown Project"}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--camo-gunmetal)" }}>
                      {new Date(b.created_at).toLocaleDateString()}
                      {b.project_zip && <span style={{ marginLeft: "8px" }}>ZIP: {b.project_zip}</span>}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                    {b.amount != null && (
                      <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--camo-charcoal)" }}>
                        ${b.amount.toLocaleString()}
                      </span>
                    )}
                    <span style={stateBadge(b.status ?? "DRAFT")}>{b.status ?? "—"}</span>
                    <Link
                      href={`/dashboard/admin/projects/${b.project_id}`}
                      style={{
                        fontSize: "11px",
                        color: "var(--camo-gunmetal)",
                        border: "1px solid #d9dbdb",
                        borderRadius: "4px",
                        padding: "3px 8px",
                        textDecoration: "none",
                        whiteSpace: "nowrap",
                      }}
                    >
                      View →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
