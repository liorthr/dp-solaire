// Stripe Checkout en mode test (abonnement). Prix configurés par variables d'environnement.
import { NextResponse } from "next/server";

const PRICE_ENV: Record<string, string | undefined> = { pro: process.env.STRIPE_PRICE_PRO, entreprise: process.env.STRIPE_PRICE_ENTREPRISE };

export async function POST(req: Request) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || !key.startsWith("sk_test_")) return NextResponse.json({ error: "Stripe non configuré (clé de test sk_test_ attendue)" }, { status: 501 });
  const { plan } = (await req.json()) as { plan: string };
  const price = PRICE_ENV[plan];
  if (!price) return NextResponse.json({ error: "Formule sans prix Stripe" }, { status: 400 });
  const origin = new URL(req.url).origin;
  const params = new URLSearchParams({ mode: "subscription", "line_items[0][price]": price, "line_items[0][quantity]": "1", success_url: `${origin}/app/abonnement/?ok=1`, cancel_url: `${origin}/app/abonnement/` });
  const r = await fetch("https://api.stripe.com/v1/checkout/sessions", { method: "POST", headers: { Authorization: `Bearer ${key}`, "content-type": "application/x-www-form-urlencoded" }, body: params });
  const j = await r.json();
  if (!r.ok) return NextResponse.json({ error: j.error?.message }, { status: 502 });
  return NextResponse.json({ url: j.url });
}
