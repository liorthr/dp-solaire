// Génération vectorielle des plans DP1 à DP4 (SVG à l'échelle → PDF via svg2pdf).
import type { BuildingInfo, PanelModel, Project, PvLayout, RoofPlane } from "@/lib/types";
import type { Position } from "geojson";
import { DRAW, PAGE, arrowShape, dimension, fmtM, n, northArrow, page, pickScale, scaleBar, text, type Cartouche } from "./svg";
import { outerRing, toL93, fromL93 } from "@/lib/geo/proj";
import { estimateRoof, orientationLabel, type RoofEstimate } from "@/lib/geo/roof";
import { fieldBounds } from "@/lib/geo/calepinage";
import type { Basemap } from "./basemap";

export interface PlanContext {
  project: Project;
  panel?: PanelModel;
  cartouche: Omit<Cartouche, "code" | "title" | "scale" | "legend" | "notes">;
  site: { lon: number; lat: number };
}

const COLORS = { pv: "#1e293b", pvStroke: "#0ea5e9", parcel: "#c2410c", building: "#d6d3d1", main: "#a8a29e", photo: "#7c3aed", roof: "#b45309" };

export function mainBuilding(p: Project): BuildingInfo | undefined {
  const e = p.enrichment;
  return e?.buildings.find((b) => b.id === e.mainBuildingId);
}

export function roofOf(p: Project): RoofEstimate | undefined {
  const b = mainBuilding(p);
  return b ? estimateRoof(b) : undefined;
}

/** points de prise de vue (DP7 proche, DP8 lointain) : saisis par l'utilisateur ou déduits (depuis la voie, vers la maison) */
export function shotPoints(p: Project, site: { lon: number; lat: number }) {
  const addr = p.address;
  const get = (kind: "proche" | "lointain") => p.photos.find((x) => x.kind === kind);
  const [sx, sy] = toL93([site.lon, site.lat]);
  let [ax, ay] = addr ? toL93([addr.lon, addr.lat]) : [sx, sy - 20];
  if (Math.hypot(ax - sx, ay - sy) < 8) [ax, ay] = [sx, sy - 20];
  const dx = ax - sx, dy = ay - sy, L = Math.hypot(dx, dy);
  const u = [dx / L, dy / L];
  const near: [number, number] = [sx + u[0] * Math.max(15, L), sy + u[1] * Math.max(15, L)];
  const far: [number, number] = [sx + u[0] * 120 + u[1] * 40, sy + u[1] * 120 - u[0] * 40];
  const bearingTo = (from: [number, number]) => ((Math.atan2(sx - from[0], sy - from[1]) * 180) / Math.PI + 360) % 360;
  const mk = (kind: "proche" | "lointain", def: [number, number]) => {
    const ph = get(kind);
    const pt = ph?.shotPoint ? toL93(ph.shotPoint) : def;
    return { kind, l93: pt as [number, number], lonlat: fromL93(pt), bearing: ph?.shotBearingDeg ?? bearingTo(pt as [number, number]), estimated: !ph?.shotPoint };
  };
  return [mk("proche", near), mk("lointain", far)];
}

const pathFromRing = (ring: [number, number][]) => `M${ring.map((p) => `${n(p[0])},${n(p[1])}`).join("L")}Z`;

