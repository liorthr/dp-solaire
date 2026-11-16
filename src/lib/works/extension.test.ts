import { beforeAll, describe, expect, it } from "vitest";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { PDFDocument } from "pdf-lib";
import { demoCases } from "@/data/demo";
import { defaultExtension } from "@/data/works";
import { setProviderMode } from "@/lib/providers/core";
import { runEnrichment } from "@/lib/enrichment/run";
import { applyEnrichment, newProject } from "@/lib/project/factory";
import { buildFacts } from "@/lib/rules/facts";
import { deadlineMonths, evaluateProject, paperCopies, requiredPieces, rulesetFor } from "@/lib/rules/engine";
import { cerfaDataPC, cerfaPC, fillCerfa } from "@/lib/dossier/cerfa";
import { coverLetterEmail, mandateText, projectDescription } from "@/lib/dossier/texts";
import { quickVerdict } from "@/lib/verdict/quick";
import type { EnrichmentResult, ExtensionInfo, Project } from "@/lib/types";
import { extensionRing, extensionMinDistance } from "./geom";
import { dp2Extension, dp3Extension, dp4Extension } from "./extension-plans";
import { authorizationOf } from "./authorization";

const enr: Record<string, EnrichmentResult> = {};
beforeAll(async () => {
  setProviderMode("fixtures");
  for (const k of ["extension", "plu-restrictif", "abf"] as const) {
    const d = demoCases.find((x) => x.key === k)!;
    enr[k] = await runEnrichment(d.address, d.site);
  }
}, 60_000);

const date = "2026-11-16";
const mk = (k: "extension" | "plu-restrictif" | "abf", patch: Partial<ExtensionInfo> = {}, more: Partial<Project> = {}): Project => {
  const d = demoCases.find((x) => x.key === k)!;
  const p = applyEnrichment({ ...newProject("t", "u", d.address), works: "extension" }, enr[k]);
  return { ...p, extension: { ...defaultExtension(), ...(demoCases.find((x) => x.key === "extension")!.extension!), ...patch }, ...more };
};
const regime = (p: Project) => evaluateProject(buildFacts({ project: p }), date, rulesetFor("extension"));

