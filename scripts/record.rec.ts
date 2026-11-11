// Enregistre les réponses réelles des API pour les 3 dossiers de démo (fixtures de tests déterministes)
// + l'instantané Annuaire. Lancement : npm run fixtures:record
import { readFileSync, writeFileSync } from "node:fs";
import { test } from "vitest";
import { demoCases } from "@/data/demo";
import { getRecorded, setProviderMode } from "@/lib/providers/core";
import { runEnrichment } from "@/lib/enrichment/run";
import { addressFromCoords, searchAddress } from "@/lib/providers/ban";
import { annuaireUrl } from "@/lib/providers/annuaire";
import { solarYield } from "@/lib/providers/pvgis";

test("record fixtures", async () => {
  setProviderMode("record");
  const snapshot: Record<string, unknown> = {};
  for (const d of demoCases) {
    // BAN : peut être indisponible ; les réponses déjà enregistrées sont conservées (fusion ci-dessous)
    await searchAddress(d.address.label).catch(() => console.warn("BAN indisponible : fixture conservée"));
    for (const n of [8, 14]) await searchAddress(d.address.label.slice(0, n)).catch(() => {});
    // parcours GPS : commune via geo.api.gouv.fr + rattachement au bâtiment le plus proche
    await addressFromCoords(d.site.lon, d.site.lat).catch(() => {});
    await runEnrichment(d.address, d.site, undefined, { snap: true });
    const r = await runEnrichment(d.address, d.site);
    // parcours « nouvelle adresse » de l'E2E : point BAN de la voie + rattachement au bâtiment le plus proche
    await runEnrichment(d.address, { lon: d.address.lon, lat: d.address.lat }, undefined, { snap: true });
    console.log(d.key, Object.entries(r.sources).map(([k, v]) => `${k}:${v.status}`).join(" "), "heritage", r.heritage?.abfConsultation);
    await solarYield(d.site.lat, d.site.lon, 35, 180, 6).catch(() => {});
    const rec = getRecorded()[annuaireUrl(d.address.insee)] as { results: unknown[] } | undefined;
    if (rec?.results?.[0]) snapshot[d.address.insee] = rec.results[0];
  }
  // Instantané Annuaire élargi : Hôtel de ville d'Amiens utilisé par la page santé
  const previous = JSON.parse(readFileSync("src/lib/providers/__fixtures__/responses.json", "utf8"));
  writeFileSync("src/lib/providers/__fixtures__/responses.json", JSON.stringify({ ...previous, ...getRecorded() }));
  const prevSnap = JSON.parse(readFileSync("src/data/annuaire-snapshot.json", "utf8"));
  writeFileSync("src/data/annuaire-snapshot.json", JSON.stringify({ ...prevSnap, ...snapshot }, null, 1));
}, 300_000);
