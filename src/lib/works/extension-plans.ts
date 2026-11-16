// Plans de l'agrandissement (extension, garage, véranda) : masse, coupe, façades. Numérotés DP ou PCMI selon le régime.
import type { ExtensionInfo, Project } from "@/lib/types";
import { DRAW, dimension, fmtM, n, page, scaleBar, text } from "@/lib/plans/svg";
import { COLORS, dp2, roofOf, type PlanContext } from "@/lib/plans/dp";
import { defaultExtension, EXTENSION_KINDS } from "@/data/works";
import { distanceToLimit, extensionRing, nearestOnLimit, projectFacades } from "./geom";

const EXT_COLOR = "#c2410c";
const extOf = (p: Project): ExtensionInfo => p.extension ?? defaultExtension();
const roofLabel = { plat: "toit plat", monopente: "toit monopente", deux_pentes: "toit à deux pentes" } as const;

/** hauteur au faîtage de l'extension */
export function extensionRidgeM(x: ExtensionInfo): number {
  if (x.roof === "plat") return x.heightM;
  const run = x.roof === "monopente" ? x.depthM : x.widthM / 2;
  return Math.round((x.heightM + Math.tan((x.roofTiltDeg * Math.PI) / 180) * run) * 100) / 100;
}

export function dp2Extension(ctx: PlanContext, code: string): string {
  const p = ctx.project;
  const e = p.enrichment;
  const x = extOf(p);
  const ring = extensionRing(e, x);
  const svg = dp2(ctx, {
    hideSection: true,
    extra: (T) => {
      if (!ring) return "";
      const pts = ring.map(T);
      let s = `<defs><pattern id="exthatch" width="2.2" height="2.2" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="2.2" stroke="${EXT_COLOR}" stroke-width="0.5"/></pattern></defs>`;
      s += `<path d="M${pts.map((c) => `${n(c[0])},${n(c[1])}`).join("L")}Z" fill="url(#exthatch)" stroke="${EXT_COLOR}" stroke-width="0.6"/>`;
      s += dimension(pts[0][0], pts[0][1], pts[1][0], pts[1][1], fmtM(x.widthM), -3, EXT_COLOR);
      s += dimension(pts[1][0], pts[1][1], pts[2][0], pts[2][1], fmtM(x.depthM), -3, EXT_COLOR);
      // distance du coin le plus proche à la limite
      let best: { d: number; c: [number, number] } | undefined;
      for (const c of ring.slice(0, 4)) {
        const d = distanceToLimit(e, c);
        if (d !== undefined && (!best || d < best.d)) best = { d, c };
      }
      if (best) {
        const q = nearestOnLimit(e, best.c);
        if (q) {
          const [ax, ay] = T(best.c), [qx, qy] = T(q);
          s += `<line x1="${n(ax)}" y1="${n(ay)}" x2="${n(qx)}" y2="${n(qy)}" stroke="#15803d" stroke-width="0.4" stroke-dasharray="1.2 0.8"/>`;
          s += `<rect x="${n((ax + qx) / 2 + 1)}" y="${n((ay + qy) / 2 - 3.6)}" width="${n(9 + fmtM(best.d).length * 1.3)}" height="5" rx="1" fill="#fff" fill-opacity="0.92"/>` + text((ax + qx) / 2 + 2, (ay + qy) / 2, `${fmtM(best.d)}`, 2.6, { weight: "bold", fill: "#15803d" });
        }
      }
      const cx = pts.slice(0, 4).reduce((a, c) => a + c[0], 0) / 4, cy = pts.slice(0, 4).reduce((a, c) => a + c[1], 0) / 4;
      s += `<rect x="${n(cx - 13)}" y="${n(cy - 3.4)}" width="26" height="5" rx="1" fill="#fff" fill-opacity="0.9"/>` + text(cx, cy, `${EXTENSION_KINDS[x.kind].split(" (")[0]}`, 2.4, { anchor: "middle", weight: "bold", fill: EXT_COLOR });
      return s;
    },
    legend: [
      { kind: "dash", color: COLORS.parcel, label: "Limite de parcelle" },
      { kind: "fill", color: COLORS.main, label: "Construction existante" },
      { kind: "fill", color: EXT_COLOR, label: "Construction projetée (hachurée)" },
      { kind: "fill", color: COLORS.building, label: "Bâtiments voisins" },
      { kind: "line", color: "#15803d", label: "Distance à la limite la plus proche" },
      { kind: "arrow", color: COLORS.photo, label: `Prises de vue ${code.startsWith("PCMI") ? "PCMI7 / PCMI8" : "DP7 / DP8"}` },
    ],
    notes: [
      `${EXTENSION_KINDS[x.kind]} : ${fmtM(x.widthM)} × ${fmtM(x.depthM)}, emprise au sol créée ${String(Math.round(x.widthM * x.depthM * 10) / 10).replace(".", ",")} m², surface de plancher créée ${String(x.floorAreaCreatedM2).replace(".", ",")} m².`,
      `Hauteur à l'égout ${fmtM(x.heightM)}, au faîtage ${fmtM(extensionRidgeM(x))} (${roofLabel[x.roof]}).`,
      "Accès et stationnement existants conservés. Bâti : IGN BD TOPO ; parcelle : cadastre DGFiP.",
    ],
  });
  return code === "DP2" ? svg : svg.replace(/>DP2</g, `>${code}<`);
}

