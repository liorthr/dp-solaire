# Délais d'instruction, décision et suites

> Source principale : https://www.service-public.gouv.fr/particuliers/vosdroits/F17578 (vérifiée le 22/10/2026), récépissé intégré au cerfa 16702\*03. Lu le 11/11/2026.

| Élément | Règle | Statut |
|---|---|---|
| Délai de droit commun | **1 mois** à compter du dépôt du dossier complet (R*423-23 a) | VÉRIFIÉ |
| Secteur protégé (SPR, abords MH, site…) | Le service notifie dans le mois suivant le dépôt un délai d'instruction de **2 mois en général** (R423-24 et s.) | VÉRIFIÉ |
| Dossier incomplet | La mairie a 1 mois pour le signaler ; le demandeur a **3 mois** pour compléter, sinon rejet tacite ; le délai démarre à réception des pièces manquantes | VÉRIFIÉ |
| Silence de l'administration | Décision **tacite de non-opposition** à la fin du délai (sauf cas où le silence vaut opposition, signalés dans le mois) | VÉRIFIÉ |
| Certificat de non-opposition | Délivré sur simple demande (R*424-13) | VÉRIFIÉ |
| Retrait | Le maire peut retirer une non-opposition illégale dans les **3 mois** | VÉRIFIÉ |
| Recours des tiers | 2 mois à compter du 1er jour d'un affichage continu sur le terrain (R.600-2) | VÉRIFIÉ |
| Affichage | Panneau > 80 cm, visible de la voie publique, dès la décision ou la fin du délai, pendant toute la durée du chantier ; extrait en mairie sous 8 jours pendant 2 mois | VÉRIFIÉ |
| Validité | Péremption si travaux non commencés sous 3 ans ou interrompus > 1 an ; prorogeable 2 fois 1 an | VÉRIFIÉ |
| Recours contre une opposition | Gracieux 1 mois ; contentieux 2 mois | VÉRIFIÉ |
| ABF : nature de l'avis (conforme en abords MH) | Accord de l'ABF requis en abords MH/SPR (L632-2 C. patrimoine), selon des sources secondaires | À_VÉRIFIER (Q7) |
| Calcul des délais | « de date à date », peut expirer un dimanche ou un jour férié (notice 51434) | VÉRIFIÉ |

## Implémentation (`src/lib/instruction/deadlines.ts`)
- `decisionDate = addMonths(completeDate, baseMonths + majorationMonths)` de date à date ; si le jour n'existe pas dans le mois cible (31 → 30/28), on prend le dernier jour du mois (convention à valider, Q8).
- Une demande de pièces suspend le délai : la nouvelle date de complétude est la date de réception des pièces.
- DAACT : cerfa 13408\*14, à déposer en fin de travaux.
