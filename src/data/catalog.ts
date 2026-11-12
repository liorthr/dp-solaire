// Catalogue de démarrage. Modèles GÉNÉRIQUES, dimensions représentatives du marché (2026), à remplacer par
// les fiches techniques des fabricants : chaque entreprise gère son propre catalogue (Paramètres > Catalogue).
import type { InverterModel, PanelModel } from "@/lib/types";

export const defaultPanels: PanelModel[] = [
  { id: "gen-430-fb", brand: "Générique", model: "Module 430 Wc full black (exemple)", powerWc: 430, widthMm: 1134, heightMm: 1722, thicknessMm: 30, frameColor: "noir", cellColor: "noir", fullBlack: true, vocV: 39.2, iscA: 13.9, vocTempCoeffPct: -0.26 },
  { id: "gen-500-fb", brand: "Générique", model: "Module 500 Wc full black (exemple)", powerWc: 500, widthMm: 1134, heightMm: 1954, thicknessMm: 30, frameColor: "noir", cellColor: "noir", fullBlack: true, vocV: 45.1, iscA: 14.1, vocTempCoeffPct: -0.26 },
  { id: "gen-450-alu", brand: "Générique", model: "Module 450 Wc cadre alu (exemple)", powerWc: 450, widthMm: 1134, heightMm: 1762, thicknessMm: 30, frameColor: "argent", cellColor: "bleu", fullBlack: false, vocV: 40.6, iscA: 14.0, vocTempCoeffPct: -0.27 },
  { id: "gen-375-int", brand: "Générique", model: "Module 375 Wc intégration bâti (exemple)", powerWc: 375, widthMm: 1040, heightMm: 1690, thicknessMm: 35, frameColor: "noir", cellColor: "noir", fullBlack: true, vocV: 37.5, iscA: 12.8, vocTempCoeffPct: -0.28 },
];

export const defaultInverters: InverterModel[] = [
  { id: "gen-micro-400", brand: "Générique", model: "Micro-onduleur 400 VA (exemple)", kind: "micro", powerVa: 400, phase: "mono", integratedDecoupling: true },
  { id: "gen-central-6k", brand: "Générique", model: "Onduleur central 6 kVA (exemple)", kind: "central", powerVa: 6000, phase: "mono", integratedDecoupling: true },
  { id: "gen-opti", brand: "Générique", model: "Onduleur + optimiseurs (exemple)", kind: "optimiseur", powerVa: 5000, phase: "mono", integratedDecoupling: true },
];
