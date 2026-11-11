// PVGIS (Commission européenne, JRC) : productible annuel. API sans CORS : via proxy, sinon estimation dégradée.
import type { SolarEstimate, SourceMeta } from "@/lib/types";
import { degradedMeta, fetchJson, proxyBase, providerMode, r6 } from "./core";

export const PVGIS_ID = "pvgis";

/** convention PVGIS : aspect 0 = sud, -90 = est, 90 = ouest. Notre azimut : 180 = sud. */
export const toPvgisAspect = (azimuthDeg: number) => Math.round(((azimuthDeg - 180 + 540) % 360) - 180);

export function pvgisUrl(lat: number, lon: number, tiltDeg: number, azimuthDeg: number) {
  return `https://re.jrc.ec.europa.eu/api/v5_2/PVcalc?lat=${r6(lat)}&lon=${r6(lon)}&peakpower=1&loss=14&angle=${Math.round(tiltDeg)}&aspect=${toPvgisAspect(azimuthDeg)}&outputformat=json`;
}

/**
 * Estimation de repli (documentée, indicative) : productible ≈ 1350 − 22×(lat − 43) kWh/kWc à l'optimum,
 * pondéré par l'orientation et l'inclinaison. Ordre de grandeur cohérent avec PVGIS en France métropolitaine
 * (≈ 950 au nord, ≈ 1400 au sud). Utilisé uniquement si PVGIS est inaccessible ; affiché « estimation ».
 */
export function approxYield(lat: number, tiltDeg: number, azimuthDeg: number) {
  const base = 1350 - 22 * (lat - 43);
  const dev = Math.abs(((azimuthDeg - 180 + 540) % 360) - 180); // écart au sud
  const orient = 1 - 0.0025 * dev - 0.000008 * dev * dev * 0.5;
  const tilt = 1 - 0.00012 * (tiltDeg - 32) ** 2;
  return Math.max(400, Math.round(base * Math.max(0.55, orient) * Math.max(0.7, tilt)));
}

export async function solarYield(lat: number, lon: number, tiltDeg: number, azimuthDeg: number, powerKwc: number): Promise<{ estimate: SolarEstimate; meta: SourceMeta }> {
  const url = pvgisUrl(lat, lon, tiltDeg, azimuthDeg);
  const isServer = typeof window === "undefined";
  if (isServer || providerMode() !== "live" || proxyBase()) {
    try {
      const { data, meta } = await fetchJson<{ outputs: { totals: { fixed: { E_y: number } } } }>(PVGIS_ID, url, { viaProxy: !isServer && providerMode() === "live", timeoutMs: 20_000 });
      const ey = data.outputs.totals.fixed.E_y;
      return { estimate: { kwhPerKwcYear: Math.round(ey), annualKwh: Math.round(ey * powerKwc), method: "pvgis" }, meta };
    } catch {
      /* repli */
    }
  }
  const y = approxYield(lat, tiltDeg, azimuthDeg);
  return {
    estimate: { kwhPerKwcYear: y, annualKwh: Math.round(y * powerKwc), method: "approx_latitude" },
    meta: degradedMeta(PVGIS_ID, "PVGIS indisponible (pas de proxy serveur) : estimation indicative par latitude", url),
  };
}
