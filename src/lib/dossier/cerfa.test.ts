import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { PDFDocument } from "pdf-lib";
import { cerfaData, currentCerfa, fillCerfa } from "./cerfa";
import { newProject } from "@/lib/project/factory";
import { demoCases } from "@/data/demo";
import { defaultPanels } from "@/data/catalog";

describe("cerfa 16702*03", () => {
  it("tous les champs du mapping existent dans le PDF officiel", async () => {
    const bytes = readFileSync("public/cerfa/cerfa_16702-03.pdf");
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const names = new Set(doc.getForm().getFields().map((f) => f.getName()));
    const missing = currentCerfa("2026-11-11").fields.filter((f) => !names.has(f.field)).map((f) => f.field);
    expect(missing).toEqual([]);
  });

  it("remplit identité, terrain, cadastre, description et pièces", async () => {
    const d = demoCases[1];
    const p = newProject("t", "u", d.address);
    p.pv = { ...p.pv, panelCount: 8, powerKwc: 3.6 };
    p.enrichment = { parcels: [{ idu: "80021000AE0026", prefixe: "000", section: "AE", numero: "0026", contenanceM2: 101, geometry: { type: "Polygon", coordinates: [] } }], buildings: [], zones: [], servitudes: [], prescriptions: [], risks: [], sources: {}, heritage: { inAbordsMH: true, inSPR: false, inSiteClasseOuInscrit: false, monuments: [], abfConsultation: "oui", confidence: "haute", explanation: [], divergences: [] } };
    const client = { id: "c", tenantId: "t", firstName: "Louis", lastName: "Fictif-Martin", email: "louis.fictif@example.org", phone: "06 00 00 00 02", createdAt: "" };
    const data = cerfaData(p, client, defaultPanels[2], ["DP1", "DP2", "DP4", "DP5", "DP6", "DP7", "DP8", "DP11"]);
    const { bytes, report } = await fillCerfa(readFileSync("public/cerfa/cerfa_16702-03.pdf"), data);
    expect(report.missingInPdf).toEqual([]);
    const out = await PDFDocument.load(bytes);
    const f = out.getForm();
    expect(f.getTextField("D1N_nom").getText()).toBe("FICTIF-MARTIN");
    expect(f.getTextField("T2S_section").getText()).toBe("AE");
    expect(f.getTextField("T2N_numero").getText()).toBe("0026");
    expect(f.getTextField("T2L_localite").getText()).toBe("Amiens");
    expect(f.getTextField("C2ZD1_description").getText()).toMatch(/8 panneaux solaires photovoltaïques \(3,6 kWc/);
    expect(f.getCheckBox("X2H_historique").isChecked()).toBe(true);
    expect(f.getCheckBox("C2ZB1_existante").isChecked()).toBe(true);
    expect(f.getCheckBox("P3GH1").isChecked()).toBe(true); // DPC8
    expect(f.getCheckBox("P3GE1").isChecked()).toBe(false); // DPC3 non coché
    expect(f.getCheckBox("T3S_lotnc").isChecked()).toBe(true);
  });
});
