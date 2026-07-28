type BranchMark = "star" | "anchor" | "globe" | "wing" | "delta" | "ring" | "shield";

const MARKS: Record<string, BranchMark> = {
  army: "star",
  navy: "anchor",
  marines: "globe",
  air_force: "wing",
  space_force: "delta",
  coast_guard: "ring",
  national_guard: "shield",
};

function Mark({ mark }: { mark: BranchMark }) {
  switch (mark) {
    case "star":
      return <path d="M20 12 L23.4 20.2 L32 20.2 L24.9 25.5 L27.5 33.8 L20 28.5 L12.5 33.8 L15.1 25.5 L8 20.2 L16.6 20.2 Z" />;
    case "anchor":
      return (
        <g fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          <circle cx="20" cy="12" r="3.2" fill="none" />
          <line x1="20" y1="15.2" x2="20" y2="31" />
          <line x1="13" y1="19" x2="27" y2="19" />
          <path d="M9 22 C9 29 14 33 20 33.5" />
          <path d="M31 22 C31 29 26 33 20 33.5" />
        </g>
      );
    case "globe":
      return (
        <g fill="none" stroke="currentColor" strokeWidth="2.2">
          <circle cx="20" cy="23" r="11" />
          <ellipse cx="20" cy="23" rx="4.5" ry="11" />
          <line x1="9" y1="23" x2="31" y2="23" />
        </g>
      );
    case "wing":
      return (
        <g fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 26 C13 26 17 21 20 14 C23 21 27 26 34 26" />
          <path d="M6 32 C13 32 17 28 20 22 C23 28 27 32 34 32" />
        </g>
      );
    case "delta":
      return <path d="M20 11 L32 33 L8 33 Z" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />;
    case "ring":
      return <circle cx="20" cy="23" r="9" fill="none" stroke="currentColor" strokeWidth="4" />;
    case "shield":
      return <path d="M20 10 L31 14 V24 C31 30 26 33.5 20 36 C14 33.5 9 30 9 24 V14 Z" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />;
  }
}

export function BranchIcon({
  branch,
  size = 40,
}: {
  branch: string | null | undefined;
  size?: number;
}) {
  const mark = (branch && MARKS[branch]) || "star";
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" style={{ flexShrink: 0 }}>
      <polygon
        points="20,2 36,11 36,29 20,38 4,29 4,11"
        fill="none"
        stroke="#202326"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <g color="#FF9E1B" fill="#FF9E1B">
        <Mark mark={mark} />
      </g>
    </svg>
  );
}
