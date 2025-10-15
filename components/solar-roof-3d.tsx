"use client";

import React, { useMemo, useState, useEffect } from "react";
import * as THREE from "three";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type {
  LatLng,
  Segment,
  SolarPanelPlacement,
  PanelDimensions,
  SolarViewData,
} from "@/lib/solar-types";

export type {
  LatLng,
  Segment,
  SolarPanelPlacement,
  PanelDimensions,
  SolarViewData,
};

export type SolarRoof3DProps = {
  data: SolarViewData;
  panelCount?: number;
  defaultPanelCount?: number;
  onPanelCountChange?: (n: number) => void;
  style?: React.CSSProperties;
  showToolbar?: boolean;
  verticalExaggeration?: number;
  panelOrder?: "yield" | "as-is";
};

const METERS_PER_DEG_LAT = 111_132;

function metersPerDegLon(latDeg: number) {
  const latRad = THREE.MathUtils.degToRad(latDeg);
  return 111_320 * Math.cos(latRad);
}

function llToLocalMeters(p: LatLng, origin: LatLng): THREE.Vector3 {
  const x = (p.lng - origin.lng) * metersPerDegLon(origin.lat);
  const z = (p.lat - origin.lat) * METERS_PER_DEG_LAT;
  return new THREE.Vector3(x, 0, z);
}

function buildPlaneAxes(tiltDeg: number, azimuthDeg: number) {
  const t = THREE.MathUtils.degToRad(tiltDeg);
  const a = THREE.MathUtils.degToRad(azimuthDeg);

  const slopeH = new THREE.Vector3(Math.sin(a), 0, Math.cos(a)).normalize();
  const up = new THREE.Vector3(0, 1, 0);

  const n = slopeH
    .clone()
    .multiplyScalar(Math.sin(t))
    .addScaledVector(up, Math.cos(t))
    .normalize();

  const d = slopeH
    .clone()
    .multiplyScalar(Math.cos(t))
    .addScaledVector(up, -Math.sin(t))
    .normalize();

  const c = new THREE.Vector3().crossVectors(d, n).normalize();

  return { n, d, c, slopeH, tiltRad: t };
}

type SegmentBasis = {
  id: number;
  axes: ReturnType<typeof buildPlaneAxes>;
  originWorld: THREE.Vector3;
  heightAtCenter: number;
  mat: THREE.Matrix4;
  rect: {
    centerUV: { u: number; v: number };
    widthU: number;
    heightV: number;
  };
  /** Optional polygon of the segment in UV-space (projected from bounding box) */
  polygonUV?: { u: number; v: number }[];
  /** Centroid in UV-space for positioning polygonal meshes */
  centroidUV?: { u: number; v: number };
  hidden?: boolean;
};

function worldToPlaneUV(
  segmentBasis: SegmentBasis,
  pLL: LatLng,
  globalOrigin: LatLng
) {
  const { originWorld, axes } = segmentBasis;
  const tiltRad = axes.tiltRad;
  const pWorld = llToLocalMeters(pLL, globalOrigin);

  const rH = new THREE.Vector3().subVectors(pWorld, originWorld);
  rH.y = 0;

  const u = rH.dot(axes.c);
  const vH = rH.dot(axes.slopeH);
  const v = vH / Math.max(Math.cos(tiltRad), 1e-6);

  const deltaY = -vH * Math.tan(tiltRad);
  const y = segmentBasis.heightAtCenter + deltaY;

  return { u, v, y };
}

function computeOrigin(data: SolarViewData): LatLng {
  if (data.origin) return data.origin;
  const centers = data.segments.map((s) => s.center);
  const lat =
    centers.reduce((acc, p) => acc + p.lat, 0) / Math.max(centers.length, 1);
  const lng =
    centers.reduce((acc, p) => acc + p.lng, 0) / Math.max(centers.length, 1);
  return { lat, lng };
}

