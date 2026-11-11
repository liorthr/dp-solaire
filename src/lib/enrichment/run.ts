// Orchestration de l'enrichissement : appels parallèles, progression, mode dégradé par source.
import type { AddressResult, BuildingInfo, EnrichmentResult, SourceMeta } from "@/lib/types";
import { booleanPointInPolygon, point, pointToPolygonDistance } from "@turf/turf";
import { parcelsAt } from "@/lib/providers/cadastre";
import { generatorsWithin, urbanismAt } from "@/lib/providers/gpu";
import { buildingsAround } from "@/lib/providers/bdtopo";
import { risksForCommune } from "@/lib/providers/georisques";
import { mairieFor } from "@/lib/providers/annuaire";
import { degradedMeta, ProviderError } from "@/lib/providers/core";
import { analyzeHeritage, searchCircle } from "./heritage";

export type StepId = "cadastre" | "urbanisme" | "patrimoine" | "bati" | "risques" | "mairie";
export const STEPS: { id: StepId; label: string }[] = [
  { id: "cadastre", label: "Parcelle cadastrale" },
  { id: "urbanisme", label: "Zonage PLU et servitudes" },
  { id: "patrimoine", label: "Monuments historiques / ABF" },
  { id: "bati", label: "Bâtiment (emprise, hauteur)" },
  { id: "risques", label: "Risques (Géorisques)" },
  { id: "mairie", label: "Mairie destinataire" },
];

export type Progress = (step: StepId, status: "running" | "ok" | "degraded" | "error", message?: string) => void;

const errMeta = (provider: string, e: unknown): SourceMeta =>
  degradedMeta(provider, `${e instanceof Error ? e.message : String(e)} : saisie manuelle possible`, e instanceof ProviderError ? e.url : undefined, "error");

/** bâtiment contenant le point, sinon le plus proche (priorité au résidentiel) */
export function pickMainBuilding(buildings: BuildingInfo[], lon: number, lat: number): BuildingInfo | undefined {
  const pt = point([lon, lat]);
  const inside = buildings.find((b) => booleanPointInPolygon(pt, b.geometry));
  if (inside) return inside;
  const scored = buildings
    .filter((b) => b.areaM2 >= 25)
    .map((b) => ({ b, d: pointToPolygonDistance(pt, b.geometry, { units: "meters" }) + (b.usage === "Résidentiel" ? 0 : 15) }))
    .sort((a, b) => a.d - b.d);
  return scored[0]?.b;
}

export async function runEnrichment(address: AddressResult, site: { lon: number; lat: number }, onProgress: Progress = () => {}): Promise<EnrichmentResult> {
  const { lon, lat } = site;
  const sources: Record<string, SourceMeta> = {};
  const result: EnrichmentResult = { address, parcels: [], buildings: [], zones: [], servitudes: [], prescriptions: [], risks: [], sources };

  const step = async <T,>(id: StepId, provider: string, fn: () => Promise<T>, apply: (v: T) => SourceMeta | void) => {
    onProgress(id, "running");
    try {
      const v = await fn();
      const meta = apply(v);
      if (meta) sources[provider] = meta;
      const st = meta && meta.status !== "ok" ? "degraded" : "ok";
      onProgress(id, st, meta?.message);
    } catch (e) {
      sources[provider] = errMeta(provider, e);
      onProgress(id, "error", sources[provider].message);
    }
  };

  let servitudesOk = false;
  await Promise.all([
    step("cadastre", "cadastre", () => parcelsAt(lon, lat), (r) => {
      result.parcels = r.parcels;
      return r.meta;
    }),
    step("urbanisme", "gpu", () => urbanismAt(lon, lat), (r) => {
      result.zones = r.zones;
      result.servitudes = r.servitudes;
      result.prescriptions = r.prescriptions;
      result.rnu = r.rnu;
      servitudesOk = true;
      if (!r.zones.length && !r.rnu) return { ...r.meta, status: "degraded", message: "Aucun zonage numérisé au GPU pour ce point (carte communale ou document non publié ?)" };
      return r.meta;
    }),
    step("bati", "bdtopo", () => buildingsAround(lon, lat), (r) => {
      result.buildings = r.buildings;
      result.mainBuildingId = pickMainBuilding(r.buildings, lon, lat)?.id;
      if (!result.mainBuildingId) return { ...r.meta, status: "degraded", message: "Aucun bâtiment trouvé : dessinez l'emprise sur la carte" };
      return r.meta;
    }),
    step("risques", "georisques", () => risksForCommune(address.insee), (r) => {
      result.risks = r.risks;
      return r.meta;
    }),
    step("mairie", "annuaire", () => mairieFor(address.insee, address.city), (r) => {
      result.mairie = r.mairie;
      return r.meta;
    }),
  ]);

  // patrimoine : dépend des servitudes ; on interroge les générateurs dans un rayon de 600 m
  onProgress("patrimoine", "running");
  let generators: Awaited<ReturnType<typeof generatorsWithin>> | null = null;
  try {
    generators = await generatorsWithin(searchCircle(lon, lat, 600));
  } catch (e) {
    sources["gpu-generateurs"] = errMeta("gpu", e);
  }
  result.heritage = analyzeHeritage(lon, lat, servitudesOk ? result.servitudes : null, generators);
  onProgress("patrimoine", result.heritage.confidence === "haute" ? "ok" : "degraded", result.heritage.divergences[0]);

  result.completedAt = new Date().toISOString();
  return result;
}
