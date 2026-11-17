// Remplissage du cerfa officiel (pdf-lib) à partir du mapping versionné src/data/cerfa/<cerfa>-<version>.mapping.json
import { PDFDocument, PDFCheckBox, PDFTextField } from "pdf-lib";
import mapping16702 from "@/data/cerfa/16702-03.mapping.json";
import mapping13406 from "@/data/cerfa/13406-17.mapping.json";
import { defaultExtension } from "@/data/works";
import { existingFootprintM2 } from "@/lib/works/geom";
import type { Client, PanelModel, Project, SignatureRecord } from "@/lib/types";
import { projectDescription } from "./texts";
import { fr } from "@/lib/instruction/deadlines";

export interface CerfaMapping {
  cerfa: string;
  version: string;
  pdf: string;
  source_url: string;
  valid_from: string;
  valid_to: string | null;
  fields: { field: string; type: "text" | "checkbox"; value: string; label: string; multiline?: boolean }[];
}
export const cerfaVersions: CerfaMapping[] = [mapping16702 as CerfaMapping];
export const currentCerfa = (date = new Date().toISOString().slice(0, 10)) =>
  cerfaVersions.find((c) => c.valid_from <= date && (!c.valid_to || date <= c.valid_to)) ?? cerfaVersions[0];

/** parcelles du cadastre, ou celle saisie par le déclarant si le cadastre n'a rien donné */
export function parcelsOf(p: Project): { prefixe: string; section: string; numero: string; contenanceM2: number }[] {
  const found = (p.enrichment?.parcels ?? []).filter((x) => x.section && x.numero);
  if (found.length) return found;
  const m = p.overrides?.["cadastre.manual"] as { section: string; numero: string; contenanceM2: number } | undefined;
  return m?.section && m.numero ? [{ prefixe: "000", ...m }] : [];
}

export function cerfaData(p: Project, client: Client | undefined, panel: PanelModel | undefined, pieces: string[]) {
  const e = p.enrichment;
  const h = e?.heritage;
  const ov = p.overrides ?? {};
  const prot = typeof ov["heritage.protected"] === "boolean" ? (ov["heritage.protected"] as boolean) : undefined;
  const [emailLocal, emailDomain] = (client?.email ?? "").split("@");
  const a = p.address;
  const lot = p.answers.inLotissement ?? "nsp";
  // déclarant personne morale (exploitation agricole en société) : rubrique 1.2, la rubrique 1.1 reste vide
  const co = p.agri?.company;
  return {
    company: co
      ? { name: co.name, siret: co.siret.replace(/\s/g, ""), legalForm: co.legalForm, repLastName: client?.lastName?.toUpperCase() ?? "", repFirstName: client?.firstName ?? "" }
      : { name: "", siret: "", legalForm: "", repLastName: "", repFirstName: "" },
    declarant: co
      ? { lastName: "", firstName: "", birthDate: "", birthPlace: "", phone: client?.phone ?? "", emailLocal: emailLocal ?? "", emailDomain: emailDomain ?? "", acceptsEmail: false }
      : {
      lastName: client?.lastName?.toUpperCase() ?? "",
      firstName: client?.firstName ?? "",
      birthDate: client?.birthDate ? fr(client.birthDate) : "",
      birthPlace: client?.birthPlace ?? "",
      phone: client?.phone ?? "",
      emailLocal: emailLocal ?? "",
      emailDomain: emailDomain ?? "",
      acceptsEmail: false,
      },
    // hypothèse V1 : le maître d'ouvrage réside sur le terrain (modifiable dans le PDF)
    declarantAddress: { housenumber: a?.housenumber ?? "", street: a?.street ?? a?.label ?? "", city: a?.city ?? "", postcode: a?.postcode ?? "" },
    terrain: { housenumber: a?.housenumber ?? "", street: a?.street ?? "", city: a?.city ?? "", postcode: a?.postcode ?? "" },
    parcels: parcelsOf(p).map((x) => ({ prefixe: x.prefixe, section: x.section, numero: x.numero, contenance: x.contenanceM2 ? String(x.contenanceM2) : "" })),
    parcelsTotal: String(parcelsOf(p).reduce((s, x) => s + x.contenanceM2, 0) || ""),
    lotissement: { oui: lot === "oui", non: lot === "non", nsp: lot === "nsp" },
    description: projectDescription(p, panel),
    protection: {
      spr: prot ?? Boolean(h?.inSPR),
      abordsMH: prot === false ? false : Boolean(h?.inAbordsMH),
      siteClasse: prot === false ? false : Boolean(h?.inSiteClasseOuInscrit),
    },
    engagement: { lieu: a?.city ?? "", date: fr(new Date().toISOString().slice(0, 10)) },
    pieces: Object.fromEntries(pieces.map((c) => [c, true])),
  };
}

