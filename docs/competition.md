# Analyse concurrentielle (sources publiques, 11/11/2026)

> Prix relevés sur les pages publiques des acteurs (via moteur de recherche), susceptibles d'avoir changé. Aucune donnée non publique. Aucun scraping.

| Acteur | Positionnement | Prix affiché | Source |
|---|---|---|---|
| **V2E** | Cité dans le brief comme prestataire manuel pour installateurs | **Aucune information publique trouvée** lors de nos recherches (offre, prix, avis) | Recherche web « V2E déclaration préalable panneaux solaires » : aucun résultat pertinent → À_VÉRIFIER |
| DPT Solaire | Outil en ligne générant la DP toiture (+ Consuel, extensions) | Particulier 19 € puis 39 €/DP (offre beta) ; offre pro sans prix visible | https://dpt-solaire.fr/ ; https://www.blog.dpt-solaire.fr/declaration-prealable-travaux-panneaux-solaires/ |
| Dossier Solaire | Service particuliers et pros | DP à partir de 70 € | https://dossiersolaire.fr/ |
| Permis Mairie | Dossier en ligne | 39 €/dossier ; abonnements Pro 79 € et Enterprise 149 € (période non précisée) | https://permismairie.com/blog/declaration-prealable-panneaux-solaires |
| Urbassist | Dossier complet réalisé par le service | 89 € | https://blog.urbassist.fr/exemple-de-declaration-prealable-panneaux-solaires/ |
| Kreativ Jungle | Prestataire graphique | 100 € TTC (hors secteur protégé) ; 180 € TTC (zone ABF) | https://kreativjungle.fr/declaration-prealable-photovoltaique |
| Bureaux d'études (référence marché) | Manuel | 80 à 200 €/dossier, 1 à 2 semaines (chiffre publié par un concurrent, non vérifié) | blog DPT Solaire |

Constats : le marché est soit **manuel** (délai de plusieurs jours, 80 à 200 €), soit outillé en **générateur de documents** sans analyse réglementaire transparente ni suivi d'instruction. Aucun acteur trouvé ne publie sa base de règles ni ne calcule automatiquement le périmètre ABF à partir des SUP officielles.

## 3 axes de différenciation reflétés dans le produit
1. **Rapidité et automatisation de bout en bout** : adresse → enrichissement (BAN, cadastre, GPU, BD TOPO, Géorisques, mairie) → plans DP1 à DP8 → cerfa → PDF+ZIP → courrier en quelques minutes, sans aller-retour avec un prestataire. Mesure affichée sur le tableau de bord : « temps gagné ».
2. **Transparence des règles** : chaque contrôle affiche sa source officielle (URL et date), son statut (VÉRIFIÉ / À_VÉRIFIER) et sa version. Le score de passage est explicable facteur par facteur et jamais présenté comme une garantie. Back-office des règles versionnées.
3. **Suivi après dépôt** (absent des générateurs) : calcul des délais (majoration ABF, suspension), alerte de décision tacite, module de pièces complémentaires, attestation de non-opposition, DAACT. Plus un **prix** compétitif : abonnement + paiement au dossier, sous les 39 à 89 € observés (grille indicative dans `src/data/pricing.ts`, à valider).
