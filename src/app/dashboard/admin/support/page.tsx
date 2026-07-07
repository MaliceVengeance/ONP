import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";

type SupportRequest = {
  id: string;
  subject: string | null;
  description: string | null;
  type: string | null;
  status: string;
  created_at: string;
  created_by: string | null;
  project_id: string | null;
};

function statusStyle(status: string) {
  switch (status) {
    case "OPEN": return { background: "#FEF2F2", color: "#991B1B", border: "1px solid #FCA5A5" };
    case "ASSIGNED": return { background: "#FFFBEB", color: "#92400E", border: "1px solid #FCD34D" };
    case "WAITING_ON_USER": return { background: "#EEF4FF", color: "#1B4F8A", border: "1px solid #B8D0E8" };
    case "CLOSED": return { background: "#EEF4FF", color: "#4A7FB5", border: "1px solid #B8D0E8" };
    default: return { background: "#EEF4FF", color: "#1B4F8A", border: "1px solid #B8D0E8" };
  }
}

export default async function AdminSupportPage() {
  const { supabase } = await requireRole(["ADMIN"]);

  const { data, error } = await supabase
    .from("support_requests")
    .select("id, subject, description, type, status, created_at, created_by, project_id")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;

  const requests = (data ?? []) as SupportRequest[];
  const open = requests.filter((r) => r.status === "OPEN");
  const others = requests.filter((r) => r.status !== "OPEN");

  return (
    <div>
      {/* Header */}
      <div className="mob-col mob-gap-sm" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
        <div>
          <h1 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "36px",
            letterSpacing: "1px",
            color: "#1E3A8A",
            margin: 0,
          }}>
            Support Requests
          </h1>
          <p style={{ fontSize: "13px", color: "#1B4F8A", marginTop: "4px" }}>
            {open.length} open ticket{open.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/dashboard/admin"
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
          Back
        </Link>
      </div>

      {/* Open tickets */}
      <div style={{ marginBottom: "32px" }}>
        <h2 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: "18px",
          letterSpacing: "1px",
          color: open.length > 0 ? "#991B1B" : "#1E3A8A",
          textTransform: "uppercase",
          marginBottom: "12px",
        }}>
          Open ({open.length})
        </h2>

        {open.length === 0 ? (
          <div style={{ background: "#EEF4FF", border: "1px solid #B8D0E8", borderRadius: "10px", padding: "24px", textAlign: "center", color: "#1B4F8A", fontSize: "14px" }}>
            No open requests.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {open.map((r) => <SupportCard key={r.id} r={r} />)}
          </div>
        )}
      </div>

      {/* Other tickets */}
      {others.length > 0 && (
        <div>
          <hr style={{ border: "none", borderTop: "1px solid #B8D0E8", margin: "0 0 20px" }} />
          <h2 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "18px",
            letterSpacing: "1px",
            color: "#1B4F8A",
            textTransform: "uppercase",
            marginBottom: "12px",
          }}>
            Other ({others.length})
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {others.map((r) => <SupportCard key={r.id} r={r} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function SupportCard({ r }: { r: SupportRequest }) {
  return (
    <div style={{
      background: "#EEF4FF",
      border: "1px solid #B8D0E8",
      borderRadius: "10px",
      padding: "18px",
    }}>
      <div className="mob-col mob-gap-sm" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: "15px", color: "#1E3A8A", marginBottom: "3px" }}>
            {r.subject ?? "No subject"}
          </div>
          {r.type && (
            <div style={{ fontSize: "11px", color: "#1B4F8A", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>
              {r.type}
            </div>
          )}
          {r.description && (
            <div style={{
              fontSize: "13px",
              color: "#4A7FB5",
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              marginBottom: "8px",
            }}>
              {r.description}
            </div>
          )}
          <div style={{ fontSize: "11px", color: "#4A7FB5" }}>
            Submitted: {new Date(r.created_at).toLocaleString()}
          </div>
        </div>
        <span style={{
          fontSize: "11px",
          fontWeight: 600,
          padding: "4px 10px",
          borderRadius: "20px",
          letterSpacing: "0.5px",
          flexShrink: 0,
          ...statusStyle(r.status),
        }}>
          {r.status}
        </span>
      </div>
    </div>
  );
}
