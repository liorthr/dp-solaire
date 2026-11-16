"use client";
// Paiement du dossier complet (Stripe Payment Links) ; le paiement est enregistré côté serveur par le webhook
// (Edge Function stripe-webhook) : le navigateur ne fait que le lire.
import type { Project } from "@/lib/types";
import { currentSession } from "@/lib/store/db";
import { cloudEnabled, isCloudSession, supabase } from "./supabase";

export const PRICES = { DP: 49, PC: 149 } as const;
const LINKS = { DP: process.env.NEXT_PUBLIC_STRIPE_LINK_DP ?? "", PC: process.env.NEXT_PUBLIC_STRIPE_LINK_PC ?? "" };
export const PENDING_KEY = "permizy:paiement";

/** paiement exigé : comptes en ligne uniquement (la démo locale reste libre) */
export const paymentRequired = () => cloudEnabled && Boolean(LINKS.DP) && isCloudSession(currentSession());

export async function isPaid(projectId: string): Promise<boolean> {
  const r = await supabase().from("payments").select("id").eq("project_local_id", projectId).limit(1);
  if (r.error) throw new Error(r.error.message);
  return (r.data ?? []).length > 0;
}

export async function payDossier(p: Project, kind: "DP" | "PC") {
  const { data } = await supabase().auth.getUser();
  if (!data.user) throw new Error("Reconnectez-vous pour payer.");
  const url = new URL(LINKS[kind]);
  url.searchParams.set("client_reference_id", `${data.user.id}__${p.id}`);
  if (data.user.email) url.searchParams.set("prefilled_email", data.user.email);
  url.searchParams.set("locale", "fr");
  localStorage.setItem(PENDING_KEY, JSON.stringify({ projectId: p.id, at: Date.now() }));
  window.location.href = url.toString();
}
