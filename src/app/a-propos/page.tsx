import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL } from "@/lib/legal";
import { PRICES } from "@/lib/cloud/prices";
import { breadcrumbLd } from "@/lib/seo/site";
import { JsonLd } from "@/components/seo/JsonLd";
import { SiteFooter, SiteHeader } from "@/components/seo/SiteChrome";

export const metadata: Metadata = {
  title: "À propos de Permizy",
  description: "Permizy aide particuliers et professionnels à préparer leurs dossiers de déclaration préalable et de permis de construire, à partir des sources officielles.",
  alternates: { canonical: "/a-propos/" },
};

export default function APropos() {
  return (
    <div className="min-h-screen bg-cream text-ink">
      <JsonLd data={breadcrumbLd([{ name: "Accueil", path: "/" }, { name: "À propos", path: "/a-propos/" }])} />
      <SiteHeader />
      <main className="mx-auto max-w-3xl space-y-8 px-5 pb-16 leading-relaxed sm:px-10">
        <h1 className="text-4xl font-extrabold">À propos de Permizy</h1>
        <p className="text-lg text-muted">Permizy transforme une adresse et une description de travaux en dossier d&apos;urbanisme prêt à déposer : règles de la commune, plans, photomontage, cerfa rempli et courrier pour la mairie.</p>
        <section>
          <h2 className="text-2xl font-extrabold">Ce que fait Permizy</h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5">
            <li>Lecture des données publiques de l&apos;adresse : Base Adresse Nationale, cadastre, plan local d&apos;urbanisme et servitudes (Géoportail de l&apos;Urbanisme), monuments historiques, risques, mairie compétente.</li>
            <li>Verdict : déclaration préalable, permis de construire ou aucune formalité, avec les sources officielles.</li>
            <li>Pièces générées : plans de situation, de masse, des façades et toitures, photomontage, notice, cerfa officiel rempli, bordereau, courrier ou email pour la mairie.</li>
            <li>Après le dépôt : calcul des délais d&apos;instruction et suivi jusqu&apos;à la décision ; pour le solaire, pack raccordement et Consuel.</li>
          </ul>
        </section>
        <section>
          <h2 className="text-2xl font-extrabold">Nos engagements</h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5">
            <li>Aucune règle inventée : chaque règle affichée cite sa source (service-public.fr, notices cerfa, code de l&apos;urbanisme) ; les points incertains sont signalés.</li>
            <li>Aucun envoi à la mairie sans votre accord : vous restez le déclarant, la décision appartient à la mairie.</li>
            <li>Prix publics : {PRICES.DP} € pour une déclaration préalable, {PRICES.PC} € pour un permis de construire, {PRICES.AGRI} € pour le solaire agricole, payés une fois au téléchargement. <Link href="/tarifs/" className="underline">Voir les tarifs</Link>.</li>
            <li>Vos données ne sont ni vendues ni partagées ; la mesure d&apos;audience se fait sans cookie.</li>
          </ul>
        </section>
        <section>
          <h2 className="text-2xl font-extrabold">Qui sommes-nous ?</h2>
          <p className="mt-3">Permizy est édité par une société par actions simplifiée créée le 2 septembre 2026, dont le siège est {LEGAL.address.street}, {LEGAL.address.postcode} {LEGAL.address.city} (SIREN {LEGAL.siren}). <Link href="/mentions-legales/" className="underline">Mentions légales</Link>.</p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
