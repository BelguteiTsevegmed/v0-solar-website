import type {
  NetBillingParams,
  ProposalInput,
  ProposalResult,
  ProposalOptionName,
  ScenarioMetrics,
  RoofAnalysis,
} from "@/lib/solar-types";

const KWH_PER_MWH = 1000;

export function annualUsageFromMonthly(monthlyKWh: number): number {
  return Math.max(0, Math.round(monthlyKWh * 12));
}

export function estimateSpecificYield(analysis?: RoofAnalysis | null): number {
  // Fallback heuristic for PL: 950 kWh/kWp/yr when unknown
  return analysis?.yield?.specificYieldKWhPerKWp && analysis.yield.specificYieldKWhPerKWp > 0
    ? analysis.yield.specificYieldKWhPerKWp
    : 950;
}

export function panelsToKWp(panels: number, moduleWattageW: number): number {
  return (panels * moduleWattageW) / 1000;
}

export function kWpToPanels(kWp: number, moduleWattageW: number): number {
  return Math.max(1, Math.round((kWp * 1000) / moduleWattageW));
}

export function productionFromKWp(kWp: number, specificYield: number): number {
  return Math.max(0, Math.round(kWp * specificYield));
}

export function capexFromKWp(kWp: number, params: NetBillingParams): number {
  return kWp * params.capexPLNPerKWp;
}

export function annualSavingsPoland(
  annualProductionKWh: number,
  annualUsageKWh: number,
  params: NetBillingParams
): {
  selfConsumedKWh: number;
  exportedKWh: number;
  annualSavingsPLN: number;
} {
  const selfConsumed = Math.min(
    annualProductionKWh * params.selfConsumptionRatio,
    annualUsageKWh
  );
  const exported = Math.max(annualProductionKWh - selfConsumed, 0);
  const billOffset = selfConsumed * params.buyPricePLNPerKWh;
  const exportCredit = exported * params.sellPricePLNPerKWh;
  const capex = capexFromKWp(annualProductionKWh / estimateSpecificYield(null), params);
  const om = capex * (params.omRatePctPerYear / 100);
  const annualSavings = billOffset + exportCredit - om;
  return {
    selfConsumedKWh: Math.round(selfConsumed),
    exportedKWh: Math.round(exported),
    annualSavingsPLN: Math.round(annualSavings),
  };
}

export function paybackYears(
  capexPLN: number,
  annualSavingsPLN: number
): number | null {
  if (annualSavingsPLN <= 0) return null;
  return +(capexPLN / annualSavingsPLN).toFixed(1);
}

export function roiPercent(
  capexPLN: number,
  annualSavingsPLN: number
): number {
  if (capexPLN <= 0) return 0;
  return +(((annualSavingsPLN / capexPLN) * 100).toFixed(1));
}

export function lcoe(
  capexPLN: number,
  annualProductionKWh: number,
  params: NetBillingParams
): number | null {
  if (annualProductionKWh <= 0) return null;
  // Very simplified real-LCOE approximation: present value factor * annual kWh
  const r = params.discountRatePct / 100;
  const n = params.lifetimeYears;
  const pvFactor = r === 0 ? n : (1 - Math.pow(1 + r, -n)) / r;
  const totalKWh = annualProductionKWh * pvFactor; // ignoring degradation term for simplicity
  return +(capexPLN / totalKWh).toFixed(2);
}

function clampPanelsByRoof(panels: number, analysis?: RoofAnalysis | null): number {
  const maxPanels = analysis?.roof?.maxPanelCount ?? Infinity;
  return Math.max(1, Math.min(Math.round(panels), maxPanels));
}

function smartMatchPanels(
  annualUsageKWh: number,
  specificYield: number,
  moduleWattageW: number,
  analysis?: RoofAnalysis | null
): number {
  const targetCoverage = 0.9; // ~90% usage coverage
  const requiredKWp = (annualUsageKWh * targetCoverage) / specificYield;
  const panels = kWpToPanels(requiredKWp, moduleWattageW);
  return clampPanelsByRoof(panels, analysis);
}

