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
  /** infographie originale (SVG dans public/guides), jamais présentée comme un document officiel */
  figure?: { src: string; alt: string; caption: string; width: number; height: number; mobile?: { src: string; width: number; height: number } };
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
    slug: "declaration-prealable-travaux",
    title: "Déclaration préalable de travaux : le guide complet",
    description: "Quels travaux sont concernés, cerfa 16702, pièces DP1 à DP8, dépôt en mairie, délai d'un mois, affichage : tout sur la déclaration préalable de travaux.",
    h1: "Déclaration préalable de travaux : le guide complet",
    lead: "La déclaration préalable est l'autorisation d'urbanisme demandée à la mairie pour des travaux de faible importance, en particulier ceux qui modifient l'aspect extérieur d'une maison. Voici quand elle est obligatoire, comment la remplir, la déposer et ce qui se passe ensuite.",
    works: "pv",
    price: { label: "Dossier de déclaration préalable", amount: 49 },
    cta: { label: "Vérifier gratuitement mon projet", href: "/verifier/" },
    sections: [
      {
        h2: "Pour quels travaux ?",
        p: ["Les travaux qui modifient l'aspect extérieur d'un bâtiment existant relèvent de la déclaration préalable (article R*421-17 a du code de l'urbanisme), de même que certaines petites constructions et extensions. Les cas les plus fréquents :"],
        table: {
          head: ["Travaux", "Formalité habituelle", "Guide"],
          rows: [
            ["Panneaux solaires sur le toit", "Déclaration préalable", "Panneaux solaires"],
            ["Pompe à chaleur ou climatisation en façade ou en toiture", "Déclaration préalable", "Pompe à chaleur"],
            ["Isolation des murs par l'extérieur", "Déclaration préalable", "Isolation extérieure"],
            ["Fenêtres, portes, volets : matériau, couleur ou forme changés", "Déclaration préalable (rien si à l'identique)", "Fenêtres et volets"],
            ["Création ou changement de fenêtre de toit", "Déclaration préalable", "Fenêtre de toit"],
            ["Extension jusqu'à 20 m², ou 40 m² en zone urbaine d'un PLU", "Déclaration préalable (permis au-delà)", "Extension, garage, véranda"],
          ],
        },
        note: ["Sources : service-public F17578, F36778, F37924, F36762, F36766 et F36777. Le règlement d'urbanisme de votre commune (PLU) peut ajouter des règles d'aspect : Permizy le consulte pour votre adresse."],
      },
      {
        h2: "Déclaration préalable ou permis de construire ?",
        p: ["Le permis de construire concerne les projets plus importants : extension de plus de 40 m² en zone urbaine d'un PLU (ou plus de 20 m² si la surface totale dépasse alors 150 m²), plus de 20 m² ailleurs, ou travaux sur un bâtiment inscrit au titre des monuments historiques. Le délai d'instruction d'un permis de maison individuelle est de 2 mois."],
      },
      {
        h2: "Le formulaire et les pièces",
        list: [
          "Formulaire : cerfa n° 16702*03, avec sa notice officielle n° 51434.",
          "DP1, le plan de situation, est la seule pièce exigée dans tous les cas.",
          "Les autres pièces dépendent des travaux : plan de masse (DP2), façades et toitures (DP4), aspect extérieur (DP5), photomontage et photographies (DP6, DP7, DP8) si les travaux sont visibles depuis l'espace public ou en secteur protégé, notice (DP11).",
        ],
      },
      {
        h2: "Comment déposer ?",
        list: [
          "En ligne : depuis le 1er janvier 2022, toutes les communes doivent pouvoir recevoir les demandes par voie électronique, sur leur téléservice ou via le service national AD'AU.",
          "Par courrier recommandé avec accusé de réception, ou en main propre à la mairie contre récépissé : 2 exemplaires, 3 en secteur protégé.",
          "Depuis le 1er janvier 2025, dans les communes de plus de 3 500 habitants, une personne morale (société) doit déposer par voie électronique.",
        ],
        note: ["Sources : notice du cerfa 16702 et service-public F17578."],
      },
      {
        h2: "Les étapes et les délais",
        figure: { src: "/guides/etapes-declaration-prealable.svg", alt: "Frise des étapes d'une déclaration préalable : préparer, déposer, récépissé, instruction d'un mois (deux en secteur protégé), décision ou non-opposition tacite, affichage avec deux mois de recours, travaux sous trois ans puis déclaration d'achèvement.", caption: "Les étapes d'une déclaration préalable (schéma explicatif, non officiel).", width: 960, height: 420, mobile: { src: "/guides/etapes-declaration-prealable-mobile.svg", width: 600, height: 1010 } },
        list: [
          "Instruction : 1 mois à compter du dossier complet, 2 mois en général en secteur protégé.",
          "Sans réponse à la fin du délai : non-opposition tacite ; un certificat peut être demandé.",
          "Après l'accord : affichage sur le terrain pendant tout le chantier ; 2 mois de recours pour les tiers.",
          "Les travaux doivent commencer dans les 3 ans ; à la fin, la déclaration d'achèvement (DAACT, cerfa 13408).",
        ],
      },
      {
        h2: "Le faire soi-même ou se faire aider ?",
        p: ["Vous pouvez remplir et déposer vous-même la déclaration : c'est gratuit auprès de la mairie. La difficulté tient surtout aux plans, au photomontage et aux règles locales (PLU, monuments historiques). Permizy prépare ces pièces à partir de votre adresse et vous guide pour le dépôt ; vous restez le déclarant et la décision appartient à la mairie."],
      },
    ],
    faq: [
      { q: "Qu'est-ce qu'une déclaration préalable de travaux ?", a: "C'est l'autorisation d'urbanisme à demander à la mairie avant des travaux de faible importance, notamment ceux qui modifient l'aspect extérieur d'une maison (article R*421-17 du code de l'urbanisme)." },
      { q: "Combien de temps pour obtenir une déclaration préalable ?", a: "1 mois à compter du dépôt du dossier complet, 2 mois en général en secteur protégé. Sans réponse, la non-opposition est tacite (service-public, F17578)." },
      { q: "Peut-on faire une déclaration préalable soi-même ?", a: "Oui : le dépôt en mairie est gratuit et le déclarant peut remplir lui-même le cerfa 16702*03 et préparer les pièces." },
      { q: "Combien coûte une déclaration préalable ?", a: "Le dépôt en mairie est gratuit. Si vous faites préparer le dossier par Permizy, le dossier complet coûte 49 € TTC, payé une fois au téléchargement." },
    ],
    sources: [{ label: "Service-public : déclaration préalable de travaux (F17578)", url: SP("F17578") }, { label: "Notice officielle du cerfa 16702 (n° 51434)", url: NOTICE }, { label: "Service-public : cerfa 16702 (R2028)", url: SP("R2028") }, { label: "Service-public : agrandissement (F36777)", url: SP("F36777") }],
    related: ["pieces-declaration-prealable-dp1-dp8", "cerfa-16702-declaration-prealable", "delai-instruction-declaration-prealable", "refus-declaration-prealable", "declaration-prealable-panneaux-solaires", "permis-de-construire-maison"],
    updated: "2026-11-20",
  },
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
    related: ["declaration-prealable-travaux", "raccordement-enedis-consuel-panneaux-solaires", "pieces-declaration-prealable-dp1-dp8", "declaration-prealable-ombriere-panneaux-au-sol", "panneaux-solaires-agricoles-hangar", "delai-instruction-declaration-prealable", "travaux-abords-monument-historique-abf"],
    updated: "2026-11-19",
  },
  {
    slug: "declaration-prealable-pompe-a-chaleur",
    title: "Pompe à chaleur, climatisation : déclaration préalable ?",
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
    related: ["declaration-prealable-travaux", "declaration-prealable-isolation-exterieure", "delai-instruction-declaration-prealable", "travaux-abords-monument-historique-abf"],
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
    related: ["declaration-prealable-travaux", "declaration-prealable-pompe-a-chaleur", "declaration-prealable-fenetres-portes-volets", "delai-instruction-declaration-prealable"],
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
    related: ["declaration-prealable-travaux", "declaration-prealable-fenetre-de-toit", "declaration-prealable-isolation-exterieure", "delai-instruction-declaration-prealable"],
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
    related: ["declaration-prealable-travaux", "declaration-prealable-fenetres-portes-volets", "declaration-prealable-panneaux-solaires", "delai-instruction-declaration-prealable"],
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
        figure: { src: "/guides/seuils-extension-dp-permis.svg", alt: "Schéma : en zone urbaine d'un PLU, déclaration préalable jusqu'à 40 m² créés et permis au-delà ; hors zone urbaine, déclaration jusqu'à 20 m² et permis au-delà.", caption: "Seuils de surface pour une extension (schéma explicatif, non officiel).", width: 960, height: 400, mobile: { src: "/guides/seuils-extension-dp-permis-mobile.svg", width: 600, height: 680 } },
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
    related: ["permis-de-construire-maison", "delai-instruction-declaration-prealable", "travaux-abords-monument-historique-abf", "tarifs"],
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
    related: ["declaration-prealable-travaux", "refus-declaration-prealable", "declaration-prealable-panneaux-solaires", "cerfa-16702-declaration-prealable", "travaux-abords-monument-historique-abf", "permis-de-construire-maison"],
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
  {
    slug: "pieces-declaration-prealable-dp1-dp8",
    title: "Pièces d'une déclaration préalable : DP1 à DP11",
    description: "Plan de situation DP1, plan de masse DP2, façades DP4, photomontage DP6, photos DP7 et DP8, notice DP11 : quelles pièces joindre et en combien d'exemplaires.",
    h1: "Les pièces d'une déclaration préalable, de DP1 à DP11",
    lead: "Le dossier de déclaration préalable se compose du cerfa et de pièces numérotées DP1, DP2… Toutes ne sont pas exigées à chaque fois : voici à quoi sert chacune et quand la fournir.",
    works: "pv",
    price: { label: "Dossier de déclaration préalable", amount: 49 },
    cta: { label: "Générer mes pièces DP1 à DP8", href: "/verifier/" },
    sections: [
      {
        h2: "Ce que dit la notice officielle",
        p: ["« Seule la pièce DP1 est à joindre obligatoirement dans tous les cas. DP2 n'est nécessaire que lorsque le projet crée une construction ou modifie le volume d'une construction existante. DP5 n'est à fournir que lorsque l'aspect extérieur est modifié. » (notice du cerfa 16702, n° 51434)."],
      },
      {
        h2: "Le détail des pièces",
        table: {
          head: ["Pièce", "Contenu", "Quand la fournir"],
          rows: [
            ["DP1", "Plan de situation du terrain, avec les points et angles de prise de vue des photos", "Toujours"],
            ["DP2", "Plan de masse : échelle, nord, cotes", "Construction créée ou volume modifié ; attendu par la plupart des mairies"],
            ["DP3", "Plan en coupe", "Profil du terrain modifié"],
            ["DP4", "Plans des façades et des toitures, avant et après", "Façades ou toiture modifiées"],
            ["DP5", "Représentation de l'aspect extérieur", "Aspect extérieur modifié"],
            ["DP6", "Document graphique d'insertion (photomontage)", "Travaux visibles depuis l'espace public, ou en secteur protégé"],
            ["DP7", "Photographie de l'environnement proche", "Mêmes cas que DP6"],
            ["DP8", "Photographie du paysage lointain", "Mêmes cas que DP6"],
            ["DP11", "Notice des matériaux et modalités d'exécution", "Certains secteurs protégés ; utile dans tous les cas pour décrire le projet"],
          ],
        },
        note: ["Les photographies DP7 et DP8 doivent être des photos originales, pas des photocopies (notice 51434). Dans le cerfa 16702*03, ces pièces sont numérotées DPC1 à DPC8."],
      },
      {
        h2: "Combien d'exemplaires ?",
        list: ["Dépôt en ligne : un seul envoi.", "Dépôt papier, cas général : 2 exemplaires.", "Secteur protégé (site patrimonial remarquable, abords de monument historique, site classé ou inscrit) : 3 exemplaires, plus 2 exemplaires supplémentaires du plan de situation."],
        note: ["Source : service-public F17578."],
      },
      {
        h2: "Ce que Permizy génère à votre place",
        p: ["À partir de votre adresse, Permizy dessine le plan de situation et le plan de masse sur le cadastre, les façades avant / après, le photomontage à partir de votre photo, la notice et le bordereau des pièces, puis remplit le cerfa et coche les bonnes cases."],
      },
    ],
    faq: [
      { q: "Quelle pièce est obligatoire dans une déclaration préalable ?", a: "Seule la DP1, le plan de situation, est obligatoire dans tous les cas ; les autres dépendent des travaux (notice officielle du cerfa 16702)." },
      { q: "Qu'est-ce que le DP6 ?", a: "Le document graphique d'insertion, en pratique un photomontage montrant le projet dans son environnement. Il est exigé si les travaux sont visibles depuis l'espace public ou en secteur protégé." },
      { q: "Combien d'exemplaires pour une déclaration préalable papier ?", a: "2 exemplaires dans le cas général, 3 en secteur protégé avec 2 plans de situation supplémentaires (service-public, F17578)." },
    ],
    sources: [{ label: "Notice officielle du cerfa 16702 (n° 51434)", url: NOTICE }, { label: "Service-public : déclaration préalable (F17578)", url: SP("F17578") }],
    related: ["declaration-prealable-travaux", "cerfa-16702-declaration-prealable", "declaration-prealable-panneaux-solaires", "delai-instruction-declaration-prealable"],
    updated: "2026-11-20",
  },
  {
    slug: "cerfa-16702-declaration-prealable",
    title: "Cerfa 16702*03 : formulaire de déclaration préalable",
    description: "Le cerfa 16702*03 est le formulaire de déclaration préalable en vigueur. Rubriques, pièces à joindre, dépôt et fin de travaux (DAACT 13408) : le guide.",
    h1: "Cerfa 16702*03 : le formulaire de déclaration préalable",
    lead: "Pour une déclaration préalable de travaux, le formulaire en vigueur est le cerfa n° 16702*03. Beaucoup de sites citent encore d'anciennes versions : voici l'essentiel pour ne pas se tromper.",
    works: "pv",
    price: { label: "Dossier de déclaration préalable", amount: 49 },
    cta: { label: "Remplir mon cerfa automatiquement", href: "/verifier/" },
    sections: [
      {
        h2: "Quel formulaire ?",
        list: [
          "Cerfa n° 16702*03 : « Déclaration préalable constructions et travaux non soumis à permis de construire ».",
          "Il est accompagné d'une notice officielle (n° 51434) qui détaille les cas et les pièces.",
          "Pour un permis de construire de maison individuelle, c'est le cerfa 13406 ; pour les autres constructions, le cerfa 13409.",
        ],
        note: ["Source : service-public, fiche R2028 (vérifiée le 19/10/2026)."],
      },
      {
        h2: "Les rubriques à remplir",
        list: [
          "Identité du déclarant : particulier (nom, prénom, date et lieu de naissance) ou personne morale (dénomination, SIRET, type de société, représentant).",
          "Coordonnées du déclarant.",
          "Le terrain : adresse et références cadastrales (préfixe, section, numéro, superficie).",
          "Le projet : nature des travaux et courte description.",
          "Les protections : site patrimonial remarquable, abords de monument historique, site classé.",
          "L'engagement : lieu, date et signature.",
          "Le bordereau des pièces jointes (DPC1 à DPC8 et suivantes).",
        ],
      },
      {
        h2: "Après les travaux : la DAACT",
        p: ["À la fin des travaux, la déclaration attestant l'achèvement et la conformité des travaux (DAACT) se fait sur le cerfa 13408*14 (service-public, fiche R1978)."],
      },
      {
        h2: "Le cerfa rempli pour vous",
        p: ["Permizy remplit le PDF officiel champ par champ : identité, adresse, parcelles lues sur le cadastre, description du projet, cases des secteurs protégés détectés et bordereau des pièces. Avant le téléchargement, il vous demande ce qui manque (par exemple la date et la commune de naissance) pour que le cerfa ne parte pas incomplet."],
      },
    ],
    faq: [
      { q: "Quel est le cerfa de la déclaration préalable ?", a: "Le cerfa n° 16702*03, « Déclaration préalable constructions et travaux non soumis à permis de construire » (service-public, R2028)." },
      { q: "Quel cerfa pour déclarer la fin des travaux ?", a: "La DAACT, cerfa n° 13408*14 (service-public, R1978)." },
      { q: "Faut-il indiquer la date de naissance ?", a: "Oui pour un particulier : la rubrique « identité du déclarant » demande la date et le lieu de naissance. Une société indique sa dénomination et son SIRET." },
    ],
    sources: [{ label: "Service-public : cerfa 16702 (R2028)", url: SP("R2028") }, { label: "Notice officielle du cerfa 16702 (n° 51434)", url: NOTICE }, { label: "Service-public : DAACT, cerfa 13408 (R1978)", url: SP("R1978") }],
    related: ["declaration-prealable-travaux", "pieces-declaration-prealable-dp1-dp8", "delai-instruction-declaration-prealable", "declaration-prealable-panneaux-solaires"],
    updated: "2026-11-20",
  },
  {
    slug: "declaration-prealable-ombriere-panneaux-au-sol",
    title: "Panneaux solaires au sol, ombrière : quelle autorisation ?",
    description: "Panneaux au sol ou ombrière : aucune formalité sous 3 kWc et 1,80 m, déclaration préalable jusqu'à 3 MWc, permis au-delà. Seuils et secteurs protégés.",
    h1: "Panneaux solaires au sol et ombrières : déclaration préalable ou permis ?",
    lead: "Pour des panneaux posés au sol ou une ombrière (parking, terrasse), l'autorisation dépend de la puissance crête, de la hauteur et du secteur. Les seuils ont changé pour les demandes déposées depuis le 1er décembre 2024.",
    works: "pv",
    cta: { label: "Vérifier mon projet", href: "/verifier/?w=pv" },
    sections: [
      {
        h2: "Les seuils",
        table: {
          head: ["Puissance crête", "Hauteur", "Cas général", "Secteur protégé"],
          rows: [
            ["Moins de 3 kWc", "1,80 m maximum", "Aucune formalité", "Déclaration préalable"],
            ["Moins de 3 kWc", "Plus de 1,80 m", "Déclaration préalable", "Déclaration préalable"],
            ["De 3 kWc à 3 MWc", "Toute", "Déclaration préalable", "Permis de construire"],
            ["3 MWc ou plus", "Toute", "Permis de construire", "Permis de construire"],
          ],
        },
        note: ["Articles R. 421-2, R. 421-9, R. 421-11 et R. 421-1 du code de l'urbanisme. Le seuil entre déclaration et permis est passé de 1 MWc à 3 MWc pour les demandes déposées à compter du 1er décembre 2024 (décret du 13 novembre 2024). Sources : notice du cerfa 16702 et photovoltaique.info."],
      },
      {
        h2: "Évaluation environnementale",
        p: ["Pour les installations au sol, l'évaluation environnementale systématique s'applique toujours à partir de 1 MWc, indépendamment de l'autorisation d'urbanisme (photovoltaique.info)."],
      },
      {
        h2: "En zone agricole ou naturelle",
        p: ["Au sol sur des terres agricoles, naturelles ou forestières, l'agrivoltaïsme et les installations compatibles avec l'activité agricole sont encadrés par la loi du 10 mars 2023 et le décret du 8 avril 2024. Ces projets demandent une étude au cas par cas : Permizy en signale l'enjeu mais ne génère pas encore ces dossiers."],
      },
    ],
    faq: [
      { q: "Faut-il une autorisation pour des panneaux solaires au sol ?", a: "Pas en dessous de 3 kWc et 1,80 m de haut, hors secteur protégé. De 3 kWc à 3 MWc, une déclaration préalable ; à partir de 3 MWc, un permis de construire (code de l'urbanisme, R. 421-2, R. 421-9 et R. 421-1)." },
      { q: "Et pour une ombrière de parking ?", a: "Depuis le 1er décembre 2024, les ombrières intégrant des panneaux suivent les mêmes seuils que les installations au sol (photovoltaique.info)." },
    ],
    sources: [
      { label: "Notice officielle du cerfa 16702 (n° 51434)", url: NOTICE },
      { label: "photovoltaique.info : seuil du permis pour ombrières et installations au sol", url: "https://www.photovoltaique.info/fr/actualites/detail/urbanisme-rehaussement-du-seuil-du-permis-de-construire-pour-les-ombrieres-et-les-installations-au-sol/" },
    ],
    related: ["declaration-prealable-panneaux-solaires", "panneaux-solaires-agricoles-hangar", "raccordement-enedis-consuel-panneaux-solaires"],
    updated: "2026-11-20",
  },
  {
    slug: "permis-de-construire-maison",
    title: "Permis de construire maison : pièces, délais, architecte",
    description: "Permis de construire d'une maison ou d'une extension : quand il est obligatoire, cerfa 13406, pièces PCMI, délai de 2 mois, architecte au-delà de 150 m².",
    h1: "Permis de construire pour une maison : le guide",
    lead: "Le permis de construire est l'autorisation exigée pour les projets plus importants qu'une déclaration préalable : grande extension, garage ou véranda au-delà des seuils, construction neuve. Voici quand il faut le demander, ce que contient le dossier et combien de temps attendre.",
    works: "extension",
    price: { label: "Dossier de permis de construire", amount: 149 },
    cta: { label: "Vérifier mon projet d'agrandissement", href: "/verifier/?w=extension" },
    sections: [
      {
        h2: "Quand faut-il un permis de construire ?",
        table: {
          head: ["Projet", "Autorisation"],
          rows: [
            ["Extension en zone urbaine (U) d'un PLU, jusqu'à 40 m² créés", "Déclaration préalable"],
            ["Extension en zone U de plus de 40 m², ou de plus de 20 m² portant le total au-delà de 150 m²", "Permis de construire"],
            ["Extension hors zone U de plus de 20 m²", "Permis de construire"],
            ["Travaux sur un bâtiment inscrit au titre des monuments historiques", "Permis de construire"],
            ["Construction d'un bâtiment de plus de 20 m²", "Permis de construire"],
          ],
        },
        note: ["Sources : service-public F36777 (agrandissement), F1986 (permis de construire) et notice du cerfa 16702. La surface retenue est la plus grande de l'emprise au sol et de la surface de plancher créées."],
      },
      {
        h2: "Le formulaire et les pièces",
        list: [
          "Cerfa 13406*17 pour une maison individuelle et ses annexes (extension, garage, véranda) ; cerfa 13409 pour les autres constructions.",
          "PCMI1 plan de situation, PCMI2 plan de masse, PCMI3 plan en coupe, PCMI4 notice, PCMI5 plans des façades et toitures, PCMI6 document graphique d'insertion, PCMI7 et PCMI8 photographies proche et lointaine.",
          "Attestation de prise en compte de la réglementation environnementale (PCMI14-1) lorsqu'elle est exigée : elle est établie par un professionnel.",
        ],
      },
      {
        h2: "Faut-il un architecte ?",
        p: ["Oui si la surface de plancher dépasse 150 m² après travaux (service-public F1986). En dessous, le particulier qui construit pour lui-même peut établir son dossier sans architecte. Pour un bâtiment agricole, le seuil est de 800 m² de surface de plancher."],
      },
      {
        h2: "Dépôt et délai",
        list: [
          "Délai d'instruction : 2 mois pour une maison individuelle, 3 mois en secteur protégé (service-public F1986).",
          "Dépôt papier : 4 dossiers complets, plus 5 exemplaires supplémentaires des plans de situation, de masse et en coupe ; un exemplaire de plus en site patrimonial remarquable ou aux abords d'un monument historique (cerfa 13406, cadre 8).",
          "Dans les 90 jours suivant l'achèvement : déclaration des éléments nécessaires au calcul de la taxe d'aménagement (cerfa 13406, cadre 8).",
        ],
      },
      {
        h2: "Ce que Permizy prépare",
        p: ["À partir de votre adresse et des dimensions de l'extension, Permizy lit le zonage du PLU, vous dit si un permis est nécessaire, dessine les pièces PCMI1 à PCMI8, remplit le cerfa 13406 et prépare le courrier. Les volumes complexes ou à étage relèvent d'un architecte."],
      },
    ],
    faq: [
      { q: "Quand faut-il un permis de construire pour une extension ?", a: "En zone urbaine d'un PLU, au-delà de 40 m² créés, ou au-delà de 20 m² si la surface totale dépasse alors 150 m² ; ailleurs, au-delà de 20 m² (service-public, F36777)." },
      { q: "Quel est le délai d'un permis de construire de maison individuelle ?", a: "2 mois, porté à 3 mois en secteur protégé (service-public, F1986)." },
      { q: "Faut-il un architecte pour un permis de construire ?", a: "Oui si la surface de plancher dépasse 150 m² après travaux ; 800 m² pour un bâtiment agricole (service-public, F1986)." },
      { q: "Combien coûte le dossier avec Permizy ?", a: "149 € TTC pour un permis de construire, payés une fois au téléchargement du dossier complet." },
    ],
    sources: [{ label: "Service-public : permis de construire (F1986)", url: SP("F1986") }, { label: "Service-public : agrandissement (F36777)", url: SP("F36777") }, { label: "Notice officielle du cerfa 16702 (n° 51434)", url: NOTICE }],
    related: ["permis-de-construire-extension-garage-veranda", "declaration-prealable-travaux", "panneaux-solaires-agricoles-hangar", "tarifs"],
    updated: "2026-11-23",
  },
  {
    slug: "refus-declaration-prealable",
    title: "Refus de déclaration préalable : que faire ?",
    description: "Opposition de la mairie à votre déclaration préalable : recours gracieux en 1 mois, recours au tribunal en 2 mois, cas de l'ABF, ou nouveau dossier corrigé.",
    h1: "Refus de déclaration préalable : que faire ?",
    lead: "Quand la mairie refuse une déclaration préalable, elle prend un arrêté d'opposition qui indique les motifs et les voies de recours. Vous pouvez contester la décision, ou corriger le projet et déposer un nouveau dossier.",
    works: "pv",
    cta: { label: "Préparer un dossier corrigé", href: "/verifier/" },
    sections: [
      {
        h2: "Les décisions possibles",
        list: [
          "Accord, ou absence de réponse dans le délai : décision tacite de non-opposition ; un certificat de non-opposition peut être demandé.",
          "Accord avec prescriptions : les travaux doivent respecter les règles imposées par l'arrêté.",
          "Refus : arrêté d'opposition, avec les motifs et les voies et délais de recours.",
          "Sursis à statuer : la décision est reportée, au maximum 2 ans.",
        ],
        note: ["Le maire peut aussi retirer une non-opposition qu'il estime illégale dans les 3 mois suivant la décision. Source : service-public F17578."],
      },
      {
        h2: "Contester le refus",
        table: {
          head: ["Recours", "Auprès de", "Délai"],
          rows: [
            ["Recours gracieux", "Le maire", "1 mois à compter de la notification du refus"],
            ["Recours hiérarchique (commune sans PLU ni carte communale)", "Le préfet", "Dans le même délai d'1 mois"],
            ["Recours contentieux", "Le tribunal administratif", "2 mois à compter de la notification du refus ou du rejet implicite de votre recours"],
          ],
        },
        list: [
          "Sans réponse du maire ou du préfet dans les 2 mois, le recours est rejeté.",
          "Le délai de 2 mois devant le juge reste le même si vous avez d'abord fait un recours gracieux ; les deux peuvent être faits en même temps.",
          "L'avocat n'est pas obligatoire ; le recours peut se faire par le téléservice Télérecours citoyens, en main propre ou en recommandé.",
        ],
        note: ["Source : service-public F17578 (vérifiée le 22/10/2026)."],
      },
      {
        h2: "Refus fondé sur l'avis de l'architecte des Bâtiments de France",
        p: ["En site patrimonial remarquable ou aux abords d'un monument historique, si le refus est motivé par un avis défavorable de l'ABF, un recours administratif préalable obligatoire doit être fait auprès du préfet de région avant de saisir le juge administratif (service-public F17578)."],
      },
      {
        h2: "Corriger le projet et redéposer",
        p: ["Souvent, le plus rapide est de lire les motifs de l'arrêté, d'adapter le projet (implantation, matériaux, couleurs, dimensions) et de déposer une nouvelle déclaration. Permizy refait les plans, le photomontage et le cerfa à partir des nouvelles caractéristiques, et vous signale les règles du PLU et les périmètres protégés de votre adresse."],
      },
    ],
    faq: [
      { q: "Combien de temps pour contester un refus de déclaration préalable ?", a: "1 mois pour un recours gracieux auprès du maire, 2 mois pour un recours devant le tribunal administratif, à compter de la notification du refus (service-public, F17578)." },
      { q: "Faut-il un avocat pour contester un refus ?", a: "Non, l'avocat n'est pas obligatoire devant le tribunal administratif pour ce recours (service-public, F17578)." },
      { q: "Peut-on redéposer après un refus ?", a: "Oui : vous pouvez modifier le projet en tenant compte des motifs de l'arrêté et déposer une nouvelle déclaration préalable." },
    ],
    sources: [{ label: "Service-public : déclaration préalable, décision et recours (F17578)", url: SP("F17578") }],
    related: ["declaration-prealable-travaux", "delai-instruction-declaration-prealable", "travaux-abords-monument-historique-abf", "pieces-declaration-prealable-dp1-dp8"],
    updated: "2026-11-23",
  },
];

export const guideBySlug = (slug: string) => GUIDES.find((g) => g.slug === slug);
