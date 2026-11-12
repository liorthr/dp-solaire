// Contrôles raccordement / Consuel : faits + évaluation par le moteur générique (données versionnées).
import type { InverterModel, PanelModel, Project } from "@/lib/types";
import rac from "@/data/regulation/raccordement.v1.json";
import { evaluateProject, type Ruleset } from "@/lib/rules/engine";
import { defaultElec, elecCalc, isValidPdl, withInverterDefaults, withPanelDefaults } from "./calc";

export const racRuleset = rac as unknown as Ruleset;

export function elecFacts(p: Project, panel?: PanelModel, inverter?: InverterModel) {
  const e = p.elec ?? defaultElec(p);
  const pn = withPanelDefaults(panel);
  const inv = withInverterDefaults(inverter);
  const r = elecCalc(p, e, pn, inv);
  const urbanismeAccorde = p.events.some((x) => ["decision_accord", "certificat_tacite"].includes(x.type));
  return {
    calc: r,
    elec: e,
    facts: {
      "elec.pdlValid": isValidPdl(e.pdl),
      "elec.acPowerKva": r.acPowerKva,
      "elec.injection": e.injection,
      "elec.buyer": e.buyer,
      "elec.subscribedKva": e.subscribedKva ?? 0,
      "elec.prodOverSubscribed": e.subscribedKva !== undefined && r.acPowerKva > e.subscribedKva,
      "elec.attestation": r.attestation,
      "elec.attestationCerfa": r.attestationCerfa,
      "elec.consuelForm": r.consuelForm,
      "elec.extraFormsText": r.extraForms.length ? ` + ${r.extraForms.join(" + ")}` : "",
      "elec.connectionCase": e.connectionCase,
      "elec.integratedDecoupling": inv?.integratedDecoupling !== false,
      "elec.moduleSpecsKnown": Boolean(pn?.vocV && pn?.iscA),
      "elec.breakerA": r.breakerA,
      "elec.agcpA": e.agcpA ?? 0,
      "elec.breakerOverAgcp": [1, 2].includes(e.connectionCase) && e.agcpA !== undefined && r.breakerA > e.agcpA,
      "elec.dropPct": r.dropPct,
      "elec.sectionMm2": r.sectionMm2,
      "elec.urbanismeAccorde": urbanismeAccorde,
      "elec.mandateSigned": Boolean(e.mandate),
      "pv.powerKwc": p.pv.powerKwc,
    } as Record<string, unknown>,
  };
}

export function evaluateRaccordement(p: Project, panel?: PanelModel, inverter?: InverterModel, date?: string) {
  const f = elecFacts(p, panel, inverter);
  return { ...f, evaluation: evaluateProject(f.facts, date, racRuleset) };
}
