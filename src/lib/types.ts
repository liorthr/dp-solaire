// Types métier partagés (miroir du schéma SQL supabase/migrations/0001_init.sql)
import type { Feature, MultiPolygon, Polygon, Point } from "geojson";

export type ID = string;

export interface Tenant {
  id: ID;
  name: string;
  siret?: string;
  address?: string;
  email?: string;
  phone?: string;
  logoDataUrl?: string;
  legalMentions?: string;
  retentionMonths: number;
  plan: "decouverte" | "pro" | "entreprise";
}

export type Role = "admin" | "user";
export interface User {
  id: ID;
  email: string;
  fullName: string;
  isSuperAdmin?: boolean;
}
export interface Membership {
  tenantId: ID;
  userId: ID;
  role: Role;
}

export interface Client {
  id: ID;
  tenantId: ID;
  civility?: "M." | "Mme";
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  birthPlace?: string;
  createdAt: string;
}

export type ProjectStatus =
  | "brouillon"
  | "pret"
  | "depose"
  | "recepisse"
  | "instruction"
  | "pieces_demandees"
  | "accord"
  | "refus"
  | "retire";

export type FilingMode = "teleservice" | "email" | "lrar" | "main_propre";

export type MountingType = "surimposition" | "integration" | "ombriere" | "sol";

export interface PanelModel {
  id: ID;
  brand: string;
  model: string;
  powerWc: number;
  widthMm: number;
  heightMm: number;
  thicknessMm: number;
  frameColor: "noir" | "argent";
  cellColor: "noir" | "bleu";
  fullBlack: boolean;
}
export interface InverterModel {
  id: ID;
  brand: string;
  model: string;
  kind: "micro" | "central" | "optimiseur";
  powerVa: number;
}

export interface RoofPlane {
  id: ID;
  label: string;
  /** azimut de la ligne de plus grande pente, degrés, 0 = Nord, 180 = Sud */
  azimuthDeg: number;
  tiltDeg: number;
  /** longueur à l'égout (m) */
  widthM: number;
  /** longueur de rampant (m) */
  slopeLengthM: number;
  /** polygone 2D (WGS84) projeté au sol */
  polygon?: Polygon;
  covering: "tuile_terre_cuite" | "ardoise" | "tuile_beton" | "bac_acier" | "autre";
}

