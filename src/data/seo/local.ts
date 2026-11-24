// Pages ville : uniquement des données officielles collectées par scripts/local-data.py (Annuaire de l'administration, Géoportail de l'Urbanisme).
import raw from "./local.json";

export interface LocalCity {
  slug: string;
  name: string;
  insee: string;
  mairie: { name: string; id: string; address: string | null; phone: string | null; website: string | null; source: string } | null;
  plu: { rnu: boolean; psmv?: string[]; partition?: string; type?: string; title?: string; id?: string; publication?: string; url?: string };
}
export const LOCAL_FETCHED_AT: string = raw.fetchedAt;
export const CITIES = raw.cities as LocalCity[];
export const cityBySlug = (slug: string) => CITIES.find((c) => c.slug === slug);
export const docLabel = (t?: string) =>
  t?.startsWith("PLUi") ? "plan local d'urbanisme intercommunal (PLUi)" : t === "PLU" ? "plan local d'urbanisme (PLU)" : t === "CC" ? "carte communale" : t ?? "";
