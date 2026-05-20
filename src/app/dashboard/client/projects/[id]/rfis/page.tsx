import Link from "next/link";
import { requireRole } from "@/lib/auth/requireRole";
import { respondToRfi } from "./actions";

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

export default async function ClientRfiPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { supabase } = await requireRole(["CLIENT", "ADMIN"]);
  const { id: projectId } = await params;
  const sp = await searchParams;

  const { data: project } = await supabase
    .from("projects")
    .select("id, title, category, state")
    .eq("id", projectId)
    .single();

  const { data: rfis, error } = await supabase
    .from("rfis")
    .select("id, catalog_id, question, response, responded_at, status, created_at, rfi_catalog(code, prompt)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  const rfiRows = (rfis ?? []) as unknown as RfiRow[];
  const unanswered = rfiRows.filter((r) => !r.response);
  const answered = rfiRows.filter((r) => r.response);

  const inputStyle = {
    width: "100%",
    background: "#FFFFFF",
    border: "1px solid #B8D0E8",
    color: "#0A1628",
    borderRadius: "6px",
    padding: "10px 14px",
    fontFamily: "'Barlow', sans-serif",
    fontSize: "14px",
    outline: "none",
    marginTop: "8px",
    minHeight: "90px",
    resize: "vertical" as const,
  };

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
            color: "#0A1628",
            margin: 0,
          }}>
            Questions (RFIs)
          </h1>
          <p style={{ fontSize: "13px", color: "#1B4F8A", marginTop: "4px" }}>
            {project?.title ?? "Untitled"} — {project?.category ?? "—"}
          </p>
          <p style={{ fontSize: "11px", color: "#4A7FB5", marginTop: "2px" }}>
            Your responses are visible to all bidding contractors.
          </p>
        </div>
        <Link
          href={`/dashboard/client/projects/${projectId}`}
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
      {sp.saved === "1" && (
        <div style={{
          background: "#F0FDF4",
          border: "1px solid #166534",
          color: "#15803D",
          padding: "12px 16px",
          borderRadius: "8px",
          fontSize: "13px",
          marginBottom: "20px",
        }}>
          ✅ Response saved and visible to all contractors.
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          background: "#FEF2F2",
          border: "1px solid #FCA5A5",
          color: "#991B1B",
          padding: "12px 16px",
          borderRadius: "8px",
          fontSize: "13px",
          marginBottom: "20px",
        }}>
          ❌ Failed to load questions.
        </div>
      )}

      {/* No RFIs */}
      {rfiRows.length === 0 && !error && (
        <div style={{
          background: "#EEF4FF",
          border: "1px solid #B8D0E8",
          borderRadius: "10px",
          padding: "32px",
          textAlign: "center",
          color: "#1B4F8A",
          fontSize: "14px",
        }}>
          No questions have been submitted yet. Check back once contractors start reviewing your project.
        </div>
      )}

      {/* Unanswered */}
      {unanswered.length > 0 && (
        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
            <h2 style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: "20px",
              letterSpacing: "1px",
              color: "#92400E",
              textTransform: "uppercase",
              margin: 0,
            }}>
              Needs Response
            </h2>
            <span style={{
              fontSize: "12px",
              fontWeight: 700,
              padding: "3px 10px",
              borderRadius: "20px",
              background: "#FFFBEB",
              color: "#92400E",
              border: "1px solid #FCD34D",
            }}>
              {unanswered.length}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {unanswered.map((r, idx) => (
              <div key={r.id} style={{
                background: "#FFFFFF",
                border: "1px solid #FCD34D",
                borderRadius: "12px",
                overflow: "hidden",
              }}>
                {/* Question header */}
                <div style={{
                  background: "#FFFBEB",
                  padding: "12px 16px",
                  borderBottom: "1px solid #FCD34D",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}>
                  <span style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "20px",
                    background: "#FCD34D",
                    color: "#92400E",
                  }}>
                    Q{idx + 1}
                  </span>
                  <span style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 700,
                    fontSize: "15px",
                    color: "#92400E",
                    letterSpacing: "0.5px",
                  }}>
                    {r.rfi_catalog?.prompt ?? "Question"}
                  </span>
                </div>

                <div style={{ padding: "16px" }}>
                  {/* Contractor's additional notes */}
                  {r.question && (
                    <div style={{
                      background: "#EEF4FF",
                      border: "1px solid #B8D0E8",
                      borderRadius: "6px",
                      padding: "10px 14px",
                      fontSize: "13px",
                      color: "#0A1628",
                      marginBottom: "14px",
                      lineHeight: 1.6,
                    }}>
                      <div style={{
                        fontSize: "10px",
                        color: "#1B4F8A",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                        marginBottom: "4px",
                      }}>
                        Contractor notes
                      </div>
                      {r.question}
                    </div>
                  )}

                  {/* Response form */}
                  <form action={respondToRfi.bind(null, projectId, r.id)}>
                    <label style={{
                      display: "block",
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "#1B4F8A",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      marginBottom: "4px",
                    }}>
                      Your Response
                    </label>
                    <textarea
                      name="response"
                      style={inputStyle}
                      placeholder="Type your response here… This will be visible to all contractors bidding on this project."
                      required
                    />
                    <button
                      type="submit"
                      style={{
                        marginTop: "10px",
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
                      Post Response
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Answered */}
      {answered.length > 0 && (
        <div>
          {unanswered.length > 0 && (
            <hr style={{ border: "none", borderTop: "1px solid #B8D0E8", margin: "0 0 24px" }} />
          )}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
            <h2 style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: "20px",
              letterSpacing: "1px",
              color: "#15803D",
              textTransform: "uppercase",
              margin: 0,
            }}>
              Answered
            </h2>
            <span style={{
              fontSize: "12px",
              fontWeight: 700,
              padding: "3px 10px",
              borderRadius: "20px",
              background: "#F0FDF4",
              color: "#15803D",
              border: "1px solid #166534",
            }}>
              {answered.length}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {answered.map((r, idx) => (
              <div key={r.id} style={{
                background: "#FFFFFF",
                border: "1px solid #166534",
                borderRadius: "12px",
                overflow: "hidden",
              }}>
                {/* Question header */}
                <div style={{
                  background: "#F0FDF4",
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
                    color: "#FFFFFF",
                  }}>
                    Q{unanswered.length + idx + 1}
                  </span>
                  <span style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 700,
                    fontSize: "15px",
                    color: "#15803D",
                    letterSpacing: "0.5px",
                  }}>
                    {r.rfi_catalog?.prompt ?? "Question"}
                  </span>
                  <span style={{
                    marginLeft: "auto",
                    fontSize: "11px",
                    color: "#15803D",
                  }}>
                    ✅ Answered
                  </span>
                </div>

                <div style={{ padding: "16px" }}>
                  {/* Contractor notes */}
                  {r.question && (
                    <div style={{
                      background: "#EEF4FF",
                      border: "1px solid #B8D0E8",
                      borderRadius: "6px",
                      padding: "10px 14px",
                      fontSize: "13px",
                      color: "#0A1628",
                      marginBottom: "12px",
                      lineHeight: 1.6,
                    }}>
                      <div style={{
                        fontSize: "10px",
                        color: "#1B4F8A",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                        marginBottom: "4px",
                      }}>
                        Contractor notes
                      </div>
                      {r.question}
                    </div>
                  )}

                  {/* Response */}
                  <div style={{
                    background: "#F0FDF4",
                    border: "1px solid #166534",
                    borderRadius: "6px",
                    padding: "10px 14px",
                    fontSize: "13px",
                    color: "#0A1628",
                    lineHeight: 1.6,
                  }}>
                    <div style={{
                      fontSize: "10px",
                      color: "#15803D",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      marginBottom: "4px",
                    }}>
                      Your response
                    </div>
                    {r.response}
                  </div>

                  {r.responded_at && (
                    <div style={{ fontSize: "11px", color: "#4A7FB5", marginTop: "8px" }}>
                      Responded: {new Date(r.responded_at).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
