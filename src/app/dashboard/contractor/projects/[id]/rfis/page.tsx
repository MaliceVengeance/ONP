import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { submitRfi } from "./actions";

type RfiCatalogItem = {
  id: string;
  code: string;
  prompt: string;
};

type RfiRow = {
  id: string;
  catalog_id: string;
  question: string | null;
  response: string | null;
  responded_at: string | null;
  status: string;
  created_at: string;
  rfi_catalog: { code: string; prompt: string } | null;
};

export default async function ContractorRfiPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ submitted?: string }>;
}) {
  const { supabase } = await requireRole(["CONTRACTOR", "ADMIN"]);
  const { id: projectId } = await params;
  const sp = await searchParams;

  const { data: rows } = await supabase.rpc("get_open_project_detail", {
    p_project_id: projectId,
  });
  const project = (rows as any[])?.[0];

  if (!project) {
    return (
      <div style={{ maxWidth: "680px" }}>
        <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "32px", color: "#fff" }}>
          Project Not Found
        </h1>
        <Link href="/dashboard/contractor/projects" style={{ color: "#7A9CC4", textDecoration: "underline", fontSize: "13px", display: "block", marginTop: "16px" }}>
          ← Back to Projects
        </Link>
      </div>
    );
  }

  const { data: catalog } = await supabase
    .from("rfi_catalog")
    .select("id, code, prompt")
    .order("code");

  const catalogItems = (catalog ?? []) as RfiCatalogItem[];

  const { data: rfis, error: rfisErr } = await supabase
    .from("rfis")
    .select("id, catalog_id, question, response, responded_at, status, created_at, rfi_catalog(code, prompt)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  const rfiRows = (rfis ?? []) as unknown as RfiRow[];
  const askedCatalogIds = rfiRows.map((r) => r.catalog_id);
  const availableCatalog = catalogItems.filter((c) => !askedCatalogIds.includes(c.id));
  const canSubmit = project.state === "OPEN";

  const answered = rfiRows.filter((r) => r.response);
  const unanswered = rfiRows.filter((r) => !r.response);

  const inputStyle = {
    width: "100%",
    background: "#0A1628",
    border: "1px solid #1B4F8A",
    color: "#F0F4FF",
    borderRadius: "6px",
    padding: "10px 14px",
    fontFamily: "'Barlow', sans-serif",
    fontSize: "14px",
    outline: "none",
    marginTop: "6px",
  } as React.CSSProperties;

  return (
    <div style={{ maxWidth: "680px" }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "12px",
        marginBottom: "24px",
      }}>
        <div>
          <h1 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "32px",
            letterSpacing: "1px",
            color: "#fff",
            margin: 0,
          }}>
            Questions (RFIs)
          </h1>
          <p style={{ fontSize: "13px", color: "#7A9CC4", marginTop: "4px" }}>
            {project.title ?? "Untitled"} — {project.category ?? "—"}
          </p>
          <p style={{ fontSize: "11px", color: "#3A5A7A", marginTop: "2px" }}>
            All questions and answers are visible to every contractor on this project.
          </p>
        </div>
        <Link
          href={`/dashboard/contractor/projects/${projectId}`}
          style={{
            background: "#C8102E",
            color: "#fff",
            border: "none",
            padding: "10px 18px",
            borderRadius: "6px",
            fontFamily: "'Barlow', sans-serif",
            fontWeight: 600,
            fontSize: "13px",
            textDecoration: "none",
            flexShrink: 0,
            display: "inline-block",
          }}
        >
          ← Back
        </Link>
      </div>

      {/* Success banner */}
      {sp.submitted === "1" && (
        <div style={{
          background: "#0D3320",
          border: "1px solid #166534",
          color: "#4ADE80",
          padding: "12px 16px",
          borderRadius: "8px",
          fontSize: "13px",
          marginBottom: "20px",
        }}>
          ✅ Question submitted successfully.
        </div>
      )}

      {/* Error */}
      {rfisErr && (
        <div style={{
          background: "#3D0A0A",
          border: "1px solid #991B1B",
          color: "#F87171",
          padding: "12px 16px",
          borderRadius: "8px",
          fontSize: "13px",
          marginBottom: "20px",
        }}>
          ❌ Failed to load questions.
        </div>
      )}

      {/* Platform rules */}
      <div style={{
        background: "#0A1628",
        border: "1px solid #1B4F8A",
        borderRadius: "10px",
        padding: "14px 16px",
        marginBottom: "20px",
      }}>
        <div style={{
          fontSize: "11px",
          fontWeight: 600,
          color: "#7A9CC4",
          textTransform: "uppercase",
          letterSpacing: "1px",
          marginBottom: "8px",
        }}>
          Platform Rules
        </div>
        <div style={{ fontSize: "13px", color: "#4ADE80", marginBottom: "4px" }}>
          ✅ The contractor is responsible for pulling all required permits.
        </div>
        <div style={{ fontSize: "13px", color: "#4ADE80" }}>
          ✅ The contractor is responsible for all debris removal and disposal.
        </div>
      </div>

      {/* Submit new RFI */}
      {canSubmit && (
        <div style={{
          background: "#0F2040",
          border: "1px solid #1B4F8A",
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "24px",
        }}>
          <h2 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "18px",
            letterSpacing: "1px",
            color: "#fff",
            textTransform: "uppercase",
            marginBottom: "4px",
          }}>
            Ask a Question
          </h2>
          <p style={{ fontSize: "12px", color: "#7A9CC4", marginBottom: "16px" }}>
            Select a question type. Answers are visible to all bidding contractors.
          </p>

          {availableCatalog.length === 0 ? (
            <div style={{ fontSize: "13px", color: "#7A9CC4", textAlign: "center", padding: "16px 0" }}>
              All available question types have already been asked on this project.
            </div>
          ) : (
            <form action={submitRfi.bind(null, projectId)}>
              <label style={{
                display: "block",
                fontSize: "11px",
                fontWeight: 600,
                color: "#7A9CC4",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}>
                Question Type
              </label>
              <select
                name="catalog_id"
                style={inputStyle}
                required
              >
                <option value="">Select a question type…</option>
                {availableCatalog.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.prompt}
                  </option>
                ))}
              </select>

              <label style={{
                display: "block",
                fontSize: "11px",
                fontWeight: 600,
                color: "#7A9CC4",
                textTransform: "uppercase",
                letterSpacing: "1px",
                marginTop: "14px",
              }}>
                Additional Details (optional)
              </label>
              <textarea
                name="question"
                style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
                placeholder="Add any specific details about your question…"
              />

              <button
                type="submit"
                style={{
                  marginTop: "12px",
                  background: "#C8102E",
                  color: "#fff",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "6px",
                  fontFamily: "'Barlow', sans-serif",
                  fontWeight: 600,
                  fontSize: "13px",
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                Submit Question
              </button>
            </form>
          )}
        </div>
      )}

      {!canSubmit && (
        <div style={{
          background: "#0F2040",
          border: "1px solid #1B4F8A",
          borderRadius: "10px",
          padding: "16px",
          marginBottom: "20px",
          fontSize: "13px",
          color: "#7A9CC4",
          textAlign: "center",
        }}>
          Questions can only be submitted while the project is open for bidding.
        </div>
      )}

      {/* Questions & Answers */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
          <h2 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "20px",
            letterSpacing: "1px",
            color: "#fff",
            textTransform: "uppercase",
            margin: 0,
          }}>
            Questions & Answers
          </h2>
          <span style={{
            fontSize: "12px",
            fontWeight: 700,
            padding: "3px 10px",
            borderRadius: "20px",
            background: "#0A1628",
            color: "#7A9CC4",
            border: "1px solid #1B4F8A",
          }}>
            {rfiRows.length}
          </span>
        </div>

        {rfiRows.length === 0 ? (
          <div style={{
            background: "#0F2040",
            border: "1px solid #1B4F8A",
            borderRadius: "10px",
            padding: "32px",
            textAlign: "center",
            color: "#7A9CC4",
            fontSize: "14px",
          }}>
            No questions have been asked yet.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {/* Unanswered first */}
            {unanswered.map((r, idx) => (
              <div key={r.id} style={{
                background: "#0F2040",
                border: "1px solid #92400E",
                borderRadius: "12px",
                overflow: "hidden",
              }}>
                <div style={{
                  background: "#2D2000",
                  padding: "12px 16px",
                  borderBottom: "1px solid #92400E",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}>
                  <span style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "20px",
                    background: "#92400E",
                    color: "#FBBF24",
                  }}>
                    Q{idx + 1}
                  </span>
                  <span style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 700,
                    fontSize: "15px",
                    color: "#FBBF24",
                    flex: 1,
                  }}>
                    {r.rfi_catalog?.prompt ?? "Question"}
                  </span>
                  <span style={{ fontSize: "11px", color: "#FBBF24" }}>
                    ⏳ Pending
                  </span>
                </div>
                <div style={{ padding: "14px 16px" }}>
                  {r.question && (
                    <div style={{
                      background: "#0A1628",
                      border: "1px solid #1B4F8A",
                      borderRadius: "6px",
                      padding: "10px 14px",
                      fontSize: "13px",
                      color: "#B0C4DE",
                      lineHeight: 1.6,
                    }}>
                      <div style={{ fontSize: "10px", color: "#7A9CC4", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>
                        Your notes
                      </div>
                      {r.question}
                    </div>
                  )}
                  <div style={{ fontSize: "12px", color: "#FBBF24", marginTop: r.question ? "10px" : "0" }}>
                    ⏳ Awaiting client response
                  </div>
                </div>
              </div>
            ))}

            {/* Answered */}
            {answered.map((r, idx) => (
              <div key={r.id} style={{
                background: "#0F2040",
                border: "1px solid #166534",
                borderRadius: "12px",
                overflow: "hidden",
              }}>
                <div style={{
                  background: "#0D3320",
                  padding: "12px 16px",
                  borderBottom: "1px solid #166534",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}>
                  <span style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "20px",
                    background: "#166534",
                    color: "#4ADE80",
                  }}>
                    Q{unanswered.length + idx + 1}
                  </span>
                  <span style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 700,
                    fontSize: "15px",
                    color: "#4ADE80",
                    flex: 1,
                  }}>
                    {r.rfi_catalog?.prompt ?? "Question"}
                  </span>
                  <span style={{ fontSize: "11px", color: "#4ADE80" }}>
                    ✅ Answered
                  </span>
                </div>
                <div style={{ padding: "14px 16px" }}>
                  {r.question && (
                    <div style={{
                      background: "#0A1628",
                      border: "1px solid #1B4F8A",
                      borderRadius: "6px",
                      padding: "10px 14px",
                      fontSize: "13px",
                      color: "#B0C4DE",
                      marginBottom: "10px",
                      lineHeight: 1.6,
                    }}>
                      <div style={{ fontSize: "10px", color: "#7A9CC4", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>
                        Your notes
                      </div>
                      {r.question}
                    </div>
                  )}
                  <div style={{
                    background: "#0A1628",
                    border: "1px solid #166534",
                    borderRadius: "6px",
                    padding: "10px 14px",
                    fontSize: "13px",
                    color: "#F0F4FF",
                    lineHeight: 1.6,
                  }}>
                    <div style={{ fontSize: "10px", color: "#4ADE80", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>
                      Client response
                    </div>
                    {r.response}
                  </div>
                  {r.responded_at && (
                    <div style={{ fontSize: "11px", color: "#3A5A7A", marginTop: "8px" }}>
                      Answered: {new Date(r.responded_at).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}