function maxRoofPanels(
  moduleWattageW: number,
  analysis?: RoofAnalysis | null
): number {
  const maxPanels = analysis?.roof?.maxPanelCount ?? 10;
  return clampPanelsByRoof(maxPanels, analysis);
}

function maxRoiPanels(
  annualUsageKWh: number,
  specificYield: number,
  params: NetBillingParams,
  analysis?: RoofAnalysis | null
): number {
  // Simple heuristic: start at Smart, adjust ±20% searching minimal payback
  const start = smartMatchPanels(
    annualUsageKWh,
    specificYield,
    params.moduleWattageW,
    analysis
  );
  const candidates = [
    Math.round(start * 0.8),
    start,
    Math.round(start * 1.2),
    maxRoofPanels(params.moduleWattageW, analysis),
  ].map((p) => clampPanelsByRoof(p, analysis));

  let best = start;
  let bestPayback = Number.POSITIVE_INFINITY;
  for (const p of candidates) {
    const kWp = panelsToKWp(p, params.moduleWattageW);
    const prod = productionFromKWp(kWp, specificYield);
    const capex = capexFromKWp(kWp, params);
    const { annualSavingsPLN } = annualSavingsPoland(prod, annualUsageKWh, params);
    const pb = paybackYears(capex, annualSavingsPLN);
    const pbValue = pb ?? Number.POSITIVE_INFINITY;
    if (pbValue < bestPayback) {
      bestPayback = pbValue;
      best = p;
    }
  }
  return best;
}

function buildScenario(
  name: ProposalOptionName,
  panels: number,
  annualUsageKWh: number,
  specificYield: number,
  params: NetBillingParams
): ScenarioMetrics {
  const sizeKWp = panelsToKWp(panels, params.moduleWattageW);
  const annualProductionKWh = productionFromKWp(sizeKWp, specificYield);
  const capexPLN = capexFromKWp(sizeKWp, params);
  const { selfConsumedKWh, exportedKWh, annualSavingsPLN } = annualSavingsPoland(
    annualProductionKWh,
    annualUsageKWh,
    params
  );
  const payback = paybackYears(capexPLN, annualSavingsPLN);
  const roiPctValue = roiPercent(capexPLN, annualSavingsPLN);
  const lcoeValue = lcoe(capexPLN, annualProductionKWh, params);
  return {
    name,
    panels,
    sizeKWp: +sizeKWp.toFixed(2),
    annualProductionKWh,
    selfConsumedKWh,
    exportedKWh,
    annualSavingsPLN,
    paybackYears: payback,
    roiPct: roiPctValue,
    lcoePLNPerKWh: lcoeValue,
  };
}

export function proposeScenarios(input: ProposalInput): ProposalResult {
  const annualUsageKWh = annualUsageFromMonthly(input.monthlyUsageKWh);
  const specificYield = estimateSpecificYield(input.roofAnalysis);

  const smartPanels = smartMatchPanels(
    annualUsageKWh,
    specificYield,
    input.pricing.moduleWattageW,
    input.roofAnalysis
  );
  const roiPanels = maxRoiPanels(
    annualUsageKWh,
    specificYield,
    input.pricing,
    input.roofAnalysis
  );
  const maxPanels = maxRoofPanels(input.pricing.moduleWattageW, input.roofAnalysis);

  const scenarios: ScenarioMetrics[] = [
    buildScenario("SMART_MATCH", smartPanels, annualUsageKWh, specificYield, input.pricing),
    buildScenario("MAX_ROI", roiPanels, annualUsageKWh, specificYield, input.pricing),
    buildScenario("MAX_ROOF", maxPanels, annualUsageKWh, specificYield, input.pricing),
  ];

  const warnings: string[] = [];
  if (!input.roofAnalysis?.yield?.specificYieldKWhPerKWp) {
    warnings.push(
      "Brak danych o uzysku – użyto heurystyki 950 kWh/kWp/rok."
    );
  }
  if ((input.roofAnalysis?.roof?.maxPanelCount ?? 0) <= 4) {
    warnings.push("Bardzo mała dostępna powierzchnia dachu – oszczędności będą ograniczone.");
  }

  return {
    input,
    annualUsageKWh,
    scenarios,
    warnings: warnings.length ? warnings : undefined,
  };
}


