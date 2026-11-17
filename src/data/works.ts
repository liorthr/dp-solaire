// Types de travaux et catalogue de départ (modèles GÉNÉRIQUES représentatifs, à remplacer par vos fiches fabricants).
import type { AgriInfo, ExtensionInfo, IteInfo, JoineryInfo, JoineryKind, JoineryMaterial, PacInfo, PacUnitModel, RoofWindowInfo, RoofWindowModel, WorksType } from "@/lib/types";

export const WORKS: { id: WorksType; label: string; short: string; emoji: string; desc: string }[] = [
  { id: "pv", label: "Panneaux solaires en toiture", short: "Solaire", emoji: "☀", desc: "Photovoltaïque sur toiture existante : DP mairie, puis raccordement et Consuel." },
  { id: "pac", label: "Pompe à chaleur / climatisation", short: "PAC", emoji: "❄", desc: "Unité extérieure en façade, en toiture ou au sol : DP si l'aspect extérieur change." },
  { id: "ite", label: "Isolation des murs par l'extérieur", short: "ITE", emoji: "▦", desc: "Isolant et nouvelle finition (enduit, bardage) : DP obligatoire." },
  { id: "menuiserie", label: "Fenêtres, portes et volets", short: "Menuiseries", emoji: "⊞", desc: "Changement de matériau ou de couleur, nouvelle ouverture : DP si l'aspect change." },
  { id: "extension", label: "Agrandissement, garage, véranda", short: "Extension", emoji: "▣", desc: "Déclaration préalable ou permis de construire selon la surface : on vous dit lequel et on le prépare." },
  { id: "velux", label: "Fenêtres de toit", short: "Fenêtres de toit", emoji: "◩", desc: "Création ou changement de modèle : DP ; distances de vue sur le voisin vérifiées." },
];

/** choix « Solaire agricole » : même moteur que le solaire (works « pv ») avec la fiche AgriInfo */
export type WorksChoice = WorksType | "pv_agri";
export const AGRI_CHOICE = { id: "pv_agri" as const, label: "Panneaux solaires agricoles", short: "Solaire agricole", emoji: "☀", desc: "Hangar, stabulation, bâtiment d'exploitation : DP en mairie (permis pour un hangar neuf), raccordement et Consuel jusqu'aux fortes puissances." };
export const WORK_CHOICES: { id: WorksChoice; label: string; short: string; emoji: string; desc: string }[] = [WORKS[0], AGRI_CHOICE, ...WORKS.slice(1)];
export const defaultAgri = (): AgriInfo => ({ building: "existant", use: "hangar" });
export const AGRI_USES: Record<AgriInfo["use"], string> = { hangar: "Hangar (matériel, fourrage)", stabulation: "Stabulation, bâtiment d'élevage", stockage: "Bâtiment de stockage", serre: "Serre", autre: "Autre bâtiment agricole" };
export const choiceOf = (works: WorksType | undefined, agri: unknown): WorksChoice => ((works ?? "pv") === "pv" && agri ? "pv_agri" : works ?? "pv");

export const worksLabel = (w?: WorksType) => WORKS.find((x) => x.id === (w ?? "pv"))!.label;

export const defaultPacUnits: PacUnitModel[] = [
  { id: "gen-pac-ae-8", brand: "Générique", model: "PAC air/eau 8 kW, unité extérieure (exemple)", kind: "air_eau", widthMm: 1100, heightMm: 870, depthMm: 450, soundPowerDb: 58, color: "blanc" },
  { id: "gen-pac-ae-12", brand: "Générique", model: "PAC air/eau 12 kW, unité extérieure (exemple)", kind: "air_eau", widthMm: 1150, heightMm: 1350, depthMm: 480, soundPowerDb: 62, color: "blanc" },
  { id: "gen-pac-aa-5", brand: "Générique", model: "PAC air/air 5 kW (climatisation réversible, exemple)", kind: "air_air", widthMm: 850, heightMm: 640, depthMm: 300, soundPowerDb: 56, color: "blanc" },
];

export const defaultPac = (): PacInfo => ({ unitId: defaultPacUnits[0].id, placement: "facade", facadeIndex: 0, positionRatio: 0.75, mountHeightM: 0.4, cover: false });

export const ITE_FINISHES: Record<IteInfo["finish"], string> = {
  enduit: "Enduit mince sur isolant",
  bardage_bois: "Bardage bois",
  bardage_composite: "Bardage composite",
  plaquette_brique: "Plaquettes de parement brique",
};

