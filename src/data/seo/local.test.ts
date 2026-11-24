import { describe, expect, it } from "vitest";
import { CITIES, LOCAL_FETCHED_AT } from "./local";

describe("pages ville", () => {
  it("chaque ville a des données officielles datées et sourcées", () => {
    expect(LOCAL_FETCHED_AT).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(CITIES.length).toBeGreaterThanOrEqual(10);
    for (const c of CITIES) {
      expect(c.insee, c.slug).toMatch(/^\d[\dAB]\d{3}$/);
      expect(c.mairie?.source, c.slug).toMatch(/^https:\/\/lannuaire\.service-public\.(fr|gouv\.fr)\//);
      if (!c.plu.rnu) expect(c.plu.url, c.slug).toMatch(/^https:\/\/www\.geoportail-urbanisme\.gouv\.fr\/document\/by-id\//);
      const title = `Déclaration préalable à ${c.name} : mairie, PLU, dossier`;
      expect(title.length, c.slug).toBeLessThanOrEqual(60);
    }
  });
});