describe("extension : DP ou permis de construire (F36768, F36961)", () => {
  it("zone urbaine (UC) : DP jusqu'à 40 m², permis au-delà", () => {
    expect(enr.extension.zones[0].typezone).toMatch(/^U/);
    expect(regime(mk("extension", { widthM: 6, depthM: 6, floorAreaCreatedM2: 30 })).regime.outcome).toBe("DP");
    expect(regime(mk("extension", { widthM: 7, depthM: 6.5, floorAreaCreatedM2: 40 })).regime.code).toBe("REGIME_EXT_PC_U_40");
  });
  it("zone urbaine : plus de 20 m² de plancher et total > 150 m² → permis", () => {
    const r = regime(mk("extension", { widthM: 5, depthM: 5, floorAreaCreatedM2: 25, floorAreaExistingM2: 130 }));
    expect(r.regime.code).toBe("REGIME_EXT_PC_U_150");
  });
  it("hors zone urbaine (zone N) : permis au-delà de 20 m²", () => {
    expect(enr["plu-restrictif"].zones[0].typezone).not.toMatch(/^U/);
    expect(regime(mk("plu-restrictif", { widthM: 4, depthM: 4.5, floorAreaCreatedM2: 18 })).regime.outcome).toBe("DP");
    expect(regime(mk("plu-restrictif", { widthM: 5, depthM: 5, floorAreaCreatedM2: 22 })).regime.code).toBe("REGIME_EXT_PC_HORS_U");
  });
  it("garage : seuil apprécié sur l'emprise au sol", () => {
    expect(regime(mk("extension", { kind: "garage", widthM: 6, depthM: 7.5, floorAreaCreatedM2: 0 })).regime.outcome).toBe("PC");
    expect(regime(mk("extension", { kind: "garage", widthM: 5, depthM: 6, floorAreaCreatedM2: 0 })).regime.outcome).toBe("DP");
  });
  it("architecte obligatoire au-delà de 150 m² sans architecte : bloquant ; dispense sinon", () => {
    const big = regime(mk("extension", { floorAreaExistingM2: 120 }));
    expect(big.blocking.map((x) => x.code)).toContain("EXT_ARCHITECTE");
    expect(regime(mk("extension", { floorAreaExistingM2: 120, architect: true })).blocking.map((x) => x.code)).not.toContain("EXT_ARCHITECTE");
    expect(regime(mk("extension")).results.find((x) => x.code === "EXT_ARCHITECTE_DISPENSE")!.severity).toBe("info");
  });
  it("délais : permis maison 2 mois, 3 mois en secteur protégé ; DP 1 mois", () => {
    expect(deadlineMonths(buildFacts({ project: mk("extension") }), rulesetFor("extension")).months).toBe(2);
    expect(deadlineMonths(buildFacts({ project: mk("abf") }), rulesetFor("extension")).months).toBe(3);
    expect(deadlineMonths(buildFacts({ project: mk("extension", { widthM: 5, depthM: 5, floorAreaCreatedM2: 20 }) }), rulesetFor("extension")).months).toBe(1);
  });
  it("exemplaires papier : 4 dossiers + 5 plans pour un permis", () => {
    expect(paperCopies(buildFacts({ project: mk("extension") }), rulesetFor("extension")).copies).toBe(4);
    expect(paperCopies(buildFacts({ project: mk("abf") }), rulesetFor("extension")).copies).toBe(5);
  });
  it("pièces PCMI1 à PCMI8 exigées pour un permis, DP pour une déclaration", () => {
    const pc = requiredPieces(buildFacts({ project: mk("extension") }), rulesetFor("extension")).filter((x) => x.isRequired).map((x) => x.code);
    for (const c of ["PCMI1", "PCMI2", "PCMI3", "PCMI4", "PCMI5", "PCMI6", "PCMI7", "PCMI8"]) expect(pc).toContain(c);
    expect(pc).not.toContain("DP1");
    const dp = requiredPieces(buildFacts({ project: mk("extension", { widthM: 4, depthM: 4, floorAreaCreatedM2: 16 }) }), rulesetFor("extension")).filter((x) => x.isRequired).map((x) => x.code);
    expect(dp).toContain("DP1");
    expect(dp).not.toContain("PCMI1");
  });
  it("chaque règle cite une source officielle", () => {
    for (const r of regime(mk("extension")).results) expect(r.source_url).toMatch(/^https:\/\/(www\.)?(service-public\.gouv\.fr|formulaires\.service-public\.gouv\.fr|legifrance\.gouv\.fr|geoservices\.ign\.fr|www\.geoportail-urbanisme\.gouv\.fr)/);
  });
});

describe("géométrie et plans", () => {
  it("l'extension est accolée à la façade et mesure la bonne surface", () => {
    const x = mk("extension").extension!;
    const r = extensionRing(enr.extension, x)!;
    const a = Math.abs(r.slice(0, 4).reduce((s, c, i, arr) => s + c[0] * arr[(i + 1) % 4][1] - arr[(i + 1) % 4][0] * c[1], 0) / 2);
    expect(a).toBeCloseTo(45.5, 0);
    expect(extensionMinDistance(enr.extension, x)).toBeGreaterThanOrEqual(0);
  });
  it("masse, coupe, façades : sans valeur manquante, numérotés PCMI", () => {
    mkdirSync(".plans-out", { recursive: true });
    const p = mk("extension");
    const ctx = { project: p, site: { lon: p.address!.lon, lat: p.address!.lat }, cartouche: { reference: "T", address: "x", parcels: "AI 182", date: "16/11/2026", company: "Démo", client: "Client fictif" } };
    const pages = { "ext-pcmi2": dp2Extension(ctx, "PCMI2"), "ext-pcmi3": dp3Extension(ctx, "PCMI3"), "ext-pcmi5": dp4Extension(ctx, "PCMI5") };
    for (const [k, svg] of Object.entries(pages)) {
      expect(svg).not.toMatch(/NaN|undefined/);
      writeFileSync(`.plans-out/works-${k}.svg`, svg);
    }
    expect(pages["ext-pcmi2"]).toContain(">PCMI2<");
    expect(pages["ext-pcmi3"]).toMatch(/TN/);
    expect(pages["ext-pcmi5"]).toMatch(/état projeté/);
  });
});

