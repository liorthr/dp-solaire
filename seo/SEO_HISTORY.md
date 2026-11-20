# Journal SEO

Chaque session : date, actions, pages, tests, déploiement, mesures, hypothèses, prochaines actions. Le plus récent en haut.

## Session 1 bis : 20/11/2026 (déblocages)
**Décisions de l'utilisateur** : export Search Console fourni par l'utilisateur ; outil d'audience gratuit au choix ; identité de l'éditeur communiquée ; voix off naturelle et gratuite.

**Actions**
- Mesure d'audience sans cookie dans Supabase : table `analytics_events` (migration `supabase/migrations/0004_analytics.sql`), insertion seule pour les visiteurs, aucune lecture publique, liste d'événements fermée, chemins sans paramètres, aucune IP ni identifiant, respect de Do Not Track / GPC. Événements : pageview, guide_cta, verify_start, verify_verdict, verify_prepare, signup, project_created, pay_click, paid. Requêtes de suivi : `seo/analytics-queries.sql`. Testé en ligne (2 pages vues reçues puis supprimées) ; insertion d'un chemin contenant une adresse refusée par la base ; lecture anonyme vide.
- Pages `/mentions-legales/` et `/a-propos/` (éditeur, SIREN, TVA, siège, hébergeurs, données, mesure d'audience), liens dans le pied de page, Organization enrichie (TVA, adresse, date de création), sitemap.
- Pipeline vidéo `scripts/video/make-video.mjs` (scènes HTML → Playwright, voix edge-tts « fr-FR-RemyMultilingualNeural », FFmpeg 16:9 et 9:16, WebVTT, miniature) ; première vidéo « Les pièces DP1 à DP8 » (85 s, 1,6 Mo) intégrée au guide des pièces : lecteur sans préchargement, sous-titres, transcription HTML, VideoObject, sitemap vidéo.

**Tests** : tsc, eslint, 118 unitaires, 21 E2E. **Déploiement** : en ligne et vérifié (mp4 video/mp4, vtt text/vtt, pages 200).

**À compléter** : dénomination sociale exacte et capital social (mentions légales), adresse email de contact.

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