// ======================================================================= DP1
export function dp1(ctx: PlanContext, main: Basemap | null, inset: Basemap | null, scaleMain: number, scaleInset: number): string {
  const { site, project: p } = ctx;
  const W = DRAW.w, H = DRAW.h;
  const parts: string[] = [];
  const proj = main?.project;
  if (main) parts.push(`<image x="${n(DRAW.x)}" y="${n(DRAW.y)}" width="${n(W)}" height="${n(H)}" href="${main.dataUrl}" xlink:href="${main.dataUrl}" preserveAspectRatio="none"/>`);
  else parts.push(`<rect x="${n(DRAW.x)}" y="${n(DRAW.y)}" width="${n(W)}" height="${n(H)}" fill="#f5f5f4"/>`, text(DRAW.x + W / 2, DRAW.y + 10, "Fond IGN indisponible : plan simplifié (à compléter)", 3, { anchor: "middle", fill: "#b91c1c" }));
  const P = (lon: number, lat: number): [number, number] => {
    if (proj) {
      const [x, y] = proj(lon, lat);
      return [DRAW.x + x, DRAW.y + y];
    }
    const [X, Y] = toL93([lon, lat]);
    const [cX, cY] = toL93([site.lon, site.lat]);
    return [DRAW.x + W / 2 + ((X - cX) * 1000) / scaleMain, DRAW.y + H / 2 - ((Y - cY) * 1000) / scaleMain];
  };
  // parcelle
  for (const parcel of p.enrichment?.parcels ?? []) {
    const ring = outerRing(parcel.geometry).map((c) => P(c[0], c[1]));
    parts.push(`<path d="${pathFromRing(ring)}" fill="${COLORS.parcel}" fill-opacity="0.25" stroke="${COLORS.parcel}" stroke-width="0.5"/>`);
  }
  const [sx, sy] = P(site.lon, site.lat);
  parts.push(`<circle cx="${n(sx)}" cy="${n(sy)}" r="6" fill="none" stroke="#dc2626" stroke-width="0.9"/><circle cx="${n(sx)}" cy="${n(sy)}" r="1" fill="#dc2626"/>`);
  parts.push(`<rect x="${n(sx + 7)}" y="${n(sy - 9)}" width="34" height="6" rx="1" fill="#fff" fill-opacity="0.9"/>`, text(sx + 8, sy - 4.8, "Terrain du projet", 3.2, { weight: "bold", fill: "#dc2626" }));
  // points de vue DP7/DP8
  for (const s of shotPoints(p, site)) {
    const [x, y] = P(s.lonlat[0], s.lonlat[1]);
    if (x < DRAW.x || x > DRAW.x + W || y < DRAW.y || y > DRAW.y + H) continue;
    const ang = s.bearing - 90;
    parts.push(`<circle cx="${n(x)}" cy="${n(y)}" r="2.3" fill="${COLORS.photo}"/>`, arrowShape(x, y, 9, ang, COLORS.photo, 0.6), text(x - 3.5, y + 1.1, s.kind === "proche" ? "7" : "8", 2.6, { weight: "bold", fill: "#fff" }));
  }
  // encart 1/25 000
  if (inset) {
    const iw = 62, ih = 44, ix = DRAW.x + 3, iy = DRAW.y + 3;
    parts.push(`<rect x="${n(ix - 0.6)}" y="${n(iy - 0.6)}" width="${iw + 1.2}" height="${ih + 6}" fill="#fff" stroke="#111" stroke-width="0.3"/>`);
    parts.push(`<image x="${n(ix)}" y="${n(iy)}" width="${iw}" height="${ih}" href="${inset.dataUrl}" xlink:href="${inset.dataUrl}" preserveAspectRatio="none"/>`);
    const [ex, ey] = inset.project(site.lon, site.lat);
    parts.push(`<circle cx="${n(ix + ex)}" cy="${n(iy + ey)}" r="2.5" fill="none" stroke="#dc2626" stroke-width="0.7"/>`);
    parts.push(text(ix + 1, iy + ih + 4, `Situation dans la commune (1/${scaleInset})`, 2.3));
  }
  parts.push(northArrow(DRAW.x + W - 10, DRAW.y + 12));
  parts.push(`<rect x="${n(DRAW.x + W - 66)}" y="${n(DRAW.y + H - 12)}" width="62" height="10" fill="#fff" fill-opacity="0.9"/>`, scaleBar(DRAW.x + W - 62, DRAW.y + H - 7, scaleMain, 50));
  return page(parts.join(""), {
    ...ctx.cartouche,
    code: "DP1",
    title: "Plan de situation du terrain",
    scale: `1/${scaleMain} (encart 1/${scaleInset})`,
    legend: [
      { kind: "dot", color: "#dc2626", label: "Terrain du projet" },
      { kind: "fill", color: "#f6c3a5", label: "Parcelle(s) cadastrale(s)" },
      { kind: "arrow", color: COLORS.photo, label: "Prises de vue DP7 / DP8" },
    ],
    notes: [`Fond : Plan IGN (Géoplateforme). Échelle conseillée par la notice : 1/2 000 à 1/5 000 en ville, 1/20 000 à 1/25 000 en zone rurale.`, ...(shotPoints(p, site).some((s) => s.estimated) ? ["Points de prise de vue estimés : à ajuster si besoin (onglet Photos)."] : [])],
  });
}

