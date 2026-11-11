// BD TOPO® IGN (Géoplateforme WFS) : emprise et hauteur des bâtiments (Licence Ouverte)
import type { BuildingInfo } from "@/lib/types";
import type { MultiPolygon, Polygon } from "geojson";
import { area } from "@turf/turf";
import { fetchJson } from "./core";

export const BDTOPO_ID = "bdtopo";

interface WfsFeature {
  id?: string;
  geometry: MultiPolygon | Polygon;
  properties: Record<string, unknown>;
}

const num = (v: unknown) => (typeof v === "number" ? v : undefined);

export function parseBuildings(json: { features: WfsFeature[] }): BuildingInfo[] {
  return (json.features || []).map((f) => {
    const p = f.properties;
    // la BD TOPO est en 3D (z) : on ne garde que x,y
    const geometry = stripZ(f.geometry);
    return {
      id: String(p.cleabs ?? f.id),
      heightM: num(p.hauteur),
      altitudeSol: num(p.altitude_minimale_sol),
      altitudeToitMin: num(p.altitude_minimale_toit),
      altitudeToitMax: num(p.altitude_maximale_toit),
      usage: p.usage_1 ? String(p.usage_1) : undefined,
      geometry,
      areaM2: Math.round(area({ type: "Feature", geometry, properties: {} })),
    };
  });
}

function stripZ<T extends MultiPolygon | Polygon>(g: T): T {
  if (g.type === "Polygon") return { ...g, coordinates: g.coordinates.map((r) => r.map((c) => [c[0], c[1]])) } as T;
  return { ...g, coordinates: g.coordinates.map((p) => p.map((r) => r.map((c) => [c[0], c[1]]))) } as T;
}

export function bdtopoUrl(lon: number, lat: number, radiusM = 40) {
  const dLat = radiusM / 111_320;
  const dLon = radiusM / (111_320 * Math.cos((lat * Math.PI) / 180));
  const f = (n: number) => n.toFixed(6);
  const bbox = `${f(lat - dLat)},${f(lon - dLon)},${f(lat + dLat)},${f(lon + dLon)},urn:ogc:def:crs:EPSG::4326`;
  return (
    "https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=BDTOPO_V3:batiment" +
    `&OUTPUTFORMAT=application/json&SRSNAME=EPSG:4326&COUNT=60&BBOX=${bbox}`
  );
}

export async function buildingsAround(lon: number, lat: number, radiusM = 40) {
  const { data, meta } = await fetchJson<{ features: WfsFeature[] }>(BDTOPO_ID, bdtopoUrl(lon, lat, radiusM), { timeoutMs: 20_000 });
  return { buildings: parseBuildings(data), meta };
}
