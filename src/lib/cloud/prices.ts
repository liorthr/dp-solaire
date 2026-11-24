/** prix TTC d'un dossier complet, payé une fois au téléchargement */
export const PRICES = { DP: 49, PC: 149, AGRI: 239 } as const;
export type PriceKind = keyof typeof PRICES;

/** options vendues avec le dossier (Stripe : articles optionnels du lien de paiement, ou lien seul après coup) */
export const OPTION_PRICES = { RAC: 39 } as const;
export type OptionKind = keyof typeof OPTION_PRICES;