// ======================================================================= DP2
function rayToRing(o: [number, number], d: [number, number], ring: [number, number][]): number | null {
  let best: number | null = null;
  for (let i = 0; i < ring.length - 1; i++) {
    const a = ring[i], b = ring[i + 1];
    const ex = b[0] - a[0], ey = b[1] - a[1];
    const den = d[0] * ey - d[1] * ex;
    if (Math.abs(den) < 1e-9) continue;
    const t = ((a[0] - o[0]) * ey - (a[1] - o[1]) * ex) / den;
    const s = ((a[0] - o[0]) * d[1] - (a[1] - o[1]) * d[0]) / den;
    if (t > 0.01 && s >= 0 && s <= 1 && (best === null || t < best)) best = t;
  }
  return best;
}

/** sommets L93 des panneaux d'un calepinage sur un pan (projection horizontale) */
export function panelsGround(rp: RoofPlane, layout: PvLayout): [number, number][][] {
  if (!rp.polygon) return [];
  const [eA, eB, , rA] = rp.polygon.coordinates[0].map((c: Position) => toL93(c));
  const L = Math.hypot(eB[0] - eA[0], eB[1] - eA[1]);
  const ux = [(eB[0] - eA[0]) / L, (eB[1] - eA[1]) / L];
  const D = Math.hypot(rA[0] - eA[0], rA[1] - eA[1]);
  const uy = [(rA[0] - eA[0]) / D, (rA[1] - eA[1]) / D];
  const scaleX = L / rp.widthM; // tolère un pan édité
  const cos = Math.cos((rp.tiltDeg * Math.PI) / 180);
  const P = (x: number, y: number): [number, number] => [eA[0] + ux[0] * x * scaleX + uy[0] * y * cos, eA[1] + ux[1] * x * scaleX + uy[1] * y * cos];
  return layout.panels.map((pn) => [P(pn.x, pn.y), P(pn.x + pn.w, pn.y), P(pn.x + pn.w, pn.y + pn.h), P(pn.x, pn.y + pn.h), P(pn.x, pn.y)]);
}

