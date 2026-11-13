// Homographie plane (4 points) : place un champ de panneaux rectangulaire en perspective sur une photo.
export type Pt = [number, number];
export type Mat3 = [number, number, number, number, number, number, number, number, number];

/** résout A x = b (Gauss avec pivot partiel) */
function solve(A: number[][], b: number[]): number[] {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    if (Math.abs(M[p][c]) < 1e-12) throw new Error("Points dégénérés : les 4 coins ne doivent pas être alignés");
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = M[r][c] / M[c][c];
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
    }
  }
  return M.map((row, i) => row[n] / row[i]);
}

/** homographie H telle que H(src[i]) = dst[i] */
export function homography(src: Pt[], dst: Pt[]): Mat3 {
  if (src.length !== 4 || dst.length !== 4) throw new Error("4 points requis");
  const A: number[][] = [];
  const b: number[] = [];
  for (let i = 0; i < 4; i++) {
    const [x, y] = src[i];
    const [u, v] = dst[i];
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]);
    b.push(u);
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y]);
    b.push(v);
  }
  const h = solve(A, b);
  return [h[0], h[1], h[2], h[3], h[4], h[5], h[6], h[7], 1];
}

export function apply(H: Mat3, [x, y]: Pt): Pt {
  const w = H[6] * x + H[7] * y + H[8];
  return [(H[0] * x + H[1] * y + H[2]) / w, (H[3] * x + H[4] * y + H[5]) / w];
}

export function invert(H: Mat3): Mat3 {
  const [a, b, c, d, e, f, g, h, i] = H;
  const A = e * i - f * h, B = -(d * i - f * g), C = d * h - e * g;
  const det = a * A + b * B + c * C;
  if (Math.abs(det) < 1e-12) throw new Error("Homographie non inversible");
  const inv = [A, -(b * i - c * h), b * f - c * e, B, a * i - c * g, -(a * f - c * d), C, -(a * h - b * g), a * e - b * d].map((v) => v / det);
  return inv.map((v) => v / inv[8]) as Mat3;
}

/** vérifie que le quadrilatère est convexe et dans l'ordre (HG, HD, BD, BG) */
export function isConvexQuad(q: Pt[]): boolean {
  if (q.length !== 4) return false;
  let sign = 0;
  for (let i = 0; i < 4; i++) {
    const [ax, ay] = q[i], [bx, by] = q[(i + 1) % 4], [cx, cy] = q[(i + 2) % 4];
    const z = (bx - ax) * (cy - by) - (by - ay) * (cx - bx);
    if (Math.abs(z) < 1e-9) return false;
    const s = Math.sign(z);
    if (!sign) sign = s;
    else if (s !== sign) return false;
  }
  return true;
}

/**
 * Rendu (navigateur) : dessine un champ rows×cols de panneaux dans le quadrilatère, par échantillonnage inverse pixel à pixel.
 * Texture : cellules, cadre (noir / argent), reflet léger.
 */
export function renderPanels(ctx: CanvasRenderingContext2D, quad: Pt[], rows: number, cols: number, style: { frame: "noir" | "argent"; cell: "noir" | "bleu" }) {
  const unit: Pt[] = [[0, 0], [1, 0], [1, 1], [0, 1]];
  const Hinv = invert(homography(unit, quad));
  const xs = quad.map((p) => p[0]), ys = quad.map((p) => p[1]);
  const x0 = Math.max(0, Math.floor(Math.min(...xs))), x1 = Math.min(ctx.canvas.width, Math.ceil(Math.max(...xs)));
  const y0 = Math.max(0, Math.floor(Math.min(...ys))), y1 = Math.min(ctx.canvas.height, Math.ceil(Math.max(...ys)));
  if (x1 <= x0 || y1 <= y0) return;
  const img = ctx.getImageData(x0, y0, x1 - x0, y1 - y0);
  const d = img.data;
  const cellRGB = style.cell === "noir" ? [22, 24, 30] : [28, 42, 92];
  const frameRGB = style.frame === "noir" ? [12, 12, 14] : [175, 178, 182];
  const gap = 0.012, frameW = 0.035;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const [u, v] = apply(Hinv, [x + 0.5, y + 0.5]);
      if (u < 0 || u > 1 || v < 0 || v > 1) continue;
      const pu = u * cols, pv = v * rows;
      const fu = pu - Math.floor(pu), fv = pv - Math.floor(pv);
      const i = ((y - y0) * (x1 - x0) + (x - x0)) * 4;
      if (fu < gap || fu > 1 - gap || fv < gap || fv > 1 - gap) continue; // joint : on laisse voir la toiture
      let rgb: number[];
      if (fu < frameW || fu > 1 - frameW || fv < frameW * 0.7 || fv > 1 - frameW * 0.7) rgb = frameRGB;
      else {
        const cu = (fu * 6) % 1, cv = (fv * 10) % 1;
        const grid = cu < 0.04 || cv < 0.04;
        const sheen = 18 * (1 - v) * (0.6 + 0.4 * u);
        rgb = cellRGB.map((c) => c + sheen + (grid && style.cell === "bleu" ? 25 : grid ? 10 : 0));
      }
      d[i] = rgb[0] * 0.92 + d[i] * 0.08;
      d[i + 1] = rgb[1] * 0.92 + d[i + 1] * 0.08;
      d[i + 2] = rgb[2] * 0.92 + d[i + 2] * 0.08;
    }
  }
  ctx.putImageData(img, x0, y0);
}

const hexRgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) || 0);

/** échantillonnage inverse générique : shade(u, v, rgbOriginal) → rgb à écrire (ou null pour laisser l'original) */
function warpShade(ctx: CanvasRenderingContext2D, quad: Pt[], shade: (u: number, v: number, orig: number[]) => number[] | null) {
  const unit: Pt[] = [[0, 0], [1, 0], [1, 1], [0, 1]];
  const Hinv = invert(homography(unit, quad));
  const xs = quad.map((p) => p[0]), ys = quad.map((p) => p[1]);
  const x0 = Math.max(0, Math.floor(Math.min(...xs))), x1 = Math.min(ctx.canvas.width, Math.ceil(Math.max(...xs)));
  const y0 = Math.max(0, Math.floor(Math.min(...ys))), y1 = Math.min(ctx.canvas.height, Math.ceil(Math.max(...ys)));
  if (x1 <= x0 || y1 <= y0) return;
  const img = ctx.getImageData(x0, y0, x1 - x0, y1 - y0);
  const d = img.data;
  for (let y = y0; y < y1; y++)
    for (let x = x0; x < x1; x++) {
      const [u, v] = apply(Hinv, [x + 0.5, y + 0.5]);
      if (u < 0 || u > 1 || v < 0 || v > 1) continue;
      const i = ((y - y0) * (x1 - x0) + (x - x0)) * 4;
      const rgb = shade(u, v, [d[i], d[i + 1], d[i + 2]]);
      if (!rgb) continue;
      d[i] = rgb[0];
      d[i + 1] = rgb[1];
      d[i + 2] = rgb[2];
    }
  ctx.putImageData(img, x0, y0);
}

/** unité extérieure de pompe à chaleur (caisson clair + grille de ventilateur, ou habillage bois) */
export function renderPacUnit(ctx: CanvasRenderingContext2D, quad: Pt[], cover: boolean) {
  warpShade(ctx, quad, (u, v) => {
    const edge = u < 0.02 || u > 0.98 || v < 0.03 || v > 0.97;
    if (edge) return [70, 74, 80];
    if (cover) {
      const slat = (v * 9) % 1;
      const base = slat < 0.18 ? 70 : 128 - 25 * v;
      return [base + 12, base - 6, base - 28];
    }
    const du = (u - 0.4) / 0.3, dv = (v - 0.5) / 0.4;
    const r = Math.hypot(du * 0.75, dv);
    if (r < 1) {
      const ring = (r * 7) % 1 < 0.22;
      return ring ? [55, 60, 66] : [120, 126, 132];
    }
    if (u > 0.78 && v > 0.15 && v < 0.85) return (v * 14) % 1 < 0.3 ? [180, 184, 188] : [222, 225, 228];
    const shade = 236 - 18 * v;
    return [shade, shade + 1, shade + 3];
  });
}

/** façade isolée : enduit teinté (en conservant la lumière de la photo) ou bardage à lames */
export function renderFacadeFinish(ctx: CanvasRenderingContext2D, quad: Pt[], colorHex: string, finish: string) {
  const c = hexRgb(colorHex);
  const bardage = finish.startsWith("bardage");
  const brique = finish === "plaquette_brique";
  warpShade(ctx, quad, (u, v, o) => {
    const lum = (0.299 * o[0] + 0.587 * o[1] + 0.114 * o[2]) / 255;
    // ouvertures conservées : vitrages et menuiseries (sombres) ou encadrements blancs ne sont pas recouverts
    if (lum < 0.55 || (lum > 0.95 && Math.max(...o) - Math.min(...o) < 12)) return null;
    const light = 0.72 + 0.4 * lum;
    let k = 1;
    if (bardage && (u * 40) % 1 < 0.08) k = 0.72;
    if (brique) {
      const row = Math.floor(v * 28);
      const off = row % 2 ? 0.5 : 0;
      if ((v * 28) % 1 < 0.1 || ((u * 12 + off) % 1) < 0.04) return [200, 196, 188];
    }
    const grain = 1 + 0.035 * Math.sin(u * 517 + v * 311);
    return c.map((x) => Math.max(0, Math.min(255, x * light * k * grain)));
  });
}
