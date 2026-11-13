# DP Solaire : déclaration préalable automatisée (solaire, pompe à chaleur, isolation)

SaaS B2B pour installateurs : **panneaux photovoltaïques** (avec raccordement Enedis et Consuel), **pompes à chaleur** (unité extérieure) et **isolation thermique par l'extérieur**. L'installateur fournit **une adresse, le matériel et 3 photos**. L'application :
- interroge les sources publiques (BAN, cadastre, Géoportail de l'Urbanisme, BD TOPO, Géorisques, Annuaire) ;
- détecte les secteurs protégés et la consultation de l'ABF ;
- évalue la conformité avec des règles sourcées et versionnées ;
- dessine les plans DP1 à DP8 à l'échelle ;
- remplit le **cerfa 16702\*03** officiel ;
- produit un **PDF unique + un ZIP** ;
- prépare le courrier ou l'email pour **la bonne mairie** ;
- suit l'instruction jusqu'à la décision.

> Le déclarant reste responsable de son dossier ; le score de passage n'est jamais une garantie (voir `/cgu`).

## Démo

| | |
|---|---|
| URL | voir la section « Déploiement » (GitHub Pages) ou `npm run dev` |
| Installateur | `demo@dp-solaire.fr` / `Demo-2026!` |
| Super-admin (back-office) | `admin@dp-solaire.fr` / `Admin-2026!` |

Cinq dossiers de démonstration sont créés au premier lancement : adresses publiques réelles, clients **fictifs**, photos de **synthèse** marquées « ILLUSTRATION DÉMO ».

| Dossier | Adresse | Cas |
|---|---|---|
| DEMO-1 | Allée des Tilleuls, 80480 Pont-de-Metz | zone UC, aucune servitude, déjà déposé (suivi en cours) |
| DEMO-2 | Rue Cormont, 80000 Amiens | abords de la cathédrale (AC1 / PDA) : ABF, 2 mois, 3 exemplaires |
| DEMO-3 | Chemin du Marais, 80470 Ailly-sur-Somme | zone N(i) du PLUi Nièvre et Somme (règle restrictive citée) + PPRI |
| DEMO-4-PAC | Allée des Tilleuls, 80480 Pont-de-Metz | pompe à chaleur en façade : distance au voisin, DP4 avec détail coté |
| DEMO-5-ITE | Rue Cormont, 80000 Amiens | isolation par l'extérieur en périmètre ABF : surplomb du trottoir, alignement |

**Mode démo** : sans serveur ni base, comptes et dossiers sont stockés dans le navigateur (localStorage, photos en IndexedDB). Le bouton « Réinitialiser la démo » est sur la page de connexion.

## Installation

```bash
npm ci
```

```bash
npm run dev            # http://localhost:3000 (mode serveur : routes /api actives)
```

```bash
npm run build:static   # export statique dans out/ (GitHub Pages, CDN)
```

Commandes de qualité :

```bash
npm run lint && npm run typecheck && npm test
```

```bash
npm run build:static && npx playwright test --trace off   # E2E (fixtures)
```

```bash
E2E_LIVE=1 npx playwright test --trace off --project desktop   # E2E contre les API en direct
```

```bash
npm run fixtures:record   # ré-enregistre les réponses réelles des API (NODE_USE_ENV_PROXY=1 derrière un proxy)
```

## Variables d'environnement
Voir `.env.example`. **Aucune n'est requise** pour la démo statique.

| Variable | Effet |
|---|---|
| `NEXT_PUBLIC_BASE_PATH` | sous-chemin (GitHub Pages : `/<dépôt>`) |
| `NEXT_PUBLIC_PROVIDER_MODE` | `live` (défaut) ou `fixtures` |
| `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` | IA : lecture du règlement PLU (`/api/ai/plu`, sortie Zod, citations) |
| `RESEND_API_KEY`, `MAIL_FROM` | envoi réel d'email après confirmation (`/api/mail/send`) |
| `STRIPE_SECRET_KEY` (sk_test), `STRIPE_PRICE_*` | Stripe Checkout en mode test |
| `NEXT_PUBLIC_SUPABASE_*` | driver Supabase (schéma prêt, driver à brancher) |

## Déploiement
- **GitHub Pages (statique)** : `.github/workflows/ci.yml` exécute lint, typecheck, Vitest, build, Playwright, puis publie `out/` (activer *Settings > Pages > Source : GitHub Actions*). URL : `https://<owner>.github.io/<dépôt>/`.
- **Vercel (serveur)** : importer le dépôt, commande `npm run build`, définir les variables. Les routes `/api/proxy` (Annuaire et PVGIS, sans CORS), `/api/ai/plu`, `/api/mail/send` et `/api/billing/checkout` s'activent.
- **Supabase** : `supabase db push` applique `supabase/migrations/0001_init.sql` (PostGIS, RLS par `tenant_id`, bucket privé cloisonné).

## Architecture

```
src/app/                 pages (App Router, rendu client) + /api (mode serveur)
src/components/          UI mobile-first (wizard, carte Leaflet, éditeur d'insertion, signature)
src/data/                données versionnées : regulation/rules.v1.json, cerfa/16702-03.mapping.json, catalogue, démos
src/lib/providers/       un adaptateur par source : ban, cadastre, gpu, bdtopo, georisques, annuaire, pvgis, signature
                         (core.ts : timeout, retries, cache, fixtures, mode dégradé)
src/lib/enrichment/      orchestration parallèle avec progression, analyse patrimoine/ABF, rattachement au bâti
src/lib/rules/           moteur déterministe (DSL JSON), faits, régime, pièces, délais, score explicable
src/lib/geo/             Lambert-93, rectangle orienté, estimation des pans, calepinage
src/lib/plans/           SVG à l'échelle DP1 à DP4 (cartouche, nord, échelle graphique, cotes, légende), fonds IGN
src/lib/image/           qualité photo (résolution, luminosité, netteté), homographie 4 points
src/lib/dossier/         cerfa (pdf-lib), textes, assemblage PDF unique et ZIP (jsPDF + svg2pdf)
src/lib/instruction/     délais (de date à date, majoration, suspension), analyse des courriers
src/lib/store/           Repository navigateur (multi-tenant logique), auth démo, audit, seed
supabase/migrations/     schéma SQL + RLS
e2e/                     Playwright
docs/                    réglementation sourcée, providers, concurrence, plan, questions ouvertes, progression
```

Principes :
- **Aucune règle codée dans l'UI** : tout est dans `rules.v1.json`, avec `source_url`, `valid_from`/`valid_to` et `verification` (VERIFIE / A_VERIFIER).
- **Validation humaine** avant tout envoi et toute signature.
- **IA étiquetée, sourcée, éditable**.

## Documentation
- `docs/regulation/` : régime, cerfa et pièces, délais, patrimoine/ABF, exemple PLU, raccordement/Consuel, PAC et ITE (`07-pac-ite.md`) (sources et dates)
- `docs/providers.md`, `docs/competition.md`, `docs/PLAN.md`, `docs/open-questions.md`, `docs/PROGRESS.md`