function segmentRect(
  seg: Segment,
  basis: { axes: ReturnType<typeof buildPlaneAxes> },
  origin: LatLng,
  panelCenters?: LatLng[],
  areaHint?: number,
  panelDims?: PanelDimensions
) {
  if (seg.boundingBox && seg.boundingBox.length >= 3) {
    const uv = seg.boundingBox.map((ll) => {
      const pWorld = llToLocalMeters(ll, origin);
      const r = pWorld.clone().sub(llToLocalMeters(seg.center, origin));
      const u = r.dot(basis.axes.c);
      const vH = r.dot(basis.axes.slopeH);
      const v = vH / Math.max(Math.cos(basis.axes.tiltRad), 1e-6);
      return { u, v };
    });
    // Also include panel center extents if available for a tighter fit
    const panelUV = (panelCenters || []).map((ll) => {
      const pWorld = llToLocalMeters(ll, origin);
      const r = pWorld.clone().sub(llToLocalMeters(seg.center, origin));
      const u = r.dot(basis.axes.c);
      const vH = r.dot(basis.axes.slopeH);
      const v = vH / Math.max(Math.cos(basis.axes.tiltRad), 1e-6);
      return { u, v };
    });

    const all = [...uv, ...panelUV];
    const uMin = Math.min(...all.map((p) => p.u));
    const uMax = Math.max(...all.map((p) => p.u));
    const vMin = Math.min(...all.map((p) => p.v));
    const vMax = Math.max(...all.map((p) => p.v));

    let widthU = Math.max(0.5, uMax - uMin);
    let heightV = Math.max(0.5, vMax - vMin);

    // Add safety margins based on panel dimensions
    if (panelDims) {
      const marginU = Math.max(0.2, panelDims.widthMeters * 0.3);
      const marginV = Math.max(0.2, panelDims.heightMeters * 0.3);
      widthU += marginU * 2;
      heightV += marginV * 2;
    }

    // If we have a rough area hint, gently scale the rectangle to match
    if (areaHint && widthU > 0 && heightV > 0) {
      const currentArea = widthU * heightV;
      const scale = Math.sqrt(areaHint / currentArea);
      const s = THREE.MathUtils.clamp(scale, 0.5, 2.0);
      widthU *= s;
      heightV *= s;
    }

    // Compute centroid for polygon and apply a tiny uniform expansion
    const centroid = {
      u: all.reduce((a, p) => a + p.u, 0) / Math.max(all.length, 1),
      v: all.reduce((a, p) => a + p.v, 0) / Math.max(all.length, 1),
    };
    const expand = 0.04; // ~4 cm to hide tiny gaps
    const polygonUV = uv.map((p) => ({
      u:
        centroid.u + (p.u - centroid.u) * (1 + expand / Math.max(widthU, 1e-3)),
      v:
        centroid.v +
        (p.v - centroid.v) * (1 + expand / Math.max(heightV, 1e-3)),
    }));

    return {
      centerUV: { u: (uMin + uMax) / 2, v: (vMin + vMax) / 2 },
      widthU,
      heightV,
      polygonUV,
      centroidUV: centroid,
    } as any;
  }

  const a = Math.max(seg.areaMeters2 ?? 16, 1);
  const s = Math.sqrt(a);
  return {
    centerUV: { u: 0, v: 0 },
    widthU: s,
    heightV: s,
  };
}

function useSegmentBases(
  data: SolarViewData,
  globalOrigin: LatLng,
  verticalExaggeration: number,
  options?: { hideSteepSegments?: boolean }
): SegmentBasis[] {
  return useMemo(() => {
    const heights = data.segments.map((s) => s.planeHeightAtCenterMeters ?? 0);
    const minHeight = heights.length ? Math.min(...heights) : 0;
    // Pre-index panel centers by segment for tighter fits
    const panelsBySeg = new Map<number, LatLng[]>();
    for (const p of data.panels) {
      if (!panelsBySeg.has(p.segmentIndex)) panelsBySeg.set(p.segmentIndex, []);
      panelsBySeg.get(p.segmentIndex)!.push(p.center);
    }
    return data.segments.map((seg) => {
      const axes = buildPlaneAxes(seg.tiltDegrees, seg.azimuthDegrees);
      const centerWorld = llToLocalMeters(seg.center, globalOrigin);
      // Normalize absolute elevation to keep the model near y=0
      const heightAtCenter =
        ((seg.planeHeightAtCenterMeters ?? 0) - minHeight) *
        verticalExaggeration;

      const mat = new THREE.Matrix4().makeBasis(axes.c, axes.d, axes.n);
      const pos = new THREE.Vector3(
        centerWorld.x,
        heightAtCenter,
        centerWorld.z
      );
      mat.setPosition(pos);

      const rect = segmentRect(
        seg,
        { axes },
        globalOrigin,
        panelsBySeg.get(seg.id),
        seg.areaMeters2,
        data.panelDimensions
      );

      // Heuristics: hide near-vertical or tiny/sliver segments
      const isSteep = Math.abs(seg.tiltDegrees) >= 65;
      const minDim = Math.min(rect.widthU, rect.heightV);
      const aspect =
        Math.max(rect.widthU, rect.heightV) / Math.max(minDim, 1e-3);
      const tooSmall = (seg.areaMeters2 ?? rect.widthU * rect.heightV) < 4;
      const sliver = aspect > 10 && minDim < 0.6;
      const hideSteep = options?.hideSteepSegments ?? true;
      const hidden = (hideSteep && isSteep) || tooSmall || sliver;

      return {
        id: seg.id,
        axes,
        originWorld: centerWorld.setY(0),
        heightAtCenter,
        mat,
        rect,
        polygonUV: (rect as any).polygonUV,
        centroidUV: (rect as any).centroidUV ?? rect.centerUV,
        hidden,
      } as SegmentBasis;
    });
  }, [
    data.segments,
    data.panels,
    globalOrigin.lat,
    globalOrigin.lng,
    verticalExaggeration,
    options?.hideSteepSegments,
  ]);
}

