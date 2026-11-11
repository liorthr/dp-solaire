import type { Client, PanelModel, Project, ProjectStatus } from "@/lib/types";
import { buildFacts } from "@/lib/rules/facts";
import { deadlineMonths, evaluateProject } from "@/lib/rules/engine";
import { computeInstruction } from "@/lib/instruction/deadlines";

export const STATUS_LABEL: Record<ProjectStatus, string> = {
  brouillon: "Brouillon",
  pret: "Prêt à déposer",
  depose: "Déposé",
  recepisse: "Récépissé reçu",
  instruction: "Instruction en cours",
  pieces_demandees: "Pièces demandées",
  accord: "Non-opposition / accord",
  refus: "Opposition / refus",
  retire: "Retiré",
};
export const STATUS_TONE: Record<ProjectStatus, "neutral" | "info" | "alerte" | "ok" | "bloquant"> = {
  brouillon: "neutral",
  pret: "info",
  depose: "info",
  recepisse: "info",
  instruction: "info",
  pieces_demandees: "alerte",
  accord: "ok",
  refus: "bloquant",
  retire: "neutral",
};

export function analyze(p: Project, client: Client | undefined, panel: PanelModel | undefined, today?: string) {
  const facts = buildFacts({ project: p, client, panel });
  const evaluation = evaluateProject(facts);
  const months = deadlineMonths(facts);
  const instruction = computeInstruction(p.events, months.months, today);
  const status: ProjectStatus = p.events.some((e) => e.type === "depot") ? instruction.status : evaluation.blocking.length === 0 && evaluation.regime.outcome === "DP" ? "pret" : "brouillon";
  return { facts, evaluation, months, instruction, status };
}

/** estimation (affichée comme telle) : temps moyen d'un dossier manuel ≈ 3 h (À_VÉRIFIER auprès d'installateurs) */
export const MANUAL_HOURS_PER_DOSSIER = 3;
