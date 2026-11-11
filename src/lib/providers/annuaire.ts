// Annuaire de l'administration (DILA) : coordonnées de la mairie compétente.
// L'API n'expose pas CORS : appel via proxy serveur si disponible, sinon instantané embarqué, sinon saisie manuelle.
import type { MairieInfo, SourceMeta } from "@/lib/types";
import snapshot from "@/data/annuaire-snapshot.json";
import { degradedMeta, fetchJson, proxyBase, providerMode } from "./core";

export const ANNUAIRE_ID = "annuaire";

interface AnnRecord {
  nom: string;
  adresse_courriel?: string | null;
  telephone?: string | null;
  adresse?: string | null;
  site_internet?: string | null;
  plage_ouverture?: string | null;
  url_service_public?: string | null;
  sve?: string | null;
}

const parseJ = <T,>(s: string | null | undefined, d: T): T => {
  if (!s) return d;
  try {
    return JSON.parse(s) as T;
  } catch {
    return d;
  }
};

export function parseMairie(rec: AnnRecord): MairieInfo {
  const tel = parseJ<{ valeur: string }[]>(rec.telephone, [])[0]?.valeur;
  const adr = parseJ<{ numero_voie?: string; service_distribution?: string; code_postal?: string; nom_commune?: string }[]>(rec.adresse, [])[0];
  const site = parseJ<{ valeur: string }[]>(rec.site_internet, [])[0]?.valeur;
  const hours = parseJ<{ nom_jour_debut: string; nom_jour_fin: string; valeur_heure_debut_1: string; valeur_heure_fin_1: string; valeur_heure_debut_2?: string; valeur_heure_fin_2?: string }[]>(rec.plage_ouverture, [])
    .map((h) => {
      const days = h.nom_jour_debut === h.nom_jour_fin ? h.nom_jour_debut : `${h.nom_jour_debut}–${h.nom_jour_fin}`;
      const t = (x?: string) => (x ? x.slice(0, 5) : "");
      const second = h.valeur_heure_debut_2 ? `, ${t(h.valeur_heure_debut_2)}–${t(h.valeur_heure_fin_2)}` : "";
      return `${days} ${t(h.valeur_heure_debut_1)}–${t(h.valeur_heure_fin_1)}${second}`;
    })
    .join(" ; ");
  const sve = parseJ<{ valeur: string }[]>(rec.sve, [])[0]?.valeur;
  return {
    name: rec.nom,
    email: rec.adresse_courriel || undefined,
    phone: tel,
    address: adr ? [adr.numero_voie, adr.service_distribution, `${adr.code_postal ?? ""} ${adr.nom_commune ?? ""}`.trim()].filter(Boolean).join(", ") : undefined,
    website: site,
    hours: hours || undefined,
    teleserviceUrl: sve,
    sourceUrl: rec.url_service_public || undefined,
  };
}

export function annuaireUrl(insee: string) {
  const where = encodeURIComponent(`pivot like "mairie" and code_insee_commune="${insee}"`);
  return `https://api-lannuaire.service-public.fr/api/explore/v2.1/catalog/datasets/api-lannuaire-administration/records?limit=5&where=${where}`;
}

export const annuaireSearchLink = (city: string) =>
  `https://lannuaire.service-public.gouv.fr/recherche?whoWhat=Mairie&where=${encodeURIComponent(city)}`;

export async function mairieFor(insee: string, city: string): Promise<{ mairie?: MairieInfo; meta: SourceMeta }> {
  const url = annuaireUrl(insee);
  const isServer = typeof window === "undefined";
  const canLive = providerMode() !== "live" || isServer || proxyBase() !== null;
  if (canLive) {
    try {
      const { data, meta } = await fetchJson<{ results: AnnRecord[] }>(ANNUAIRE_ID, url, { viaProxy: !isServer && providerMode() === "live" });
      // la mairie principale d'abord (évite les mairies annexes)
      const recs = [...(data.results || [])].sort((a, b) => Number(/annexe|déléguée/i.test(a.nom)) - Number(/annexe|déléguée/i.test(b.nom)));
      if (recs[0]) return { mairie: parseMairie(recs[0]), meta };
    } catch {
      /* on tente l'instantané */
    }
  }
  const snap = (snapshot as Record<string, AnnRecord>)[insee];
  if (snap) {
    return {
      mairie: parseMairie(snap),
      meta: { ...degradedMeta(ANNUAIRE_ID, "Instantané de l'Annuaire du 11/11/2026 (API sans CORS en mode statique)", url), status: "ok", fromCache: true },
    };
  }
  return {
    meta: degradedMeta(ANNUAIRE_ID, `Coordonnées de la mairie non récupérées automatiquement : consultez ${annuaireSearchLink(city)} et saisissez-les.`, url),
  };
}
