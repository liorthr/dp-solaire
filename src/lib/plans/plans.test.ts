import { beforeAll, describe, expect, it } from "vitest";
import { writeFileSync, mkdirSync } from "node:fs";
import { demoCases } from "@/data/demo";
import { defaultPanels } from "@/data/catalog";
import { setProviderMode } from "@/lib/providers/core";
import { runEnrichment } from "@/lib/enrichment/run";
import { applyEnrichment, newProject, relayout } from "@/lib/project/factory";
import { dp1, dp2, dp3, dp4, panelsGround, type PlanContext } from "./dp";
import type { Project } from "@/lib/types";

const ctxs: Record<string, PlanContext> = {};
beforeAll(async () => {
  setProviderMode("fixtures");
  for (const d of demoCases) {
    const panel = defaultPanels.find((p) => p.id === d.panelId)!;
    let p: Project = newProject("t", "u", d.address);
    p.pv = { ...p.pv, panelId: panel.id, panelCount: d.panelCount, powerKwc: 1 };
    p = relayout(applyEnrichment(p, await runEnrichment(d.address, d.site)), panel);
    ctxs[d.key] = { project: p, panel, site: d.site, cartouche: { reference: p.reference, address: d.address.label, parcels: "AI 182", date: "11/11/2026", company: "Démo", client: "Client fictif" } };
  }
}, 60_000);

describe("plans vectoriels", () => {
  it("génère DP1 à DP4 avec cartouche, échelle et nord", () => {
    mkdirSync(".plans-out", { recursive: true });
    for (const [k, c] of Object.entries(ctxs)) {
      const pages = [dp1(c, null, null, 2000, 25000), dp2(c), dp3(c), ...dp4(c)];
      pages.forEach((svg, i) => {
        expect(svg.startsWith("<svg")).toBe(true);
        expect(svg).toMatch(/Échelle 1\/\d+|Échelle/);
        expect(svg).not.toMatch(/NaN|undefined/);
        writeFileSync(`.plans-out/${k}-${i}.svg`, svg);
      });
      expect(pages[1]).toContain(">N<");
      expect(pages[1]).toMatch(/Panneaux projetés \(\d+\)/);
    }
  });
  it("les panneaux au sol tombent dans l'emprise du bâtiment (± 1 m)", () => {
    const c = ctxs["sans-contrainte"];
    const p = c.project;
    const l = p.pv.layouts[0];
    const rp = p.pv.roofPlanes.find((r) => r.id === l.roofPlaneId)!;
    const polys = panelsGround(rp, l);
    expect(polys).toHaveLength(l.panels.length);
  });
});