function fitScale(wM: number, hM: number, fixedW: number, fixedH: number) {
  for (const s of [20, 50, 75, 100, 150, 200]) if ((wM * 1000) / s + fixedW <= DRAW.w && (hM * 1000) / s + fixedH <= DRAW.h) return s;
  return 200;
}

/** profil (élévation latérale ou coupe) de l'extension accolée au mur existant */
function profile(p: Project, x: ExtensionInfo, xLeft: number, yBase: number, k: number, cut: boolean): string {
  const r = roofOf(p);
  const gutter = r?.gutterHeightM ?? 3, ridge = r?.ridgeHeightM ?? 6;
  const ex = extensionRidgeM(x);
  const wallT = 0.25 * k;
  let s = "";
  // maison existante (partie)
  const hw = 4 * k;
  s += `<path d="M${n(xLeft)},${n(yBase)}L${n(xLeft)},${n(yBase - gutter * k)}L${n(xLeft + hw * 0.4)},${n(yBase - ridge * k)}L${n(xLeft + hw)},${n(yBase - gutter * k)}L${n(xLeft + hw)},${n(yBase)}Z" fill="${cut ? "#e7e5e4" : "#f5f0e6"}" stroke="#111" stroke-width="0.4"/>`;
  s += text(xLeft + hw / 2, yBase - 3, "Existant", 2.4, { anchor: "middle", fill: "#57534e" });
  // extension
  const x0 = xLeft + hw, D = x.depthM * k;
  const top = x.roof === "monopente" ? `L${n(x0)},${n(yBase - ex * k)}L${n(x0 + D)},${n(yBase - x.heightM * k)}` : x.roof === "plat" ? `L${n(x0)},${n(yBase - x.heightM * k)}L${n(x0 + D)},${n(yBase - x.heightM * k)}` : `L${n(x0)},${n(yBase - x.heightM * k)}L${n(x0 + D)},${n(yBase - x.heightM * k)}`;
  s += `<path d="M${n(x0)},${n(yBase)}${top}L${n(x0 + D)},${n(yBase)}Z" fill="${cut ? "#fff" : x.wallColorHex}" stroke="${EXT_COLOR}" stroke-width="0.6"/>`;
  if (cut) {
    s += `<rect x="${n(x0 + D - wallT)}" y="${n(yBase - x.heightM * k)}" width="${n(wallT)}" height="${n(x.heightM * k)}" fill="${EXT_COLOR}"/>`;
    s += `<rect x="${n(x0)}" y="${n(yBase - 0.2 * k)}" width="${n(D)}" height="${n(0.2 * k)}" fill="#a8a29e"/>`;
    s += text(x0 + D / 2, yBase - (x.heightM * k) / 2, x.kind === "garage" ? "Garage" : x.kind === "veranda" ? "Véranda" : "Pièce créée", 2.6, { anchor: "middle", weight: "bold", fill: EXT_COLOR });
  }
  if (x.roof === "deux_pentes" && !cut) s += text(x0 + D / 2, yBase - x.heightM * k - 2, "(pignon en façade principale)", 2.2, { anchor: "middle", fill: "#57534e" });
  s += `<line x1="${n(xLeft - 6)}" y1="${n(yBase)}" x2="${n(x0 + D + 10)}" y2="${n(yBase)}" stroke="#111" stroke-width="0.6"/>`;
  s += text(x0 + D + 11, yBase + 1, "TN", 2.4, { weight: "bold" });
  s += dimension(x0 + D, yBase, x0 + D, yBase - x.heightM * k, fmtM(x.heightM), -5, EXT_COLOR);
  if (ex > x.heightM) s += dimension(x0, yBase, x0, yBase - ex * k, fmtM(ex), 5, EXT_COLOR);
  s += dimension(x0, yBase + 3, x0 + D, yBase + 3, fmtM(x.depthM), 3, EXT_COLOR);
  return s;
}

