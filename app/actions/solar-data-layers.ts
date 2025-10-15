"use server";

import type { LatLng } from "@/lib/solar-types";

type Quality = "BASE" | "MEDIUM" | "HIGH";

export interface DataLayersOptions {
  radiusMeters?: number;
  pixelSizeMeters?: number;
  quality?: Quality;
  forceRefresh?: boolean;
}

export interface DataLayersResult {
  geohash8: string;
  quality: Quality;
  radiusMeters: number;
  pixelSizeMeters: number;
  annualFluxPath?: string;
  maskPath?: string;
  dsmPath?: string;
  /** Remote URLs returned by Solar API (may expire); useful for client overlays */
  annualFluxUrl?: string;
  maskUrl?: string;
  dsmUrl?: string;
  rgbUrl?: string;
  fromCache: boolean;
}

async function downloadToFile(url: string, outPath: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed download ${url}: ${res.status}`);
  const ab = await res.arrayBuffer();
  const buf = Buffer.from(ab);
  const { writeFileBinary } = await import("@/lib/solar-cache");
  await writeFileBinary(outPath, buf);
}

export async function fetchDataLayers(
  lat: number,
  lng: number,
  opts?: DataLayersOptions
): Promise<DataLayersResult> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error("API key not configured");
  }

  const { default: ngeohash } = await import("ngeohash");
  const geohash8 = (ngeohash as any).encode(lat, lng, 8) as string;
  const radiusMeters = opts?.radiusMeters ?? 80;
  const pixelSizeMeters = opts?.pixelSizeMeters ?? 0.5;
  const quality: Quality = opts?.quality ?? "MEDIUM";

  const { buildDlKey, fileExists, getCacheRoot } = await import(
    "@/lib/solar-cache"
  );
  await getCacheRoot();
  const key = buildDlKey(geohash8, quality, radiusMeters, pixelSizeMeters);
  const annualFluxPath = key.annualFluxPath();
  const maskPath = key.maskPath();
  const dsmPath = key.dsmPath();

  const allExist =
    (await fileExists(annualFluxPath)) &&
    (await fileExists(maskPath)) &&
    (await fileExists(dsmPath));

  if (allExist && !opts?.forceRefresh) {
    return {
      geohash8,
      quality,
      radiusMeters,
      pixelSizeMeters,
      annualFluxPath,
      maskPath,
      dsmPath,
      fromCache: true,
    };
  }

  const url = `https://solar.googleapis.com/v1/dataLayers:get?location.latitude=${lat}&location.longitude=${lng}&radiusMeters=${radiusMeters}&view=FULL_LAYERS&requiredQuality=${quality}&pixelSizeMeters=${pixelSizeMeters}&key=${apiKey}`;
  const response = await fetch(url, { method: "GET" });
  if (!response.ok) {
    const errText = await response.text();
    console.error("[solar] dataLayers:get error:", errText);
    throw new Error("Failed to fetch Data Layers");
  }
  const data = await response.json();

  const dlAnnualFluxUrl: string | undefined = data?.annualFluxUrl;
  const dlMaskUrl: string | undefined = data?.maskUrl;
  const dlDsmUrl: string | undefined = data?.dsmUrl;
  const dlRgbUrl: string | undefined = data?.rgbUrl;

  // Download in parallel when available
  const downloads: Promise<void>[] = [];
  if (dlAnnualFluxUrl)
    downloads.push(downloadToFile(dlAnnualFluxUrl, annualFluxPath));
  if (dlMaskUrl) downloads.push(downloadToFile(dlMaskUrl, maskPath));
  if (dlDsmUrl) downloads.push(downloadToFile(dlDsmUrl, dsmPath));
  await Promise.allSettled(downloads);

  return {
    geohash8,
    quality,
    radiusMeters,
    pixelSizeMeters,
    annualFluxPath: (await fileExists(annualFluxPath))
      ? annualFluxPath
      : undefined,
    maskPath: (await fileExists(maskPath)) ? maskPath : undefined,
    dsmPath: (await fileExists(dsmPath)) ? dsmPath : undefined,
    annualFluxUrl: dlAnnualFluxUrl,
    maskUrl: dlMaskUrl,
    dsmUrl: dlDsmUrl,
    rgbUrl: dlRgbUrl,
    fromCache: false,
  };
}

async function sampleFluxFromTiff(
  filePath: string,
  coords: LatLng[]
): Promise<number[]> {
  const { readFile } = await import("fs/promises");
  const buf = await readFile(filePath);
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteLength + buf.byteOffset);
  const geo = await (await import("geotiff")).fromArrayBuffer(ab);
  const image = await geo.getImage();
  const width = image.getWidth();
  const height = image.getHeight();
  const bbox = image.getBoundingBox(); // [minX, minY, maxX, maxY] in degrees/mercator
  const minX = bbox[0];
  const minY = bbox[1];
  const maxX = bbox[2];
  const maxY = bbox[3];

  // Read single band, interleaved
  const raster = (await image.readRasters({ interleave: true })) as
    | Float32Array
    | Uint16Array
    | Uint8Array
    | Int16Array
    | Int32Array
    | Float64Array;

  const toPixel = (lat: number, lng: number) => {
    const x = Math.floor(((lng - minX) / (maxX - minX)) * width);
    const y = Math.floor(((maxY - lat) / (maxY - minY)) * height);
    const xi = Math.max(0, Math.min(width - 1, x));
    const yi = Math.max(0, Math.min(height - 1, y));
    return [xi, yi] as const;
  };

  const values: number[] = [];
  for (const p of coords) {
    const [px, py] = toPixel(p.lat, p.lng);
    const idx = py * width + px;
    const v = (raster as any)[idx];
    values.push(typeof v === "number" ? v : Number(v));
  }
  return values;
}

export async function sampleAnnualFluxAtPoints(
  tiffPath: string,
  points: LatLng[]
): Promise<number[]> {
  return sampleFluxFromTiff(tiffPath, points);
}
