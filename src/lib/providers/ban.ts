// Base Adresse Nationale : https://api-adresse.data.gouv.fr (Licence Ouverte Etalab)
import type { AddressResult } from "@/lib/types";
import { fetchJson, r6 } from "./core";

export const BAN_ID = "ban";
const BASE = "https://api-adresse.data.gouv.fr";

interface BanFeature {
  geometry: { coordinates: [number, number] };
  properties: {
    label: string;
    housenumber?: string;
    street?: string;
    name?: string;
    postcode: string;
    city: string;
    citycode: string;
    score: number;
    type: string;
  };
}

export function parseBan(json: { features: BanFeature[] }): AddressResult[] {
  return (json.features || []).map((f) => ({
    label: f.properties.label,
    housenumber: f.properties.housenumber,
    street: f.properties.street ?? (f.properties.type === "street" ? f.properties.name : undefined),
    postcode: f.properties.postcode,
    city: f.properties.city,
    insee: f.properties.citycode,
    lon: f.geometry.coordinates[0],
    lat: f.geometry.coordinates[1],
    score: f.properties.score,
    type: f.properties.type,
  }));
}

export function banSearchUrl(q: string, limit = 5) {
  return `${BASE}/search/?q=${encodeURIComponent(q.trim())}&limit=${limit}&autocomplete=1`;
}

export async function searchAddress(q: string, limit = 5) {
  if (q.trim().length < 3) return { results: [] as AddressResult[] };
  const { data, meta } = await fetchJson<{ features: BanFeature[] }>(BAN_ID, banSearchUrl(q, limit), { timeoutMs: 8000, retries: 1 });
  return { results: parseBan(data), meta };
}

export async function reverseGeocode(lon: number, lat: number) {
  const url = `${BASE}/reverse/?lon=${r6(lon)}&lat=${r6(lat)}&limit=1`;
  const { data, meta } = await fetchJson<{ features: BanFeature[] }>(BAN_ID, url, { timeoutMs: 8000 });
  return { result: parseBan(data)[0], meta };
}
