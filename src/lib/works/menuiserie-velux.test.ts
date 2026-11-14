import { beforeAll, describe, expect, it } from "vitest";
import { mkdirSync, writeFileSync } from "node:fs";
import { demoCases } from "@/data/demo";
import { defaultJoinery, defaultVelux } from "@/data/works";
import { setProviderMode } from "@/lib/providers/core";
import { runEnrichment } from "@/lib/enrichment/run";
import { applyEnrichment, newProject } from "@/lib/project/factory";
import { buildFacts } from "@/lib/rules/facts";
import { evaluateProject, requiredPieces, rulesetFor } from "@/lib/rules/engine";
import { noticeDescriptive, projectDescription, worksObject } from "@/lib/dossier/texts";
import type { EnrichmentResult, Project } from "@/lib/types";
import { defaultJoineryItems, defaultRoofWindows, facadeLeftRight, joineryMinDistance, projectFacades, roofWindowsGround, roofWindowsMinDistance } from "./geom";
import { dp2Works, dp4Works } from "./plans";
import { worksSummary } from "./summary";

const enr: Record<string, EnrichmentResult> = {};
beforeAll(async () => {
  setProviderMode("fixtures");
  for (const k of ["menuiserie", "velux"] as const) {
    const d = demoCases.find((x) => x.key === k)!;
    enr[k] = await runEnrichment(d.address, d.site);
  }
}, 60_000);

const date = "2026-11-14";
const menuProject = (patch: Partial<NonNullable<Project["menuiserie"]>> = {}): Project => {
  const d = demoCases.find((x) => x.key === "menuiserie")!;
  const p = applyEnrichment({ ...newProject("t", "u", d.address), works: "menuiserie" }, enr.menuiserie);
  return { ...p, menuiserie: { ...defaultJoinery(), items: defaultJoineryItems(enr.menuiserie), ...patch } };
};
const veluxProject = (patch: Partial<NonNullable<Project["velux"]>> = {}): Project => {
  const d = demoCases.find((x) => x.key === "velux")!;
  const p = applyEnrichment({ ...newProject("t", "u", d.address), works: "velux" }, enr.velux);
  return { ...p, velux: { ...defaultVelux(), items: defaultRoofWindows(p, "rw-78x118", 2), ...patch } };
};

