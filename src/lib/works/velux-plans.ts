// Plans des fenêtres de toit : DP2 (emprise et distance à la limite), DP4 (plan de toiture rabattu + élévation).
import type { Project, RoofPlane } from "@/lib/types";
import { DRAW, dimension, fmtM, n, page, scaleBar, text } from "@/lib/plans/svg";
import { COLORS, dp2, roofOf, type PlanContext } from "@/lib/plans/dp";
import { orientationLabel } from "@/lib/geo/roof";
import { defaultVelux, ROOF_WINDOW_COLORS, ROOF_WINDOW_MODELS } from "@/data/works";
import { distanceToLimit, nearestOnLimit, roofWindowsGround } from "./geom";

const VELUX_COLOR = "#1e3a5f";
const modelOf = (p: Project) => {
  const v = p.velux ?? defaultVelux();
  return { v, m: ROOF_WINDOW_MODELS.find((x) => x.id === v.modelId) ?? ROOF_WINDOW_MODELS[0] };
};

export function dp2Velux(ctx: PlanContext): string {
  const p = ctx.project;
  const e = p.enrichment;
  const { v, m } = modelOf(p);
  const g = roofWindowsGround(p);
  return dp2(ctx, {
    hideSection: true,
    extra: (T) => {
      let s = "";
      let best: { d: number; c: [number, number] } | undefined;
      for (const { ring } of g) {
        s += `<path d="M${ring.map((c) => T(c)).map((c) => `${n(c[0])},${n(c[1])}`).join("L")}Z" fill="${VELUX_COLOR}" stroke="#fff" stroke-width="0.25"/>`;
        for (const c of ring) {
          const d = distanceToLimit(e, c);
          if (d !== undefined && (!best || d < best.d)) best = { d, c };
        }
      }
      if (best) {
        const q = nearestOnLimit(e, best.c);
        if (q) {
          const [ax, ay] = T(best.c), [qx, qy] = T(q);
          s += `<line x1="${n(ax)}" y1="${n(ay)}" x2="${n(qx)}" y2="${n(qy)}" stroke="${VELUX_COLOR}" stroke-width="0.4" stroke-dasharray="1.2 0.8"/>`;
          const lx = (ax + qx) / 2 + 2, ly = (ay + qy) / 2;
          s += `<rect x="${n(lx - 1)}" y="${n(ly - 3.6)}" width="58" height="5.2" rx="1" fill="#fff" fill-opacity="0.92"/>` + text(lx, ly, `Fenêtre de toit la plus proche : ${fmtM(best.d)}`, 2.4, { weight: "bold", fill: VELUX_COLOR });
        }
      }
      return s;
    },
    legend: [
      { kind: "dash", color: COLORS.parcel, label: "Limite de parcelle" },
      { kind: "fill", color: COLORS.main, label: "Construction existante" },
      { kind: "fill", color: VELUX_COLOR, label: `Fenêtres de toit projetées (${v.items.length})` },
      { kind: "fill", color: COLORS.building, label: "Bâtiments voisins" },
      { kind: "arrow", color: COLORS.photo, label: "Prises de vue DP7 / DP8" },
    ],
    notes: [
      `${v.items.length} fenêtre(s) de toit ${m.label}, coloris ${ROOF_WINDOW_COLORS[v.frameColor].label.toLowerCase()}${v.shutters ? ", volets roulants extérieurs" : ""}, posées dans le plan de la toiture.`,
      "Distance mesurée en projection horizontale jusqu'à la limite la plus proche (vues : 1,90 m droite / 0,60 m oblique, F36766).",
      `Aucune modification de l'emprise ni de la hauteur${v.attic ? ` ; aménagement des combles : ${v.atticAreaM2 ?? "?"} m² de surface de plancher créée` : ""}. Bâti : IGN BD TOPO ; parcelle : cadastre DGFiP.`,
    ],
  });
}

function fitScale(wM: number, hM: number, fixedW: number, fixedH: number) {
  for (const s of [20, 50, 75, 100, 150, 200, 250]) if ((wM * 1000) / s + fixedW <= DRAW.w && (hM * 1000) / s + fixedH <= DRAW.h) return s;
  return 250;
}

