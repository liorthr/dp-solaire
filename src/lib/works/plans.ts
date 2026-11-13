// Plans spécifiques PAC et ITE (vectoriels, à l'échelle) : DP2 enrichi, DP4 façades avant/après, DP3 coupe de principe.
import type { Project } from "@/lib/types";
import { DRAW, dimension, fmtM, n, page, scaleBar, text, wrapText } from "@/lib/plans/svg";
import { COLORS, dp2, roofOf, type PlanContext } from "@/lib/plans/dp";
import { projectFacades, outward, pacPoint, distanceToLimit, nearestOnLimit } from "./geom";
import { defaultIte, defaultPac, defaultPacUnits, ITE_FINISHES } from "@/data/works";
import type { Facade } from "@/lib/geo/facades";

const PAC_COLOR = "#0f766e";
const ITE_COLOR = "#ea580c";

const unitOf = (p: Project) => {
  const pac = p.pac ?? defaultPac();
  return { pac, unit: defaultPacUnits.find((u) => u.id === pac.unitId) ?? defaultPacUnits[0] };
};

const placementLabel: Record<string, string> = { facade: "fixée en façade", toiture: "en toiture", sol_dalle: "au sol sur dalle", sol_sans_dalle: "au sol (plots, sans dalle)" };

// ------------------------------------------------------------------ DP2
export function dp2Works(ctx: PlanContext): string {
  const p = ctx.project;
  const e = p.enrichment;
  if (p.works === "pac") {
    const { pac, unit } = unitOf(p);
    const f = projectFacades(e)[pac.facadeIndex];
    const pt = pacPoint(e, pac);
    const d = pt ? distanceToLimit(e, pt) : undefined;
    return dp2(ctx, {
      hideSection: true,
      extra: (T) => {
        if (!pt || !f) return "";
        const ux = [(f.b[0] - f.a[0]) / f.lengthM, (f.b[1] - f.a[1]) / f.lengthM];
        const nv = outward(f);
        const uw = unit.widthMm / 1000, dd = unit.depthMm / 1000;
        const c = (a: number, b: number): [number, number] => [pt[0] + ux[0] * a + nv[0] * b, pt[1] + ux[1] * a + nv[1] * b];
        const poly = [c(-uw / 2, -dd / 2), c(uw / 2, -dd / 2), c(uw / 2, dd / 2), c(-uw / 2, dd / 2)].map(T);
        const [lx, ly] = T(pt);
        let s = "";
        const q = nearestOnLimit(e, pt);
        if (q && d !== undefined) {
          const [qx, qy] = T(q);
          s += `<line x1="${n(lx)}" y1="${n(ly)}" x2="${n(qx)}" y2="${n(qy)}" stroke="${PAC_COLOR}" stroke-width="0.35" stroke-dasharray="1.2 0.8"/>`;
        }
        s += `<path d="M${poly.map((c2) => `${n(c2[0])},${n(c2[1])}`).join("L")}Z" fill="${PAC_COLOR}" stroke="#111" stroke-width="0.3"/>`;
        s += `<circle cx="${n(lx)}" cy="${n(ly)}" r="4.5" fill="none" stroke="${PAC_COLOR}" stroke-width="0.6"/>`;
        // étiquette déportée vers l'extérieur du bâtiment, reliée par un trait de rappel
        const far = T([pt[0] + nv[0] * 9, pt[1] + nv[1] * 9]);
        const t1 = `Unité PAC ${placementLabel[pac.placement]}`;
        const t2 = d !== undefined ? `à ${fmtM(d)} de la limite la plus proche` : "";
        const w = Math.max(t1.length, t2.length) * 1.32 + 4;
        const bx = far[0] < lx ? far[0] - w : far[0];
        s += `<line x1="${n(lx)}" y1="${n(ly)}" x2="${n(far[0])}" y2="${n(far[1])}" stroke="${PAC_COLOR}" stroke-width="0.3"/>`;
        s += `<rect x="${n(bx)}" y="${n(far[1] - 5.5)}" width="${n(w)}" height="${t2 ? 11 : 6.5}" rx="1" fill="#fff" fill-opacity="0.95" stroke="${PAC_COLOR}" stroke-width="0.3"/>`;
        s += text(bx + 2, far[1] - 1.2, t1, 2.5, { weight: "bold", fill: PAC_COLOR });
        if (t2) s += text(bx + 2, far[1] + 3.8, t2, 2.4, { fill: "#15803d", weight: "bold" });
        return s;
      },
      legend: [
        { kind: "dash", color: COLORS.parcel, label: "Limite de parcelle" },
        { kind: "fill", color: COLORS.main, label: "Construction existante" },
        { kind: "fill", color: PAC_COLOR, label: "Unité extérieure projetée" },
        { kind: "fill", color: COLORS.building, label: "Bâtiments voisins" },
        { kind: "line", color: PAC_COLOR, label: "Distance unité / limite la plus proche" },
        { kind: "arrow", color: COLORS.photo, label: "Prises de vue DP7 / DP8" },
      ],
      notes: [
        `Unité extérieure ${unit.brand} ${unit.model.replace(/\s*\(exemple\)/, "")} : ${unit.widthMm} × ${unit.heightMm} × ${unit.depthMm} mm, puissance acoustique ${unit.soundPowerDb} dB(A).`,
        `Implantation : ${placementLabel[pac.placement]}${f ? `, ${f.label.toLowerCase()}` : ""}${pac.cover ? ", avec habillage" : ""}.`,
        "Aucune surface de plancher créée. Emprise du bâti : IGN BD TOPO ; parcelle : cadastre DGFiP.",
      ],
    });
  }
  const ite = p.ite ?? defaultIte();
  const fs = projectFacades(e).filter((f) => ite.facadeIndexes.includes(f.index));
  return dp2(ctx, {
    hideSection: false,
    extra: (T) =>
      fs
        .map((f) => {
          const nv = outward(f);
          const t = Math.max(ite.thicknessCm / 100, 0.12) * 1.6; // légèrement exagéré pour la lisibilité (épaisseur cotée)
          const q = [f.a, f.b, [f.b[0] + nv[0] * t, f.b[1] + nv[1] * t], [f.a[0] + nv[0] * t, f.a[1] + nv[1] * t]].map((c) => T(c as [number, number]));
          const m = T([(f.a[0] + f.b[0]) / 2 + nv[0] * (t + 1.2), (f.a[1] + f.b[1]) / 2 + nv[1] * (t + 1.2)]);
          return `<path d="M${q.map((c) => `${n(c[0])},${n(c[1])}`).join("L")}Z" fill="${ITE_COLOR}" stroke="${ITE_COLOR}" stroke-width="0.2"/>` + text(m[0], m[1], `+${ite.thicknessCm} cm`, 2.4, { anchor: "middle", weight: "bold", fill: ITE_COLOR });
        })
        .join(""),
    legend: [
      { kind: "dash", color: COLORS.parcel, label: "Limite de parcelle" },
      { kind: "fill", color: COLORS.main, label: "Construction existante" },
      { kind: "fill", color: ITE_COLOR, label: `Isolation extérieure (+${ite.thicknessCm} cm)` },
      { kind: "fill", color: COLORS.building, label: "Bâtiments voisins" },
      { kind: "line", color: "#15803d", label: "Distance aux limites (avant isolation)" },
      { kind: "arrow", color: COLORS.photo, label: "Prises de vue DP7 / DP8" },
    ],
    notes: [
      `Isolation thermique par l'extérieur de ${fs.length} façade(s) : épaisseur totale ${ite.thicknessCm} cm (représentée agrandie pour la lisibilité), finition ${ITE_FINISHES[ite.finish].toLowerCase()}, teinte ${ite.colorName}.`,
      "Les distances aux limites sont mesurées avant isolation ; retrancher l'épaisseur indiquée.",
      "Hauteur du bâtiment inchangée. Emprise du bâti : IGN BD TOPO ; parcelle : cadastre DGFiP.",
    ],
  });
}

