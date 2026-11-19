import type { Metadata } from "next";
import Link from "next/link";
import { GUIDES } from "@/data/seo/guides";
import { breadcrumbLd } from "@/lib/seo/site";
import { JsonLd } from "@/components/seo/JsonLd";
import { SiteFooter, SiteHeader } from "@/components/seo/SiteChrome";
import { WorksIcon } from "@/components/home/WorksIcon";

export const metadata: Metadata = {
  title: "Guides : déclaration préalable et permis de construire",
  description: "Panneaux solaires, pompe à chaleur, fenêtres, isolation, extension : quelle autorisation demander à la mairie, quelles pièces, quels délais. Sources officielles.",
  alternates: { canonical: "/guides/" },
};

export default function GuidesIndex() {
  return (
    <div className="min-h-screen bg-cream text-ink">
      <JsonLd data={breadcrumbLd([{ name: "Accueil", path: "/" }, { name: "Guides", path: "/guides/" }])} />
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-5 pb-16 sm:px-10">
        <h1 className="text-4xl font-extrabold sm:text-5xl">Guides des démarches en mairie</h1>
        <p className="mt-3 max-w-2xl text-lg text-muted">Quelle autorisation pour vos travaux, quelles pièces fournir, combien de temps attendre : l&apos;essentiel, avec les sources officielles.</p>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {GUIDES.map((g) => (
            <li key={g.slug}>
              <Link href={`/${g.slug}/`} className="flex h-full gap-4 rounded-3xl border border-line bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
                <WorksIcon works={g.works} className="h-12 w-12 shrink-0" />
                <span>
                  <b className="block text-lg leading-tight">{g.h1}</b>
                  <span className="mt-1 block text-sm text-muted">{g.description}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <SiteFooter />
    </div>
  );
}
