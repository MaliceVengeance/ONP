"use client";

import { useEffect, useState } from "react";
import type { CamoVariant } from "@/components/CamoCanvas";
import { isCamoVariant, pickRandomCamoVariant } from "./constants";

const STORAGE_KEY = "onp_camo_variant";

// Module-level cache so every CamoCanvas/SealedBidReveal instance on the
// page converges on the same variant immediately, without each one racing
// to read/write sessionStorage independently.
let cached: CamoVariant | null = null;

function resolveCamoVariant(): CamoVariant {
  if (cached) return cached;

  const stored = window.sessionStorage.getItem(STORAGE_KEY) ?? undefined;
  if (isCamoVariant(stored)) {
    cached = stored;
    return cached;
  }

  const next = pickRandomCamoVariant();
  try {
    window.sessionStorage.setItem(STORAGE_KEY, next);
  } catch {
    // sessionStorage unavailable (e.g. some private-browsing modes) — the
    // module-level cache still keeps this page load consistent.
  }
  cached = next;
  return cached;
}

/**
 * Client-only shared camo variant, picked once per browser session and
 * reused by every camo-rendering component. Returns undefined until the
 * client has resolved it (SSR and first paint) — callers should render
 * nothing (or wait) until a value is available, rather than guessing.
 */
export function useCamoVariant(): CamoVariant | undefined {
  const [variant, setVariant] = useState<CamoVariant | undefined>(cached ?? undefined);

  useEffect(() => {
    setVariant(resolveCamoVariant());
  }, []);

  return variant;
}
