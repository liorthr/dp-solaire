"use client";
// Assemblage du dossier complet côté navigateur : plans SVG → PDF vectoriel (jsPDF + svg2pdf),
// cerfa officiel rempli (pdf-lib), pièces texte, PDF unique + ZIP aux noms normalisés.
import { jsPDF } from "jspdf";
import "svg2pdf.js";
import { PDFDocument } from "pdf-lib";
import JSZip from "jszip";
import type { Client, InverterModel, PanelModel, Project, Tenant } from "@/lib/types";
import { buildFacts } from "@/lib/rules/facts";
import { evaluateProject, paperCopies, requiredPieces, ruleset } from "@/lib/rules/engine";
import { dp1, dp2, dp3, dp4, shotPoints, type PlanContext } from "@/lib/plans/dp";
import { buildBasemap } from "@/lib/plans/basemap";
import { DRAW, page, svgDoc, text, wrapText, n } from "@/lib/plans/svg";
import { renderPanels, type Pt } from "@/lib/image/homography";
import { asset, blobToImage, imageToJpegDataUrl } from "@/lib/image/browser";
import { photoStore } from "@/lib/store/db";
import { cerfaData, currentCerfa, fillCerfa } from "./cerfa";
import { DISCLAIMER, coverLetterEmail, lrarLetter, mandateText, noticeDescriptive, parcelRefs, TEMPLATES_VERSION } from "./texts";
import { fr } from "@/lib/instruction/deadlines";

export interface BuildInput {
  project: Project;
  client?: Client;
  tenant: Tenant;
  panel?: PanelModel;
  inverter?: InverterModel;
  onProgress?: (label: string, pct: number) => void;
  /** désactive les fonds IGN (tests hors ligne) */
  noBasemap?: boolean;
}

export interface BuiltFile {
  name: string;
  code: string;
  label: string;
  bytes: Uint8Array;
}

export interface BuildResult {
  pdf: Blob;
  zip: Blob;
  files: BuiltFile[];
  pieces: string[];
  warnings: string[];
  durationMs: number;
}

const site = (p: Project) => (p.overrides?.site as { lon: number; lat: number }) ?? { lon: p.address!.lon, lat: p.address!.lat };

export async function renderInsertion(project: Project, photoId: string, panel?: PanelModel): Promise<{ before: HTMLCanvasElement; after: HTMLCanvasElement } | null> {
  const ph = project.photos.find((x) => x.id === photoId);
  const ins = project.insertions.find((i) => i.photoId === photoId);
  if (!ph) return null;
  const blob = await photoStore.get(ph.blobKey);
  if (!blob) return null;
  const img = await blobToImage(blob);
  const mk = () => {
    const c = document.createElement("canvas");
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    c.getContext("2d", { willReadFrequently: true })!.drawImage(img, 0, 0);
    return c;
  };
  const before = mk();
  const after = mk();
  if (ins && ins.quad.length === 4) renderPanels(after.getContext("2d", { willReadFrequently: true })!, ins.quad as Pt[], ins.rows, ins.cols, { frame: panel?.frameColor ?? "noir", cell: panel?.cellColor ?? "noir" });
  return { before, after };
}

export async function svgToPdfBytes(svgs: string[]): Promise<Uint8Array> {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4", compress: true });
  for (const [i, s] of svgs.entries()) {
    if (i > 0) doc.addPage("a4", "landscape");
    const el = new DOMParser().parseFromString(s, "image/svg+xml").documentElement as unknown as SVGElement;
    // svg2pdf a besoin que l'élément soit dans le DOM pour calculer certains styles
    const host = document.createElement("div");
    host.style.cssText = "position:fixed;left:-10000px;top:0;width:297mm;height:210mm";
    host.appendChild(el);
    document.body.appendChild(host);
    try {
      await doc.svg(el, { x: 0, y: 0, width: 297, height: 210 });
    } finally {
      host.remove();
    }
  }
  return new Uint8Array(doc.output("arraybuffer"));
}

export function textPdf(title: string, blocks: { heading?: string; lines: string[] }[], footer: string, extras?: (doc: jsPDF, y: number) => number): Uint8Array {
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  let y = 22;
  const W = 180;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(title, 15, y);
  y += 10;
  const ensure = (h: number) => {
    if (y + h > 280) {
      doc.addPage();
      y = 20;
    }
  };
  for (const b of blocks) {
    if (b.heading) {
      ensure(10);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(b.heading, 15, y);
      y += 6;
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    for (const line of b.lines) {
      const wrapped = doc.splitTextToSize(line || " ", W) as string[];
      ensure(wrapped.length * 5);
      doc.text(wrapped, 15, y);
      y += wrapped.length * 5 + (line ? 1 : 0);
    }
    y += 3;
  }
  if (extras) y = extras(doc, y);
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(110);
    doc.text(doc.splitTextToSize(footer, 180) as string[], 15, 287);
    doc.text(`${i}/${pages}`, 195, 292, { align: "right" });
    doc.setTextColor(0);
  }
  return new Uint8Array(doc.output("arraybuffer"));
}

