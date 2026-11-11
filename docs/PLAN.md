# PLAN : DP Solaire V1

## Contraintes constatées (11/11/2026)
- Supabase : création d'un projet dédié refusée. Décision utilisateur : « sans Supabase pour l'instant ».
- Vercel : jeton non fourni.
- GitHub : le jeton de session ne peut ni créer de dépôt ni publier hors des dépôts attachés.
- Réseau : les API publiques françaises sont accessibles. **Annuaire et PVGIS n'exposent pas CORS** : il faut un proxy serveur ou un mode dégradé.

## Stack retenue (justification en 5 lignes)
1. **Next.js 16 (App Router) + TypeScript strict + Tailwind 4**, composants maison au style shadcn (la CLI shadcn n'est pas joignable) : une seule base pour le statique et le serveur.
2. **Double cible** : `output: 'export'` (site 100 % statique, déployable sur GitHub Pages ou n'importe quel CDN) **et** mode serveur (Vercel) qui active les routes `/api/*` (proxy Annuaire/PVGIS, IA Claude, envoi d'email, Stripe).
3. **Données** : interface `Repository`, implémentée en V1 par un stockage navigateur (localStorage + IndexedDB pour les photos), multi-tenant logique. Le schéma Supabase + PostGIS + RLS est prêt (`supabase/migrations`) pour le driver serveur.
4. **Génération côté client** (pas de Puppeteer) : SVG vectoriel → PDF via jsPDF + svg2pdf.js, cerfa officiel rempli par pdf-lib, ZIP par JSZip. Cela fonctionne hors serveur et tient l'objectif de moins de 60 s.
5. **Carto** : Leaflet + WMTS Géoplateforme IGN, Turf + proj4 (Lambert-93). Tests : Vitest (moteur, délais, calepinage, homographie, providers sur fixtures) et Playwright (parcours complet sur fixtures).

## Architecture
```
src/
  app/                    pages (App Router, rendu client), /api/* (serveur uniquement)
  components/             UI (wizard, carte, éditeur d'insertion, signature…)
  data/                   données versionnées : regulation/rules.v1.json, cerfa/16702-03.mapping.json, catalog, demo
  lib/
    providers/            ban, cadastre, gpu, bdtopo, georisques, annuaire, pvgis, signature (+ __fixtures__)
    enrichment/           orchestration asynchrone avec progression, fusion et divergences
    rules/                moteur déterministe (DSL JSON), faits, score explicable
    instruction/          délais, statuts, pièces complémentaires
    geo/                  projections, mesures, calepinage
    plans/                SVG DP1 à DP4, cartouche, échelle, nord
    image/                qualité photo, homographie DP5/DP6, mise en page DP7/DP8
    dossier/              cerfa (pdf-lib), bordereau, notice, mandat, assemblage PDF/ZIP
    mail/                 brouillons email/GNAU/LRAR, .eml
    store/                Repository (local) + auth démo + audit
supabase/migrations/      schéma SQL + RLS
e2e/                      Playwright
docs/                     réglementation, providers, plan, progression
```

## Modèle de données
Voir `supabase/migrations/0001_init.sql` : tenants, users, memberships, clients, projects, parcels, buildings, roof_planes, pv_layouts, equipment_catalog, documents, regulation_rules, cerfa_versions, commune_profiles, provider_cache, rule_evaluations, instruction_events, mail_drafts, audit_log, subscriptions. RLS via `is_member(tenant_id)` ; bucket de stockage préfixé par tenant.
Le driver local reproduit les mêmes entités (types partagés `src/lib/types.ts`).

## Milestones
| Phase | Contenu | Critère |
|---|---|---|
| 2 Socle | scaffold, auth démo, multi-tenant local, CI, build statique | `npm run build` OK, déploiement « hello » |
| 3 Enrichissement | 8 adaptateurs + cache + fixtures + tests | tests verts sur fixtures réelles |
| 4 Règles | DSL, ~25 règles sourcées, score, régime (DP/PC/hors périmètre) | tests unitaires sur les 3 démos |
| 5 Plans | carte éditable, calepinage, DP1 à DP4 SVG/PDF | PDF vectoriels à l'échelle |
| 6 Insertion | homographie 4 points, rendu panneaux, DP7/DP8, qualité photo | tests homographie et qualité |
| 7 Dossier | cerfa rempli, bordereau, notice, mandat signé, PDF unique + ZIP, courrier | E2E génère le ZIP |
| 8 Suivi | statuts, délais, rappels, pièces complémentaires, attestation tacite, DAACT | tests délais |
| 9 B2B et déploiement | tableau de bord, clients, catalogue, modèles, billing test, audit/RGPD, back-office, E2E, déploiement | URL vérifiée |

## Accès / clés
| Accès | Pour | Sans lui |
|---|---|---|
| Dépôt GitHub public attaché à la session (ou jeton Vercel) | URL publique | app livrée en local (`npm run dev`) + build statique prêt |
| Projet Supabase | persistance serveur multi-utilisateurs, RLS réelle | stockage navigateur (démo) |
| `ANTHROPIC_API_KEY` (côté hébergeur) | lecture IA du PLU, analyse des courriers, pré-détection du toit | heuristiques déterministes, saisie manuelle |
| `RESEND_API_KEY` | envoi réel d'email | mailto + .eml |
| `STRIPE_SECRET_KEY` (test) | facturation test | page tarifs, abonnement simulé |
| Google Solar API | segments de toit | saisie et estimation BD TOPO |