export interface PanelPlacement {
  /** position (m) dans le repère du pan : x le long de l'égout, y le long du rampant depuis l'égout */
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PvLayout {
  roofPlaneId: ID;
  orientation: "portrait" | "paysage";
  marginEdgeM: number;
  marginRidgeM: number;
  marginGutterM: number;
  gapM: number;
  panels: PanelPlacement[];
}

export interface PvProject {
  powerKwc: number;
  panelCount: number;
  panelId: ID;
  inverterId?: ID;
  mounting: MountingType;
  roofPlanes: RoofPlane[];
  layouts: PvLayout[];
  /** occupation : autoconsommation, revente totale… */
  usage: "autoconsommation" | "autoconsommation_surplus" | "revente_totale";
  /** hauteur max au-dessus du sol (sol/ombrière) */
  groundHeightM?: number;
}

export interface Photo {
  id: ID;
  kind: "facade" | "proche" | "lointain";
  /** clé IndexedDB du blob */
  blobKey: string;
  width: number;
  height: number;
  quality?: PhotoQuality;
  /** point de prise de vue et direction (pour DP1/DP2) */
  shotPoint?: [number, number];
  shotBearingDeg?: number;
  caption?: string;
}

export interface PhotoQuality {
  ok: boolean;
  brightness: number;
  sharpness: number;
  megapixels: number;
  issues: { code: string; message: string }[];
}

export interface Insertion {
  photoId: ID;
  /** 4 coins (pixels image) du champ de panneaux : haut-gauche, haut-droit, bas-droit, bas-gauche */
  quad: [number, number][];
  rows: number;
  cols: number;
  aiSuggested?: boolean;
}

export interface SignatureRecord {
  provider: "simple" | "yousign" | "docusign";
  signerName: string;
  signedAt: string;
  imageDataUrl: string;
  documentSha256: string;
  userAgent?: string;
}

export interface InstructionEvent {
  id: ID;
  type:
    | "depot"
    | "recepisse"
    | "notification_majoration"
    | "demande_pieces"
    | "pieces_fournies"
    | "decision_accord"
    | "decision_refus"
    | "retrait"
    | "certificat_tacite"
    | "daact";
  date: string; // YYYY-MM-DD
  note?: string;
  payload?: Record<string, unknown>;
}

export interface Project {
  id: ID;
  tenantId: ID;
  reference: string;
  clientId?: ID;
  status: ProjectStatus;
  filingMode?: FilingMode;
  address?: AddressResult;
  pv: PvProject;
  photos: Photo[];
  insertions: Insertion[];
  enrichment?: EnrichmentResult;
  overrides: Record<string, unknown>;
  mandate?: SignatureRecord;
  declarationSignature?: SignatureRecord;
  events: InstructionEvent[];
  answers: ProjectAnswers;
  generatedAt?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: ID;
  demo?: boolean;
}

/** réponses complémentaires de l'installateur (questions simples, défaut = « je ne sais pas ») */
export interface ProjectAnswers {
  visibleFromPublicSpace?: boolean;
  inLotissement?: "oui" | "non" | "nsp";
  copropriete?: boolean;
  buildingIsListedMH?: boolean;
  modifiesVolume?: boolean;
}

// ----------------------------------------------------------------- enrichissement
export type ProviderStatus = "ok" | "degraded" | "error" | "skipped";

export interface SourceMeta {
  provider: string;
  url?: string;
  fetchedAt: string;
  status: ProviderStatus;
  message?: string;
  fromCache?: boolean;
  fromFixture?: boolean;
}

export interface AddressResult {
  label: string;
  housenumber?: string;
  street?: string;
  postcode: string;
  city: string;
  insee: string;
  lon: number;
  lat: number;
  score: number;
  type: string;
}

export interface ParcelInfo {
  idu: string;
  prefixe: string;
  section: string;
  numero: string;
  contenanceM2: number;
  geometry: MultiPolygon | Polygon;
}

export interface BuildingInfo {
  id: string;
  heightM?: number;
  altitudeSol?: number;
  altitudeToitMin?: number;
  altitudeToitMax?: number;
  usage?: string;
  geometry: MultiPolygon | Polygon;
  areaM2: number;
}

export interface UrbanZone {
  libelle: string;
  libelong?: string;
  typezone: string;
  docName: string;
  docType: string;
  reglementUrl?: string;
  dateValid?: string;
}

export interface Servitude {
  suptype: string; // ac1, ac2, ac4, pm1…
  name: string;
  typeass?: string;
  modegeoass?: string;
  bufferM?: number | null;
  actUrl?: string;
}

export interface HeritageAnalysis {
  inAbordsMH: boolean;
  inSPR: boolean;
  inSiteClasseOuInscrit: boolean;
  monuments: { name: string; distanceM: number }[];
  nearestMonumentM?: number;
  abfConsultation: "oui" | "probable" | "non";
  confidence: "haute" | "moyenne" | "faible";
  explanation: string[];
  divergences: string[];
}

export interface RiskInfo {
  label: string;
  code: string;
}

export interface MairieInfo {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  hours?: string;
  teleserviceUrl?: string;
  sourceUrl?: string;
}

export interface SolarEstimate {
  kwhPerKwcYear: number;
  annualKwh: number;
  method: "pvgis" | "approx_latitude";
}

export interface EnrichmentResult {
  address?: AddressResult;
  parcels: ParcelInfo[];
  buildings: BuildingInfo[];
  mainBuildingId?: string;
  zones: UrbanZone[];
  servitudes: Servitude[];
  prescriptions: string[];
  heritage?: HeritageAnalysis;
  risks: RiskInfo[];
  mairie?: MairieInfo;
  solar?: SolarEstimate;
  rnu?: boolean;
  sources: Record<string, SourceMeta>;
  completedAt?: string;
}

export type GeoFeature = Feature<Polygon | MultiPolygon | Point>;
