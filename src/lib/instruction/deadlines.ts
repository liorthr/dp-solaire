// Calcul des dates clés de l'instruction (docs/regulation/03-delais-instruction.md).
import type { InstructionEvent, ProjectStatus } from "@/lib/types";

/** ajout de mois « de date à date » ; si le jour n'existe pas, dernier jour du mois (convention : open-questions Q8) */
export function addMonths(iso: string, months: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const target = new Date(Date.UTC(y, m - 1 + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(d, lastDay));
  return target.toISOString().slice(0, 10);
}
export function addDays(iso: string, days: number): string {
  const t = new Date(`${iso}T00:00:00Z`);
  t.setUTCDate(t.getUTCDate() + days);
  return t.toISOString().slice(0, 10);
}
export const daysBetween = (a: string, b: string) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);

export interface KeyDate {
  code: string;
  label: string;
  date: string;
  kind: "info" | "echeance" | "rappel";
  source_url?: string;
}

export interface InstructionState {
  status: ProjectStatus;
  depositDate?: string;
  completeDate?: string;
  instructionMonths: number;
  decisionDeadline?: string;
  suspended: boolean;
  tacitAcquired: boolean;
  keyDates: KeyDate[];
  reminders: KeyDate[];
  explanation: string[];
}

const SP = "https://www.service-public.gouv.fr/particuliers/vosdroits/F17578";

/**
 * @param baseMonths délai issu des règles (1 mois + majoration secteur protégé)
 */
export function computeInstruction(events: InstructionEvent[], baseMonths: number, today = new Date().toISOString().slice(0, 10)): InstructionState {
  const ev = [...events].sort((a, b) => a.date.localeCompare(b.date));
  const find = (t: InstructionEvent["type"]) => ev.filter((e) => e.type === t);
  const deposit = find("depot")[0];
  const explanation: string[] = [];
  const keyDates: KeyDate[] = [];
  let months = baseMonths;

  const notifiedMaj = find("notification_majoration").at(-1);
  if (notifiedMaj?.payload && typeof notifiedMaj.payload.totalMonths === "number") {
    months = notifiedMaj.payload.totalMonths;
    explanation.push(`Délai notifié par la mairie : ${months} mois.`);
  }

  if (!deposit) {
    return { status: "brouillon", instructionMonths: months, suspended: false, tacitAcquired: false, keyDates, reminders: [], explanation: ["Le dossier n'est pas encore déposé."] };
  }

  keyDates.push({ code: "depot", label: "Dépôt en mairie", date: deposit.date, kind: "info" });
  keyDates.push({ code: "limite_completude", label: "Limite pour que la mairie signale une pièce manquante ou une majoration de délai (1 mois)", date: addMonths(deposit.date, 1), kind: "echeance", source_url: SP });

  const demandes = find("demande_pieces");
  const fournies = find("pieces_fournies");
  let completeDate = deposit.date;
  let suspended = false;
  if (demandes.length) {
    const lastDemande = demandes.at(-1)!;
    const answered = fournies.find((f) => f.date >= lastDemande.date);
    if (answered) {
      completeDate = answered.date;
      explanation.push(`Pièces complémentaires fournies le ${fr(answered.date)} : le délai d'instruction court à partir de cette date.`);
    } else {
      suspended = true;
      const due = addMonths(lastDemande.date, 3);
      keyDates.push({ code: "pieces_limite", label: "Date limite pour fournir les pièces demandées (3 mois), sinon rejet tacite", date: due, kind: "echeance", source_url: SP });
      explanation.push(`Délai suspendu : pièces demandées le ${fr(lastDemande.date)}. À fournir avant le ${fr(due)}.`);
    }
  }

  const decision = ev.find((e) => e.type === "decision_accord" || e.type === "decision_refus");
  const retrait = find("retrait")[0];
  const decisionDeadline = suspended ? undefined : addMonths(completeDate, months);
  if (decisionDeadline) keyDates.push({ code: "decision", label: `Date limite de décision (${months} mois) : à défaut, non-opposition tacite`, date: decisionDeadline, kind: "echeance", source_url: SP });

  const tacitAcquired = Boolean(decisionDeadline && !decision && !retrait && today > decisionDeadline);
  const decisionDate = decision?.date ?? (tacitAcquired ? decisionDeadline : undefined);
  if (decisionDate && decision?.type !== "decision_refus") {
    keyDates.push({ code: "retrait", label: "Fin du délai de retrait par l'administration (3 mois)", date: addMonths(decisionDate, 3), kind: "info", source_url: SP });
    keyDates.push({ code: "peremption", label: "Péremption si travaux non commencés (3 ans, prorogeable 2 × 1 an)", date: addMonths(decisionDate, 36), kind: "echeance", source_url: SP });
  }
  if (decision?.type === "decision_refus") {
    keyDates.push({ code: "recours_gracieux", label: "Limite du recours gracieux (1 mois)", date: addMonths(decision.date, 1), kind: "echeance", source_url: SP });
    keyDates.push({ code: "recours_contentieux", label: "Limite du recours contentieux (2 mois)", date: addMonths(decision.date, 2), kind: "echeance", source_url: SP });
  }

  let status: ProjectStatus = "depose";
  if (find("recepisse").length) status = "recepisse";
  if (status === "recepisse" || daysBetween(deposit.date, today) > 0) status = "instruction";
  if (suspended) status = "pieces_demandees";
  if (decision?.type === "decision_accord" || tacitAcquired) status = "accord";
  if (decision?.type === "decision_refus") status = "refus";
  if (retrait) status = "retire";

  if (tacitAcquired) explanation.push(`Aucune décision reçue au ${fr(decisionDeadline!)} : non-opposition tacite (sous réserve des cas où le silence vaut opposition, qui doivent vous avoir été signalés dans le premier mois). Demandez le certificat de non-opposition (R*424-13).`);

  const reminders: KeyDate[] = keyDates
    .filter((k) => k.kind === "echeance" && k.date >= today)
    .map((k) => ({ ...k, code: `rappel_${k.code}`, kind: "rappel" as const, date: addDays(k.date, -7) < today ? today : addDays(k.date, -7), label: `Rappel J-7 : ${k.label}` }));

  return { status, depositDate: deposit.date, completeDate, instructionMonths: months, decisionDeadline, suspended, tacitAcquired, keyDates: keyDates.sort((a, b) => a.date.localeCompare(b.date)), reminders, explanation };
}

export const fr = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};
