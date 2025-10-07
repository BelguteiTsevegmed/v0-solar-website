"use client"

import { Button } from "@/components/ui/button"
import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { fetchBuildingInsights, geocodeAddress } from "@/app/actions/solar-api"

interface BuildingInsights {
  solarPotential?: {
    maxArrayPanelsCount?: number
    maxArrayAreaMeters2?: number
    maxSunshineHoursPerYear?: number
    carbonOffsetFactorKgPerMwh?: number
  }
  center?: {
    latitude: number
    longitude: number
  }
  boundingBox?: {
    sw: { latitude: number; longitude: number }
    ne: { latitude: number; longitude: number }
  }
}

export default function RoofSelectionPage() {
  const searchParams = useSearchParams()
  const address = searchParams.get("address") || "Twój adres"

  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any | null>(null)
  const [isRoofMarked, setIsRoofMarked] = useState(false)
  const [buildingInsights, setBuildingInsights] = useState<BuildingInsights | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const polygonRef = useRef<any | null>(null)

  // Initialize Google Maps
  useEffect(() => {
    const initMap = async () => {
      try {
        // Wait for Google Maps to be loaded
        const checkGoogleMaps = () => {
          return new Promise<void>((resolve) => {
            if (window.google && window.google.maps) {
              resolve()
            } else {
              const interval = setInterval(() => {
                if (window.google && window.google.maps) {
                  clearInterval(interval)
                  resolve()
                }
              }, 100)
            }
          })
        }

        await checkGoogleMaps()

        if (!mapRef.current) return

        let location = { lat: 52.2297, lng: 21.0122 } // Default: Warsaw, Poland

        if (address && address !== "Twój adres") {
          const geocodedLocation = await geocodeAddress(address)
          if (geocodedLocation) {
            location = geocodedLocation
          }
        }

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
        })

        setMap(mapInstance)

        const { data, error: apiError } = await fetchBuildingInsights(location.lat, location.lng)

        if (apiError) {
          console.error("[v0] Solar API error:", apiError)
        } else if (data) {
          setBuildingInsights(data)
          if (data.boundingBox) {
            drawBuildingBoundary(data.boundingBox, mapInstance)
          }
        }

        setIsLoading(false)
      } catch (err) {
        console.error("[v0] Error initializing map:", err)
        setError("Nie udało się załadować mapy. Sprawdź konfigurację API.")
        setIsLoading(false)
      }
    }

    initMap()
  }, [address])

  const drawBuildingBoundary = (boundingBox: any, mapInstance: any) => {
    if (!mapInstance) return

    if (polygonRef.current) {
      polygonRef.current.setMap(null)
    }

    const bounds = [
      { lat: boundingBox.sw.latitude, lng: boundingBox.sw.longitude },
      { lat: boundingBox.sw.latitude, lng: boundingBox.ne.longitude },
      { lat: boundingBox.ne.latitude, lng: boundingBox.ne.longitude },
      { lat: boundingBox.ne.latitude, lng: boundingBox.sw.longitude },
    ]

    const polygon = new window.google.maps.Polygon({
      paths: bounds,
      strokeColor: "#ff6b35",
      strokeOpacity: 0.8,
      strokeWeight: 3,
      fillColor: "#ff6b35",
      fillOpacity: 0.35,
      editable: true,
      draggable: false,
    })

    polygon.setMap(mapInstance)
    polygonRef.current = polygon

    const center = new window.google.maps.LatLng(
      (boundingBox.sw.latitude + boundingBox.ne.latitude) / 2,
      (boundingBox.sw.longitude + boundingBox.ne.longitude) / 2,
    )
    mapInstance.setCenter(center)

    window.google.maps.event.addListener(polygon.getPath(), "set_at", () => {
      setIsRoofMarked(true)
    })
    window.google.maps.event.addListener(polygon.getPath(), "insert_at", () => {
      setIsRoofMarked(true)
    })

    setIsRoofMarked(true)
  }

  const handleContinue = () => {
    if (polygonRef.current) {
      const path = polygonRef.current.getPath()
      const coordinates = path.getArray().map((latLng: any) => ({
        lat: latLng.lat(),
        lng: latLng.lng(),
      }))
      console.log("[v0] Selected roof coordinates:", coordinates)
      console.log("[v0] Building insights:", buildingInsights)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="font-bold text-foreground text-4xl">Zaznacz swój dach</h1>
            <p className="text-muted-foreground text-lg">
              Twój adres: <span className="font-semibold text-foreground">{address}</span>
            </p>
          </div>

          <div className="w-full aspect-[16/9] bg-muted border-2 border-border rounded-lg overflow-hidden relative">
            <div ref={mapRef} className="absolute inset-0 w-full h-full" />

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
                  <p className="text-sm text-muted-foreground">Sprawdź ustawienia projektu w zakładce Settings</p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-muted/50 border border-border rounded-lg p-6 space-y-3">
            <h3 className="font-semibold text-foreground">Jak zaznaczyć dach:</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">1.</span>
                <span>Przesuń mapę, aby znaleźć swój budynek</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">2.</span>
                <span>Dostosuj pomarańczowy obszar, aby dokładnie zaznaczyć swój dach</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">3.</span>
                <span>Kliknij punkty na krawędziach, aby edytować kształt</span>
              </li>
            </ul>
          </div>

          {buildingInsights?.solarPotential && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 space-y-3">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <span className="text-2xl">☀️</span>
                Potencjał solarny Twojego dachu
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {buildingInsights.solarPotential.maxArrayPanelsCount && (
                  <div>
                    <p className="text-muted-foreground">Maksymalna liczba paneli</p>
                    <p className="text-2xl font-bold text-primary">
                      {buildingInsights.solarPotential.maxArrayPanelsCount}
                    </p>
                  </div>
                )}
                {buildingInsights.solarPotential.maxArrayAreaMeters2 && (
                  <div>
                    <p className="text-muted-foreground">Powierzchnia</p>
                    <p className="text-2xl font-bold text-primary">
                      {Math.round(buildingInsights.solarPotential.maxArrayAreaMeters2)} m²
                    </p>
                  </div>
                )}
                {buildingInsights.solarPotential.maxSunshineHoursPerYear && (
                  <div>
                    <p className="text-muted-foreground">Godziny słoneczne/rok</p>
                    <p className="text-2xl font-bold text-primary">
                      {Math.round(buildingInsights.solarPotential.maxSunshineHoursPerYear)}
                    </p>
                  </div>
                )}
                {buildingInsights.solarPotential.carbonOffsetFactorKgPerMwh && (
                  <div>
                    <p className="text-muted-foreground">Redukcja CO₂</p>
                    <p className="text-2xl font-bold text-primary">
                      {Math.round(buildingInsights.solarPotential.carbonOffsetFactorKgPerMwh)} kg/MWh
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="outline"
              className="min-w-[200px] bg-transparent"
              onClick={() => window.history.back()}
            >
              Wróć
            </Button>
            <Button size="lg" className="min-w-[200px]" disabled={!isRoofMarked} onClick={handleContinue}>
              Kontynuuj
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
