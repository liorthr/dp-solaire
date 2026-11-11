// Textes générés (mandat, description, notice, courriers). Modèles versionnés, personnalisables par entreprise (mentions).
import type { Client, EnrichmentResult, InverterModel, MairieInfo, PanelModel, Project, Tenant } from "@/lib/types";
import { fr } from "@/lib/instruction/deadlines";
import { panelAreaM2 } from "@/lib/geo/calepinage";
import { orientationLabel } from "@/lib/geo/roof";

export const TEMPLATES_VERSION = "2026.11.1";

const fullName = (c?: Client) => (c ? `${c.civility ? c.civility + " " : ""}${c.firstName} ${c.lastName}` : "le maître d'ouvrage");
const today = () => fr(new Date().toISOString().slice(0, 10));
const mounting = (m: Project["pv"]["mounting"]) => ({ surimposition: "en surimposition de la couverture existante", integration: "en intégration au bâti (en remplacement de la couverture)", ombriere: "sur ombrière", sol: "au sol" })[m];

export function parcelRefs(e?: EnrichmentResult) {
  return (e?.parcels ?? []).map((p) => `section ${p.section} n° ${p.numero.replace(/^0+/, "")}`).join(", ") || "à compléter";
}

export function totalPanelArea(p: Project) {
  return Math.round(p.pv.layouts.reduce((s, l) => s + panelAreaM2(l), 0) * 10) / 10;
}

export function projectDescription(p: Project, panel?: PanelModel): string {
  const planes = p.pv.layouts
    .map((l) => p.pv.roofPlanes.find((r) => r.id === l.roofPlaneId))
    .filter(Boolean)
    .map((r) => `pan ${orientationLabel(r!.azimuthDeg).toLowerCase()} (pente ${r!.tiltDeg}°)`)
    .join(" et ");
  return (
    `Installation de ${p.pv.panelCount} panneaux solaires photovoltaïques (${String(p.pv.powerKwc).replace(".", ",")} kWc, ${totalPanelArea(p)} m²) ` +
    `${mounting(p.pv.mounting)}, sur le ${planes || "pan de toiture"} de la maison existante. ` +
    (panel ? `Modules ${panel.fullBlack ? "full black" : `cellules ${panel.cellColor}`}, cadre ${panel.frameColor}, ${panel.widthMm} × ${panel.heightMm} mm. ` : "") +
    "Champ de panneaux rectangulaire, parallèle au plan de la toiture, sans modification du volume ni de la hauteur du bâtiment."
  );
}

export function mandateText(p: Project, c: Client | undefined, t: Tenant): string {
  return [
    "MANDAT DE DÉPÔT D'UNE DÉCLARATION PRÉALABLE DE TRAVAUX",
    "",
    `Je soussigné(e) ${fullName(c)}, propriétaire (ou titulaire du droit de construire) du terrain situé ${p.address?.label ?? "(adresse)"} (parcelle(s) ${parcelRefs(p.enrichment)}),`,
    `donne mandat à ${t.name}${t.siret ? ` (SIRET ${t.siret})` : ""}, ${t.address ?? ""},`,
    "pour constituer, signer pour mon compte le cas échéant et déposer auprès de la mairie compétente la déclaration préalable relative à l'installation de panneaux photovoltaïques décrite ci-après, recevoir les correspondances du service instructeur et y répondre (pièces complémentaires), et demander le certificat de non-opposition.",
    "",
    `Projet : ${projectDescription(p)}`,
    `Référence dossier : ${p.reference}`,
    "",
    "Je reste responsable de la sincérité des informations déclarées et du respect des règles d'urbanisme. Le mandataire m'informe des décisions et délais. Ce mandat peut être révoqué à tout moment par écrit.",
    "Mes données personnelles sont traitées par le mandataire pour la seule constitution et le suivi de ce dossier (base légale : exécution du contrat), conservées pendant la durée nécessaire, et je peux exercer mes droits d'accès, de rectification et d'effacement auprès du mandataire.",
  ].join("\n");
}

