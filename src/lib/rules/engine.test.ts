import { describe, expect, it } from "vitest";
import { determineRegime, evaluate, evaluateProject, interpolate, paperCopies, requiredPieces, ruleset, deadlineMonths, type Facts } from "./engine";

const base: Facts = {
  "pv.isGround": false,
  "pv.powerKwc": 6,
  "pv.groundHeightM": 0,
  "heritage.protected": false,
  "answers.buildingIsListedMH": false,
  "answers.visibleFromPublicSpace": true,
};

describe("DSL de conditions", () => {
  it("évalue all/any/not et les opérateurs", () => {
    const f = { a: 3, b: "N", c: true, d: { e: 1 } };
    expect(evaluate({ fact: "a", op: "gt", value: 2 }, f)).toBe(true);
    expect(evaluate({ fact: "b", op: "in", value: ["N", "A"] }, f)).toBe(true);
    expect(evaluate({ all: [{ fact: "c", op: "truthy" }, { not: { fact: "a", op: "lt", value: 1 } }] }, f)).toBe(true);
    expect(evaluate({ any: [{ fact: "a", op: "eq", value: 9 }, { fact: "d.e", op: "eq", value: 1 }] }, f)).toBe(true);
    expect(evaluate({ fact: "absent", op: "exists" }, f)).toBe(false);
    expect(evaluate({ fact: "b", op: "matches", value: "^n$" }, f)).toBe(true);
    expect(() => evaluate({ fact: "a", op: "zz" as never }, f)).toThrow();
  });
  it("interpole les messages", () => {
    expect(interpolate("{{x}} kWc / {{y}}", { x: 6.456, y: undefined })).toBe("6,46 kWc / ?");
  });
});

describe("Données réglementaires", () => {
  it("chaque règle a une source, une date de validité et un statut de vérification", () => {
    for (const r of [...ruleset.rules, ...ruleset.regimes]) {
      expect(r.source_url, r.code).toMatch(/^https:\/\//);
      expect(r.valid_from, r.code).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(["VERIFIE", "A_VERIFIER"]).toContain(r.verification);
    }
  });
  it("codes de règles uniques", () => {
    const codes = ruleset.rules.map((r) => r.code);
    expect(new Set(codes).size).toBe(codes.length);
  });
});

describe("Régime d'autorisation", () => {
  const d = "2026-11-11";
  it("toiture → DP", () => expect(determineRegime(base, d).outcome).toBe("DP"));
  it("bâtiment inscrit MH → PC (hors périmètre DP)", () => expect(determineRegime({ ...base, "answers.buildingIsListedMH": true }, d).outcome).toBe("PC"));
  it("sol < 3 kWc, ≤ 1,80 m, hors secteur protégé → aucune formalité", () =>
    expect(determineRegime({ ...base, "pv.isGround": true, "pv.powerKwc": 2.5, "pv.groundHeightM": 1.5 }, d).outcome).toBe("AUCUNE"));
  it("sol ≥ 3 kWc en secteur protégé → PC", () =>
    expect(determineRegime({ ...base, "pv.isGround": true, "pv.powerKwc": 9, "heritage.protected": true }, d).outcome).toBe("PC"));
  it("sol ≥ 3 MWc → PC", () => expect(determineRegime({ ...base, "pv.isGround": true, "pv.powerKwc": 3500, "pv.groundHeightM": 3 }, d).outcome).toBe("PC"));
  it("sol 6 kWc hors secteur → hors périmètre V1 (pas de faux dossier)", () => {
    const r = evaluateProject({ ...base, "pv.isGround": true, "pv.powerKwc": 6, "pv.groundHeightM": 2 }, d);
    expect(r.regime.outcome).toBe("HORS_PERIMETRE");
    expect(r.canGenerate).toBe(false);
  });
});

describe("Pièces, délais, exemplaires", () => {
  it("hors secteur protégé : DP1, DP2, DP4, DP5 + DP6-8 si visible ; pas de DP11", () => {
    const req = requiredPieces(base).filter((p) => p.isRequired).map((p) => p.code);
    expect(req).toEqual(["DP1", "DP2", "DP4", "DP5", "DP6", "DP7", "DP8"]);
  });
  it("non visible et non protégé : DP6-8 non exigées", () => {
    const req = requiredPieces({ ...base, "answers.visibleFromPublicSpace": false }).filter((p) => p.isRequired).map((p) => p.code);
    expect(req).not.toContain("DP7");
  });
  it("secteur protégé : DP6-8 et DP11, 2 mois, 3 exemplaires", () => {
    const f = { ...base, "heritage.protected": true, "answers.visibleFromPublicSpace": false };
    expect(requiredPieces(f).filter((p) => p.isRequired).map((p) => p.code)).toEqual(expect.arrayContaining(["DP6", "DP7", "DP8", "DP11"]));
    expect(deadlineMonths(f).months).toBe(2);
    expect(paperCopies(f).copies).toBe(3);
    expect(deadlineMonths(base).months).toBe(1);
    expect(paperCopies(base).copies).toBe(2);
  });
});

describe("Score explicable", () => {
  it("bloquant ⇒ score 0 et facteurs listés", () => {
    const r = evaluateProject({ ...base, "pieces.missingCount": 2, "pieces.missingList": "DP5, DP6", "mandate.signed": true, "client.complete": true, "address.ok": true, "parcels.count": 1, "photos.facade": true, "insertion.done": true, "building.found": true }, "2026-11-11");
    expect(r.blocking.map((b) => b.code)).toEqual(["PIECES_MANQUANTES"]);
    expect(r.score).toBe(0);
    expect(r.blocking[0].message).toContain("DP5, DP6");
  });
  it("dossier complet hors contrainte ⇒ 100", () => {
    const r = evaluateProject({ ...base, "pieces.missingCount": 0, "mandate.signed": true, "client.complete": true, "address.ok": true, "parcels.count": 1, "photos.facade": true, "insertion.done": true, "building.found": true, "layout.mismatch": false, "layout.capacityShortfall": 0, "pv.powerMismatchPct": 0, "photos.qualityIssues": 0, "plu.hasZone": true, "mairie.hasEmail": true }, "2026-11-11");
    expect(r.blocking).toHaveLength(0);
    expect(r.score).toBe(100);
  });
  it("règle communale filtrée par INSEE", () => {
    const f = { ...base, "plu.typezone": "N", "commune.insee": "80011" };
    expect(evaluateProject(f, "2026-11-11").results.find((x) => x.code === "PLU_ZONE_N_SOLAIRE_INTEGRATION")?.severity).toBe("alerte");
    const g = { ...f, "commune.insee": "75056" };
    expect(evaluateProject(g, "2026-11-11").results.find((x) => x.code === "PLU_ZONE_N_SOLAIRE_INTEGRATION")).toBeUndefined();
  });
  it("règle hors période de validité ignorée", () => {
    const r = evaluateProject({ ...base, "filing.byLegalEntity": true, "filing.paper": true }, "2024-06-01");
    expect(r.results.find((x) => x.code === "DEPOT_ELECTRONIQUE_PM")).toBeUndefined();
  });
});
