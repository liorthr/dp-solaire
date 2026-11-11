// Primitives SVG des plans (unités : millimètres papier, A4 paysage 297 × 210).
export const PAGE = { w: 297, h: 210, margin: 8 };
export const FRAME = { x: PAGE.margin, y: PAGE.margin, w: PAGE.w - 2 * PAGE.margin, h: PAGE.h - 2 * PAGE.margin };
/** zone de dessin (à gauche du cartouche) */
export const DRAW = { x: FRAME.x + 2, y: FRAME.y + 2, w: FRAME.w - 74, h: FRAME.h - 4 };
export const SIDE = { x: FRAME.x + FRAME.w - 68, y: FRAME.y + 2, w: 66, h: FRAME.h - 4 };

export const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
export const n = (v: number) => (Math.round(v * 100) / 100).toString();
const FONT = "Helvetica, Arial, sans-serif";

export function text(x: number, y: number, s: string, size = 3, opts: { anchor?: "start" | "middle" | "end"; weight?: "bold" | "normal"; fill?: string; rotate?: number } = {}) {
  const rot = opts.rotate ? ` transform="rotate(${n(opts.rotate)} ${n(x)} ${n(y)})"` : "";
  return `<text x="${n(x)}" y="${n(y)}" font-family="${FONT}" font-size="${size}" text-anchor="${opts.anchor ?? "start"}" font-weight="${opts.weight ?? "normal"}" fill="${opts.fill ?? "#111"}"${rot}>${esc(s)}</text>`;
}

/** texte multi-lignes avec retour à la ligne approximatif (largeur en mm) */
export function wrapText(x: number, y: number, s: string, size: number, maxW: number, lineH = size * 1.3, opts: { weight?: "bold" | "normal"; fill?: string } = {}) {
  const words = s.split(/\s+/);
  const maxChars = Math.max(8, Math.floor(maxW / (size * 0.5)));
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > maxChars) {
      if (cur) lines.push(cur);
      cur = w;
    } else cur = (cur + " " + w).trim();
  }
  if (cur) lines.push(cur);
  return { svg: lines.map((l, i) => text(x, y + i * lineH, l, size, opts)).join(""), height: lines.length * lineH };
}

export interface Cartouche {
  code: string; // DP1
  title: string;
  reference: string;
  address: string;
  parcels: string;
  scale?: string;
  date: string;
  company: string;
  client: string;
  notes?: string[];
  legend?: { kind: "fill" | "line" | "dash" | "arrow" | "dot"; color: string; label: string }[];
}

export function page(content: string, c: Cartouche, extras = ""): string {
  const s = SIDE;
  let y = s.y + 8;
  const parts: string[] = [];
  parts.push(`<rect x="${n(FRAME.x)}" y="${n(FRAME.y)}" width="${n(FRAME.w)}" height="${n(FRAME.h)}" fill="none" stroke="#111" stroke-width="0.5"/>`);
  parts.push(`<line x1="${n(s.x - 2)}" y1="${n(FRAME.y)}" x2="${n(s.x - 2)}" y2="${n(FRAME.y + FRAME.h)}" stroke="#111" stroke-width="0.4"/>`);
  parts.push(`<rect x="${n(s.x)}" y="${n(s.y)}" width="${n(s.w)}" height="16" fill="#0f3d2e"/>`);
  parts.push(text(s.x + 3, s.y + 7, c.code, 6, { weight: "bold", fill: "#fff" }));
  parts.push(text(s.x + 3, s.y + 13, c.title, 3.2, { fill: "#fff" }));
  y = s.y + 22;
  const row = (label: string, value: string) => {
    parts.push(text(s.x + 1, y, label, 2.2, { fill: "#555" }));
    const w = wrapText(s.x + 1, y + 3.4, value, 2.8, s.w - 2, 3.4, { weight: "bold" });
    parts.push(w.svg);
    y += 4 + w.height;
  };
  row("Dossier", c.reference);
  row("Adresse du terrain", c.address);
  row("Cadastre", c.parcels);
  row("Maître d'ouvrage", c.client);
  if (c.scale) row("Échelle", c.scale);
  row("Établi par", `${c.company} : ${c.date}`);
  if (c.legend?.length) {
    y += 2;
    parts.push(text(s.x + 1, y, "Légende", 2.8, { weight: "bold" }));
    y += 4;
    for (const l of c.legend) {
      if (l.kind === "fill") parts.push(`<rect x="${n(s.x + 1)}" y="${n(y - 2.5)}" width="6" height="3" fill="${l.color}" stroke="#333" stroke-width="0.2"/>`);
      if (l.kind === "line") parts.push(`<line x1="${n(s.x + 1)}" y1="${n(y - 1)}" x2="${n(s.x + 7)}" y2="${n(y - 1)}" stroke="${l.color}" stroke-width="0.8"/>`);
      if (l.kind === "dash") parts.push(`<line x1="${n(s.x + 1)}" y1="${n(y - 1)}" x2="${n(s.x + 7)}" y2="${n(y - 1)}" stroke="${l.color}" stroke-width="0.6" stroke-dasharray="1.5 0.8"/>`);
      if (l.kind === "dot") parts.push(`<circle cx="${n(s.x + 4)}" cy="${n(y - 1)}" r="1.4" fill="${l.color}"/>`);
      if (l.kind === "arrow") parts.push(arrowShape(s.x + 1, y - 1, 6, 0, l.color, 0.5));
      parts.push(text(s.x + 9, y, l.label, 2.4));
      y += 4;
    }
  }
  if (c.notes?.length) {
    y += 1;
    for (const note of c.notes) {
      const w = wrapText(s.x + 1, y, note, 2.2, s.w - 2, 2.8, { fill: "#333" });
      parts.push(w.svg);
      y += w.height + 1;
    }
  }
  parts.push(text(s.x + 1, FRAME.y + FRAME.h - 3, "Données : © IGN, DGFiP (cadastre), GPU : Licence Ouverte", 1.9, { fill: "#666" }));
  return svgDoc(`${content}${parts.join("")}${extras}`);
}

