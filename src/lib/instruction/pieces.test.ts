import { describe, expect, it } from "vitest";
import { analyzeLetter } from "./pieces";

describe("analyse heuristique des courriers", () => {
  it("demande de pièces : détecte les pièces et le motif ABF", () => {
    const r = analyzeLetter(
      "Madame, Monsieur, votre dossier DP 080 021 26 X0042 est incomplet. Veuillez nous transmettre : le plan de masse (DPC2) coté, une notice précisant les matériaux, et un document graphique d'insertion. L'Architecte des Bâtiments de France sera consulté. Vous disposez d'un délai de trois mois.",
    );
    expect(r.kind).toBe("demande_pieces");
    expect(r.requestedPieces.map((p) => p.code)).toEqual(["DP2", "DP6", "DP11"]);
    expect(r.motifs).toContain("Avis de l'Architecte des Bâtiments de France");
    expect(r.deadlineMonths).toBe(3);
  });
  it("opposition avec motif d'aspect", () => {
    const r = analyzeLetter("Arrêté d'opposition : les panneaux, par leur couleur bleutée et leur dispersion sur la toiture, portent atteinte au monument historique.");
    expect(r.kind).toBe("opposition");
    expect(r.motifs).toEqual(expect.arrayContaining(["Aspect / couleur des panneaux", "Implantation / composition du champ de panneaux"]));
  });
  it("texte vide : confiance faible", () => {
    expect(analyzeLetter("Bonjour").confidence).toBe("faible");
  });
});
