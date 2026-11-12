// Pré-remplissage des dossiers techniques Consuel SC 144 (PDF officiels non remplissables : valeurs apposées
// aux coordonnées versionnées dans src/data/consuel/sc144.mapping.json).
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import mapping from "@/data/consuel/sc144.mapping.json";
import type { Client, ElecInfo, InverterModel, Project, Tenant } from "@/lib/types";
import type { ElecResult } from "./calc";
import { fr } from "@/lib/instruction/deadlines";

type FormKey = keyof typeof mapping.forms;
export const stampableForms = Object.keys(mapping.forms) as FormKey[];
export const consuelFormSpec = (f: string) => (mapping.forms as Record<string, (typeof mapping.forms)[FormKey]>)[f];

export function consuelValues(p: Project, e: ElecInfo, r: ElecResult, client: Client | undefined, tenant: Tenant, inv: InverterModel | undefined) {
  const depot = p.events.find((x) => x.type === "depot");
  const text: Record<string, string> = {
    installerName: e.installerName ?? "",
    company: `${tenant.name}${tenant.siret ? ` : SIRET ${tenant.siret}` : ""}`,
    clientName: client ? `${client.civility ?? ""} ${client.firstName} ${client.lastName}`.trim() : "",
    clientEmail: client?.email ?? "",
    siteAddress: p.address?.street ? `${p.address.housenumber ? p.address.housenumber + " " : ""}${p.address.street}` : p.address?.label ?? "",
    postcode: p.address?.postcode ?? "",
    city: p.address?.city ?? "",
    phone: client?.phone ?? "",
    dateRef: depot ? fr(depot.date) : "",
    iscMax: r.iscMaxA !== undefined ? String(r.iscMaxA).replace(".", ",") : "",
    uocMax: r.uocMaxV !== undefined ? String(r.uocMaxV).replace(".", ",") : "",
    dcSection: String(e.dcCableSectionMm2).replace(".", ","),
    dcVoltage: r.isMicro ? "1000" : "1500",
    microCount: r.isMicro ? String(r.microCount) : "",
    generatorCount: r.isMicro ? "" : String(e.strings ?? 1),
    dcSwitchUn: e.dcSwitchUn ? String(e.dcSwitchUn) : "",
    dcSwitchIn: e.dcSwitchIn ? String(e.dcSwitchIn) : "",
    inverterModel: inv ? `${inv.brand} ${inv.model}` : "",
  };
  const check: Record<string, boolean> = {
    autoconsommation: e.injection !== "totale",
    dedicatedPdl: e.injection === "totale",
    roof: p.pv.mounting === "surimposition" || p.pv.mounting === "integration",
    batteryNo: !e.battery,
    batteryYes: e.battery,
    autonomousNo: true,
    otherAcNo: true,
    otherDcNo: true,
    refDp: Boolean(depot),
    modifiedNo: true,
    temp90: true,
    polarityNo: true,
    mono: e.phase === "mono",
    tri: e.phase === "tri",
    decouplingIntegrated: inv?.integratedDecoupling !== false,
    decouplingExternal: inv?.integratedDecoupling === false,
    limited: r.acPowerKva <= 36,
    boardMain: e.board === "principal",
    boardSub: e.board === "divisionnaire",
    case1: e.connectionCase === 1,
    case2: e.connectionCase === 2,
    case3: e.connectionCase === 3,
    case4: e.connectionCase === 4,
  };
  return { text, check };
}

export async function stampConsuel(pdfBytes: ArrayBuffer | Uint8Array, form: string, values: ReturnType<typeof consuelValues>) {
  const spec = consuelFormSpec(form);
  if (!spec) throw new Error(`Formulaire ${form} : pré-remplissage non disponible (fiche récapitulative fournie)`);
  const doc = await PDFDocument.load(pdfBytes);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const pages = doc.getPages();
  const blue = rgb(0.05, 0.2, 0.6);
  for (const t of spec.text) {
    const v = values.text[t.key];
    if (!v) continue;
    const pg = pages[t.page];
    const H = pg.getHeight();
    let s = v;
    while (s.length > 4 && font.widthOfTextAtSize(s, 8) > pg.getWidth() - t.x - 30) s = s.slice(0, -1);
    pg.drawText(s, { x: t.x + 3, y: H - t.y - 7.5, size: 8, font, color: blue });
  }
  for (const c of spec.check) {
    if (!values.check[c.key]) continue;
    const pg = pages[c.page];
    pg.drawText("X", { x: c.x + 1.4, y: pg.getHeight() - c.y - 7.6, size: 8.5, font: bold, color: blue });
  }
  pages[0].drawText("Pré-rempli par DP Solaire : à vérifier, compléter et signer par l'installateur", { x: 36, y: 12, size: 6.5, font, color: rgb(0.6, 0.1, 0.1) });
  return doc.save();
}
