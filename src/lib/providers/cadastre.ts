// Cadastre : API Carto IGN, module cadastre (Licence Ouverte)
import type { ParcelInfo } from "@/lib/types";
import type { MultiPolygon, Polygon } from "geojson";
import { fetchJson, r6 } from "./core";

export const CADASTRE_ID = "cadastre";

interface CadFeature {
  geometry: MultiPolygon | Polygon;
  properties: { idu: string; section: string; numero: string; contenance: number; com_abs?: string; code_insee: string };
}

export function parseParcels(json: { features: CadFeature[] }): ParcelInfo[] {
  return (json.features || []).map((f) => ({
    idu: f.properties.idu,
    prefixe: f.properties.com_abs || "000",
    section: f.properties.section,
    numero: f.properties.numero,
    contenanceM2: f.properties.contenance,
    geometry: f.geometry,
  }));
}

export function pointGeom(lon: number, lat: number) {
  return encodeURIComponent(JSON.stringify({ type: "Point", coordinates: [r6(lon), r6(lat)] }));
}

export async function parcelsAt(lon: number, lat: number) {
  const url = `https://apicarto.ign.fr/api/cadastre/parcelle?geom=${pointGeom(lon, lat)}`;
  const { data, meta } = await fetchJson<{ features: CadFeature[] }>(CADASTRE_ID, url);
  return { parcels: parseParcels(data), meta };
}
