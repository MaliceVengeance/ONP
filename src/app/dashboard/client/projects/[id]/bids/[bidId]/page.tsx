import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";

type LineItem = {
  id: string;
  description: string;
  quantity: number | string;
  unit_price_cents: number | string;
  tax_pct: number | string;
  sort_order: number;
};

type ContractorInfo = {
  contractor_id: string;
  business_name: string | null;
  city: string | null;
  state: string | null;
  directory_verified: boolean | null;
  veteran_verified: boolean | null;
  license_number: string | null;
  license_expiry: string | null;
  coi_provider: string | null;
  coi_expiry: string | null;
  coi_amount: number | null;
  has_no_license: boolean | null;
  has_no_insurance: boolean | null;
};

function centsToMoney(cents: number | string | null | undefined) {
  const n = Number(cents ?? 0);
  if (!Number.isFinite(n)) return "—";
  return `$${(n / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString();
}

function isExpired(dateStr: string | null | undefined) {
  if (!dateStr) return false;
  return new Date(dateStr).getTime() < Date.now();
}

const card: React.CSSProperties = {
  background: "#EEF4FF",
  border: "1px solid #B8D0E8",
  borderRadius: "10px",
  padding: "20px",
  marginBottom: "16px",
};

const sectionLabel: React.CSSProperties = {
  fontFamily: "'Barlow Condensed', sans-serif",
  fontWeight: 700,
  fontSize: "13px",
  letterSpacing: "1px",
  color: "#1B4F8A",
  textTransform: "uppercase",
  marginBottom: "10px",
};

export default async function BidDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; bidId: string }>;
  searchParams: Promise<{ index?: string }>;
}) {
  const { supabase } = await requireRole(["CLIENT", "ADMIN"]);
  const { id: projectId, bidId } = await params;
  const sp = await searchParams;

  const { data: project, error: pErr } = await supabase
    .from("projects")
    .select("id,title,state,deadline_at,emergency_bid_mode,is_emergency")
    .eq("id", projectId)
    .single();

  if (pErr || !project) {
    return (
      <div style={{ maxWidth: "700px" }}>
        <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", color: "#991B1B", padding: "14px", borderRadius: "8px", fontSize: "13px" }}>
          Failed to load project.
        </div>
      </div>
    );
  }

  const deadline = project.deadline_at ? new Date(project.deadline_at) : null;
  const deadlinePassed = !!(deadline && deadline.getTime() <= Date.now());
  const unlocked =
    deadlinePassed ||
    project.state !== "OPEN" ||
    !!(project as any).emergency_bid_mode ||
    !!(project as any).is_emergency;

  const backLink = (
    <Link href={`/dashboard/client/projects/${projectId}/bids`} style={{ background: "transparent", color: "#1B4F8A", border: "1px solid #B8D0E8", padding: "8px 16px", borderRadius: "6px", fontFamily: "'Barlow', sans-serif", fontSize: "13px", textDecoration: "none" }}>
      ← Back to all bids
    </Link>
  );

  if (!unlocked) {
    return (
      <div style={{ maxWidth: "700px" }}>
        {backLink}
        <div style={{ ...card, marginTop: "20px", textAlign: "center", color: "#1B4F8A" }}>
          🔒 Bids are sealed until the deadline passes.
        </div>
      </div>
    );
  }

  const { data: bidRow } = await supabaseAdmin
    .from("bids")
    .select("id, project_id, contractor_id")
    .eq("id", bidId)
    .maybeSingle();

  if (!bidRow || bidRow.project_id !== projectId) {
    return (
      <div style={{ maxWidth: "700px" }}>
        {backLink}
        <div style={{ ...card, marginTop: "20px", textAlign: "center", color: "#1B4F8A" }}>
          Bid not found.
        </div>
      </div>
    );
  }

  const { data: version } = await supabaseAdmin
    .from("bid_versions")
    .select("id, amount_cents, notes, version_number, created_at, warranty_terms, deposit_terms, scope_disclaimers, estimate_valid_until, quote_pdf_path, quote_pdf_filename")
    .eq("bid_id", bidId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: lineItemsRaw } = version
    ? await supabaseAdmin
        .from("bid_line_items")
        .select("id, description, quantity, unit_price_cents, tax_pct, sort_order")
        .eq("bid_version_id", version.id)
        .order("sort_order", { ascending: true })
    : { data: [] as LineItem[] };
  const lineItems = (lineItemsRaw ?? []) as LineItem[];

  const { data: contractor } = await supabaseAdmin
    .from("contractor_profiles")
    .select("contractor_id, business_name, city, state, directory_verified, veteran_verified, license_number, license_expiry, coi_provider, coi_expiry, coi_amount, has_no_license, has_no_insurance")
    .eq("contractor_id", bidRow.contractor_id)
    .maybeSingle();
  const contractorInfo = contractor as ContractorInfo | null;

  const { data: awardRows } = await supabaseAdmin
    .from("project_awards")
    .select("bid_id, awarded_at")
    .eq("project_id", projectId)
    .limit(1);
  const award = awardRows?.[0];
  const isAwarded = award?.bid_id === bidId;

  // Subtotal/tax/total from itemized line items when present; falls back to the flat bid amount.
  let subtotalCents = 0;
  let taxCents = 0;
  lineItems.forEach((li) => {
    const lineSubtotal = Number(li.quantity) * Number(li.unit_price_cents);
    subtotalCents += lineSubtotal;
    taxCents += lineSubtotal * (Number(li.tax_pct) / 100);
  });
  const hasLineItems = lineItems.length > 0;
  const totalCents = hasLineItems ? subtotalCents + taxCents : Number(version?.amount_cents ?? 0);

  const licenseExpired = isExpired(contractorInfo?.license_expiry ?? null);
  const coiExpired = isExpired(contractorInfo?.coi_expiry ?? null);
  const displayIndex = sp.index ? `#${sp.index}` : null;

  return (
    <div style={{ maxWidth: "760px" }}>
      <div className="mob-col mob-gap-sm" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "20px" }}>
        <div>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "32px", color: "#1E3A8A", margin: 0 }}>
            Bid Detail {displayIndex}
          </h1>
          <div style={{ fontSize: "13px", color: "#1B4F8A", marginTop: "4px" }}>{project.title ?? "Untitled project"}</div>
        </div>
        {backLink}
      </div>

      {isAwarded && (
        <div style={{ background: "#F0FDF4", border: "1px solid #166534", color: "#15803D", padding: "12px 16px", borderRadius: "8px", fontSize: "13px", marginBottom: "16px", fontWeight: 600 }}>
          ★ This is the awarded bid — contractor identity is revealed below.
        </div>
      )}

      {/* Contractor identity — sealed until this bid is awarded, matching the sealed-bid promise site-wide */}
      <div style={card}>
        <div style={sectionLabel}>Contractor</div>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "22px", color: "#1E3A8A", marginBottom: "4px" }}>
          {isAwarded ? (contractorInfo?.business_name ?? "Unnamed business") : "Sealed until awarded"}
        </div>
        {isAwarded && (
          <div style={{ fontSize: "13px", color: "#1B4F8A", marginBottom: "10px" }}>
            {[contractorInfo?.city, contractorInfo?.state].filter(Boolean).join(", ") || "Location not listed"}
          </div>
        )}

        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px", marginBottom: "12px" }}>
          {contractorInfo?.directory_verified ? (
            <span style={{ fontSize: "11px", fontWeight: 600, padding: "4px 10px", borderRadius: "20px", background: "#F0FDF4", color: "#15803D", border: "1px solid #166534" }}>
              ✅ ONP Verified
            </span>
          ) : (
            <span style={{ fontSize: "11px", fontWeight: 600, padding: "4px 10px", borderRadius: "20px", background: "#FFFBEB", color: "#92400E", border: "1px solid #FCD34D" }}>
              ⏳ Verification Pending
            </span>
          )}
          {contractorInfo?.veteran_verified && (
            <span style={{ fontSize: "11px", fontWeight: 600, padding: "4px 10px", borderRadius: "20px", background: "#FFF7ED", color: "#B45309", border: "1px solid #D97706" }}>
              ★ Veteran Owned
            </span>
          )}
          {contractorInfo?.has_no_license && (
            <span style={{ fontSize: "11px", fontWeight: 600, padding: "4px 10px", borderRadius: "20px", background: "#FEF2F2", color: "#991B1B", border: "1px solid #FCA5A5" }}>
              ⚠ No License
            </span>
          )}
          {contractorInfo?.has_no_insurance && (
            <span style={{ fontSize: "11px", fontWeight: 600, padding: "4px 10px", borderRadius: "20px", background: "#FEF2F2", color: "#991B1B", border: "1px solid #FCA5A5" }}>
              ⚠ No Insurance
            </span>
          )}
        </div>

        <div className="mob-grid-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "12px" }}>
          <div>
            <div style={{ color: "#1B4F8A", marginBottom: "2px" }}>License Expires</div>
            <div style={{ color: licenseExpired ? "#991B1B" : "#1E3A8A" }}>
              {formatDate(contractorInfo?.license_expiry)}{licenseExpired && " ⚠ Expired"}
            </div>
          </div>
          <div>
            <div style={{ color: "#1B4F8A", marginBottom: "2px" }}>COI Expires</div>
            <div style={{ color: coiExpired ? "#991B1B" : "#1E3A8A" }}>
              {formatDate(contractorInfo?.coi_expiry)}{coiExpired && " ⚠ Expired"}
            </div>
          </div>
        </div>
      </div>

      {/* Itemized line items */}
      <div style={card}>
        <div style={sectionLabel}>{hasLineItems ? "Itemized Quote" : "Bid Amount"}</div>
        {hasLineItems ? (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
              <div className="mob-hide" style={{ display: "grid", gridTemplateColumns: "3fr 1fr 1fr 1fr 1fr", gap: "8px", fontSize: "11px", color: "#4A7FB5", textTransform: "uppercase", letterSpacing: "0.5px", padding: "0 0 8px", borderBottom: "1px solid #B8D0E8" }}>
                <div>Description</div>
                <div>Qty</div>
                <div>Unit Price</div>
                <div>Tax</div>
                <div>Line Total</div>
              </div>
              {lineItems.map((li) => {
                const lineSubtotal = Number(li.quantity) * Number(li.unit_price_cents);
                const lineTotal = lineSubtotal * (1 + Number(li.tax_pct) / 100);
                return (
                  <div key={li.id} className="mob-card-stack" style={{ display: "grid", gridTemplateColumns: "3fr 1fr 1fr 1fr 1fr", gap: "8px", fontSize: "13px", color: "#1E3A8A", padding: "10px 0", borderBottom: "1px solid #EEF4FF" }}>
                    <div>{li.description}</div>
                    <div>{Number(li.quantity)}</div>
                    <div>{centsToMoney(li.unit_price_cents)}</div>
                    <div>{Number(li.tax_pct)}%</div>
                    <div style={{ fontWeight: 600 }}>{centsToMoney(lineTotal)}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px solid #B8D0E8", display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-end" }}>
              <div style={{ fontSize: "13px", color: "#1B4F8A" }}>Subtotal: {centsToMoney(subtotalCents)}</div>
              <div style={{ fontSize: "13px", color: "#1B4F8A" }}>Tax: {centsToMoney(taxCents)}</div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "24px", color: "#1E3A8A" }}>
                Total: {centsToMoney(totalCents)}
              </div>
            </div>
          </>
        ) : (
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "32px", color: "#1E3A8A" }}>
            {centsToMoney(totalCents)}
          </div>
        )}
        {version?.notes && (
          <div style={{ background: "#FFFFFF", border: "1px solid #B8D0E8", borderRadius: "6px", padding: "12px", marginTop: "14px", fontSize: "13px", color: "#1B4F8A" }}>
            <span style={{ fontWeight: 600 }}>Notes: </span>{version.notes}
          </div>
        )}
      </div>

      {/* Warranty */}
      <div style={card}>
        <div style={sectionLabel}>Warranty Terms</div>
        <p style={{ fontSize: "13px", color: "#1E3A8A", lineHeight: 1.7, margin: 0 }}>
          {version?.warranty_terms || "Not specified by contractor."}
        </p>
      </div>

      {/* Payment / deposit */}
      <div style={card}>
        <div style={sectionLabel}>Payment / Deposit Terms</div>
        <p style={{ fontSize: "13px", color: "#1E3A8A", lineHeight: 1.7, margin: 0 }}>
          {version?.deposit_terms || "Not specified by contractor."}
        </p>
      </div>

      {/* Scope disclaimers + validity */}
      <div style={card}>
        <div style={sectionLabel}>Scope Disclaimers &amp; Estimate Validity</div>
        <p style={{ fontSize: "13px", color: "#1E3A8A", lineHeight: 1.7, marginBottom: "10px" }}>
          {version?.scope_disclaimers || "Not specified by contractor."}
        </p>
        <div style={{ fontSize: "12px", color: "#1B4F8A", marginBottom: "12px" }}>
          Estimate valid until: <strong>{formatDate(version?.estimate_valid_until)}</strong>
        </div>
        <div style={{ background: "#FFFBEB", border: "1px solid #FCD34D", borderRadius: "8px", padding: "12px 14px", fontSize: "12px", color: "#92400E", lineHeight: 1.6 }}>
          If additional scope is discovered once work begins, this is exactly the situation our{" "}
          <strong>Master Inspector dispute process</strong> exists to handle.{" "}
          <Link href="/trust" target="_blank" style={{ color: "#92400E", fontWeight: 600 }}>
            How disputes work →
          </Link>
        </div>
      </div>

      {/* Official quote PDF */}
      {version?.quote_pdf_path && (
        <div style={card}>
          <div style={sectionLabel}>Official Quote Document</div>
          <p style={{ fontSize: "12px", color: "#1B4F8A", marginBottom: "12px", lineHeight: 1.6 }}>
            The contractor&apos;s original letterhead quote — this is the authoritative document if a dispute ever arises about what was promised.
          </p>
          <a
            href={`/api/bids/${bidId}/quote-pdf`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "inline-block", background: "#C8102E", color: "#fff", padding: "10px 20px", borderRadius: "6px", textDecoration: "none", fontSize: "13px", fontWeight: 600 }}
          >
            📄 Download {version.quote_pdf_filename ?? "Quote PDF"}
          </a>
        </div>
      )}
    </div>
  );
}
