"use client";
// Paiement du dossier complet (Stripe Payment Links) ; le paiement est enregistré côté serveur par le webhook
// (Edge Function stripe-webhook) : le navigateur ne fait que le lire.
import type { Project } from "@/lib/types";
import { currentSession } from "@/lib/store/db";
import { cloudEnabled, isCloudSession, supabase } from "./supabase";
import { OPTION_PRICES, PRICES, type OptionKind, type PriceKind } from "./prices";
import { track } from "@/lib/analytics";
export { OPTION_PRICES, PRICES, type OptionKind, type PriceKind };
export const PRICE_LABELS: Record<PriceKind, string> = { DP: "Déclaration préalable", PC: "Permis de construire", AGRI: "Solaire agricole" };
const LINKS: Record<PriceKind, string> = { DP: process.env.NEXT_PUBLIC_STRIPE_LINK_DP ?? "", PC: process.env.NEXT_PUBLIC_STRIPE_LINK_PC ?? "", AGRI: process.env.NEXT_PUBLIC_STRIPE_LINK_AGRI ?? "" };
/** déclaration préalable solaire : même prix, avec le pack raccordement proposé en option sur la page de paiement */
const LINK_DP_PV = process.env.NEXT_PUBLIC_STRIPE_LINK_DP_PV ?? "";
const OPTION_LINKS: Record<OptionKind, string> = { RAC: process.env.NEXT_PUBLIC_STRIPE_LINK_RAC ?? "" };
/** le pack raccordement est proposé pour les dossiers solaires (toiture, sol, agricole) */
export const offersRacOption = (p: Project, kind: PriceKind) => (p.works ?? "pv") === "pv" && (kind === "AGRI" || (kind === "DP" && Boolean(LINK_DP_PV)));
/** formule facturée : le solaire agricole a son propre prix, quel que soit le régime */
export const priceKindOf = (p: Project, regime: string): PriceKind => (p.agri ? "AGRI" : regime === "PC" ? "PC" : "DP");
export const PENDING_KEY = "permizy:paiement";

/** paiement exigé : comptes en ligne uniquement (la démo locale reste libre) */
export const paymentRequired = () => cloudEnabled && Boolean(LINKS.DP) && isCloudSession(currentSession());

/** paiements d'un dossier : dossier payé (DP, PC, AGRI) et options achetées (avec le dossier ou après) */
export async function paymentStatus(projectId: string): Promise<{ paid: boolean; options: OptionKind[] }> {
  const r = await supabase().from("payments").select("kind, options").eq("project_local_id", projectId);
  if (r.error) throw new Error(r.error.message);
  const rows = (r.data ?? []) as { kind: string; options: string[] | null }[];
  return { paid: rows.some((x) => x.kind !== "RAC"), options: [...new Set(rows.flatMap((x) => x.options ?? []))] as OptionKind[] };
}

export async function isPaid(projectId: string): Promise<boolean> {
  return (await paymentStatus(projectId)).paid;
}

async function redirectToStripe(base: string, p: Project, pending: { kind: string }) {
  const { data } = await supabase().auth.getUser();
  if (!data.user) throw new Error("Reconnectez-vous pour payer.");
  if (!base) throw new Error("Paiement indisponible pour cette formule : contactez-nous.");
  const url = new URL(base);
  url.searchParams.set("client_reference_id", `${data.user.id}__${p.id}`);
  if (data.user.email) url.searchParams.set("prefilled_email", data.user.email);
  url.searchParams.set("locale", "fr");
  localStorage.setItem(PENDING_KEY, JSON.stringify({ projectId: p.id, kind: pending.kind, at: Date.now() }));
  window.location.href = url.toString();
}

/** achat du pack raccordement après coup (dossier déjà payé, ou pack seul) */
export async function payOption(p: Project, option: OptionKind) {
  track("pay_click", option.toLowerCase());
  await redirectToStripe(OPTION_LINKS[option], p, { kind: option });
}

export async function payDossier(p: Project, kind: PriceKind) {
  track("pay_click", kind);
  const link = kind === "DP" && offersRacOption(p, kind) ? LINK_DP_PV : LINKS[kind];
  await redirectToStripe(link, p, { kind });
}