export function dp2(ctx: PlanContext): string {
  const { project: p, site } = ctx;
  const e = p.enrichment;
  const main = mainBuilding(p);
  const parcelRings = (e?.parcels ?? []).map((pc) => outerRing(pc.geometry).map(toL93));
  const mainRing = main ? outerRing(main.geometry).map(toL93) : null;
  const all = [...parcelRings.flat(), ...(mainRing ?? [])];
  const [sX, sY] = toL93([site.lon, site.lat]);
  const xs = all.length ? all.map((c) => c[0]) : [sX - 15, sX + 15];
  const ys = all.length ? all.map((c) => c[1]) : [sY - 15, sY + 15];
  const cX = (Math.min(...xs) + Math.max(...xs)) / 2, cY = (Math.min(...ys) + Math.max(...ys)) / 2;
  const ext = Math.max((Math.max(...xs) - Math.min(...xs)) * (DRAW.h / DRAW.w), Math.max(...ys) - Math.min(...ys));
  const scale = pickScale(ext * 1.25 + 8, DRAW.h - 20, [100, 200, 250, 500, 1000]);
  const T = (c: [number, number]): [number, number] => [DRAW.x + DRAW.w / 2 + ((c[0] - cX) * 1000) / scale, DRAW.y + DRAW.h / 2 - ((c[1] - cY) * 1000) / scale];
  const parts: string[] = [`<clipPath id="clipdraw"><rect x="${n(DRAW.x)}" y="${n(DRAW.y)}" width="${n(DRAW.w)}" height="${n(DRAW.h)}"/></clipPath><g clip-path="url(#clipdraw)">`];
  // bâtiments voisins
  for (const b of e?.buildings ?? []) {
    if (b.id === main?.id) continue;
    parts.push(`<path d="${pathFromRing(outerRing(b.geometry).map(toL93).map(T))}" fill="${COLORS.building}" stroke="#78716c" stroke-width="0.15"/>`);
  }
  if (mainRing) parts.push(`<path d="${pathFromRing(mainRing.map(T))}" fill="${COLORS.main}" stroke="#111" stroke-width="0.5"/>`);
  for (const r of parcelRings) parts.push(`<path d="${pathFromRing(r.map(T))}" fill="none" stroke="${COLORS.parcel}" stroke-width="0.7" stroke-dasharray="4 1 1 1"/>`);
  // faîtage + panneaux
  const est = main ? estimateRoof(main) : undefined;
  let heightNote = "";
  if (est) {
    const { rect } = est;
    const ux = Math.cos(rect.angle), uy = Math.sin(rect.angle);
    const a = T([rect.center[0] - ux * rect.length / 2, rect.center[1] - uy * rect.length / 2]);
    const b = T([rect.center[0] + ux * rect.length / 2, rect.center[1] + uy * rect.length / 2]);
    parts.push(`<line x1="${n(a[0])}" y1="${n(a[1])}" x2="${n(b[0])}" y2="${n(b[1])}" stroke="#111" stroke-width="0.35" stroke-dasharray="2 1"/>`);
    // coupe AA (perpendiculaire au faîtage, au centre)
    const nx = -uy, ny = ux, half = rect.width / 2 + 3;
    const c1 = T([rect.center[0] - nx * half, rect.center[1] - ny * half]);
    const c2 = T([rect.center[0] + nx * half, rect.center[1] + ny * half]);
    parts.push(`<line x1="${n(c1[0])}" y1="${n(c1[1])}" x2="${n(c2[0])}" y2="${n(c2[1])}" stroke="#2563eb" stroke-width="0.3" stroke-dasharray="3 1 0.5 1"/>`, text(c1[0], c1[1] - 1, "A", 3, { weight: "bold", fill: "#2563eb" }), text(c2[0], c2[1] - 1, "A", 3, { weight: "bold", fill: "#2563eb" }));
    // cotes du bâtiment
    const k = rect.corners.map(T);
    const ctr = T(rect.center);
    const outward = (a: [number, number], b: [number, number]) => {
      const dx = b[0] - a[0], dy = b[1] - a[1];
      const m = [(a[0] + b[0]) / 2 - ctr[0], (a[1] + b[1]) / 2 - ctr[1]];
      return -dy * m[0] + dx * m[1] >= 0 ? 5 : -5;
    };
    const L0 = Math.hypot(k[1][0] - k[0][0], k[1][1] - k[0][1]);
    const dimA = L0 >= Math.hypot(k[2][0] - k[1][0], k[2][1] - k[1][1]) ? [k[0], k[1], rect.length, k[1], k[2], rect.width] : [k[0], k[1], rect.width, k[1], k[2], rect.length];
    parts.push(dimension(k[0][0], k[0][1], k[1][0], k[1][1], fmtM(dimA[2] as number), outward(k[0], k[1])));
    parts.push(dimension(k[1][0], k[1][1], k[2][0], k[2][1], fmtM(dimA[5] as number), outward(k[1], k[2])));
    heightNote = `Hauteur au faîtage : ${fmtM(est.ridgeHeightM)} (inchangée)`;
    // distances aux limites séparatives
    if (parcelRings[0]) {
      const ring = parcelRings[0];
      const mids: { o: [number, number]; d: [number, number] }[] = [];
      for (let i = 0; i < 4; i++) {
        const A = rect.corners[i], B = rect.corners[(i + 1) % 4];
        const m: [number, number] = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
        const v = [m[0] - rect.center[0], m[1] - rect.center[1]];
        const L = Math.hypot(v[0], v[1]) || 1;
        mids.push({ o: m, d: [v[0] / L, v[1] / L] });
      }
      for (const { o, d } of mids) {
        const t = rayToRing(o, d, ring);
        if (t === null || t > 60) continue;
        const end: [number, number] = [o[0] + d[0] * t, o[1] + d[1] * t];
        const [x1, y1] = T(o), [x2, y2] = T(end);
        parts.push(`<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" stroke="#15803d" stroke-width="0.25"/>`, text((x1 + x2) / 2 + 1, (y1 + y2) / 2, fmtM(t), 2.4, { fill: "#15803d", weight: "bold" }));
      }
    }
  }
  for (const l of p.pv.layouts) {
    const rp = p.pv.roofPlanes.find((r) => r.id === l.roofPlaneId);
    if (!rp) continue;
    for (const poly of panelsGround(rp, l)) parts.push(`<path d="${pathFromRing(poly.map(T))}" fill="${COLORS.pv}" stroke="${COLORS.pvStroke}" stroke-width="0.12"/>`);
  }
  // points de vue
  for (const s of shotPoints(p, site)) {
    const [x, y] = T(s.l93);
    if (x < DRAW.x || x > DRAW.x + DRAW.w || y < DRAW.y || y > DRAW.y + DRAW.h) continue;
    parts.push(`<circle cx="${n(x)}" cy="${n(y)}" r="2" fill="${COLORS.photo}"/>`, arrowShape(x, y, 8, s.bearing - 90, COLORS.photo, 0.5), text(x - 1, y + 1, s.kind === "proche" ? "7" : "8", 2.4, { weight: "bold", fill: "#fff" }));
  }
  parts.push("</g>");
  parts.push(northArrow(DRAW.x + DRAW.w - 10, DRAW.y + 12), scaleBar(DRAW.x + 6, DRAW.y + DRAW.h - 7, scale, 45));
  if (heightNote) parts.push(`<rect x="${n(DRAW.x + 4)}" y="${n(DRAW.y + 3)}" width="72" height="6" fill="#fff" fill-opacity="0.9"/>`, text(DRAW.x + 6, DRAW.y + 7.3, heightNote, 2.8, { weight: "bold" }));
  const nb = p.pv.layouts.reduce((s, l) => s + l.panels.length, 0);
  return page(parts.join(""), {
    ...ctx.cartouche,
    code: "DP2",
    title: "Plan de masse",
    scale: `1/${scale}`,
    legend: [
      { kind: "dash", color: COLORS.parcel, label: "Limite de parcelle" },
      { kind: "fill", color: COLORS.main, label: "Construction existante" },
      { kind: "fill", color: COLORS.pv, label: `Panneaux projetés (${nb})` },
      { kind: "fill", color: COLORS.building, label: "Bâtiments voisins" },
      { kind: "line", color: "#15803d", label: "Distance aux limites" },
      { kind: "arrow", color: COLORS.photo, label: "Prises de vue DP7 / DP8" },
    ],
    notes: [
      "Projet sans création d'emprise au sol ni de surface de plancher ; hauteur du bâtiment inchangée.",
      "Emprise du bâti : IGN BD TOPO ; parcelle : cadastre DGFiP. Cotes en mètres.",
      ...(main ? [] : ["Emprise du bâtiment non trouvée : à dessiner."]),
    ],
  });
}

