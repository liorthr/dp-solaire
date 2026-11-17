import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { PDFDocument } from "pdf-lib";
import { cerfaData, cerfaGaps, fillCerfa } from "@/lib/dossier/cerfa";
import { coverLetterEmail, projectDescription } from "@/lib/dossier/texts";
import { newProject } from "@/lib/project/factory";
import { demoCases } from "@/data/demo";
import { defaultAgri } from "@/data/works";
import { analyze } from "@/lib/project/status";
import { defaultElec } from "@/lib/elec/calc";
import { priceKindOf } from "@/lib/cloud/payments";
import type { Client, Project } from "@/lib/types";

const client: Client = { id: "c", tenantId: "t", firstName: "Paul", lastName: "Exemple", email: "earl@example.org", phone: "0600000003", createdAt: "" };
function farm(patch: Partial<NonNullable<Project["agri"]>> = {}): Project {
  const p = newProject("t", "u", demoCases[0].address);
  p.agri = { ...defaultAgri(), ...patch };
  p.pv = { ...p.pv, panelCount: 240, powerKwc: 103.2, inverterId: "gen-tri-50k" };
  p.enrichment = { parcels: [{ idu: "x", prefixe: "000", section: "ZB", numero: "0042", contenanceM2: 12000, geometry: { type: "Polygon", coordinates: [] } }], buildings: [], zones: [], servitudes: [], prescriptions: [], risks: [], sources: {}, heritage: { inAbordsMH: false, inSPR: false, inSiteClasseOuInscrit: false, monuments: [], abfConsultation: "non", confidence: "haute", explanation: [], divergences: [] } };
  return p;
}

describe("solaire agricole", () => {
  it("bâtiment existant : déclaration préalable ; hangar neuf : permis de construire (cerfa 13409, non généré)", () => {
    const dp = analyze(farm(), client, undefined).evaluation;
    expect(dp.regime.outcome).toBe("DP");
    const pc = analyze(farm({ building: "neuf" }), client, undefined).evaluation;
    expect(pc.regime.code).toBe("REGIME_AGRI_HANGAR_NEUF_PC");
    expect(pc.regime.message).toMatch(/13409/);
    expect(pc.regime.message).toMatch(/800 m²/);
    expect(pc.canGenerate).toBe(false);
  });

  it("prix agricole de 239 € quel que soit le régime", () => {
    expect(priceKindOf(farm(), "DP")).toBe("AGRI");
    expect(priceKindOf(newProject("t", "u"), "DP")).toBe("DP");
    expect(priceKindOf(newProject("t", "u"), "PC")).toBe("PC");
  });

  it("textes : hangar agricole et société déclarante", () => {
    const p = farm({ company: { legalForm: "EARL", name: "du Moulin", siret: "12345678900012" } });
    expect(projectDescription(p)).toMatch(/du hangar agricole existant\./);
    const mail = coverLetterEmail(p, client, { id: "t", kind: "professionnel", name: "Installateur", siret: "", address: "", email: "", phone: "", retentionMonths: 60, plan: "pro", legalMentions: "" }, undefined, ["DP1"]);
    expect(mail.body).toMatch(/Pour le compte de EARL du Moulin, représentée par Paul Exemple/);
    expect(mail.body).toMatch(/du hangar agricole situé /);
  });

  it("cerfa : rubrique personne morale remplie, rubrique particulier vide et non signalée", async () => {
    const p = farm({ company: { legalForm: "GAEC", name: "des Prés", siret: "123 456 789 00012" } });
    const { bytes, report } = await fillCerfa(readFileSync("public/cerfa/cerfa_16702-03.pdf"), cerfaData(p, client, undefined, ["DP1"]));
    const f = (await PDFDocument.load(bytes)).getForm();
    expect(f.getTextField("D2D_denomination").getText()).toBe("des Prés");
    expect(f.getTextField("D2S_siret").getText()).toBe("12345678900012");
    expect(f.getTextField("D2J_type").getText()).toBe("GAEC");
    expect(f.getTextField("D2N_nom").getText()).toBe("EXEMPLE");
    expect(f.getTextField("D1N_nom").getText() ?? "").toBe("");
    expect(report.empty).not.toContain("D1A_naissance");
    expect(report.empty).not.toContain("T2NP2_numero");
    // société : ni date ni lieu de naissance exigés, mais SIRET valide
    expect(cerfaGaps(p, client).filter((g) => g.required)).toEqual([]);
    expect(cerfaGaps(farm({ company: { legalForm: "EARL", name: "X", siret: "123" } }), client).map((g) => g.id)).toContain("companySiret");
  });

  it("raccordement par défaut : triphasé, site professionnel, onduleurs répartis", () => {
    const e = defaultElec(farm());
    expect(e.phase).toBe("tri");
    expect(e.workplace).toBe(true);
    expect(e.inverterCount).toBe(2); // 103,2 kWc / 50 kVA
    expect(e.subscribedKva).toBeUndefined();
  });
});
