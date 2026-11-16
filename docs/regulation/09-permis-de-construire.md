# 09 : Agrandissement, garage, véranda : déclaration préalable ou permis de construire

Jeu de règles : `src/data/regulation/rules.extension.v1.json` (version 2026.11.1, publié le 16/11/2026).
Cerfa : 13406*17 (permis de construire une maison individuelle et/ou ses annexes). Le mapping des champs est dans `src/data/cerfa/13406-17.mapping.json` ; il a été relevé et vérifié visuellement page par page le 16/11/2026.

## Seuils

Sources :
- [F36768 véranda](https://www.service-public.gouv.fr/particuliers/vosdroits/F36768), vérifiée le 13/11/2026 ;
- [F36961 garage](https://www.service-public.gouv.fr/particuliers/vosdroits/F36961), vérifiée le 25/09/2026 ;
- [F36777 agrandissement](https://www.service-public.gouv.fr/particuliers/vosdroits/F36777).

| Situation | Régime |
|---|---|
| Zone urbaine (U) d'un PLU, surface créée ≤ 40 m² | Déclaration préalable |
| Zone U, plus de 20 m² de surface de plancher créés **et** total après travaux > 150 m² | Permis de construire |
| Zone U, surface créée > 40 m² | Permis de construire |
| Hors zone U (ou zonage inconnu : seuil prudent), surface créée ≤ 20 m² | Déclaration préalable |
| Hors zone U, surface créée > 20 m² | Permis de construire |
| Bâtiment inscrit monument historique | Permis de construire (notice 51434) |

La « surface créée » retenue est la plus grande des deux valeurs : emprise au sol ou surface de plancher. Pour un garage, F36961 raisonne en emprise au sol.

## Permis de construire

Source : [F1986](https://www.service-public.gouv.fr/particuliers/vosdroits/F1986), vérifiée le 13/02/2026, et cerfa 13406*17.

- **Délai d'instruction :** 2 mois pour une maison individuelle, 3 mois en secteur protégé.
- **Dépôt papier :** 4 dossiers complets, plus 5 exemplaires supplémentaires des plans de situation, de masse et en coupe ; 1 exemplaire de plus en site patrimonial remarquable ou aux abords d'un monument historique (cerfa, cadre 8).
- **Architecte :** obligatoire si la surface de plancher dépasse 150 m² après travaux. En dessous, le particulier coche la déclaration sur l'honneur (cadre 4.1, note [6]).
- **RE 2020 :** l'attestation (PCMI14-1) est à joindre. Elle est établie par un professionnel ; Permizy ne la produit pas. Son applicabilité aux petites extensions est À_VÉRIFIER (Q30).
- **Pièces générées :** PCMI1 situation, PCMI2 masse, PCMI3 coupe, PCMI4 notice, PCMI5 façades et toitures, PCMI6 document graphique (avant/après et insertion), PCMI7 et PCMI8 photographies, cerfa 13406 rempli, bordereau, mandat et courriers.
- **Taxe d'aménagement et déclaration fiscale** dans les 90 jours suivant l'achèvement (cerfa, cadre 8).

## Limites (V1)
- Volume simple : rectangle accolé à une façade, toit plat, monopente ou à deux pentes. Les formes complexes et les étages relèvent d'un architecte.
- La surface de plancher existante est estimée d'après l'emprise BD TOPO (emprise × niveaux × 0,8). Le demandeur doit la confirmer : elle décide du seuil de 150 m².
- Maison neuve sur terrain nu : non couvert (« bientôt »).
