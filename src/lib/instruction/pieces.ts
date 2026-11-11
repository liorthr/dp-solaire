// Analyse d'un courrier de la mairie (demande de pièces / opposition) : heuristique déterministe (repli sans IA).
// Le résultat est étiqueté « analyse automatique à valider », jamais appliqué sans action de l'utilisateur.
import { ruleset } from "@/lib/rules/engine";

export interface LetterAnalysis {
  method: "heuristique" | "ia";
  kind: "demande_pieces" | "opposition" | "majoration" | "accord" | "inconnu";
  requestedPieces: { code: string; label: string; evidence: string }[];
  motifs: string[];
  deadlineMonths?: number;
  confidence: "faible" | "moyenne";
}

const PIECE_PATTERNS: [string, RegExp][] = [
  ["DP1", /\b(DPC?\s?1\b|plan de situation)/i],
  ["DP2", /\b(DPC?\s?2\b|plan de masse)/i],
  ["DP3", /\b(DPC?\s?3\b|plan en coupe|coupe du terrain)/i],
  ["DP4", /\b(DPC?\s?4\b|plans? des fa[çc]ades|plan des toitures)/i],
  ["DP5", /\b(DPC?\s?5\b|aspect ext[ée]rieur)/i],
  ["DP6", /\b(DPC?\s?6\b|insertion|document graphique)/i],
  ["DP7", /\b(DPC?\s?7\b|environnement proche|photographie.*proche)/i],
  ["DP8", /\b(DPC?\s?8\b|paysage lointain|photographie.*lointain)/i],
  ["DP11", /\b(DPC?\s?11\b|notice.*mat[ée]riaux)/i],
  ["MANDAT", /\b(mandat|pouvoir|qualit[ée] pour d[ée]poser)/i],
];

const MOTIFS: [string, RegExp][] = [
  ["Avis de l'Architecte des Bâtiments de France", /architecte des b[âa]timents de france|\bABF\b|UDAP/i],
  ["Aspect / couleur des panneaux", /couleur|aspect|teinte|reflet|full black|cadre/i],
  ["Implantation / composition du champ de panneaux", /implantation|alignement|composition|regroup|dispersion/i],
  ["Non-conformité au règlement du PLU", /plan local d.urbanisme|\bPLU\b|r[èe]glement de (la )?zone/i],
  ["Dossier incomplet", /incomplet|pi[èe]ces? manquantes?|compl[ée]ter/i],
  ["Visibilité depuis l'espace public / monument", /covisibilit|visible depuis|monument historique/i],
];

export function analyzeLetter(text: string): LetterAnalysis {
  const t = text.replace(/\s+/g, " ");
  const requestedPieces = PIECE_PATTERNS.flatMap(([code, re]) => {
    const m = t.match(re);
    if (!m) return [];
    const i = Math.max(0, (m.index ?? 0) - 40);
    const label = ruleset.pieces.find((p) => p.code === code)?.label ?? "Mandat de dépôt";
    return [{ code, label, evidence: `…${t.slice(i, i + 120)}…` }];
  });
  const motifs = MOTIFS.filter(([, re]) => re.test(t)).map(([m]) => m);
  let kind: LetterAnalysis["kind"] = "inconnu";
  if (/opposition|refus|s.oppose/i.test(t)) kind = "opposition";
  else if (/incomplet|pi[èe]ces? (manquantes|compl[ée]mentaires)|veuillez (nous )?(transmettre|fournir)/i.test(t)) kind = "demande_pieces";
  else if (/d[ée]lai d.instruction.{0,60}(port[ée]|major)|deux mois|2 mois/i.test(t)) kind = "majoration";
  else if (/non.opposition|accord/i.test(t)) kind = "accord";
  const dm = t.match(/d[ée]lai.{0,80}?(\d|un|deux|trois)\s*mois/i);
  const words: Record<string, number> = { un: 1, deux: 2, trois: 3 };
  const deadlineMonths = dm ? (words[dm[1].toLowerCase()] ?? Number(dm[1])) : undefined;
  return { method: "heuristique", kind, requestedPieces, motifs, deadlineMonths, confidence: requestedPieces.length || motifs.length ? "moyenne" : "faible" };
}