export function noticeDescriptive(p: Project, panel: PanelModel | undefined, inverter: InverterModel | undefined): string[] {
  const e = p.enrichment;
  const zone = e?.zones[0];
  return [
    `Adresse du terrain : ${p.address?.label ?? ""}`,
    `Références cadastrales : ${parcelRefs(e)} : superficie ${e?.parcels.reduce((s, x) => s + x.contenanceM2, 0) ?? "?"} m²`,
    `Document d'urbanisme : ${zone ? `${zone.docType} ${zone.docName}, zone ${zone.libelle}${zone.libelong ? ` (${zone.libelong})` : ""}` : "non identifié sur le Géoportail de l'Urbanisme"}`,
    `État initial : maison individuelle existante, toiture ${p.pv.roofPlanes.map((r) => `${r.label.toLowerCase()} ${r.tiltDeg}°`).join(", ")}. Couverture existante conservée.`,
    `Projet : ${projectDescription(p, panel)}`,
    `Matériaux et couleurs : modules ${panel ? `${panel.brand} ${panel.model}` : ""} ; cadre ${panel?.frameColor ?? "?"} ; fixations et rails non visibles depuis l'espace public ; câbles cheminés sous les modules.`,
    `Onduleur : ${inverter ? `${inverter.brand} ${inverter.model}` : "à préciser"} (installé ${inverter?.kind === "micro" ? "sous les modules" : "à l'intérieur du bâtiment"}, aucun équipement visible ajouté en façade).`,
    `Insertion : champ unique, rectangulaire, aligné sur l'égout et les rives, marges de ${p.pv.layouts[0]?.marginEdgeM ?? 0.3} m minimum ; aucune modification de la hauteur ni de l'emprise au sol.`,
    `Modalités d'exécution : pose par une entreprise qualifiée, durée de chantier estimée à 1 à 2 jours, accès par échafaudage ou nacelle sans occupation prolongée du domaine public.`,
  ];
}

export function coverLetterEmail(p: Project, c: Client | undefined, t: Tenant, mairie: MairieInfo | undefined, pieces: string[]) {
  const subject = `Déclaration préalable : panneaux photovoltaïques : ${p.address?.label ?? ""} : ${fullName(c)}`;
  const body = [
    `Madame, Monsieur,`,
    "",
    `Pour le compte de ${fullName(c)}, nous vous adressons une déclaration préalable de travaux (cerfa n° 16702*03) relative à l'installation de ${p.pv.panelCount} panneaux photovoltaïques (${String(p.pv.powerKwc).replace(".", ",")} kWc) sur la toiture de la maison située ${p.address?.label} (parcelle(s) ${parcelRefs(p.enrichment)}).`,
    "",
    `Pièces jointes : ${pieces.join(", ")}.`,
    "",
    "Nous vous remercions de bien vouloir nous adresser l'accusé de réception électronique valant récépissé, avec le numéro d'enregistrement du dossier. Le mandat du maître d'ouvrage est joint.",
    "",
    "Nous restons à votre disposition pour tout complément.",
    "",
    "Veuillez agréer, Madame, Monsieur, l'expression de nos salutations distinguées.",
    "",
    `${t.name}${t.phone ? ` | ${t.phone}` : ""}${t.email ? ` | ${t.email}` : ""}`,
    `Mandataire de ${fullName(c)} | Réf. ${p.reference}`,
  ].join("\n");
  return { to: mairie?.email ?? "", subject, body };
}