function photoPage(cart: PlanContext["cartouche"], code: string, title: string, images: { dataUrl: string; w: number; h: number; caption: string }[], notes: string[], legendShot = false) {
  const cols = images.length;
  const gap = 4;
  const cellW = (DRAW.w - gap * (cols - 1)) / cols;
  let svg = "";
  images.forEach((im, i) => {
    const ratio = im.h / im.w;
    let w = cellW, h = cellW * ratio;
    if (h > DRAW.h - 14) {
      h = DRAW.h - 14;
      w = h / ratio;
    }
    const x = DRAW.x + i * (cellW + gap) + (cellW - w) / 2;
    const y = DRAW.y + 4;
    svg += `<image x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" href="${im.dataUrl}" xlink:href="${im.dataUrl}" preserveAspectRatio="none"/>`;
    svg += `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" fill="none" stroke="#111" stroke-width="0.3"/>`;
    svg += text(x + w / 2, y + h + 5, im.caption, 3, { anchor: "middle", weight: "bold" });
  });
  return page(svg, { ...cart, code, title, notes, legend: legendShot ? [{ kind: "arrow", color: "#7c3aed", label: "Point de vue repéré sur DP1 et DP2" }] : undefined });
}

export async function buildDossier(input: BuildInput): Promise<BuildResult> {
  const t0 = performance.now();
  const { project: p, client, tenant, panel, inverter } = input;
  const prog = input.onProgress ?? (() => {});
  const warnings: string[] = [];
  if (!p.address) throw new Error("Adresse manquante");
  const s = site(p);
  const facts = buildFacts({ project: p, client, panel });
  const ev = evaluateProject(facts);
  if (ev.regime.outcome !== "DP") throw new Error(`Aucun dossier DP généré : ${ev.regime.message}`);
  const req = requiredPieces(facts).filter((x) => x.isRequired || x.code === "DP3");
  const cart: PlanContext["cartouche"] = {
    reference: p.reference,
    address: p.address.label,
    parcels: parcelRefs(p.enrichment),
    date: fr(new Date().toISOString().slice(0, 10)),
    company: tenant.name,
    client: client ? `${client.firstName} ${client.lastName}` : "",
  };
  const ctx: PlanContext = { project: p, panel, cartouche: cart, site: s };
  const files: BuiltFile[] = [];
  const add = (code: string, label: string, name: string, bytes: Uint8Array) => files.push({ code, label, name, bytes });

  // ---------------------------------------------------------------- plans
  prog("Plan de situation (fonds IGN)", 8);
  const zoneRural = ["A", "N"].includes(p.enrichment?.zones[0]?.typezone ?? "");
  const scaleMain = zoneRural ? 5000 : 2000;
  const [main, inset] = input.noBasemap ? [null, null] : await Promise.all([buildBasemap(s.lon, s.lat, scaleMain, DRAW.w, DRAW.h, "plan"), buildBasemap(s.lon, s.lat, 25000, 62, 44, "plan")]);
  if (!main && !input.noBasemap) warnings.push("Fond IGN indisponible pour DP1 : plan simplifié généré.");
  add("DP1", "Plan de situation", "DP1_plan_de_situation.pdf", await svgToPdfBytes([dp1(ctx, main, inset, scaleMain, 25000)]));
  prog("Plan de masse", 20);
  add("DP2", "Plan de masse", "DP2_plan_de_masse.pdf", await svgToPdfBytes([dp2(ctx)]));
  prog("Plan en coupe", 28);
  add("DP3", "Plan en coupe", "DP3_plan_en_coupe.pdf", await svgToPdfBytes([dp3(ctx)]));
  prog("Plans des façades et toitures", 36);
  add("DP4", "Plan des façades et des toitures", "DP4_plan_des_facades_et_toitures.pdf", await svgToPdfBytes(dp4(ctx)));

  // ---------------------------------------------------------------- photos et insertion
  prog("Insertion visuelle DP5 / DP6", 46);
  const facade = p.photos.find((x) => x.kind === "facade");
  if (facade) {
    const r = await renderInsertion(p, facade.id, panel);
    if (r && p.insertions.some((i) => i.photoId === facade.id && i.quad.length === 4)) {
      const before = await imageToJpegDataUrl(r.before, 1400);
      const after = await imageToJpegDataUrl(r.after, 1400);
      add("DP5", "Représentation de l'aspect extérieur", "DP5_aspect_exterieur.pdf", await svgToPdfBytes([photoPage(cart, "DP5", "Aspect extérieur : avant / après", [{ ...before, caption: "État initial" }, { ...after, caption: "État projeté (photomontage)" }], ["Photomontage réalisé à partir de la photographie de la façade : champ de panneaux positionné en perspective (homographie 4 points).", panel ? `Aspect des modules : ${panel.fullBlack ? "full black" : panel.cellColor}, cadre ${panel.frameColor}.` : ""])]));
      const afterBig = await imageToJpegDataUrl(r.after, 2000);
      const proche = p.photos.find((x) => x.kind === "proche");
      const imgs = [{ ...afterBig, caption: "Insertion du projet dans son environnement" }];
      add("DP6", "Document graphique d'insertion", "DP6_insertion_paysagere.pdf", await svgToPdfBytes([photoPage(cart, "DP6", "Insertion dans l'environnement", imgs, ["Le projet ne modifie ni le volume ni la hauteur de la construction ; seule la couverture du pan équipé change d'aspect.", proche ? "Voir aussi DP7 (environnement proche)." : ""])]));
    } else warnings.push("Insertion non positionnée : DP5/DP6 non générées.");
  }
  prog("Photographies DP7 / DP8", 58);
  for (const [kind, code, title, file] of [["proche", "DP7", "Photographie : environnement proche", "DP7_photo_environnement_proche.pdf"], ["lointain", "DP8", "Photographie : paysage lointain", "DP8_photo_paysage_lointain.pdf"]] as const) {
    const ph = p.photos.find((x) => x.kind === kind);
    if (!ph) continue;
    const blob = await photoStore.get(ph.blobKey);
    if (!blob) continue;
    const img = await blobToImage(blob);
    const j = await imageToJpegDataUrl(img, 2000);
    const sp = shotPoints(p, s).find((x) => x.kind === kind);
    add(code, title, file, await svgToPdfBytes([photoPage(cart, code, title, [{ ...j, caption: ph.caption || title }], [`Point de prise de vue repéré « ${code === "DP7" ? "7" : "8"} » sur DP1 et DP2${sp?.estimated ? " (position estimée)" : ""}.`, "Photographie originale (non photocopiée)."], true)]));
  }

  // ---------------------------------------------------------------- textes
  prog("Notice descriptive (DP11) et mandat", 66);
  add("DP11", "Notice des matériaux et modalités d'exécution", "DP11_notice_materiaux.pdf", textPdf("DP11 : Notice descriptive du projet", [{ lines: noticeDescriptive(p, panel, inverter) }, { heading: "Contexte réglementaire relevé", lines: ev.results.filter((r) => r.category === "contexte" && r.severity !== "ok").map((r) => `${r.title} : ${r.message} (source : ${r.source_label ?? r.source_url})`) }], DISCLAIMER));
  const mText = mandateText(p, client, tenant);
  add("MANDAT", "Mandat du maître d'ouvrage", "Mandat_depot_DP.pdf", textPdf("Mandat", [{ lines: mText.split("\n").slice(1) }], DISCLAIMER, (doc, y) => {
    if (p.mandate) {
      try {
        doc.addImage(p.mandate.imageDataUrl, "PNG", 15, y + 2, 60, 18);
      } catch {
        /* image invalide */
      }
      doc.setFontSize(8);
      doc.text([`Signé électroniquement par ${p.mandate.signerName} le ${new Date(p.mandate.signedAt).toLocaleString("fr-FR")}`, `Empreinte SHA-256 du texte signé : ${p.mandate.documentSha256}`, `Procédé : ${p.mandate.provider === "simple" ? "signature électronique simple (tracé + horodatage + empreinte)" : p.mandate.provider}`], 15, y + 26);
      return y + 40;
    }
    doc.setFontSize(10);
    doc.text("Signature du mandant : ______________________   Date : ____/____/______", 15, y + 10);
    return y + 20;
  }));

  // ---------------------------------------------------------------- cerfa
  prog("Cerfa 16702*03 pré-rempli", 76);
  const generatedCodes = files.map((f) => f.code).filter((c) => /^DP\d+$/.test(c));
  const mapping = currentCerfa();
  try {
    const res = await fetch(asset(mapping.pdf));
    const { bytes, report } = await fillCerfa(await res.arrayBuffer(), cerfaData(p, client, panel, generatedCodes), mapping, p.declarationSignature);
    add("CERFA", `Cerfa ${mapping.cerfa}*${mapping.version}`, `Cerfa_${mapping.cerfa}-${mapping.version}_declaration_prealable.pdf`, bytes);
    if (report.empty.length) warnings.push(`Champs du cerfa laissés vides (à compléter si nécessaire) : ${report.empty.join(", ")}`);
  } catch (e) {
    warnings.push(`Cerfa non rempli : ${e instanceof Error ? e.message : e}`);
  }

  // ---------------------------------------------------------------- bordereau
  prog("Bordereau et courrier", 84);
  const copies = paperCopies(facts);
  const missing = req.filter((r) => r.isRequired && !generatedCodes.includes(r.code));
  const bordereau = textPdf(
    `Bordereau des pièces : ${p.reference}`,
    [
      { lines: [`Déclaration préalable : ${p.address.label}`, `Cadastre : ${parcelRefs(p.enrichment)}`, `Maître d'ouvrage : ${client ? `${client.firstName} ${client.lastName}` : ""} : mandataire : ${tenant.name}`, `Régime : ${ev.regime.message}`] },
      { heading: "Pièces jointes", lines: ruleset.pieces.filter((pc) => generatedCodes.includes(pc.code)).map((pc) => `[x] ${pc.code} (${pc.cerfaCode} au cerfa) : ${pc.label} : ${pc.article}`) },
      { heading: "Autres documents", lines: ["[x] Cerfa n° 16702*03 rempli", "[x] Mandat du maître d'ouvrage"] },
      ...(missing.length ? [{ heading: "Pièces manquantes à compléter", lines: missing.map((m) => `[ ] ${m.code} : ${m.label} (${m.why})`) }] : []),
      { heading: "Dépôt papier", lines: [`${copies.label} (source : ${copies.source_url}).`] },
      { heading: "Contrôles automatiques", lines: [`Score indicatif : ${ev.blocking.length ? "dossier non déposable en l'état" : `${ev.score}/100`} (règles ${ruleset.version}, modèles ${TEMPLATES_VERSION}). Ce score n'est pas une garantie.`, ...ev.results.filter((r) => r.severity !== "ok").map((r) => `${r.severity.toUpperCase()} : ${r.title} : ${r.message}`)] },
    ],
    DISCLAIMER,
  );
  add("BORDEREAU", "Bordereau des pièces", "00_Bordereau_des_pieces.pdf", bordereau);

  const pieceNames = files.filter((f) => /^DP\d+$/.test(f.code)).map((f) => f.code);
  const mail = coverLetterEmail(p, client, tenant, p.enrichment?.mairie, [...pieceNames, "cerfa 16702*03", "mandat"]);
  const letter = lrarLetter(p, client, tenant, p.enrichment?.mairie, [...pieceNames, "cerfa 16702*03", "mandat"], copies.copies);
  add("COURRIER", "Courrier LRAR", "Courrier_LRAR_mairie.pdf", textPdf("Courrier de dépôt", [{ lines: letter.split("\n") }], DISCLAIMER));

  // ---------------------------------------------------------------- PDF unique
  prog("Assemblage du PDF unique", 90);
  const order = ["BORDEREAU", "CERFA", "DP1", "DP2", "DP3", "DP4", "DP5", "DP6", "DP7", "DP8", "DP11", "MANDAT"];
  const merged = await PDFDocument.create();
  merged.setTitle(`Dossier DP ${p.reference}`);
  merged.setAuthor(tenant.name);
  merged.setProducer("DP Solaire");
  for (const code of order) {
    const f = files.find((x) => x.code === code);
    if (!f) continue;
    const src = await PDFDocument.load(f.bytes, { ignoreEncryption: true });
    if (code === "CERFA") {
      // le formulaire est aplati dans le PDF unique (le fichier séparé reste éditable)
      try {
        src.getForm().flatten();
      } catch {
        /* formulaire déjà plat */
      }
    }
    const pages = await merged.copyPages(src, src.getPageIndices());
    pages.forEach((pg) => merged.addPage(pg));
  }
  const pdfBytes = await merged.save();

  prog("Archive ZIP", 96);
  const zip = new JSZip();
  const folder = zip.folder(`${p.reference}_${p.address.city.replace(/[^\w-]+/g, "_")}`)!;
  for (const f of files) folder.file(f.name, f.bytes);
  folder.file(`Dossier_complet_${p.reference}.pdf`, pdfBytes);
  folder.file("Email_mairie.txt", `À : ${mail.to || "(email de la mairie non identifié)"}\nObjet : ${mail.subject}\n\n${mail.body}\n`);
  folder.file("LISEZMOI.txt", [`Dossier ${p.reference} : généré le ${new Date().toLocaleString("fr-FR")}`, "", "Contenu :", ...files.map((f) => `- ${f.name} : ${f.label}`), "", copies.label, "", DISCLAIMER].join("\n"));
  const zipBlob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
  prog("Terminé", 100);
  return { pdf: new Blob([pdfBytes as BlobPart], { type: "application/pdf" }), zip: zipBlob, files, pieces: pieceNames, warnings, durationMs: Math.round(performance.now() - t0) };
}

export { svgDoc };
