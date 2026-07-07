/**
 * ONP Launch Service Area — El Paso, TX and Las Cruces, NM
 *
 * Update this file and redeploy to expand the service area.
 * No migration or admin UI needed — just add ZIPs and push.
 *
 * Last reviewed: 2026-05-29
 */

export const LAUNCH_SERVICE_AREA_ZIPS: ReadonlySet<string> = new Set([
  // ── El Paso, TX ──────────────────────────────────────────────
  // Anthony / Canutillo / Vinton / Fabens / Clint areas
  "79821", "79835", "79836", "79838", "79849", "79853",
  // Central / Downtown / Lower Valley
  "79901", "79902", "79903", "79904", "79905", "79906", "79907", "79908",
  // Northeast / Westside / Fort Bliss
  "79911", "79912", "79914", "79915", "79916", "79917", "79918",
  // Central / Westside / Upper Valley
  "79920", "79922", "79924", "79925",
  // Far East / Mission Hills / Zaragoza
  "79927", "79928", "79929", "79930", "79932", "79934",
  "79935", "79936", "79938",

  // ── Las Cruces, NM and Doña Ana County ───────────────────────
  // Las Cruces proper
  "88001", "88003", "88004", "88005", "88007", "88008",
  "88011", "88012",
  // Chaparral / Anthony / Vado / Sunland Park / Santa Teresa
  "88021", "88024", "88027", "88032", "88033",
  // Hatch / Mesilla Park / Mesquite / Organ / Radium Springs / Rincon
  "88044", "88046", "88047", "88048", "88052", "88054",
  // Sunland Park / Deming-adjacent / Tortugas / White Sands
  "88063", "88072", "88081",
]);

/**
 * Returns true if the given ZIP is within the ONP launch service area.
 * Handles ZIP+4 format by stripping to the first 5 digits.
 */
export function isInServiceArea(zip: string | null | undefined): boolean {
  if (!zip) return false;
  const cleanZip = zip.trim().replace(/\D/g, "").slice(0, 5);
  return LAUNCH_SERVICE_AREA_ZIPS.has(cleanZip);
}

/**
 * Returns a display label for the service area.
 */
export const SERVICE_AREA_LABEL = "El Paso, TX and Las Cruces, NM";
