import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";
import PricingTable from "./PricingTable";
import { setAllInspectorPercent } from "./actions";

export default async function AdminInspectorPricingPage() {
  await requireRole(["ADMIN"]);

  const { data: rows, error } = await supabaseAdmin
    .from("inspector_price_list")
    .select(
      "pricing_key, display_name, description, fee_cents, inspector_share_percent, is_active, sort_order, updated_at"
    )
    .order("sort_order", { ascending: true });

  if (error) throw new Error(`Failed to load price list: ${JSON.stringify(error)}`);

  const priceRows = rows ?? [];
  const activeCount = priceRows.filter((r) => r.is_active).length;
  const totalRevenue = priceRows
    .filter((r) => r.is_active)
    .reduce((sum, r) => sum + r.fee_cents, 0);

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "28px",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: "36px",
              letterSpacing: "1px",
              color: "#1E3A8A",
              margin: 0,
            }}
          >
            Inspector Pricing
          </h1>
          <p style={{ fontSize: "13px", color: "#1B4F8A", marginTop: "4px" }}>
            {activeCount} of {priceRows.length} tiers active · Edit fee, inspector share, or
            description inline · Toggle active/inactive to show or hide from clients
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
            whiteSpace: "nowrap",
          }}
        >
          ← Admin Home
        </Link>
      </div>

      {/* Summary cards */}
      <div
        className="mob-grid-1"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "12px",
          marginBottom: "28px",
        }}
      >
        {[
          {
            label: "Active Tiers",
            value: activeCount,
            sub: `${priceRows.length - activeCount} inactive`,
            accent: "#1B4F8A",
          },
          {
            label: "Lowest Fee",
            value: `$${Math.min(...priceRows.filter((r) => r.is_active).map((r) => r.fee_cents)) / 100}`,
            sub: "active tier",
            accent: "#1B4F8A",
          },
          {
            label: "Highest Fee",
            value: `$${Math.max(...priceRows.filter((r) => r.is_active).map((r) => r.fee_cents)) / 100}`,
            sub: "active tier",
            accent: "#1B4F8A",
          },
        ].map((card) => (
          <div
            key={card.label}
            style={{
              background: "#EEF4FF",
              border: "1px solid #B8D0E8",
              borderRadius: "10px",
              padding: "16px 20px",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                color: "#1B4F8A",
                textTransform: "uppercase",
                letterSpacing: "1px",
                marginBottom: "4px",
              }}
            >
              {card.label}
            </div>
            <div
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: "28px",
                color: "#1E3A8A",
              }}
            >
              {card.value}
            </div>
            <div style={{ fontSize: "11px", color: "#4A7FB5", marginTop: "2px" }}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Quick percentage adjust panel */}
      <div
        style={{
          background: "#F0FDF4",
          border: "1px solid #166534",
          borderRadius: "12px",
          padding: "20px 24px",
          marginBottom: "20px",
        }}
      >
        <div style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: "16px",
          letterSpacing: "1px",
          color: "#15803D",
          textTransform: "uppercase",
          marginBottom: "6px",
        }}>
          Set Inspector Earnings %
        </div>
        <p style={{ fontSize: "12px", color: "#166534", lineHeight: 1.5, marginBottom: "14px" }}>
          Enter a percentage and apply it to all pricing tiers at once. ONP keeps the remainder.
          Currently the default is <strong>{priceRows[0]?.inspector_share_percent ?? "—"}%</strong> inspector / <strong>{100 - (priceRows[0]?.inspector_share_percent ?? 0)}%</strong> ONP.
          Changes apply to new requests only — existing paid assignments are not affected.
        </p>
        <form action={setAllInspectorPercent} style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <input
              name="percent"
              type="number"
              min="1"
              max="99"
              defaultValue={priceRows[0]?.inspector_share_percent ?? 65}
              required
              style={{
                width: "70px",
                background: "#FFFFFF",
                border: "1px solid #166534",
                color: "#1E3A8A",
                borderRadius: "6px",
                padding: "9px 12px",
                fontFamily: "'Barlow', sans-serif",
                fontWeight: 700,
                fontSize: "16px",
                outline: "none",
                textAlign: "center",
              }}
            />
            <span style={{ fontSize: "16px", fontWeight: 700, color: "#15803D" }}>%</span>
            <span style={{ fontSize: "13px", color: "#166534", marginLeft: "4px" }}>to inspector</span>
          </div>
          <button
            type="submit"
            style={{
              background: "#15803D",
              color: "#fff",
              border: "none",
              padding: "10px 22px",
              borderRadius: "6px",
              fontFamily: "'Barlow', sans-serif",
              fontWeight: 600,
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            Apply to All Tiers
          </button>
        </form>
        <p style={{ fontSize: "11px", color: "#4A7FB5", marginTop: "10px" }}>
          To adjust a single tier individually, click the <strong>Edit</strong> button on that tier below.
        </p>
      </div>

      {/* Revenue split legend */}
      <div
        style={{
          background: "#FFFBEB",
          border: "1px solid #FCD34D",
          borderRadius: "8px",
          padding: "12px 16px",
          marginBottom: "20px",
          fontSize: "12px",
          color: "#92400E",
          lineHeight: 1.6,
        }}
      >
        <strong>Revenue split:</strong> "Insp. %" is the inspector&apos;s share of the fee. ONP
        keeps the remainder. To adjust a single tier, click <strong>Edit</strong> on that row.
        Changes take effect on the next client request — existing paid assignments are not affected.
      </div>

      {/* Pricing table */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #B8D0E8",
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        <PricingTable rows={priceRows} />
      </div>

      {/* Audit note */}
      <p
        style={{
          fontSize: "11px",
          color: "#9CA3AF",
          marginTop: "16px",
          lineHeight: 1.6,
        }}
      >
        All edits are recorded in the <code>admin_actions</code> audit log with before/after
        values.{" "}
        <strong style={{ color: "#6B7280" }}>
          Run the SQL below in Supabase to enable audit logging if you haven&apos;t already:
        </strong>
      </p>
      <pre
        style={{
          background: "#F9FAFB",
          border: "1px solid #E5E7EB",
          borderRadius: "6px",
          padding: "12px 16px",
          fontSize: "11px",
          color: "#374151",
          overflowX: "auto",
          marginTop: "8px",
          lineHeight: 1.6,
        }}
      >
        {`create table if not exists public.admin_actions (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references auth.users(id),
  action_type text not null,
  target_id text,
  details jsonb,
  created_at timestamptz not null default now()
);
alter table public.admin_actions enable row level security;
create policy "admins can read admin_actions"
  on public.admin_actions for select
  using (exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'ADMIN'
  ));`}
      </pre>
    </div>
  );
}
