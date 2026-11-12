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
