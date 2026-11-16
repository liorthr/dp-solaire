// Verdict immédiat pour un particulier : régime, délai, ABF, zonage, pièces, à partir des mêmes règles sourcées que l'application.
import type { AddressResult, EnrichmentResult, Project, WorksType } from "@/lib/types";
import { applyEnrichment, newProject } from "@/lib/project/factory";
import { defaultIte, defaultJoinery, defaultPac, defaultVelux } from "@/data/works";
import { bestPacFacade, defaultJoineryItems, defaultRoofWindows } from "@/lib/works/geom";
import { buildFacts } from "@/lib/rules/facts";
import { deadlineMonths, evaluateProject, requiredPieces, rulesetFor } from "@/lib/rules/engine";

/** brouillon laissé par le parcours public, repris dans l'assistant après connexion */
export const DRAFT_KEY = "permizy:draft";
export interface QuickDraft {
  works: WorksType;
  address: AddressResult;
  answers: QuickAnswers;
}

/** réponses du parcours (une ou deux questions selon le type de travaux) */
export interface QuickAnswers {
  pacPlacement?: "facade" | "toiture" | "sol_dalle" | "sol_sans_dalle";
  identical?: boolean;
  visible?: boolean;
  copropriete?: boolean;
}

export interface QuickVerdict {
  outcome: "DP" | "PC" | "AUCUNE" | "HORS_PERIMETRE";
  headline: string;
  message: string;
  source_url: string;
  source_label?: string;
  months: number;
  protectedArea: boolean;
  heritageLabel: string;
  zone?: string;
  pieces: number;
  alerts: { title: string; message: string; source_url: string }[];
  mairie?: string;
}

export function draftProject(works: WorksType, address: AddressResult, e: EnrichmentResult, a: QuickAnswers): Project {
  let p = newProject("public", "public", address);
  p.works = works;
  p.answers = { ...p.answers, visibleFromPublicSpace: a.visible ?? true, copropriete: a.copropriete ?? false };
  p = applyEnrichment(p, e);
  if (works === "pac") {
    const pac = { ...defaultPac(), placement: a.pacPlacement ?? "facade" };
    p.pac = { ...pac, facadeIndex: bestPacFacade(e, pac) };
  }
  if (works === "ite") p.ite = defaultIte();
  if (works === "menuiserie") p.menuiserie = { ...defaultJoinery(), identical: Boolean(a.identical), items: defaultJoineryItems(e) };
  if (works === "velux") p.velux = { ...defaultVelux(), identical: Boolean(a.identical), items: defaultRoofWindows(p, "rw-78x118", 2) };
  if (works === "pv") p.pv = { ...p.pv, panelCount: 12, powerKwc: 5.2 };
  return p;
}

const HEADLINES: Record<QuickVerdict["outcome"], string> = {
  DP: "Bonne nouvelle : une simple déclaration suffit.",
  AUCUNE: "Aucune autorisation à demander.",
  PC: "Il faut un permis de construire.",
  HORS_PERIMETRE: "Votre cas mérite un coup d'œil du service urbanisme.",
};

export function quickVerdict(works: WorksType, address: AddressResult, e: EnrichmentResult, a: QuickAnswers, today = new Date().toISOString().slice(0, 10)): QuickVerdict {
  const p = draftProject(works, address, e, a);
  const facts = buildFacts({ project: p, generatedPieces: ["DP1", "DP2", "DP3", "DP4", "DP5", "DP6", "DP7", "DP8", "DP8-1", "DP11"] });
  const rs = rulesetFor(works);
  const ev = evaluateProject(facts, today, rs);
  const months = deadlineMonths(facts, rs).months;
  // alertes utiles au particulier : contexte du terrain uniquement (la complétude et la cohérence des plans sont traitées dans le dossier) ;
  // l'aspect des panneaux dépend du modèle, encore inconnu à ce stade
  const alerts = ev.results.filter((r) => (r.severity === "alerte" || r.severity === "bloquant") && r.category === "contexte" && r.code !== "ABF_PANNEAUX_NON_NOIRS").map((r) => ({ title: r.title, message: r.message, source_url: r.source_url }));
  const zone = e.zones[0];
  return {
    outcome: ev.regime.outcome,
    headline: HEADLINES[ev.regime.outcome],
    message: ev.regime.message,
    source_url: ev.regime.source_url,
    source_label: ev.regime.source_label,
    months,
    protectedArea: Boolean(facts["heritage.protected"]),
    heritageLabel: String(facts["heritage.label"] ?? ""),
    zone: zone ? `Zone ${zone.libelle}` : undefined,
    pieces: requiredPieces(facts, rs).filter((x) => x.isRequired).length,
    alerts,
    mairie: e.mairie?.name,
  };
}
