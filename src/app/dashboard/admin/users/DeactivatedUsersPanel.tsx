"use client";

import { useState } from "react";
import Link from "next/link";
import { reactivateUser } from "./actions";
import { deleteUserAccounts } from "./deleteAccounts";

type DeactivatedUser = {
  id: string;
  display_name: string | null;
  company_name: string | null;
  role: string;
  email: string | null;
};

function roleColor(role: string) {
  switch (role) {
    case "ADMIN": return { background: "#FEF2F2", color: "#991B1B", border: "1px solid #FCA5A5" };
    case "CLIENT": return { background: "var(--camo-concrete)", color: "var(--camo-gunmetal)", border: "1px solid #d9dbdb" };
    case "CONTRACTOR": return { background: "#F0FDF4", color: "#15803D", border: "1px solid #166534" };
    case "INSPECTOR": return { background: "#FFFBEB", color: "#92400E", border: "1px solid #FCD34D" };
    default: return { background: "var(--camo-concrete)", color: "var(--camo-gunmetal)", border: "1px solid #d9dbdb" };
  }
}

export default function DeactivatedUsersPanel({ users }: { users: DeactivatedUser[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleConfirm() {
    setSubmitting(true);
    setError(null);
    try {
      await deleteUserAccounts([...selected]);
      setSelected(new Set());
      setConfirming(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Deletion failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <hr style={{ border: "none", borderTop: "1px solid #d9dbdb", margin: "0 0 20px" }} />
      <div className="mob-col mob-gap-sm" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "12px" }}>
        <h2 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: "16px",
          letterSpacing: "1px",
          color: "#991B1B",
          textTransform: "uppercase",
          margin: 0,
        }}>
          Deactivated ({users.length})
        </h2>

        {selected.size > 0 && !confirming && (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            style={{ background: "#991B1B", color: "#fff", border: "none", padding: "7px 16px", borderRadius: "6px", fontFamily: "'Barlow', sans-serif", fontWeight: 600, fontSize: "12px", cursor: "pointer" }}
          >
            Delete Selected ({selected.size})
          </button>
        )}
      </div>

      {confirming && (
        <div style={{ background: "#FFFFFF", border: "1px solid #FCA5A5", borderRadius: "10px", padding: "16px", marginBottom: "16px" }}>
          <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: "8px", padding: "12px 14px", marginBottom: "12px", fontSize: "13px", color: "#991B1B", lineHeight: 1.6 }}>
            <strong>This cannot be undone.</strong> You&apos;re about to permanently delete {selected.size} user account{selected.size !== 1 ? "s" : ""} and all associated data — projects, bids, RFIs, credentials, everything tied to {selected.size !== 1 ? "these accounts" : "this account"}. Are you sure?
          </div>
          {error && (
            <div style={{ fontSize: "12px", color: "#991B1B", marginBottom: "12px" }}>{error}</div>
          )}
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              type="button"
              disabled={submitting}
              onClick={handleConfirm}
              style={{ background: "#991B1B", color: "#fff", border: "none", padding: "9px 20px", borderRadius: "6px", fontFamily: "'Barlow', sans-serif", fontWeight: 700, fontSize: "13px", cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1 }}
            >
              {submitting ? "Deleting…" : `Yes, Permanently Delete ${selected.size} Account${selected.size !== 1 ? "s" : ""}`}
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => { setConfirming(false); setError(null); }}
              style={{ background: "transparent", color: "var(--camo-gunmetal)", border: "1px solid #d9dbdb", padding: "9px 20px", borderRadius: "6px", fontFamily: "'Barlow', sans-serif", fontSize: "13px", cursor: "pointer" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {users.map((p) => (
          <div key={p.id} style={{
            background: "#FEF2F2",
            border: "1px solid #FCA5A5",
            borderRadius: "10px",
            padding: "18px",
            opacity: 0.8,
            display: "flex",
            alignItems: "flex-start",
            gap: "14px",
          }}>
            <input
              type="checkbox"
              checked={selected.has(p.id)}
              onChange={() => toggle(p.id)}
              style={{ marginTop: "3px", accentColor: "#991B1B", flexShrink: 0, width: "16px", height: "16px", cursor: "pointer" }}
            />
            <div className="mob-col mob-gap-sm" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flex: 1 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: "15px", color: "var(--camo-charcoal)", marginBottom: "3px" }}>
                  {p.display_name ?? p.company_name ?? "No name set"}
                </div>
                <div style={{ fontSize: "13px", color: "#991B1B", marginBottom: "2px" }}>
                  {p.email ?? "No email found"}
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
        ))}
      </div>
    </div>
  );
}