function RoofSegmentMesh({
  basis,
  color = "#9aa5b1",
}: {
  basis: SegmentBasis;
  color?: string;
}) {
  if (basis.hidden) return null;
  const { rect, polygonUV, centroidUV } = basis;
  const thickness = 0.12;

  // Build geometry once
  const { geom, edgesGeom, pos } = React.useMemo(() => {
    // Use polygon if available for better fit; fall back to rectangle box
    if (polygonUV && polygonUV.length >= 3 && centroidUV) {
      const pts = polygonUV.map(
        (p) => new THREE.Vector2(p.u - centroidUV.u, p.v - centroidUV.v)
      );
      // Ensure CCW orientation (positive area)
      const area = pts.reduce((a, p, i) => {
        const q = pts[(i + 1) % pts.length];
        return a + (p.x * q.y - q.x * p.y);
      }, 0);
      if (area < 0) pts.reverse();
      const shape = new THREE.Shape(pts);
      const g = new THREE.ExtrudeGeometry(shape, {
        depth: thickness,
        bevelEnabled: false,
      });
      const eg = new THREE.EdgesGeometry(g);
      return {
        geom: g,
        edgesGeom: eg,
        pos: [centroidUV.u, centroidUV.v, -thickness] as const,
      };
    }
    const g = new THREE.BoxGeometry(rect.widthU, rect.heightV, thickness);
    const eg = new THREE.EdgesGeometry(g);
    return {
      geom: g,
      edgesGeom: eg,
      pos: [rect.centerUV.u, rect.centerUV.v, -thickness / 2] as const,
    };
  }, [
    polygonUV,
    centroidUV,
    rect.widthU,
    rect.heightV,
    rect.centerUV.u,
    rect.centerUV.v,
  ]);

  return (
    <group matrixAutoUpdate={false} matrix={basis.mat}>
      <mesh position={pos} geometry={geom}>
        <meshStandardMaterial color={color} metalness={0.15} roughness={0.85} />
      </mesh>
      <lineSegments position={pos} geometry={edgesGeom}>
        <lineBasicMaterial attach="material" color="#6b7280" />
      </lineSegments>
    </group>
  );
}

function PanelMesh({
  basis,
  panel,
  dims,
  color = "#111827",
}: {
  basis: SegmentBasis;
  panel: SolarPanelPlacement;
  dims: PanelDimensions;
  color?: string;
}) {
  if (basis.hidden) return null;
  const thickness = dims.thicknessMeters ?? 0.035;

  const { u, v } = worldToPlaneUV(basis, panel.center, GLOBAL_ORIGIN.current);

  const isPortrait = panel.orientation !== "LANDSCAPE";
  const widthU = isPortrait ? dims.widthMeters : dims.heightMeters;
  const heightV = isPortrait ? dims.heightMeters : dims.widthMeters;

  const w = thickness / 2 + 0.012;

  return (
    <group matrixAutoUpdate={false} matrix={basis.mat} position={[0, 0, 0]}>
      <mesh position={[u, v, w]}>
        <boxGeometry args={[widthU, heightV, thickness]} />
        <meshStandardMaterial color={color} metalness={0.2} roughness={0.6} />
      </mesh>
      <mesh position={[u, v, w + thickness / 2 + 0.001]}>
        <planeGeometry args={[widthU * 0.98, heightV * 0.98]} />
        <meshStandardMaterial color="#374151" />
      </mesh>
    </group>
  );
}

