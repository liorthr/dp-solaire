import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** fusion de classes Tailwind (utilisable côté serveur et client) */
export const cn = (...a: Parameters<typeof clsx>) => twMerge(clsx(a));
