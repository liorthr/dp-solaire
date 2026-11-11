// Remplissage du cerfa officiel (pdf-lib) à partir du mapping versionné src/data/cerfa/<cerfa>-<version>.mapping.json
import { PDFDocument, PDFCheckBox, PDFTextField } from "pdf-lib";
import mapping16702 from "@/data/cerfa/16702-03.mapping.json";
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

export function cerfaData(p: Project, client: Client | undefined, panel: PanelModel | undefined, pieces: string[]) {
  const e = p.enrichment;
  const h = e?.heritage;
  const ov = p.overrides ?? {};
  const prot = typeof ov["heritage.protected"] === "boolean" ? (ov["heritage.protected"] as boolean) : undefined;
  const [emailLocal, emailDomain] = (client?.email ?? "").split("@");
  const a = p.address;
  const lot = p.answers.inLotissement ?? "nsp";
  return {
    declarant: {
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
    parcels: (e?.parcels ?? []).map((x) => ({ prefixe: x.prefixe, section: x.section, numero: x.numero, contenance: String(x.contenanceM2) })),
    parcelsTotal: String((e?.parcels ?? []).reduce((s, x) => s + x.contenanceM2, 0) || ""),
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

export function resolvePath(obj: unknown, path: string): unknown {
  if (path === "const.true") return true;
  return path.split(".").reduce<unknown>((acc, k) => (acc == null ? undefined : (acc as Record<string, unknown>)[k]), obj);
}

export interface FillReport {
  filled: string[];
  missingInPdf: string[];
  empty: string[];
}

export async function fillCerfa(pdfBytes: ArrayBuffer | Uint8Array, data: ReturnType<typeof cerfaData>, mapping: CerfaMapping = currentCerfa(), signature?: SignatureRecord): Promise<{ bytes: Uint8Array; report: FillReport }> {
  const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const form = doc.getForm();
  const report: FillReport = { filled: [], missingInPdf: [], empty: [] };
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
        report.empty.push(m.field);
        continue;
      }
      if (m.multiline) {
        field.enableMultiline();
        // le champ n'a pas d'apparence par défaut (/DA) : on en définit une (Helvetica 9 pt)
        field.acroField.setDefaultAppearance("/Helv 9 Tf 0 g");
      }
      const max = field.getMaxLength();
      field.setText(max ? s.slice(0, max) : s);
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
  doc.setTitle(`Cerfa ${mapping.cerfa}*${mapping.version} : déclaration préalable`);
  doc.setProducer("DP Solaire");
  return { bytes: await doc.save(), report };
}
