// Géométrie propre aux PAC et ITE : position de l'unité, distances aux limites de propriété.
import type { EnrichmentResult, PacInfo } from "@/lib/types";
import { facadesOf, type Facade } from "@/lib/geo/facades";
import { outerRing, toL93 } from "@/lib/geo/proj";

export function mainBuildingOf(e?: EnrichmentResult) {
  return e?.buildings.find((b) => b.id === e.mainBuildingId);
}

export function projectFacades(e?: EnrichmentResult): Facade[] {
  const b = mainBuildingOf(e);
  return b ? facadesOf(b) : [];
}

function segDist(p: [number, number], a: number[], b: number[]) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const L2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2));
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}

/** distance (m) d'un point L93 à la limite de la parcelle principale */
export function distanceToLimit(e: EnrichmentResult | undefined, p: [number, number]): number | undefined {
  const parcel = e?.parcels[0];
  if (!parcel) return undefined;
  const ring = outerRing(parcel.geometry).map(toL93);
  let d = Infinity;
  for (let i = 0; i < ring.length - 1; i++) d = Math.min(d, segDist(p, ring[i], ring[i + 1]));
  return Number.isFinite(d) ? Math.round(d * 10) / 10 : undefined;
}

/** normale extérieure unitaire d'une façade */
export function outward(f: Facade): [number, number] {
  const dx = f.b[0] - f.a[0], dy = f.b[1] - f.a[1], L = Math.hypot(dx, dy) || 1;
  const n1: [number, number] = [dy / L, -dx / L];
  const az = (f.azimuthDeg * Math.PI) / 180;
  const want: [number, number] = [Math.sin(az), Math.cos(az)];
  return n1[0] * want[0] + n1[1] * want[1] >= 0 ? n1 : [-n1[0], -n1[1]];
}

/** position L93 de l'unité extérieure */
export function pacPoint(e: EnrichmentResult | undefined, pac: PacInfo): [number, number] | undefined {
  const f = projectFacades(e)[pac.facadeIndex];
  if (!f) return undefined;
  const n = outward(f);
  const off = pac.placement.startsWith("sol") ? 0.8 : 0.3;
  const r = Math.max(0.05, Math.min(0.95, pac.positionRatio));
  return [f.a[0] + (f.b[0] - f.a[0]) * r + n[0] * off, f.a[1] + (f.b[1] - f.a[1]) * r + n[1] * off];
}

/** distance minimale aux limites après pose de l'isolant sur les façades choisies */
export function iteMinDistance(e: EnrichmentResult | undefined, facadeIndexes: number[], thicknessCm: number): number | undefined {
  const fs = projectFacades(e).filter((f) => facadeIndexes.includes(f.index));
  let best: number | undefined;
  for (const f of fs) {
    const n = outward(f);
    for (let k = 0; k <= 8; k++) {
      const p: [number, number] = [f.a[0] + ((f.b[0] - f.a[0]) * k) / 8 + n[0] * 0.05, f.a[1] + ((f.b[1] - f.a[1]) * k) / 8 + n[1] * 0.05];
      const d = distanceToLimit(e, p);
      if (d !== undefined) best = best === undefined ? d : Math.min(best, d);
    }
  }
  return best === undefined ? undefined : Math.max(0, Math.round((best - thicknessCm / 100) * 100) / 100);
}

/** façade proposée par défaut pour l'unité PAC : celle qui l'éloigne le plus des limites (bruit de voisinage) */
export function bestPacFacade(e: EnrichmentResult | undefined, pac: PacInfo): number {
  let best = pac.facadeIndex, bestD = -1;
  for (const f of projectFacades(e)) {
    const pt = pacPoint(e, { ...pac, facadeIndex: f.index, positionRatio: 0.5 });
    const d = pt ? distanceToLimit(e, pt) ?? 0 : 0;
    if (d > bestD) {
      bestD = d;
      best = f.index;
    }
  }
  return best;
}

/** point le plus proche sur la limite de la parcelle principale */
export function nearestOnLimit(e: EnrichmentResult | undefined, p: [number, number]): [number, number] | undefined {
  const parcel = e?.parcels[0];
  if (!parcel) return undefined;
  const ring = outerRing(parcel.geometry).map(toL93);
  let best: [number, number] | undefined, bd = Infinity;
  for (let i = 0; i < ring.length - 1; i++) {
    const a = ring[i], b = ring[i + 1];
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1)));
    const q: [number, number] = [a[0] + t * dx, a[1] + t * dy];
    const d = Math.hypot(p[0] - q[0], p[1] - q[1]);
    if (d < bd) {
      bd = d;
      best = q;
    }
  }
  return best;
}
