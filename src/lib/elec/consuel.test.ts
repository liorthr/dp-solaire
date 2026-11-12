import { describe, expect, it } from "vitest";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { PDFDocument } from "pdf-lib";
import { consuelValues, stampConsuel } from "./consuel";
import { defaultElec, elecCalc } from "./calc";
import { singleLineSvg } from "./schema";
import { newProject } from "@/lib/project/factory";
import { defaultInverters, defaultPanels } from "@/data/catalog";
import { demoCases } from "@/data/demo";

const p = newProject("t", "u", demoCases[0].address);
p.pv = { ...p.pv, panelCount: 10, powerKwc: 4.3, inverterId: "gen-micro-400" };
const e = { ...defaultElec(p), pdl: "12345678901234", installerName: "Alex Démo" };
const tenant = { id: "t", name: "Soleil Picard Énergie (démo)", retentionMonths: 60, plan: "pro" as const };
const client = { id: "c", tenantId: "t", firstName: "Camille", lastName: "Exemple", email: "c@example.org", phone: "0600000000", createdAt: "" };

describe("dossier technique Consuel", () => {
  for (const [form, inv] of [["SC 144C2-2", defaultInverters[0]], ["SC 144A-5", defaultInverters[1]]] as const) {
    it(`appose les valeurs sur ${form}`, async () => {
      const r = elecCalc(p, e, defaultPanels[0], inv);
      expect(r.consuelForm).toBe(form);
      const out = await stampConsuel(readFileSync(`public${r.consuelFormPdf}`), r.consuelForm, consuelValues(p, e, r, client, tenant, inv));
      const doc = await PDFDocument.load(out);
      expect(doc.getPageCount()).toBeGreaterThanOrEqual(2);
      mkdirSync(".plans-out", { recursive: true });
      writeFileSync(`.plans-out/${form.replace(/\s/g, "_")}.pdf`, out);
    });
  }
  it("schéma unifilaire", () => {
    const r = elecCalc(p, e, defaultPanels[0], defaultInverters[0]);
    const svg = singleLineSvg(p, e, r, defaultPanels[0], defaultInverters[0], { reference: "R", address: "A", parcels: "P", date: "12/11/2026", company: "C", client: "X" });
    expect(svg).toContain("Micro-onduleurs");
    expect(svg).toContain("Disjoncteur 20 A");
    expect(svg).not.toMatch(/NaN|undefined/);
    writeFileSync(".plans-out/unifilaire.svg", svg);
  });
});
