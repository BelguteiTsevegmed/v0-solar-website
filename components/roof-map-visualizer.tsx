"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type {
  SolarViewData,
  SolarPanelPlacement,
  PanelDimensions,
  Segment,
  LatLng,
} from "@/lib/solar-types";

// Local math helpers mirror the 3D implementation but project to ground (map)
const METERS_PER_DEG_LAT = 111_132; // approx
function metersPerDegLon(latDeg: number) {
  return 111_320 * Math.cos((latDeg * Math.PI) / 180);
}

function buildPlaneAxes(tiltDeg: number, azimuthDeg: number) {
  const t = (tiltDeg * Math.PI) / 180;
  const a = (azimuthDeg * Math.PI) / 180;
  const slopeH = {
    x: Math.sin(a),
    z: Math.cos(a),
  };
  // Cross-slope horizontal vector (to the right when looking downslope)
  const c = {
    x: slopeH.z,
    z: -slopeH.x,
  };
  return { t, slopeH, c };
}

function computeOrigin(data: SolarViewData): LatLng {
  if (data.origin) return data.origin;
  const centers = data.segments.map((s) => s.center);
  const lat =
    centers.reduce((a, p) => a + p.lat, 0) / Math.max(centers.length, 1);
  const lng =
    centers.reduce((a, p) => a + p.lng, 0) / Math.max(centers.length, 1);
  return { lat, lng };
}

function selectPanels(
  panels: SolarPanelPlacement[],
  order: "yield" | "as-is",
  count: number
) {
  const arr = [...panels];
  if (order === "yield") {
    arr.sort((a, b) => (b.yearlyEnergyDcKwh ?? 0) - (a.yearlyEnergyDcKwh ?? 0));
  }
  return arr.slice(0, Math.max(0, Math.min(count, arr.length)));
}

type RoofMapVisualizerProps = {
  data: SolarViewData;
  panelCount?: number;
  defaultPanelCount?: number;
  onPanelCountChange?: (n: number) => void;
  panelOrder?: "yield" | "as-is";
  style?: React.CSSProperties;
  showToolbar?: boolean;
  showSegments?: boolean;
  /** Optional aerial RGB overlay returned from Solar API Data Layers */
  rgbOverlay?: {
    url: string;
    /** Bounds of the overlay image (lat/lng) */
    sw: LatLng;
    ne: LatLng;
  } | null;
  /** Show imagery source indicator */
  showImageryIndicator?: boolean;
};

