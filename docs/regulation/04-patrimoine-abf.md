# Patrimoine, abords des monuments historiques et ABF

> Recherche du 11/11/2026.

## Règles
- **Abords d'un monument historique** (C. patrimoine L621-30) : soit le **périmètre délimité des abords (PDA)** s'il existe, soit, à défaut, les immeubles **visibles du monument ou visibles en même temps que lui, situés à moins de 500 m**. Le rayon se mesure à partir du monument ; la covisibilité est appréciée par l'ABF (CE 5 juin 2020 n° 431994). Sources secondaires concordantes (avocats, Assemblée nationale QE 1099). Texte consolidé non relu : **À_VÉRIFIER** (Q7).
- Projet en abords MH ou en SPR : DP6, DP7 et DP8 sont exigées (notice 51434, VÉRIFIÉ) ; 3 exemplaires (VÉRIFIÉ) ; délai porté à 2 mois en général (VÉRIFIÉ).
- Ministère de la Culture, page « L'installation de panneaux photovoltaïques en abords de monuments historiques et dans les sites patrimoniaux remarquables » : https://www.culture.gouv.fr/Thematiques/Monuments-Sites/Monuments-historiques-sites-patrimoniaux/Themes-environnementaux/L-installation-de-panneaux-photovoltaiques-en-abords-de-monuments-historiques-et-dans-les-sites-patrimoniaux-remarquables (lien repéré, non relu en détail : recommandations matériaux À_VÉRIFIER).

## Détection automatique (implémentée)
1. **Source primaire** : servitudes d'utilité publique publiées sur le Géoportail de l'Urbanisme, via API Carto `gpu/assiette-sup-s|l|p`.
   - `suptype = ac1` : abords MH (périmètre 500 m « Zone tampon » `paramcalc=500`, ou PDA « Égale au générateur »)
   - `ac2` : sites inscrits/classés ; `ac4` : SPR (ex-ZPPAUP/AVAP)
   - Confiance **haute** si le point du bâtiment est dans l'assiette.
2. **Distance au monument** : `gpu/generateur-sup-*` interrogé avec un tampon de 600 m autour du bâtiment, puis distance Turf au générateur le plus proche. Confiance moyenne : la géométrie du générateur peut être approximative.
3. **Covisibilité** : non calculable automatiquement. Message systématique : « l'ABF apprécie la covisibilité ».
4. **Divergence** : si l'assiette AC1 est absente mais un générateur est à moins de 500 m → alerte « À vérifier : possible périmètre non numérisé » (la SUP numérisée peut être incomplète, Q9).

## Conseils produit en secteur ABF (étiquetés « recommandation », jamais « règle »)
Panneaux full black, cadre noir, alignement sur les ouvertures, pose en intégration ou surimposition faible, implantation en un seul champ rectangulaire, éviter les pans visibles depuis le monument. Source : pratiques UDAP courantes (**À_VÉRIFIER**, à confirmer avec la page Culture et le guide de l'UDAP du département).
