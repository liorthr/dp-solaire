// Moteur de conformité déterministe : évalue des règles versionnées (JSON) sur un ensemble de faits.
// Aucune règle réglementaire n'est codée ici : tout vient de src/data/regulation/*.json.
import rulesetJson from "@/data/regulation/rules.v1.json";
import pacJson from "@/data/regulation/rules.pac.v1.json";
import iteJson from "@/data/regulation/rules.ite.v1.json";

export type Severity = "ok" | "info" | "alerte" | "bloquant";
export type Op = "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "in" | "nin" | "truthy" | "falsy" | "exists" | "matches";

export type Condition =
  | { all: Condition[] }
  | { any: Condition[] }
  | { not: Condition }
  | { fact: string; op: Op; value?: unknown };

export interface Rule {
  code: string;
  version: number;
  category: string;
  title: string;
  condition: Condition;
  severity: Exclude<Severity, "ok">;
  weight: number;
  message: string;
  suggestion?: string;
  source_url: string;
  source_label?: string;
  verification: "VERIFIE" | "A_VERIFIER";
  valid_from: string;
  valid_to: string | null;
  communes?: string[];
}

export interface RegimeRule {
  code: string;
  outcome: "DP" | "PC" | "AUCUNE" | "HORS_PERIMETRE";
  when: Condition;
  message: string;
  source_url: string;
  source_label?: string;
  verification: string;
  valid_from: string;
  valid_to: string | null;
}

export interface PieceDef {
  code: string;
  cerfaCode: string;
  label: string;
  file: string;
  required: Condition;
  optional?: boolean;
  why: string;
  article: string;
}

export interface Ruleset {
  ruleset: string;
  version: string;
  published_at: string;
  regimes: RegimeRule[];
  pieces: PieceDef[];
  deadlines: { code: string; months: number; when: Condition; label: string; source_url: string; verification: string }[];
  copies: { when: Condition; copies: number; extraSituationPlans: number; label: string; source_url: string }[];
  rules: Rule[];
}

export const ruleset = rulesetJson as unknown as Ruleset;

type SpecificRuleset = Ruleset & { generic?: string[] };
const merge = (spec: SpecificRuleset): Ruleset => ({
  ...spec,
  version: spec.version,
  // contrôles génériques (complétude, photos, mandat, mairie…) partagés avec le jeu photovoltaïque
  rules: [...ruleset.rules.filter((r) => spec.generic?.includes(r.code)), ...spec.rules],
  deadlines: spec.deadlines.length ? spec.deadlines : ruleset.deadlines,
  copies: spec.copies.length ? spec.copies : ruleset.copies,
});
const RULESETS: Record<string, Ruleset> = { pv: ruleset, pac: merge(pacJson as unknown as SpecificRuleset), ite: merge(iteJson as unknown as SpecificRuleset) };
/** jeu de règles versionné selon le type de travaux */
export const rulesetFor = (works?: string): Ruleset => RULESETS[works ?? "pv"] ?? ruleset;

export type Facts = Record<string, unknown>;

export function getFact(facts: Facts, path: string): unknown {
  if (path === "const.true") return true;
  if (path in facts) return facts[path];
  // accès imbriqué a.b.c
  return path.split(".").reduce<unknown>((acc, k) => (acc && typeof acc === "object" ? (acc as Record<string, unknown>)[k] : undefined), facts);
}

export function evaluate(cond: Condition, facts: Facts): boolean {
  if ("all" in cond) return cond.all.every((c) => evaluate(c, facts));
  if ("any" in cond) return cond.any.some((c) => evaluate(c, facts));
  if ("not" in cond) return !evaluate(cond.not, facts);
  const v = getFact(facts, cond.fact);
  const x = cond.value;
  switch (cond.op) {
    case "eq":
      return v === x;
    case "neq":
      return v !== x;
    case "gt":
      return typeof v === "number" && typeof x === "number" && v > x;
    case "gte":
      return typeof v === "number" && typeof x === "number" && v >= x;
    case "lt":
      return typeof v === "number" && typeof x === "number" && v < x;
    case "lte":
      return typeof v === "number" && typeof x === "number" && v <= x;
    case "in":
      return Array.isArray(x) && x.includes(v);
    case "nin":
      return Array.isArray(x) && !x.includes(v);
    case "truthy":
      return Boolean(v);
    case "falsy":
      return !v;
    case "exists":
      return v !== undefined && v !== null;
    case "matches":
      return typeof v === "string" && typeof x === "string" && new RegExp(x, "i").test(v);
    default:
      throw new Error(`Opérateur inconnu : ${String((cond as { op: string }).op)}`);
  }
}

