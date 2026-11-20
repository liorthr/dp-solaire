# Journal SEO

Chaque session : date, actions, pages, tests, déploiement, mesures, hypothèses, prochaines actions. Le plus récent en haut.

## Session 1 : 20/11/2026 (mise en place)
**Contexte** : propriété Search Console validée par DNS (TXT `google-site-verification`, à ne pas supprimer). Avant cette session : 13 guides, sitemap, robots, JSON-LD, redirection www, Lighthouse 98-100.

**Actions**
- Système SEO persistant : `CLAUDE.md` (déclencheur), `seo/` (plan, audit, backlog, mots-clés, calendrier, KPI, charte, sources), crawler réutilisable `scripts/seo-crawl.py`.
- `/verifier/` : premier écran rendu au build (H1, choix des travaux en liens) + section serveur « Comment fonctionne la vérification gratuite » avec liens vers 8 guides : 11 → 247 mots, 0 → 1 H1. H1 du parcours aligné.
- Nouveau pilier `/declaration-prealable-travaux/` (1 012 mots, tableau des travaux, dépôt, étapes, FAQ, 4 sources officielles) ; lien « pilier » ajouté dans 8 guides.
- 2 infographies SVG originales : `public/guides/etapes-declaration-prealable.svg` (pilier), `public/guides/seuils-extension-dp-permis.svg` (guide extension), avec alt, légende, lazy loading, dimensions.
- Métadonnées : description par défaut 167 → 157 car. ; description propre aux CGU ; suffixe « | Permizy » seulement s'il tient (titles longs).

**Tests** : tsc, eslint, 117 tests unitaires, 21 E2E (build sans cloud), 0 erreur console sur `/verifier/`, rendu mobile vérifié (iPhone 13).
**Déploiement** : Hostinger, archive statique ; vérifié en ligne par crawl (20 pages 200 puis 21, 0 orpheline).
**Mesures** : Lighthouse avant/après dans `seo/SEO_KPI.md`. Search Console et audience : non disponibles.

**Hypothèses à vérifier** : le pilier captera « déclaration préalable de travaux » sans cannibaliser l'accueil (« … en ligne ») → contrôler dans Search Console (requêtes par page) dans 4 semaines.

**Prochaine session** : B03 (encart adresse dans les guides), B04 (pilier permis de construire), B05 (refus / recours) ; si l'accès est donné : B01 (Search Console) et B02 (mesure des conversions).
