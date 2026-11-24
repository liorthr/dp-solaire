import type { Metadata } from "next";
import Link from "next/link";
import { breadcrumbLd, faqLd, serviceLd } from "@/lib/seo/site";
import { OPTION_PRICES, PRICES } from "@/lib/cloud/prices";
import { JsonLd } from "@/components/seo/JsonLd";
import { SiteFooter, SiteHeader } from "@/components/seo/SiteChrome";

export const metadata: Metadata = {
  title: "Tarifs : déclaration préalable 49 €, permis 149 €",
  description: "Vérification gratuite. Dossier complet de déclaration préalable 49 €, permis de construire 149 €, solaire agricole 239 € : payé une fois, au téléchargement.",
  alternates: { canonical: "/tarifs/" },
};

const PLANS = [
  { name: "Déclaration préalable", price: PRICES.DP, for: "Panneaux solaires, pompe à chaleur, fenêtres, volets, fenêtres de toit, isolation par l'extérieur, petite extension", href: "/verifier/" },
  { name: "Permis de construire", price: PRICES.PC, for: "Agrandissement, garage ou véranda au-delà des seuils de la déclaration préalable (cerfa 13406)", href: "/verifier/?w=extension" },
  { name: "Solaire agricole", price: PRICES.AGRI, for: "Panneaux sur hangar ou bâtiment d'exploitation, demande au nom de l'EARL, du GAEC ou de la SCEA", href: "/panneaux-solaires-agricoles-hangar/" },
];
const FAQ = [
  { q: "Quand dois-je payer ?", a: "Une seule fois, au moment de télécharger le dossier complet. La vérification de votre projet, l'analyse des règles et l'aperçu des plans sont gratuits." },
  { q: "Que comprend le dossier ?", a: "Les plans à l'échelle, le photomontage, la notice, le cerfa officiel rempli, le bordereau des pièces et le courrier ou l'email pour votre mairie, puis le suivi des délais jusqu'à la décision." },
  { q: "Quels moyens de paiement ?", a: "Carte bancaire, Apple Pay ou Google Pay, via Stripe." },
];

export default function Tarifs() {
  return (
    <div className="min-h-screen bg-cream text-ink">
      <JsonLd data={[serviceLd, faqLd(FAQ), breadcrumbLd([{ name: "Accueil", path: "/" }, { name: "Tarifs", path: "/tarifs/" }])]} />
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-5 pb-16 sm:px-10">
        <h1 className="text-4xl font-extrabold sm:text-5xl">Tarifs</h1>
        <p className="mt-3 text-lg text-muted">Vérification gratuite. Vous ne payez que le dossier complet, une seule fois, au moment de le télécharger.</p>
        <ul className="mt-8 grid gap-4 md:grid-cols-3">
          {PLANS.map((p) => (
            <li key={p.name} className="flex flex-col rounded-3xl border border-line bg-white p-6">
              <h2 className="text-xl font-extrabold">{p.name}</h2>
              <p className="mt-2 text-4xl font-extrabold">{p.price} €<span className="text-base font-medium text-muted"> TTC</span></p>
              <p className="mt-3 flex-1 text-sm text-muted">{p.for}</p>
              <Link href={p.href} prefetch={false} className="mt-5 rounded-full bg-ink px-5 py-2.5 text-center font-bold text-white">Commencer</Link>
            </li>
          ))}
        </ul>
        <section className="mt-8 rounded-3xl border border-line bg-white p-6" data-testid="tarif-rac">
          <h2 className="text-xl font-extrabold">Option solaire : pack raccordement Enedis + Consuel, {OPTION_PRICES.RAC} € TTC</h2>
          <p className="mt-2 text-sm text-muted">Schéma unifilaire, dossier technique Consuel pré-rempli (+ SC 143 au-delà de 36 kVA), note de calcul, récapitulatif de la demande Enedis et mandat. À ajouter sur la page de paiement d&apos;un dossier solaire, ou plus tard depuis l&apos;étape « Raccordement ». Utile si vous installez vous-même ou si votre installateur ne s&apos;en occupe pas.</p>
        </section>
        <section className="mt-12">
          <h2 className="text-2xl font-extrabold">Questions fréquentes</h2>
          <dl className="mt-4 divide-y divide-line rounded-2xl border border-line bg-white">
            {FAQ.map((f) => (
              <div key={f.q} className="p-5">
                <dt className="font-bold">{f.q}</dt>
                <dd className="mt-1.5 text-muted">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
