import { describe, expect, it } from "vitest";
import { cleanPath } from "./analytics";

describe("mesure d'audience", () => {
  it("ne garde ni paramètres ni ancre dans le chemin", () => {
    expect(cleanPath("/app/dossier/?id=prj_abc&tab=dossier")).toBe("/app/dossier/");
    expect(cleanPath("/verifier/#adresse")).toBe("/verifier/");
    expect(cleanPath("/Déclaration")).toBe("/dclaration");
  });
});
