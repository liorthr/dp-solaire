import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL } from "@/lib/legal";
import { SiteFooter, SiteHeader } from "@/components/seo/SiteChrome";

export const metadata: Metadata = {
  title: "Mentions légales",
  description: "Mentions légales de Permizy : éditeur (SAS, SIREN 109 443 754, Paris), hébergement, données personnelles et mesure d'audience sans cookie.",
  alternates: { canonical: "/mentions-legales/" },
};

export default function MentionsLegales() {
  const a = LEGAL.address;
  return (
    <div className="min-h-screen bg-cream text-ink">
      <SiteHeader />
      <main className="mx-auto max-w-3xl space-y-8 px-5 pb-16 leading-relaxed sm:px-10">
        <h1 className="text-4xl font-extrabold">Mentions légales</h1>
        <section>
          <h2 className="text-xl font-bold">Éditeur du site</h2>
          <ul className="mt-2 space-y-1">
            <li>Nom commercial : {LEGAL.brand}</li>
            <li>Forme : {LEGAL.form}</li>
            <li>Siège social : {a.street}, {a.postcode} {a.city}</li>
            <li>SIREN : {LEGAL.siren} · SIRET du siège : {LEGAL.siret} · {LEGAL.rcs}</li>
            <li>N° de TVA intracommunautaire : {LEGAL.vat}</li>
            <li>Activité : {LEGAL.naf}</li>
            <li>Présidente : la société {LEGAL.president} ; directeur de la publication : son représentant légal</li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-bold">Hébergement</h2>
          <ul className="mt-2 space-y-1">
            <li>Site : Hostinger International Ltd, 61 Lordou Vironos Street, 6023 Larnaca, Chypre.</li>
            <li>Comptes et dossiers en ligne : Supabase, données hébergées dans la région AWS eu-west-3 (Paris).</li>
            <li>Paiement : Stripe Payments Europe Ltd ; Permizy ne voit ni ne conserve les numéros de carte.</li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-bold">Rôle de Permizy</h2>
          <p className="mt-2">Permizy est un outil d&apos;aide à la préparation de dossiers d&apos;urbanisme. Il n&apos;est ni un service de l&apos;État ni une mairie. Le déclarant reste seul responsable de sa demande ; la décision appartient à l&apos;autorité compétente. Les règles affichées citent leurs sources officielles. Voir aussi les <Link href="/cgu/" className="underline">conditions générales</Link>.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold">Données personnelles</h2>
          <p className="mt-2">Les données d&apos;un compte (identité, adresse du projet, photos, pièces) servent uniquement à préparer et suivre les dossiers. Elles ne sont ni vendues ni transmises à des tiers, hors prestataires techniques ci-dessus. Vous pouvez exporter vos données depuis « Mon compte » et demander leur suppression par courrier au siège social.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold">Mesure d&apos;audience sans cookie</h2>
          <p className="mt-2">Permizy compte les pages vues et les grandes étapes du parcours (vérification lancée, dossier créé, paiement) sans cookie, sans identifiant et sans enregistrer votre adresse IP, votre adresse postale ni les paramètres des URL. Ces statistiques sont anonymes et ne permettent pas de vous suivre d&apos;une visite à l&apos;autre. Si votre navigateur envoie le signal « Do Not Track » ou « Global Privacy Control », aucune mesure n&apos;est faite.</p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
