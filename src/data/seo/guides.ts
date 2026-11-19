// Guides SEO : une page par intention de recherche. Contenu tiré exclusivement des notes vérifiées
// (docs/regulation/*.md) ; chaque affirmation réglementaire renvoie à une source officielle listée en bas de page.
import type { WorksType } from "@/lib/types";

export interface GuideSection {
  h2: string;
  p?: string[];
  list?: string[];
  table?: { head: string[]; rows: string[][] };
  /** précision sous le tableau (source…) */
  note?: string[];
}
export interface Guide {
  slug: string;
  /** balise title (≤ 60 caractères, suffixe « | Permizy » ajouté) */
  title: string;
  /** meta description (≤ 155 caractères) */
  description: string;
  h1: string;
  lead: string;
  works: WorksType;
  price?: { label: string; amount: number };
  cta: { label: string; href: string };
  sections: GuideSection[];
  faq: { q: string; a: string }[];
  sources: { label: string; url: string }[];
  related: string[];
  updated: string;
}

const SP = (id: string) => `https://www.service-public.gouv.fr/particuliers/vosdroits/${id}`;
const NOTICE = "https://www.formulaires.service-public.gouv.fr/gf/getNotice.do?cerfaNotice=51434&cerfaFormulaire=16700";
const AGRI_SIGNUP = `/connexion/?mode=signup&pro=1&next=${encodeURIComponent("/app/nouveau/?works=pv_agri")}`;

const DP_DELAIS: GuideSection = {
  h2: "Délai de réponse de la mairie",
  list: [
    "1 mois à compter du dépôt du dossier complet, dans le cas général.",
    "2 mois en général en secteur protégé (abords d'un monument historique, site patrimonial remarquable) : la mairie vous le notifie dans le premier mois.",
    "Sans réponse à la fin du délai, vous bénéficiez d'une décision tacite de non-opposition ; un certificat de non-opposition peut être demandé.",
    "Si le dossier est incomplet, la mairie le signale dans le mois ; vous avez 3 mois pour compléter, et le délai repart à réception des pièces.",
  ],
};
const DP_APRES: GuideSection = {
  h2: "Après l'accord",
  list: [
    "Affichez l'autorisation sur le terrain (panneau de plus de 80 cm, visible depuis la voie publique) pendant toute la durée du chantier.",
    "Les tiers disposent de 2 mois de recours à compter du premier jour d'affichage continu.",
    "L'autorisation est périmée si les travaux ne commencent pas dans les 3 ans (prorogeable deux fois un an).",
  ],
};

