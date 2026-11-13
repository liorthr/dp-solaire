import { beforeAll, describe, expect, it } from "vitest";
import { mkdirSync, writeFileSync } from "node:fs";
import { demoCases } from "@/data/demo";
import { defaultIte, defaultPac } from "@/data/works";
import { setProviderMode } from "@/lib/providers/core";
import { runEnrichment } from "@/lib/enrichment/run";
import { applyEnrichment, newProject } from "@/lib/project/factory";
import { buildFacts } from "@/lib/rules/facts";
import { evaluateProject, requiredPieces, rulesetFor } from "@/lib/rules/engine";
import { projectDescription, noticeDescriptive, worksObject } from "@/lib/dossier/texts";
import type { EnrichmentResult, Project } from "@/lib/types";
import { bestPacFacade, distanceToLimit, iteMinDistance, pacPoint, projectFacades } from "./geom";
import { dp2Works, dp3Ite, dp4Works } from "./plans";
import { worksSummary } from "./summary";

const enr: Record<string, EnrichmentResult> = {};
const sites: Record<string, { lon: number; lat: number }> = {};
beforeAll(async () => {
  setProviderMode("fixtures");
  for (const k of ["pac", "ite"] as const) {
    const d = demoCases.find((x) => x.key === k)!;
    enr[k] = await runEnrichment(d.address, d.site);
    sites[k] = d.site;
  }
}, 60_000);

const mk = (k: "pac" | "ite", patch: Partial<Project> = {}): Project => {
  const d = demoCases.find((x) => x.key === k)!;
  const p = applyEnrichment({ ...newProject("t", "u", d.address), works: k }, enr[k]);
  return { ...p, pac: k === "pac" ? d.pac : undefined, ite: k === "ite" ? d.ite : undefined, ...patch };
};
const date = "2026-11-13";

describe("façades et géométrie", () => {
  it("détecte 4 façades orientées avec une normale sortante", () => {
    const fs = projectFacades(enr.pac);
    expect(fs).toHaveLength(4);
    for (const f of fs) {
      expect(f.lengthM).toBeGreaterThan(2);
      expect(f.label).toMatch(/^Façade /);
    }
  });
  it("place l'unité PAC hors du bâtiment et mesure la distance à la limite", () => {
    const pac = { ...defaultPac(), facadeIndex: bestPacFacade(enr.pac, defaultPac()) };
    const pt = pacPoint(enr.pac, pac)!;
    const d = distanceToLimit(enr.pac, pt)!;
    expect(d).toBeGreaterThan(0);
    // la façade choisie est la meilleure des 4
    for (const f of projectFacades(enr.pac)) expect(distanceToLimit(enr.pac, pacPoint(enr.pac, { ...pac, facadeIndex: f.index, positionRatio: 0.5 })!)!).toBeLessThanOrEqual(d + 3);
  });
  it("retranche l'épaisseur d'isolant de la distance aux limites", () => {
    const idx = projectFacades(enr.pac).map((f) => f.index).sort((x, y) => iteMinDistance(enr.pac, [y], 0)! - iteMinDistance(enr.pac, [x], 0)!)[0];
    const a = iteMinDistance(enr.pac, [idx], 0)!;
    expect(a).toBeGreaterThan(0.3);
    const b = iteMinDistance(enr.pac, [idx], 20)!;
    expect(a - b).toBeCloseTo(0.2, 1);
  });
});

