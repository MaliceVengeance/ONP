import type { CamoVariant } from "@/components/CamoCanvas";

export const CAMO_COOKIE = "camo_variant";
export const CAMO_VARIANTS: CamoVariant[] = ["urban", "desert", "jungle", "arctic"];

export function isCamoVariant(value: string | undefined): value is CamoVariant {
  return !!value && (CAMO_VARIANTS as string[]).includes(value);
}

export function pickRandomCamoVariant(): CamoVariant {
  return CAMO_VARIANTS[Math.floor(Math.random() * CAMO_VARIANTS.length)];
}
