# Règles éditoriales et visuelles

## Ton
- Français clair, phrases courtes, vouvoiement. On répond à la question dès la première phrase.
- Exact avant d'être vendeur : jamais « garanti », « accord assuré », « 100 % accepté ». La décision appartient à la mairie ; l'utilisateur reste le déclarant.
- Chiffres réglementaires toujours sourcés (lien officiel en bas de page) ; « en général » quand la règle a des exceptions (ex. délai en secteur protégé).
- Pas de faux avis, témoignages, chiffres d'utilisation ou logos clients.

## Structure d'un guide (`src/data/seo/guides.ts`)
- Title ≤ 60 caractères (suffixe « | Permizy » ajouté seulement s'il tient), description 110-160 caractères, un seul H1.
- Introduction qui répond, tableau quand il y a des seuils, liste des pièces, délais, FAQ (2 à 4 questions réelles), sources, CTA vers `/verifier/?w=…` ou le parcours adapté.
- « Mis à jour le » : uniquement après une vérification ou modification substantielle.
- Liens internes : le guide renvoie vers son pilier (`declaration-prealable-travaux`) et 2 à 5 guides voisins.

## Visuels
- Palette : encre #13201a, crème #faf6ee, vert #1f6b4a, menthe #dff3e6, soleil #ffb84d ; police Inter.
- Infographies en SVG (`public/guides/`), texte alternatif fidèle, légende, mention « schéma explicatif, non officiel ». Jamais d'imitation de document officiel ou de cerfa présenté comme authentique.
- `loading="lazy"`, dimensions déclarées (pas de décalage de mise en page).

## Vidéo
- Voix off française (TTS autorisé uniquement), sous-titres exacts, 45 s à 3 min, transcription HTML et VideoObject si publiée sur le site.
