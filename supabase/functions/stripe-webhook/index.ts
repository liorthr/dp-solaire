// Webhook Stripe : enregistre un paiement de dossier Permizy après vérification de la signature.
// client_reference_id = "<id utilisateur>__<id dossier>" (posé par l'application sur le lien de paiement).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@17";
import { createClient } from "npm:@supabase/supabase-js@2";

const stripe = new Stripe("sk_unused_for_signature_check", { httpClient: Stripe.createFetchHttpClient() });
const crypto = Stripe.createSubtleCryptoProvider();
const KINDS: Record<number, string> = { 4900: "DP", 14900: "PC", 23900: "AGRI" };

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Méthode non autorisée", { status: 405 });
  const secret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!secret) return new Response("Webhook non configuré", { status: 500 });
  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, req.headers.get("stripe-signature") ?? "", secret, undefined, crypto);
  } catch {
    return new Response("Signature invalide", { status: 400 });
  }
  if (event.type !== "checkout.session.completed" && event.type !== "checkout.session.async_payment_succeeded") return new Response("ignoré", { status: 200 });
  const s = event.data.object as Stripe.Checkout.Session;
  if (s.payment_status !== "paid") return new Response("en attente", { status: 200 });
  const ref = s.client_reference_id ?? "";
  const [owner, project] = ref.split("__");
  if (!/^[0-9a-f-]{36}$/.test(owner ?? "") || !project) return new Response("référence absente", { status: 200 });
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const { error } = await db.from("payments").upsert(
    { owner, project_local_id: project, kind: KINDS[s.amount_total ?? 0] ?? "?", amount: s.amount_total ?? 0, currency: s.currency ?? "eur", livemode: event.livemode, stripe_session: s.id },
    { onConflict: "stripe_session" },
  );
  if (error) return new Response(error.message, { status: 500 });
  return new Response("ok", { status: 200 });
});
