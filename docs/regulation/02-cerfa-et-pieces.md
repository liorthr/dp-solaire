# Cerfa en vigueur et pièces du dossier DP

> Recherche du 11/11/2026.

## Formulaire
- **Cerfa n° 16702\*03** : « Déclaration préalable constructions et travaux non soumis à permis de construire ».
  - Fiche officielle : https://www.service-public.gouv.fr/particuliers/vosdroits/R2028 (vérifiée le 19/10/2026 par la DILA). **VÉRIFIÉ**
  - PDF : https://www.formulaires.service-public.gouv.fr/gf/cerfa_16702.do (téléchargé le 11/11/2026, 1,5 Mo, stocké dans `public/cerfa/cerfa_16702-03.pdf`)
  - Notice (n° 51434, commune aux formulaires 16700) : https://www.formulaires.service-public.gouv.fr/gf/getNotice.do?cerfaNotice=51434&cerfaFormulaire=16700
- Remarque : de nombreux sites privés citent encore 13703 ou 16702\*01/\*02. Le produit stocke les versions dans `cerfa_versions` avec un mapping de champs par version, ce qui permet la bascule sans code.
- DAACT : **Cerfa 13408\*14** (https://www.service-public.gouv.fr/particuliers/vosdroits/R1978, vérifié le 19/10/2026). **VÉRIFIÉ**

## Pièces (notice 51434 §3.5, VÉRIFIÉ)
« Seule la pièce DP1 est à joindre obligatoirement dans tous les cas. DP2 n'est nécessaire que lorsque le projet crée une construction ou modifie le volume d'une construction existante. DP5 n'est à fournir que lorsque l'aspect extérieur est modifié. »

| Code | Pièce | Article | Exigence pour panneaux en toiture (lecture produit) |
|---|---|---|---|
| DP1 | Plan de situation (échelle conseillée 1/2 000 à 1/5 000 en ville, 1/20 000 à 1/25 000 en rural ; indiquer les points et angles de prise de vue DP7/DP8) | R.431-36 a) | **Obligatoire** |
| DP2 | Plan de masse (échelle graphique, nord, cotes en 3 dimensions) | R.431-36 b) | Exigé si volume modifié. Pour une toiture, la plupart des mairies l'attendent → produit : **fourni par défaut** (À_VÉRIFIER Q4) |
| DP3 | Plan en coupe | R.431-10 b) | Si le profil du terrain est modifié → **facultatif** en toiture ; fourni en option (profil toiture) |
| DP4 | Plans des façades et toitures (état initial et futur) | R.431-10 a) | **Exigé** : la toiture est modifiée |
| DP5 | Représentation de l'aspect extérieur | R.431-36 c) | **Exigé** : aspect modifié |
| DP6 | Document graphique d'insertion | R.431-10 c) | Exigé si visible depuis l'espace public **ou** en SPR / abords MH (non exigé en périmètre de permis d'aménager) |
| DP7 | Photo environnement proche | R.431-10 d) | Idem DP6 |
| DP8 | Photo paysage lointain | R.431-10 d) | Idem DP6 |
| DP11 | Notice matériaux et modalités d'exécution | — | Exigé dans certains secteurs protégés (À_VÉRIFIER Q5) ; le produit génère toujours une notice descriptive |

Exigence de la notice : les photos DP7/DP8 doivent être des **photographies originales** (pas des photocopies).

## Nombre d'exemplaires (dépôt papier)
- Cas général : **2 exemplaires** (notice 51434, p. 5 ; F17578). **VÉRIFIÉ**
- SPR, abords MH, site classé/inscrit, réserve naturelle : **3 exemplaires** ; cœur de parc national : 4 ; plus **2 exemplaires supplémentaires du plan de situation** (F17578, onglet « Secteur protégé »). **VÉRIFIÉ**

## Mode de dépôt
- Depuis le 01/01/2022, toutes les communes doivent pouvoir recevoir les demandes par voie électronique (SVE) (notice 51434). **VÉRIFIÉ**
- Depuis le **01/01/2025**, dans les communes de plus de 3 500 habitants, les demandes émanant de **personnes morales** doivent, à peine d'irrecevabilité, être adressées par voie électronique (notice 51434 ; F17578). **VÉRIFIÉ** → l'installateur qui dépose comme mandataire en son nom de personne morale doit utiliser le téléservice. Qui est le « déclarant » quand un installateur agit sur mandat ? **À_VÉRIFIER** (Q6).
- Canaux : téléservice communal (GNAU ou autre), AD'AU (https://www.service-public.gouv.fr/particuliers/vosdroits/R52221), email si la mairie l'indique, LRAR, dépôt en main propre (F17578). **VÉRIFIÉ**
