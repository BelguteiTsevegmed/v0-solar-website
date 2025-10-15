import type {
  SolarViewData,
  Segment,
  SolarPanelPlacement,
  PanelDimensions,
} from "@/lib/solar-types";

/** Map Google’s Building Insights response to SolarViewData */
export function mapGoogleBuildingInsightsToViewModel(bi: any): SolarViewData {
  // Some fields are nested under `solarPotential` in the Building Insights response
  const sp = bi?.solarPotential ?? bi ?? {};

  const dims: PanelDimensions = {
    widthMeters: sp?.panelWidthMeters ?? 1.1,
    heightMeters: sp?.panelHeightMeters ?? 1.8,
    thicknessMeters: 0.035,
  };

  // Build segments from `roofSegmentStats` (under solarPotential)
  const rawSegments: any[] = Array.isArray(sp?.roofSegmentStats)
    ? sp.roofSegmentStats
    : Array.isArray(bi?.roofSegmentStats)
    ? bi.roofSegmentStats
    : [];

  const buildingCenter = bi?.center
    ? { lat: bi.center.latitude, lng: bi.center.longitude }
    : undefined;

  const segments: Segment[] = rawSegments.map((s: any, i: number) => {
    // center may be missing on some responses; fall back to building center
    const center = s?.center
      ? { lat: s.center.latitude, lng: s.center.longitude }
      : buildingCenter ?? { lat: 0, lng: 0 };

    // Bounding box can be provided either as `vertices[]` or `sw`/`ne`
    let boundingBox: { lat: number; lng: number }[] | undefined = undefined;
    if (s?.boundingBox?.vertices?.length) {
      boundingBox = s.boundingBox.vertices.map((v: any) => ({
        lat: v.latitude,
        lng: v.longitude,
      }));
    } else if (s?.boundingBox?.sw && s?.boundingBox?.ne) {
      const sw = s.boundingBox.sw;
      const ne = s.boundingBox.ne;
      // Construct rectangle corners SW -> SE -> NE -> NW
      boundingBox = [
        { lat: sw.latitude, lng: sw.longitude },
        { lat: sw.latitude, lng: ne.longitude },
        { lat: ne.latitude, lng: ne.longitude },
        { lat: ne.latitude, lng: sw.longitude },
      ];
    }

    return {
      id: s?.segmentIndex ?? s?.index ?? i,
      center,
      planeHeightAtCenterMeters: s?.planeHeightAtCenterMeters ?? 0,
      tiltDegrees: s?.pitchDegrees ?? s?.tiltDegrees ?? 0,
      azimuthDegrees: s?.azimuthDegrees ?? 180,
      boundingBox,
      areaMeters2: s?.roofAreaMeters2 ?? s?.stats?.areaMeters2,
    } as Segment;
  });

  // Panels list may also live under `solarPotential`
  const rawPanels: any[] = Array.isArray(sp?.solarPanels)
    ? sp.solarPanels
    : Array.isArray(bi?.solarPanels)
    ? bi.solarPanels
    : [];

  const panels: SolarPanelPlacement[] = rawPanels.map((p: any, i: number) => ({
    id: p?.id ?? i,
    segmentIndex: p?.segmentIndex ?? 0,
    center: p?.center
      ? { lat: p.center.latitude, lng: p.center.longitude }
      : buildingCenter ?? { lat: 0, lng: 0 },
    orientation: (p?.orientation ?? "PORTRAIT") as "PORTRAIT" | "LANDSCAPE",
    yearlyEnergyDcKwh: p?.yearlyEnergyDcKwh ?? p?.yearlyEnergyDc,
  }));

  // Fallback: If no segments came back but we have a building bounding box,
  // synthesize a single flat segment so we can at least render the footprint.
  if (segments.length === 0 && bi?.boundingBox?.sw && bi?.boundingBox?.ne) {
    const sw = bi.boundingBox.sw;
    const ne = bi.boundingBox.ne;
    const center = {
      lat: (sw.latitude + ne.latitude) / 2,
      lng: (sw.longitude + ne.longitude) / 2,
    };
    segments.push({
      id: 0,
      center,
      planeHeightAtCenterMeters: 0,
      tiltDegrees: 0,
      azimuthDegrees: 180,
      boundingBox: [
        { lat: sw.latitude, lng: sw.longitude },
        { lat: sw.latitude, lng: ne.longitude },
        { lat: ne.latitude, lng: ne.longitude },
        { lat: ne.latitude, lng: sw.longitude },
      ],
      areaMeters2: undefined,
    });
  }

  return {
    segments,
    panels,
    panelDimensions: dims,
    origin: buildingCenter,
  };
}