export const svgDoc = (inner: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${PAGE.w}mm" height="${PAGE.h}mm" viewBox="0 0 ${PAGE.w} ${PAGE.h}"><rect width="${PAGE.w}" height="${PAGE.h}" fill="#fff"/>${inner}</svg>`;

export function arrowShape(x: number, y: number, len: number, angleDeg: number, color = "#111", w = 0.4) {
  const a = (angleDeg * Math.PI) / 180;
  const x2 = x + len * Math.cos(a), y2 = y + len * Math.sin(a);
  const h = Math.min(2, len * 0.35);
  const l1 = [x2 - h * Math.cos(a - 0.45), y2 - h * Math.sin(a - 0.45)];
  const l2 = [x2 - h * Math.cos(a + 0.45), y2 - h * Math.sin(a + 0.45)];
  return `<line x1="${n(x)}" y1="${n(y)}" x2="${n(x2)}" y2="${n(y2)}" stroke="${color}" stroke-width="${w}"/><polygon points="${n(x2)},${n(y2)} ${n(l1[0])},${n(l1[1])} ${n(l2[0])},${n(l2[1])}" fill="${color}"/>`;
}

/** flèche du nord ; `rotationDeg` = rotation du nord géographique dans le dessin (0 = haut) */
export function northArrow(x: number, y: number, rotationDeg = 0) {
  return `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(rotationDeg)})"><circle r="6" fill="#fff" stroke="#111" stroke-width="0.3"/><polygon points="0,-5 2,2 0,0.8 -2,2" fill="#111"/>${text(0, -6.8, "N", 3.2, { anchor: "middle", weight: "bold" })}</g>`;
}

/** échelle graphique : choisit une longueur ronde (m) */
export function scaleBar(x: number, y: number, scale: number, maxMm = 50) {
  const mPerMm = scale / 1000;
  const target = maxMm * mPerMm;
  const nice = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000].filter((v) => v <= target).pop() ?? 1;
  const len = nice / mPerMm;
  const seg = len / 4;
  let s = "";
  for (let i = 0; i < 4; i++) s += `<rect x="${n(x + i * seg)}" y="${n(y)}" width="${n(seg)}" height="1.6" fill="${i % 2 ? "#fff" : "#111"}" stroke="#111" stroke-width="0.2"/>`;
  s += text(x, y + 4.6, "0", 2.4, { anchor: "middle" }) + text(x + len, y + 4.6, `${nice} m`, 2.4, { anchor: "middle" });
  s += text(x + len / 2, y - 1.2, `Échelle 1/${scale}`, 2.4, { anchor: "middle" });
  return s;
}

/** cote (dimension) entre deux points, valeur en mètres */
export function dimension(x1: number, y1: number, x2: number, y2: number, label: string, offset = 4, color = "#b91c1c") {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L, ny = dx / L;
  const a = [x1 + nx * offset, y1 + ny * offset], b = [x2 + nx * offset, y2 + ny * offset];
  const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
  const rot = ang > 90 || ang < -90 ? ang + 180 : ang;
  const mx = (a[0] + b[0]) / 2 + nx * 1.6, my = (a[1] + b[1]) / 2 + ny * 1.6;
  const tick = (p: number[]) => `<line x1="${n(p[0] - nx * 1 - dx / L)}" y1="${n(p[1] - ny * 1 - dy / L)}" x2="${n(p[0] + nx * 1 + dx / L)}" y2="${n(p[1] + ny * 1 + dy / L)}" stroke="${color}" stroke-width="0.25"/>`;
  return (
    `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(a[0])}" y2="${n(a[1])}" stroke="${color}" stroke-width="0.15" stroke-dasharray="0.6 0.6"/>` +
    `<line x1="${n(x2)}" y1="${n(y2)}" x2="${n(b[0])}" y2="${n(b[1])}" stroke="${color}" stroke-width="0.15" stroke-dasharray="0.6 0.6"/>` +
    `<line x1="${n(a[0])}" y1="${n(a[1])}" x2="${n(b[0])}" y2="${n(b[1])}" stroke="${color}" stroke-width="0.25"/>` +
    tick(a) + tick(b) +
    text(mx, my + 0.8, label, 2.6, { anchor: "middle", fill: color, rotate: rot })
  );
}

/** choisit une échelle normalisée pour faire tenir `extentM` mètres dans `paperMm` */
export function pickScale(extentM: number, paperMm: number, candidates = [50, 100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000, 25000]) {
  for (const s of candidates) if ((extentM * 1000) / s <= paperMm) return s;
  return candidates[candidates.length - 1];
}

export const fmtM = (m: number) => `${(Math.round(m * 100) / 100).toFixed(2).replace(".", ",")} m`;