// ======================================================================= DP3
export function dp3(ctx: PlanContext): string {
  const { project: p } = ctx;
  const est = roofOf(p);
  const rp = p.pv.layouts[0] ? p.pv.roofPlanes.find((r) => r.id === p.pv.layouts[0].roofPlaneId) : p.pv.roofPlanes[0];
  const tilt = rp?.tiltDeg ?? est?.tiltDeg ?? 35;
  const span = est?.spanM ?? (rp ? 2 * rp.slopeLengthM * Math.cos((tilt * Math.PI) / 180) : 8);
  const half = span / 2;
  const rise = half * Math.tan((tilt * Math.PI) / 180);
  const gutter = est?.gutterHeightM ?? 3;
  const ridge = Math.round((gutter + rise) * 10) / 10;
  const scale = pickScale(Math.max(span + 6, (ridge + 3) * (DRAW.w / DRAW.h)), DRAW.w - 30, [50, 100, 200]);
  const k = 1000 / scale;
  const ox = DRAW.x + DRAW.w / 2 - (span / 2) * k, oy = DRAW.y + DRAW.h - 25;
  const X = (m: number) => ox + m * k, Y = (m: number) => oy - m * k;
  const parts: string[] = [];
  parts.push(`<line x1="${n(DRAW.x + 5)}" y1="${n(oy)}" x2="${n(DRAW.x + DRAW.w - 5)}" y2="${n(oy)}" stroke="#111" stroke-width="0.6"/>`);
  for (let i = 0; i < 40; i++) parts.push(`<line x1="${n(DRAW.x + 5 + i * 5)}" y1="${n(oy)}" x2="${n(DRAW.x + 2 + i * 5)}" y2="${n(oy + 3)}" stroke="#555" stroke-width="0.15"/>`);
  parts.push(`<path d="M${n(X(0))},${n(Y(0))}L${n(X(0))},${n(Y(gutter))}L${n(X(half))},${n(Y(ridge))}L${n(X(span))},${n(Y(gutter))}L${n(X(span))},${n(Y(0))}Z" fill="#e7e5e4" stroke="#111" stroke-width="0.5"/>`);
  // panneaux sur le pan gauche (pan équipé)
  const layout = p.pv.layouts[0];
  if (layout && rp) {
    const fb = fieldBounds(layout);
    if (fb) {
      const off = p.pv.mounting === "integration" ? 0.02 : 0.12;
      const c = Math.cos((tilt * Math.PI) / 180), s = Math.sin((tilt * Math.PI) / 180);
      const nx = -s, ny = c; // normale extérieure au pan gauche (vers le haut-gauche)
      const p0 = [fb.y0 * c + nx * off, gutter + fb.y0 * s + ny * off];
      const p1 = [fb.y1 * c + nx * off, gutter + fb.y1 * s + ny * off];
      parts.push(`<line x1="${n(X(p0[0]))}" y1="${n(Y(p0[1]))}" x2="${n(X(p1[0]))}" y2="${n(Y(p1[1]))}" stroke="${COLORS.pv}" stroke-width="${n(Math.max(0.8, 0.04 * k))}"/>`);
      parts.push(text(X(p0[0]) - 40, Y(p1[1]) - 6, `Panneaux PV ${p.pv.mounting === "integration" ? "intégrés" : "en surimposition (15 cm max.)"}`, 2.6, { fill: COLORS.pv, weight: "bold" }));
    }
  }
  parts.push(dimension(X(span), Y(0), X(span), Y(gutter), `Égout ${fmtM(gutter)}`, -6));
  parts.push(dimension(X(span) + 14 / 1, Y(0), X(span) + 14, Y(ridge), `Faîtage ${fmtM(ridge)}`, -2));
  parts.push(dimension(X(0), Y(0), X(span), Y(0), fmtM(span), 8));
  parts.push(text(X(half * 0.45), Y(gutter + rise * 0.3), `${tilt}°`, 3, { weight: "bold", fill: "#b91c1c" }));
  parts.push(text(DRAW.x + 6, DRAW.y + 8, "Coupe A-A (repérée sur le plan de masse DP2) : profil du terrain inchangé", 3, { weight: "bold" }));
  parts.push(scaleBar(DRAW.x + 6, DRAW.y + DRAW.h - 7, scale, 40));
  return page(parts.join(""), {
    ...ctx.cartouche,
    code: "DP3",
    title: "Plan en coupe",
    scale: `1/${scale}`,
    legend: [{ kind: "fill", color: "#e7e5e4", label: "Construction existante" }, { kind: "line", color: COLORS.pv, label: "Panneaux projetés" }],
    notes: ["Pièce exigée si le profil du terrain est modifié : ce n'est pas le cas. Fournie à titre de complément.", `Hauteurs estimées d'après la BD TOPO (IGN)${est?.tiltSource === "bdtopo" ? " ; pente déduite des altitudes du toit" : " ; pente saisie ou par défaut"}.`],
  });
}

