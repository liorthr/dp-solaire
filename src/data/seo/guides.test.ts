import { describe, expect, it } from "vitest";
import { GUIDES } from "./guides";

describe("guides SEO", () => {
  it("titres, descriptions et liens internes valides", () => {
    const slugs = new Set(GUIDES.map((g) => g.slug));
    expect(slugs.size).toBe(GUIDES.length);
    for (const g of GUIDES) {
      expect(g.slug).toMatch(/^[a-z0-9-]+$/);
      expect(g.title.length, g.slug).toBeLessThanOrEqual(60);
      expect(g.description.length, g.slug).toBeGreaterThanOrEqual(110);
      expect(g.description.length, g.slug).toBeLessThanOrEqual(160);
      expect(g.faq.length, g.slug).toBeGreaterThanOrEqual(2);
      expect(g.sources.length, g.slug).toBeGreaterThanOrEqual(1);
      for (const r of g.related) expect(r === "tarifs" || slugs.has(r), `${g.slug} → ${r}`).toBe(true);
    }
  });
});
