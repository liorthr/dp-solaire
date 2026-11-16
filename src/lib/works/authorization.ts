// Autorisation visée (DP ou permis de construire) d'après les règles versionnées du type de travaux.
import type { Project } from "@/lib/types";
import { buildFacts } from "@/lib/rules/facts";

export interface Authorization {
  kind: "DP" | "PC";
  /** « déclaration préalable » / « demande de permis de construire » */
  name: string;
  short: string;
  cerfa: string;
}

export const DP_AUTH: Authorization = { kind: "DP", name: "déclaration préalable", short: "DP", cerfa: "16702*03" };
export const PC_AUTH: Authorization = { kind: "PC", name: "demande de permis de construire", short: "PC", cerfa: "13406*17" };

export function authorizationOf(p: Project): Authorization {
  if (p.works !== "extension") return DP_AUTH;
  return buildFacts({ project: p })["regime.outcome"] === "PC" ? PC_AUTH : DP_AUTH;
}
