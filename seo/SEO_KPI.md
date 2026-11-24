# Indicateurs

Règle : uniquement des chiffres mesurés, avec date et source. « non disponible » sinon.

## Search Console (propriété de domaine permizy.com validée le 20/11/2026)
| Période | Clics | Impressions | CTR | Position moy. | Source |
|---|---|---|---|---|---|
| — | non disponible | non disponible | non disponible | non disponible | données non reliées à la session |

## Conversions organiques
| Période | Vérifications lancées | Dossiers créés | Paiements | Source |
|---|---|---|---|---|
| 20/11/2026 | mesure en place (début de collecte) | — | — | Supabase `analytics_events`, requêtes `seo/analytics-queries.sql` |
| 20 au 23/11/2026 | 0 (34 pages vues, accès direct sauf 1 tiktok.com) | 0 | 0 | Supabase `analytics_events` |

## Lighthouse (mobile, site en ligne)
| Date | Page | Perf. | Access. | Bonnes pratiques | SEO | LCP | TBT | CLS |
|---|---|---|---|---|---|---|---|---|
| 20/11/2026 (avant) | / | 90 | 96 | 100 | 100 | 1,7 s | 410 ms | 0 |
| 20/11/2026 (avant) | /declaration-prealable-panneaux-solaires/ | 94 | 100 | 100 | 100 | 1,8 s | 250 ms | 0 |
| 20/11/2026 (après prefetch) | / | 98 | 100 | 100 | 100 | 1,8 s | 140 ms | 0 |
| 20/11/2026 (après prefetch) | /declaration-prealable-panneaux-solaires/ | 100 | 100 | 100 | 100 | 1,4 s | 90 ms | 0 |

## Crawl (scripts/seo-crawl.py)
| Date | Pages 200 | Indexables | Orphelines | Liens cassés | Titles > 65 car. |
|---|---|---|---|---|---|
| 20/11/2026 | 20 | 18 | 0 | 0 | 6 (corrigé dans la session) |
| 23/11/2026 | 23 | 21 | 0 | 0 | 1 (/verifier/, 67 car., accepté) |
| 24/11/2026 | 41 | 39 | 0 | 0 | 1 (/verifier/, accepté ; 3 pages ville corrigées) |
