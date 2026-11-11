// Tests de bout en bout du moteur sur les 3 dossiers de démo, avec les réponses réelles des API enregistrées (fixtures).
import { beforeAll, describe, expect, it } from "vitest";
import { demoCases } from "@/data/demo";
import { defaultPanels } from "@/data/catalog";
import { setProviderMode } from "@/lib/providers/core";
import { runEnrichment } from "@/lib/enrichment/run";
import { applyEnrichment, newProject, relayout } from "@/lib/project/factory";
import { buildFacts } from "./facts";
import { evaluateProject } from "./engine";
import type { EnrichmentResult } from "@/lib/types";

const results: Record<string, EnrichmentResult> = {};

beforeAll(async () => {
  setProviderMode("fixtures");
  for (const d of demoCases) results[d.key] = await runEnrichment(d.address, d.site);
}, 60_000);

function evalCase(key: string) {
  const d = demoCases.find((x) => x.key === key)!;
  const panel = defaultPanels.find((p) => p.id === d.panelId)!;
  let p = newProject("t1", "u1", d.address);
  p.pv = { ...p.pv, panelId: panel.id, panelCount: d.panelCount, powerKwc: (d.panelCount * panel.powerWc) / 1000 };
  p = applyEnrichment(p, results[key]);
  p = relayout(p, panel);
  const facts = buildFacts({ project: p, panel, client: { id: "c", tenantId: "t1", firstName: "A", lastName: "B", email: "a@example.org", createdAt: "" } });
  return { p, facts, ev: evaluateProject(facts, "2026-11-11") };
}

describe("Dossier 1 : sans contrainte (Pont-de-Metz)", () => {
  it("enrichissement complet depuis les fixtures", () => {
    const e = results["sans-contrainte"];
    expect(e.parcels[0].idu).toBe("80632000AI0182");
    expect(e.zones[0].libelle).toBe("UC");
    expect(e.mainBuildingId).toBeTruthy();
    expect(e.mairie?.email).toBe("mairie@pontdemetz.fr");
    expect(e.heritage?.abfConsultation).toBe("non");
    expect(Object.values(e.sources).every((s) => s.status === "ok")).toBe(true);
  });
  it("régime DP, pas d'alerte patrimoine, délai 1 mois", () => {
    const { ev, p } = evalCase("sans-contrainte");
    expect(ev.regime.outcome).toBe("DP");
    expect(ev.results.find((r) => r.code === "ABF_SECTEUR")?.severity).toBe("ok");
    expect(p.pv.layouts[0].panels).toHaveLength(14);
    expect(ev.results.find((r) => r.code === "COHERENCE_CALEPINAGE")?.severity).toBe("ok");
  });
});

describe("Dossier 2 : périmètre ABF (Amiens)", () => {
  it("détecte les abords MH avec confiance haute", () => {
    const h = results["abf"].heritage!;
    expect(h.inAbordsMH).toBe(true);
    expect(h.abfConsultation).toBe("oui");
    expect(h.confidence).toBe("haute");
    expect(h.explanation.join(" ")).toMatch(/AC1/);
    expect(h.monuments.length).toBeGreaterThan(0);
  });
  it("alerte ABF et panneaux non full black", () => {
    const { ev } = evalCase("abf");
    expect(ev.results.find((r) => r.code === "ABF_SECTEUR")?.severity).toBe("alerte");
    expect(ev.results.find((r) => r.code === "ABF_PANNEAUX_NON_NOIRS")?.severity).toBe("alerte");
    expect(ev.score).toBeLessThan(100);
  });
});

describe("Dossier 3 : PLU restrictif (Ailly-sur-Somme)", () => {
  it("zone N(i) + PPRI + règle communale citée", () => {
    const { ev, facts } = evalCase("plu-restrictif");
    expect(facts["plu.typezone"]).toBe("N");
    const r = ev.results.find((x) => x.code === "PLU_ZONE_N_SOLAIRE_INTEGRATION")!;
    expect(r.severity).toBe("alerte");
    expect(r.message).toMatch(/intégrés de façon harmonieuse/);
    expect(r.verification).toBe("A_VERIFIER");
    expect(ev.results.find((x) => x.code === "RISQUE_PPR")?.severity).toBe("info");
    expect(results["plu-restrictif"].zones[0].reglementUrl).toMatch(/200071223_reglement/);
  });
});