function roofPlan(p: Project, rp: RoofPlane, x: number, yEave: number, k: number, after: boolean, label: string): string {
  const { v, m } = modelOf(p);
  const W = rp.widthM * k, H = rp.slopeLengthM * k;
  let s = `<rect x="${n(x)}" y="${n(yEave - H)}" width="${n(W)}" height="${n(H)}" fill="#e9b99a" stroke="#111" stroke-width="0.4"/>`;
  for (let yy = yEave - 0.35 * k; yy > yEave - H; yy -= 0.35 * k) s += `<line x1="${n(x)}" y1="${n(yy)}" x2="${n(x + W)}" y2="${n(yy)}" stroke="#00000022" stroke-width="0.12"/>`;
  s += text(x - 1.5, yEave + 0.8, "égout", 2.2, { anchor: "end" }) + text(x - 1.5, yEave - H + 0.8, "faîtage", 2.2, { anchor: "end" });
  if (after) {
    const items = v.items.filter((i) => i.roofPlaneId === rp.id);
    const w = (m.widthMm / 1000) * k, h = (m.heightMm / 1000) * k;
    items.forEach((it, i) => {
      const wx = x + it.x * k, wy = yEave - it.y * k - h;
      s += `<rect x="${n(wx)}" y="${n(wy)}" width="${n(w)}" height="${n(h)}" fill="${ROOF_WINDOW_COLORS[v.frameColor].hex}" stroke="#111" stroke-width="0.3"/>`;
      s += `<rect x="${n(wx + w * 0.1)}" y="${n(wy + h * 0.1)}" width="${n(w * 0.8)}" height="${n(h * 0.8)}" fill="#7da0bf" stroke="#111" stroke-width="0.15"/>`;
      if (v.shutters) s += `<rect x="${n(wx)}" y="${n(wy - 0.15 * k)}" width="${n(w)}" height="${n(0.15 * k)}" fill="${ROOF_WINDOW_COLORS[v.frameColor].hex}" stroke="#111" stroke-width="0.2"/>`;
      if (i === 0) {
        s += dimension(wx, yEave, wx, wy + h, fmtM(it.y), -4, VELUX_COLOR);
        s += dimension(x, yEave, wx, yEave, fmtM(it.x), 4, VELUX_COLOR);
        s += dimension(wx, wy, wx + w, wy, fmtM(m.widthMm / 1000), -3, VELUX_COLOR);
        s += dimension(wx + w, wy, wx + w, wy + h, fmtM(m.heightMm / 1000), -3, VELUX_COLOR);
      }
    });
  }
  s += dimension(x, yEave - H, x + W, yEave - H, fmtM(rp.widthM), -4);
  s += text(x + W / 2, yEave + 11, label, 2.7, { anchor: "middle", weight: "bold" });
  return s;
}

function eaveElevation(p: Project, rp: RoofPlane, x: number, yBase: number, k: number, after: boolean): string {
  const { v, m } = modelOf(p);
  const est = roofOf(p);
  const gutter = est?.gutterHeightM ?? 3, ridge = est?.ridgeHeightM ?? 6;
  const sin = Math.sin((rp.tiltDeg * Math.PI) / 180);
  const W = rp.widthM * k, g = gutter * k, r = ridge * k;
  let s = `<rect x="${n(x)}" y="${n(yBase - g)}" width="${n(W)}" height="${n(g)}" fill="#f5f0e6" stroke="#111" stroke-width="0.4"/>`;
  s += `<rect x="${n(x - 0.6)}" y="${n(yBase - r)}" width="${n(W + 1.2)}" height="${n(r - g)}" fill="#e9b99a" stroke="#111" stroke-width="0.4"/>`;
  for (const it of after ? v.items.filter((i) => i.roofPlaneId === rp.id) : []) {
    const wx = x + it.x * k, w = (m.widthMm / 1000) * k;
    const y0 = yBase - (gutter + it.y * sin) * k, y1 = yBase - (gutter + (it.y + m.heightMm / 1000) * sin) * k;
    s += `<rect x="${n(wx)}" y="${n(y1)}" width="${n(w)}" height="${n(y0 - y1)}" fill="${ROOF_WINDOW_COLORS[v.frameColor].hex}" stroke="#111" stroke-width="0.25"/>`;
    s += `<rect x="${n(wx + w * 0.1)}" y="${n(y1 + (y0 - y1) * 0.15)}" width="${n(w * 0.8)}" height="${n((y0 - y1) * 0.7)}" fill="#7da0bf"/>`;
  }
  s += dimension(x + W, yBase, x + W, yBase - r, fmtM(ridge), -4);
  s += `<line x1="${n(x - 4)}" y1="${n(yBase)}" x2="${n(x + W + 4)}" y2="${n(yBase)}" stroke="#111" stroke-width="0.5"/>`;
  s += text(x + W / 2, yBase + 6, `Façade côté ${rp.label.toLowerCase()} : ${after ? "état projeté" : "état initial"}`, 2.7, { anchor: "middle", weight: "bold" });
  return s;
}