export function dp3Extension(ctx: PlanContext, code: string): string {
  const p = ctx.project;
  const x = extOf(p);
  const r = roofOf(p);
  const ridge = Math.max(r?.ridgeHeightM ?? 6, extensionRidgeM(x));
  const scale = fitScale(4 + x.depthM + 4, ridge + 2, 40, 40);
  const k = 1000 / scale;
  const svg = text(DRAW.x + 6, DRAW.y + 9, "Coupe AA : perpendiculaire à la façade, à travers l'extension", 3.2, { weight: "bold" }) + profile(p, x, DRAW.x + 30, DRAW.y + 20 + ridge * k, k, true) + scaleBar(DRAW.x + DRAW.w - 60, DRAW.y + DRAW.h - 7, scale, 40);
  return page(svg, {
    ...ctx.cartouche,
    code,
    title: "Plan en coupe",
    scale: `1/${scale}`,
    legend: [
      { kind: "fill", color: "#e7e5e4", label: "Construction existante" },
      { kind: "fill", color: EXT_COLOR, label: "Murs de l'extension (coupés)" },
    ],
    notes: [`Terrain naturel (TN) conservé : pas de modification du profil du terrain. ${roofLabel[x.roof][0].toUpperCase()}${roofLabel[x.roof].slice(1)}${x.roof !== "plat" ? ` à ${x.roofTiltDeg}°` : ""}.`, "Hauteurs de l'existant estimées d'après la BD TOPO (IGN)."],
  });
}

