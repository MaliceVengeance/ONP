import { requireRole } from "@/lib/auth/requireRole";
import { PROJECT_CATEGORIES } from "@/lib/projects/categories";
import { getEmergencyRequestStatus } from "@/lib/emergency/rateLimit";
import NewProjectForm from "./NewProjectForm";
import { SERVICE_AREA_LABEL } from "@/lib/serviceArea/launchZips";
import WaitlistForm from "@/components/WaitlistForm";
import Link from "next/link";

type RfiCatalogItem = { id: string; code: string; prompt: string };

const CLIENT_EXCLUDED_KEYWORDS = [
  "specific question not covered above",
  "additional photos of the area",
  "clarify the scope of work for a specific area",
];

export default async function NewDraftProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ area_error?: string; zip?: string }>;
}) {
  const sp = await searchParams;
  const areaError = sp.area_error === "1";
  const blockedZip = sp.zip ?? "";

  const { supabase, user } = await requireRole(["CLIENT", "ADMIN"]);
  const rateLimit = await getEmergencyRequestStatus(user.id);

  const { data: catalog } = await supabase
    .from("rfi_catalog")
    .select("id, code, prompt")
    .order("code");

  const rfiCatalog = ((catalog ?? []) as RfiCatalogItem[]).filter(
    (c) => !CLIENT_EXCLUDED_KEYWORDS.some((kw) =>
      c.prompt.toLowerCase().includes(kw.toLowerCase())
    )
  );

  // Show area error page instead of the form
  if (areaError) {
    return (
      <div style={{ maxWidth: "520px" }}>
        <h1 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: "36px",
          letterSpacing: "1px",
          color: "var(--camo-charcoal)",
          margin: "0 0 24px",
        }}>
          New Project
        </h1>

        <div style={{
          background: "#FFFBEB",
          border: "1px solid #FCD34D",
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "20px",
        }}>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "20px",
            color: "#92400E",
            marginBottom: "10px",
          }}>
            📍 We're not yet serving that area
          </div>
          <p style={{ fontSize: "13px", color: "#92400E", lineHeight: 1.6, marginBottom: "16px" }}>
            ONP currently operates in <strong>{SERVICE_AREA_LABEL}</strong> only.
            Your project ZIP ({blockedZip || "entered"}) is outside this area.
          </p>
          <p style={{ fontSize: "13px", color: "#92400E", lineHeight: 1.6 }}>
            If you'd like to be notified when ONP expands to your area, join the waitlist below.
          </p>
        </div>

        <div style={{
          background: "var(--camo-concrete)",
          border: "1px solid #d9dbdb",
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}>
          <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--camo-charcoal)" }}>
            Join the Expansion Waitlist
          </div>
          <WaitlistForm
            source="PROJECT_POST_BLOCKED"
            intendedRole="CLIENT"
            defaultZip={blockedZip || undefined}
            lockZip={!!blockedZip}
            theme="amber"
          />
        </div>

        <Link
          href="/dashboard/client/projects"
          style={{
            display: "inline-block",
            background: "transparent",
            color: "var(--camo-gunmetal)",
            border: "1px solid #d9dbdb",
            padding: "10px 20px",
            borderRadius: "6px",
            fontFamily: "'Barlow', sans-serif",
            fontSize: "13px",
            textDecoration: "none",
          }}
        >
          ← Back to Projects
        </Link>
      </div>
    );
  }

  return (
    <NewProjectForm
      categories={[...PROJECT_CATEGORIES]}
      rateLimit={rateLimit}
      rfiCatalog={rfiCatalog}
    />
  );
}
