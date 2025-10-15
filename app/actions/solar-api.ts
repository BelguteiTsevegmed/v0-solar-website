"use server";
import { encode as geohashEncode } from "ngeohash";

interface BuildingInsights {
  solarPotential?: {
    maxArrayPanelsCount?: number;
    maxArrayAreaMeters2?: number;
    maxSunshineHoursPerYear?: number;
    carbonOffsetFactorKgPerMwh?: number;
  };
  center?: {
    latitude: number;
    longitude: number;
  };
  boundingBox?: {
    sw: { latitude: number; longitude: number };
    ne: { latitude: number; longitude: number };
  };
}

export async function fetchBuildingInsights(
  lat: number,
  lng: number,
  options?: { forceRefresh?: boolean; quality?: "BASE" | "MEDIUM" | "HIGH" }
): Promise<{ data: BuildingInsights | null; error: string | null }> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      return { data: null, error: "API key not configured" };
    }

    const fields = [
      "center",
      "boundingBox",
      // Core panel dimensions
      "solarPotential.panelWidthMeters",
      "solarPotential.panelHeightMeters",
      // Segments required for 3D
      "solarPotential.roofSegmentStats.center",
      "solarPotential.roofSegmentStats.pitchDegrees",
      "solarPotential.roofSegmentStats.azimuthDegrees",
      "solarPotential.roofSegmentStats.planeHeightAtCenterMeters",
      "solarPotential.roofSegmentStats.boundingBox",
      "solarPotential.roofSegmentStats.stats.areaMeters2",
      // Optional panel placements/yield if available
      "solarPotential.solarPanels",
      "solarPotential.solarPanels.center",
      "solarPotential.solarPanels.orientation",
      "solarPotential.solarPanels.segmentIndex",
      "solarPotential.solarPanels.yearlyEnergyDcKwh",
    ].join(",");

    const quality = options?.quality ?? "MEDIUM";

    const url = `https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${lat}&location.longitude=${lng}&requiredQuality=${quality}&fields=${encodeURIComponent(
      fields
    )}&key=${apiKey}`;

    // Cache keying
    const { buildBiPath, readJsonIfFresh, writeJson } = await import(
      "@/lib/solar-cache"
    );
    const geohash8 = geohashEncode(lat, lng, 8);
    const cachePath = buildBiPath(geohash8, quality);
    const TTL_7_DAYS = 7 * 24 * 60 * 60 * 1000;
    if (!options?.forceRefresh) {
      const cached = await readJsonIfFresh<BuildingInsights>(
        cachePath,
        TTL_7_DAYS
      );
      if (cached) {
        console.log("[solar] BI cache hit:", cachePath);
        return { data: cached, error: null };
      }
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[v0] Solar API error:", errorText);
      return { data: null, error: "Failed to fetch building insights" };
    }

    const data = (await response.json()) as BuildingInsights;
    try {
      await writeJson(cachePath, data);
      console.log("[solar] BI cache write:", cachePath);
    } catch (e) {
      console.warn("[solar] BI cache write failed:", e);
    }
    return { data, error: null };
  } catch (err) {
    console.error("[v0] Error fetching building insights:", err);
    return { data: null, error: "Network error" };
  }
}

export async function geocodeAddress(
  address: string
): Promise<{ lat: number; lng: number } | null> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      return null;
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
      )}&key=${apiKey}`
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return { lat: location.lat, lng: location.lng };
    }

    return null;
  } catch (err) {
    console.error("[v0] Error geocoding address:", err);
    return null;
  }
}
