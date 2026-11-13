// Dossiers de démonstration : adresses de voies publiques réelles, bâtiments repérés dans la BD TOPO,
// clients FICTIFS. Utilisés pour la démo et les tests E2E.
import type { AddressResult, IteInfo, PacInfo, WorksType } from "@/lib/types";

export interface DemoCase {
  key: "sans-contrainte" | "abf" | "plu-restrictif" | "pac" | "ite";
  works?: WorksType;
  /** jeu de photos d'illustration (par défaut : key) */
  photos?: "sans-contrainte" | "abf" | "plu-restrictif";
  pac?: PacInfo;
  ite?: IteInfo;
  title: string;
  description: string;
  address: AddressResult;
  site: { lon: number; lat: number };
  client: { civility: "M." | "Mme"; firstName: string; lastName: string; email: string; phone: string };
  panelId: string;
  panelCount: number;
}

export const demoCases: DemoCase[] = [
  {
    key: "sans-contrainte",
    title: "Zone pavillonnaire sans contrainte",
    description: "Pont-de-Metz (80) : zone UC du PLU, aucune servitude patrimoniale.",
    address: { label: "Allée des Tilleuls 80480 Pont-de-Metz", street: "Allée des Tilleuls", postcode: "80480", city: "Pont-de-Metz", insee: "80632", lon: 2.238677, lat: 49.880359, score: 0.65, type: "street" },
    site: { lon: 2.238535, lat: 49.880454 },
    client: { civility: "Mme", firstName: "Camille", lastName: "Exemple-Durand", email: "camille.exemple@example.org", phone: "06 00 00 00 01" },
    panelId: "gen-430-fb",
    panelCount: 14,
  },
  {
    key: "abf",
    title: "Périmètre ABF (abords de la cathédrale)",
    description: "Amiens (80), rue Cormont : servitude AC1, périmètre délimité des abords.",
    address: { label: "Rue Cormont 80000 Amiens", street: "Rue Cormont", postcode: "80000", city: "Amiens", insee: "80021", lon: 2.301666, lat: 49.894273, score: 0.97, type: "street" },
    site: { lon: 2.301622, lat: 49.894189 },
    client: { civility: "M.", firstName: "Louis", lastName: "Fictif-Martin", email: "louis.fictif@example.org", phone: "06 00 00 00 02" },
    panelId: "gen-450-alu",
    panelCount: 8,
  },
  {
    key: "plu-restrictif",
    title: "Zone N du PLUi avec règle restrictive",
    description: "Ailly-sur-Somme (80), chemin du Marais : zone N(i), PPRI de la Somme.",
    address: { label: "Chemin du Marais 80470 Ailly-sur-Somme", street: "Chemin du Marais", postcode: "80470", city: "Ailly-sur-Somme", insee: "80011", lon: 2.199032, lat: 49.932125, score: 1, type: "street" },
    site: { lon: 2.198025, lat: 49.931534 },
    client: { civility: "Mme", firstName: "Inès", lastName: "Démo-Bernard", email: "ines.demo@example.org", phone: "06 00 00 00 03" },
    panelId: "gen-430-fb",
    panelCount: 6,
  },
  {
    key: "pac",
    works: "pac",
    photos: "sans-contrainte",
    title: "Pompe à chaleur en zone pavillonnaire",
    description: "Pont-de-Metz (80) : unité extérieure fixée en façade, côté le plus éloigné des voisins.",
    address: { label: "Allée des Tilleuls 80480 Pont-de-Metz", street: "Allée des Tilleuls", postcode: "80480", city: "Pont-de-Metz", insee: "80632", lon: 2.238677, lat: 49.880359, score: 0.65, type: "street" },
    site: { lon: 2.238535, lat: 49.880454 },
    client: { civility: "M.", firstName: "Jules", lastName: "Exemple-Petit", email: "jules.exemple@example.org", phone: "06 00 00 00 04" },
    panelId: "gen-430-fb",
    panelCount: 0,
    pac: { unitId: "gen-pac-ae-8", placement: "facade", facadeIndex: 0, positionRatio: 0.7, mountHeightM: 0.4, cover: false },
  },
  {
    key: "ite",
    works: "ite",
    photos: "abf",
    title: "Isolation par l'extérieur en périmètre ABF",
    description: "Amiens (80), rue Cormont : ITE enduit ton pierre dans les abords de la cathédrale (avis de l'ABF).",
    address: { label: "Rue Cormont 80000 Amiens", street: "Rue Cormont", postcode: "80000", city: "Amiens", insee: "80021", lon: 2.301666, lat: 49.894273, score: 0.97, type: "street" },
    site: { lon: 2.301622, lat: 49.894189 },
    client: { civility: "Mme", firstName: "Rose", lastName: "Fictif-Leroy", email: "rose.fictif@example.org", phone: "06 00 00 00 05" },
    panelId: "gen-430-fb",
    panelCount: 0,
    ite: { facadeIndexes: [0, 1, 2, 3], thicknessCm: 14, finish: "enduit", colorName: "Ton pierre", colorHex: "#d8cbb3", overhangPublic: true, overhangNeighbor: false, derogation: false },
  },
];
