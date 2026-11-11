import { describe, expect, it } from "vitest";
import { apply, homography, invert, isConvexQuad, type Pt } from "./homography";
import { assessQuality, laplacianVariance, luminance, meanOf } from "./quality";

describe("homographie", () => {
  const unit: Pt[] = [[0, 0], [1, 0], [1, 1], [0, 1]];
  const quad: Pt[] = [[100, 50], [400, 80], [420, 300], [80, 260]];
  it("envoie les 4 coins sur le quadrilatère", () => {
    const H = homography(unit, quad);
    unit.forEach((p, i) => {
      const q = apply(H, p);
      expect(q[0]).toBeCloseTo(quad[i][0], 6);
      expect(q[1]).toBeCloseTo(quad[i][1], 6);
    });
  });
  it("inverse correcte", () => {
    const H = homography(unit, quad);
    const back = apply(invert(H), apply(H, [0.3, 0.7]));
    expect(back[0]).toBeCloseTo(0.3, 6);
    expect(back[1]).toBeCloseTo(0.7, 6);
  });
  it("refuse des points alignés", () => {
    expect(() => homography(unit, [[0, 0], [1, 1], [2, 2], [3, 3]])).toThrow();
  });
  it("convexité et ordre", () => {
    expect(isConvexQuad(quad)).toBe(true);
    expect(isConvexQuad([[0, 0], [1, 1], [1, 0], [0, 1]])).toBe(false);
  });
});

describe("qualité photo", () => {
  const mk = (w: number, h: number, f: (x: number, y: number) => number) => {
    const a = new Uint8ClampedArray(w * h * 4);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const v = f(x, y), i = (y * w + x) * 4;
      a[i] = a[i + 1] = a[i + 2] = v; a[i + 3] = 255;
    }
    return luminance(a, w, h);
  };
  it("image uniforme sombre = floue et sombre", () => {
    const lum = mk(50, 50, () => 20);
    const q = assessQuality({ width: 2000, height: 1500, brightness: meanOf(lum), sharpness: laplacianVariance(lum, 50, 50) }, "facade");
    expect(q.ok).toBe(false);
    expect(q.issues.map((i) => i.code)).toEqual(["sombre", "flou"]);
    expect(q.issues[0].message).toMatch(/plein jour/);
  });
  it("damier contrasté = net", () => {
    const lum = mk(50, 50, (x, y) => ((x + y) % 2 ? 200 : 60));
    expect(laplacianVariance(lum, 50, 50)).toBeGreaterThan(1000);
    const q = assessQuality({ width: 2000, height: 1500, brightness: meanOf(lum), sharpness: laplacianVariance(lum, 50, 50) }, "facade");
    expect(q.ok).toBe(true);
  });
  it("résolution trop faible et portrait", () => {
    const q = assessQuality({ width: 600, height: 800, brightness: 120, sharpness: 500 }, "facade");
    expect(q.issues.map((i) => i.code)).toEqual(["resolution", "cadrage"]);
  });
});
