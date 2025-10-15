import type { LatLng, PanelDimensions } from "@/lib/solar-types";

// Client-safe utility function for energy calculations
export function estimatePanelEnergyKwh(
  flux: number,
  dims: PanelDimensions,
  options?: { efficiency?: number; performanceRatio?: number }
): number {
  const eff = options?.efficiency ?? 0.19; // module efficiency
  const pr = options?.performanceRatio ?? 0.85; // system PR losses
  const panelArea = dims.widthMeters * dims.heightMeters; // m^2
  // If flux is annual kWh/m^2, energy ≈ flux * area * eff * pr
  // If flux is W/m^2, units won't match; this is used as relative score.
  const energyKwh = flux * panelArea * eff * pr;
  return Math.max(0, energyKwh);
}