export function RoofMapVisualizer({
  data,
  panelCount,
  defaultPanelCount = 0,
  onPanelCountChange,
  panelOrder = "yield",
  style,
  showToolbar = true,
  showSegments = false,
  rgbOverlay = null,
  showImageryIndicator = true,
}: RoofMapVisualizerProps) {
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const segmentPolysRef = useRef<any[]>([]);
  const panelPolysRef = useRef<any[]>([]);
  const overlayRef = useRef<any | null>(null);
  const [usingRgbOverlay, setUsingRgbOverlay] = useState(false);

  const origin = useMemo(() => computeOrigin(data), [data]);
  const [internalCount, setInternalCount] = useState<number>(defaultPanelCount);
  const controlled = typeof panelCount === "number";
  const count = controlled ? (panelCount as number) : internalCount;
  const maxPanels = data.panels.length;

  const setCount = (n: number) => {
    const clamped = Math.max(0, Math.min(maxPanels, Math.round(n)));
    if (!controlled) setInternalCount(clamped);
    onPanelCountChange?.(clamped);
  };

  // Precompute per-segment axes and lat/lng delta per meter vectors
  const perSegmentBasis = useMemo(() => {
    const basis = new Map<
      number,
      {
        tiltRad: number;
        uDegPerM: { dLat: number; dLng: number };
        vHDegPerM: { dLat: number; dLng: number };
      }
    >();
    for (const seg of data.segments) {
      const { t, slopeH, c } = buildPlaneAxes(
        seg.tiltDegrees,
        seg.azimuthDegrees
      );
      const mPerLon = metersPerDegLon(seg.center.lat);
      const uDegPerM = {
        dLat: c.z / METERS_PER_DEG_LAT,
        dLng: c.x / mPerLon,
      };
      const vHDegPerM = {
        dLat: slopeH.z / METERS_PER_DEG_LAT,
        dLng: slopeH.x / mPerLon,
      };
      basis.set(seg.id, { tiltRad: t, uDegPerM, vHDegPerM });
    }
    return basis;
  }, [data.segments]);

  // Compute rectangle corners for a panel projected to ground
  function computePanelPolygonLL(
    panel: SolarPanelPlacement,
    dims: PanelDimensions,
    seg: Segment
  ): LatLng[] | null {
    const basis = perSegmentBasis.get(seg.id);
    if (!basis) return null;
    const isPortrait = panel.orientation !== "LANDSCAPE";
    const widthU = isPortrait ? dims.widthMeters : dims.heightMeters;
    const heightV = isPortrait ? dims.heightMeters : dims.widthMeters;
    const heightVProj = heightV * Math.cos(basis.tiltRad);

    const halfU = widthU / 2;
    const halfV = heightVProj / 2;

    const cLL = panel.center;
    const u = basis.uDegPerM;
    const v = basis.vHDegPerM;

    const makeCorner = (su: number, sv: number): LatLng => ({
      lat: cLL.lat + su * halfU * u.dLat + sv * halfV * v.dLat,
      lng: cLL.lng + su * halfU * u.dLng + sv * halfV * v.dLng,
    });

    // Clockwise rectangle
    return [
      makeCorner(-1, -1),
      makeCorner(1, -1),
      makeCorner(1, 1),
      makeCorner(-1, 1),
    ];
  }

  // Initialize the map once
  useEffect(() => {
    if (!mapDivRef.current) return;
    const g = (window as any).google;
    if (!g?.maps) return;

    const map = new g.maps.Map(mapDivRef.current, {
      mapTypeId: "hybrid",
      disableDefaultUI: true,
      zoomControl: true,
      gestureHandling: "greedy",
      clickableIcons: false,
      tilt: 0,
    });
    mapRef.current = map;

    // Fit to segments/panels
    const bounds = new g.maps.LatLngBounds();
    let anyBounds = false;
    for (const seg of data.segments) {
      if (seg.boundingBox && seg.boundingBox.length) {
        for (const p of seg.boundingBox) {
          bounds.extend(new g.maps.LatLng(p.lat, p.lng));
          anyBounds = true;
        }
      }
    }
    if (!anyBounds && data.panels.length) {
      for (const p of data.panels) {
        bounds.extend(new g.maps.LatLng(p.center.lat, p.center.lng));
      }
      anyBounds = true;
    }
    if (anyBounds) {
      map.fitBounds(bounds, 40);
    } else {
      map.setCenter({ lat: origin.lat, lng: origin.lng });
      map.setZoom(19);
    }

    // Optionally add RGB ground overlay from Solar Data Layers
    if (rgbOverlay?.url) {
      try {
        const imageBounds = new g.maps.LatLngBounds(
          new g.maps.LatLng(rgbOverlay.sw.lat, rgbOverlay.sw.lng),
          new g.maps.LatLng(rgbOverlay.ne.lat, rgbOverlay.ne.lng)
        );
        const overlay = new g.maps.GroundOverlay(rgbOverlay.url, imageBounds, {
          opacity: 1.0,
        });
        overlay.setMap(map);
        overlayRef.current = overlay;
        setUsingRgbOverlay(true);
      } catch (_) {
        // ignore overlay failure
        setUsingRgbOverlay(false);
      }
    } else {
      setUsingRgbOverlay(false);
    }

    return () => {
      // Cleanup overlays
      for (const poly of segmentPolysRef.current) poly.setMap(null);
      segmentPolysRef.current = [];
      for (const poly of panelPolysRef.current) poly.setMap(null);
      panelPolysRef.current = [];
      if (overlayRef.current) {
        overlayRef.current.setMap(null);
        overlayRef.current = null;
      }
      mapRef.current = null;
    };
  }, [data.segments, data.panels, origin.lat, origin.lng]);

  // Draw segment outlines once
  useEffect(() => {
    const g = (window as any).google;
    const map = mapRef.current;
    if (!g?.maps || !map) return;

    for (const poly of segmentPolysRef.current) poly.setMap(null);
    segmentPolysRef.current = [];

    if (!showSegments) return;
    for (const seg of data.segments) {
      if (!seg.boundingBox || seg.boundingBox.length < 3) continue;
      const path = seg.boundingBox.map((p) => ({ lat: p.lat, lng: p.lng }));
      const poly = new g.maps.Polygon({
        paths: path,
        strokeColor: "#22c55e",
        strokeOpacity: 0.9,
        strokeWeight: 1.5,
        fillColor: "#22c55e",
        fillOpacity: 0.08,
        clickable: false,
        zIndex: 10,
      });
      poly.setMap(map);
      segmentPolysRef.current.push(poly);
    }
  }, [data.segments, showSegments]);

  // Draw panels whenever count/order changes
  const selectedPanels = useMemo(
    () => selectPanels(data.panels, panelOrder, count),
    [data.panels, panelOrder, count]
  );

  useEffect(() => {
    const g = (window as any).google;
    const map = mapRef.current;
    if (!g?.maps || !map) return;

    for (const poly of panelPolysRef.current) poly.setMap(null);
    panelPolysRef.current = [];

    for (const p of selectedPanels) {
      const seg = data.segments.find((s) => s.id === p.segmentIndex);
      if (!seg) continue;
      const rect = computePanelPolygonLL(p, data.panelDimensions, seg);
      if (!rect) continue;
      const poly = new g.maps.Polygon({
        paths: rect,
        strokeColor: "#111827",
        strokeOpacity: 0.9,
        strokeWeight: 0.5,
        fillColor: "#111827",
        fillOpacity: 0.88,
        clickable: false,
        zIndex: 20,
      });
      poly.setMap(map);
      panelPolysRef.current.push(poly);
    }
  }, [selectedPanels, data.segments, data.panelDimensions]);

  return (
    <div
      style={{
        width: "100%",
        height: 520,
        position: "relative",
        ...(style || {}),
      }}
    >
      {showToolbar && (
        <div
          style={{
            position: "absolute",
            zIndex: 10,
            top: 10,
            left: 10,
            right: 10,
            display: "flex",
            gap: 12,
            alignItems: "center",
            padding: "8px 12px",
            borderRadius: 12,
            background: "rgba(255,255,255,0.9)",
            boxShadow: "0 6px 24px rgba(0,0,0,0.12)",
            backdropFilter: "blur(6px)",
          }}
        >
          <label
            style={{ fontSize: 12, color: "#111827", whiteSpace: "nowrap" }}
          >
            Panels:
          </label>
          <input
            type="range"
            min={0}
            max={maxPanels}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            style={{ flex: 1 }}
          />
          <div
            style={{
              fontVariantNumeric: "tabular-nums",
              minWidth: 48,
              textAlign: "right",
            }}
          >
            {count}/{maxPanels}
          </div>
          <div
            style={{
              width: 1,
              alignSelf: "stretch",
              background: "#e5e7eb",
              marginInline: 8,
            }}
          />
          <small style={{ color: "#6b7280" }}>
            Order: {panelOrder === "yield" ? "Top yield first" : "As provided"}
          </small>
        </div>
      )}

      {showImageryIndicator && (
        <div
          style={{
            position: "absolute",
            zIndex: 10,
            bottom: 10,
            left: 10,
            padding: "6px 12px",
            borderRadius: 8,
            background: "rgba(255,255,255,0.9)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            backdropFilter: "blur(4px)",
            fontSize: 12,
            color: "#374151",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: usingRgbOverlay ? "#10b981" : "#6b7280",
            }}
          />
          {usingRgbOverlay ? "Solar API RGB" : "Maps Satellite"}
        </div>
      )}

      <div ref={mapDivRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
