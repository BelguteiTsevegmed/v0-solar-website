import type { NetBillingParams } from "@/lib/solar-types";

export const POLAND_DEFAULTS: NetBillingParams = {
  buyPricePLNPerKWh: 0.95,
  sellPricePLNPerKWh: 0.4,
  capexPLNPerKWp: 5000,
  omRatePctPerYear: 1,
  degradationPctPerYear: 0.5,
  discountRatePct: 5,
  lifetimeYears: 25,
  selfConsumptionRatio: 0.35,
  moduleWattageW: 420,
};

export function withPolandDefaults(
  overrides?: Partial<NetBillingParams>
): NetBillingParams {
  return { ...POLAND_DEFAULTS, ...(overrides ?? {}) };
}