/** permis de construire une maison individuelle et/ou ses annexes (cerfa 13406) */
export const cerfaPC = mapping13406 as CerfaMapping;

/** données du cerfa 13406 : identité et terrain identiques à la DP, plus surfaces, annexes et dispense d'architecte */
export function cerfaDataPC(p: Project, client: Client | undefined, pieces: string[]) {
  const base = cerfaData(p, client, undefined, []);
  const x = p.extension ?? defaultExtension();
  const emprise = Math.round(x.widthM * x.depthM * 10) / 10;
  const fmt = (v: number) => String(Math.round(v * 10) / 10).replace(".", ",");
  const total = x.floorAreaExistingM2 + x.floorAreaCreatedM2;
  const before = existingFootprintM2(p.enrichment);
  return {
    ...base,
    architectWaiver: !x.architect && total <= 150,
    annex: { garage: x.kind === "garage", veranda: x.kind === "veranda" },
    works: { extension: x.kind === "agrandissement" },
    levels: x.levels ? String(x.levels) : "",
    rooms: x.rooms ? String(x.rooms) : "",
    emprise: { before: before ? fmt(before) : "", created: fmt(emprise) },
    sdp: { existing: fmt(x.floorAreaExistingM2), created: fmt(x.floorAreaCreatedM2), total: fmt(total) },
    pieces: Object.fromEntries(pieces.map((c) => [c, true])),
  };
}

export function resolvePath(obj: unknown, path: string): unknown {
  if (path === "const.true") return true;
  return path.split(".").reduce<unknown>((acc, k) => (acc == null ? undefined : (acc as Record<string, unknown>)[k]), obj);
}

export interface FillReport {
  filled: string[];
  missingInPdf: string[];
  empty: string[];
  /** valeurs trop longues pour la case, tronquées : à corriger à la main */
  truncated: string[];
}

