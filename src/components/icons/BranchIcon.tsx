type Track = "paw" | "cloven" | "horseshoe" | "talon" | "bearpaw" | "clover" | "text";

const SPEC: Record<
  string,
  { track: Track; bg: string; fg: string }
> = {
  marines: { track: "paw", bg: "#990000", fg: "#CCAC00" },
  navy: { track: "cloven", bg: "#00205B", fg: "#C5A059" },
  army: { track: "horseshoe", bg: "#000000", fg: "#D4AF37" },
  air_force: { track: "talon", bg: "#003087", fg: "#FFC72C" },
  coast_guard: { track: "bearpaw", bg: "#0C2340", fg: "#FFFFFF" },
  space_force: { track: "clover", bg: "#0B1117", fg: "#A6A9AA" },
  national_guard: { track: "text", bg: "#00205B", fg: "#FFC72C" },
};

const DEFAULT_SPEC = { track: "paw" as Track, bg: "#4B5054", fg: "#FF9E1B" };

function Track({ track }: { track: Track }) {
  switch (track) {
    case "paw":
      return (
        <g fill="currentColor">
          <ellipse cx="20" cy="27" rx="7.5" ry="6" />
          <circle cx="10.5" cy="17" r="3.4" />
          <circle cx="16.5" cy="12" r="3.6" />
          <circle cx="23.5" cy="12" r="3.6" />
          <circle cx="29.5" cy="17" r="3.4" />
        </g>
      );
    case "cloven":
      return (
        <g fill="currentColor">
          <path d="M18.5 11 C11 11.5 8 18 8.5 25 C9 31 13.5 33.5 17.5 30 C19.5 28.2 19.5 14.5 18.5 11 Z" />
          <path d="M21.5 11 C29 11.5 32 18 31.5 25 C31 31 26.5 33.5 22.5 30 C20.5 28.2 20.5 14.5 21.5 11 Z" />
        </g>
      );
    case "horseshoe":
      return (
        <path
          d="M 20 3 C 11 3 7 9 7 16 C 7 20 8 22 9 25 C 12 24 14 22 15 19 C 17 24 18 29 20 33 C 22 29 23 24 25 19 C 26 22 28 24 31 25 C 32 22 33 20 33 16 C 33 9 29 3 20 3 Z"
          fill="currentColor"
        />
      );
    case "talon":
      return (
        <g fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 27 L20 6" />
          <path d="M20 27 L9 11" />
          <path d="M20 27 L31 11" />
          <path d="M20 27 L20 35" />
          <path d="M20 6 L17.5 9.5 M20 6 L22.5 9.5" />
          <path d="M9 11 L7 13.7 M9 11 L11.7 12.3" />
          <path d="M31 11 L33 13.7 M31 11 L28.3 12.3" />
        </g>
      );
    case "bearpaw":
      return (
        <g fill="currentColor">
          <ellipse cx="20" cy="28" rx="9.5" ry="6" />
          <path d="M8 20 C7 18 7.5 15 9.5 14 C11 15.5 11 19 9.5 21 Z" />
          <path d="M14.5 15 C13.7 12.5 14.3 9.5 16.3 8.3 C17.8 10 17.7 13.7 16 15.8 Z" />
          <path d="M25.5 15 C26.3 12.5 25.7 9.5 23.7 8.3 C22.2 10 22.3 13.7 24 15.8 Z" />
          <path d="M32 20 C33 18 32.5 15 30.5 14 C29 15.5 29 19 30.5 21 Z" />
        </g>
      );
    case "clover":
      return (
        <g fill="currentColor" opacity="0.94">
          <ellipse cx="13.5" cy="26" rx="8.5" ry="7.5" />
          <ellipse cx="26.5" cy="26" rx="8.5" ry="7.5" />
          <ellipse cx="20" cy="15.5" rx="8" ry="7.5" />
        </g>
      );
    case "text":
      return (
        <text
          x="20"
          y="27"
          textAnchor="middle"
          fill="currentColor"
          fontFamily="'Barlow Condensed', sans-serif"
          fontWeight={800}
          fontSize="15"
          letterSpacing="0.5"
        >
          NG
        </text>
      );
  }
}

export function BranchIcon({
  branch,
  size = 40,
}: {
  branch: string | null | undefined;
  size?: number;
}) {
  const spec = (branch && SPEC[branch]) || DEFAULT_SPEC;
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" style={{ flexShrink: 0 }}>
      <polygon
        points="20,2 36,11 36,29 20,38 4,29 4,11"
        fill={spec.bg}
      />
      <g color={spec.fg}>
        <Track track={spec.track} />
      </g>
    </svg>
  );
}
