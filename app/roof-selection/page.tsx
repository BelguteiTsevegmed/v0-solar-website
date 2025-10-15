"use client";

import { Button } from "@/components/ui/button";
import { MultiStepLoader } from "@/components/ui/multi-step-loader";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchBuildingInsights, geocodeAddress } from "@/app/actions/solar-api";

declare global {
  interface Window {
    google: any;
  }
}

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

const SELECTION_LOADING_STATES = [
  { text: "Zapisujemy zaznaczenie dachu" },
  { text: "Analizujemy powierzchnię" },
  { text: "Szacujemy ekspozycję na słońce" },
  { text: "Przygotowujemy wstępny plan instalacji" },
];

const SELECTION_STEP_DURATION = 1100;

export default function RoofSelectionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const address = searchParams.get("address") || "Twój adres";

  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any | null>(null);
  const [isRoofMarked, setIsRoofMarked] = useState(false);
  const [buildingInsights, setBuildingInsights] =
    useState<BuildingInsights | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const markerRef = useRef<any | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isProcessingSelection, setIsProcessingSelection] = useState(false);

  // Initialize Google Maps
  useEffect(() => {
    const initMap = async () => {
      try {
        // Wait for Google Maps to be loaded
        const checkGoogleMaps = () => {
          return new Promise<void>((resolve) => {
            if (window.google && window.google.maps) {
              resolve();
            } else {
              const interval = setInterval(() => {
                if (window.google && window.google.maps) {
                  clearInterval(interval);
                  resolve();
                }
              }, 100);
            }
          });
        };

        await checkGoogleMaps();

        if (!mapRef.current) return;

        let location = { lat: 52.2297, lng: 21.0122 }; // Default: Warsaw, Poland

        if (address && address !== "Twój adres") {
          const geocodedLocation = await geocodeAddress(address);
          if (geocodedLocation) {
            location = geocodedLocation;
          }
        }

        setCurrentLocation(location);

        // Initialize map
        const mapInstance = new window.google.maps.Map(mapRef.current, {
          center: location,
          zoom: 20,
          mapTypeId: "satellite",
          tilt: 0,
          heading: 0,
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
        });

        setMap(mapInstance);

        // Add draggable marker for location confirmation
        const marker = new window.google.maps.Marker({
          position: location,
          map: mapInstance,
          draggable: true,
          title: "Przeciągnij mnie do swojego domu",
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: "#ff6b35",
            fillOpacity: 0.9,
            strokeColor: "#ffffff",
            strokeWeight: 3,
          },
        });

        markerRef.current = marker;
        // Enable continue as soon as a marker is placed
        setIsRoofMarked(true);

        // Handle marker drag to update building insights
        marker.addListener("dragend", async () => {
          const newPos = marker.getPosition();
          if (newPos) {
            const newLat = newPos.lat();
            const newLng = newPos.lng();
            setCurrentLocation({ lat: newLat, lng: newLng });
            setIsRoofMarked(true);

            // Fetch new building insights for the new location
            const { data, error: apiError } = await fetchBuildingInsights(
              newLat,
              newLng
            );

            if (apiError) {
              console.error("[v0] Solar API error:", apiError);
            } else if (data) {
              setBuildingInsights(data);
            }
          }
        });

        // Fetch initial building insights
        const { data, error: apiError } = await fetchBuildingInsights(
          location.lat,
          location.lng
        );

        if (apiError) {
          console.error("[v0] Solar API error:", apiError);
        } else if (data) {
          setBuildingInsights(data);
        }

        setIsLoading(false);
      } catch (err) {
        console.error("[v0] Error initializing map:", err);
        setError("Nie udało się załadować mapy. Sprawdź konfigurację API.");
        setIsLoading(false);
      }
    };

    initMap();
  }, [address]);

  // Removed polygon selection; we rely on the marker position only

  useEffect(() => {
    return () => {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
    };
  }, []);

  const handleContinue = () => {
    if (!isRoofMarked || isProcessingSelection || !currentLocation) {
      return;
    }

    console.log("[v0] Confirmed location:", currentLocation);
    console.log("[v0] Building insights:", buildingInsights);

    setIsProcessingSelection(true);

    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
    }

    processingTimeoutRef.current = setTimeout(() => {
      setIsProcessingSelection(false);
      console.log("[v0] Roof selection processing complete");
      // Pass the confirmed lat/lng to the next page
      router.push(
        `/roof-render?address=${encodeURIComponent(address)}&lat=${
          currentLocation.lat
        }&lng=${currentLocation.lng}`
      );
    }, SELECTION_LOADING_STATES.length * SELECTION_STEP_DURATION + 600);
  };

  return (
    <div className="min-h-screen bg-background relative">
      <MultiStepLoader
        loadingStates={SELECTION_LOADING_STATES}
        loading={isProcessingSelection}
        duration={SELECTION_STEP_DURATION}
        loop={false}
      />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
              <span className="bg-gradient-to-br from-foreground to-primary bg-clip-text text-transparent">
                Zaznacz swój dach
              </span>
            </h1>
            <p className="text-muted-foreground">
              Twój adres:{" "}
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1 text-sm font-medium text-foreground shadow-sm">
                {address}
              </span>
            </p>
          </div>

          <div className="w-full aspect-[16/9] bg-muted border-2 border-border rounded-lg overflow-hidden relative">
            <div ref={mapRef} className="absolute inset-0 w-full h-full" />

            <div className="absolute left-4 top-4 right-4 sm:right-auto flex flex-wrap items-center gap-2 pointer-events-none">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/80 backdrop-blur px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                  1
                </span>
                <span className="whitespace-nowrap">
                  Przeciągnij znacznik na dom
                </span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/80 backdrop-blur px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                  2
                </span>
                <span className="whitespace-nowrap">
                  Analiza uruchomi się automatycznie
                </span>
              </div>
            </div>

            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                <div className="text-center space-y-4">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-muted-foreground">Ładowanie mapy...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                <div className="text-center space-y-4 p-6">
                  <p className="text-destructive font-semibold">{error}</p>
                  <p className="text-sm text-muted-foreground">
                    Sprawdź ustawienia projektu w zakładce Settings
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="outline"
              className="min-w-[200px] bg-transparent"
              onClick={() => window.history.back()}
            >
              Wróć
            </Button>
            <Button
              size="lg"
              className="min-w-[200px]"
              disabled={!isRoofMarked || isProcessingSelection}
              onClick={handleContinue}
            >
              Kontynuuj
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
