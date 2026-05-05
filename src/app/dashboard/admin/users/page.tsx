import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { changeUserRole } from "./actions";

type Profile = {
  id: string;
  role: string;
  display_name: string | null;
  company_name: string | null;
  created_at: string;
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
    .select("id, role, display_name, company_name, created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;

  const profiles = (data ?? []) as Profile[];

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
            {profiles.length} total users
          </p>
        </div>
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

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {profiles.length === 0 ? (
          <div style={{ background: "#0F2040", border: "1px solid #1B4F8A", borderRadius: "10px", padding: "32px", textAlign: "center", color: "#7A9CC4", fontSize: "14px" }}>
            No users found.
          </div>
        ) : (
          profiles.map((p) => (
            <div key={p.id} style={{
              background: "#0F2040",
              border: "1px solid #1B4F8A",
              borderRadius: "10px",
              padding: "18px",
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "15px", color: "#fff", marginBottom: "3px" }}>
                    {p.display_name ?? p.company_name ?? "No name set"}
                  </div>
                  <div style={{ fontSize: "11px", color: "#3A5A7A", marginBottom: "6px" }}>
                    {p.id}
                  </div>
                  <div style={{ fontSize: "12px", color: "#7A9CC4" }}>
                    Joined: {new Date(p.created_at).toLocaleDateString()}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
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

                  {p.id !== adminUser.id && (
                    <form action={async (formData: FormData) => {
                      "use server";
                      const newRole = formData.get("role") as string;
                      await changeUserRole(p.id, newRole);
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <select
                          name="role"
                          defaultValue={p.role}
                          style={{
                            background: "#0A1628",
                            border: "1px solid #1B4F8A",
                            color: "#F0F4FF",
                            borderRadius: "6px",
                            padding: "6px 10px",
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
                          padding: "6px 12px",
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

                  {p.id === adminUser.id && (
                    <span style={{ fontSize: "12px", color: "#3A5A7A" }}>(you)</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}