// ------------------------------------------------------------------ élévations
interface Dims {
  gutter: number;
  ridge: number;
}
function dimsOf(p: Project): Dims {
  const est = roofOf(p);
  return { gutter: est?.gutterHeightM ?? 3, ridge: est?.ridgeHeightM ?? 6 };
}

function elevation(p: Project, f: Facade, d: Dims, x: number, yBase: number, k: number, after: boolean, label: string) {
  const W = f.lengthM * k, g = d.gutter * k, r = d.ridge * k;
  const ite = p.ite ?? defaultIte();
  const iteOn = after && p.works === "ite" && ite.facadeIndexes.includes(f.index);
  const wallFill = iteOn ? ite.colorHex : "#f5f0e6";
  let s = "";
  if (f.isLong) {
    s += `<rect x="${n(x)}" y="${n(yBase - g)}" width="${n(W)}" height="${n(g)}" fill="${wallFill}" stroke="#111" stroke-width="0.4"/>`;
    s += `<rect x="${n(x - 0.6)}" y="${n(yBase - r)}" width="${n(W + 1.2)}" height="${n(r - g)}" fill="#e9b99a" stroke="#111" stroke-width="0.4"/>`;
  } else {
    s += `<path d="M${n(x)},${n(yBase)}L${n(x)},${n(yBase - g)}L${n(x + W / 2)},${n(yBase - r)}L${n(x + W)},${n(yBase - g)}L${n(x + W)},${n(yBase)}Z" fill="${wallFill}" stroke="#111" stroke-width="0.4"/>`;
  }
  if (iteOn) s += text(x + W / 2, yBase - g / 2, `ITE +${ite.thicknessCm} cm`, 2.6, { anchor: "middle", weight: "bold", fill: "#00000099" });
  if (iteOn && ite.finish.startsWith("bardage")) {
    const step = 0.15 * k;
    const top = f.isLong ? yBase - g : yBase - g;
    for (let xx = x + step; xx < x + W; xx += step) s += `<line x1="${n(xx)}" y1="${n(yBase)}" x2="${n(xx)}" y2="${n(top)}" stroke="#00000033" stroke-width="0.15"/>`;
  }
  if (after && p.works === "pac") {
    const { pac, unit } = unitOf(p);
    if (pac.facadeIndex === f.index) {
      const uw = (unit.widthMm / 1000) * k, uh = (unit.heightMm / 1000) * k;
      const cx = x + W * Math.max(0.05, Math.min(0.95, pac.positionRatio));
      const base = pac.placement === "facade" ? yBase - pac.mountHeightM * k : pac.placement === "toiture" ? yBase - (d.gutter + (d.ridge - d.gutter) * 0.35) * k : yBase - 0.1 * k;
      if (pac.placement === "sol_dalle") s += `<rect x="${n(cx - uw / 2 - 1)}" y="${n(yBase - 0.1 * k)}" width="${n(uw + 2)}" height="${n(0.1 * k)}" fill="#a8a29e" stroke="#111" stroke-width="0.2"/>`;
      s += `<rect x="${n(cx - uw / 2)}" y="${n(base - uh)}" width="${n(uw)}" height="${n(uh)}" fill="${pac.cover ? "#8b6f4e" : "#f8fafc"}" stroke="#111" stroke-width="0.35"/>`;
      if (!pac.cover) s += `<circle cx="${n(cx - uw * 0.12)}" cy="${n(base - uh / 2)}" r="${n(uh * 0.36)}" fill="none" stroke="#475569" stroke-width="0.35"/>`;
      else for (let yy = base - uh + 0.6; yy < base; yy += 1.1) s += `<line x1="${n(cx - uw / 2)}" y1="${n(yy)}" x2="${n(cx + uw / 2)}" y2="${n(yy)}" stroke="#5b4630" stroke-width="0.3"/>`;
      s += `<circle cx="${n(cx)}" cy="${n(base - uh / 2)}" r="${n(Math.max(uw, uh) * 0.9)}" fill="none" stroke="${PAC_COLOR}" stroke-width="0.4" stroke-dasharray="1 0.7"/>`;
    }
  }
  s += `<line x1="${n(x - 4)}" y1="${n(yBase)}" x2="${n(x + W + 4)}" y2="${n(yBase)}" stroke="#111" stroke-width="0.5"/>`;
  s += text(x + W / 2, yBase + 6.5, label, 2.7, { anchor: "middle", weight: "bold" });
  return s;
}

