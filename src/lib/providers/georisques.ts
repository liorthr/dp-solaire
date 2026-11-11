// Géorisques : risques connus sur la commune (informatif) - Licence Ouverte
import type { RiskInfo } from "@/lib/types";
import { fetchJson } from "./core";

export const GEORISQUES_ID = "georisques";

interface GaspRisques {
  data: { risques_detail: { num_risque: string; libelle_risque_long: string }[] }[];
}

export function parseRisks(json: GaspRisques): RiskInfo[] {
  const d = json.data?.[0]?.risques_detail ?? [];
  // on ne garde que les familles principales (codes à 2 chiffres) pour la lisibilité
  return d.filter((r) => r.num_risque.length <= 2).map((r) => ({ code: r.num_risque, label: r.libelle_risque_long }));
}

export async function risksForCommune(insee: string) {
  const url = `https://georisques.gouv.fr/api/v1/gaspar/risques?code_insee=${insee}`;
  const { data, meta } = await fetchJson<GaspRisques>(GEORISQUES_ID, url);
  return { risks: parseRisks(data), meta };
}
