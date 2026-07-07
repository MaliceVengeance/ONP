import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { changeUserRole, deactivateUser, reactivateUser } from "./actions";

type Profile = {
  id: string;
  role: string;
  display_name: string | null;
  company_name: string | null;
  created_at: string;
  deactivated: boolean | null;
};

const ALL_ROLES = ["CLIENT", "CONTRACTOR", "INSPECTOR", "ADMIN"];

const TABS = [
  { label: "All",         value: null,         color: "var(--camo-gunmetal)" },
  { label: "Clients",     value: "CLIENT",     color: "var(--camo-gunmetal)" },
  { label: "Contractors", value: "CONTRACTOR", color: "#15803D" },
  { label: "Inspectors",  value: "INSPECTOR",  color: "#92400E" },
  { label: "Admins",      value: "ADMIN",      color: "#991B1B" },
];

function roleColor(role: string) {
  switch (role) {
    case "ADMIN":      return { background: "#FEF2F2", color: "#991B1B", border: "1px solid #FCA5A5" };
    case "CLIENT":     return { background: "var(--camo-concrete)", color: "var(--camo-gunmetal)", border: "1px solid #d9dbdb" };
    case "CONTRACTOR": return { background: "#F0FDF4", color: "#15803D", border: "1px solid #166534" };
    case "INSPECTOR":  return { background: "#FFFBEB", color: "#92400E", border: "1px solid #FCD34D" };
    default:           return { background: "var(--camo-concrete)", color: "var(--camo-gunmetal)", border: "1px solid #d9dbdb" };
  }
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const sp = await searchParams;
  const activeTab = sp.role?.toUpperCase() ?? null;

  const { user: adminUser } = await requireRole(["ADMIN"]);

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, role, display_name, company_name, created_at, deactivated")
    .order("created_at", { ascending: false });

  if (error) throw error;

  const profiles = (data ?? []) as Profile[];

  const { data: authData } = await supabaseAdmin.auth.admin.listUsers();
  const authMap = new Map(
    (authData?.users ?? []).map((u) => [u.id, {
      email: u.email,
      last_sign_in_at: u.last_sign_in_at,
    }])
  );

  // Filter by selected role tab
  const filtered = activeTab
    ? profiles.filter((p) => p.role === activeTab)
    : profiles;

  const active      = filtered.filter((p) => !p.deactivated);
  const deactivated = filtered.filter((p) => p.deactivated);

  // Counts per role for badge numbers
  const counts = Object.fromEntries(
    ALL_ROLES.map((r) => [r, profiles.filter((p) => p.role === r && !p.deactivated).length])
  );
  const totalActive = profiles.filter((p) => !p.deactivated).length;

  return (
    <div>
      {/* Header */}
      <div className="mob-col mob-gap-sm" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h1 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "36px",
            letterSpacing: "1px",
            color: "var(--camo-charcoal)",
            margin: 0,
          }}>
            Users
          </h1>
          <p style={{ fontSize: "13px", color: "var(--camo-gunmetal)", marginTop: "4px" }}>
            {totalActive} active • {profiles.filter((p) => p.deactivated).length} deactivated
          </p>
        </div>
        <div className="mob-wrap" style={{ display: "flex", gap: "8px" }}>
          <Link
            href="/dashboard/admin/users/create"
            style={{
              background: "var(--camo-accent)",
              color: "var(--camo-ink)",
              border: "none",
              padding: "8px 16px",
              borderRadius: "6px",
              fontFamily: "'Barlow', sans-serif",
              fontWeight: 600,
              fontSize: "13px",
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            + Create User
          </Link>
          <Link
            href="/dashboard/admin"
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
            Back
          </Link>
        </div>
      </div>

      {/* Role tabs */}
      <div style={{
        display: "flex",
        gap: "6px",
        marginBottom: "24px",
        borderBottom: "2px solid #d9dbdb",
        paddingBottom: "0",
        flexWrap: "wrap",
      }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.value;
          const count = tab.value === null ? totalActive : counts[tab.value] ?? 0;
          const href = tab.value
            ? `/dashboard/admin/users?role=${tab.value}`
            : `/dashboard/admin/users`;
          return (
            <Link
              key={tab.label}
              href={href}
              style={{
                padding: "8px 16px",
                borderRadius: "6px 6px 0 0",
                fontFamily: "'Barlow', sans-serif",
                fontWeight: isActive ? 700 : 500,
                fontSize: "13px",
                textDecoration: "none",
                color: isActive ? tab.color : "var(--camo-gunmetal)",
                background: isActive ? "#FFFFFF" : "transparent",
                borderTop: isActive ? `2px solid ${tab.color}` : "2px solid transparent",
                borderLeft: isActive ? "1px solid #d9dbdb" : "1px solid transparent",
                borderRight: isActive ? "1px solid #d9dbdb" : "1px solid transparent",
                borderBottom: isActive ? "2px solid #FFFFFF" : "none",
                marginBottom: isActive ? "-2px" : "0",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              {tab.label}
              <span style={{
                fontSize: "11px",
                fontWeight: 700,
                padding: "1px 7px",
                borderRadius: "20px",
                background: isActive ? tab.color : "var(--camo-concrete)",
                color: isActive ? "#fff" : "var(--camo-gunmetal)",
              }}>
                {count}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Active users */}
      <div style={{ marginBottom: "32px" }}>
        <h2 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: "16px",
          letterSpacing: "1px",
          color: "var(--camo-charcoal)",
          textTransform: "uppercase",
          marginBottom: "12px",
        }}>
          Active ({active.length})
        </h2>

        {active.length === 0 ? (
          <div style={{
            background: "var(--camo-concrete)",
            border: "1px solid #d9dbdb",
            borderRadius: "10px",
            padding: "24px",
            textAlign: "center",
            color: "var(--camo-gunmetal)",
            fontSize: "14px",
          }}>
            No {activeTab ? activeTab.toLowerCase() + " " : ""}users found.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {active.map((p) => {
              const auth = authMap.get(p.id);
              return (
                <div key={p.id} style={{
                  background: "#FFFFFF",
                  border: "1px solid #d9dbdb",
                  borderRadius: "10px",
                  padding: "18px",
                }}>
                  <div className="mob-col mob-gap-sm" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: "15px", color: "var(--camo-charcoal)", marginBottom: "3px" }}>
                        {p.display_name ?? p.company_name ?? "No name set"}
                      </div>
                      <div style={{ fontSize: "13px", color: "var(--camo-gunmetal)", marginBottom: "3px" }}>
                        {auth?.email ?? "No email found"}
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--camo-gunmetal)", marginBottom: "3px" }}>
                        ID: {p.id}
                      </div>
                      <div className="mob-wrap" style={{ display: "flex", gap: "16px", fontSize: "11px", color: "var(--camo-gunmetal)" }}>
                        <span>Joined: {new Date(p.created_at).toLocaleDateString()}</span>
                        {auth?.last_sign_in_at && (
                          <span>Last login: {new Date(auth.last_sign_in_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px", flexShrink: 0 }}>
                      <span style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        padding: "4px 10px",
                        borderRadius: "20px",
                        letterSpacing: "0.5px",
                        ...roleColor(p.role),
                      }}>
                        {p.role}
                      </span>

                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Link
                          href={`/dashboard/admin/users/${p.id}`}
                          style={{
                            background: "transparent",
                            color: "var(--camo-gunmetal)",
                            border: "1px solid #d9dbdb",
                            padding: "5px 10px",
                            borderRadius: "6px",
                            fontFamily: "'Barlow', sans-serif",
                            fontSize: "12px",
                            textDecoration: "none",
                          }}
                        >
                          View
                        </Link>

                        {/* Role change — not for clients or self */}
                        {p.id !== adminUser.id && p.role !== "CLIENT" && (
                          <form action={async (formData: FormData) => {
                            "use server";
                            const newRole = formData.get("role") as string;
                            await changeUserRole(p.id, newRole);
                          }}>
                            <div style={{ display: "flex", gap: "6px" }}>
                              <select
                                name="role"
                                defaultValue={p.role}
                                style={{
                                  background: "#FFFFFF",
                                  border: "1px solid #d9dbdb",
                                  color: "var(--camo-charcoal)",
                                  borderRadius: "6px",
                                  padding: "5px 8px",
                                  fontFamily: "'Barlow', sans-serif",
                                  fontSize: "12px",
                                  outline: "none",
                                }}
                              >
                                {ALL_ROLES.map((r) => (
                                  <option key={r} value={r}>{r}</option>
                                ))}
                              </select>
                              <button style={{
                                background: "transparent",
                                color: "var(--camo-gunmetal)",
                                border: "1px solid #d9dbdb",
                                padding: "5px 10px",
                                borderRadius: "6px",
                                fontFamily: "'Barlow', sans-serif",
                                fontSize: "12px",
                                cursor: "pointer",
                              }}>
                                Change
                              </button>
                            </div>
                          </form>
                        )}

                        {/* Deactivate — not for self */}
                        {p.id !== adminUser.id && (
                          <form action={deactivateUser.bind(null, p.id)}>
                            <button style={{
                              background: "#FEF2F2",
                              color: "#991B1B",
                              border: "1px solid #FCA5A5",
                              padding: "5px 10px",
                              borderRadius: "6px",
                              fontFamily: "'Barlow', sans-serif",
                              fontSize: "12px",
                              cursor: "pointer",
                            }}>
                              Deactivate
                            </button>
                          </form>
                        )}

                        {p.id === adminUser.id && (
                          <span style={{ fontSize: "12px", color: "var(--camo-gunmetal)" }}>(you)</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Deactivated users */}
      {deactivated.length > 0 && (
        <div>
          <hr style={{ border: "none", borderTop: "1px solid #d9dbdb", margin: "0 0 20px" }} />
          <h2 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "16px",
            letterSpacing: "1px",
            color: "#991B1B",
            textTransform: "uppercase",
            marginBottom: "12px",
          }}>
            Deactivated ({deactivated.length})
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {deactivated.map((p) => {
              const auth = authMap.get(p.id);
              return (
                <div key={p.id} style={{
                  background: "#FEF2F2",
                  border: "1px solid #FCA5A5",
                  borderRadius: "10px",
                  padding: "18px",
                  opacity: 0.8,
                }}>
                  <div className="mob-col mob-gap-sm" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "15px", color: "var(--camo-charcoal)", marginBottom: "3px" }}>
                        {p.display_name ?? p.company_name ?? "No name set"}
                      </div>
                      <div style={{ fontSize: "13px", color: "#991B1B", marginBottom: "2px" }}>
                        {auth?.email ?? "No email found"}
                      </div>
                      <span style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        padding: "3px 8px",
                        borderRadius: "20px",
                        ...roleColor(p.role),
                      }}>
                        {p.role}
                      </span>
                    </div>
                    <div className="mob-wrap" style={{ display: "flex", gap: "8px" }}>
                      <Link
                        href={`/dashboard/admin/users/${p.id}`}
                        style={{
                          background: "transparent",
                          color: "var(--camo-gunmetal)",
                          border: "1px solid #d9dbdb",
                          padding: "6px 12px",
                          borderRadius: "6px",
                          fontFamily: "'Barlow', sans-serif",
                          fontSize: "12px",
                          textDecoration: "none",
                        }}
                      >
                        View
                      </Link>
                      <form action={reactivateUser.bind(null, p.id)}>
                        <button style={{
                          background: "#F0FDF4",
                          color: "#15803D",
                          border: "1px solid #166534",
                          padding: "6px 12px",
                          borderRadius: "6px",
                          fontFamily: "'Barlow', sans-serif",
                          fontSize: "12px",
                          cursor: "pointer",
                        }}>
                          Reactivate
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
