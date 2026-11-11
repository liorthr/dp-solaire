"use client";
// Utilitaires image côté navigateur : chargement, analyse qualité, redimensionnement.
import type { Photo, PhotoQuality } from "@/lib/types";
import { assessQuality, laplacianVariance, luminance, meanOf } from "./quality";

export const asset = (p: string) => `${process.env.NEXT_PUBLIC_BASE_PATH || ""}${p}`;

export async function blobToImage(blob: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return img;
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  }
}

export async function analyzePhoto(blob: Blob, kind: Photo["kind"]): Promise<{ quality: PhotoQuality; width: number; height: number }> {
  const img = await blobToImage(blob);
  const width = img.naturalWidth, height = img.naturalHeight;
  const scale = Math.min(1, 800 / width);
  const w = Math.max(1, Math.round(width * scale)), h = Math.max(1, Math.round(height * scale));
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, w, h);
  const lum = luminance(ctx.getImageData(0, 0, w, h).data, w, h);
  const quality = assessQuality({ width, height, brightness: meanOf(lum), sharpness: laplacianVariance(lum, w, h) }, kind);
  return { quality, width, height };
}

/** réduit une image pour l'intégrer au PDF (JPEG) */
export async function imageToJpegDataUrl(source: HTMLCanvasElement | HTMLImageElement, maxW = 1800, q = 0.85): Promise<{ dataUrl: string; w: number; h: number }> {
  const sw = source instanceof HTMLImageElement ? source.naturalWidth : source.width;
  const sh = source instanceof HTMLImageElement ? source.naturalHeight : source.height;
  const s = Math.min(1, maxW / sw);
  const c = document.createElement("canvas");
  c.width = Math.round(sw * s);
  c.height = Math.round(sh * s);
  c.getContext("2d")!.drawImage(source, 0, 0, c.width, c.height);
  return { dataUrl: c.toDataURL("image/jpeg", q), w: c.width, h: c.height };
}

export function scribbleSignature(name: string): string {
  const c = document.createElement("canvas");
  c.width = 400;
  c.height = 120;
  const ctx = c.getContext("2d")!;
  ctx.strokeStyle = "#1e3a8a";
  ctx.lineWidth = 3;
  ctx.beginPath();
  let x = 20;
  ctx.moveTo(x, 70);
  for (const ch of name) {
    const k = ch.charCodeAt(0);
    ctx.quadraticCurveTo(x + 8, 30 + (k % 40), x + 16, 70 + (k % 20) - 10);
    x += 16;
  }
  ctx.stroke();
  return c.toDataURL("image/png");
}