export const ITE_COLORS = [
  { name: "Blanc cassé", hex: "#efeae0" },
  { name: "Ton pierre", hex: "#d8cbb3" },
  { name: "Sable", hex: "#e2cfa6" },
  { name: "Gris clair", hex: "#c9c9c4" },
  { name: "Gris anthracite", hex: "#4a4d50" },
  { name: "Bois naturel", hex: "#a97c50" },
];

export const defaultIte = (): IteInfo => ({ facadeIndexes: [0, 1, 2, 3], thicknessCm: 14, finish: "enduit", colorName: "Ton pierre", colorHex: "#d8cbb3", overhangPublic: false, overhangNeighbor: false, derogation: false });

export const JOINERY_KINDS: Record<JoineryKind, { label: string; w: number; h: number; sill: number }> = {
  fenetre: { label: "Fenêtre", w: 1.0, h: 1.25, sill: 1.0 },
  porte_fenetre: { label: "Porte-fenêtre", w: 1.4, h: 2.15, sill: 0 },
  porte: { label: "Porte d'entrée", w: 0.9, h: 2.15, sill: 0 },
  volet_battant: { label: "Volets battants", w: 1.0, h: 1.25, sill: 1.0 },
  volet_roulant: { label: "Volet roulant", w: 1.0, h: 1.25, sill: 1.0 },
  porte_garage: { label: "Porte de garage", w: 2.4, h: 2.0, sill: 0 },
};

export const JOINERY_MATERIALS: Record<JoineryMaterial, string> = { bois: "Bois", pvc: "PVC", alu: "Aluminium", mixte: "Mixte bois/alu", acier: "Acier" };

export const JOINERY_COLORS = [
  { name: "Blanc", hex: "#f4f4f2" },
  { name: "Gris anthracite (RAL 7016)", hex: "#383e42" },
  { name: "Gris clair (RAL 7035)", hex: "#cbd0cc" },
  { name: "Noir", hex: "#1f1f1f" },
  { name: "Chêne doré", hex: "#a8733a" },
  { name: "Vert sapin", hex: "#2f5a3c" },
  { name: "Bleu canon", hex: "#3b4f63" },
];

export const defaultJoinery = (): JoineryInfo => ({
  identical: false,
  materialBefore: "bois",
  materialAfter: "alu",
  colorName: "Gris anthracite (RAL 7016)",
  colorHex: "#383e42",
  items: [],
  view: "droite",
  neighborAgreement: false,
  changeOfUse: false,
});

/** tailles courantes (catalogue générique, à remplacer par vos fiches fabricants) */
export const ROOF_WINDOW_MODELS: RoofWindowModel[] = [
  { id: "rw-55x78", label: "55 × 78 cm", widthMm: 550, heightMm: 780 },
  { id: "rw-78x98", label: "78 × 98 cm", widthMm: 780, heightMm: 980 },
  { id: "rw-78x118", label: "78 × 118 cm", widthMm: 780, heightMm: 1180 },
  { id: "rw-114x118", label: "114 × 118 cm", widthMm: 1140, heightMm: 1180 },
  { id: "rw-134x98", label: "134 × 98 cm", widthMm: 1340, heightMm: 980 },
];

export const ROOF_WINDOW_COLORS: Record<RoofWindowInfo["frameColor"], { label: string; hex: string }> = {
  gris_anthracite: { label: "Gris anthracite", hex: "#3f4447" },
  noir: { label: "Noir", hex: "#1c1c1c" },
  cuivre: { label: "Cuivre", hex: "#b06a3b" },
  blanc: { label: "Blanc", hex: "#f2f2f2" },
};

export const defaultVelux = (): RoofWindowInfo => ({ modelId: "rw-78x118", frameColor: "gris_anthracite", identical: false, items: [], view: "droite", neighborAgreement: false, attic: false, changeOfUse: false, shutters: false });

export const EXTENSION_KINDS: Record<ExtensionInfo["kind"], string> = { agrandissement: "Agrandissement (pièce en plus)", garage: "Garage accolé", veranda: "Véranda" };

export const defaultExtension = (): ExtensionInfo => ({
  kind: "agrandissement",
  facadeIndex: 0,
  positionRatio: 0.5,
  widthM: 5,
  depthM: 4,
  heightM: 3,
  roof: "monopente",
  roofTiltDeg: 15,
  floorAreaCreatedM2: 17,
  floorAreaExistingM2: 100,
  wallFinish: "Enduit",
  wallColorHex: "#e8dcc4",
  roofCovering: "Tuiles identiques à l'existant",
  architect: false,
});
