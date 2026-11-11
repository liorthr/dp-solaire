// Registre des providers : utilisé par la page de santé et le back-office.
import { banSearchUrl } from "./ban";
import { bdtopoUrl } from "./bdtopo";
import { annuaireUrl } from "./annuaire";
import { pvgisUrl } from "./pvgis";

export interface ProviderDescriptor {
  id: string;
  name: string;
  license: string;
  docs: string;
  cors: boolean;
  /** URL de test (adresse publique : Hôtel de ville d'Amiens) */
  healthUrl: string;
  role: string;
}

const AMIENS = { lon: 2.2957, lat: 49.8941 };
const pt = encodeURIComponent(JSON.stringify({ type: "Point", coordinates: [AMIENS.lon, AMIENS.lat] }));

export const providers: ProviderDescriptor[] = [
  { id: "ban", name: "Base Adresse Nationale", license: "Licence Ouverte 2.0", docs: "https://adresse.data.gouv.fr/api-doc/adresse", cors: true, healthUrl: banSearchUrl("hotel de ville amiens", 1), role: "Géocodage, code INSEE" },
  { id: "cadastre", name: "API Carto IGN : cadastre", license: "Licence Ouverte", docs: "https://apicarto.ign.fr/api/doc/cadastre", cors: true, healthUrl: `https://apicarto.ign.fr/api/cadastre/parcelle?geom=${pt}`, role: "Parcelles, section, numéro, surface" },
  { id: "gpu", name: "API Carto IGN : Géoportail de l'Urbanisme", license: "Licence Ouverte", docs: "https://apicarto.ign.fr/api/doc/gpu", cors: true, healthUrl: `https://apicarto.ign.fr/api/gpu/zone-urba?geom=${pt}`, role: "Zonage PLU, SUP (AC1, AC2, AC4, PM1…), prescriptions" },
  { id: "bdtopo", name: "IGN BD TOPO (WFS Géoplateforme)", license: "Licence Ouverte", docs: "https://geoservices.ign.fr/bdtopo", cors: true, healthUrl: bdtopoUrl(AMIENS.lon, AMIENS.lat, 20), role: "Emprise et hauteur du bâti" },
  { id: "georisques", name: "Géorisques", license: "Licence Ouverte", docs: "https://www.georisques.gouv.fr/doc-api", cors: true, healthUrl: "https://georisques.gouv.fr/api/v1/gaspar/risques?code_insee=80021", role: "Risques naturels et technologiques (informatif)" },
  { id: "annuaire", name: "Annuaire de l'administration (DILA)", license: "Licence Ouverte", docs: "https://api-lannuaire.service-public.fr/", cors: false, healthUrl: annuaireUrl("80021"), role: "Mairie : email, adresse, horaires" },
  { id: "pvgis", name: "PVGIS (JRC, Commission européenne)", license: "Libre, citer la source", docs: "https://joint-research-centre.ec.europa.eu/photovoltaic-geographical-information-system-pvgis_en", cors: false, healthUrl: pvgisUrl(AMIENS.lat, AMIENS.lon, 35, 180), role: "Productible annuel" },
  { id: "wmts", name: "Géoplateforme WMTS (fonds IGN)", license: "Licence Ouverte, © IGN", docs: "https://geoservices.ign.fr/services-web", cors: true, healthUrl: "https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetCapabilities", role: "Fonds de plan, orthophoto, parcellaire" },
];
