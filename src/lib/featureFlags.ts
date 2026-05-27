import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Read a boolean feature flag from the platform_settings table.
 * Returns false if the row doesn't exist or value is anything other than "true".
 */
export async function getFeatureFlag(key: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("platform_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  return (data as any)?.value === "true";
}

export const FLAGS = {
  INSPECTOR_ENABLED: "inspector_feature_enabled",
} as const;
