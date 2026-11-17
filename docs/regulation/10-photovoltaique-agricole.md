# Photovoltaïque agricole

> Recherche du 17/11/2026. Règles : `src/data/regulation/rules.v1.json` (REGIME_AGRI_HANGAR_NEUF_PC), raccordement : `raccordement.v1.json`.

## Autorisation d'urbanisme
- **Panneaux sur un bâtiment agricole existant** (hangar, stabulation, stockage) : modification de l'aspect extérieur, **déclaration préalable** (R*421-17 a), comme pour une maison ; cerfa 16702. VÉRIFIÉ (règle REGIME_TOITURE_DP, service-public F17578).
- **Hangar neuf portant les panneaux** : construction de plus de 20 m², **permis de construire** (R*421-1), cerfa 13409 (hors maison individuelle). **Architecte obligatoire si la surface de plancher du bâtiment agricole dépasse 800 m²** : VÉRIFIÉ ([service-public F1986](https://www.service-public.gouv.fr/particuliers/vosdroits/F1986), vérifiée le 13/02/2026). En zone A, construction nécessaire à l'exploitation. Génération du permis 13409 : **pas encore disponible** (analyse seulement).
- **Au sol / ombrières** (décret du 13/11/2024, demandes depuis le 01/12/2024) : < 3 kWc et ≤ 1,80 m : aucune formalité (R.421-2) ; 3 kWc à 3 MWc : DP (R.421-9), PC en périmètre patrimonial ; ≥ 3 MWc : PC. Évaluation environnementale systématique au-delà de 1 MWc au sol. [Source](https://www.photovoltaique.info/fr/actualites/detail/urbanisme-rehaussement-du-seuil-du-permis-de-construire-pour-les-ombrieres-et-les-installations-au-sol/). En zone agricole, naturelle ou forestière : agrivoltaïsme / compatibilité avec l'activité agricole (loi 2023-175, décret 2024-318, arrêté du 5/07/2024) : **hors périmètre** de l'application (analyse seulement).

## Déclarant
- Exploitant en nom propre : rubrique 1.1 du cerfa (état civil, date et lieu de naissance).
- Société (EARL, GAEC, SCEA…) : rubrique 1.2 « personne morale » (dénomination, raison sociale, SIRET, type de société, représentant). Champs D2* relevés dans les PDF 16702*03 et 13406*17.

## Électricité
Voir `06-raccordement-consuel.md`, section « Fortes puissances » : rapport de contrôle COFRAC pour les sites agricoles, SC 143 de 36 à 250 kVA, HTA au-delà.

## Prix
Dossier solaire agricole : 239 € TTC (Stripe, formule AGRI).
