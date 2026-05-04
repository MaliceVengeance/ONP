export const ui = {
  card: {
    background: "#0F2040",
    border: "1px solid #1B4F8A",
    borderRadius: "10px",
    padding: "18px",
    marginBottom: "10px",
  } as React.CSSProperties,

  cardHover: {
    borderColor: "#C8102E",
  } as React.CSSProperties,

  btnPrimary: {
    background: "#C8102E",
    color: "#fff",
    border: "none",
    padding: "10px 20px",
    borderRadius: "6px",
    fontFamily: "'Barlow', sans-serif",
    fontWeight: 600,
    fontSize: "13px",
    cursor: "pointer",
    letterSpacing: "0.5px",
    textDecoration: "none",
    display: "inline-block",
  } as React.CSSProperties,

  btnSecondary: {
    background: "transparent",
    color: "#7A9CC4",
    border: "1px solid #1B4F8A",
    padding: "10px 20px",
    borderRadius: "6px",
    fontFamily: "'Barlow', sans-serif",
    fontWeight: 500,
    fontSize: "13px",
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-block",
  } as React.CSSProperties,

  pageTitle: {
    fontFamily: "'Barlow Condensed', sans-serif",
    fontWeight: 700,
    fontSize: "32px",
    letterSpacing: "1px",
    color: "#fff",
  } as React.CSSProperties,

  sectionTitle: {
    fontFamily: "'Barlow Condensed', sans-serif",
    fontWeight: 700,
    fontSize: "18px",
    letterSpacing: "1px",
    color: "#fff",
    textTransform: "uppercase" as const,
    marginBottom: "12px",
  } as React.CSSProperties,

  muted: {
    fontSize: "13px",
    color: "#7A9CC4",
  } as React.CSSProperties,

  statCard: {
    background: "#0F2040",
    border: "1px solid #1B4F8A",
    borderRadius: "10px",
    padding: "16px",
    textAlign: "center" as const,
  } as React.CSSProperties,

  statNum: {
    fontFamily: "'Barlow Condensed', sans-serif",
    fontWeight: 700,
    fontSize: "32px",
    color: "#fff",
  } as React.CSSProperties,

  statLabel: {
    fontSize: "11px",
    color: "#7A9CC4",
    textTransform: "uppercase" as const,
    letterSpacing: "1px",
    marginTop: "2px",
  } as React.CSSProperties,

  divider: {
    border: "none",
    borderTop: "1px solid #1B4F8A",
    margin: "20px 0",
  } as React.CSSProperties,

  input: {
    background: "#0A1628",
    border: "1px solid #1B4F8A",
    color: "#F0F4FF",
    borderRadius: "6px",
    padding: "8px 12px",
    fontFamily: "'Barlow', sans-serif",
    fontSize: "14px",
    width: "100%",
    outline: "none",
  } as React.CSSProperties,
};

export function badge(type: "open" | "draft" | "awarded" | "closed" | "vet" | "canceled" | "completed") {
  const base: React.CSSProperties = {
    fontSize: "11px",
    fontWeight: 600,
    padding: "4px 10px",
    borderRadius: "20px",
    letterSpacing: "0.5px",
    display: "inline-block",
  };
  switch (type) {
    case "open": return { ...base, background: "#0D3320", color: "#4ADE80", border: "1px solid #166534" };
    case "draft": return { ...base, background: "#1A2540", color: "#7A9CC4", border: "1px solid #1B4F8A" };
    case "awarded": return { ...base, background: "#2D1B69", color: "#A78BFA", border: "1px solid #5B21B6" };
    case "closed": return { ...base, background: "#2D1A00", color: "#FBBF24", border: "1px solid #92400E" };
    case "vet": return { ...base, background: "#1e1a00", color: "#FBBF24", border: "1px solid #92400E" };
    case "canceled": return { ...base, background: "#3D0A0A", color: "#F87171", border: "1px solid #991B1B" };
    case "completed": return { ...base, background: "#0D2D1A", color: "#34D399", border: "1px solid #065F46" };
    default: return { ...base, background: "#1A2540", color: "#7A9CC4", border: "1px solid #1B4F8A" };
  }
}

export function stateBadge(state: string) {
  switch (state) {
    case "OPEN": return badge("open");
    case "DRAFT": return badge("draft");
    case "AWARDED": return badge("awarded");
    case "BIDDING_CLOSED": return badge("closed");
    case "BIDS_UNLOCKED": return badge("closed");
    case "CANCELED": return badge("canceled");
    case "COMPLETED": return badge("completed");
    default: return badge("draft");
  }
}