// ======================================================================= DP4
/** plus grande échelle normalisée telle que (wM, hM) + marges fixes (mm) tiennent dans la zone de dessin */
function fitScale(wM: number, hM: number, fixedWmm: number, fixedHmm: number) {
  for (const s of [20, 50, 75, 100, 150, 200, 250, 500]) if ((wM * 1000) / s + fixedWmm <= DRAW.w && (hM * 1000) / s + fixedHmm <= DRAW.h) return s;
  return 500;
}
interface RoofDims {
  length: number;
  span: number;
  tilt: number;
  gutter: number;
  ridge: number;
}
function dims(p: Project): RoofDims {
  const est = roofOf(p);
  const rp = p.pv.roofPlanes[0];
  const tilt = rp?.tiltDeg ?? est?.tiltDeg ?? 35;
  const length = rp?.widthM ?? est?.ridgeLengthM ?? 10;
  const span = est?.spanM ?? (rp ? 2 * rp.slopeLengthM * Math.cos((tilt * Math.PI) / 180) : 8);
  const gutter = est?.gutterHeightM ?? 3;
  return { length, span, tilt, gutter, ridge: Math.round((gutter + (span / 2) * Math.tan((tilt * Math.PI) / 180)) * 10) / 10 };
}

function roofTop(p: Project, d: RoofDims, x: number, y: number, k: number, withPv: boolean, label: string) {
  const parts: string[] = [];
  const W = d.length * k, H = d.span * k;
  parts.push(`<rect x="${n(x)}" y="${n(y)}" width="${n(W)}" height="${n(H)}" fill="#fde7d6" stroke="#111" stroke-width="0.4"/>`);
  for (let i = 1; i < 14; i++) parts.push(`<line x1="${n(x)}" y1="${n(y + (H * i) / 14)}" x2="${n(x + W)}" y2="${n(y + (H * i) / 14)}" stroke="#d6a98a" stroke-width="0.12"/>`);
  parts.push(`<line x1="${n(x)}" y1="${n(y + H / 2)}" x2="${n(x + W)}" y2="${n(y + H / 2)}" stroke="#111" stroke-width="0.4"/>`);
  if (withPv) {
    p.pv.layouts.forEach((l, idx) => {
      const rp = p.pv.roofPlanes.find((r) => r.id === l.roofPlaneId);
      if (!rp) return;
      const cos = Math.cos((rp.tiltDeg * Math.PI) / 180);
      const sx = W / rp.widthM;
      for (const pn of l.panels) {
        const px = x + pn.x * sx, pw = pn.w * sx, ph = pn.h * cos * k;
        // pan équipé principal = bas du dessin (égout en bas), second pan = haut
        const py = idx === 0 ? y + H - (pn.y * cos * k) - ph : y + pn.y * cos * k;
        parts.push(`<rect x="${n(px)}" y="${n(py)}" width="${n(pw)}" height="${n(ph)}" fill="${COLORS.pv}" stroke="${COLORS.pvStroke}" stroke-width="0.1"/>`);
      }
    });
  }
  const pv = p.pv.layouts[0] ? p.pv.roofPlanes.find((r) => r.id === p.pv.layouts[0].roofPlaneId) : undefined;
  parts.push(text(x + W / 2, y - 2, label, 3, { anchor: "middle", weight: "bold" }));
  parts.push(text(x + W / 2, y + H + 4, `Égout : ${pv ? pv.label : "pan équipé"}`, 2.4, { anchor: "middle" }));
  parts.push(dimension(x, y + H, x + W, y + H, fmtM(d.length), 7));
  return parts.join("");
}

