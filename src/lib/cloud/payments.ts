"use client";
// Paiement du dossier complet (Stripe Payment Links) ; le paiement est enregistré côté serveur par le webhook
// (Edge Function stripe-webhook) : le navigateur ne fait que le lire.
import type { Project } from "@/lib/types";
import { currentSession } from "@/lib/store/db";
import { cloudEnabled, isCloudSession, supabase } from "./supabase";

export const PRICES = { DP: 49, PC: 149, AGRI: 239 } as const;
export type PriceKind = keyof typeof PRICES;
export const PRICE_LABELS: Record<PriceKind, string> = { DP: "Déclaration préalable", PC: "Permis de construire", AGRI: "Solaire agricole" };
const LINKS: Record<PriceKind, string> = { DP: process.env.NEXT_PUBLIC_STRIPE_LINK_DP ?? "", PC: process.env.NEXT_PUBLIC_STRIPE_LINK_PC ?? "", AGRI: process.env.NEXT_PUBLIC_STRIPE_LINK_AGRI ?? "" };
/** formule facturée : le solaire agricole a son propre prix, quel que soit le régime */
export const priceKindOf = (p: Project, regime: string): PriceKind => (p.agri ? "AGRI" : regime === "PC" ? "PC" : "DP");
export const PENDING_KEY = "permizy:paiement";

/** paiement exigé : comptes en ligne uniquement (la démo locale reste libre) */
export const paymentRequired = () => cloudEnabled && Boolean(LINKS.DP) && isCloudSession(currentSession());

export async function isPaid(projectId: string): Promise<boolean> {
  const r = await supabase().from("payments").select("id").eq("project_local_id", projectId).limit(1);
  if (r.error) throw new Error(r.error.message);
  return (r.data ?? []).length > 0;
}

export async function payDossier(p: Project, kind: PriceKind) {
  const { data } = await supabase().auth.getUser();
  if (!data.user) throw new Error("Reconnectez-vous pour payer.");
  if (!LINKS[kind]) throw new Error("Paiement indisponible pour cette formule : contactez-nous.");
  const url = new URL(LINKS[kind]);
  url.searchParams.set("client_reference_id", `${data.user.id}__${p.id}`);
  if (data.user.email) url.searchParams.set("prefilled_email", data.user.email);
  url.searchParams.set("locale", "fr");
  localStorage.setItem(PENDING_KEY, JSON.stringify({ projectId: p.id, at: Date.now() }));
  window.location.href = url.toString();
}
