import { requireRole } from "@/lib/auth/requireRole";
import { PROJECT_CATEGORIES } from "@/lib/projects/categories";
import { getEmergencyRequestStatus } from "@/lib/emergency/rateLimit";
import NewProjectForm from "./NewProjectForm";
import { joinWaitlist } from "@/lib/serviceArea/actions";
import { SERVICE_AREA_LABEL } from "@/lib/serviceArea/launchZips";
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
  searchParams: Promise<{ area_error?: string; zip?: string; waitlist?: string }>;
}) {
  const sp = await searchParams;
  const areaError = sp.area_error === "1";
  const blockedZip = sp.zip ?? "";
  const waitlistJoined = sp.waitlist === "joined";

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
          color: "#1E3A8A",
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

        {waitlistJoined ? (
          <div style={{
            background: "#F0FDF4",
            border: "1px solid #166534",
            borderRadius: "8px",
            padding: "14px 16px",
            fontSize: "13px",
            color: "#15803D",
            marginBottom: "20px",
          }}>
            ✅ You're on the waitlist — we'll notify you when ONP expands to your area.
          </div>
        ) : (
          <form
            action={async (formData: FormData) => {
              "use server";
              await joinWaitlist(formData);
            }}
            style={{
              background: "#EEF4FF",
              border: "1px solid #B8D0E8",
              borderRadius: "12px",
              padding: "20px",
              marginBottom: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <input type="hidden" name="source" value="PROJECT_POST_BLOCKED" />
            <input type="hidden" name="intended_role" value="CLIENT" />
            {blockedZip && <input type="hidden" name="zip" value={blockedZip} />}

            <div style={{ fontSize: "13px", fontWeight: 600, color: "#1E3A8A" }}>
              Join the Expansion Waitlist
            </div>

            {!blockedZip && (
              <input
                name="zip"
                required
                maxLength={10}
                placeholder="Project ZIP code"
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #B8D0E8",
                  color: "#1E3A8A",
                  borderRadius: "6px",
                  padding: "10px 14px",
                  fontFamily: "'Barlow', sans-serif",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
            )}

            <input
              name="email"
              type="email"
              required
              placeholder="your@email.com"
              style={{
                background: "#FFFFFF",
                border: "1px solid #B8D0E8",
                color: "#1E3A8A",
                borderRadius: "6px",
                padding: "10px 14px",
                fontFamily: "'Barlow', sans-serif",
                fontSize: "14px",
                outline: "none",
              }}
            />

            <button
              type="submit"
              style={{
                background: "#1E3A8A",
                color: "#fff",
                border: "none",
                padding: "11px",
                borderRadius: "6px",
                fontFamily: "'Barlow', sans-serif",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              Join Waitlist
            </button>
          </form>
        )}

        <Link
          href="/dashboard/client/projects"
          style={{
            display: "inline-block",
            background: "transparent",
            color: "#1B4F8A",
            border: "1px solid #B8D0E8",
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