const GLOBAL_ORIGIN = { current: { lat: 0, lng: 0 } as LatLng };

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

export function SolarRoof3D({
  data,
  panelCount,
  defaultPanelCount = 0,
  onPanelCountChange,
  style,
  showToolbar = true,
  verticalExaggeration = 1.0,
  panelOrder = "yield",
}: SolarRoof3DProps) {
  const origin = useMemo(() => computeOrigin(data), [data]);
  GLOBAL_ORIGIN.current = origin;

  const [internalCount, setInternalCount] = useState<number>(defaultPanelCount);
  const controlled = typeof panelCount === "number";
  const count = controlled ? (panelCount as number) : internalCount;

  const bases = useSegmentBases(data, origin, verticalExaggeration, {
    hideSteepSegments: true,
  });

  useMemo(() => {
    const _ = new Map<number, SolarPanelPlacement[]>();
    for (const p of data.panels) {
      if (!_.has(p.segmentIndex)) _.set(p.segmentIndex, []);
      _.get(p.segmentIndex)!.push(p);
    }
    return _;
  }, [data.panels]);

  const selected = useMemo(
    () => selectPanels(data.panels, panelOrder, count),
    [data.panels, panelOrder, count]
  );

  const maxPanels = data.panels.length;

  const setCount = (n: number) => {
    const clamped = Math.max(0, Math.min(maxPanels, Math.round(n)));
    if (!controlled) setInternalCount(clamped);
    onPanelCountChange?.(clamped);
  };

  // Flux range for coloring
  const fluxRange = useMemo(() => {
    const vals = data.segments
      .map((s) => s.avgFluxWm2)
      .filter((v): v is number => typeof v === "number");
    if (!vals.length) return null as null | { min: number; max: number };
    return { min: Math.min(...vals), max: Math.max(...vals) };
  }, [data.segments]);

  const fluxById = useMemo(() => {
    const m = new Map<number, number | undefined>();
    for (const s of data.segments) m.set(s.id, s.avgFluxWm2);
    return m;
  }, [data.segments]);

  function fluxToColor(v: number | undefined): string | undefined {
    if (v == null || !fluxRange) return undefined;
    const { min, max } = fluxRange;
    const t = max > min ? (v - min) / (max - min) : 0.5;
    // Map t in [0,1] to HSL hue 210 (blue) -> 50 (yellow)
    const hue = 210 + (50 - 210) * t;
    const s = 70;
    const l = 55;
    return `hsl(${hue}, ${s}%, ${l}%)`;
  }

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

      <Canvas
        dpr={[1, 2]}
        camera={{ position: [30, 35, 55], fov: 45, near: 0.1, far: 2000 }}
        onCreated={(st) => {
          st.gl.setClearColor("#f8fafc");
          st.gl.outputColorSpace = THREE.SRGBColorSpace;
          st.scene.fog = new THREE.Fog("#f8fafc", 120, 240);
        }}
      >
        <ambientLight intensity={0.55} />
        <directionalLight position={[50, 80, 40]} intensity={0.9} castShadow />

        <gridHelper args={[120, 24]} position={[0, 0, 0]} />
        <axesHelper args={[2]} />

        {bases.map((b) => (
          <RoofSegmentMesh
            key={b.id}
            basis={b}
            color={fluxToColor(fluxById.get(b.id))}
          />
        ))}

        {selected.map((p) => {
          const segBasis = bases.find((b) => b.id === p.segmentIndex);
          if (!segBasis) return null;
          return (
            <PanelMesh
              key={p.id}
              basis={segBasis}
              panel={p}
              dims={data.panelDimensions}
            />
          );
        })}

        <OrbitControls makeDefault enableDamping dampingFactor={0.08} />
        {/* Optional: auto-fit camera to roof bounds for better initial framing */}
        {false && null}
      </Canvas>
    </div>
  );
}