describe("règles PAC", () => {
  it("unité en façade : DP ; au sol sans dalle hors secteur protégé : aucune formalité", () => {
    const rs = rulesetFor("pac");
    const f1 = buildFacts({ project: mk("pac", { pac: { ...defaultPac(), placement: "facade" } }) });
    expect(evaluateProject(f1, date, rs).regime.outcome).toBe("DP");
    const f2 = buildFacts({ project: mk("pac", { pac: { ...defaultPac(), placement: "sol_sans_dalle" } }) });
    expect(evaluateProject(f2, date, rs).regime.outcome).toBe("AUCUNE");
  });
  it("chaque règle déclenchée cite une source", () => {
    const ev = evaluateProject(buildFacts({ project: mk("pac") }), date, rulesetFor("pac"));
    for (const r of ev.results) expect(r.source_url).toMatch(/^https:\/\//);
    expect(ev.results.some((r) => r.code === "PAC_BRUIT_INFO")).toBe(true);
  });
  it("ne demande pas de coupe DP3 et ne parle pas de panneaux", () => {
    const p = mk("pac");
    const pieces = requiredPieces(buildFacts({ project: p }), rulesetFor("pac")).map((x) => x.code);
    expect(pieces).not.toContain("DP3");
    expect(projectDescription(p)).toMatch(/pompe à chaleur/);
    expect(projectDescription(p)).not.toMatch(/panneau/i);
    expect(worksObject(p)).toMatch(/pompe à chaleur/);
    expect(worksSummary(p)).toMatch(/Pompe à chaleur/);
  });
});

describe("règles ITE", () => {
  it("DP, ABF détecté rue Cormont, surplomb du domaine public signalé", () => {
    const ev = evaluateProject(buildFacts({ project: mk("ite") }), date, rulesetFor("ite"));
    expect(ev.regime.outcome).toBe("DP");
    const codes = ev.results.filter((r) => r.severity !== "ok").map((r) => r.code);
    expect(codes).toContain("ITE_SECTEUR_PROTEGE");
    expect(codes).toContain("ITE_SURPLOMB_PUBLIC");
  });
  it("bâtiment inscrit MH : permis de construire", () => {
    const p = mk("ite", { answers: { visibleFromPublicSpace: true, inLotissement: "nsp", buildingIsListedMH: true } });
    expect(evaluateProject(buildFacts({ project: p }), date, rulesetFor("ite")).regime.outcome).toBe("PC");
  });
  it("la dérogation ajoute la pièce DP8-1", () => {
    const p = mk("ite", { ite: { ...defaultIte(), derogation: true } });
    const req = requiredPieces(buildFacts({ project: p }), rulesetFor("ite")).filter((x) => x.isRequired).map((x) => x.code);
    expect(req).toContain("DP8-1");
    expect(noticeDescriptive(p, undefined, undefined).join(" ")).toMatch(/isolant/);
  });
});

describe("plans PAC / ITE", () => {
  const ctx = (p: Project, k: string) => ({ project: p, site: sites[k], cartouche: { reference: "T", address: "x", parcels: "AB 1", date: "13/11/2026", company: "Démo", client: "Client fictif" } });
  it("produit DP2, DP3 et DP4 sans valeur manquante", () => {
    mkdirSync(".plans-out", { recursive: true });
    const pac = mk("pac");
    const ite = mk("ite");
    const pages = { "pac-dp2": dp2Works(ctx(pac, "pac")), "pac-dp4": dp4Works(ctx(pac, "pac"))[0], "ite-dp2": dp2Works(ctx(ite, "ite")), "ite-dp3": dp3Ite(ctx(ite, "ite")), "ite-dp4": dp4Works(ctx(ite, "ite"))[0] };
    for (const [k, svg] of Object.entries(pages)) {
      expect(svg.startsWith("<svg")).toBe(true);
      expect(svg).not.toMatch(/NaN|undefined/);
      writeFileSync(`.plans-out/works-${k}.svg`, svg);
    }
    expect(pages["pac-dp2"]).toMatch(/Unité PAC/);
    expect(pages["pac-dp2"]).toMatch(/de la limite la plus proche/);
    expect(pages["ite-dp2"]).toMatch(/\+14 cm/);
    expect(pages["ite-dp3"]).toMatch(/14 cm/);
    expect(dp4Works(ctx(ite, "ite")).length).toBe(2); // 4 façades, 2 par page
  });
});

describe("ITE en limite de propriété", () => {
  it("rue Cormont : façade à l'alignement, l'alerte « distance aux limites » se déclenche", () => {
    expect(iteMinDistance(enr.ite, [0, 1, 2, 3], 14)).toBe(0);
    const ev = evaluateProject(buildFacts({ project: mk("ite") }), date, rulesetFor("ite"));
    expect(ev.results.find((r) => r.code === "ITE_LIMITE_PROCHE")?.severity).toBe("alerte");
  });
});
