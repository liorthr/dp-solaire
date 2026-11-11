// Analyse patrimoniale : obligation de consultation de l'ABF, avec niveau de confiance et explication.
// Règles : docs/regulation/04-patrimoine-abf.md
import type { HeritageAnalysis, Servitude } from "@/lib/types";
import type { Feature, Geometry } from "geojson";
import { area, booleanPointInPolygon, circle, point, pointToPolygonDistance } from "@turf/turf";
import { fixMojibake } from "@/lib/providers/core";

export const ABORDS_RADIUS_M = 500;

export function searchCircle(lon: number, lat: number, radiusM = 600) {
  return circle([lon, lat], radiusM / 1000, { steps: 20, units: "kilometers" }).geometry;
}

export function distanceToGenerator(lon: number, lat: number, f: Feature<Geometry, Record<string, unknown>>): number {
  const pt = point([lon, lat]);
  const g = f.geometry;
  if (g.type === "Polygon" || g.type === "MultiPolygon") {
    if (booleanPointInPolygon(pt, g)) return 0;
    return Math.max(0, Math.round(pointToPolygonDistance(pt, g, { units: "meters" })));
  }
  if (g.type === "Point") {
    const [x, y] = g.coordinates;
    const dx = (x - lon) * 111_320 * Math.cos((lat * Math.PI) / 180);
    const dy = (y - lat) * 111_320;
    return Math.round(Math.hypot(dx, dy));
  }
  return Number.POSITIVE_INFINITY;
}

const genName = (f: Feature<Geometry, Record<string, unknown>>) =>
  fixMojibake(String(f.properties.nomsuplitt || f.properties.nomgen || f.properties.idgen || "Monument historique"))
    .replace(/^AC\d_/, "")
    .replace(/_gen$/, "")
    .replace(/-/g, " ");

export function analyzeHeritage(
  lon: number,
  lat: number,
  servitudes: Servitude[] | null,
  generators: Feature<Geometry, Record<string, unknown>>[] | null,
): HeritageAnalysis {
  const explanation: string[] = [];
  const divergences: string[] = [];
  const sups = servitudes ?? [];
  const ac1 = sups.filter((s) => s.suptype === "ac1");
  const ac2 = sups.filter((s) => s.suptype === "ac2");
  const ac4 = sups.filter((s) => s.suptype === "ac4");

  const monuments = (generators ?? [])
    .filter((g) => String(g.properties.suptype).toLowerCase() === "ac1")
    // les PDA sont publiés comme générateurs « égaux au périmètre » : ce ne sont pas des monuments
    .filter((g) => !/perim[eè]tre.?d[ée]limit/i.test(fixMojibake(String(g.properties.nomgen ?? g.properties.nomsuplitt ?? ""))))
    .filter((g) => g.geometry.type === "Point" || area(g as Feature<Geometry>) < 30_000)
    .map((g) => ({ name: genName(g), distanceM: distanceToGenerator(lon, lat, g) }))
    .filter((m) => Number.isFinite(m.distanceM))
    .sort((a, b) => a.distanceM - b.distanceM)
    .filter((m, i, arr) => arr.findIndex((x) => x.name === m.name) === i)
    .slice(0, 5);
  const nearest = monuments[0]?.distanceM;

  const inAbordsMH = ac1.length > 0;
  const inSPR = ac4.length > 0;
  const inSite = ac2.length > 0;

  if (inAbordsMH) {
    explanation.push(
      `Le terrain est dans ${ac1.length > 1 ? "plusieurs périmètres" : "un périmètre"} d'abords de monument historique (servitude AC1 publiée sur le Géoportail de l'Urbanisme) : ${ac1
        .slice(0, 3)
        .map((s) => s.name)
        .join(" ; ")}.`,
    );
    const pda = ac1.some((s) => /générateur/i.test(s.modegeoass ?? ""));
    if (pda) explanation.push("Au moins un périmètre est un périmètre délimité des abords (PDA) : la covisibilité n'a pas à être démontrée.");
    else explanation.push("Périmètre de 500 m autour du monument : l'ABF apprécie la covisibilité.");
  }
  if (inSPR) explanation.push(`Le terrain est dans un site patrimonial remarquable (servitude AC4) : ${ac4[0].name}.`);
  if (inSite) explanation.push(`Le terrain est dans un site inscrit ou classé (servitude AC2) : ${ac2[0].name}.`);
  if (nearest !== undefined) explanation.push(`Monument le plus proche (géométrie du générateur de servitude) : ${monuments[0].name}, à environ ${nearest} m.`);
  if (servitudes === null) explanation.push("Les servitudes n'ont pas pu être récupérées : vérifiez manuellement sur le Géoportail de l'Urbanisme.");

  if (!inAbordsMH && nearest !== undefined && nearest < ABORDS_RADIUS_M) {
    divergences.push(
      `Aucune servitude AC1 publiée sur le terrain, mais un monument est à ${nearest} m (< 500 m). La servitude n'est peut-être pas numérisée : vérifiez auprès de l'UDAP ou de la mairie.`,
    );
  }

  let abfConsultation: HeritageAnalysis["abfConsultation"] = "non";
  if (inAbordsMH || inSPR || inSite) abfConsultation = "oui";
  else if (divergences.length) abfConsultation = "probable";

  let confidence: HeritageAnalysis["confidence"] = "haute";
  if (servitudes === null) confidence = "faible";
  else if (divergences.length || generators === null) confidence = "moyenne";

  if (abfConsultation === "non" && servitudes !== null)
    explanation.push("Aucune servitude patrimoniale (AC1, AC2, AC4) publiée sur le terrain : pas de consultation de l'ABF attendue.");

  return {
    inAbordsMH,
    inSPR,
    inSiteClasseOuInscrit: inSite,
    monuments,
    nearestMonumentM: nearest,
    abfConsultation,
    confidence,
    explanation,
    divergences,
  };
}
