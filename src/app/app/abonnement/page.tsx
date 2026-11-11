"use client";
import { AppShell } from "@/components/AppShell";
import { Badge, Button, Card } from "@/components/ui";
import { pricing } from "@/data/pricing";
import { repo } from "@/lib/store/db";
import { useDbVersion } from "@/lib/store/hooks";

function Billing() {
  useDbVersion();
  const sub = repo.subscription();
  const serverMode = process.env.NEXT_PUBLIC_DEPLOY_TARGET === "server";
  const checkout = async (plan: string) => {
    if (serverMode) {
      const r = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/api/billing/checkout`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ plan }) });
      const j = await r.json();
      if (j.url) return void (window.location.href = j.url);
    }
    repo.setPlan(plan);
  };
  return (
    <div className="space-y-4">
      <Card title="Abonnement actuel">
        <p className="text-sm">
          Formule <strong>{pricing.find((p) => p.id === sub?.plan)?.name ?? sub?.plan}</strong> <Badge tone="info">{sub?.status}</Badge> : {sub?.dossiersUsed ?? 0} dossier(s) créé(s) sur la période : renouvellement le {sub?.periodEnd?.split("-").reverse().join("/")}
        </p>
        <p className="mt-2 rounded bg-amber-50 p-2 text-xs text-amber-900">Mode test : {serverMode ? "Stripe en mode test (clé sk_test requise côté serveur)." : "facturation simulée (aucun paiement). Le branchement Stripe Checkout est prêt côté serveur (/api/billing/checkout)."}</p>
      </Card>
      <div className="grid gap-4 sm:grid-cols-3">
        {pricing.map((p) => (
          <Card key={p.id} title={p.name}>
            <p className="text-2xl font-bold">{p.monthly ? `${p.monthly} €` : "0 €"}<span className="text-sm font-normal"> HT/mois</span></p>
            <p className="text-sm text-stone-600">+ {p.perDossier} € HT/dossier {p.included ? `au-delà de ${p.included}` : ""}</p>
            <ul className="my-2 list-inside list-disc text-sm">{p.features.map((f) => <li key={f}>{f}</li>)}</ul>
            <Button className="w-full" variant={sub?.plan === p.id ? "outline" : "primary"} disabled={sub?.plan === p.id} onClick={() => checkout(p.id)}>
              {sub?.plan === p.id ? "Formule actuelle" : "Choisir (test)"}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <AppShell title="Abonnement">
      <Billing />
    </AppShell>
  );
}
