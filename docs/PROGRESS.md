# Progression

| Phase | État | Notes |
|---|---|---|
| 0 Recherche | ✅ | Sources officielles lues le 11/11/2026 (service-public F17578, R2028, R1978 ; notice 51434 ; cerfa 16702\*03 téléchargé ; PLUi Nièvre et Somme). Légifrance renvoie 403 aux robots : articles consolidés marqués À_VÉRIFIER. |
| 1 Plan | ✅ | `docs/PLAN.md`. Supabase refusé, puis « sans Supabase pour l'instant » ; jeton Vercel refusé → cible statique GitHub Pages. |
| 2 Socle | ✅ | Next 16 statique/serveur, auth démo, multi-tenant logique, audit, CI GitHub Actions. |
| 3 Enrichissement | ✅ | 8 adaptateurs + fixtures réelles (2,7 Mo). Annuaire/PVGIS sans CORS : instantané / estimation en statique, proxy en serveur. Rattachement automatique au bâti pour les adresses sans numéro. |
| 4 Règles | ✅ | 24 règles + 6 régimes + pièces/délais/exemplaires, tous sourcés. Score explicable. |
| 5 Plans | ✅ | DP1 (fonds IGN + encart 1/25 000), DP2 (cotes, distances aux limites, coupe AA, points de vue), DP3, DP4 (toitures + façades), vectoriels. |
| 6 Insertion | ✅ | Homographie 4 points (souris, tactile, clavier), rendu texturé, contrôle qualité photo. Pré-détection IA : route prête, désactivée sans clé. |
| 7 Dossier | ✅ | Cerfa officiel rempli (45 champs mappés), bordereau, DP11, mandat signé (SHA-256), PDF unique + ZIP, email .eml avec PJ, LRAR, guide GNAU. ≈ 10 à 13 s par dossier. |
| 8 Suivi | ✅ | Statuts, délais (majoration, suspension, tacite, retrait, péremption, recours), rappels J-7 in-app, analyse heuristique des courriers + réponse type, demande de certificat tacite, DAACT. |
| 9 B2B et déploiement | ✅ (statique) | Tableau de bord, clients (effacement RGPD), catalogue, entreprise/logo/mentions, utilisateurs et rôles, export RGPD, conservation, abonnement test, back-office, santé des sources. |

Qualité au dernier commit : lint 0 erreur ; typecheck OK ; Vitest 51/51 ; Playwright 7/7 (+ parcours complet validé en direct sur les API réelles).

## Modes dégradés actifs
- Persistance : navigateur uniquement (pas de Supabase) ; RLS SQL prête mais non déployée.
- IA (PLU, courriers, toiture) : désactivée sans `ANTHROPIC_API_KEY` + mode serveur ; repli heuristique pour les courriers.
- Envoi d'email : .eml / mailto en statique ; Resend en serveur.
- Rappels par email : nécessitent un serveur (cron) ; notifications in-app actives.
- Annuaire : instantané pour les communes de démo ; ailleurs, lien vers l'Annuaire + saisie manuelle (le proxy serveur lève la limite).
- PVGIS : estimation par latitude en statique.
- Stripe : abonnement simulé.