export function dp4Velux(ctx: PlanContext): string[] {
  const p = ctx.project;
  const { v, m } = modelOf(p);
  const planes = p.pv.roofPlanes.filter((rp) => v.items.some((i) => i.roofPlaneId === rp.id));
  const est = roofOf(p);
  const ridge = est?.ridgeHeightM ?? 6;
  const pages = planes.map((rp, i) => {
    // haut : pan projeté en vraie grandeur ; bas : façade côté égout avant / après (échelles distinctes)
    const topH = DRAW.h * 0.5;
    const s1 = fitScale(rp.widthM, rp.slopeLengthM, 60, DRAW.h - topH + 24);
    const k1 = 1000 / s1;
    let svg = roofPlan(p, rp, DRAW.x + (DRAW.w - rp.widthM * k1) / 2, DRAW.y + 14 + rp.slopeLengthM * k1, k1, true, `${rp.label} (${orientationLabel(rp.azimuthDeg).toLowerCase()}, ${rp.tiltDeg}°) : état projeté, vue en plan rabattue (1/${s1})`);
    const s2 = fitScale(rp.widthM * 2 + 2, ridge, 40, topH + 26);
    const k2 = 1000 / s2;
    const yBase = DRAW.y + DRAW.h - 16;
    svg += eaveElevation(p, rp, DRAW.x + 14, yBase, k2, false);
    svg += eaveElevation(p, rp, DRAW.x + 26 + rp.widthM * k2, yBase, k2, true);
    svg += scaleBar(DRAW.x + DRAW.w - 60, DRAW.y + DRAW.h - 7, s2, 40);
    const scale = `1/${s1} (toiture), 1/${s2} (façades)`;
    return page(svg, {
      ...ctx.cartouche,
      code: "DP4",
      title: `Plan de la toiture et façade (${i + 1}/${planes.length})`,
      scale,
      legend: [
        { kind: "fill", color: "#e9b99a", label: "Couverture existante conservée" },
        { kind: "fill", color: ROOF_WINDOW_COLORS[v.frameColor].hex, label: `Fenêtre de toit ${m.label}` },
        { kind: "line", color: VELUX_COLOR, label: "Cotes de position (depuis l'égout et la rive)" },
      ],
      notes: [
        "Pan représenté en vraie grandeur (rabattu dans son plan) ; positions à confirmer selon la charpente (chevrons).",
        `Pente ${rp.tiltDeg}°, longueur à l'égout ${fmtM(rp.widthM)}, rampant ${fmtM(rp.slopeLengthM)} : estimations d'après la BD TOPO (IGN), modifiables dans l'onglet Plans.`,
      ],
    });
  });
  if (!pages.length) pages.push(page(text(DRAW.x + 10, DRAW.y + 20, "Aucune fenêtre de toit placée : ajoutez-les dans l'onglet Plans.", 3.2, { fill: "#b91c1c" }), { ...ctx.cartouche, code: "DP4", title: "Plan de la toiture" }));
  return pages;
}
