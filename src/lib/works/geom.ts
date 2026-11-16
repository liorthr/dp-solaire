// Géométrie propre aux PAC et ITE : position de l'unité, distances aux limites de propriété.
import type { EnrichmentResult, JoineryItem, PacInfo, Project, PvLayout, RoofWindowItem } from "@/lib/types";
import { JOINERY_KINDS, ROOF_WINDOW_MODELS } from "@/data/works";
import { panelsGround } from "@/lib/plans/dp";
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

/** extrémités gauche / droite d'une façade pour un observateur placé dehors, face au mur */
export function facadeLeftRight(f: Facade): [[number, number], [number, number]] {
  const nv = outward(f);
  const left: [number, number] = [nv[1], -nv[0]]; // à gauche du regard (regard = -normale)
  const d = [f.b[0] - f.a[0], f.b[1] - f.a[1]];
  return d[0] * left[0] + d[1] * left[1] > 0 ? [f.b as [number, number], f.a as [number, number]] : [f.a as [number, number], f.b as [number, number]];
}

/** position L93 du milieu d'une ouverture (xM depuis le coin gauche vu de dehors), légèrement à l'extérieur du mur */
export function joineryPoint(f: Facade, xM: number, widthM: number): [number, number] {
  const [L, R] = facadeLeftRight(f);
  const nv = outward(f);
  const t = Math.max(0, Math.min(1, (xM + widthM / 2) / (f.lengthM || 1)));
  return [L[0] + (R[0] - L[0]) * t + nv[0] * 0.05, L[1] + (R[1] - L[1]) * t + nv[1] * 0.05];
}

/** distance minimale des ouvertures créées à la limite */
export function joineryMinDistance(e: EnrichmentResult | undefined, items: JoineryItem[]): number | undefined {
  const fs = projectFacades(e);
  let best: number | undefined;
  for (const it of items.filter((i) => i.isNew)) {
    const f = fs[it.facadeIndex];
    if (!f) continue;
    const d = distanceToLimit(e, joineryPoint(f, it.xM, it.widthM));
    if (d !== undefined) best = best === undefined ? d : Math.min(best, d);
  }
  return best;
}

/** emprises au sol (L93) des fenêtres de toit */
export function roofWindowsGround(p: Project): { item: RoofWindowItem; ring: [number, number][] }[] {
  const v = p.velux;
  if (!v) return [];
  const m = ROOF_WINDOW_MODELS.find((x) => x.id === v.modelId) ?? ROOF_WINDOW_MODELS[0];
  const out: { item: RoofWindowItem; ring: [number, number][] }[] = [];
  for (const it of v.items) {
    const rp = p.pv.roofPlanes.find((r) => r.id === it.roofPlaneId);
    if (!rp) continue;
    const ring = panelsGround(rp, { roofPlaneId: rp.id, orientation: "portrait", panels: [{ x: it.x, y: it.y, w: m.widthMm / 1000, h: m.heightMm / 1000 }], marginEdgeM: 0, marginGutterM: 0, marginRidgeM: 0, gapM: 0 } as PvLayout)[0];
    if (ring) out.push({ item: it, ring });
  }
  return out;
}

export function roofWindowsMinDistance(p: Project): number | undefined {
  let best: number | undefined;
  for (const { ring } of roofWindowsGround(p))
    for (const c of ring) {
      const d = distanceToLimit(p.enrichment, c);
      if (d !== undefined) best = best === undefined ? d : Math.min(best, d);
    }
  return best;
}

/** ouvertures proposées par défaut (à ajuster) : la façade la plus longue, fenêtres réparties + une porte */
export function defaultJoineryItems(e: EnrichmentResult | undefined): JoineryItem[] {
  const fs = projectFacades(e);
  if (!fs.length) return [];
  const f = [...fs].sort((a, b) => b.lengthM - a.lengthM)[0];
  const n = Math.max(1, Math.min(4, Math.floor(f.lengthM / 3)));
  const items: JoineryItem[] = [];
  for (let i = 0; i < n; i++) {
    const cx = (f.lengthM * (i + 0.5)) / n;
    const isDoor = i === Math.floor(n / 2) && n > 1;
    const k = isDoor ? JOINERY_KINDS.porte : JOINERY_KINDS.fenetre;
    items.push({ id: `j${i + 1}`, facadeIndex: f.index, kind: isDoor ? "porte" : "fenetre", widthM: k.w, heightM: k.h, xM: Math.round((cx - k.w / 2) * 100) / 100, sillM: k.sill, isNew: false });
  }
  return items;
}

