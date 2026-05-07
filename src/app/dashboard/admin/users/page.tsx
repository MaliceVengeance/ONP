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

function roleColor(role: string) {
  switch (role) {
    case "ADMIN": return { background: "#3D0A0A", color: "#F87171", border: "1px solid #991B1B" };
    case "CLIENT": return { background: "#0D2040", color: "#60A5FA", border: "1px solid #1D4ED8" };
    case "CONTRACTOR": return { background: "#0D3320", color: "#4ADE80", border: "1px solid #166534" };
    case "INSPECTOR": return { background: "#2D2000", color: "#FBBF24", border: "1px solid #92400E" };
    default: return { background: "#0F2040", color: "#7A9CC4", border: "1px solid #1B4F8A" };
  }
}

export default async function AdminUsersPage() {
  const { supabase, user: adminUser } = await requireRole(["ADMIN"]);

  const { data, error } = await supabase
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

  const active = profiles.filter((p) => !p.deactivated);
  const deactivated = profiles.filter((p) => p.deactivated);

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
        <div>
          <h1 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "36px",
            letterSpacing: "1px",
            color: "#fff",
            margin: 0,
          }}>
            Users
          </h1>
          <p style={{ fontSize: "13px", color: "#7A9CC4", marginTop: "4px" }}>
            {active.length} active • {deactivated.length} deactivated
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <Link
            href="/dashboard/admin/users/create"
            style={{
              background: "#C8102E",
              color: "#fff",
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
              color: "#7A9CC4",
              border: "1px solid #1B4F8A",
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

      {/* Active users */}
      <div style={{ marginBottom: "32px" }}>
        <h2 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: "18px",
          letterSpacing: "1px",
          color: "#fff",
          textTransform: "uppercase",
          marginBottom: "12px",
        }}>
          Active ({active.length})
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {active.map((p) => {
            const auth = authMap.get(p.id);
            return (
              <div key={p.id} style={{
                background: "#0F2040",
                border: "1px solid #1B4F8A",
                borderRadius: "10px",
                padding: "18px",
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: "15px", color: "#fff", marginBottom: "3px" }}>
                      {p.display_name ?? p.company_name ?? "No name set"}
                    </div>
                    <div style={{ fontSize: "13px", color: "#7A9CC4", marginBottom: "3px" }}>
                      {auth?.email ?? "No email found"}
                    </div>
                    <div style={{ fontSize: "11px", color: "#3A5A7A", marginBottom: "3px" }}>
                      ID: {p.id}
                    </div>
                    <div style={{ display: "flex", gap: "16px", fontSize: "11px", color: "#3A5A7A" }}>
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
                      {/* View profile button */}
                      <Link
                        href={`/dashboard/admin/users/${p.id}`}
                        style={{
                          background: "transparent",
                          color: "#7A9CC4",
                          border: "1px solid #1B4F8A",
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
                                background: "#0A1628",
                                border: "1px solid #1B4F8A",
                                color: "#F0F4FF",
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
                              color: "#7A9CC4",
                              border: "1px solid #1B4F8A",
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
                            background: "#3D0A0A",
                            color: "#F87171",
                            border: "1px solid #991B1B",
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
                        <span style={{ fontSize: "12px", color: "#3A5A7A" }}>(you)</span>
                      )}

                      {p.id !== adminUser.id && p.role === "CLIENT" && (
                        <span style={{ fontSize: "12px", color: "#3A5A7A" }}>client</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Deactivated users */}
      {deactivated.length > 0 && (
        <div>
          <hr style={{ border: "none", borderTop: "1px solid #1B4F8A", margin: "0 0 20px" }} />
          <h2 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "18px",
            letterSpacing: "1px",
            color: "#7A9CC4",
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
                  background: "#0F2040",
                  border: "1px solid #3A5A7A",
                  borderRadius: "10px",
                  padding: "18px",
                  opacity: 0.7,
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "15px", color: "#7A9CC4", marginBottom: "3px" }}>
                        {p.display_name ?? p.company_name ?? "No name set"}
                      </div>
                      <div style={{ fontSize: "13px", color: "#3A5A7A" }}>
                        {auth?.email ?? "No email found"}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <Link
                        href={`/dashboard/admin/users/${p.id}`}
                        style={{
                          background: "transparent",
                          color: "#7A9CC4",
                          border: "1px solid #1B4F8A",
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
                          background: "#0D3320",
                          color: "#4ADE80",
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