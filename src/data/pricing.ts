// Grille indicative (à valider) : positionnée sous les prix publics observés (39 à 180 €/dossier, docs/competition.md).
export const pricing = [
  { id: "decouverte", name: "Découverte", monthly: 0, perDossier: 29, included: 0, features: ["Paiement au dossier", "Toutes les pièces DP1 à DP8", "Suivi d'instruction"] },
  { id: "pro", name: "Pro", monthly: 79, perDossier: 12, included: 5, features: ["5 dossiers inclus/mois", "Multi-utilisateurs", "Modèles personnalisés (logo, mentions)"] },
  { id: "entreprise", name: "Entreprise", monthly: 249, perDossier: 8, included: 30, features: ["30 dossiers inclus/mois", "API CRM (à venir)", "Support prioritaire"] },
] as const;