describe("menuiseries : régime", () => {
  it("changement de matériau ou de couleur : DP ; à l'identique : aucune formalité ; changement de destination : PC", () => {
    const rs = rulesetFor("menuiserie");
    expect(evaluateProject(buildFacts({ project: menuProject() }), date, rs).regime.outcome).toBe("DP");
    expect(evaluateProject(buildFacts({ project: menuProject({ identical: true }) }), date, rs).regime.outcome).toBe("AUCUNE");
    expect(evaluateProject(buildFacts({ project: menuProject({ changeOfUse: true }) }), date, rs).regime.outcome).toBe("PC");
  });
  it("toutes les règles citent une source service-public", () => {
    for (const r of evaluateProject(buildFacts({ project: menuProject() }), date, rulesetFor("menuiserie")).results) expect(r.source_url).toMatch(/^https:\/\//);
  });
  it("pièces : plan des façades obligatoire, pas de coupe", () => {
    const req = requiredPieces(buildFacts({ project: menuProject() }), rulesetFor("menuiserie")).filter((x) => x.isRequired).map((x) => x.code);
    expect(req).toContain("DP4");
    expect(req).not.toContain("DP3");
  });
});

describe("menuiseries : vues sur le voisin", () => {
  it("ouverture créée en vue droite à moins de 1,90 m : alerte ; levée par l'accord écrit du voisin", () => {
    const base = menuProject();
    const f = projectFacades(enr.menuiserie).map((x) => x.index);
    // on cherche la façade la plus proche d'une limite et on y crée une fenêtre
    const closest = f.sort((a, b) => (joineryMinDistance(enr.menuiserie, [{ ...base.menuiserie!.items[0], facadeIndex: a, isNew: true }]) ?? 99) - (joineryMinDistance(enr.menuiserie, [{ ...base.menuiserie!.items[0], facadeIndex: b, isNew: true }]) ?? 99))[0];
    const items = [{ ...base.menuiserie!.items[0], facadeIndex: closest, isNew: true, xM: 0.2 }];
    const d = joineryMinDistance(enr.menuiserie, items)!;
    const ev = evaluateProject(buildFacts({ project: menuProject({ items, view: "droite" }) }), date, rulesetFor("menuiserie"));
    const r = ev.results.find((x) => x.code === "MENU_VUE_DROITE")!;
    expect(r.severity).toBe(d < 1.9 ? "alerte" : "ok");
    const ok = evaluateProject(buildFacts({ project: menuProject({ items, view: "droite", neighborAgreement: true }) }), date, rulesetFor("menuiserie"));
    expect(ok.results.find((x) => x.code === "MENU_VUE_DROITE")!.severity).toBe("ok");
  });
  it("gauche / droite d'une façade vue de dehors", () => {
    const f = projectFacades(enr.menuiserie)[0];
    const [L, R] = facadeLeftRight(f);
    expect(Math.hypot(R[0] - L[0], R[1] - L[1])).toBeCloseTo(f.lengthM, 1);
  });
  it("textes : description cerfa et notice sans parler de panneaux", () => {
    const p = menuProject();
    expect(projectDescription(p)).toMatch(/menuiseries extérieures/);
    expect(projectDescription(p)).toMatch(/aluminium/);
    expect(projectDescription(p)).not.toMatch(/panneau/i);
    expect(noticeDescriptive(p, undefined, undefined).join("\n")).toMatch(/Fenêtre/);
    expect(worksObject(p)).toMatch(/menuiseries/);
    expect(worksSummary(p)).toMatch(/menuiserie/);
  });
});

describe("fenêtres de toit", () => {
  it("régime : DP ; changement de destination : PC ; identique : aucune formalité (À_VÉRIFIER)", () => {
    const rs = rulesetFor("velux");
    expect(evaluateProject(buildFacts({ project: veluxProject() }), date, rs).regime.outcome).toBe("DP");
    expect(evaluateProject(buildFacts({ project: veluxProject({ changeOfUse: true }) }), date, rs).regime.outcome).toBe("PC");
    expect(evaluateProject(buildFacts({ project: veluxProject({ identical: true }) }), date, rs).regime.outcome).toBe("AUCUNE");
  });
  it("les fenêtres sont posées dans l'emprise du toit et leur distance à la limite est mesurée", () => {
    const p = veluxProject();
    const g = roofWindowsGround(p);
    expect(g).toHaveLength(2);
    expect(roofWindowsMinDistance(p)).toBeGreaterThanOrEqual(0);
  });
  it("rue Cormont : ABF détecté, combles signalés, vue droite contrôlée", () => {
    const p = veluxProject({ attic: true, atticAreaM2: 25 });
    const ev = evaluateProject(buildFacts({ project: p }), date, rulesetFor("velux"));
    const on = ev.results.filter((r) => r.severity !== "ok").map((r) => r.code);
    expect(on).toContain("VELUX_SECTEUR_PROTEGE");
    expect(on).toContain("VELUX_COMBLES");
    expect(on).toContain("VELUX_COMBLES_SURFACE");
    const d = roofWindowsMinDistance(p)!;
    expect(ev.results.find((r) => r.code === "VELUX_VUE_DROITE")!.severity).toBe(d < 1.9 ? "alerte" : "ok");
  });
});

describe("plans menuiseries / fenêtres de toit", () => {
  const ctx = (p: Project) => ({ project: p, site: { lon: p.address!.lon, lat: p.address!.lat }, cartouche: { reference: "T", address: "x", parcels: "AB 1", date: "14/11/2026", company: "Démo", client: "Client fictif" } });
  it("DP2 et DP4 sans valeur manquante", () => {
    mkdirSync(".plans-out", { recursive: true });
    const m = menuProject({ items: defaultJoineryItems(enr.menuiserie).map((it, i) => (i === 0 ? { ...it, isNew: true } : it)) });
    const v = veluxProject();
    const pages = { "menu-dp2": dp2Works(ctx(m)), "menu-dp4": dp4Works(ctx(m))[0], "velux-dp2": dp2Works(ctx(v)), "velux-dp4": dp4Works(ctx(v))[0] };
    for (const [k, svg] of Object.entries(pages)) {
      expect(svg).not.toMatch(/NaN|undefined/);
      writeFileSync(`.plans-out/works-${k}.svg`, svg);
    }
    expect(pages["menu-dp4"]).toMatch(/création/);
    expect(pages["velux-dp2"]).toMatch(/Fenêtre de toit la plus proche/);
    expect(pages["velux-dp4"]).toMatch(/état projeté/);
  });
});