function fitScale(wM: number, hM: number, fixedW: number, fixedH: number) {
  for (const s of [20, 50, 75, 100, 150, 200, 250]) if ((wM * 1000) / s + fixedW <= DRAW.w && (hM * 1000) / s + fixedH <= DRAW.h) return s;
  return 250;
}

/** détail coté de l'unité extérieure (1/20) */
function pacDetail(p: Project, x: number, y: number): string {
  const { pac, unit } = unitOf(p);
  const k = 1000 / 20;
  const uw = (unit.widthMm / 1000) * k, uh = (unit.heightMm / 1000) * k;
  const gx = x + 12, base = y + 14 + uh + (pac.placement === "facade" ? pac.mountHeightM * k : 4);
  let s = text(x, y, "Détail de l'unité extérieure (1/20)", 3, { weight: "bold" });
  s += `<rect x="${n(gx - 6)}" y="${n(y + 6)}" width="3" height="${n(base - y - 6)}" fill="#e7e5e4" stroke="#111" stroke-width="0.3"/>`;
  s += text(gx - 7.5, y + 10, "mur", 2.4, { anchor: "end" });
  s += `<line x1="${n(gx - 10)}" y1="${n(base)}" x2="${n(gx + uw + 18)}" y2="${n(base)}" stroke="#111" stroke-width="0.5"/>`;
  const top = pac.placement === "facade" ? base - pac.mountHeightM * k - uh : base - 4 - uh;
  if (pac.placement === "sol_dalle") s += `<rect x="${n(gx - 2)}" y="${n(base - 4)}" width="${n(uw + 4)}" height="4" fill="#a8a29e" stroke="#111" stroke-width="0.3"/>` + text(gx + uw + 6, base - 1, "dalle", 2.4);
  if (pac.placement === "facade") s += `<path d="M${n(gx - 3)},${n(top + uh)}L${n(gx + uw * 0.3)},${n(top + uh)}L${n(gx - 3)},${n(top + uh + 6)}Z" fill="none" stroke="#111" stroke-width="0.35"/>` + text(gx + uw * 0.3 + 2, top + uh + 4, "console", 2.4);
  s += `<rect x="${n(gx)}" y="${n(top)}" width="${n(uw)}" height="${n(uh)}" fill="${pac.cover ? "#8b6f4e" : "#f8fafc"}" stroke="#111" stroke-width="0.45"/>`;
  if (!pac.cover) {
    s += `<circle cx="${n(gx + uw * 0.4)}" cy="${n(top + uh / 2)}" r="${n(uh * 0.36)}" fill="none" stroke="#475569" stroke-width="0.5"/>`;
    for (let yy = top + uh * 0.2; yy < top + uh * 0.8; yy += 2.2) s += `<line x1="${n(gx + uw * 0.8)}" y1="${n(yy)}" x2="${n(gx + uw * 0.95)}" y2="${n(yy)}" stroke="#94a3b8" stroke-width="0.4"/>`;
  }
  s += dimension(gx, top, gx + uw, top, fmtM(unit.widthMm / 1000), -4, PAC_COLOR);
  s += dimension(gx + uw, top, gx + uw, top + uh, fmtM(unit.heightMm / 1000), -5, PAC_COLOR);
  if (pac.placement === "facade") s += dimension(gx + uw, top + uh, gx + uw, base, fmtM(pac.mountHeightM), -5, PAC_COLOR);
  s += wrapText(x, base + 8, `Profondeur ${fmtM(unit.depthMm / 1000)}, ${unit.soundPowerDb} dB(A). ${placementLabel[pac.placement].replace(/^./, (c) => c.toUpperCase())}${pac.cover ? ", habillage décoratif" : ""}.`, 2.6, 84).svg;
  return s;
}

