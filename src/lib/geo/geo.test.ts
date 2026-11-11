import { describe, expect, it } from "vitest";
import { autoLayout, layoutCapacity, gridFor, DEFAULT_MARGINS } from "./calepinage";
import { estimateRoof, orientationLabel } from "./roof";
import { fromL93, minAreaRect, toL93 } from "./proj";
import { defaultPanels } from "@/data/catalog";
import type { BuildingInfo, RoofPlane } from "@/lib/types";

const panel = defaultPanels[0]; // 1134 × 1722 mm
const rp: RoofPlane = { id: "p", label: "Sud", azimuthDeg: 180, tiltDeg: 35, widthM: 10, slopeLengthM: 5, covering: "tuile_terre_cuite" };

describe("calepinage", () => {
  it("grille portrait avec marges", () => {
    const g = gridFor(rp, panel, { orientation: "portrait", ...DEFAULT_MARGINS });
    expect(g.cols).toBe(8); // (9.4+0.02)/(1.134+0.02)
    expect(g.rows).toBe(2); // (4.4+0.02)/(1.722+0.02)
    expect(layoutCapacity(rp, panel).count).toBe(16);
  });
  it("placement centré, dans les marges, sans chevauchement", () => {
    const l = autoLayout(rp, panel, 10);
    expect(l.panels).toHaveLength(10);
    for (const p of l.panels) {
      expect(p.x).toBeGreaterThanOrEqual(DEFAULT_MARGINS.marginEdgeM - 1e-9);
      expect(p.x + p.w).toBeLessThanOrEqual(rp.widthM - DEFAULT_MARGINS.marginEdgeM + 1e-9);
      expect(p.y + p.h).toBeLessThanOrEqual(rp.slopeLengthM - DEFAULT_MARGINS.marginRidgeM + 1e-9);
    }
    const xs = l.panels.filter((p) => p.y === l.panels[0].y).map((p) => p.x);
    const span = Math.max(...xs) + panel.widthMm / 1000 - Math.min(...xs);
    expect(Math.abs(Math.min(...xs) - (rp.widthM - span) / 2)).toBeLessThan(0.01);
  });
  it("ne dépasse jamais la capacité", () => {
    expect(autoLayout(rp, panel, 50).panels.length).toBe(16);
  });
  it("bascule en paysage si plus efficace", () => {
    const flat: RoofPlane = { ...rp, widthM: 6, slopeLengthM: 1.9 };
    const l = autoLayout(flat, panel, 3);
    expect(l.orientation).toBe("paysage");
    expect(l.panels).toHaveLength(3);
  });
});

describe("projection et toiture", () => {
  it("aller-retour Lambert-93", () => {
    const p = toL93([2.3, 49.89]);
    const q = fromL93(p);
    expect(q[0]).toBeCloseTo(2.3, 6);
    expect(q[1]).toBeCloseTo(49.89, 6);
  });
  it("rectangle orienté d'un rectangle tourné", () => {
    const a = Math.PI / 6;
    const pts: [number, number][] = [[0, 0], [12, 0], [12, 8], [0, 8], [0, 0]].map(([x, y]) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)]);
    const r = minAreaRect(pts);
    expect(r.length).toBeCloseTo(12, 6);
    expect(r.width).toBeCloseTo(8, 6);
    expect(r.angle).toBeCloseTo(a, 6);
  });
  it("estime deux pans à partir d'une emprise E-O", () => {
    const [x0, y0] = toL93([2.3, 49.89]);
    const ring = [[x0, y0], [x0 + 12, y0], [x0 + 12, y0 + 8], [x0, y0 + 8], [x0, y0]].map((p) => fromL93(p));
    const b: BuildingInfo = { id: "b", heightM: 8, geometry: { type: "Polygon", coordinates: [ring] }, areaM2: 96 };
    const est = estimateRoof(b);
    expect(est.planes).toHaveLength(2);
    expect(est.planes[0].label).toBe("Pan Sud");
    expect(est.planes[0].widthM).toBeCloseTo(12, 0);
    expect(est.planes[0].slopeLengthM).toBeCloseTo(4 / Math.cos((35 * Math.PI) / 180), 1);
    expect(orientationLabel(90)).toBe("Est");
  });
});
