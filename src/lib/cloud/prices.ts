/** prix TTC d'un dossier complet, payé une fois au téléchargement */
export const PRICES = { DP: 49, PC: 149, AGRI: 239 } as const;
export type PriceKind = keyof typeof PRICES;
