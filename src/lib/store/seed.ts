"use client";
// Création des dossiers de démonstration (solaire, PAC, ITE) (adresses publiques réelles, clients fictifs, photos d'illustration).
import type { Client, Project } from "@/lib/types";
import { demoCases } from "@/data/demo";
import { defaultPanels } from "@/data/catalog";
import { providerMode, setProviderMode } from "@/lib/providers/core";
import { runEnrichment } from "@/lib/enrichment/run";
import { applyEnrichment, newProject, relayout, uid } from "@/lib/project/factory";
import { analyzePhoto, asset, scribbleSignature } from "@/lib/image/browser";
import { simpleSignatureProvider } from "@/lib/providers/signature";
import { mandateText } from "@/lib/dossier/texts";
import { addDays } from "@/lib/instruction/deadlines";
import { photoStore } from "./db";
import { bestExtensionFacade, bestPacFacade, defaultRoofWindows, projectFacades } from "@/lib/works/geom";
import type { JoineryItem } from "@/lib/types";

/** quadrilatère du champ de panneaux sur les photos d'illustration 2000×1500 (pan avant, en perspective) */
const DEMO_QUADS: Record<string, [number, number][]> = {
  "sans-contrainte": [[650, 375], [1250, 375], [1325, 588], [588, 588]],
  abf: [[750, 412], [1200, 412], [1238, 575], [725, 575]],
  "plu-restrictif": [[800, 400], [1162, 400], [1200, 562], [769, 562]],
  pac: [[1240, 990], [1360, 990], [1360, 1083], [1240, 1083]],
  ite: [[414, 653], [1586, 653], [1586, 1124], [414, 1124]],
  extension: [[1560, 840], [1930, 880], [1930, 1180], [1560, 1135]],
};

/** photo d'illustration (2000×1500) : 3 fenêtres et la porte, de gauche à droite ; mur de x = 413 à 1587 */
const DEMO_OPENINGS: { kind: JoineryItem["kind"]; quad: [number, number][] }[] = [
  { kind: "fenetre", quad: [[582, 747], [711, 747], [711, 886], [582, 886]] },
  { kind: "fenetre", quad: [[918, 747], [1047, 747], [1047, 886], [918, 886]] },
  { kind: "porte", quad: [[916, 912], [1050, 912], [1050, 1124], [916, 1124]] },
  { kind: "fenetre", quad: [[1254, 747], [1383, 747], [1383, 886], [1254, 886]] },
];
const DEMO_ROOF_WINDOWS: [number, number][][] = [
  [[750, 430], [828, 430], [831, 515], [747, 515]],
  [[1172, 430], [1250, 430], [1253, 515], [1169, 515]],
];

export async function seedDemoProjects(tenantId: string, userId: string): Promise<Project[]> {
  const prevMode = providerMode();
  setProviderMode("fixtures"); // données réelles enregistrées : démo déterministe et instantanée
  const { repo } = await import("./db");
  const out: Project[] = [];
  try {
    for (const [i, d] of demoCases.entries()) {
      const client: Client = repo.saveClient({ civility: d.client.civility, firstName: d.client.firstName, lastName: d.client.lastName, email: d.client.email, phone: d.client.phone });
      const panel = defaultPanels.find((p) => p.id === d.panelId)!;
      let p = newProject(tenantId, userId, d.address);
      p.demo = true;
      p.clientId = client.id;
      p.reference = `DEMO-${i + 1}-${d.key.toUpperCase()}`;
      p.overrides = { site: d.site };
      const enrichment = await runEnrichment(d.address, d.site);
      if (d.works && d.works !== "pv") {
        p.works = d.works;
        p = applyEnrichment(p, enrichment);
        if (d.pac) p.pac = { ...d.pac, facadeIndex: bestPacFacade(enrichment, d.pac) };
        if (d.ite) p.ite = d.ite;
        if (d.menuiserie) {
          const f = [...projectFacades(enrichment)].sort((a, b) => b.lengthM - a.lengthM)[0];
          const L = f?.lengthM ?? 10;
          // positions relevées sur la photo : rapport (x - 413) / 1174 de la largeur du mur
          p.menuiserie = {
            ...d.menuiserie,
            items: DEMO_OPENINGS.map((o, j) => {
              const w = ((o.quad[1][0] - o.quad[0][0]) / 1174) * L;
              const h = o.kind === "porte" ? 2.15 : 1.25;
              return { id: `j${j + 1}`, facadeIndex: f?.index ?? 0, kind: o.kind, widthM: Math.round(w * 100) / 100, heightM: h, xM: Math.round((((o.quad[0][0] - 413) / 1174) * L) * 100) / 100, sillM: o.kind === "porte" ? 0 : 1.0, isNew: false };
            }),
          };
        }
        if (d.extension) p.extension = { ...d.extension, facadeIndex: bestExtensionFacade(enrichment, d.extension) };
        if (d.velux) p.velux = { ...d.velux, items: defaultRoofWindows(p, d.velux.modelId, 2) };
      } else {
        p.pv = { ...p.pv, panelId: panel.id, panelCount: d.panelCount, powerKwc: (d.panelCount * panel.powerWc) / 1000, inverterId: "gen-micro-400" };
        p = applyEnrichment(p, enrichment);
        p = relayout(p, panel);
      }
      // photos d'illustration
      for (const kind of ["facade", "proche", "lointain"] as const) {
        const res = await fetch(asset(`/demo/${d.photos ?? d.key}-${kind}.jpg`));
        if (!res.ok) continue;
        const blob = await res.blob();
        const key = uid("blob");
        await photoStore.put(key, blob);
        const { quality, width, height } = await analyzePhoto(blob, kind);
        p.photos.push({ id: uid("pho"), kind, blobKey: key, width, height, quality, caption: kind === "facade" ? (d.works && d.works !== "pv" && d.works !== "velux" ? "Façade principale" : "Façade principale et toiture") : kind === "proche" ? "Vue depuis la rue" : "Vue lointaine depuis la voie publique" });
      }
      const facade = p.photos.find((x) => x.kind === "facade");
      if (facade && d.works === "menuiserie") p.insertions = [{ photoId: facade.id, quad: DEMO_OPENINGS[0].quad, extraQuads: DEMO_OPENINGS.slice(1).map((o) => o.quad), rows: 1, cols: 1 }];
      else if (facade && d.works === "velux") p.insertions = [{ photoId: facade.id, quad: DEMO_ROOF_WINDOWS[0], extraQuads: DEMO_ROOF_WINDOWS.slice(1), rows: 1, cols: 1 }];
      else if (facade) p.insertions = [{ photoId: facade.id, quad: DEMO_QUADS[d.key], rows: 2, cols: Math.ceil(d.panelCount / 2) }];
      const signerName = `${d.client.firstName} ${d.client.lastName}`;
      if (i < 2 || d.works) p.mandate = await simpleSignatureProvider.sign({ signerName, document: mandateText(p, client, repo.tenant()), imageDataUrl: scribbleSignature(signerName) });
      if (i === 0) {
        const depot = addDays(new Date().toISOString().slice(0, 10), -20);
        p.filingMode = "email";
        p.events = [
          { id: uid("evt"), type: "depot", date: depot, note: "Envoyé par email à la mairie" },
          { id: uid("evt"), type: "recepisse", date: addDays(depot, 2), note: "Accusé de réception électronique n° DP 080 632 26 X0042 (exemple)" },
        ];
        p.status = "instruction";
      } else if (i === 1) p.status = "pret";
      out.push(p);
    }
  } finally {
    setProviderMode(prevMode === "live" ? undefined : prevMode);
  }
  return out;
}
