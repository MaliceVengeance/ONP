export type ContractorProfileSnap = {
  business_name?: string | null;
  phone?: string | null;
  categories?: string[] | null;
};

/** Returns true only when the three required fields are filled. */
export function isProfileComplete(profile: ContractorProfileSnap | null): boolean {
  if (!profile) return false;
  if (!profile.business_name?.trim()) return false;
  if (!profile.phone?.trim()) return false;
  if (!profile.categories || profile.categories.length === 0) return false;
  return true;
}

/** Human-readable list of what is still missing. */
export function profileMissingFields(profile: ContractorProfileSnap | null): string[] {
  const missing: string[] = [];
  if (!profile?.business_name?.trim()) missing.push("business name");
  if (!profile?.phone?.trim()) missing.push("phone number");
  if (!profile?.categories || profile.categories.length === 0)
    missing.push("at least one trade/service category");
  return missing;
}
