# Raccordement au réseau, attestation Consuel et contrat d'achat

> Recherche du 12/11/2026. Règles opérationnelles : `src/data/regulation/raccordement.v1.json`. Calculs : `src/lib/elec/calc.ts`.

## Attestation de conformité Consuel : VÉRIFIÉ
- Toute installation de production < 250 kVA raccordée au réseau public et requérant une modification de l'installation intérieure doit disposer, **avant sa mise sous tension**, d'une attestation de conformité visée par le Consuel. Attestation **bleue** (Cerfa 15523) sans stockage, **violette** (Cerfa 15524) avec stockage. Contrôle sur site : environ 20 % des dossiers pour les installateurs professionnels. Source : https://www.photovoltaique.info/fr/realiser-une-installation/regles-conception-mise-en-oeuvre/normes-electriques-applicables-aux-systemes-pv/attestation-consuel-et-rapport-de-controle/
- Dossier technique à joindre (tableau officiel, https://www.consuel.com/dossiers-techniques/, lu le 12/11/2026) :

| Installation | Dossier technique | Attestation |
|---|---|---|
| Micro-onduleurs, sans batterie | SC 144C2-2 | bleue |
| Micro-onduleurs + stockage à micro-onduleur chargeur couplé en AC | SC 144C2-2 | violette |
| Hors micro-onduleurs, sans batterie | SC 144A-5 (« sans protection surintensité côté DC ») | bleue |
| Hors micro-onduleurs, avec batterie | SC 144C-5 | violette |
| Raccordement « cas 4 » | + SC 144E (partie 2) + schéma | : |
| Puissance surveillée (> 36 kVA) | + SC 143 | : |

- Le SC 144A **ne concerne pas** les micro-onduleurs (aide au remplissage, juin 2026).
- Cas de raccordement 1 à 4 (§ 551.7 NF C 15-100-1), avec In protection ≤ Ir AGCP en cas 1 et 2 (formulaires SC 144).
- Découplage intégré : joindre le certificat EN 50549-1 traduit en français ; il devra couvrir la NF EN 50549-10 **à compter du 01/01/2027** pour P ≤ 36 kVA (aide SC 144A, rubrique 5).
- Les PDF officiels ne sont **pas** des formulaires remplissables : les valeurs sont apposées à des coordonnées versionnées (`src/data/consuel/sc144.mapping.json`). SC 144C-5 (batterie) : formulaire vierge + note de calcul (pré-remplissage à venir).

## Raccordement Enedis ≤ 36 kVA : VÉRIFIÉ (photovoltaique.info, Hespul/ADEME)
- Demande en ligne sur **Enedis Connect**, procédure **Enedis-PRO-RAC_20E**. Options : injection de la totalité, injection du surplus, sans injection.
- **Sans injection** : déclaration obligatoire ; l'acceptation de la déclaration complète vaut **CACSI** ; aucun frais de gestion/comptage au titre de la production ; compteur électromécanique remplacé par Enedis. https://www.photovoltaique.info/fr/realiser-une-installation/raccordement/raccordement-inf-36-kva/sans-injection/
- Surplus cédé gratuitement à Enedis possible pour P ≤ 3 kW.
- > 36 kVA : autre procédure (hors V1, bloquant dans l'application).
- Production ≤ puissance souscrite en autoconsommation totale (FAQ photovoltaique.info) : **À_VÉRIFIER** sur le texte Enedis.
- Pièces exactes de complétude (autorisation d'urbanisme, etc.) : **À_VÉRIFIER** dans Enedis-PRO-RAC_20E (Q19).

## Contrat d'achat : arrêté du 1er juin 2026 modifiant S21 : VÉRIFIÉ
https://www.photovoltaique.info/fr/actualites/detail/arrete-s21-detail-des-modifications-et-nouveau-tarif-unique/
- Demandes complètes de raccordement à partir du **05/06/2026**, ≤ 100 kWc : **tarif unique 1,1 c€/kWh**, indexé **+2 %/an**, sans prime à l'investissement ; plafond de 1 600 kWh/kWc.an rémunérés.
- Vente de la totalité ≤ 9 kWc : **non éligible**.
- La demande complète de raccordement **vaut demande de contrat d'achat** si le producteur le demande ; le contrat démarre à la mise en service (date d'autorisation d'injecter).
- Attestation Consuel fournie à l'acheteur obligé seulement sur demande.

## Hypothèses de calcul (À_VÉRIFIER, affichées dans la note de calcul)
Iscmax = 1,25 × Isc STC ; Uocmax = Voc × n × (1 + |coef| × (25 − (−10))) ou × 1,2 si coef inconnu ; chute de tension AC ≤ 1 % ; courants admissibles indicatifs.
