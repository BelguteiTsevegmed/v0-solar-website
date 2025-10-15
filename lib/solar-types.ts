export type LatLng = { lat: number; lng: number };

export type Segment = {
  id: number;
  center: LatLng;
  planeHeightAtCenterMeters: number;
  tiltDegrees: number;
  azimuthDegrees: number;
  /** Optional: 4 corners of the segment bounding box (lat/lng). */
  boundingBox?: LatLng[];
  areaMeters2?: number;
  /** Optional: polygon footprint for tighter extrusion */
  polygon?: LatLng[];
  /** Optional: average annual flux value for coloring/ranking */
  avgFluxWm2?: number;
};

export type SolarPanelPlacement = {
  id: string | number;
  segmentIndex: number;
  center: LatLng;
  orientation: "PORTRAIT" | "LANDSCAPE";
  yearlyEnergyDcKwh?: number;
};

export type PanelDimensions = {
  /** panel width across slope (m) when PORTRAIT */
  widthMeters: number;
  /** panel height along slope (m) when PORTRAIT */
  heightMeters: number;
  /** visual thickness (m) for 3D block */
  thicknessMeters?: number;
};

export type SolarViewData = {
  segments: Segment[];
  panels: SolarPanelPlacement[];
  panelDimensions: PanelDimensions;
  /** Optional fixed origin (lat/lng). If omitted we use the mean of segment centers. */
  origin?: LatLng;
};

// ---- Analysis and Proposal Types (UI/Calculations) ----

export type RoofAnalysis = {
  location: LatLng;
  roof: {
    totalUsableAreaMeters2?: number;
    maxPanelCount?: number;
    recommendedTiltDegrees?: number;
    recommendedAzimuthDegrees?: number;
    /** 0..1, higher means more shading */
    shadingScore?: number;
  };
  yield: {
    /** kWh per kWp per year */
    specificYieldKWhPerKWp?: number;
    confidence?: "low" | "medium" | "high";
  };
};

export type NetBillingParams = {
  /** PLN/kWh retail */
  buyPricePLNPerKWh: number;
  /** PLN/kWh export credit */
  sellPricePLNPerKWh: number;
  /** PLN per kWp installed */
  capexPLNPerKWp: number;
  /** Percent of CAPEX per year */
  omRatePctPerYear: number;
  /** Percent per year performance degradation */
  degradationPctPerYear: number;
  /** Percent discount rate for NPV/LCOE */
  discountRatePct: number;
  /** Years */
  lifetimeYears: number;
  /** share of production directly consumed, 0..1 */
  selfConsumptionRatio: number;
  /** Panel wattage to convert panels <-> kWp */
  moduleWattageW: number;
};

export type ProposalOptionName = "SMART_MATCH" | "MAX_ROI" | "MAX_ROOF";

export type ProposalInput = {
  monthlyUsageKWh: number;
  pricing: NetBillingParams;
  roofAnalysis?: RoofAnalysis | null;
};

export type ScenarioMetrics = {
  name: ProposalOptionName;
  panels: number;
  sizeKWp: number;
  annualProductionKWh: number;
  selfConsumedKWh: number;
  exportedKWh: number;
  annualSavingsPLN: number;
  paybackYears: number | null;
  roiPct: number;
  lcoePLNPerKWh: number | null;
};

export type ProposalResult = {
  input: ProposalInput;
  annualUsageKWh: number;
  scenarios: ScenarioMetrics[];
  warnings?: string[];
};
