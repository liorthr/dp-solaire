// Calculs électriques d'aide au dossier Consuel / raccordement.
// Hypothèses de calcul documentées (docs/regulation/06-raccordement-consuel.md) ; coefficients marqués À_VÉRIFIER.
import type { ElecInfo, InverterModel, PanelModel, Project } from "@/lib/types";
import { defaultInverters, defaultPanels } from "@/data/catalog";

export const CALC = {
  /** Iscmax générateur = 1,25 × Isc STC (guides UTE C 15-712, À_VÉRIFIER) */
  iscFactor: 1.25,
  /** température minimale de calcul de Uocmax (°C, À_VÉRIFIER selon site) */
  tMinC: -10,
  /** coefficient forfaitaire si le coefficient de température est inconnu (À_VÉRIFIER) */
  uocFallbackFactor: 1.2,
  /** résistivité du cuivre en service (Ω·mm²/m) */
  rhoCu: 0.0225,
  /** chute de tension AC recommandée (%) entre onduleur(s) et point de raccordement (À_VÉRIFIER) */
  maxDropPct: 1,
  breakers: [2, 3, 6, 10, 13, 16, 20, 25, 32, 40, 50, 63],
  /** courant admissible indicatif (A) par section cuivre (mm²), pose courante (approximation NF C 15-100, À_VÉRIFIER) */
  ampacity: [
    [1.5, 16],
    [2.5, 20],
    [4, 25],
    [6, 32],
    [10, 50],
    [16, 63],
    [25, 80],
  ] as [number, number][],
};

/** complète un modèle enregistré avant l'ajout des caractéristiques électriques */
const defined = <T extends object>(o: T) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as Partial<T>;
export const withPanelDefaults = (p?: PanelModel) => (p ? ({ ...defaultPanels.find((d) => d.id === p.id), ...defined(p) } as PanelModel) : undefined);
export const withInverterDefaults = (i?: InverterModel) => (i ? ({ ...defaultInverters.find((d) => d.id === i.id), ...defined(i) } as InverterModel) : undefined);

export function defaultElec(p: Project): ElecInfo {
  return {
    phase: "mono",
    injection: p.pv.usage === "revente_totale" ? "totale" : p.pv.usage === "autoconsommation" ? "sans" : "surplus",
    buyer: "edf_oa",
    battery: false,
    connectionCase: 1,
    board: "principal",
    acCableLengthM: 15,
    dcCableSectionMm2: 4,
    subscribedKva: 9,
    agcpA: 45,
  };
}

export type ConsuelForm = "SC 144C2-2" | "SC 144A-5" | "SC 144C-5";

export interface ElecResult {
  isMicro: boolean;
  microCount: number;
  acPowerVa: number;
  acPowerKva: number;
  iAcA: number;
  breakerA: number;
  sectionMm2: number;
  sectionByCurrentMm2: number;
  dropPct: number;
  iscMaxA?: number;
  uocMaxV?: number;
  modulesInSeries: number;
  consuelForm: ConsuelForm;
  consuelFormPdf: string;
  extraForms: string[];
  attestation: "bleue" | "violette";
  attestationCerfa: string;
  notes: string[];
}

export function elecCalc(p: Project, e: ElecInfo, panelIn?: PanelModel, invIn?: InverterModel): ElecResult {
  const panel = withPanelDefaults(panelIn);
  const inv = withInverterDefaults(invIn);
  const notes: string[] = [];
  const isMicro = inv?.kind === "micro";
  const microCount = isMicro ? e.microCount ?? p.pv.panelCount : 0;
  const acPowerVa = isMicro ? microCount * (inv?.powerVa ?? 0) : inv?.powerVa ?? Math.round(p.pv.powerKwc * 1000);
  const acPowerKva = Math.round(acPowerVa / 10) / 100;
  const U = e.phase === "tri" ? 400 : 230;
  const iAcA = Math.round((e.phase === "tri" ? acPowerVa / (Math.sqrt(3) * U) : acPowerVa / U) * 100) / 100;
  const breakerA = CALC.breakers.find((b) => b >= iAcA) ?? 63;

  // section : courant admissible ≥ calibre, puis chute de tension
  const byCurrent = (CALC.ampacity.find(([, a]) => a >= breakerA) ?? CALC.ampacity[CALC.ampacity.length - 1])[0];
  const drop = (s: number) => ((e.phase === "tri" ? Math.sqrt(3) : 2) * CALC.rhoCu * e.acCableLengthM * iAcA) / s / U * 100;
  let section = e.acCableSectionMm2 ?? byCurrent;
  if (!e.acCableSectionMm2) {
    for (const [s] of CALC.ampacity) {
      if (s < byCurrent) continue;
      section = s;
      if (drop(s) <= CALC.maxDropPct) break;
    }
  }
  const dropPct = Math.round(drop(section) * 100) / 100;

  // générateur PV
  const modulesInSeries = isMicro ? 1 : e.modulesPerString ?? Math.max(1, Math.round(p.pv.panelCount / (e.strings ?? 1)));
  const strings = isMicro ? 1 : e.strings ?? 1;
  let iscMaxA: number | undefined;
  let uocMaxV: number | undefined;
  if (panel?.iscA && panel.vocV) {
    iscMaxA = Math.round(CALC.iscFactor * panel.iscA * strings * 100) / 100;
    const k = panel.vocTempCoeffPct !== undefined ? 1 + (Math.abs(panel.vocTempCoeffPct) / 100) * (25 - CALC.tMinC) : CALC.uocFallbackFactor;
    uocMaxV = Math.round(panel.vocV * modulesInSeries * k * 10) / 10;
  } else notes.push("Voc/Isc du module inconnus : complétez la fiche du panneau (catalogue) pour calculer Iscmax et Uocmax.");

  // formulaire Consuel (tableau officiel consuel.com/dossiers-techniques, lu le 12/11/2026)
  const consuelForm: ConsuelForm = isMicro ? "SC 144C2-2" : e.battery ? "SC 144C-5" : "SC 144A-5";
  if (isMicro && e.battery) notes.push("Micro-onduleurs avec batterie : SC 144C2-2 uniquement si l'ensemble de stockage est à micro-onduleur chargeur couplé en AC ; sinon SC 144C-5.");
  if (!isMicro && !e.battery && inv?.kind === "optimiseur") notes.push("Avec optimiseurs : voir l'aide au remplissage du SC 144A pour Iscmax/Uocmax (sortie optimiseur ou entrée onduleur).");
  const extraForms: string[] = [];
  if (e.connectionCase === 4) extraForms.push("SC 144E");
  if (acPowerKva > 36) extraForms.push("SC 143");
  const pdf = { "SC 144C2-2": "/consuel/SC-144C2_2.pdf", "SC 144A-5": "/consuel/SC-144A_5.pdf", "SC 144C-5": "/consuel/SC-144C_5.pdf" }[consuelForm];
  return {
    isMicro,
    microCount,
    acPowerVa,
    acPowerKva,
    iAcA,
    breakerA,
    sectionMm2: section,
    sectionByCurrentMm2: byCurrent,
    dropPct,
    iscMaxA,
    uocMaxV,
    modulesInSeries,
    consuelForm,
    consuelFormPdf: pdf,
    extraForms,
    attestation: e.battery ? "violette" : "bleue",
    attestationCerfa: e.battery ? "Cerfa n° 15524" : "Cerfa n° 15523",
    notes,
  };
}

export const isValidPdl = (s?: string) => Boolean(s && /^\d{14}$/.test(s.replace(/\s/g, "")));
