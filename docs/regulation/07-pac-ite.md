# 07 : Pompe à chaleur (PAC) et isolation thermique par l'extérieur (ITE)

Jeux de règles versionnés : `src/data/regulation/rules.pac.v1.json` et `rules.ite.v1.json` (version 2026.11.1).
Ils réutilisent les contrôles génériques du jeu photovoltaïque (adresse, parcelle, mandat, photos, ABF, PLU, mairie…), dont la liste figure dans le champ `generic` de chaque fichier.
Chaque règle porte `source_url`, `valid_from`, `valid_to` et `verification` ; les points incertains sont marqués À_VÉRIFIER et listés dans `docs/open-questions.md` (Q22 à Q25).

## Pompe à chaleur : unité extérieure

| Situation | Régime appliqué | Source |
|---|---|---|
| Unité fixée en façade ou en toiture (modifie l'aspect extérieur) | Déclaration préalable | [F36778](https://www.service-public.gouv.fr/particuliers/vosdroits/F36778) |
| Au sol sur dalle, en secteur protégé | Déclaration préalable | F36778 |
| Au sol, hors secteur protégé | Aucune formalité d'urbanisme : l'application n'en génère pas | F36778 |

Contrôles :
- **Bruit** : rappel systématique, et alerte si l'unité est à moins de 4 m de la limite séparative. La distance est calculée sur le cadastre (DGFiP) et l'emprise BD TOPO (IGN). Le seuil de 4 m est un repère prudent interne, **pas une règle de droit** (À_VÉRIFIER, Q22). La règle applicable est celle de l'émergence du code de la santé publique.
- **Copropriété** : autorisation de l'assemblée générale, selon F36778, qui cite l'article 25 de la loi de 1965.
- **Secteur protégé** (AC1, SPR, sites) : l'ABF est consulté.
- **Façade sur rue et règles du PLU** : rappel, avec le zonage GPU affiché.

Pièces : DP1, DP2, DP4, DP5 et DP11 ; DP6, DP7 et DP8 si les travaux sont visibles depuis l'espace public ou en secteur protégé.

Plans générés :
- DP2 : position de l'unité, avec la distance à la limite la plus proche.
- DP4 : façade avant/après, plus un détail coté de l'unité au 1/20.
- Photomontage : unité en perspective.

## Isolation thermique par l'extérieur

| Situation | Régime | Source |
|---|---|---|
| Cas général : l'aspect extérieur est modifié | Déclaration préalable | [F37924](https://www.service-public.gouv.fr/particuliers/vosdroits/F37924) |
| Bâtiment inscrit au titre des monuments historiques | Permis de construire | [Notice cerfa 51434](https://www.formulaires.service-public.gouv.fr/gf/getNotice.do?cerfaNotice=51434&cerfaFormulaire=16700) |

Contrôles :
- **Surplomb du domaine public** (droit de surplomb communal) et **surplomb de la propriété voisine** (convention avec le voisin) : F37924.
- **Distance aux limites après isolation** : la distance BD TOPO/cadastre, moins l'épaisseur saisie, déclenche une alerte sous 0,5 m. Ce seuil est un repère interne (À_VÉRIFIER).
- **Dérogation aux règles du PLU** (L. 152-5) : ajoute la pièce DP8-1. L'application génère une note-trame que le déclarant doit compléter ; les plafonds de dérogation sont À_VÉRIFIER (Q23).
- **Secteur protégé** : alerte ABF, avec des conseils d'intégration issus de la pratique UDAP (À_VÉRIFIER).
- **Matériaux et couleurs** : rappel du nuancier communal et de l'article « aspect extérieur ».
- **Copropriété** : vote en AG ; la règle de majorité est À_VÉRIFIER (Q24).

Pièces :
- Toujours : DP1, DP2, DP4, DP5 et DP11.
- DP3 (coupe de principe du mur isolé) est fournie en complément.
- DP6, DP7 et DP8 si les travaux sont visibles ou en secteur protégé.
- DP8-1 en cas de dérogation.

## Limites connues (V1)
- Façades issues du rectangle minimal de l'emprise BD TOPO : ouvertures non relevées et façades simplifiées.
- Catalogue PAC générique : à remplacer par les fiches fabricants (dimensions, puissance acoustique).
- Case « DPC8-1 » du cerfa 16702 non identifiée dans le PDF (Q25) : la pièce figure au bordereau.