export function interpolate(tpl: string, facts: Facts): string {
  return tpl.replace(/\{\{([\w.]+)\}\}/g, (_, p: string) => {
    const v = getFact(facts, p);
    if (v === undefined || v === null || v === "") return "?";
    if (typeof v === "number") return String(Math.round(v * 100) / 100).replace(".", ",");
    return String(v);
  });
}

export const isValidOn = (r: { valid_from: string; valid_to: string | null }, date: string) => r.valid_from <= date && (!r.valid_to || date <= r.valid_to);

export interface RuleResult {
  code: string;
  version: number;
  category: string;
  title: string;
  severity: Severity;
  message: string;
  suggestion?: string;
  source_url: string;
  source_label?: string;
  verification: Rule["verification"];
  weight: number;
}

export interface Evaluation {
  rulesetVersion: string;
  evaluatedAt: string;
  regime: { outcome: RegimeRule["outcome"]; code: string; message: string; source_url: string; source_label?: string };
  results: RuleResult[];
  blocking: RuleResult[];
  warnings: RuleResult[];
  score: number;
  scoreFactors: { label: string; impact: number }[];
  canGenerate: boolean;
}

export function determineRegime(facts: Facts, date: string, rs: Ruleset = ruleset) {
  const r = rs.regimes.find((x) => isValidOn(x, date) && evaluate(x.when, facts));
  if (!r) return { outcome: "HORS_PERIMETRE" as const, code: "REGIME_INCONNU", message: "Régime non déterminé : vérifiez auprès du service urbanisme.", source_url: "https://www.service-public.gouv.fr/particuliers/vosdroits/F17578" };
  return { outcome: r.outcome, code: r.code, message: r.message, source_url: r.source_url, source_label: r.source_label };
}

export function requiredPieces(facts: Facts, rs: Ruleset = ruleset) {
  return rs.pieces.map((p) => ({ ...p, isRequired: evaluate(p.required, facts) }));
}

export function deadlineMonths(facts: Facts, rs: Ruleset = ruleset) {
  const applicable = rs.deadlines.filter((d) => evaluate(d.when, facts));
  return { months: applicable.reduce((s, d) => s + d.months, 0), items: applicable };
}

export function paperCopies(facts: Facts, rs: Ruleset = ruleset) {
  return rs.copies.find((c) => evaluate(c.when, facts)) ?? rs.copies[rs.copies.length - 1];
}

/**
 * Évaluation complète. Le score est une aide à la décision, explicable facteur par facteur,
 * jamais une garantie : 100 − somme des poids des règles déclenchées (plancher 0) ;
 * toute règle bloquante rend le dossier non déposable.
 */
export function evaluateProject(facts: Facts, date = new Date().toISOString().slice(0, 10), rs: Ruleset = ruleset): Evaluation {
  const regime = determineRegime(facts, date, rs);
  const results: RuleResult[] = rs.rules
    .filter((r) => isValidOn(r, date))
    .filter((r) => !r.communes || r.communes.includes(String(getFact(facts, "commune.insee"))))
    .map((r) => {
      const triggered = evaluate(r.condition, facts);
      return {
        code: r.code,
        version: r.version,
        category: r.category,
        title: r.title,
        severity: triggered ? r.severity : "ok",
        message: triggered ? interpolate(r.message, facts) : r.title,
        suggestion: triggered && r.suggestion ? interpolate(r.suggestion, facts) : undefined,
        source_url: r.source_url,
        source_label: r.source_label,
        verification: r.verification,
        weight: triggered ? r.weight : 0,
      };
    });
  const blocking = results.filter((r) => r.severity === "bloquant");
  const warnings = results.filter((r) => r.severity === "alerte");
  const scoreFactors = results.filter((r) => r.weight > 0).map((r) => ({ label: r.title, impact: -r.weight }));
  const score = blocking.length ? 0 : Math.max(0, 100 - scoreFactors.reduce((s, f) => s - f.impact, 0));
  return {
    rulesetVersion: rs.version,
    evaluatedAt: new Date().toISOString(),
    regime,
    results,
    blocking,
    warnings,
    score,
    scoreFactors,
    canGenerate: regime.outcome === "DP",
  };
}
