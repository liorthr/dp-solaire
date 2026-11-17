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
- > 36 kVA : voir la section « Fortes puissances » ci-dessous (traité depuis le 17/11/2026).
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

## Fortes puissances (> 36 kVA) : VÉRIFIÉ (photovoltaique.info, lu le 17/11/2026)
Sources : [seuils techniques et réglementaires](https://www.photovoltaique.info/fr/realiser-une-installation/raccordement/bien-choisir-sa-puissance-de-raccordement/connaitre-les-seuils-techniques-et-reglementaires/), [raccordement > 36 kVA](https://www.photovoltaique.info/fr/realiser-une-installation/raccordement/raccordement-36-kva/), [HTA](https://www.photovoltaique.info/fr/realiser-une-installation/raccordement/raccordement-en-hta/conditions-specifiques-en-hta/), [Consuel et rapport de contrôle](https://www.photovoltaique.info/fr/realiser-une-installation/regles-conception-mise-en-oeuvre/normes-electriques-applicables-aux-systemes-pv/attestation-consuel-et-rapport-de-controle/).

| Puissance installée (somme des onduleurs, par PDL) | Domaine | Procédure Enedis | Conformité |
|---|---|---|---|
| ≤ 36 kVA | BT (mono jusqu'à 18 kVA ; injection mono limitée à 6 kVA par la DTR Enedis) | Enedis-PRO-RAC_20E, Enedis Connect | Consuel SC 144 |
| 36 à 250 kVA | BT triphasé | Enedis-NMO-RES_030E (NMO-RAC_005E si production + consommation), agence CAP BT ; devis sous 3 mois ; CRD ou CR | Consuel SC 144 + SC 143 |
| 250 kVA à 12 MW (17 MW dérogation) | HTA, poste privé (NF C 13-100 / C 13-200), découplage externe type H, CARD-I MOP-CF_045E/046E | Enedis-NMO-RES_030E | contrôle de conformité (arrêté du 6 juillet 2010), pas d'attestation Consuel (D342-19 : < 250 kVA) |

- Sites soumis au code du travail (« dont font généralement partie les installations agricoles »), ERP… : **rapport de contrôle** par un organisme accrédité COFRAC (DRE 162 et DRE 155, DRE 155B avec stockage).
- Nouvelle attestation si la puissance augmente de 10 % ou si le domaine de tension change (D342-14).
- Passer au-delà de 36 kVA fait perdre le tarif réglementé de vente en consommation ≤ 36 kVA.
- Soutien : ≤ 100 kWc (P+Q) arrêté S21 en guichet ouvert ; **> 100 et ≤ 500 kWc : appel d'offres simplifié « Petit PV »** depuis le 22/09/2025 (complément de rémunération 20 ans) ; > 500 kWc : appels d'offres CRE. [Source](https://www.photovoltaique.info/fr/tarifs-dachat-et-autoconsommation/appels-doffres/appel-doffres-simplifie-100-500-kwc/principes-et-conditions-deligibilite/)
- Calculs de sections au-delà de 63 A : courants admissibles indicatifs (À_VÉRIFIER), la note de l'électricien fait foi.
