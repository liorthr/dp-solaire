// Création et mise à jour cohérente d'un projet (utilisé par l'UI, la démo et les tests).
import type { AddressResult, EnrichmentResult, PanelModel, Project, PvLayout, RoofPlane } from "@/lib/types";
import { estimateRoof, type RoofEstimate } from "@/lib/geo/roof";
import { autoLayout } from "@/lib/geo/calepinage";

export const uid = (p = "id") => `${p}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;

export function newProject(tenantId: string, userId: string, address?: AddressResult): Project {
  const now = new Date().toISOString();
  const year = now.slice(0, 4);
  return {
    id: uid("prj"),
    tenantId,
    reference: `DP-${year}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    status: "brouillon",
    address,
    pv: { powerKwc: 0, panelCount: 0, panelId: "gen-430-fb", mounting: "surimposition", roofPlanes: [], layouts: [], usage: "autoconsommation_surplus" },
    photos: [],
    insertions: [],
    overrides: {},
    events: [],
    answers: { visibleFromPublicSpace: true, inLotissement: "nsp" },
    createdAt: now,
    updatedAt: now,
    createdBy: userId,
  };
}

export function roofEstimateFor(e?: EnrichmentResult): RoofEstimate | undefined {
  const b = e?.buildings.find((x) => x.id === e.mainBuildingId);
  return b ? estimateRoof(b) : undefined;
}

/** pans par défaut si aucun bâtiment n'est trouvé (saisie manuelle ensuite) */
export function fallbackPlanes(): RoofPlane[] {
  return [{ id: "pan-1", label: "Pan Sud", azimuthDeg: 180, tiltDeg: 35, widthM: 10, slopeLengthM: 5, covering: "tuile_terre_cuite" }];
}

export function applyEnrichment(p: Project, e: EnrichmentResult): Project {
  const est = roofEstimateFor(e);
  const planes = p.pv.roofPlanes.length ? p.pv.roofPlanes : est?.planes ?? fallbackPlanes();
  return { ...p, enrichment: e, pv: { ...p.pv, roofPlanes: planes }, updatedAt: new Date().toISOString() };
}

/** répartit les panneaux sur les pans sélectionnés (le premier pan en priorité) */
export function relayout(p: Project, panel: PanelModel, planeIds?: string[], opts: Partial<PvLayout> = {}): Project {
  const ids = planeIds ?? (p.pv.layouts.length ? p.pv.layouts.map((l) => l.roofPlaneId) : p.pv.roofPlanes.slice(0, 1).map((r) => r.id));
  let remaining = p.pv.panelCount;
  const layouts: PvLayout[] = [];
  for (const id of ids) {
    const rp = p.pv.roofPlanes.find((r) => r.id === id);
    if (!rp) continue;
    const prev = p.pv.layouts.find((l) => l.roofPlaneId === id);
    const l = autoLayout(rp, panel, remaining, { ...(prev ? { orientation: prev.orientation, marginEdgeM: prev.marginEdgeM, marginGutterM: prev.marginGutterM, marginRidgeM: prev.marginRidgeM, gapM: prev.gapM } : {}), ...opts });
    layouts.push(l);
    remaining -= l.panels.length;
  }
  return { ...p, pv: { ...p.pv, layouts }, updatedAt: new Date().toISOString() };
}
