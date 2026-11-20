# Audit SEO technique et éditorial

Première exécution : **20/11/2026**. Méthode : crawl du site en ligne (`scripts/seo-crawl.py`, 20 URLs), Lighthouse 12 mobile sur l'accueil et un guide, lecture du code, recherche Google pour la SERP générique. Les sessions suivantes ajoutent un audit différentiel en bas de fichier.

## Synthèse
| Domaine | État | Preuve |
|---|---|---|
| HTTPS, www | ✅ | `https://www.permizy.com/tarifs/` → 301 vers `https://permizy.com/tarifs/` ; HTTP → HTTPS via `public/.htaccess` |
| Codes HTTP | ✅ | 20/20 pages en 200, aucun lien interne cassé |
| robots.txt / sitemap | ✅ | `/app/`, `/api/`, `/connexion/` exclus ; sitemap 19 URLs (après cette session) |
| Canonicals | ✅ | toutes les pages indexables ont une canonical auto-référente |
| noindex | ✅ | `/app/*` noindex nofollow, `/connexion/` et `/sante/` noindex |
| Données structurées | ✅ | Organization, WebSite, Service (offres réelles), Article, FAQPage, BreadcrumbList |
| Performance (Lighthouse mobile) | ✅ | accueil 98, guide 100 ; LCP 1,4 à 1,8 s ; CLS 0 ; TBT 90 à 140 ms |
| Accessibilité / bonnes pratiques / SEO Lighthouse | ✅ | 100 / 100 / 100 |
| Mesure des conversions | ❌ | aucun outil d'analyse d'audience ; Search Console validée mais non reliée à la session |
| hreflang | n/a | site uniquement en français |

## Problèmes trouvés et traitement
| # | Problème | Preuve | Gravité | Impact | Statut |
|---|---|---|---|---|---|
| A1 | Page `/verifier/` (porte d'entrée de la conversion) quasi vide dans le HTML : 11 mots, pas de H1 | crawl : `words 11`, `h1 0` (rendu uniquement en JavaScript, fallback « Chargement… ») | Haute | page non comprise par les robots sans JS (dont la plupart des robots d'IA) | ✅ corrigé : premier écran statique + explication serveur, 247 mots, 1 H1 |
| A2 | Pas de page pilier sur la requête principale « déclaration préalable de travaux » | aucune URL dédiée ; l'accueil seul | Haute | positionnement difficile sur la tête de requête, cluster sans pilier | ✅ créé `/declaration-prealable-travaux/` (1 012 mots, infographie, FAQ) |
| A3 | Description de l'accueil trop longue (167 car.) et réutilisée par `/cgu/`, `/connexion/`, `/sante/` | crawl : `D 167` sur 4 pages | Moyenne | extraits tronqués, doublons de description | ✅ 157 car. ; description propre aux CGU |
| A4 | Titles > 65 caractères avec le suffixe de marque | 6 pages (crawl) | Faible | suffixe tronqué dans Google | ✅ suffixe ajouté seulement s'il tient |
| A5 | Code de l'espace client préchargé sur les pages publiques | Lighthouse : 116 Kio de JS inutilisé (Supabase) | Moyenne | INP/TBT | ✅ corrigé le 20/11 (prefetch désactivé) : performance 90 → 98 |
| A6 | Contraste insuffisant (étiquettes « Bientôt ») | Lighthouse accessibilité 96 | Faible | accessibilité | ✅ corrigé (100) |
| A7 | Infographies peu lisibles sur mobile (texte petit) | capture iPhone 13 | Faible | expérience mobile | ⏳ backlog : version verticale |
| A8 | CGU anciennes : orientées installateur, ne parlent ni du particulier ni du paiement | lecture `src/app/cgu/page.tsx` | Moyenne | confiance (E-E-A-T), conformité | ⏳ backlog, validation juridique nécessaire |
| A9 | Pas de mentions légales ni de page « À propos » (éditeur identifié) | aucune route | Moyenne | confiance, obligation légale d'identification de l'éditeur | ⏳ informations de la société nécessaires |
| A10 | Aucune mesure d'audience ni de conversion | pas de script d'analyse | Haute (pilotage) | impossible de prioriser par rentabilité | ⏳ choix de l'outil (consentement RGPD) à valider |
| A11 | Cookies / consentement : aucune bannière (aucun traceur aujourd'hui) | lecture du code | — | à prévoir si un outil d'analyse avec cookies est ajouté | ⏳ |

## Contenu
- 14 guides indexables (dont 1 pilier), 500 à 1 000 mots, sources officielles en bas de page, FAQ, maillage pilier ↔ satellites. Aucune page orpheline.
- Cannibalisation surveillée : l'accueil vise « déclaration préalable en ligne » (service) ; le pilier vise « déclaration préalable de travaux » (information). Garder cette séparation dans les titles.
- Pas de pages de villes : aucune donnée locale vérifiable propre à une ville n'est encore rédigée (voir plan, semaine 9).

## SERP observée (requête « déclaration préalable de travaux en ligne dossier prix », 20/11/2026)
Résultats dominés par des contenus informatifs (service-public, ootravaux, weblex, assureurs, sites de mairies) et des places de marché de prestataires (comeup). Peu de services en ligne visibles : opportunité pour des guides plus utiles que la moyenne, reliés à un outil gratuit.

---
## Audits différentiels
(à compléter à chaque session : date, ce qui a changé, preuves)
