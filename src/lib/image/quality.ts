// Contrôle qualité d'une photo : résolution, luminosité moyenne, netteté (variance du laplacien).
// Fonctions pures sur un tableau de luminance → testables sans navigateur.
import type { PhotoQuality } from "@/lib/types";

export const QUALITY_THRESHOLDS = {
  minMegapixels: 2, // ≈ 1600×1200
  minBrightness: 60, // 0..255
  maxBrightness: 225,
  minSharpness: 60, // variance du laplacien sur image réduite à ~800 px
};

export function luminance(rgba: Uint8ClampedArray | Uint8Array, w: number, h: number): Float32Array {
  const out = new Float32Array(w * h);
  for (let i = 0, j = 0; j < out.length; i += 4, j++) out[j] = 0.299 * rgba[i] + 0.587 * rgba[i + 1] + 0.114 * rgba[i + 2];
  return out;
}

export function meanOf(a: Float32Array) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i];
  return s / a.length;
}

export function laplacianVariance(lum: Float32Array, w: number, h: number) {
  let s = 0, s2 = 0, n = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const v = 4 * lum[i] - lum[i - 1] - lum[i + 1] - lum[i - w] - lum[i + w];
      s += v; s2 += v * v; n++;
    }
  }
  if (!n) return 0;
  const m = s / n;
  return s2 / n - m * m;
}

export function assessQuality(params: { width: number; height: number; brightness: number; sharpness: number }, kind: "facade" | "proche" | "lointain"): PhotoQuality {
  const issues: PhotoQuality["issues"] = [];
  const mp = (params.width * params.height) / 1e6;
  const T = QUALITY_THRESHOLDS;
  if (mp < T.minMegapixels) issues.push({ code: "resolution", message: `résolution trop faible (${mp.toFixed(1)} Mpx) : utilisez l'appareil photo en pleine résolution (2 Mpx minimum).` });
  if (params.brightness < T.minBrightness) issues.push({ code: "sombre", message: "la photo est trop sombre : reprenez-la en plein jour, soleil dans le dos." });
  if (params.brightness > T.maxBrightness) issues.push({ code: "surexposee", message: "la photo est surexposée : évitez le contre-jour." });
  if (params.sharpness < T.minSharpness) issues.push({ code: "flou", message: "la photo est floue : tenez l'appareil immobile et faites la mise au point sur la maison." });
  if (kind === "facade" && params.width < params.height) issues.push({ code: "cadrage", message: "photo en portrait : pour la façade, préférez le format paysage avec toute la toiture visible." });
  return { ok: issues.length === 0, brightness: Math.round(params.brightness), sharpness: Math.round(params.sharpness), megapixels: Math.round(mp * 10) / 10, issues };
}
