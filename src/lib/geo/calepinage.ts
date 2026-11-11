// Calepinage : placement automatique des panneaux sur un pan, avec marges de sécurité (modifiables).
// Marges par défaut = règle interne prudente (0,30 m), pas une exigence réglementaire (À_VÉRIFIER).
import type { PanelModel, PanelPlacement, PvLayout, RoofPlane } from "@/lib/types";

export const DEFAULT_MARGINS = { marginEdgeM: 0.3, marginRidgeM: 0.3, marginGutterM: 0.3, gapM: 0.02 };

export function panelDims(panel: PanelModel, orientation: PvLayout["orientation"]) {
  const a = panel.widthMm / 1000;
  const b = panel.heightMm / 1000;
  return orientation === "portrait" ? { w: a, h: b } : { w: b, h: a };
}

export function gridFor(rp: RoofPlane, panel: PanelModel, params: Pick<PvLayout, "orientation" | "marginEdgeM" | "marginRidgeM" | "marginGutterM" | "gapM">) {
  const { w, h } = panelDims(panel, params.orientation);
  const availW = rp.widthM - 2 * params.marginEdgeM;
  const availH = rp.slopeLengthM - params.marginRidgeM - params.marginGutterM;
  const cols = availW >= w ? Math.floor((availW + params.gapM) / (w + params.gapM)) : 0;
  const rows = availH >= h ? Math.floor((availH + params.gapM) / (h + params.gapM)) : 0;
  return { cols, rows, w, h, availW, availH };
}

export function layoutCapacity(rp: RoofPlane, panel: PanelModel, layout?: Partial<PvLayout>) {
  const params = { orientation: layout?.orientation ?? "portrait", ...DEFAULT_MARGINS, ...stripUndef(layout) } as PvLayout;
  const g = gridFor(rp, panel, params);
  const best = layout?.orientation ? g : (() => {
    const l = gridFor(rp, panel, { ...params, orientation: "paysage" });
    return l.cols * l.rows > g.cols * g.rows ? l : g;
  })();
  return { count: best.cols * best.rows, ...best };
}

function stripUndef<T extends object>(o?: T): Partial<T> {
  if (!o) return {};
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as Partial<T>;
}

/**
 * Place `count` panneaux en champ compact : rangées pleines depuis l'égout, centrées ;
 * la dernière rangée (incomplète) est centrée. Champ rectangulaire privilégié (recommandation ABF).
 */
export function autoLayout(rp: RoofPlane, panel: PanelModel, count: number, opts: Partial<PvLayout> = {}): PvLayout {
  const base: PvLayout = {
    roofPlaneId: rp.id,
    orientation: opts.orientation ?? "portrait",
    marginEdgeM: opts.marginEdgeM ?? DEFAULT_MARGINS.marginEdgeM,
    marginRidgeM: opts.marginRidgeM ?? DEFAULT_MARGINS.marginRidgeM,
    marginGutterM: opts.marginGutterM ?? DEFAULT_MARGINS.marginGutterM,
    gapM: opts.gapM ?? DEFAULT_MARGINS.gapM,
    panels: [],
  };
  if (!opts.orientation) {
    const p = gridFor(rp, panel, { ...base, orientation: "portrait" });
    const l = gridFor(rp, panel, { ...base, orientation: "paysage" });
    if (p.cols * p.rows < Math.min(count, l.cols * l.rows)) base.orientation = "paysage";
  }
  const g = gridFor(rp, panel, base);
  const n = Math.min(count, g.cols * g.rows);
  if (n <= 0) return base;
  // nombre de colonnes utilisé : champ le plus « carré » possible sans dépasser la largeur
  const rowsNeeded = Math.ceil(n / g.cols);
  const colsUsed = Math.ceil(n / rowsNeeded);
  const panels: PanelPlacement[] = [];
  for (let r = 0; r < rowsNeeded; r++) {
    const inRow = Math.min(colsUsed, n - r * colsUsed);
    const rowWidth = inRow * g.w + (inRow - 1) * base.gapM;
    const x0 = (rp.widthM - rowWidth) / 2;
    const y = base.marginGutterM + r * (g.h + base.gapM);
    for (let c = 0; c < inRow; c++) panels.push({ x: round(x0 + c * (g.w + base.gapM)), y: round(y), w: g.w, h: g.h });
  }
  return { ...base, panels };
}

const round = (n: number) => Math.round(n * 1000) / 1000;

/** emprise du champ (m) dans le repère du pan */
export function fieldBounds(layout: PvLayout) {
  if (!layout.panels.length) return null;
  const xs = layout.panels.flatMap((p) => [p.x, p.x + p.w]);
  const ys = layout.panels.flatMap((p) => [p.y, p.y + p.h]);
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
}

export const panelAreaM2 = (layout: PvLayout) => layout.panels.reduce((s, p) => s + p.w * p.h, 0);