export const GUIDES: Guide[] = [
  {
    slug: "declaration-prealable-panneaux-solaires",
    title: "Déclaration préalable panneaux solaires : dossier en ligne",
    description: "Panneaux solaires sur le toit : déclaration préalable obligatoire. Plans DP1 à DP8, cerfa 16702 rempli, photomontage : votre dossier complet en ligne pour 49 €.",
    h1: "Déclaration préalable pour des panneaux solaires",
    lead: "Poser des panneaux photovoltaïques sur le toit d'une maison modifie son aspect extérieur : une déclaration préalable de travaux est nécessaire avant l'installation. Permizy prépare le dossier complet à partir de votre adresse.",
    works: "pv",
    price: { label: "Dossier de déclaration préalable", amount: 49 },
    cta: { label: "Vérifier mon projet solaire", href: "/verifier/?w=pv" },
    sections: [
      {
        h2: "Faut-il une autorisation pour des panneaux solaires ?",
        p: ["Oui. Les travaux qui modifient l'aspect extérieur d'un bâtiment existant, comme la pose de panneaux en toiture, relèvent de la déclaration préalable (article R*421-17 a du code de l'urbanisme). Service-public classe expressément le « panneau solaire sur le toit » parmi les travaux soumis à déclaration préalable."],
        table: {
          head: ["Situation", "Formalité"],
          rows: [
            ["Panneaux sur la toiture d'une maison existante", "Déclaration préalable"],
            ["Bâtiment inscrit au titre des monuments historiques", "Permis de construire"],
            ["Au sol, moins de 3 kWc et 1,80 m de haut maximum, hors secteur protégé", "Aucune formalité"],
            ["Au sol, de 3 kWc à 3 MWc, hors secteur protégé", "Déclaration préalable"],
            ["Au sol, 3 MWc ou plus", "Permis de construire"],
          ],
        },
      },
      {
        h2: "Le formulaire : cerfa 16702*03",
        p: ["La déclaration se fait sur le cerfa n° 16702*03 « Déclaration préalable constructions et travaux non soumis à permis de construire ». Beaucoup de sites citent encore d'anciennes versions : Permizy remplit la version en vigueur, champ par champ."],
      },
      {
        h2: "Les pièces du dossier",
        list: [
          "DP1 : plan de situation (obligatoire dans tous les cas).",
          "DP2 : plan de masse, attendu par la plupart des mairies.",
          "DP4 : plans des façades et de la toiture, avant et après.",
          "DP5 : représentation de l'aspect extérieur.",
          "DP6 : document graphique d'insertion (photomontage), DP7 et DP8 : photographies proche et lointaine, si les travaux sont visibles depuis l'espace public ou en secteur protégé.",
          "DP11 : notice décrivant les matériaux et les modalités d'exécution.",
        ],
        p: ["Les photographies DP7 et DP8 doivent être des photos originales. En dépôt papier, prévoyez 2 exemplaires, 3 en secteur protégé."],
      },
      {
        h2: "Monument historique à moins de 500 m ?",
        p: ["Aux abords d'un monument historique ou dans un site patrimonial remarquable, l'architecte des Bâtiments de France est consulté et le délai passe à 2 mois en général. Permizy détecte ces périmètres à partir des servitudes publiées sur le Géoportail de l'Urbanisme et vous le signale avant le dépôt."],
      },
      DP_DELAIS,
      {
        h2: "Et après la mairie : raccordement et Consuel",
        p: ["Une fois l'autorisation obtenue, l'installation doit être déclarée ou raccordée auprès d'Enedis, et l'attestation de conformité visée par le Consuel avant la mise sous tension. Permizy prépare aussi ce pack : schéma unifilaire, dossier technique Consuel pré-rempli, note de calcul et récapitulatif de la demande Enedis."],
      },
      DP_APRES,
    ],
    faq: [
      { q: "Faut-il une déclaration préalable pour des panneaux solaires sur le toit ?", a: "Oui : la pose de panneaux en toiture modifie l'aspect extérieur de la maison et relève de la déclaration préalable (R*421-17 a du code de l'urbanisme), selon service-public.fr." },
      { q: "Quel cerfa pour des panneaux solaires ?", a: "Le cerfa n° 16702*03, « Déclaration préalable constructions et travaux non soumis à permis de construire »." },
      { q: "Combien de temps la mairie a-t-elle pour répondre ?", a: "1 mois à compter du dépôt du dossier complet, 2 mois en général en secteur protégé. Sans réponse, la non-opposition est tacite." },
      { q: "Combien coûte le dossier avec Permizy ?", a: "49 € TTC, payés une seule fois au moment de télécharger le dossier complet. La vérification de votre projet est gratuite." },
    ],
    sources: [
      { label: "Service-public : déclaration préalable de travaux (F17578)", url: SP("F17578") },
      { label: "Notice officielle du cerfa 16702 (n° 51434)", url: NOTICE },
      { label: "Service-public : formulaire cerfa 16702 (R2028)", url: SP("R2028") },
    ],
    related: ["raccordement-enedis-consuel-panneaux-solaires", "panneaux-solaires-agricoles-hangar", "delai-instruction-declaration-prealable", "travaux-abords-monument-historique-abf"],
    updated: "2026-11-19",
  },
  {
    slug: "declaration-prealable-pompe-a-chaleur",
    title: "Déclaration préalable pompe à chaleur : quand et comment",
    description: "Pompe à chaleur en façade ou en toiture : déclaration préalable obligatoire. Règles, bruit, voisinage et dossier complet prêt à déposer en mairie.",
    h1: "Déclaration préalable pour une pompe à chaleur",
    lead: "L'unité extérieure d'une pompe à chaleur ou d'une climatisation change souvent l'aspect de la maison. Selon son emplacement, une déclaration préalable est nécessaire : Permizy vous le dit et prépare le dossier.",
    works: "pac",
    price: { label: "Dossier de déclaration préalable", amount: 49 },
    cta: { label: "Vérifier mon projet de pompe à chaleur", href: "/verifier/?w=pac" },
    sections: [
      {
        h2: "Pompe à chaleur : déclaration préalable ou rien ?",
        table: {
          head: ["Emplacement de l'unité extérieure", "Formalité"],
          rows: [
            ["Fixée en façade ou en toiture", "Déclaration préalable"],
            ["Au sol, en secteur protégé", "Déclaration préalable"],
            ["Au sol, hors secteur protégé", "Aucune formalité d'urbanisme"],
          ],
        },
        note: ["Source : service-public.fr, fiche F36778."],
      },
      {
        h2: "Bruit et voisinage",
        p: ["La déclaration ne dispense pas de respecter les règles de bruit du code de la santé publique. Permizy calcule la distance entre l'unité et la limite de propriété à partir du cadastre et vous alerte quand elle est faible, pour choisir le meilleur emplacement."],
      },
      {
        h2: "En copropriété",
        p: ["Une unité fixée sur la façade ou la toiture touche les parties communes : l'autorisation de l'assemblée générale est nécessaire (fiche F36778)."],
      },
      {
        h2: "Les pièces du dossier",
        list: ["DP1 plan de situation, DP2 plan de masse avec la position de l'unité et la distance à la limite.", "DP4 façade avant / après avec l'unité cotée.", "DP5 aspect extérieur, DP11 notice.", "DP6, DP7, DP8 (photomontage et photos) si l'unité est visible depuis la rue ou en secteur protégé."],
      },
      DP_DELAIS,
    ],
    faq: [
      { q: "Faut-il une autorisation pour installer une pompe à chaleur ?", a: "Une déclaration préalable est nécessaire si l'unité extérieure est fixée en façade ou en toiture, ou posée au sol en secteur protégé. Au sol hors secteur protégé, aucune formalité d'urbanisme (service-public, F36778)." },
      { q: "Et pour une climatisation ?", a: "Les mêmes règles s'appliquent à l'unité extérieure d'une climatisation réversible (pompe à chaleur air/air)." },
      { q: "Combien coûte le dossier ?", a: "49 € TTC, payés une seule fois au moment de télécharger le dossier complet." },
    ],
    sources: [{ label: "Service-public : pompe à chaleur (F36778)", url: SP("F36778") }, { label: "Service-public : déclaration préalable (F17578)", url: SP("F17578") }],
    related: ["declaration-prealable-isolation-exterieure", "delai-instruction-declaration-prealable", "travaux-abords-monument-historique-abf"],
    updated: "2026-11-19",
  },
  {
    slug: "declaration-prealable-isolation-exterieure",
    title: "Isolation par l'extérieur : déclaration préalable",
    description: "Isolation thermique par l'extérieur (ITE) : déclaration préalable obligatoire. Surplomb, voisin, couleurs, ABF : votre dossier complet en ligne.",
    h1: "Déclaration préalable pour une isolation par l'extérieur",
    lead: "L'isolation thermique par l'extérieur change l'épaisseur et la finition des façades : c'est une déclaration préalable. Permizy vérifie les points sensibles (surplomb, voisin, secteur protégé) et dessine les plans.",
    works: "ite",
    price: { label: "Dossier de déclaration préalable", amount: 49 },
    cta: { label: "Vérifier mon projet d'isolation", href: "/verifier/?w=ite" },
    sections: [
      {
        h2: "Quelle autorisation pour isoler par l'extérieur ?",
        table: { head: ["Situation", "Formalité"], rows: [["Cas général : l'aspect extérieur change", "Déclaration préalable"], ["Bâtiment inscrit monument historique", "Permis de construire"]] },
        note: ["Sources : service-public F37924 et notice officielle du cerfa 16702."],
      },
      {
        h2: "Les points à vérifier avant de déposer",
        list: [
          "Surplomb du domaine public : l'isolant qui déborde sur le trottoir nécessite l'accord de la commune.",
          "Surplomb de la propriété voisine : une convention avec le voisin est nécessaire.",
          "Couleurs et matériaux : le PLU et le nuancier communal peuvent les encadrer.",
          "Secteur protégé : l'architecte des Bâtiments de France est consulté.",
          "Une dérogation aux règles du PLU est possible pour l'isolation (article L. 152-5) : elle se justifie par une note jointe au dossier.",
        ],
      },
      { h2: "Les pièces du dossier", list: ["DP1, DP2, DP4 (façades avant / après), DP5 et DP11 dans tous les cas.", "DP3 coupe de principe du mur isolé, fournie en complément.", "DP6, DP7, DP8 si les façades sont visibles ou en secteur protégé ; DP8-1 en cas de demande de dérogation."] },
      DP_DELAIS,
    ],
    faq: [
      { q: "Faut-il une déclaration préalable pour une isolation par l'extérieur ?", a: "Oui dans le cas général, car l'aspect extérieur est modifié (service-public, F37924). Sur un bâtiment inscrit monument historique, c'est un permis de construire." },
      { q: "Et si l'isolant dépasse sur le trottoir ?", a: "Le surplomb du domaine public demande l'accord de la commune ; celui de la propriété voisine, une convention avec le voisin (F37924)." },
    ],
    sources: [{ label: "Service-public : isolation par l'extérieur (F37924)", url: SP("F37924") }, { label: "Notice officielle du cerfa 16702 (n° 51434)", url: NOTICE }],
    related: ["declaration-prealable-pompe-a-chaleur", "declaration-prealable-fenetres-portes-volets", "delai-instruction-declaration-prealable"],
    updated: "2026-11-19",
  },
  {
    slug: "declaration-prealable-fenetres-portes-volets",
    title: "Changer fenêtres, portes, volets : déclaration préalable ?",
    description: "Fenêtres, portes, volets : à l'identique, aucune formalité ; changement de matériau ou de couleur, déclaration préalable. Règles de vue et dossier en ligne.",
    h1: "Fenêtres, portes et volets : faut-il une déclaration préalable ?",
    lead: "Remplacer des menuiseries à l'identique ne demande aucune formalité. Dès que le matériau, la couleur ou la forme change, ou qu'une ouverture est créée, une déclaration préalable est nécessaire.",
    works: "menuiserie",
    price: { label: "Dossier de déclaration préalable", amount: 49 },
    cta: { label: "Vérifier mon projet de fenêtres", href: "/verifier/?w=menuiserie" },
    sections: [
      {
        h2: "Quand faut-il déclarer ?",
        table: { head: ["Situation", "Formalité"], rows: [["Remplacement à l'identique (même forme, matériau, couleur)", "Aucune formalité"], ["Changement de matériau, de couleur ou de forme", "Déclaration préalable"], ["Création d'une ouverture", "Déclaration préalable"]] },
        note: ["Source : service-public, fiche F36762 (vérifiée le 10/11/2026)."],
      },
      {
        h2: "Distances de vue sur le voisin",
        p: ["Une nouvelle fenêtre avec vue doit respecter 1,90 m en vue droite et 0,60 m en vue oblique par rapport à la limite de propriété, sauf accord écrit du voisin (service-public F76). Ce sont des règles de droit civil, distinctes de l'instruction de la déclaration : Permizy les calcule sur le cadastre pour vous éviter un litige."],
      },
      { h2: "En copropriété ou en secteur protégé", list: ["Copropriété : l'assemblée générale doit autoriser les travaux qui touchent la façade.", "Secteur protégé : l'architecte des Bâtiments de France est consulté."] },
      DP_DELAIS,
    ],
    faq: [
      { q: "Faut-il une autorisation pour changer ses fenêtres ?", a: "Pas si le remplacement est à l'identique. Si le matériau, la couleur ou la forme change, une déclaration préalable est nécessaire (service-public, F36762)." },
      { q: "Quelle distance pour une nouvelle fenêtre près du voisin ?", a: "1,90 m en vue droite et 0,60 m en vue oblique, sauf accord écrit du voisin (service-public, F76)." },
    ],
    sources: [{ label: "Service-public : fenêtres, portes, volets (F36762)", url: SP("F36762") }, { label: "Service-public : vues sur le voisin (F76)", url: SP("F76") }],
    related: ["declaration-prealable-fenetre-de-toit", "declaration-prealable-isolation-exterieure", "delai-instruction-declaration-prealable"],
    updated: "2026-11-19",
  },
  {
    slug: "declaration-prealable-fenetre-de-toit",
    title: "Fenêtre de toit (Velux) : déclaration préalable",
    description: "Créer ou changer une fenêtre de toit : déclaration préalable. Distances de vue, combles, ABF : plans de toiture et dossier complet en ligne.",
    h1: "Déclaration préalable pour une fenêtre de toit",
    lead: "Créer une fenêtre de toit ou la remplacer par un autre modèle modifie la toiture : une déclaration préalable est nécessaire. Permizy place les fenêtres sur votre pan de toit et vérifie les distances de vue.",
    works: "velux",
    price: { label: "Dossier de déclaration préalable", amount: 49 },
    cta: { label: "Vérifier mon projet de fenêtre de toit", href: "/verifier/?w=velux" },
    sections: [
      {
        h2: "Quelle formalité ?",
        table: { head: ["Situation", "Formalité"], rows: [["Création d'une fenêtre de toit", "Déclaration préalable"], ["Remplacement par un autre modèle", "Déclaration préalable"], ["Avec aménagement des combles", "Déclaration préalable (seuils de surface à vérifier selon le projet)"]] },
        note: ["Source : service-public, fiche F36766."],
      },
      { h2: "Distances de vue", p: ["La fenêtre de toit doit respecter 1,90 m sans se pencher et 0,60 m en se penchant par rapport à la limite de propriété, sauf accord écrit du voisin (F36766). Permizy mesure cette distance depuis la position réelle de chaque fenêtre."] },
      { h2: "Les plans fournis", list: ["DP2 : emprise des fenêtres et distance à la limite.", "DP4 : pan de toiture en vraie grandeur, fenêtres cotées depuis l'égout et la rive, et façade avant / après.", "Photomontage avec toutes les fenêtres."] },
      DP_DELAIS,
    ],
    faq: [
      { q: "Faut-il une déclaration préalable pour poser un Velux ?", a: "Oui pour créer une fenêtre de toit ou la remplacer par un autre modèle (service-public, F36766)." },
      { q: "Quelle distance avec le voisin pour une fenêtre de toit ?", a: "1,90 m sans se pencher, 0,60 m en se penchant, sauf accord écrit du voisin (F36766)." },
    ],
    sources: [{ label: "Service-public : fenêtre de toit (F36766)", url: SP("F36766") }],
    related: ["declaration-prealable-fenetres-portes-volets", "declaration-prealable-panneaux-solaires", "delai-instruction-declaration-prealable"],
    updated: "2026-11-19",
  },
  {
    slug: "permis-de-construire-extension-garage-veranda",
    title: "Extension, garage, véranda : DP ou permis de construire ?",
    description: "Agrandissement, garage ou véranda : 20 m², 40 m², 150 m², les seuils de la déclaration préalable et du permis. Plans et cerfa 13406 remplis en ligne.",
    h1: "Extension, garage, véranda : déclaration préalable ou permis de construire ?",
    lead: "Tout dépend de la surface créée, de la zone du PLU et de la surface totale après travaux. Permizy lit le zonage de votre commune, vous dit quelle autorisation demander et prépare le dossier, permis compris.",
    works: "extension",
    price: { label: "Dossier de permis de construire", amount: 149 },
    cta: { label: "Vérifier mon agrandissement", href: "/verifier/?w=extension" },
    sections: [
      {
        h2: "Les seuils",
        table: {
          head: ["Situation", "Formalité"],
          rows: [
            ["Zone urbaine (U) d'un PLU, jusqu'à 40 m² créés", "Déclaration préalable"],
            ["Zone U, plus de 40 m² créés", "Permis de construire"],
            ["Zone U, plus de 20 m² créés et plus de 150 m² au total après travaux", "Permis de construire"],
            ["Hors zone U, jusqu'à 20 m² créés", "Déclaration préalable"],
            ["Hors zone U, plus de 20 m² créés", "Permis de construire"],
          ],
        },
        note: ["La surface retenue est la plus grande de l'emprise au sol et de la surface de plancher créées. Sources : service-public F36777 (agrandissement), F36961 (garage), F36768 (véranda)."],
      },
      {
        h2: "Le permis de construire d'une maison individuelle",
        list: [
          "Formulaire : cerfa 13406*17.",
          "Délai d'instruction : 2 mois, 3 mois en secteur protégé.",
          "Architecte obligatoire si la surface de plancher dépasse 150 m² après travaux.",
          "Pièces PCMI1 à PCMI8 : situation, masse, coupe, notice, façades et toitures, insertion, photographies.",
          "L'attestation RE 2020 (PCMI14-1) est établie par un professionnel.",
        ],
        note: ["Source : service-public F1986."],
      },
      DP_APRES,
    ],
    faq: [
      { q: "À partir de quelle surface faut-il un permis de construire pour une extension ?", a: "En zone urbaine d'un PLU : au-delà de 40 m² créés, ou au-delà de 20 m² si la surface totale dépasse 150 m² après travaux. Ailleurs : au-delà de 20 m² (service-public, F36777)." },
      { q: "Faut-il un architecte ?", a: "Oui si la surface de plancher dépasse 150 m² après travaux (service-public, F1986)." },
      { q: "Combien coûte le dossier ?", a: "49 € TTC pour une déclaration préalable, 149 € TTC pour un permis de construire, payés une fois au téléchargement." },
    ],
    sources: [{ label: "Service-public : agrandissement (F36777)", url: SP("F36777") }, { label: "Service-public : garage (F36961)", url: SP("F36961") }, { label: "Service-public : véranda (F36768)", url: SP("F36768") }, { label: "Service-public : permis de construire (F1986)", url: SP("F1986") }],
    related: ["delai-instruction-declaration-prealable", "travaux-abords-monument-historique-abf", "tarifs"],
    updated: "2026-11-19",
  },
  {
    slug: "panneaux-solaires-agricoles-hangar",
    title: "Panneaux solaires agricoles : hangar et autorisation",
    description: "Photovoltaïque sur hangar ou bâtiment agricole : déclaration préalable, permis pour un hangar neuf, raccordement fortes puissances. Dossier EARL, GAEC : 239 €.",
    h1: "Panneaux solaires sur bâtiment agricole : l'autorisation et le raccordement",
    lead: "Hangar, stabulation, bâtiment de stockage : Permizy prépare la demande en mairie au nom de l'exploitation (EARL, GAEC, SCEA…) et le dossier de raccordement jusqu'aux fortes puissances.",
    works: "pv",
    price: { label: "Dossier solaire agricole", amount: 239 },
    cta: { label: "Créer mon dossier agricole", href: AGRI_SIGNUP },
    sections: [
      {
        h2: "Quelle autorisation pour un bâtiment agricole ?",
        table: {
          head: ["Projet", "Formalité"],
          rows: [
            ["Panneaux sur un bâtiment agricole existant", "Déclaration préalable (cerfa 16702)"],
            ["Hangar neuf portant les panneaux (plus de 20 m²)", "Permis de construire (cerfa 13409)"],
            ["Hangar neuf de plus de 800 m² de surface de plancher", "Permis de construire, plans par un architecte"],
            ["Au sol, de 3 kWc à 3 MWc, hors secteur protégé", "Déclaration préalable"],
          ],
        },
        note: ["Sources : service-public F17578 et F1986, notice du cerfa 16702. En zone agricole du PLU, un hangar neuf doit être nécessaire à l'exploitation."],
      },
      { h2: "Une demande au nom de la société", p: ["Quand l'exploitation est une société, le cerfa est rempli dans la rubrique « personne morale » : dénomination, SIRET, forme juridique et représentant. Les courriers à la mairie sont rédigés au nom de la société."] },
      {
        h2: "Raccordement selon la puissance",
        table: {
          head: ["Puissance installée", "Raccordement", "Conformité"],
          rows: [
            ["Jusqu'à 36 kVA", "Basse tension, demande en ligne Enedis", "Attestation Consuel"],
            ["De 36 à 250 kVA", "Basse tension triphasée, procédure Enedis-NMO-RES_030E", "Consuel avec dossier SC 143"],
            ["Plus de 250 kVA", "Réseau HTA, poste de livraison privé", "Contrôle de conformité, sans attestation Consuel"],
          ],
        },
        note: ["Sur un site soumis au code du travail, ce qui est généralement le cas d'une exploitation agricole, un rapport de contrôle par un organisme accrédité COFRAC est aussi exigé. Source : photovoltaique.info (ADEME, Hespul)."],
      },
      { h2: "Vente de l'électricité", p: ["Jusqu'à 100 kWc, le tarif d'achat en guichet ouvert s'applique. De 100 à 500 kWc, le soutien passe par l'appel d'offres simplifié « Petit PV » depuis le 22 septembre 2025 ; au-delà de 500 kWc, par les appels d'offres de la CRE."] },
    ],
    faq: [
      { q: "Faut-il une déclaration préalable pour des panneaux sur un hangar agricole existant ?", a: "Oui : la pose de panneaux modifie l'aspect extérieur du bâtiment et relève de la déclaration préalable, comme pour une maison." },
      { q: "Et pour un hangar photovoltaïque neuf ?", a: "La construction d'un bâtiment de plus de 20 m² demande un permis de construire (cerfa 13409). Un architecte est obligatoire au-delà de 800 m² de surface de plancher pour un bâtiment agricole (service-public, F1986)." },
      { q: "Faut-il le Consuel pour une grosse installation ?", a: "L'attestation Consuel concerne les installations de moins de 250 kVA. Au-delà, raccordées en HTA, elles font l'objet d'un contrôle de conformité. Un site agricole demande en plus un rapport de contrôle COFRAC." },
      { q: "Combien coûte le dossier agricole ?", a: "239 € TTC, payés une seule fois au téléchargement du dossier complet." },
    ],
    sources: [
      { label: "Service-public : permis de construire (F1986)", url: SP("F1986") },
      { label: "Service-public : déclaration préalable (F17578)", url: SP("F17578") },
      { label: "photovoltaique.info : seuils de raccordement", url: "https://www.photovoltaique.info/fr/realiser-une-installation/raccordement/bien-choisir-sa-puissance-de-raccordement/connaitre-les-seuils-techniques-et-reglementaires/" },
      { label: "photovoltaique.info : Consuel et rapport de contrôle", url: "https://www.photovoltaique.info/fr/realiser-une-installation/regles-conception-mise-en-oeuvre/normes-electriques-applicables-aux-systemes-pv/attestation-consuel-et-rapport-de-controle/" },
      { label: "photovoltaique.info : appel d'offres 100-500 kWc", url: "https://www.photovoltaique.info/fr/tarifs-dachat-et-autoconsommation/appels-doffres/appel-doffres-simplifie-100-500-kwc/principes-et-conditions-deligibilite/" },
    ],
    related: ["raccordement-enedis-consuel-panneaux-solaires", "declaration-prealable-panneaux-solaires", "tarifs"],
    updated: "2026-11-19",
  },
  {
    slug: "raccordement-enedis-consuel-panneaux-solaires",
    title: "Raccordement Enedis et Consuel : panneaux solaires",
    description: "Raccordement Enedis, attestation Consuel bleue ou violette, dossier SC 144 : les démarches après la mairie, jusqu'aux fortes puissances. Pack prêt à déposer.",
    h1: "Raccordement Enedis et attestation Consuel pour des panneaux solaires",
    lead: "Après l'accord de la mairie, deux démarches restent avant la mise en service : la demande à Enedis et l'attestation de conformité visée par le Consuel. Permizy prépare les deux.",
    works: "pv",
    cta: { label: "Préparer mon dossier solaire", href: "/verifier/?w=pv" },
    sections: [
      {
        h2: "L'attestation Consuel",
        p: ["Toute installation de production de moins de 250 kVA raccordée au réseau et modifiant l'installation intérieure doit avoir, avant sa mise sous tension, une attestation de conformité visée par le Consuel : bleue sans stockage (cerfa 15523), violette avec batterie (cerfa 15524)."],
        table: {
          head: ["Installation", "Dossier technique"],
          rows: [["Micro-onduleurs, sans batterie", "SC 144C2-2"], ["Onduleur central, sans batterie", "SC 144A-5"], ["Onduleur central, avec batterie", "SC 144C-5"], ["Raccordement « cas 4 »", "+ SC 144E et schéma"], ["Plus de 36 kVA", "+ SC 143"]],
        },
      },
      {
        h2: "La demande à Enedis",
        list: [
          "Jusqu'à 36 kVA : demande en ligne, procédure Enedis-PRO-RAC_20E ; même sans injection, l'installation doit être déclarée (convention d'autoconsommation sans injection).",
          "De 36 à 250 kVA : basse tension triphasée, procédure Enedis-NMO-RES_030E, devis sous 3 mois.",
          "Plus de 250 kVA : réseau HTA avec poste de livraison privé.",
        ],
      },
      { h2: "Le contrat d'achat", p: ["Pour une demande complète de raccordement à partir du 5 juin 2026 et jusqu'à 100 kWc, le tarif d'achat est unique : 1,1 c€/kWh injecté, indexé de 2 % par an. La vente de la totalité n'est plus éligible jusqu'à 9 kWc : l'autoconsommation est à privilégier."] },
      { h2: "Ce que Permizy génère", list: ["Schéma unifilaire.", "Dossier technique Consuel pré-rempli.", "Note de calcul (courants, protections, sections, chute de tension).", "Récapitulatif de la demande Enedis et mandat du titulaire du compteur."] },
    ],
    faq: [
      { q: "Le Consuel est-il obligatoire pour des panneaux solaires ?", a: "Oui pour une installation de moins de 250 kVA raccordée au réseau qui modifie l'installation intérieure : l'attestation de conformité doit être visée avant la mise sous tension." },
      { q: "Attestation Consuel bleue ou violette ?", a: "Bleue sans stockage (cerfa 15523), violette avec batterie (cerfa 15524)." },
      { q: "Quel tarif de rachat du surplus ?", a: "Pour une demande complète à partir du 5 juin 2026, jusqu'à 100 kWc : 1,1 c€/kWh, indexé de 2 % par an (arrêté du 1er juin 2026 modifiant l'arrêté S21)." },
    ],
    sources: [
      { label: "Consuel : dossiers techniques", url: "https://www.consuel.com/dossiers-techniques/" },
      { label: "photovoltaique.info : attestation Consuel", url: "https://www.photovoltaique.info/fr/realiser-une-installation/regles-conception-mise-en-oeuvre/normes-electriques-applicables-aux-systemes-pv/attestation-consuel-et-rapport-de-controle/" },
      { label: "photovoltaique.info : raccordement jusqu'à 36 kVA", url: "https://www.photovoltaique.info/fr/realiser-une-installation/raccordement/raccordement-inf-36-kva/" },
      { label: "photovoltaique.info : arrêté du 1er juin 2026", url: "https://www.photovoltaique.info/fr/actualites/detail/arrete-s21-detail-des-modifications-et-nouveau-tarif-unique/" },
    ],
    related: ["declaration-prealable-panneaux-solaires", "panneaux-solaires-agricoles-hangar"],
    updated: "2026-11-19",
  },
  {
    slug: "delai-instruction-declaration-prealable",
    title: "Délai de réponse d'une déclaration préalable",
    description: "1 mois, 2 mois en secteur protégé, accord tacite, dossier incomplet, affichage, recours : tout sur le délai d'une déclaration préalable de travaux.",
    h1: "Combien de temps pour obtenir une déclaration préalable ?",
    lead: "La mairie a en principe 1 mois pour répondre à une déclaration préalable complète. Voici les exceptions, ce qui se passe sans réponse et les étapes après l'accord.",
    works: "pv",
    cta: { label: "Vérifier mon projet", href: "/verifier/" },
    sections: [
      DP_DELAIS,
      { h2: "Comment se calcule le délai ?", p: ["Le délai se calcule de date à date et peut se terminer un dimanche ou un jour férié (notice officielle du cerfa 16702). Il part du dépôt du dossier complet ; une demande de pièces le suspend jusqu'à leur réception."] },
      DP_APRES,
      { h2: "En cas de refus (opposition)", p: ["Vous pouvez former un recours gracieux auprès du maire, puis un recours contentieux devant le tribunal administratif dans un délai de 2 mois."] },
      { h2: "Permis de construire : 2 mois", p: ["Pour un permis de construire de maison individuelle, le délai est de 2 mois, 3 mois en secteur protégé (service-public F1986)."] },
    ],
    faq: [
      { q: "Quel est le délai d'une déclaration préalable ?", a: "1 mois à compter du dépôt du dossier complet ; 2 mois en général en secteur protégé (service-public, F17578)." },
      { q: "Que se passe-t-il si la mairie ne répond pas ?", a: "À la fin du délai, vous bénéficiez d'une décision tacite de non-opposition. Un certificat peut être demandé à la mairie." },
      { q: "Combien de temps dure une déclaration préalable ?", a: "Elle est périmée si les travaux ne commencent pas dans les 3 ans, ou s'ils sont interrompus plus d'un an. Elle peut être prorogée deux fois un an." },
    ],
    sources: [{ label: "Service-public : déclaration préalable (F17578)", url: SP("F17578") }, { label: "Notice officielle du cerfa 16702 (n° 51434)", url: NOTICE }, { label: "Service-public : permis de construire (F1986)", url: SP("F1986") }],
    related: ["declaration-prealable-panneaux-solaires", "travaux-abords-monument-historique-abf", "permis-de-construire-extension-garage-veranda"],
    updated: "2026-11-19",
  },
  {
    slug: "travaux-abords-monument-historique-abf",
    title: "Travaux près d'un monument historique : l'avis de l'ABF",
    description: "Maison à moins de 500 m d'un monument historique ou en site patrimonial : consultation de l'ABF, délai de 2 mois, pièces en plus. Vérification gratuite.",
    h1: "Travaux aux abords d'un monument historique : ce qui change",
    lead: "Si votre maison est dans le périmètre d'un monument historique ou d'un site patrimonial remarquable, l'architecte des Bâtiments de France (ABF) est consulté. Permizy le détecte à partir de votre adresse.",
    works: "pv",
    cta: { label: "Vérifier mon adresse", href: "/verifier/" },
    sections: [
      { h2: "Le périmètre des abords", p: ["Les abords d'un monument historique correspondent au périmètre délimité des abords lorsqu'il existe ; à défaut, aux immeubles visibles du monument ou visibles en même temps que lui, situés à moins de 500 m. La covisibilité est appréciée par l'ABF."] },
      { h2: "Ce qui change pour votre dossier", list: ["Le délai d'instruction passe en général à 2 mois pour une déclaration préalable.", "Le photomontage (DP6) et les photographies (DP7, DP8) sont exigés.", "En dépôt papier : 3 exemplaires au lieu de 2."] },
      { h2: "Comment Permizy le détecte", p: ["Permizy lit les servitudes d'utilité publique publiées sur le Géoportail de l'Urbanisme (abords de monuments historiques, sites patrimoniaux remarquables, sites inscrits et classés) et mesure la distance au monument le plus proche. Si un monument est proche mais que le périmètre n'est pas numérisé, vous êtes prévenu."] },
    ],
    faq: [
      { q: "Ma maison est-elle dans le périmètre d'un monument historique ?", a: "Saisissez votre adresse sur Permizy : les servitudes du Géoportail de l'Urbanisme sont lues automatiquement et la distance au monument le plus proche est affichée." },
      { q: "Le délai est-il plus long près d'un monument historique ?", a: "Oui : en secteur protégé, la mairie notifie en général un délai de 2 mois pour une déclaration préalable (service-public, F17578)." },
    ],
    sources: [{ label: "Service-public : déclaration préalable (F17578)", url: SP("F17578") }, { label: "Notice officielle du cerfa 16702 (n° 51434)", url: NOTICE }, { label: "Géoportail de l'Urbanisme", url: "https://www.geoportail-urbanisme.gouv.fr/" }],
    related: ["declaration-prealable-panneaux-solaires", "delai-instruction-declaration-prealable", "declaration-prealable-isolation-exterieure"],
    updated: "2026-11-19",
  },
];

export const guideBySlug = (slug: string) => GUIDES.find((g) => g.slug === slug);
