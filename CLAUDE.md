# Permizy : instructions permanentes pour Claude

Permizy (https://permizy.com) prépare des dossiers d'urbanisme (déclaration préalable, permis de construire, solaire agricole, raccordement/Consuel) à partir d'une adresse. Next.js 16 en export statique (`npm run build:static`), Supabase (comptes, sauvegarde), Stripe (paiement au dossier), hébergement Hostinger (archive statique). Contenu en français.

## Règles absolues
- **Aucune invention réglementaire** : toute règle cite une source officielle (Légifrance, service-public, notice cerfa, Géoportail de l'Urbanisme, photovoltaique.info). Incertain → « À_VÉRIFIER » + question dans `docs/open-questions.md`, jamais publié comme certain. Notes vérifiées : `docs/regulation/*.md`.
- **Secrets** uniquement en variables d'environnement (`.env.production.local`, ignoré par git) ; ne jamais les afficher.
- **Aucun envoi automatique** (mairie, Enedis, Consuel) sans clic de confirmation de l'utilisateur.
- Données personnelles : minimisation, données fictives dans les exemples et fixtures, jamais d'adresse d'utilisateur dans une URL ou un outil tiers.
- Ne pas modifier les tarifs (49 € DP, 149 € PC, 239 € agricole : `src/lib/cloud/prices.ts`) ni les promesses commerciales sans instruction.
- Tester avant de déployer : `npx tsc --noEmit`, `npx eslint src`, `npx vitest run`, puis E2E sur un build **sans** variables cloud :
  `NEXT_PUBLIC_SUPABASE_URL= NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY= NEXT_PUBLIC_STRIPE_LINK_DP= NEXT_PUBLIC_STRIPE_LINK_PC= NEXT_PUBLIC_STRIPE_LINK_AGRI= NEXT_PUBLIC_BASE_PATH= npm run build:static && npx playwright test --trace off`
- Déploiement de production : `NEXT_PUBLIC_BASE_PATH= npm run build:static`, zip du dossier `out/` (contient `.htaccess`), upload TUS Hostinger (`hosting_files_generate-upload-url`, en-têtes `X-Auth` et `X-Auth-Rest`), puis `hosting_websites_deploy-static-site-archive` ; vérifier ensuite les URLs en ligne.

## DÉCLENCHEUR SEO
Quand l'utilisateur écrit « Améliore le SEO de mon site » (ou une formulation proche), lancer une **session SEO** sans redemander le contexte :
1. Lire `seo/SEO_HISTORY.md` (dernier état), `seo/SEO_BACKLOG.md`, `seo/SEO_KPI.md`, `seo/SEO_MASTER_PLAN.md` (semaine en cours de la feuille de route).
2. Audit **différentiel** : `python3 -I scripts/seo-crawl.py` (statuts, titles, H1, canonicals, liens internes, orphelines), Lighthouse sur 2 à 3 pages, données Search Console / Analytics si disponibles. Ne pas refaire l'audit complet.
3. Choisir 3 à 5 actions au meilleur score du backlog (impact SEO, impact conversion, confiance, effort, risque) ; préférer corriger et améliorer l'existant avant de créer.
4. Exécuter réellement (code, contenus, visuels), contenus réglementaires uniquement depuis des sources vérifiées.
5. Tests complets, build, déploiement si tout est vert, vérification en ligne.
6. Mettre à jour `seo/SEO_HISTORY.md`, `seo/SEO_BACKLOG.md`, `seo/SEO_KPI.md` (+ mots-clés, calendrier si besoin), committer et pousser.
7. Finir par le **RAPPORT SEO PERMIZY — [DATE]** (format dans `seo/SEO_MASTER_PLAN.md`), sans jamais inventer de chiffres (« non disponible » si pas de données).

## Repères du code
- Guides SEO : `src/data/seo/guides.ts` (données) → `src/app/[slug]/page.tsx` (rendu, JSON-LD) ; test de garde `src/data/seo/guides.test.ts`.
- Pages publiques : `src/app/page.tsx` (accueil), `src/app/guides/`, `src/app/tarifs/`, `src/app/verifier/` (vérification gratuite), `src/components/seo/` (en-tête/pied, JSON-LD), `src/lib/seo/site.ts`.
- `src/app/sitemap.ts`, `src/app/robots.ts`, `public/.htaccess` (redirections www/HTTPS, cache).
- Infographies originales : `public/guides/*.svg` (toujours marquées « schéma explicatif, non officiel »).
