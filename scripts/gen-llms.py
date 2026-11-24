#!/usr/bin/env python3
"""Régénère public/llms.txt à partir des guides (src/data/seo/guides.ts). Usage : python3 -I scripts/gen-llms.py"""
import re, os
root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
src = open(os.path.join(root, "src/data/seo/guides.ts"), encoding="utf-8").read()
items = re.findall(r'slug: "([^"]+)",\n    title: "([^"]+)",\n    description: "((?:[^"\\]|\\.)*)"', src)
out = ["# Permizy", "",
 "> Permizy (https://permizy.com) prépare en ligne les dossiers d'urbanisme des maisons en France : déclaration préalable de travaux, permis de construire, solaire agricole, raccordement Enedis et Consuel. À partir d'une adresse, l'outil lit les données publiques (cadastre, plan local d'urbanisme via le Géoportail de l'Urbanisme, périmètres de monuments historiques), indique l'autorisation à demander avec ses sources officielles, dessine les plans, remplit le cerfa officiel et prépare le courrier pour la mairie.", "",
 "Faits utiles :",
 "- Vérification du projet gratuite et sans inscription : https://permizy.com/verifier/",
 "- Prix du dossier complet, payé une fois au téléchargement : 49 € TTC (déclaration préalable), 149 € TTC (permis de construire), 239 € TTC (solaire agricole) ; option solaire « pack raccordement Enedis + Consuel » : 39 € TTC. https://permizy.com/tarifs/",
 "- Permizy n'est ni un service de l'État ni une mairie ; le demandeur reste le déclarant et la décision appartient à la mairie. Aucun envoi n'est fait sans l'accord de l'utilisateur.",
 "- Éditeur : SAS, SIREN 109 443 754, 47 rue Vivienne, 75002 Paris. https://permizy.com/mentions-legales/",
 "", "## Guides (sources officielles citées en bas de chaque page)", ""]
out += [f"- [{t}](https://permizy.com/{s}/): {d}" for s, t, d in items]
out += ["", "## Pages", "", "- [Accueil](https://permizy.com/)", "- [Tous les guides](https://permizy.com/guides/)", "- [À propos](https://permizy.com/a-propos/)", "- [Tarifs](https://permizy.com/tarifs/)", ""]
open(os.path.join(root, "public/llms.txt"), "w", encoding="utf-8").write("\n".join(out))
print(len(items), "guides")