export async function fillCerfa(pdfBytes: ArrayBuffer | Uint8Array, data: object, mapping: CerfaMapping = currentCerfa(), signature?: SignatureRecord): Promise<{ bytes: Uint8Array; report: FillReport }> {
  const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const form = doc.getForm();
  const report: FillReport = { filled: [], missingInPdf: [], empty: [], truncated: [] };
  for (const m of mapping.fields) {
    const v = resolvePath(data, m.value);
    let field;
    try {
      field = form.getField(m.field);
    } catch {
      report.missingInPdf.push(m.field);
      continue;
    }
    if (m.type === "text" && field instanceof PDFTextField) {
      const s = v == null ? "" : String(v);
      if (!s) {
        // rubriques exclusives : particulier (1.1) ou personne morale (1.2) ; l'autre reste vide normalement
        const isCompany = Boolean((data as { company?: { name?: string } }).company?.name);
        const exclusive = isCompany ? m.value.startsWith("declarant.") && !/phone|email/i.test(m.value) : m.value.startsWith("company.");
        if (!exclusive && !m.value.startsWith("parcels.1.")) report.empty.push(m.field);
        continue;
      }
      if (m.multiline) {
        field.enableMultiline();
        // le champ n'a pas d'apparence par défaut (/DA) : on en définit une (Helvetica 9 pt)
        field.acroField.setDefaultAppearance("/Helv 9 Tf 0 g");
      }
      const max = field.getMaxLength();
      // cases « une par caractère » (dates jjmmaaaa, téléphone, codes) : on retire séparateurs et espaces avant de vérifier la longueur
      const t = max && s.length > max ? s.replace(/[\s/.\-]/g, "") : s;
      if (max && t.length > max) report.truncated.push(m.field);
      field.setText(max ? t.slice(0, max) : t);
      report.filled.push(m.field);
    } else if (m.type === "checkbox" && field instanceof PDFCheckBox) {
      if (v === true) {
        field.check();
        report.filled.push(m.field);
      } else field.uncheck();
    }
  }
  if (signature?.imageDataUrl?.startsWith("data:image/png")) {
    try {
      const sigField = form.getTextField("E1S_signature");
      const widget = sigField.acroField.getWidgets()[0];
      const r = widget.getRectangle();
      const pageRef = widget.P();
      const pageIndex = doc.getPages().findIndex((pg) => pg.ref === pageRef);
      const pg = doc.getPages()[pageIndex >= 0 ? pageIndex : 10];
      const png = await doc.embedPng(signature.imageDataUrl);
      const dims = png.scaleToFit(r.width - 4, r.height - 10);
      pg.drawImage(png, { x: r.x + 2, y: r.y + 8, width: dims.width, height: dims.height });
      pg.drawText(`Signé électroniquement le ${fr(signature.signedAt.slice(0, 10))} : SHA-256 ${signature.documentSha256.slice(0, 16)}…`, { x: r.x + 2, y: r.y + 2, size: 5 });
    } catch {
      /* signature manuscrite à apposer */
    }
  }
  form.updateFieldAppearances();
  doc.setTitle(`Cerfa ${mapping.cerfa}*${mapping.version} : ${mapping.cerfa === "13406" ? "demande de permis de construire" : "déclaration préalable"}`);
  doc.setProducer("Permizy");
  return { bytes: await doc.save(), report };
}

/** informations à demander au déclarant avant le téléchargement pour que le cerfa ne parte pas incomplet.
 *  required : rubrique « identité du déclarant » et « terrain » du cerfa (notice 51434) ; recommended : utile à la mairie. */
export interface CerfaGap {
  id: "lastName" | "firstName" | "birthDate" | "birthPlace" | "phone" | "email" | "parcel" | "companyName" | "companySiret" | "companyForm";
  label: string;
  required: boolean;
}
export function cerfaGaps(p: Project, client: Client | undefined): CerfaGap[] {
  const g: CerfaGap[] = [];
  if (!client?.lastName?.trim()) g.push({ id: "lastName", label: "Nom du déclarant", required: true });
  if (!client?.firstName?.trim()) g.push({ id: "firstName", label: "Prénom du déclarant", required: true });
  const co = p.agri?.company;
  if (co) {
    // personne morale : dénomination, SIRET, forme ; le nom/prénom du client est celui du représentant
    if (!co.name.trim()) g.push({ id: "companyName", label: "Dénomination de la société", required: true });
    if (!/^\d{14}$/.test(co.siret.replace(/\s/g, ""))) g.push({ id: "companySiret", label: "N° SIRET (14 chiffres)", required: true });
    if (!co.legalForm.trim()) g.push({ id: "companyForm", label: "Type de société (EARL, GAEC, SCEA…)", required: true });
  } else {
    if (!client?.birthDate) g.push({ id: "birthDate", label: "Date de naissance", required: true });
    if (!client?.birthPlace?.trim()) g.push({ id: "birthPlace", label: "Commune de naissance", required: true });
  }
  if (!parcelsOf(p).length) g.push({ id: "parcel", label: "Référence cadastrale du terrain (section et numéro)", required: true });
  if (!client?.phone?.trim()) g.push({ id: "phone", label: "Téléphone (la mairie peut vous appeler)", required: false });
  if (!client?.email?.trim()) g.push({ id: "email", label: "Email", required: false });
  return g;
}