export function lrarLetter(p: Project, c: Client | undefined, t: Tenant, mairie: MairieInfo | undefined, pieces: string[], copies: number) {
  return [
    `${t.name}`,
    `${t.address ?? ""}`,
    "",
    `${mairie?.name ?? "Mairie de " + (p.address?.city ?? "")}`,
    `Service urbanisme`,
    `${mairie?.address ?? ""}`,
    "",
    `Lettre recommandée avec demande d'avis de réception`,
    `Le ${today()}`,
    "",
    `Objet : dépôt d'une déclaration préalable de travaux : installation de panneaux photovoltaïques`,
    `Terrain : ${p.address?.label} : ${parcelRefs(p.enrichment)}`,
    "",
    "Madame, Monsieur,",
    "",
    `Agissant en qualité de mandataire de ${fullName(c)}, nous vous prions de trouver ci-joint, en ${copies} exemplaires, la déclaration préalable (cerfa n° 16702*03) et ses pièces : ${pieces.join(", ")}.`,
    "",
    "Nous vous remercions de bien vouloir nous adresser le récépissé de dépôt mentionnant le numéro d'enregistrement du dossier.",
    "",
    "Veuillez agréer, Madame, Monsieur, l'expression de nos salutations distinguées.",
    "",
    `Pour ${t.name}`,
  ].join("\n");
}

export const gnauSteps = (mairie?: MairieInfo) => [
  `Ouvrez le téléservice de la commune${mairie?.teleserviceUrl ? ` (${mairie.teleserviceUrl})` : " (lien sur le site de la mairie, rubrique « Urbanisme ») ou l'assistance nationale AD'AU : https://www.service-public.gouv.fr/particuliers/vosdroits/R52221"}.`,
  "Créez ou utilisez le compte de l'entreprise (mandataire) ; choisissez « Déclaration préalable » puis « Constructions et travaux non soumis à permis de construire » (cerfa 16702).",
  "Recopiez les informations du cerfa pré-rempli (fourni dans le ZIP) ou importez-le si le téléservice le permet.",
  "Téléversez chaque pièce séparément avec le nom proposé (DP1_plan_de_situation.pdf, etc.) ainsi que le mandat.",
  "Validez : l'accusé d'enregistrement électronique vaut récépissé. Saisissez sa date et son numéro dans l'onglet Suivi pour lancer le calcul des délais.",
];

export function tacitCertificateRequest(p: Project, c: Client | undefined, t: Tenant, mairie: MairieInfo | undefined, depositDate: string, deadline: string) {
  return [
    `${t.name}, mandataire de ${fullName(c)}`,
    "",
    `${mairie?.name ?? "Mairie"} : Service urbanisme`,
    "",
    `Objet : demande de certificat de non-opposition à déclaration préalable (article R*424-13 du code de l'urbanisme)`,
    "",
    "Madame, Monsieur,",
    "",
    `Une déclaration préalable a été déposée le ${fr(depositDate)} pour l'installation de panneaux photovoltaïques ${p.address?.label} (réf. ${p.reference}). À notre connaissance, aucune décision d'opposition ni demande de pièces n'a été notifiée avant le ${fr(deadline)}, date d'expiration du délai d'instruction.`,
    "",
    "Nous vous prions de bien vouloir nous délivrer le certificat attestant de la non-opposition tacite à cette déclaration.",
    "",
    "Veuillez agréer, Madame, Monsieur, l'expression de nos salutations distinguées.",
  ].join("\n");
}

export function piecesResponseLetter(p: Project, t: Tenant, requested: string[]) {
  return [
    `Objet : dossier ${p.reference} : réponse à votre demande de pièces complémentaires`,
    "",
    "Madame, Monsieur,",
    "",
    "Suite à votre courrier, nous vous prions de trouver ci-joint les pièces demandées :",
    ...requested.map((r) => `  - ${r}`),
    "",
    "Nous vous remercions de nous confirmer que le dossier est désormais complet ; le délai d'instruction court à compter de la réception de ces pièces.",
    "",
    `Pour ${t.name}`,
  ].join("\n");
}

export const DISCLAIMER =
  "Document préparé avec l'assistance du logiciel DP Solaire. Les informations réglementaires sont issues de sources publiques citées et peuvent comporter des erreurs ou être devenues obsolètes. Le déclarant reste seul responsable de l'exactitude du dossier et du respect des règles d'urbanisme ; aucune décision favorable n'est garantie.";
