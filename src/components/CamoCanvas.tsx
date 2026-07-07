"use client";

import { useEffect, useRef } from "react";

/**
 * Palette registry for the camo system. All four deployment-environment
 * variants ship together — which one renders is decided per-session
 * (see src/lib/camo/session.ts), not per-component.
 */
const PALETTES = {
  urban: ["#202326", "#4B5054", "#9BA3A6", "#E9EAEA"],
  desert: ["#5C4A32", "#8B6F47", "#C2A878", "#D9C8A6"],
  jungle: ["#1C1F17", "#2F3B24", "#4A5D32", "#6B5D3F"],
  arctic: ["#4A5054", "#A8B2B8", "#D8DCDE", "#F2F3F4"],
} as const;

export type CamoVariant = keyof typeof PALETTES;

export function CamoCanvas({
  variant = "urban",
  cell = 9,
  seed,
  className,
  style,
}: {
  variant?: CamoVariant;
  cell?: number;
  seed?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const palette = PALETTES[variant];
    const s = seed ?? Math.random();

    function rand(x: number, y: number) {
      const v = Math.sin(x * 127.1 + y * 311.7 + s * 1000) * 43758.5453;
      return v - Math.floor(v);
    }

    function render() {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width || canvas.parentElement?.clientWidth || 300;
      canvas.height = rect.height || canvas.parentElement?.clientHeight || 300;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const cols = Math.ceil(canvas.width / cell) + 1;
      const rows = Math.ceil(canvas.height / cell) + 1;
      const macro = 3; // coarse blocks give the blocky "digital camo" look

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const bx = Math.floor(x / macro);
          const by = Math.floor(y / macro);
          const r = rand(bx, by);
          let idx = r < 0.3 ? 0 : r < 0.55 ? 1 : r < 0.8 ? 2 : 3;

          const jitter = rand(x * 2.7, y * 3.1);
          if (jitter > 0.85) idx = (idx + 1) % palette.length;

          ctx.fillStyle = palette[idx];
          ctx.fillRect(x * cell, y * cell, cell, cell);
        }
      }
    }

    render();
    window.addEventListener("resize", render);
    return () => window.removeEventListener("resize", render);
  }, [variant, cell, seed]);

  return (
    <canvas
      ref={ref}
      className={className}
      style={{ display: "block", width: "100%", height: "100%", ...style }}
    />
  );
}
