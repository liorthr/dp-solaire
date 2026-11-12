// Textes du module raccordement / Consuel (modèles versionnés).
import type { Client, ElecInfo, InverterModel, PanelModel, Project, Tenant } from "@/lib/types";
import type { ElecResult } from "./calc";
import { CALC } from "./calc";
import { parcelRefs } from "@/lib/dossier/texts";

const who = (c?: Client) => (c ? `${c.civility ? c.civility + " " : ""}${c.firstName} ${c.lastName}` : "le client");
const injectionLabel = (e: ElecInfo) => ({ surplus: "autoconsommation avec injection du surplus", totale: "injection de la totalité (vente totale)", sans: "autoconsommation totale, sans injection" })[e.injection];
const buyerLabel = (e: ElecInfo) => ({ edf_oa: "EDF Obligation d'Achat (contrat S21)", enedis: "cession gratuite du surplus à Enedis (P jusqu'à 3 kW)", autre: "autre acheteur (agrégateur)" })[e.buyer];

export function mandateRaccordementText(p: Project, c: Client | undefined, t: Tenant, e: ElecInfo) {
  return [
    "MANDAT : RACCORDEMENT, ATTESTATION DE CONFORMITÉ ET CONTRAT D'ACHAT",
    "",
    `Je soussigné(e) ${who(c)}, titulaire du point de livraison ${e.pdl ?? "(PDL)"} situé ${p.address?.label ?? ""}, donne mandat à ${t.name}${t.siret ? ` (SIRET ${t.siret})` : ""} pour, en mon nom et pour mon compte :`,
    "  - déposer auprès du gestionnaire de réseau (Enedis) la demande de raccordement ou la déclaration d'autoconsommation de l'installation photovoltaïque décrite ci-dessous, et suivre son traitement ;",
    "  - demander le visa de l'attestation de conformité auprès du Consuel ;",
    e.injection === "sans" ? "  - (sans objet : aucune vente d'électricité)" : `  - le cas échéant, demander le contrat d'achat de l'électricité injectée (${buyerLabel(e)}).`,
    "",
    `Installation : ${p.pv.panelCount} modules, ${String(p.pv.powerKwc).replace(".", ",")} kWc, ${injectionLabel(e)}. Référence : ${p.reference}.`,
    "Je reste titulaire des contrats signés et peux révoquer ce mandat à tout moment par écrit. Les propositions et contrats me seront transmis avant toute acceptation engageant des frais.",
  ].join("\n");
}

export function enedisRecap(p: Project, c: Client | undefined, t: Tenant, e: ElecInfo, r: ElecResult, panel: PanelModel | undefined, inv: InverterModel | undefined) {
  return [
    { heading: "Demandeur et site", lines: [`Titulaire : ${who(c)} : ${c?.email ?? ""} : ${c?.phone ?? ""}`, `Adresse du site : ${p.address?.label ?? ""}`, `Parcelle(s) : ${parcelRefs(p.enrichment)}`, `Point de livraison (PDL/PRM) : ${e.pdl ?? "À COMPLÉTER"}`, `Puissance souscrite : ${e.subscribedKva ?? "?"} kVA : ${e.phase === "tri" ? "triphasé" : "monophasé"} : AGCP ${e.agcpA ?? "?"} A`, `Mandataire (installateur) : ${t.name}${t.siret ? ` : SIRET ${t.siret}` : ""}`] },
    { heading: "Installation de production", lines: [`Type : photovoltaïque en toiture (${p.pv.mounting}) : ${p.pv.panelCount} modules ${panel ? `${panel.brand} ${panel.model} (${panel.powerWc} Wc)` : ""}`, `Puissance crête : ${String(p.pv.powerKwc).replace(".", ",")} kWc : puissance de raccordement (onduleurs) : ${r.acPowerKva} kVA`, `Onduleur(s) : ${r.isMicro ? `${r.microCount} × ` : ""}${inv ? `${inv.brand} ${inv.model} (${inv.powerVa} VA)` : "?"} : découplage ${inv?.integratedDecoupling !== false ? "intégré (EN 50549-1)" : "externe"}`, `Stockage : ${e.battery ? `oui : ${e.batteryRef ?? ""} ${e.batteryKwh ?? ""} kWh` : "non"}`] },
    { heading: "Choix sur Enedis Connect", lines: [`Option de raccordement : ${injectionLabel(e)}`, e.injection === "sans" ? "Convention : CACSI (l'acceptation de la déclaration complète vaut convention)" : `Acheteur : ${buyerLabel(e)}`, e.injection !== "sans" && e.buyer === "edf_oa" ? "Cocher la demande de contrat d'achat : la demande complète de raccordement vaut demande de contrat (arrêté du 1er juin 2026)." : "", "Procédure : Enedis-PRO-RAC_20E (installations de production jusqu'à 36 kVA)."].filter(Boolean) },
    { heading: "Pièces à téléverser (à confirmer sur le portail)", lines: ["[ ] Plan de situation (DP1 joint)", "[ ] Schéma unifilaire (joint)", "[ ] Mandat signé du titulaire du PDL (joint)", "[ ] Autorisation d'urbanisme : récépissé, puis arrêté ou certificat de non-opposition", "[ ] Fiches techniques modules et onduleur(s), certificat EN 50549-1 du découplage", e.battery ? "[ ] Fiche technique du stockage" : ""].filter(Boolean) },
  ];
}

