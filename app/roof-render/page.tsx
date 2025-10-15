"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SolarRoof3D } from "@/components/solar-roof-3d";
import { RoofMapVisualizer } from "@/components/roof-map-visualizer";
import { RoofProposalPanel } from "@/components/roof-proposal-panel";
import { mapGoogleBuildingInsightsToViewModel } from "@/lib/google-mapping";
import type { SolarViewData, LatLng } from "@/lib/solar-types";
import { fetchBuildingInsights } from "@/app/actions/solar-api";
import {
  fetchDataLayers,
  sampleAnnualFluxAtPoints,
} from "@/app/actions/solar-data-layers";
import { estimatePanelEnergyKwh } from "@/lib/solar-flux";
import { useLoading } from "@/lib/loading-context";

export default function RoofRenderPage() {
  const searchParams = useSearchParams();
  const address = searchParams.get("address") || "Twój adres";
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  const { setIsLoading, setLoadingProgress, setLoadingMessage } = useLoading();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewData, setViewData] = useState<SolarViewData | null>(null);
  const [rgbOverlay, setRgbOverlay] = useState<{
    url: string;
    sw: LatLng;
    ne: LatLng;
  } | null>(null);

  useEffect(() => {
    const run = async () => {
      setError(null);
      setViewData(null);
      if (!lat || !lng) return;
      const latNum = Number(lat);
      const lngNum = Number(lng);
      if (Number.isNaN(latNum) || Number.isNaN(lngNum)) {
        setError("Nieprawidłowe współrzędne");
        return;
      }

      setLoading(true);
      setIsLoading(true);
      setLoadingProgress(0);

      // Simulate progress during API call
      let currentProgress = 0;
      const progressInterval = setInterval(() => {
        currentProgress = Math.min(currentProgress + 0.1, 0.9); // Cap at 90% until API completes
        setLoadingProgress(currentProgress);
      }, 200);

      try {
        const forceRefresh = searchParams.get("refresh") === "1";
        const { data, error } = await fetchBuildingInsights(latNum, lngNum, {
          forceRefresh,
          quality: "MEDIUM",
        });
        if (error || !data) {
          setError(error || "Brak danych dla tej lokalizacji");
          return;
        }
        const mapped = mapGoogleBuildingInsightsToViewModel(data);

        // Attempt Data Layers fetch and flux enrichment
        try {
          const dl = await fetchDataLayers(latNum, lngNum, {
            radiusMeters: 80,
            pixelSizeMeters: 0.5,
            quality: "MEDIUM",
            forceRefresh,
          });
          // Prepare optional RGB overlay bounds (approximate using radius)
          if (dl.rgbUrl) {
            const R = dl.radiusMeters;
            const latDelta = R / 111132;
            const lngDelta =
              R / (111320 * Math.max(Math.cos((latNum * Math.PI) / 180), 1e-6));
            setRgbOverlay({
              url: dl.rgbUrl,
              sw: { lat: latNum - latDelta, lng: lngNum - lngDelta },
              ne: { lat: latNum + latDelta, lng: lngNum + lngDelta },
            });
          } else {
            setRgbOverlay(null);
          }
          if (dl.annualFluxPath) {
            const points = mapped.panels.map((p) => p.center);
            const fluxVals = points.length
              ? await sampleAnnualFluxAtPoints(dl.annualFluxPath, points)
              : [];
            // Assign missing yearlyEnergyDcKwh estimates and segment average flux
            const dims = mapped.panelDimensions;
            mapped.panels = mapped.panels.map((p, i) => {
              if (p.yearlyEnergyDcKwh == null && fluxVals[i] != null) {
                const est = estimatePanelEnergyKwh(fluxVals[i]!, dims);
                return { ...p, yearlyEnergyDcKwh: est };
              }
              return p;
            });
            // Compute per-segment flux average
            const segToFlux: Record<number, number[]> = {};
            mapped.panels.forEach((p, i) => {
              const v = fluxVals[i];
              if (v == null) return;
              if (!segToFlux[p.segmentIndex]) segToFlux[p.segmentIndex] = [];
              segToFlux[p.segmentIndex].push(v);
            });
            mapped.segments = mapped.segments.map((s) => {
              const arr = segToFlux[s.id] || [];
              const avg = arr.length
                ? arr.reduce((a, b) => a + b, 0) / arr.length
                : undefined;
              return { ...s, avgFluxWm2: avg };
            });
          }
        } catch (e) {
          console.warn("[solar] Data Layers enrichment skipped:", e);
        }

        setViewData(mapped);
      } catch (e) {
        setError("Błąd podczas pobierania danych");
      } finally {
        clearInterval(progressInterval);
        setLoadingProgress(1); // Complete the progress
        setTimeout(() => {
          setLoading(false);
          setIsLoading(false);
        }, 500); // Small delay to show completion
      }
    };
    run();
  }, [lat, lng, setIsLoading, setLoadingProgress]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="font-bold text-foreground text-4xl">
              Wizualizacja Twojego Dachu
            </h1>
            <p className="text-muted-foreground text-lg">
              Twój adres:{" "}
              <span className="font-semibold text-foreground">{address}</span>
            </p>
            {lat && lng && (
              <p className="text-muted-foreground text-sm">
                Lokalizacja: {parseFloat(lat).toFixed(6)},{" "}
                {parseFloat(lng).toFixed(6)}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="w-full aspect-[16/9] bg-muted border-2 border-border rounded-lg overflow-hidden">
              {!lat || !lng ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <p className="text-muted-foreground text-lg">
                      Podaj adres lub współrzędne, aby wyrenderować dach
                    </p>
                  </div>
                </div>
              ) : loading ? (
                <div className="w-full h-full flex items-center justify-center">
                  <p className="text-muted-foreground">
                    Ładowanie danych Solar API…
                  </p>
                </div>
              ) : error ? (
                <div className="w-full h-full flex items-center justify-center">
                  <p className="text-destructive-foreground">{error}</p>
                </div>
              ) : viewData ? (
                // Switch to map-based visualizer to match Google's demo interaction
                <RoofMapVisualizer
                  data={viewData}
                  style={{ height: "100%" }}
                  showToolbar
                  rgbOverlay={rgbOverlay}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <p className="text-muted-foreground">
                    Brak danych do wyświetlenia
                  </p>
                </div>
              )}
            </div>
            <div>
              <RoofProposalPanel
                roofAnalysis={
                  viewData
                    ? {
                        location: { lat: Number(lat), lng: Number(lng) },
                        roof: {
                          maxPanelCount: viewData?.panels?.length || undefined,
                        },
                        yield: {
                          specificYieldKWhPerKWp: undefined,
                          confidence: "low",
                        },
                      }
                    : null
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
