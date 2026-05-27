import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Read a boolean feature flag from the platform_settings table.
 * Returns false if the row doesn't exist or value is anything other than "true".
 */
export async function getFeatureFlag(key: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .from("platform_settings")
      .select("value")
      .eq("key", key)
      .maybeSingle();
    if (error) return false; // table may not exist yet — default off
    return (data as any)?.value === "true";
  } catch {
    return false; // always fail safe (feature off)
  }
}

export const FLAGS = {
  INSPECTOR_ENABLED: "inspector_feature_enabled",
} as const;