export function dp4Works(ctx: PlanContext): string[] {
  const p = ctx.project;
  const d = dimsOf(p);
  const fsAll = projectFacades(p.enrichment);
  const concerned = p.works === "pac" ? fsAll.filter((f) => f.index === (p.pac ?? defaultPac()).facadeIndex) : fsAll.filter((f) => (p.ite ?? defaultIte()).facadeIndexes.includes(f.index));
  const pages: string[] = [];
  const perPage = p.works === "pac" ? 1 : 2;
  for (let i = 0; i < concerned.length; i += perPage) {
    const pair = concerned.slice(i, i + perPage);
    const maxL = Math.max(...pair.map((f) => f.lengthM));
    let svg = "";
    let scale: number;
    if (perPage === 1) {
      // une seule façade : avant au-dessus, après en dessous, à plus grande échelle
      const f = pair[0];
      scale = fitScale(maxL, d.ridge * 2, 30, 46);
      const k = 1000 / scale;
      const x = DRAW.x + (DRAW.w - f.lengthM * k) / 2;
      svg += elevation(p, f, d, x, DRAW.y + 14 + d.ridge * k, k, false, `${f.label} : état initial`);
      const x0 = DRAW.x + 8;
      svg = elevation(p, f, d, x0, DRAW.y + 14 + d.ridge * k, k, false, `${f.label} : état initial`) + elevation(p, f, d, x0, DRAW.y + 36 + 2 * d.ridge * k, k, true, `${f.label} : état projeté`);
      void x;
      svg += pacDetail(p, DRAW.x + DRAW.w - 92, DRAW.y + 20);
    } else {
      scale = fitScale(maxL * 2, d.ridge * pair.length, 30, 26 * pair.length + 10);
      const k = 1000 / scale;
      pair.forEach((f, j) => {
        const yBase = DRAW.y + 12 + (j + 1) * (d.ridge * k + 18);
        svg += elevation(p, f, d, DRAW.x + 6, yBase, k, false, `${f.label} : état initial`);
        svg += elevation(p, f, d, DRAW.x + 16 + f.lengthM * k, yBase, k, true, `${f.label} : état projeté`);
      });
    }
    svg += scaleBar(DRAW.x + DRAW.w - 60, DRAW.y + DRAW.h - 7, scale, 40);
    const legend =
      p.works === "pac"
        ? [{ kind: "fill" as const, color: "#f5f0e6", label: "Façade existante" }, { kind: "fill" as const, color: "#f8fafc", label: "Unité extérieure PAC" }]
        : [{ kind: "fill" as const, color: "#f5f0e6", label: "Façade existante" }, { kind: "fill" as const, color: (p.ite ?? defaultIte()).colorHex, label: `Finition projetée : ${(p.ite ?? defaultIte()).colorName}` }];
    pages.push(
      page(svg, {
        ...ctx.cartouche,
        code: "DP4",
        title: `Plan des façades (${i / perPage + 1}/${Math.ceil(concerned.length / perPage)})`,
        scale: perPage === 1 ? `1/${scale} (détail 1/20)` : `1/${scale}`,
        legend,
        notes: [
          p.works === "pac" ? "Seule l'unité extérieure est ajoutée ; aucune autre modification de façade." : `Isolation par l'extérieur ${(p.ite ?? defaultIte()).thicknessCm} cm, ${ITE_FINISHES[(p.ite ?? defaultIte()).finish].toLowerCase()} ; appuis, tableaux et descentes d'eaux pluviales adaptés.`,
          "Façades représentées de façon simplifiée (ouvertures non relevées) ; hauteurs estimées d'après la BD TOPO (IGN).",
        ],
      }),
    );
  }
  if (!pages.length) pages.push(page(text(DRAW.x + 10, DRAW.y + 20, "Façade concernée non identifiée : choisissez le bâtiment sur la carte.", 3.2, { fill: "#b91c1c" }), { ...ctx.cartouche, code: "DP4", title: "Plan des façades" }));
  return pages;
}