/** fenêtres de toit proposées par défaut : 2 sur le premier pan, au tiers du rampant */
export function defaultRoofWindows(p: Project, modelId: string, count = 2): RoofWindowItem[] {
  const rp = p.pv.roofPlanes[0];
  if (!rp) return [];
  const m = ROOF_WINDOW_MODELS.find((x) => x.id === modelId) ?? ROOF_WINDOW_MODELS[0];
  const w = m.widthMm / 1000;
  return Array.from({ length: count }, (_, i) => ({ id: `w${i + 1}`, roofPlaneId: rp.id, x: Math.round(((rp.widthM * (i + 1)) / (count + 1) - w / 2) * 100) / 100, y: Math.round(rp.slopeLengthM * 0.3 * 100) / 100 }));
}

/** aire (m²) d'un anneau L93 */
export function ringAreaL93(ring: [number, number][] | number[][]): number {
  let a = 0;
  for (let i = 0; i < ring.length - 1; i++) a += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  return Math.abs(a) / 2;
}

/** emprise au sol du bâtiment principal (m², BD TOPO) */
export function existingFootprintM2(e?: EnrichmentResult): number | undefined {
  const b = mainBuildingOf(e);
  return b ? Math.round(ringAreaL93(outerRing(b.geometry).map(toL93))) : undefined;
}

/** estimation de la surface de plancher existante : emprise × niveaux (hauteur à l'égout / 2,7 m) × 0,8 (murs, combles) ; à confirmer par le demandeur */
export function estimateExistingFloorArea(e?: EnrichmentResult): number | undefined {
  const b = mainBuildingOf(e);
  const fp = existingFootprintM2(e);
  if (!b || !fp) return undefined;
  const h = b.heightM ?? 6;
  const levels = Math.max(1, Math.round((h * 0.7) / 2.7));
  return Math.round(fp * levels * 0.8);
}

/** emprise (anneau L93 fermé) de l'extension accolée à la façade choisie */
export function extensionRing(e: EnrichmentResult | undefined, x: { facadeIndex: number; positionRatio: number; widthM: number; depthM: number }): [number, number][] | undefined {
  const f = projectFacades(e)[x.facadeIndex];
  if (!f) return undefined;
  const [L, R] = facadeLeftRight(f);
  const ux = [(R[0] - L[0]) / (f.lengthM || 1), (R[1] - L[1]) / (f.lengthM || 1)];
  const nv = outward(f);
  const c = Math.max(x.widthM / 2, Math.min(f.lengthM - x.widthM / 2, f.lengthM * x.positionRatio));
  const P = (a: number, d: number): [number, number] => [L[0] + ux[0] * a + nv[0] * d, L[1] + ux[1] * a + nv[1] * d];
  const p0 = P(c - x.widthM / 2, 0), p1 = P(c + x.widthM / 2, 0), p2 = P(c + x.widthM / 2, x.depthM), p3 = P(c - x.widthM / 2, x.depthM);
  return [p0, p1, p2, p3, p0];
}

/** distance minimale de l'extension aux limites de la parcelle */
export function extensionMinDistance(e: EnrichmentResult | undefined, x: { facadeIndex: number; positionRatio: number; widthM: number; depthM: number }): number | undefined {
  const r = extensionRing(e, x);
  if (!r) return undefined;
  let best: number | undefined;
  for (let i = 0; i < 4; i++)
    for (let k = 0; k <= 4; k++) {
      const p: [number, number] = [r[i][0] + ((r[i + 1][0] - r[i][0]) * k) / 4, r[i][1] + ((r[i + 1][1] - r[i][1]) * k) / 4];
      const d = distanceToLimit(e, p);
      if (d !== undefined) best = best === undefined ? d : Math.min(best, d);
    }
  return best;
}

/** façade proposée pour l'extension : celle qui laisse le plus de place jusqu'aux limites */
export function bestExtensionFacade(e: EnrichmentResult | undefined, x: { positionRatio: number; widthM: number; depthM: number }): number {
  let best = 0, bd = -1;
  for (const f of projectFacades(e)) {
    if (f.lengthM < x.widthM) continue;
    const d = extensionMinDistance(e, { ...x, facadeIndex: f.index }) ?? 0;
    if (d > bd) {
      bd = d;
      best = f.index;
    }
  }
  return best;
}
