import type { Metadata } from "next";
import Link from "next/link";
import { CLUSTERS, guideBySlug, type Guide } from "@/data/seo/guides";
import { CITIES } from "@/data/seo/local";
import { breadcrumbLd } from "@/lib/seo/site";
import { JsonLd } from "@/components/seo/JsonLd";
import { SiteFooter, SiteHeader } from "@/components/seo/SiteChrome";
import { WorksIcon } from "@/components/home/WorksIcon";

export const metadata: Metadata = {
  title: "Guides : déclaration préalable et permis de construire",
  description: "Solaire, pompe à chaleur, fenêtres, piscine, abri, extension : quelle autorisation, quelles pièces, quels délais. Sources officielles, dossier dès 49 €.",
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
        <nav aria-label="Thèmes" className="mt-6 flex flex-wrap gap-2">
          {[...CLUSTERS, { id: "villes", label: "Par ville" }].map((c) => (
            <a key={c.id} href={`#${c.id}`} className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold hover:border-brand-600">{c.label}</a>
          ))}
        </nav>
        {CLUSTERS.map((c) => (
          <section key={c.id} id={c.id} className="mt-10 scroll-mt-24" data-testid={`cluster-${c.id}`}>
            <h2 className="text-2xl font-extrabold">{c.label}</h2>
            <ul className="mt-4 grid gap-4 sm:grid-cols-2">
              {(c.slugs.map((x) => guideBySlug(x)).filter(Boolean) as Guide[]).map((g) => (
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
          </section>
        ))}
        <section id="villes" className="mt-10 scroll-mt-24" data-testid="cities">
          <h2 className="text-2xl font-extrabold">Démarches par ville</h2>
          <p className="mt-2 text-muted">Mairie, document d&apos;urbanisme en vigueur et secteurs protégés, d&apos;après les sources officielles.</p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {CITIES.map((c) => (
              <li key={c.slug}><Link href={`/declaration-prealable/${c.slug}/`} className="block rounded-full border border-line bg-white px-4 py-2 font-semibold hover:border-brand-600">{c.name}</Link></li>
            ))}
          </ul>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