describe("cerfa 13406*17 et textes", () => {
  it("remplit identité, terrain, surfaces, emprise, annexe, dispense d'architecte et bordereau PCMI", async () => {
    const p = mk("extension");
    const client = { id: "c", tenantId: "t", firstName: "Nora", lastName: "Exemple-Garcia", email: "nora@example.org", phone: "06 00 00 00 08", birthDate: "1985-02-03", birthPlace: "Amiens", createdAt: "" };
    const pieces = ["PCMI1", "PCMI2", "PCMI3", "PCMI4", "PCMI5", "PCMI6", "PCMI7", "PCMI8"];
    const { bytes, report } = await fillCerfa(readFileSync("public/cerfa/cerfa_13406-17.pdf"), cerfaDataPC(p, client, pieces), cerfaPC);
    expect(report.missingInPdf).toEqual([]);
    expect(report.truncated).toEqual([]);
    mkdirSync(".plans-out", { recursive: true });
    writeFileSync(".plans-out/cerfa13406-demo.pdf", bytes);
    const f = (await PDFDocument.load(bytes)).getForm();
    expect(f.getTextField("D1N_nom").getText()).toBe("EXEMPLE-GARCIA");
    expect(f.getTextField("D1A_naissance").getText()).toBe("03021985");
    expect(f.getTextField("T2L_localite").getText()).toBe("Pont-de-Metz");
    expect(f.getTextField("W2LA1").getText()).toBe("95");
    expect(f.getTextField("W2LB1").getText()).toBe("40");
    expect(f.getTextField("W2LF1").getText()).toBe("135");
    expect(f.getTextField("W2SF1").getText()).toBe("135");
    expect(f.getTextField("W3ES2_creee").getText()).toBe("45,5");
    expect(f.getTextField("C2ZD1_description").getText()).toMatch(/Agrandissement/);
    expect(f.getCheckBox("C2ZB1_existante").isChecked()).toBe(true);
    expect(f.getCheckBox("C5ZK1_extension").isChecked()).toBe(true);
    expect(f.getCheckBox("H1H_honneur").isChecked()).toBe(true);
    expect(f.getCheckBox("P3GA1").isChecked()).toBe(true);
    expect(f.getCheckBox("P3GH1").isChecked()).toBe(true);
    expect(f.getCheckBox("P4EK1").isChecked()).toBe(false);
  });
  it("courriers et mandat parlent de permis de construire et du cerfa 13406", () => {
    const p = mk("extension");
    expect(authorizationOf(p).kind).toBe("PC");
    expect(coverLetterEmail(p, undefined, { id: "t", name: "Démo", createdAt: "" } as never, undefined, ["PCMI1"]).subject).toMatch(/^Demande de permis de construire/);
    expect(mandateText(p, undefined, { id: "t", name: "Démo", createdAt: "" } as never)).toMatch(/DEMANDE DE PERMIS DE CONSTRUIRE/);
    expect(projectDescription(p)).toMatch(/emprise au sol créée 45,5 m²/);
  });
  it("verdict immédiat : permis de construire, 2 mois, architecte non requis à 135 m²", () => {
    const d = demoCases.find((x) => x.key === "extension")!;
    const v = quickVerdict("extension", d.address, enr.extension, { extKind: "agrandissement", extAreaM2: 45, extExistingM2: 95 }, date);
    expect(v.outcome).toBe("PC");
    expect(v.months).toBe(2);
    expect(v.architectRequired).toBe(false);
    const v2 = quickVerdict("extension", d.address, enr.extension, { extKind: "agrandissement", extAreaM2: 45, extExistingM2: 130 }, date);
    expect(v2.architectRequired).toBe(true);
  });
});
