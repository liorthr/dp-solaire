"use client";
// Pack « Raccordement & Consuel » : schéma unifilaire, SC 144 pré-rempli, note de calcul, récapitulatif Enedis,
// mandat, plan de situation (DP1), en PDF séparés + ZIP.
import JSZip from "jszip";
import type { Client, InverterModel, PanelModel, Project, Tenant } from "@/lib/types";
import { svgToPdfBytes, textPdf } from "@/lib/dossier/build";
import { DISCLAIMER, parcelRefs } from "@/lib/dossier/texts";
import { dp1, type PlanContext } from "@/lib/plans/dp";
import { buildBasemap } from "@/lib/plans/basemap";
import { DRAW } from "@/lib/plans/svg";
import { asset } from "@/lib/image/browser";
import { fr } from "@/lib/instruction/deadlines";
import { defaultElec, elecCalc, withInverterDefaults, withPanelDefaults } from "./calc";
import { singleLineSvg } from "./schema";
import { consuelFormSpec, consuelValues, stampConsuel } from "./consuel";
import { calcNote, enedisRecap, mandateRaccordementText } from "./texts";

export interface RacFile {
  name: string;
  label: string;
  bytes: Uint8Array;
}

export async function buildRaccordementPack(input: { project: Project; client?: Client; tenant: Tenant; panel?: PanelModel; inverter?: InverterModel; onProgress?: (l: string) => void; noBasemap?: boolean }) {
  const { project: p, client, tenant } = input;
  const prog = input.onProgress ?? (() => {});
  const panel = withPanelDefaults(input.panel);
  const inv = withInverterDefaults(input.inverter);
  const e = p.elec ?? defaultElec(p);
  const r = elecCalc(p, e, panel, inv);
  const files: RacFile[] = [];
  const warnings: string[] = [];
  const cart = { reference: p.reference, address: p.address?.label ?? "", parcels: parcelRefs(p.enrichment), date: fr(new Date().toISOString().slice(0, 10)), company: tenant.name, client: client ? `${client.firstName} ${client.lastName}` : "" };

  prog("Schéma unifilaire");
  files.push({ name: "01_Schema_unifilaire.pdf", label: "Schéma unifilaire", bytes: await svgToPdfBytes([singleLineSvg(p, e, r, panel, inv, cart)]) });

  prog(`Dossier technique Consuel ${r.consuelForm}`);
  try {
    const blank = await (await fetch(asset(r.consuelFormPdf))).arrayBuffer();
    if (consuelFormSpec(r.consuelForm)) {
      files.push({ name: `02_Consuel_${r.consuelForm.replace(/\s/g, "_")}_pre-rempli.pdf`, label: `Dossier technique ${r.consuelForm} pré-rempli`, bytes: await stampConsuel(blank, r.consuelForm, consuelValues(p, e, r, client, tenant, inv)) });
    } else {
      files.push({ name: `02_Consuel_${r.consuelForm.replace(/\s/g, "_")}_vierge.pdf`, label: `Dossier technique ${r.consuelForm} (vierge, à remplir avec la note de calcul)`, bytes: new Uint8Array(blank) });
      warnings.push(`${r.consuelForm} : pré-remplissage automatique non disponible, formulaire vierge fourni avec la note de calcul.`);
    }
    if (r.extraForms.includes("SC 144E")) files.push({ name: "02b_Consuel_SC_144E_vierge.pdf", label: "Dossier technique SC 144E (cas 4)", bytes: new Uint8Array(await (await fetch(asset("/consuel/SC-144E_1.pdf"))).arrayBuffer()) });
  } catch (err) {
    warnings.push(`Formulaire Consuel non chargé : ${err instanceof Error ? err.message : err}`);
  }

  prog("Note de calcul");
  files.push({ name: "03_Note_de_calcul.pdf", label: "Note de calcul électrique", bytes: textPdf(`Note de calcul : ${p.reference}`, calcNote(p, e, r, panel), DISCLAIMER) });

  prog("Récapitulatif Enedis Connect");
  files.push({ name: "04_Recapitulatif_demande_Enedis.pdf", label: "Récapitulatif pour la demande Enedis", bytes: textPdf(`Demande de raccordement : ${p.reference}`, enedisRecap(p, client, tenant, e, r, panel, inv), DISCLAIMER) });

  prog("Mandat");
  const mText = mandateRaccordementText(p, client, tenant, e);
  files.push({
    name: "05_Mandat_raccordement_Consuel.pdf",
    label: "Mandat raccordement / Consuel / contrat d'achat",
    bytes: textPdf("Mandat", [{ lines: mText.split("\n").slice(1) }], DISCLAIMER, (doc, y) => {
      if (e.mandate) {
        try {
          doc.addImage(e.mandate.imageDataUrl, "PNG", 15, y + 2, 60, 18);
        } catch {
          /* image invalide */
        }
        doc.setFontSize(8);
        doc.text([`Signé électroniquement par ${e.mandate.signerName} le ${new Date(e.mandate.signedAt).toLocaleString("fr-FR")}`, `Empreinte SHA-256 : ${e.mandate.documentSha256}`], 15, y + 26);
        return y + 36;
      }
      doc.setFontSize(10);
      doc.text("Signature du titulaire du PDL : ______________________   Date : ____/____/______", 15, y + 10);
      return y + 20;
    }),
  });

  prog("Plan de situation");
  if (p.address) {
    const site = (p.overrides?.site as { lon: number; lat: number }) ?? { lon: p.address.lon, lat: p.address.lat };
    const ctx: PlanContext = { project: p, panel, site, cartouche: cart };
    const main = input.noBasemap ? null : await buildBasemap(site.lon, site.lat, 2000, DRAW.w, DRAW.h, "plan");
    files.push({ name: "06_Plan_de_situation.pdf", label: "Plan de situation", bytes: await svgToPdfBytes([dp1(ctx, main, null, 2000, 25000)]) });
  }

  prog("Archive ZIP");
  const zip = new JSZip();
  const folder = zip.folder(`${p.reference}_Raccordement_Consuel`)!;
  for (const f of files) folder.file(f.name, f.bytes);
  folder.file("LISEZMOI.txt", [`Pack raccordement / Consuel : ${p.reference}`, "", ...files.map((f) => `- ${f.name} : ${f.label}`), "", "Consuel : https://www.consuel.com/dossiers-techniques/", "Enedis : demande en ligne (Enedis Connect), procédure Enedis-PRO-RAC_20E", "", ...warnings.map((w) => `ATTENTION : ${w}`), "", DISCLAIMER].join("\n"));
  return { files, zip: await zip.generateAsync({ type: "blob", compression: "DEFLATE" }), calc: r, warnings };
}
