"use client";
// Fond de plan IGN (WMTS Géoplateforme, tuiles Web Mercator) assemblé en image pour les plans.
// En cas d'échec réseau : null → le plan est produit en vectoriel seul (mode dégradé signalé).

export const WMTS_LAYERS = {
  plan: { layer: "GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2", format: "image/png", style: "normal" },
  ortho: { layer: "ORTHOIMAGERY.ORTHOPHOTOS", format: "image/jpeg", style: "normal" },
  cadastre: { layer: "CADASTRALPARCELS.PARCELLAIRE_EXPRESS", format: "image/png", style: "PCI vecteur" },
} as const;

export const tileUrl = (l: keyof typeof WMTS_LAYERS, z: number, x: number, y: number) => {
  const L = WMTS_LAYERS[l];
  return `https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=${L.layer}&STYLE=${encodeURIComponent(L.style)}&TILEMATRIXSET=PM&TILEMATRIX=${z}&TILEROW=${y}&TILECOL=${x}&FORMAT=${encodeURIComponent(L.format)}`;
};

const R = 6378137;
export const merc = (lon: number, lat: number): [number, number] => [(R * lon * Math.PI) / 180, R * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))];
const worldSize = (z: number) => 256 * 2 ** z;
/** pixel monde à zoom z */
export const toPixel = (lon: number, lat: number, z: number): [number, number] => {
  const [mx, my] = merc(lon, lat);
  const ws = worldSize(z);
  return [((mx + Math.PI * R) / (2 * Math.PI * R)) * ws, ((Math.PI * R - my) / (2 * Math.PI * R)) * ws];
};

export interface Basemap {
  dataUrl: string;
  /** projette lon/lat vers mm sur l'image (origine en haut à gauche) */
  project: (lon: number, lat: number) => [number, number];
  widthMm: number;
  heightMm: number;
}

async function loadTile(url: string, timeoutMs: number): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    const t = setTimeout(() => resolve(null), timeoutMs);
    img.onload = () => {
      clearTimeout(t);
      resolve(img);
    };
    img.onerror = () => {
      clearTimeout(t);
      resolve(null);
    };
    img.src = url;
  });
}

/**
 * Construit un fond centré sur (lon, lat) à l'échelle `scale` (1/scale au sol), pour une zone papier w×h mm.
 */
export async function buildBasemap(lon: number, lat: number, scale: number, wMm: number, hMm: number, layer: keyof typeof WMTS_LAYERS = "plan", timeoutMs = 8000): Promise<Basemap | null> {
  // mètres sol par mm papier ; en Mercator, 1 m sol = 1/cos(lat) m Mercator
  const groundMPerMm = scale / 1000;
  const k = 1 / Math.cos((lat * Math.PI) / 180);
  const metersPerPxAtZ = (z: number) => (2 * Math.PI * R) / worldSize(z); // Mercator
  // résolution cible : ≈ 6 px/mm (≈150 dpi)
  const targetMercPerPx = (groundMPerMm * k) / 6;
  let z = 19;
  while (z > 5 && metersPerPxAtZ(z) < targetMercPerPx) z--;
  z = Math.min(z + 1, 19);
  if (layer === "cadastre") z = Math.min(z, 19);
  const pxPerMm = (groundMPerMm * k) / metersPerPxAtZ(z);
  const wPx = Math.ceil(wMm * pxPerMm), hPx = Math.ceil(hMm * pxPerMm);
  if (wPx * hPx > 40e6) return null;
  const [cx, cy] = toPixel(lon, lat, z);
  const x0 = cx - wPx / 2, y0 = cy - hPx / 2;
  const canvas = document.createElement("canvas");
  canvas.width = wPx;
  canvas.height = hPx;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#f4f4f0";
  ctx.fillRect(0, 0, wPx, hPx);
  const tiles: Promise<void>[] = [];
  let ok = 0, total = 0;
  for (let tx = Math.floor(x0 / 256); tx <= Math.floor((x0 + wPx) / 256); tx++) {
    for (let ty = Math.floor(y0 / 256); ty <= Math.floor((y0 + hPx) / 256); ty++) {
      total++;
      tiles.push(
        loadTile(tileUrl(layer, z, tx, ty), timeoutMs).then((img) => {
          if (img) {
            ok++;
            ctx.drawImage(img, tx * 256 - x0, ty * 256 - y0);
          }
        }),
      );
    }
  }
  await Promise.all(tiles);
  if (ok < total * 0.6) return null;
  let dataUrl: string;
  try {
    dataUrl = canvas.toDataURL(layer === "ortho" ? "image/jpeg" : "image/png", 0.85);
  } catch {
    return null; // canvas « tainted » (CORS)
  }
  return {
    dataUrl,
    widthMm: wMm,
    heightMm: hMm,
    project: (lo, la) => {
      const [px, py] = toPixel(lo, la, z);
      return [(px - x0) / pxPerMm, (py - y0) / pxPerMm];
    },
  };
}

/** projection sans fond (repli) : même géométrie, sans image */
export function vectorProjector(lon: number, lat: number, scale: number, wMm: number, hMm: number) {
  const z = 18;
  const groundMPerMm = scale / 1000;
  const k = 1 / Math.cos((lat * Math.PI) / 180);
  const pxPerMm = (groundMPerMm * k) / ((2 * Math.PI * R) / worldSize(z));
  const [cx, cy] = toPixel(lon, lat, z);
  return (lo: number, la: number): [number, number] => {
    const [px, py] = toPixel(lo, la, z);
    return [(px - cx) / pxPerMm + wMm / 2, (py - cy) / pxPerMm + hMm / 2];
  };
}
