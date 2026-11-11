// Géoportail de l'Urbanisme via API Carto IGN (module gpu) : zonage, document, SUP, prescriptions.
import type { Servitude, UrbanZone } from "@/lib/types";
import type { Feature, Geometry, Polygon } from "geojson";
import { fetchJson, fixMojibake } from "./core";
import { pointGeom } from "./cadastre";

export const GPU_ID = "gpu";
const BASE = "https://apicarto.ign.fr/api/gpu";

type FC = { features: Feature<Geometry, Record<string, unknown>>[] };

const s = (v: unknown) => (v == null ? "" : String(v));

export function reglementUrl(partition: string, docId: string, nomfic: string) {
  if (!partition || !docId || !nomfic) return undefined;
  return `https://data.geopf.fr/annexes/gpu/documents/${partition}/${docId}/${nomfic}`;
}

export function parseZones(zones: FC, docs: FC): UrbanZone[] {
  const doc = docs.features[0]?.properties ?? {};
  return zones.features.map((f) => {
    const p = f.properties;
    return {
      libelle: s(p.libelle),
      libelong: fixMojibake(s(p.libelong)) || undefined,
      typezone: s(p.typezone),
      docName: s(doc.grid_title || p.idurba),
      docType: s(doc.du_type || "PLU"),
      reglementUrl: reglementUrl(s(p.partition), s(p.gpu_doc_id), s(p.nomfic)),
      dateValid: s(p.datvalid) || undefined,
    };
  });
}

export function parseServitudes(...collections: FC[]): Servitude[] {
  const out: Servitude[] = [];
  const seen = new Set<string>();
  for (const fc of collections) {
    for (const f of fc.features || []) {
      const p = f.properties;
      const key = s(p.idass) || s(p.nomass);
      if (seen.has(key)) continue;
      seen.add(key);
      const partition = s(p.partition);
      const fichier = s(p.fichier);
      out.push({
        suptype: s(p.suptype).toLowerCase(),
        name: fixMojibake(s(p.nomsuplitt)) || s(p.nomass).replace(/_/g, " "),
        typeass: fixMojibake(s(p.typeass)) || undefined,
        modegeoass: fixMojibake(s(p.modegeoass)) || undefined,
        bufferM: typeof p.paramcalc === "number" ? p.paramcalc : null,
        actUrl: partition && fichier && p.gpu_doc_id ? `https://data.geopf.fr/annexes/gpu/documents/${partition}/${s(p.gpu_doc_id)}/${fichier}` : undefined,
      });
    }
  }
  return out;
}

async function q(path: string, geom: string) {
  return fetchJson<FC>(GPU_ID, `${BASE}/${path}?geom=${geom}`, { timeoutMs: 20_000 });
}

export async function urbanismAt(lon: number, lat: number) {
  const g = pointGeom(lon, lat);
  const [zones, docs, muni, supS, supL, supP, psc] = await Promise.all([
    q("zone-urba", g),
    q("document", g),
    q("municipality", g),
    q("assiette-sup-s", g),
    q("assiette-sup-l", g).catch(() => ({ data: { features: [] } as FC })),
    q("assiette-sup-p", g).catch(() => ({ data: { features: [] } as FC })),
    q("prescription-surf", g).catch(() => ({ data: { features: [] } as FC })),
  ]);
  return {
    zones: parseZones(zones.data, docs.data),
    rnu: Boolean(muni.data.features[0]?.properties?.is_rnu),
    servitudes: parseServitudes(supS.data, supL.data, supP.data),
    prescriptions: psc.data.features.map((f) => s(f.properties.libelle)).filter(Boolean),
    meta: zones.meta,
    rawSupS: supS.data,
  };
}

/** générateurs de SUP (monuments) dans un polygone de recherche (tampon autour du bâtiment) */
export async function generatorsWithin(searchPolygon: Polygon) {
  const g = encodeURIComponent(JSON.stringify(searchPolygon));
  const [sGen, pGen] = await Promise.all([
    q("generateur-sup-s", g),
    q("generateur-sup-p", g).catch(() => ({ data: { features: [] } as FC })),
  ]);
  return [...sGen.data.features, ...pGen.data.features].filter((f) => /^ac(1|2|4)$/i.test(s(f.properties.suptype)));
}
