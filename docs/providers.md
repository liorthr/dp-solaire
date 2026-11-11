# Sources de données (providers)

Testées en direct le 11/11/2026 depuis l'environnement de build. Chaque provider vit dans `src/lib/providers/<nom>.ts` et implémente l'interface commune `Provider` (`src/lib/providers/types.ts`) : timeout, retries exponentiels, cache (mémoire + localStorage, TTL), fixtures pour les tests, et résultat `degraded` avec saisie manuelle en cas d'échec.

| Provider | Endpoint | Licence / conditions | CORS navigateur | Statut V1 |
|---|---|---|---|---|
| **BAN** géocodage | `https://api-adresse.data.gouv.fr/search/`, `/reverse/` | Licence Ouverte Etalab 2.0. Limite publique ~50 req/s/IP (À_VÉRIFIER) | Oui (`*`) | Actif |
| **Cadastre** (API Carto IGN) | `https://apicarto.ign.fr/api/cadastre/parcelle?geom=` | Licence Ouverte (données DGFiP/IGN) | Oui | Actif |
| **GPU** zonage, document, SUP, prescriptions | `https://apicarto.ign.fr/api/gpu/{zone-urba,document,municipality,assiette-sup-s,assiette-sup-l,assiette-sup-p,generateur-sup-s,prescription-surf,info-surf}?geom=` | Licence Ouverte. Champ `nomsuplitt` mal encodé (latin-1/UTF-8), corrigé dans l'adaptateur | Oui | Actif |
| **Règlement PLU (PDF)** | `https://data.geopf.fr/annexes/gpu/documents/{partition}/{gpu_doc_id}/{nomfic}` | Licence Ouverte | Oui | Lien + lecture IA (serveur) |
| **Liste des pièces GPU** | `https://www.geoportail-urbanisme.gouv.fr/api/document/{id}/files` | — | À tester | Optionnel |
| **BD TOPO bâtiments** (Géoplateforme WFS) | `https://data.geopf.fr/wfs/ows?…TYPENAMES=BDTOPO_V3:batiment` : emprise, `hauteur`, altitudes toit/sol | Licence Ouverte (IGN, données libres depuis 2021) | Oui | Actif |
| **Fonds de carte** (WMTS) | `https://data.geopf.fr/wmts` : `GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2`, `ORTHOIMAGERY.ORTHOPHOTOS`, `CADASTRALPARCELS.PARCELLAIRE_EXPRESS` | Licence Ouverte, attribution « © IGN » | Oui | Actif (carte + DP1) |
| **Géorisques** | `https://georisques.gouv.fr/api/v1/gaspar/risques?code_insee=` | Licence Ouverte | Oui | Actif (informatif) |
| **Annuaire de l'administration** | `https://api-lannuaire.service-public.fr/api/explore/v2.1/catalog/datasets/api-lannuaire-administration/records?where=…` : mairie, email, horaires, `sve` | Licence Ouverte (DILA) | **Non** | Instantané pré-chargé pour les communes de démo et proxy serveur `/api/proxy/annuaire` si déployé avec serveur ; sinon saisie manuelle et lien lannuaire.service-public.gouv.fr |
| **PVGIS** (JRC) | `https://re.jrc.ec.europa.eu/api/v5_2/PVcalc` | Usage libre, citer la source | **Non** | Proxy serveur ; en statique, estimation dégradée par latitude (documentée) |
| **Mérimée / POP** | `data.culture.gouv.fr` redirige vers `culture.data.gouv.fr` (hôte non autorisé dans l'environnement de build) | Licence Ouverte | ? | Non branché : la détection ABF repose sur les SUP AC1 du GPU, plus officielles. À brancher en V1.1 (Q9) |
| **Google Solar API** | clé requise | Payant, conditions Google | — | Interface prête, désactivé |
| **Claude (IA)** | API Anthropic, routes serveur `/api/ai/*`, sorties validées Zod | Clé requise | — | Désactivé sans `ANTHROPIC_API_KEY` |
| **Signature** | `SimpleSignatureProvider` : tracé, horodatage, SHA-256 | — | — | Actif ; Yousign/Docusign : interface `SignatureProvider` |
| **Email** | Resend/SMTP via `/api/mail/send` | Clé requise | — | En statique : mailto + fichier .eml, avec validation humaine |

## Règle de résolution des divergences (documentée, implémentée dans `src/lib/enrichment/merge.ts`)
1. **Saisie manuelle de l'utilisateur** : elle prime toujours et est tracée.
2. **Source réglementaire officielle opposable** : GPU (SUP, zonage du document en vigueur).
3. **Référentiel IGN** : BD TOPO, cadastre.
4. **Calcul dérivé** : distance au générateur, estimations.
Toute divergence (ex. AC1 absente mais monument à moins de 500 m) produit une alerte « À vérifier », avec les deux valeurs affichées.

## Fixtures
`src/lib/providers/__fixtures__/` contient les réponses réelles enregistrées le 11/11/2026 pour les 3 adresses de démo (voies publiques, aucune donnée personnelle). Mode fixtures : `NEXT_PUBLIC_PROVIDER_MODE=fixtures`.