function facadeElev(p: Project, d: RoofDims, x: number, yBase: number, k: number, withPv: boolean, label: string, kind: "long" | "pignon") {
  const parts: string[] = [];
  const Wm = kind === "long" ? d.length : d.span;
  const W = Wm * k;
  const g = d.gutter * k, r = d.ridge * k;
  parts.push(`<rect x="${n(x)}" y="${n(yBase - g)}" width="${n(W)}" height="${n(g)}" fill="#f5f0e6" stroke="#111" stroke-width="0.4"/>`);
  if (kind === "long") {
    parts.push(`<rect x="${n(x - 0.6)}" y="${n(yBase - r)}" width="${n(W + 1.2)}" height="${n(r - g)}" fill="#e9b99a" stroke="#111" stroke-width="0.4"/>`);
    if (withPv && p.pv.layouts[0]) {
      const l = p.pv.layouts[0];
      const rp = p.pv.roofPlanes.find((z) => z.id === l.roofPlaneId);
      if (rp) {
        const sin = Math.sin((rp.tiltDeg * Math.PI) / 180);
        const sx = W / rp.widthM;
        for (const pn of l.panels) parts.push(`<rect x="${n(x + pn.x * sx)}" y="${n(yBase - g - (pn.y + pn.h) * sin * k)}" width="${n(pn.w * sx)}" height="${n(pn.h * sin * k)}" fill="${COLORS.pv}" stroke="${COLORS.pvStroke}" stroke-width="0.1"/>`);
      }
    }
  } else {
    parts.push(`<path d="M${n(x - 0.6)},${n(yBase - g)}L${n(x + W / 2)},${n(yBase - r)}L${n(x + W + 0.6)},${n(yBase - g)}Z" fill="#f5f0e6" stroke="#111" stroke-width="0.4"/>`);
    if (withPv && p.pv.layouts[0]) {
      const fb = fieldBounds(p.pv.layouts[0]);
      if (fb) {
        const c = Math.cos((d.tilt * Math.PI) / 180), s = Math.sin((d.tilt * Math.PI) / 180);
        parts.push(`<line x1="${n(x + fb.y0 * c * k)}" y1="${n(yBase - g - fb.y0 * s * k - 0.6)}" x2="${n(x + fb.y1 * c * k)}" y2="${n(yBase - g - fb.y1 * s * k - 0.6)}" stroke="${COLORS.pv}" stroke-width="1"/>`);
      }
    }
  }
  parts.push(`<line x1="${n(x - 4)}" y1="${n(yBase)}" x2="${n(x + W + 4)}" y2="${n(yBase)}" stroke="#111" stroke-width="0.5"/>`);
  parts.push(text(x + W / 2, yBase + 5, label, 2.7, { anchor: "middle", weight: "bold" }));
  return parts.join("");
}