export function calcNote(p: Project, e: ElecInfo, r: ElecResult, panel: PanelModel | undefined) {
  return [
    { heading: "Hypothèses", lines: [`Iscmax = ${CALC.iscFactor} × Isc STC × nombre de chaînes ; Uocmax = Voc STC × modules en série × (1 + |coef. Voc| × (25 - (${CALC.tMinC}))) ; coefficient forfaitaire ${CALC.uocFallbackFactor} si coef. inconnu (guides UTE C 15-712 : À VÉRIFIER).`, `Chute de tension AC : b × rho × L × I / (S × U), rho = ${String(CALC.rhoCu).replace(".", ",")} ohm.mm²/m, b = ${e.phase === "tri" ? "racine de 3, U = 400 V" : "2, U = 230 V"} ; objectif : ${CALC.maxDropPct} % maximum (recommandation, À VÉRIFIER).`, "Calibres et courants admissibles indicatifs (NF C 15-100) : à confirmer selon le mode de pose réel."] },
    { heading: "Générateur photovoltaïque", lines: [`Modules : ${p.pv.panelCount} × ${panel?.powerWc ?? "?"} Wc : Voc ${panel?.vocV ?? "?"} V : Isc ${panel?.iscA ?? "?"} A : coef. Voc ${panel?.vocTempCoeffPct ?? "?"} %/°C`, `${r.isMicro ? "1 module par micro-onduleur" : `${e.strings ?? 1} chaîne(s) de ${r.modulesInSeries} modules`}`, `Iscmax générateur : ${r.iscMaxA ?? "non calculable"} A : Uocmax : ${r.uocMaxV ?? "non calculable"} V`] },
    { heading: "Partie alternative", lines: [`Puissance AC : ${r.acPowerVa} VA : courant ${String(r.iAcA).replace(".", ",")} A (${e.phase === "tri" ? "tri" : "mono"})`, `Protection : disjoncteur ${r.breakerA} A + différentiel 30 mA (type selon notice onduleur)`, `Câble : cuivre ${r.sectionMm2} mm² (minimum ${r.sectionByCurrentMm2} mm² au courant), longueur ${e.acCableLengthM} m, chute de tension ${String(r.dropPct).replace(".", ",")} %`, `Raccordement : tableau ${e.board}, cas ${e.connectionCase} du dossier SC 144 (§ 551.7 NF C 15-100-1)`] },
    { heading: "Consuel", lines: [`Attestation ${r.attestation} (${r.attestationCerfa}) + dossier technique ${r.consuelForm}${r.extraForms.length ? " + " + r.extraForms.join(" + ") : ""}`, ...r.notes] },
  ];
}
