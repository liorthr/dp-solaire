// Types de travaux et catalogue de départ (modèles GÉNÉRIQUES représentatifs, à remplacer par vos fiches fabricants).
import type { IteInfo, PacInfo, PacUnitModel, WorksType } from "@/lib/types";

export const WORKS: { id: WorksType; label: string; short: string; emoji: string; desc: string }[] = [
  { id: "pv", label: "Panneaux solaires en toiture", short: "Solaire", emoji: "☀", desc: "Photovoltaïque sur toiture existante : DP mairie, puis raccordement et Consuel." },
  { id: "pac", label: "Pompe à chaleur / climatisation", short: "PAC", emoji: "❄", desc: "Unité extérieure en façade, en toiture ou au sol : DP si l'aspect extérieur change." },
  { id: "ite", label: "Isolation des murs par l'extérieur", short: "ITE", emoji: "▦", desc: "Isolant et nouvelle finition (enduit, bardage) : DP obligatoire." },
];

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