export function dp4(ctx: PlanContext): string[] {
  const { project: p } = ctx;
  const d = dims(p);
  const pvPlane = p.pv.layouts[0] ? p.pv.roofPlanes.find((r) => r.id === p.pv.layouts[0].roofPlaneId) : undefined;
  const panel = ctx.panel;
  const materials = [
    "Couverture existante conservée : " + ({ tuile_terre_cuite: "tuiles terre cuite", ardoise: "ardoises", tuile_beton: "tuiles béton", bac_acier: "bac acier", autre: "matériau existant" }[pvPlane?.covering ?? "tuile_terre_cuite"]),
    panel ? `Modules : ${panel.fullBlack ? "full black" : `cellules ${panel.cellColor}`}, cadre ${panel.frameColor}, ${panel.widthMm}×${panel.heightMm} mm` : "Modules photovoltaïques",
    `Pose ${p.pv.mounting === "integration" ? "intégrée au bâti" : "en surimposition, parallèle à la toiture"}`,
  ];
  // page 1 : toitures avant / après
  const k1 = 1000 / fitScale(d.length * 2, d.span, 30, 40);
  const s1 = Math.round(1000 / k1);
  const top = DRAW.y + 20;
  const p1 = [
    roofTop(p, d, DRAW.x + 8, top, k1, false, "État initial : toiture"),
    roofTop(p, d, DRAW.x + 16 + d.length * k1, top, k1, true, "État projeté : toiture"),
    northArrow(DRAW.x + DRAW.w - 10, DRAW.y + 12, pvPlane ? 180 - pvPlane.azimuthDeg : 0),
    scaleBar(DRAW.x + 6, DRAW.y + DRAW.h - 7, s1, 40),
  ].join("");
  const page1 = page(p1, {
    ...ctx.cartouche,
    code: "DP4",
    title: "Plan des toitures (1/2)",
    scale: `1/${s1}`,
    legend: [{ kind: "fill", color: "#fde7d6", label: "Couverture existante" }, { kind: "fill", color: COLORS.pv, label: "Panneaux projetés" }, { kind: "line", color: "#111", label: "Faîtage" }],
    notes: materials,
  });
  // page 2 : façades
  const k2 = 1000 / fitScale(d.length * 2, d.ridge * 2, 30, 50);
  const s2 = Math.round(1000 / k2);
  const row1 = DRAW.y + 10 + d.ridge * k2;
  const row2 = row1 + 16 + d.ridge * k2;
  const facadeName = pvPlane ? `Façade ${orientationLabel(pvPlane.azimuthDeg).toLowerCase()}` : "Façade côté panneaux";
  const p2 = [
    facadeElev(p, d, DRAW.x + 6, row1, k2, false, `${facadeName} : état initial`, "long"),
    facadeElev(p, d, DRAW.x + 14 + d.length * k2, row1, k2, true, `${facadeName} : état projeté`, "long"),
    facadeElev(p, d, DRAW.x + 6, row2, k2, false, "Façade opposée : inchangée", "long"),
    facadeElev(p, d, DRAW.x + 14 + d.length * k2, row2, k2, true, "Pignons : état projeté", "pignon"),
    dimension(DRAW.x + 6 + d.length * k2, row1, DRAW.x + 6 + d.length * k2, row1 - d.ridge * k2, fmtM(d.ridge), -4),
    scaleBar(DRAW.x + DRAW.w - 60, DRAW.y + DRAW.h - 7, s2, 40),
  ].join("");
  const page2 = page(p2, {
    ...ctx.cartouche,
    code: "DP4",
    title: "Plan des façades (2/2)",
    scale: `1/${s2}`,
    legend: [{ kind: "fill", color: "#f5f0e6", label: "Façade existante" }, { kind: "fill", color: "#e9b99a", label: "Toiture existante" }, { kind: "fill", color: COLORS.pv, label: "Panneaux projetés" }],
    notes: [...materials, "Façades représentées de façon simplifiée (ouvertures non relevées) : seules la toiture et son aspect sont modifiés."],
  });
  return [page1, page2];
}

export const PLAN_PAGE = PAGE;
