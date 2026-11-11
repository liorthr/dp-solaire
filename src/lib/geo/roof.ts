// Estimation des pans de toiture à partir de l'emprise BD TOPO (hypothèse : toiture à deux pans, faîtage selon le grand côté).
// Valeurs estimées, toujours modifiables par l'installateur.
import type { BuildingInfo, RoofPlane } from "@/lib/types";
import { bearingOf, fromL93, minAreaRect, outerRing, toL93 } from "./proj";

export const DEFAULT_TILT = 35;

export interface RoofEstimate {
  planes: RoofPlane[];
  ridgeLengthM: number;
  spanM: number;
  gutterHeightM: number;
  ridgeHeightM: number;
  tiltDeg: number;
  tiltSource: "bdtopo" | "defaut";
  rect: ReturnType<typeof minAreaRect>;
}

export function estimateRoof(b: BuildingInfo): RoofEstimate {
  const ring = outerRing(b.geometry).map(toL93);
  const rect = minAreaRect(ring);
  const half = rect.width / 2;
  let tilt = DEFAULT_TILT;
  let tiltSource: RoofEstimate["tiltSource"] = "defaut";
  if (b.altitudeToitMax !== undefined && b.altitudeToitMin !== undefined) {
    const dh = b.altitudeToitMax - b.altitudeToitMin;
    const t = (Math.atan2(dh, half) * 180) / Math.PI;
    if (t >= 12 && t <= 60) {
      tilt = Math.round(t);
      tiltSource = "bdtopo";
    }
  }
  const slope = half / Math.cos((tilt * Math.PI) / 180);
  const ridgeRise = half * Math.tan((tilt * Math.PI) / 180);
  const total = b.heightM ?? 6;
  const gutter = Math.max(2.2, total - ridgeRise);

  // normales des deux pans : perpendiculaires au faîtage
  const ux = Math.cos(rect.angle), uy = Math.sin(rect.angle); // direction du faîtage
  const n1: [number, number] = [-uy, ux];
  const n2: [number, number] = [uy, -ux];
  const mk = (n: [number, number], idx: number): RoofPlane => {
    const az = Math.round(bearingOf(n[0], n[1]));
    const [cx, cy] = rect.center;
    const L = rect.length / 2;
    const ridgeA: [number, number] = [cx - ux * L, cy - uy * L];
    const ridgeB: [number, number] = [cx + ux * L, cy + uy * L];
    const eaveA: [number, number] = [ridgeA[0] + n[0] * half, ridgeA[1] + n[1] * half];
    const eaveB: [number, number] = [ridgeB[0] + n[0] * half, ridgeB[1] + n[1] * half];
    return {
      id: `pan-${idx}`,
      label: `Pan ${orientationLabel(az)}`,
      azimuthDeg: az,
      tiltDeg: tilt,
      widthM: round1(rect.length),
      slopeLengthM: round1(slope),
      covering: "tuile_terre_cuite",
      polygon: { type: "Polygon", coordinates: [[eaveA, eaveB, ridgeB, ridgeA, eaveA].map((p) => fromL93(p))] },
    };
  };
  const planes = [mk(n1, 1), mk(n2, 2)].sort((a, b) => southDev(a.azimuthDeg) - southDev(b.azimuthDeg));
  return { planes, ridgeLengthM: round1(rect.length), spanM: round1(rect.width), gutterHeightM: round1(gutter), ridgeHeightM: round1(gutter + ridgeRise), tiltDeg: tilt, tiltSource, rect };
}

export const southDev = (az: number) => Math.abs(((az - 180 + 540) % 360) - 180);
const round1 = (n: number) => Math.round(n * 10) / 10;

export function orientationLabel(az: number): string {
  const dirs = ["Nord", "Nord-Est", "Est", "Sud-Est", "Sud", "Sud-Ouest", "Ouest", "Nord-Ouest"];
  return dirs[Math.round((((az % 360) + 360) % 360) / 45) % 8];
}
