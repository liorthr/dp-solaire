# 08 : Fenêtres, portes, volets et fenêtres de toit

Jeux de règles versionnés : `src/data/regulation/rules.menuiserie.v1.json` et `rules.velux.v1.json` (version 2026.11.1, publiés le 14/11/2026). Les contrôles génériques (adresse, parcelle, mandat, photos, ABF, PLU, lotissement, mairie) sont partagés avec le jeu photovoltaïque (champ `generic`).

## Fenêtres, portes, volets : [F36762](https://www.service-public.gouv.fr/particuliers/vosdroits/F36762) (vérifiée le 10/11/2026)

| Situation | Régime appliqué |
|---|---|
| Remplacement à l'identique (même forme, matériau, couleur) | Aucune formalité : la DP n'est exigée que « si vos travaux modifient l'aspect extérieur » |
| Changement de matériau, de couleur, de forme, ou ouverture créée | Déclaration préalable |
| Aspect modifié **et** changement de destination | Permis de construire (hors périmètre) |

Pièces : DP1, DP4 (façades « si vous les modifiez »), DP5, DP11 ; DP6/7/8 si visible ou secteur protégé ; DP2 fourni en complément quand une ouverture est créée.

Contrôles :
- **Vues sur le voisin** ([F76](https://www.service-public.gouv.fr/particuliers/vosdroits/F76), vérifiée le 10/11/2026) :
  - Vue droite : 1,90 m. Vue oblique : 0,60 m. La distance est mesurée de l'ouverture créée à la limite (cadastre DGFiP / BD TOPO).
  - Un jour de souffrance ou une ouverture sans vue n'est pas soumis à ces distances.
  - L'accord écrit du voisin lève l'alerte. Il s'agit de règles de droit civil, indépendantes de l'instruction de la DP.
- **Copropriété** : autorisation de l'assemblée générale si les parties communes (façade) sont touchées (F36762, étape 6).
- **Secteur protégé** : l'ABF est consulté. Les conseils (bois peint, petits bois, coffres de volets non visibles) relèvent de la pratique UDAP et sont À_VÉRIFIER.
- **Matériaux et couleurs** : PLU, lotissement, nuancier (F36762, étape 1). **Coffre de volet roulant** visible : À_VÉRIFIER selon le PLU.

## Fenêtres de toit : [F36766](https://www.service-public.gouv.fr/particuliers/vosdroits/F36766) (vérifiée le 23/01/2025)

| Situation | Régime appliqué |
|---|---|
| Création ou remplacement « par un autre modèle » | Déclaration préalable |
| Avec aménagement des combles (surface de plancher créée) | Déclaration préalable (F36766) ; seuils de surface au-delà desquels un permis serait exigé : À_VÉRIFIER (Q27) |
| Avec changement de destination | Permis de construire (hors périmètre) |
| Remplacement par un modèle identique | Aucune formalité : déduit de F36766, À_VÉRIFIER (Q26) |

Contrôles :
- **Distance de vue** (F36766, « À noter ») : 1,9 m sans se pencher, 0,6 m en se penchant, sauf accord écrit du voisin. La distance est calculée en projection horizontale depuis la position réelle de chaque fenêtre sur le pan de toiture.
- **Secteur protégé** : alerte ABF, avec des conseils de composition (pratique UDAP, À_VÉRIFIER).
- **Combles** : rappel de l'incidence fiscale (centre des impôts fonciers).
- **Copropriété** : la toiture est une partie commune.

Plans générés :
- DP2 : emprise des fenêtres et distance à la limite.
- DP4 :
  - pan de toiture en vraie grandeur, avec les fenêtres cotées depuis l'égout et la rive ;
  - façade côté égout, avant et après.
- Photomontage avec plusieurs fenêtres.

## Limites connues (V1)
- **Menuiseries existantes** : elles ne sont pas relevées automatiquement. La façade principale est pré-remplie, puis l'installateur saisit les types, cotes et positions.
- **Catalogue** de fenêtres de toit générique (tailles courantes du marché), à remplacer par les références fabricant.
- **Pente et dimensions des pans** : estimées à partir de la BD TOPO et modifiables.
