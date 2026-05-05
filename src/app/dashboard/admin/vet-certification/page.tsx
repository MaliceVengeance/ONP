import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { approveVetCert, rejectVetCert } from "./actions";

type VetApplication = {
  contractor_id: string;
  business_name: string | null;
  city: string | null;
  state: string | null;
  veteran_applied_at: string | null;
  veteran_verified: boolean;
};

export default async function VetCertificationPage() {
  const { supabase } = await requireRole(["ADMIN"]);

  const { data, error } = await supabase
    .from("contractor_profiles")
    .select("contractor_id, business_name, city, state, veteran_applied_at, veteran_verified")
    .not("veteran_applied_at", "is", null)
    .order("veteran_applied_at", { ascending: true });

  if (error) throw error;

  const applications = (data ?? []) as VetApplication[];
  const pending = applications.filter((a) => !a.veteran_verified);
  const approved = applications.filter((a) => a.veteran_verified);

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
            Vet Certification
          </h1>
          <p style={{ fontSize: "13px", color: "#7A9CC4", marginTop: "4px" }}>
            Review veteran-owned contractor applications
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

      {/* Pending */}
      <div style={{ marginBottom: "32px" }}>
        <h2 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: "18px",
          letterSpacing: "1px",
          color: pending.length > 0 ? "#FBBF24" : "#fff",
          textTransform: "uppercase",
          marginBottom: "12px",
        }}>
          Pending Review ({pending.length})
        </h2>

        {pending.length === 0 ? (
          <div style={{ background: "#0F2040", border: "1px solid #1B4F8A", borderRadius: "10px", padding: "24px", textAlign: "center", color: "#7A9CC4", fontSize: "14px" }}>
            No pending applications.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {pending.map((a) => (
              <div key={a.contractor_id} style={{
                background: "#0F2040",
                border: "1px solid #92400E",
                borderRadius: "10px",
                padding: "18px",
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "15px", color: "#fff", marginBottom: "3px" }}>
                      {a.business_name ?? "No business name set"}
                    </div>
                    <div style={{ fontSize: "12px", color: "#7A9CC4", marginBottom: "3px" }}>
                      {[a.city, a.state].filter(Boolean).join(", ") || "No location set"}
                    </div>
                    <div style={{ fontSize: "11px", color: "#3A5A7A" }}>
                      Applied: {a.veteran_applied_at ? new Date(a.veteran_applied_at).toLocaleDateString() : "—"}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                    <form action={approveVetCert.bind(null, a.contractor_id)}>
                      <button style={{
                        background: "#0D3320",
                        color: "#4ADE80",
                        border: "1px solid #166534",
                        padding: "8px 16px",
                        borderRadius: "6px",
                        fontFamily: "'Barlow', sans-serif",
                        fontWeight: 600,
                        fontSize: "13px",
                        cursor: "pointer",
                      }}>
                        Approve
                      </button>
                    </form>
                    <form action={rejectVetCert.bind(null, a.contractor_id)}>
                      <button style={{
                        background: "#3D0A0A",
                        color: "#F87171",
                        border: "1px solid #991B1B",
                        padding: "8px 16px",
                        borderRadius: "6px",
                        fontFamily: "'Barlow', sans-serif",
                        fontWeight: 600,
                        fontSize: "13px",
                        cursor: "pointer",
                      }}>
                        Reject
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Approved */}
      <hr style={{ border: "none", borderTop: "1px solid #1B4F8A", margin: "0 0 20px" }} />
      <div>
        <h2 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: "18px",
          letterSpacing: "1px",
          color: "#fff",
          textTransform: "uppercase",
          marginBottom: "12px",
        }}>
          Approved ({approved.length})
        </h2>

        {approved.length === 0 ? (
          <div style={{ background: "#0F2040", border: "1px solid #1B4F8A", borderRadius: "10px", padding: "24px", textAlign: "center", color: "#7A9CC4", fontSize: "14px" }}>
            No approved applications yet.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {approved.map((a) => (
              <div key={a.contractor_id} style={{
                background: "#0F2040",
                border: "1px solid #1B4F8A",
                borderRadius: "10px",
                padding: "18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "15px", color: "#fff", marginBottom: "3px" }}>
                    {a.business_name ?? "No business name set"}
                  </div>
                  <div style={{ fontSize: "12px", color: "#7A9CC4" }}>
                    {[a.city, a.state].filter(Boolean).join(", ") || "No location set"}
                  </div>
                </div>
                <span style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  padding: "4px 10px",
                  borderRadius: "20px",
                  background: "#1e1a00",
                  color: "#FBBF24",
                  border: "1px solid #92400E",
                }}>
                  ★ Verified
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}