// Façades d'un bâtiment à partir du rectangle d'emprise orienté (BD TOPO) : longueur, orientation, coordonnées.
import type { BuildingInfo } from "@/lib/types";
import { bearingOf, minAreaRect, outerRing, toL93 } from "./proj";
import { orientationLabel } from "./roof";

export interface Facade {
  index: number;
  a: [number, number]; // L93
  b: [number, number];
  lengthM: number;
  /** azimut de la normale extérieure */
  azimuthDeg: number;
  label: string;
  /** façade le long du faîtage (long côté) */
  isLong: boolean;
}

export function facadesOf(b: BuildingInfo): Facade[] {
  const rect = minAreaRect(outerRing(b.geometry).map(toL93));
  const c = rect.center;
  const list = rect.corners.map((a, i) => {
    const bb = rect.corners[(i + 1) % 4];
    const mx = (a[0] + bb[0]) / 2 - c[0], my = (a[1] + bb[1]) / 2 - c[1];
    const len = Math.hypot(bb[0] - a[0], bb[1] - a[1]);
    const az = Math.round(bearingOf(mx, my));
    return { index: i, a, b: bb, lengthM: Math.round(len * 10) / 10, azimuthDeg: az, label: `Façade ${orientationLabel(az).toLowerCase()}`, isLong: Math.abs(len - rect.length) < 0.05 };
  });
  return list;
}
