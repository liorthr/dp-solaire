# Journal SEO

Chaque session : date, actions, pages, tests, déploiement, mesures, hypothèses, prochaines actions. Le plus récent en haut.

## 24/11/2026 : option « pack raccordement Enedis + Consuel » (39 € TTC)
- Stripe (mode test) : produit « Pack raccordement Enedis + Consuel » 39 € ; liens de paiement : DP solaire 49 € avec l'option (article optionnel « Ajouter »), agricole 239 € avec l'option, pack seul 39 € (achat après coup). Variables `NEXT_PUBLIC_STRIPE_LINK_DP_PV`, `NEXT_PUBLIC_STRIPE_LINK_AGRI` (nouveau lien), `NEXT_PUBLIC_STRIPE_LINK_RAC`.
- Base : colonne `payments.options` (migration 0005). Webhook : montant → formule et options (49, 88, 149, 239, 278, 39 €), lecture du montant en euros d'origine en cas de conversion de devise ; test qui vérifie la cohérence des prix affichés et du webhook.
- Application : génération du pack réservée aux acheteurs de l'option (calculs et contrôles gratuits) ; offre à 39 € dans l'étape Raccordement ; mention de l'option dans l'encart de paiement (y compris avant que le dossier soit prêt) ; page Tarifs et llms.txt.
- Tests en ligne : particulier avec option (88 € enregistrés, pack généré) ✅ ; professionnel achetant le pack seul (39 €) ✅ ; agricole (option annoncée, 239 €) ✅ ; guide et pages publiques ✅. Comptes de test, photos et événements d'audience supprimés.
- À suivre : taux de prise de l'option (événements `pay_click` libellés `rac`, `paid` libellés `dossier-rac` / `rac`).

## 24/11/2026 : mise en ligne de la session 2 et tests du parcours client en production
- **Déploiement** de la session 2 (commit 11dbb79), puis du correctif e0d53ab ; crawl : 25 pages en 200, 0 orpheline.
- **Tests de bout en bout sur permizy.com** (`e2e/live.spec.ts`, ignoré par défaut ; `LIVE_PASSWORD=… E2E_BASE_URL=https://permizy.com npx playwright test e2e/live.spec.ts`) :
  1. Particulier : accueil → verdict → inscription → dossier → photomontage → cerfa complété → paiement Stripe (carte de test) → PDF + ZIP → email mairie (.eml) → « J'ai déposé » → suivi → reconnexion sur un autre appareil : ✅ ordinateur et mobile.
  2. Professionnel : inscription → dossier client solaire → pack raccordement/Consuel → paywall 49 € : ✅
  3. Agricole : carte de l'accueil → inscription pro → EARL → paywall 239 € : ✅
  4. Guide SEO : encart adresse → vérification → verdict : ✅ ordinateur et mobile.
  5. 11 pages publiques : 200, H1, aucune erreur JavaScript : ✅ ordinateur et mobile.
- **Bug corrigé** : sur mobile, l'indicateur « Sauvegardé en ligne » était masqué ; il est désormais visible (version courte « ✓ Sauvegardé »).
- Vérifié : paiements enregistrés par le webhook (49 € DP), dossiers et photos synchronisés ; un dossier fermé avant la fin de la synchronisation est bien envoyé à la connexion suivante.
- Mesure d'audience : tous les événements de l'entonnoir ont été reçus (inscriptions, dossiers, clics paiement, paiements) ; remarque : `verify_start` n'est émis que si les travaux sont choisis dans `/verifier/` (pas depuis l'accueil ou un guide, qui fournissent déjà les travaux).
- Nettoyage : 8 comptes de test, leurs dossiers, paiements et 26 photos supprimés ; événements d'audience des tests supprimés (fenêtre du 24/11 à partir de 10 h 05 UTC environ).
- Reste : 1 photo orpheline (compte de test supprimé le 16/11) à retirer avec un accès administrateur au stockage.

## Session 2 : 23-24/11/2026
**Audit différentiel** : 23 pages en 200, 0 orpheline, 0 lien cassé ; seul title > 65 car. : `/verifier/` (67, accepté). Audience (Supabase, 20 au 23/11) : 34 pages vues, quasi toutes en accès direct (tests et vérifications internes probables), 1 venue de tiktok.com, 0 événement de conversion : volume trop faible pour conclure. Search Console : export non reçu.

**Actions**
- B03 : encart « Et chez vous, que dit la règle ? » dans les guides (`src/components/seo/GuideQuickCheck.tsx`) : adresse (BAN) → `/verifier/?w=…` avec l'adresse reprise (saute l'étape adresse) ; choix des travaux sur les guides génériques ; événement `guide_cta`. Le guide agricole garde son parcours professionnel.
- B04 : pilier `/permis-de-construire-maison/` (seuils, cerfa 13406/13409, pièces PCMI, architecte 150 m² / 800 m² agricole, délai 2 mois / 3 mois, exemplaires, taxe d'aménagement) ; maillage depuis l'extension et le pilier DP.
- B05 : guide `/refus-declaration-prealable/` relu sur service-public F17578 (vérifiée le 22/10/2026) : décisions possibles, retrait 3 mois, recours gracieux 1 mois, hiérarchique (commune sans PLU), contentieux 2 mois, Rapo auprès du préfet de région si avis défavorable de l'ABF, Télérecours citoyens.
- B13 : `public/llms.txt` (description factuelle, tarifs, liste des 16 guides) + test qui échoue si un guide y manque.
- B10 : infographies verticales pour mobile (`*-mobile.svg`, servies par `<picture>` sous 640 px).

**Tests** : 119 unitaires, 21 E2E + 4 nouveaux (`e2e/seo.spec.ts`), tsc, eslint.
**Déploiement** : effectué le 24/11/2026 (voir entrée ci-dessus).

**Prochaine session** : déployer puis vérifier en ligne (crawl + Lighthouse : surveiller le poids du JavaScript ajouté par l'autocomplétion sur les guides) ; B06 checklist PDF ; B07 exemples visuels DP1/DP2/DP4/DP6 ; vidéo « Pompe à chaleur / climatisation » ; lecture de l'audience.

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
