import { describe, expect, it } from "vitest";
import { defaultElec, elecCalc, isValidPdl } from "./calc";
import { evaluateRaccordement, racRuleset } from "./rules";
import { newProject } from "@/lib/project/factory";
import { defaultInverters, defaultPanels } from "@/data/catalog";
import type { Project } from "@/lib/types";

const micro = defaultInverters[0];
const central = defaultInverters[1];
const panel = defaultPanels[0]; // 430 Wc, Voc 39,2 V, Isc 13,9 A, -0,26 %/°C

function proj(count = 10, patch: Partial<NonNullable<Project["elec"]>> = {}): Project {
  const p = newProject("t", "u");
  p.pv = { ...p.pv, panelCount: count, powerKwc: (count * 430) / 1000, panelId: panel.id, inverterId: micro.id, usage: "autoconsommation_surplus" };
  p.elec = { ...defaultElec(p), pdl: "12345678901234", ...patch };
  return p;
}

describe("calculs électriques", () => {
  it("micro-onduleurs : puissance AC, courant, calibre, section, formulaire Consuel", () => {
    const r = elecCalc(proj(10), proj(10).elec!, panel, micro);
    expect(r.isMicro).toBe(true);
    expect(r.acPowerVa).toBe(4000);
    expect(r.iAcA).toBeCloseTo(17.39, 2);
    expect(r.breakerA).toBe(20);
    expect(r.consuelForm).toBe("SC 144C2-2");
    expect(r.attestation).toBe("bleue");
    expect(r.iscMaxA).toBeCloseTo(17.38, 2); // 1,25 × 13,9
    expect(r.uocMaxV).toBeCloseTo(42.8, 1); // 39,2 × (1 + 0,0026 × 35)
    expect(r.dropPct).toBeLessThanOrEqual(1);
  });
  it("onduleur central : chaîne de 14 modules, SC 144A-5 ; batterie → SC 144C-5 violette", () => {
    const p = proj(14, { modulesPerString: 14, strings: 1 });
    const r = elecCalc(p, p.elec!, panel, central);
    expect(r.consuelForm).toBe("SC 144A-5");
    expect(r.uocMaxV).toBeCloseTo(39.2 * 14 * 1.091, 0);
    const b = elecCalc(p, { ...p.elec!, battery: true }, panel, central);
    expect(b.consuelForm).toBe("SC 144C-5");
    expect(b.attestation).toBe("violette");
  });
  it("cas 4 et > 36 kVA : formulaires complémentaires", () => {
    const p = proj(10, { connectionCase: 4 });
    expect(elecCalc(p, p.elec!, panel, micro).extraForms).toEqual(["SC 144E"]);
  });
  it("chute de tension : la section augmente avec la longueur", () => {
    const p = proj(10, { acCableLengthM: 60 });
    const r = elecCalc(p, p.elec!, panel, micro);
    expect(r.sectionMm2).toBeGreaterThan(r.sectionByCurrentMm2);
    expect(r.dropPct).toBeLessThanOrEqual(1);
  });
  it("PDL : 14 chiffres", () => {
    expect(isValidPdl("1234 5678 9012 34")).toBe(true);
    expect(isValidPdl("123")).toBe(false);
  });
});

describe("règles raccordement / Consuel", () => {
  const codes = (p: Project, date = "2026-11-12", inv = micro) => evaluateRaccordement(p, panel, inv, date).evaluation.results.filter((r) => r.severity !== "ok").map((r) => r.code);
  it("sources et validité sur toutes les règles", () => {
    for (const r of racRuleset.rules) expect(r.source_url).toMatch(/^https:\/\//);
  });
  it("surplus EDF OA : tarif unique après le 05/06/2026, absent avant", () => {
    expect(codes(proj())).toContain("OA_TARIF_UNIQUE");
    expect(codes(proj(), "2026-05-01")).not.toContain("OA_TARIF_UNIQUE");
  });
  it("vente totale ≤ 9 kWc bloquante", () => {
    expect(codes(proj(10, { injection: "totale" }))).toContain("OA_VENTE_TOTALE_9KWC");
  });
  it("autoconsommation totale : déclaration CACSI et puissance ≤ souscrite", () => {
    const c = codes(proj(10, { injection: "sans", subscribedKva: 3 }));
    expect(c).toEqual(expect.arrayContaining(["RAC_SANS_INJECTION_DECLARATION", "RAC_SANS_INJECTION_PUISSANCE"]));
  });
  it("PDL manquant et cession Enedis > 3 kW", () => {
    const c = codes(proj(10, { pdl: "", buyer: "enedis" }));
    expect(c).toEqual(expect.arrayContaining(["RAC_PDL", "RAC_CESSION_ENEDIS_3KW"]));
  });
  it("protection > AGCP en cas 1 bloquante", () => {
    expect(codes(proj(10, { agcpA: 15 }))).toContain("ELEC_PROTECTION_AGCP");
  });
});

describe("fortes puissances (hangars, bâtiments agricoles)", () => {
  const tri = defaultInverters.find((x) => x.id === "gen-tri-50k")!;
  function big(count: number, inverters: number, patch: Partial<NonNullable<Project["elec"]>> = {}) {
    const p = proj(count, { phase: "tri", inverterCount: inverters, ...patch });
    p.pv = { ...p.pv, inverterId: tri.id };
    return p;
  }
  it("100 kVA : basse tension > 36 kVA, SC 143, appel d'offres au-delà de 100 kWc", () => {
    const p = big(280, 2, { workplace: true });
    const { calc, evaluation } = evaluateRaccordement(p, panel, tri);
    expect(calc.acPowerKva).toBe(100);
    expect(calc.domain).toBe("BT250");
    expect(calc.extraForms).toContain("SC 143");
    expect(calc.consuelRequired).toBe(true);
    const codes = evaluation.results.filter((x) => x.severity !== "ok").map((x) => x.code);
    expect(codes).toContain("RAC_PROCEDURE_36KVA");
    expect(codes).toContain("CONSUEL_RAPPORT_CONTROLE");
    expect(codes).toContain("OA_100_500_AO"); // 120,4 kWc
    expect(codes).not.toContain("OA_TARIF_UNIQUE");
    expect(evaluation.blocking.map((x) => x.code)).not.toContain("RAC_PROCEDURE_36KVA");
  });
  it("300 kVA : HTA, pas d'attestation Consuel mais contrôle de conformité", () => {
    const p = big(800, 6);
    const { calc, evaluation } = evaluateRaccordement(p, panel, tri);
    expect(calc.domain).toBe("HTA");
    expect(calc.consuelRequired).toBe(false);
    const codes = evaluation.results.filter((x) => x.severity !== "ok").map((x) => x.code);
    expect(codes).toEqual(expect.arrayContaining(["RAC_HTA", "CONSUEL_HTA"]));
    expect(codes).not.toContain("CONSUEL_OBLIGATOIRE");
  });
  it("PDL non bloquant au-delà de 36 kVA (nouveau point de livraison possible)", () => {
    const p = big(280, 2, { pdl: undefined });
    expect(evaluateRaccordement(p, panel, tri).evaluation.blocking.map((x) => x.code)).not.toContain("RAC_PDL");
  });
});
