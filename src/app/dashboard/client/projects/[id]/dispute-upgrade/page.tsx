import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/requireRole";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { submitDispute } from "./actions";
import DisputeForm from "./DisputeForm";

export default async function DisputeUpgradePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user, role } = await requireRole(["CLIENT", "ADMIN"]);
  const { id: projectId } = await params;

  // Fetch project + ownership check
  const { data: project } = await supabaseAdmin
    .from("projects")
    .select("id, title, client_id")
    .eq("id", projectId)
    .single();

  if (!project || (role !== "ADMIN" && (project as any).client_id !== user.id)) {
    redirect("/dashboard/client/projects");
  }

  // Fetch the paid-upgrade assignment
  const { data: assignment } = await supabaseAdmin
    .from("project_inspector_assignments")
    .select(
      "id, upgrade_payment_status, upgrade_fee_cents, upgrade_charged_at, upgrade_justification, upgrade_requested_at"
    )
    .eq("project_id", projectId)
    .eq("payment_status", "PAID")
    .eq("upgrade_payment_status", "PAID")
    .maybeSingle();

  // No paid upgrade — nothing to dispute
  if (!assignment) {
    redirect(`/dashboard/client/projects/${projectId}/inspector`);
  }

  const upgradeChargedAt = (assignment as any).upgrade_charged_at as string | null;
  if (!upgradeChargedAt) {
    redirect(`/dashboard/client/projects/${projectId}/inspector`);
  }

  const windowExpiresAt = new Date(
    new Date(upgradeChargedAt).getTime() + 14 * 24 * 60 * 60 * 1000
  );
  const now = new Date();
  const windowExpired = now > windowExpiresAt;
  const msRemaining = windowExpiresAt.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));

  // Check for existing active dispute
  const { data: existingDispute } = await supabaseAdmin
    .from("inspector_upgrade_disputes")
    .select("id, status, created_at")
    .eq("inspector_request_id", (assignment as any).id)
    .maybeSingle();

  const hasActiveDispute =
    existingDispute && (existingDispute as any).status !== "WITHDRAWN";

  const upgradeFeeCents = (assignment as any).upgrade_fee_cents as number ?? 20000;

  function fmt(cents: number) {
    return `$${(cents / 100).toFixed(0)}`;
  }

  // ── Already disputed ───────────────────────────────────────────────────────
  if (hasActiveDispute) {
    return (
      <div style={{ maxWidth: "560px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "36px", letterSpacing: "1px", color: "#0A1628", margin: 0 }}>
            Dispute Filed
          </h1>
          <Link href={`/dashboard/client/projects/${projectId}/inspector`} style={{ background: "transparent", color: "#1B4F8A", border: "1px solid #B8D0E8", padding: "8px 16px", borderRadius: "6px", fontFamily: "'Barlow', sans-serif", fontSize: "13px", textDecoration: "none" }}>
            ← Back
          </Link>
        </div>
        <div style={{ background: "#EEF4FF", border: "1px solid #B8D0E8", borderRadius: "12px", padding: "24px" }}>
          <div style={{ fontWeight: 700, fontSize: "15px", color: "#0A1628", marginBottom: "6px" }}>
            ✅ Your dispute has already been submitted.
          </div>
          <p style={{ fontSize: "13px", color: "#1B4F8A", marginBottom: "8px" }}>
            Status:{" "}
            <strong>{((existingDispute as any).status as string).replaceAll("_", " ")}</strong>
          </p>
          <p style={{ fontSize: "13px", color: "#1B4F8A", margin: 0 }}>
            Filed:{" "}
            {new Date((existingDispute as any).created_at).toLocaleDateString()}
          </p>
        </div>
      </div>
    );
  }

  // ── Window expired ─────────────────────────────────────────────────────────
  if (windowExpired) {
    return (
      <div style={{ maxWidth: "560px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "36px", letterSpacing: "1px", color: "#0A1628", margin: 0 }}>
            Review Window Closed
          </h1>
          <Link href={`/dashboard/client/projects/${projectId}/inspector`} style={{ background: "transparent", color: "#1B4F8A", border: "1px solid #B8D0E8", padding: "8px 16px", borderRadius: "6px", fontFamily: "'Barlow', sans-serif", fontSize: "13px", textDecoration: "none" }}>
            ← Back
          </Link>
        </div>
        <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: "12px", padding: "24px" }}>
          <p style={{ fontSize: "14px", color: "#991B1B", margin: 0, lineHeight: 1.6 }}>
            The 14-day dispute window for this upgrade closed on{" "}
            <strong>{windowExpiresAt.toLocaleDateString()}</strong>. The{" "}
            {fmt(upgradeFeeCents)} upgrade charge is now final. Please contact{" "}
            <a href="mailto:support@ournextproject.us" style={{ color: "#C8102E" }}>
              support@ournextproject.us
            </a>{" "}
            if you have a concern.
          </p>
        </div>
      </div>
    );
  }

  // ── Dispute form ───────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: "620px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "36px", letterSpacing: "1px", color: "#0A1628", margin: 0 }}>
            Dispute Upgrade
          </h1>
          <p style={{ fontSize: "13px", color: "#1B4F8A", marginTop: "4px" }}>
            {(project as any).title ?? "Untitled"}
          </p>
        </div>
        <Link href={`/dashboard/client/projects/${projectId}/inspector`} style={{ background: "transparent", color: "#1B4F8A", border: "1px solid #B8D0E8", padding: "8px 16px", borderRadius: "6px", fontFamily: "'Barlow', sans-serif", fontSize: "13px", textDecoration: "none" }}>
          ← Back
        </Link>
      </div>

      {/* What this is */}
      <div style={{ background: "#EEF4FF", border: "1px solid #B8D0E8", borderRadius: "12px", padding: "20px", marginBottom: "24px" }}>
        <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "16px", letterSpacing: "1px", color: "#0A1628", textTransform: "uppercase", marginBottom: "10px" }}>
          Free Independent Review
        </h2>
        <p style={{ fontSize: "13px", color: "#1B4F8A", lineHeight: 1.7, marginBottom: "10px" }}>
          You were charged an additional{" "}
          <strong style={{ color: "#0A1628" }}>{fmt(upgradeFeeCents)}</strong> when your inspector
          upgraded to a Comprehensive Inspection on-site. If you believe that upgrade was not
          justified, an independent <strong style={{ color: "#0A1628" }}>Master Inspector</strong>{" "}
          will review the case at no cost to you.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "5px", fontSize: "13px", color: "#15803D" }}>
          <div>✅ Free — no charge to dispute</div>
          <div>✅ Independent reviewer — not your original inspector</div>
          <div>✅ Written decision with explanation</div>
          <div>✅ Full refund possible if upgrade was not justified</div>
        </div>
      </div>

      {/* Inspector justification recap */}
      {(assignment as any).upgrade_justification && (
        <div style={{ background: "#2D1B00", border: "1px solid #FBBF24", borderRadius: "10px", padding: "16px 20px", marginBottom: "24px" }}>
          <div style={{ fontSize: "12px", color: "#FBBF24", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>
            Inspector's Stated Reason for Upgrade
          </div>
          <p style={{ fontSize: "13px", color: "#FDE68A", fontStyle: "italic", lineHeight: 1.6, margin: 0 }}>
            &ldquo;{(assignment as any).upgrade_justification}&rdquo;
          </p>
        </div>
      )}

      {/* The form */}
      <div style={{ background: "#FFFFFF", border: "1px solid #B8D0E8", borderRadius: "12px", padding: "24px" }}>
        <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "18px", letterSpacing: "1px", color: "#0A1628", textTransform: "uppercase", marginBottom: "20px" }}>
          Your Dispute Statement
        </h2>
        <DisputeForm
          formAction={submitDispute.bind(null, projectId)}
          upgradeFeeCents={upgradeFeeCents}
          daysRemaining={daysRemaining}
        />
      </div>
    </div>
  );
}
