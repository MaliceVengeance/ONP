import { cookies } from "next/headers";
import type { CamoVariant } from "@/components/CamoCanvas";
import { CAMO_COOKIE, isCamoVariant } from "./constants";

/** Read the session's camo variant in a server component. Defaults to "urban" if middleware hasn't set it (e.g. a route outside the matcher). */
export async function getCamoVariant(): Promise<CamoVariant> {
  const cookieStore = await cookies();
  const value = cookieStore.get(CAMO_COOKIE)?.value;
  return isCamoVariant(value) ? value : "urban";
}