// ------------------------------------------------------------------ DP3 coupe de principe (ITE)
export function dp3Ite(ctx: PlanContext): string {
  const ite = ctx.project.ite ?? defaultIte();
  const k = 1000 / 10; // 1/10
  const x0 = DRAW.x + 40, yTop = DRAW.y + 25, h = 120;
  const wall = 0.2 * k, ins = (ite.thicknessCm / 100) * k, fin = 0.012 * k;
  let s = text(DRAW.x + 6, DRAW.y + 9, "Coupe de principe du mur isolé par l'extérieur (détail, 1/10)", 3.2, { weight: "bold" });
  s += `<defs><pattern id="hatch" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="3" stroke="#78716c" stroke-width="0.4"/></pattern></defs>`;
  s += `<rect x="${n(x0)}" y="${n(yTop)}" width="${n(wall)}" height="${h}" fill="url(#hatch)" stroke="#111" stroke-width="0.4"/>`;
  s += `<rect x="${n(x0 + wall)}" y="${n(yTop)}" width="${n(ins)}" height="${h}" fill="#fde68a" stroke="#111" stroke-width="0.3"/>`;
  for (let y = yTop; y < yTop + h - 4; y += 6) s += `<path d="M${n(x0 + wall)},${n(y)} L${n(x0 + wall + ins)},${n(y + 3)} L${n(x0 + wall)},${n(y + 6)}" fill="none" stroke="#b45309" stroke-width="0.25"/>`;
  s += `<rect x="${n(x0 + wall + ins)}" y="${n(yTop)}" width="${n(Math.max(fin, 1.2))}" height="${h}" fill="${ite.colorHex}" stroke="#111" stroke-width="0.3"/>`;
  s += `<line x1="${n(x0 - 25)}" y1="${n(yTop + h)}" x2="${n(x0 + wall + ins + 40)}" y2="${n(yTop + h)}" stroke="#111" stroke-width="0.6"/>`;
  s += text(x0 - 30, yTop + h + 6, "Intérieur", 2.8, { weight: "bold" }) + text(x0 + wall + ins + 18, yTop + h + 6, "Extérieur", 2.8, { weight: "bold" });
  s += dimension(x0 + wall, yTop, x0 + wall + ins, yTop, `${ite.thicknessCm} cm`, -5, ITE_COLOR);
  const lx = x0 + wall + ins + 30;
  const callout = (fromX: number, y: number, t: string) => `<circle cx="${n(fromX)}" cy="${n(y)}" r="0.8" fill="#111"/><line x1="${n(fromX)}" y1="${n(y)}" x2="${n(lx - 2)}" y2="${n(y)}" stroke="#111" stroke-width="0.25"/>` + wrapText(lx, y + 1, t, 2.8, 120).svg;
  s += callout(x0 + wall / 2, yTop + 20, "Mur existant conservé (maçonnerie)");
  s += callout(x0 + wall + ins / 2, yTop + 50, `Isolant rapporté, épaisseur ${ite.thicknessCm} cm (fixé collé-chevillé ou sur ossature selon le système)`);
  s += callout(x0 + wall + ins + Math.max(fin, 1.2) / 2, yTop + 80, `Finition : ${ITE_FINISHES[ite.finish].toLowerCase()}, teinte ${ite.colorName}`);
  s += scaleBar(DRAW.x + 6, DRAW.y + DRAW.h - 7, 10, 40);
  return page(s, { ...ctx.cartouche, code: "DP3", title: "Coupe de principe", scale: "1/10 (détail)", legend: [{ kind: "fill", color: "#fde68a", label: "Isolant" }, { kind: "fill", color: ite.colorHex, label: "Finition" }], notes: ["Détail de principe non coté sur l'existant : composition à adapter au système d'ITE retenu (avis technique du fabricant).", "Débords de toiture, appuis de fenêtres et descentes d'eaux pluviales adaptés à l'épaisseur ajoutée."] });
}

export const iteSurfaceM2 = (p: Project) => {
  const d = dimsOf(p);
  const ite = p.ite ?? defaultIte();
  return Math.round(projectFacades(p.enrichment).filter((f) => ite.facadeIndexes.includes(f.index)).reduce((s, f) => s + f.lengthM * d.gutter * 0.85 + (f.isLong ? 0 : (f.lengthM * (d.ridge - d.gutter)) / 2), 0));
};
