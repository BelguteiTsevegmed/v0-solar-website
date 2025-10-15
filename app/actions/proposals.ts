"use server";

import { z } from "zod";
import { withPolandDefaults } from "@/lib/pricing-poland";
import { proposeScenarios } from "@/lib/solar-calc";
import type { ProposalResult, RoofAnalysis } from "@/lib/solar-types";

const RoofAnalysisSchema = z
  .object({
    location: z.object({ lat: z.number(), lng: z.number() }),
    roof: z
      .object({
        totalUsableAreaMeters2: z.number().optional(),
        maxPanelCount: z.number().optional(),
        recommendedTiltDegrees: z.number().optional(),
        recommendedAzimuthDegrees: z.number().optional(),
        shadingScore: z.number().min(0).max(1).optional(),
      })
      .optional(),
    yield: z
      .object({
        specificYieldKWhPerKWp: z.number().optional(),
        confidence: z.enum(["low", "medium", "high"]).optional(),
      })
      .optional(),
  })
  .strict();

const PricingSchema = z
  .object({
    buyPricePLNPerKWh: z.number().positive().optional(),
    sellPricePLNPerKWh: z.number().nonnegative().optional(),
    capexPLNPerKWp: z.number().positive().optional(),
    omRatePctPerYear: z.number().min(0).max(100).optional(),
    degradationPctPerYear: z.number().min(0).max(5).optional(),
    discountRatePct: z.number().min(0).max(20).optional(),
    lifetimeYears: z.number().int().min(10).max(35).optional(),
    selfConsumptionRatio: z.number().min(0).max(1).optional(),
    moduleWattageW: z.number().int().min(300).max(600).optional(),
  })
  .strict()
  .optional();

const ProposalsInputSchema = z.object({
  monthlyUsageKWh: z.number().min(10).max(5000),
  pricingOverrides: PricingSchema,
  roofAnalysis: RoofAnalysisSchema.nullable().optional(),
});

export type ProposalsInput = z.infer<typeof ProposalsInputSchema>;

export async function computeProposals(
  input: ProposalsInput
): Promise<{ data: ProposalResult | null; error: string | null }> {
  try {
    const parsed = ProposalsInputSchema.safeParse(input);
    if (!parsed.success) {
      return { data: null, error: "Invalid input" };
    }
    const pricing = withPolandDefaults(parsed.data.pricingOverrides ?? {});
    const result = proposeScenarios({
      monthlyUsageKWh: parsed.data.monthlyUsageKWh,
      pricing,
      roofAnalysis: (parsed.data.roofAnalysis ?? null) as RoofAnalysis | null,
    });
    return { data: result, error: null };
  } catch (e) {
    console.error("[proposals] compute error", e);
    return { data: null, error: "Computation failed" };
  }
}


