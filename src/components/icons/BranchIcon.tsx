import Image from "next/image";

const BRANCH_IMAGE: Record<string, { src: string; alt: string }> = {
  marines: { src: "/images/branches/marine_corps.png", alt: "U.S. Marine Corps" },
  navy: { src: "/images/branches/navy.png", alt: "U.S. Navy" },
  army: { src: "/images/branches/army.png", alt: "U.S. Army" },
  air_force: { src: "/images/branches/air_force.png", alt: "U.S. Air Force" },
  coast_guard: { src: "/images/branches/coast_guard.png", alt: "U.S. Coast Guard" },
  space_force: { src: "/images/branches/space_force.png", alt: "U.S. Space Force" },
  national_guard: { src: "/images/branches/national_guard.png", alt: "National Guard" },
};

const DEFAULT_IMAGE = { src: "/images/branches/army.png", alt: "Veteran" };

// Source crop is 414-415px wide by 386px tall (hexagon only, "Veteran" label
// text cropped off since the app renders that separately as real text).
const ASPECT = 386 / 415;

export function BranchIcon({
  branch,
  size = 40,
}: {
  branch: string | null | undefined;
  size?: number;
}) {
  const img = (branch && BRANCH_IMAGE[branch]) || DEFAULT_IMAGE;
  return (
    <Image
      src={img.src}
      alt={img.alt}
      width={size}
      height={Math.round(size * ASPECT)}
      style={{ flexShrink: 0, width: size, height: "auto" }}
    />
  );
}
