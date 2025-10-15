import fs from "fs";
import path from "path";
import { promises as fsp } from "fs";

const CACHE_ROOT = path.join(process.cwd(), ".cache", "solar");

export type CacheInfo = {
  path: string;
  exists: boolean;
  ageMs?: number;
};

async function ensureDir(dirPath: string) {
  await fsp.mkdir(dirPath, { recursive: true });
}

export async function getCacheRoot(): Promise<string> {
  await ensureDir(CACHE_ROOT);
  return CACHE_ROOT;
}

export async function statPath(p: string): Promise<CacheInfo> {
  try {
    const st = await fsp.stat(p);
    return { path: p, exists: true, ageMs: Date.now() - st.mtimeMs };
  } catch {
    return { path: p, exists: false };
  }
}

export async function readJsonIfFresh<T>(
  filePath: string,
  maxAgeMs: number
): Promise<T | null> {
  const info = await statPath(filePath);
  if (!info.exists) return null;
  if (typeof info.ageMs === "number" && info.ageMs > maxAgeMs) return null;
  try {
    const raw = await fsp.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function writeJson(filePath: string, data: unknown) {
  await ensureDir(path.dirname(filePath));
  await fsp.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}

export async function fileExists(p: string): Promise<boolean> {
  try {
    await fsp.access(p, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function writeFileBinary(filePath: string, buf: Buffer) {
  await ensureDir(path.dirname(filePath));
  await fsp.writeFile(filePath, buf);
}

export function buildDlKey(
  geohash8: string,
  quality: "BASE" | "MEDIUM" | "HIGH",
  radiusMeters: number,
  pixelSizeMeters: number
) {
  // Folder per location, param-qualified filenames to allow multiple variants
  return {
    dir: path.join(CACHE_ROOT, "dl", geohash8),
    annualFluxPath: (name = "annual-flux") =>
      path.join(
        CACHE_ROOT,
        "dl",
        geohash8,
        `${name}_q-${quality}_r-${radiusMeters}_px-${pixelSizeMeters}.tif`
      ),
    maskPath: () =>
      path.join(
        CACHE_ROOT,
        "dl",
        geohash8,
        `mask_q-${quality}_r-${radiusMeters}_px-${pixelSizeMeters}.tif`
      ),
    dsmPath: () =>
      path.join(
        CACHE_ROOT,
        "dl",
        geohash8,
        `dsm_q-${quality}_r-${radiusMeters}_px-${pixelSizeMeters}.tif`
      ),
  };
}

export function buildBiPath(geohash8: string, quality: string = "MEDIUM") {
  return path.join(CACHE_ROOT, "bi", `${geohash8}_q-${quality}.json`);
}