export function dp4Extension(ctx: PlanContext, code: string): string {
  const p = ctx.project;
  const x = extOf(p);
  const f = projectFacades(p.enrichment)[x.facadeIndex];
  const r = roofOf(p);
  const gutter = r?.gutterHeightM ?? 3, ridge = r?.ridgeHeightM ?? 6;
  const L = f?.lengthM ?? 10;
  const ex = extensionRidgeM(x);
  const scale = fitScale(L * 2 + 2, ridge * 2 + 4, 30, 50);
  const k = 1000 / scale;
  const front = (xl: number, yb: number, after: boolean, label: string) => {
    const W = L * k;
    let s = `<rect x="${n(xl)}" y="${n(yb - gutter * k)}" width="${n(W)}" height="${n(gutter * k)}" fill="#f5f0e6" stroke="#111" stroke-width="0.4"/>`;
    s += f?.isLong === false ? `<path d="M${n(xl)},${n(yb - gutter * k)}L${n(xl + W / 2)},${n(yb - ridge * k)}L${n(xl + W)},${n(yb - gutter * k)}Z" fill="#f5f0e6" stroke="#111" stroke-width="0.4"/>` : `<rect x="${n(xl - 0.6)}" y="${n(yb - ridge * k)}" width="${n(W + 1.2)}" height="${n((ridge - gutter) * k)}" fill="#e9b99a" stroke="#111" stroke-width="0.4"/>`;
    if (after) {
      const cx = xl + Math.max(x.widthM / 2, Math.min(L - x.widthM / 2, L * x.positionRatio)) * k;
      const w = x.widthM * k, h = x.heightM * k, eh = ex * k;
      const roofPath = x.roof === "deux_pentes" ? `M${n(cx - w / 2)},${n(yb - h)}L${n(cx)},${n(yb - eh)}L${n(cx + w / 2)},${n(yb - h)}Z` : x.roof === "monopente" ? `M${n(cx - w / 2 - 0.5)},${n(yb - h)}L${n(cx - w / 2 - 0.5)},${n(yb - h - 1.2)}L${n(cx + w / 2 + 0.5)},${n(yb - h - 1.2)}L${n(cx + w / 2 + 0.5)},${n(yb - h)}Z` : `M${n(cx - w / 2)},${n(yb - h)}L${n(cx - w / 2)},${n(yb - h - 0.8)}L${n(cx + w / 2)},${n(yb - h - 0.8)}L${n(cx + w / 2)},${n(yb - h)}Z`;
      s += `<rect x="${n(cx - w / 2)}" y="${n(yb - h)}" width="${n(w)}" height="${n(h)}" fill="${x.kind === "veranda" ? "#cfe3f3" : x.wallColorHex}" stroke="${EXT_COLOR}" stroke-width="0.6"/>`;
      s += `<path d="${roofPath}" fill="#9a6b55" stroke="#111" stroke-width="0.3"/>`;
      if (x.kind === "veranda") for (let i = 1; i < 4; i++) s += `<line x1="${n(cx - w / 2 + (w * i) / 4)}" y1="${n(yb)}" x2="${n(cx - w / 2 + (w * i) / 4)}" y2="${n(yb - h)}" stroke="#334155" stroke-width="0.3"/>`;
      else if (x.kind === "garage") s += `<rect x="${n(cx - 1.2 * k)}" y="${n(yb - 2 * k)}" width="${n(2.4 * k)}" height="${n(2 * k)}" fill="#d6d3d1" stroke="#111" stroke-width="0.3"/>`;
      else s += `<rect x="${n(cx - 0.7 * k)}" y="${n(yb - 2.15 * k)}" width="${n(1.4 * k)}" height="${n(2.15 * k)}" fill="#9fb4c7" stroke="#111" stroke-width="0.3"/>`;
      s += dimension(cx - w / 2, yb + 2.5, cx + w / 2, yb + 2.5, fmtM(x.widthM), 3, EXT_COLOR);
      s += dimension(cx + w / 2, yb, cx + w / 2, yb - h, fmtM(x.heightM), -4, EXT_COLOR);
    }
    s += `<line x1="${n(xl - 4)}" y1="${n(yb)}" x2="${n(xl + W + 4)}" y2="${n(yb)}" stroke="#111" stroke-width="0.5"/>`;
    s += text(xl + W / 2, yb + 13, label, 2.7, { anchor: "middle", weight: "bold" });
    return s;
  };
  const y1 = DRAW.y + 12 + ridge * k;
  let svg = front(DRAW.x + 6, y1, false, `${f?.label ?? "Façade"} : état initial`);
  svg += front(DRAW.x + 16 + L * k, y1, true, `${f?.label ?? "Façade"} : état projeté`);
  // élévation latérale de l'extension
  svg += profile(p, x, DRAW.x + 20, y1 + 30 + ridge * k, k, false);
  svg += text(DRAW.x + 20, y1 + 42 + ridge * k, "Façade latérale de l'extension : état projeté", 2.7, { weight: "bold" });
  svg += scaleBar(DRAW.x + DRAW.w - 60, DRAW.y + DRAW.h - 7, scale, 40);
  return page(svg, {
    ...ctx.cartouche,
    code,
    title: "Plan des façades et des toitures",
    scale: `1/${scale}`,
    legend: [
      { kind: "fill", color: "#f5f0e6", label: "Façade existante" },
      { kind: "fill", color: x.kind === "veranda" ? "#cfe3f3" : x.wallColorHex, label: `${EXTENSION_KINDS[x.kind]} : ${x.wallFinish.toLowerCase()}` },
      { kind: "fill", color: "#9a6b55", label: `Couverture : ${x.roofCovering.toLowerCase()}` },
    ],
    notes: ["Ouvertures de l'extension représentées de façon indicative ; menuiseries à préciser dans la notice.", "Façades existantes simplifiées ; hauteurs estimées d'après la BD TOPO (IGN)."],
  });
}
