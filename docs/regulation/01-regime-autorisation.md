# Régime d'autorisation d'urbanisme : photovoltaïque

> Recherche effectuée le **11/11/2026**. Chaque affirmation est suivie de sa source.
> Statuts : **VÉRIFIÉ** (lu sur une source officielle), **À_VÉRIFIER** (source secondaire ou texte consolidé non relu).
> Les règles opérationnelles correspondantes sont dans `src/data/regulation/rules.v1.json` (champ `source_url`, `valid_from`, `valid_to`).

## 1. Panneaux en toiture sur une construction existante

| Cas | Formalité | Référence | Statut | Source |
|---|---|---|---|---|
| Travaux modifiant l'aspect extérieur d'un bâtiment existant (pose de panneaux en toiture) | Déclaration préalable | Art. R*421-17 a) C. urb. | VÉRIFIÉ | Notice cerfa 51434 (16702/16700), §2.2 5) « Les travaux ayant pour effet de modifier l'aspect extérieur… → Déclaration préalable (R. 421-17 a) » : https://www.formulaires.service-public.gouv.fr/gf/getNotice.do?cerfaNotice=51434&cerfaFormulaire=16700 |
| « Panneau solaire sur le toit » listé comme travaux relevant de la DP | Déclaration préalable | — | VÉRIFIÉ | https://www.service-public.gouv.fr/particuliers/vosdroits/F17578 (vérifié le 22/10/2026 par la DILA) |
| Travaux sur un **immeuble inscrit** au titre des monuments historiques | Permis de construire | Art. R*421-16 | VÉRIFIÉ (notice) | Notice 51434 §2.2 5) |
| Bâtiment **classé** monument historique | Autorisation au titre du code du patrimoine (hors DP) | C. patrimoine L621-9 | À_VÉRIFIER | — |
| Création de surface de plancher/emprise > 20 m² (ex. ombrière fermée, extension) | Permis de construire | R*421-14 a) | VÉRIFIÉ (notice) | Notice 51434 §2.2 1) |
| Élément identifié par le PLU comme présentant un intérêt patrimonial (L151-19) | Déclaration préalable | R*421-17 d) et e) | VÉRIFIÉ (notice) | Notice 51434 §2.2 5) |

**Conséquence produit** : le parcours V1 « toiture d'une maison existante » génère une DP. Si l'utilisateur coche « immeuble inscrit/classé MH » ou si une source signale le bâtiment comme MH, le moteur bloque (`REGIME_PC_MH_INSCRIT`) et n'émet pas de dossier DP.

### Dispense de formalité en toiture ?
Plusieurs sources secondaires évoquent une dispense pour certains panneaux sur construction existante. La notice officielle ne la mentionne pas pour la toiture ; service-public classe le « panneau solaire sur le toit » dans les travaux soumis à DP. → **À_VÉRIFIER** (open-questions Q1). Le produit considère que la DP est requise (approche prudente).

## 2. Ouvrages solaires au sol et ombrières (V1.5, architecture prête)

Source : Notice 51434 §2.1 19) (VÉRIFIÉ, lu le 11/11/2026).

| Puissance crête | Hauteur | Secteur | Formalité | Article |
|---|---|---|---|---|
| < 3 kWc | ≤ 1,80 m | hors secteur protégé | Aucune | R. 421-2 c) |
| < 3 kWc | > 1,80 m possible | hors secteur protégé | DP | R. 421-9 h) |
| ≥ 3 kWc et < 3 MWc | toute | hors secteur protégé | DP | R. 421-9 h) |
| ≥ 3 MWc | toute | — | Permis de construire | R. 421-1 |
| < 3 kWc | toute | SPR, abords MH, site classé/instance, réserve naturelle, cœur de parc national | DP | R. 421-11 I b) |
| ≥ 3 kWc | toute | idem | Permis de construire | R. 421-1 |

Le relèvement du seuil 1 MWc → 3 MWc résulte du décret n° 2024-1023 du 13/11/2024 (applicable aux demandes déposées à compter du 01/12/2024) d'après des sources secondaires concordantes ; la notice officielle confirme le seuil de 3 MWc. Date d'effet exacte : **À_VÉRIFIER** (Q2).

## 3. Règles d'aspect et énergies renouvelables
- Art. L111-16 C. urb. : l'autorisation ne peut s'opposer à l'installation de dispositifs de production d'énergie renouvelable au titre des règles d'aspect extérieur du PLU, sauf exceptions de L111-17 (abords MH, SPR, sites inscrits/classés, périmètres délimités par le PLU…). Sources secondaires concordantes (Congrès des notaires, culture.gouv.fr). Texte consolidé non relu : **À_VÉRIFIER** (Q3).
  - Utilisation produit : message d'aide « hors secteur protégé, la mairie ne peut en principe s'opposer à vos panneaux pour un motif d'aspect », jamais présenté comme garanti.

## 4. Code de l'urbanisme : articles cités dans l'app
| Article | Objet | Lien |
|---|---|---|
| R*421-17 | DP travaux sur construction existante | https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000034355355 |
| R*423-23 | Délai d'instruction de droit commun | https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006819920 |
| R423-24 à R*423-33 | Majorations de délai | https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006074075/LEGISCTA000006188186/ |
| R*424-13 | Certificat de non-opposition tacite | https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000037215370 |
| R431-35, R431-36 | Contenu du dossier de DP | via notice 51434 |

Liens Légifrance extraits de la fiche F17578 (rubrique « Textes de référence »). Legifrance renvoie 403 aux robots : texte consolidé non relu directement.
