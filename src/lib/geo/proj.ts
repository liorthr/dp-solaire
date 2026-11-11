// Projections : WGS84 ↔ Lambert-93 (EPSG:2154), mesures en mètres.
import proj4 from "proj4";
import type { MultiPolygon, Polygon, Position } from "geojson";

export const L93 =
  "+proj=lcc +lat_0=46.5 +lon_0=3 +lat_1=49 +lat_2=44 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs";

const conv = proj4("EPSG:4326", L93);
export const toL93 = (p: Position): [number, number] => conv.forward([p[0], p[1]]) as [number, number];
export const fromL93 = (p: Position): [number, number] => conv.inverse([p[0], p[1]]) as [number, number];

export function outerRing(g: Polygon | MultiPolygon): Position[] {
  if (g.type === "Polygon") return g.coordinates[0];
  // plus grand polygone
  return g.coordinates.map((p) => p[0]).sort((a, b) => ringArea(b.map(toL93)) - ringArea(a.map(toL93)))[0];
}

export function ringArea(ring: Position[]): number {
  let s = 0;
  for (let i = 0; i < ring.length - 1; i++) s += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  return Math.abs(s / 2);
}

export interface OrientedRect {
  center: [number, number]; // L93
  /** angle (rad) du grand côté par rapport à l'axe x (est) */
  angle: number;
  length: number; // grand côté (m)
  width: number; // petit côté (m)
  corners: [number, number][]; // L93
}

/** rectangle orienté d'aire minimale (méthode des côtés : un côté du rectangle est colinéaire à une arête) */
export function minAreaRect(ptsL93: [number, number][]): OrientedRect {
  const pts = ptsL93;
  let best: { area: number; angle: number; minX: number; maxX: number; minY: number; maxY: number } | null = null;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = Math.atan2(pts[i + 1][1] - pts[i][1], pts[i + 1][0] - pts[i][0]);
    const c = Math.cos(-a);
    const s = Math.sin(-a);
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const [x, y] of pts) {
      const rx = x * c - y * s;
      const ry = x * s + y * c;
      minX = Math.min(minX, rx); maxX = Math.max(maxX, rx); minY = Math.min(minY, ry); maxY = Math.max(maxY, ry);
    }
    const area = (maxX - minX) * (maxY - minY);
    if (!best || area < best.area) best = { area, angle: a, minX, maxX, minY, maxY };
  }
  if (!best) throw new Error("polygone vide");
  let { angle } = best;
  let length = best.maxX - best.minX;
  let width = best.maxY - best.minY;
  const c = Math.cos(angle), s = Math.sin(angle);
  const back = (x: number, y: number): [number, number] => [x * c - y * s, x * s + y * c];
  const corners = [back(best.minX, best.minY), back(best.maxX, best.minY), back(best.maxX, best.maxY), back(best.minX, best.maxY)];
  const cx = (best.minX + best.maxX) / 2, cy = (best.minY + best.maxY) / 2;
  const center = back(cx, cy);
  if (width > length) {
    [length, width] = [width, length];
    angle += Math.PI / 2;
  }
  return { center, angle: normAngle(angle), length, width, corners };
}

const normAngle = (a: number) => {
  let x = a % Math.PI;
  if (x < 0) x += Math.PI;
  return x;
};

/** azimut géographique (0 = N, 90 = E) d'un vecteur L93 (dx, dy) */
export const bearingOf = (dx: number, dy: number) => ((Math.atan2(dx, dy) * 180) / Math.PI + 360) % 360;

export const dist = (a: [number, number], b: [number, number]) => Math.hypot(a[0] - b[0], a[1] - b[1]);
