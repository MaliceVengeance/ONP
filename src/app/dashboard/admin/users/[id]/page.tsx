import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { stateBadge } from "@/lib/ui";

export default async function AdminUserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { supabase } = await requireRole(["ADMIN"]);
  const { id: userId } = await params;

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, display_name, company_name, created_at, deactivated, phone, address_line1, address_line2, address_city, address_state, address_zip")
    .eq("id", userId)
    .single();

  // Fetch auth data
  const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);

  // Fetch contractor profile if applicable
  const { data: contractorProfile } = await supabase
    .from("contractor_profiles")
    .select("business_name, city, state, categories, description, is_listed, veteran_verified, veteran_verified_at, military_branch")
    .eq("contractor_id", userId)
    .maybeSingle();

  // Fetch projects if client
  const { data: projects } = await supabase
    .from("projects")
    .select("id, title, state, created_at")
    .eq("client_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);

  // Fetch bids if contractor
  const { data: bids } = await supabase
    .from("bids")
    .select("id, project_id, status, created_at")
    .eq("contractor_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);

  if (!profile) {
    return (
      <div style={{ maxWidth: "700px" }}>
        <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "32px", color: "#fff" }}>
          User Not Found
        </h1>
        <Link href="/dashboard/admin/users" style={{ color: "#7A9CC4", textDecoration: "underline", fontSize: "13px", display: "block", marginTop: "16px" }}>
          ← Back to Users
        </Link>
      </div>
    );
  }

  function roleColor(role: string) {
    switch (role) {
      case "ADMIN": return { background: "#3D0A0A", color: "#F87171", border: "1px solid #991B1B" };
      case "CLIENT": return { background: "#0D2040", color: "#60A5FA", border: "1px solid #1D4ED8" };
      case "CONTRACTOR": return { background: "#0D3320", color: "#4ADE80", border: "1px solid #166534" };
      case "INSPECTOR": return { background: "#2D2000", color: "#FBBF24", border: "1px solid #92400E" };
      default: return { background: "#0F2040", color: "#7A9CC4", border: "1px solid #1B4F8A" };
    }
  }

  return (
    <div style={{ maxWidth: "700px" }}>
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
            {profile.display_name ?? profile.company_name ?? "No Name"}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "8px" }}>
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
                background: "#3D0A0A",
                color: "#F87171",
                border: "1px solid #991B1B",
              }}>
                DEACTIVATED
              </span>
            )}
          </div>
        </div>
        <Link
          href="/dashboard/admin/users"
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

      {/* Account info */}
      <div style={{
        background: "#0F2040",
        border: "1px solid #1B4F8A",
        borderRadius: "12px",
        padding: "20px",
        marginBottom: "16px",
      }}>
        <h2 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: "16px",
          letterSpacing: "1px",
          color: "#fff",
          textTransform: "uppercase",
          marginBottom: "14px",
        }}>
          Account Information
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          {[
            { label: "Email", value: authUser?.user?.email ?? "—" },
            { label: "User ID", value: profile.id },
            { label: "Joined", value: new Date(profile.created_at).toLocaleDateString() },
            { label: "Last Login", value: authUser?.user?.last_sign_in_at ? new Date(authUser.user.last_sign_in_at).toLocaleDateString() : "Never" },
          ].map((item) => (
            <div key={item.label}>
              <div style={{ fontSize: "11px", color: "#7A9CC4", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "3px" }}>
                {item.label}
              </div>
              <div style={{ fontSize: "13px", color: "#F0F4FF", wordBreak: "break-all" }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact info — clients */}
      {profile.role === "CLIENT" && (profile.phone || profile.address_line1) && (
        <div style={{
          background: "#0F2040",
          border: "1px solid #1B4F8A",
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "16px",
        }}>
          <h2 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "16px",
            letterSpacing: "1px",
            color: "#fff",
            textTransform: "uppercase",
            marginBottom: "14px",
          }}>
            Contact Information
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px", color: "#F0F4FF" }}>
            {profile.phone && (
              <div>
                <span style={{ color: "#7A9CC4" }}>Phone: </span>{profile.phone}
              </div>
            )}
            {profile.address_line1 && (
              <div>
                <span style={{ color: "#7A9CC4" }}>Address: </span>
                {profile.address_line1}
                {profile.address_line2 && `, ${profile.address_line2}`}
                {profile.address_city && `, ${profile.address_city}`}
                {profile.address_state && `, ${profile.address_state}`}
                {profile.address_zip && ` ${profile.address_zip}`}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contractor profile */}
      {profile.role === "CONTRACTOR" && contractorProfile && (
        <div style={{
          background: "#0F2040",
          border: "1px solid #1B4F8A",
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "16px",
        }}>
          <h2 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "16px",
            letterSpacing: "1px",
            color: "#fff",
            textTransform: "uppercase",
            marginBottom: "14px",
          }}>
            Contractor Profile
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px" }}>
            <div>
              <span style={{ color: "#7A9CC4" }}>Business: </span>
              <span style={{ color: "#F0F4FF" }}>{contractorProfile.business_name ?? "—"}</span>
            </div>
            <div>
              <span style={{ color: "#7A9CC4" }}>Location: </span>
              <span style={{ color: "#F0F4FF" }}>
                {[contractorProfile.city, contractorProfile.state].filter(Boolean).join(", ") || "—"}
              </span>
            </div>
            <div>
              <span style={{ color: "#7A9CC4" }}>Listed: </span>
              <span style={{ color: "#F0F4FF" }}>{contractorProfile.is_listed ? "Yes" : "No"}</span>
            </div>
            {contractorProfile.veteran_verified && (
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12px",
                fontWeight: 600,
                padding: "4px 12px",
                borderRadius: "20px",
                background: "#1e1a00",
                color: "#FBBF24",
                border: "1px solid #92400E",
                marginTop: "4px",
                width: "fit-content",
              }}>
                ★ Veteran Owned — Verified
                {contractorProfile.veteran_verified_at && (
                  <span style={{ fontWeight: 400, color: "#92400E" }}>
                    ({new Date(contractorProfile.veteran_verified_at).toLocaleDateString()})
                  </span>
                )}
              </div>
            )}
            {contractorProfile.description && (
              <div style={{ marginTop: "8px" }}>
                <div style={{ color: "#7A9CC4", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Description</div>
                <div style={{ color: "#F0F4FF", lineHeight: 1.6 }}>{contractorProfile.description}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Client projects */}
      {profile.role === "CLIENT" && (projects ?? []).length > 0 && (
        <div style={{
          background: "#0F2040",
          border: "1px solid #1B4F8A",
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "16px",
        }}>
          <h2 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "16px",
            letterSpacing: "1px",
            color: "#fff",
            textTransform: "uppercase",
            marginBottom: "14px",
          }}>
            Recent Projects ({projects?.length})
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {projects?.map((p) => (
              <div key={p.id} style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 0",
                borderBottom: "1px solid #1B4F8A",
              }}>
                <div>
                  <div style={{ fontSize: "14px", color: "#fff", fontWeight: 500 }}>{p.title ?? "Untitled"}</div>
                  <div style={{ fontSize: "11px", color: "#3A5A7A" }}>{new Date(p.created_at).toLocaleDateString()}</div>
                </div>
                <span style={stateBadge(p.state)}>{p.state}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contractor bids */}
      {profile.role === "CONTRACTOR" && (bids ?? []).length > 0 && (
        <div style={{
          background: "#0F2040",
          border: "1px solid #1B4F8A",
          borderRadius: "12px",
          padding: "20px",
        }}>
          <h2 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "16px",
            letterSpacing: "1px",
            color: "#fff",
            textTransform: "uppercase",
            marginBottom: "14px",
          }}>
            Recent Bids ({bids?.length})
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {bids?.map((b) => (
              <div key={b.id} style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 0",
                borderBottom: "1px solid #1B4F8A",
              }}>
                <div style={{ fontSize: "11px", color: "#3A5A7A" }}>
                  {new Date(b.created_at).toLocaleDateString()}
                </div>
                <span style={stateBadge(b.status ?? "DRAFT")}>{b.status ?? "—"}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}