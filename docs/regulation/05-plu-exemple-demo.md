# Exemple de règle PLU restrictive (dossier de démo n° 3)

- Commune : Ailly-sur-Somme (INSEE 80011), adresse « Chemin du Marais 80470 Ailly-sur-Somme » (voie publique, sans numéro).
- Document : PLUi Nièvre et Somme, `200071223_PLUi_20251001_A`, approuvé/validé le 01/10/2025 (Géoportail de l'Urbanisme, gpu_doc_id `a67897885e7840ee712216b9b94003e9`).
- Zone : **N(i)**, zone naturelle ; l'indice (i) correspond au secteur inondable. SUP **PM1** : PPRI de la vallée de la Somme et de ses affluents (20080612).
- Règlement : https://data.geopf.fr/annexes/gpu/documents/DU_200071223_A/a67897885e7840ee712216b9b94003e9/200071223_reglement_20251001_A.pdf

Extraits (téléchargés et lus le 11/11/2026) :
- p. 61 : « La zone N correspond aux zones naturelles et forestières du territoire […] Toute construction y est interdite. »
- p. 65, « Dans les zones N », équipements d'intérêt collectif : « les ouvrages de production d'électricité à partir de l'énergie solaire […], **à condition qu'ils soient installés sur des bâtiments et qu'ils soient intégrés de façon harmonieuse à la construction** ».
- Dispositions communes (p. 73) : « Les dispositifs nécessaires à l'utilisation des énergies renouvelables peuvent s'implanter au-delà de la hauteur maximale, sous réserve d'une intégration particulièrement soignée. »

Traduction dans le moteur : règle `PLU_ZONE_N_SOLAIRE_INTEGRATION` (commune 80011, zone N*), sévérité **alerte**, avec la citation et la page. Le produit propose « intégration au bâti / surimposition faible + insertion soignée ». L'interprétation (cette condition vise-t-elle aussi les installations des particuliers ?) est **À_VÉRIFIER** auprès du service instructeur (Q10).
