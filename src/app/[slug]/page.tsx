// Pages guides (une par intention de recherche), générées statiquement à partir de src/data/seo/guides.ts.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ExternalLink } from "lucide-react";
import { GUIDES, guideBySlug, clusterOf } from "@/data/seo/guides";
import { abs, breadcrumbLd, faqLd, serviceLd } from "@/lib/seo/site";
import { JsonLd } from "@/components/seo/JsonLd";
import { SiteFooter, SiteHeader } from "@/components/seo/SiteChrome";
import { WorksIcon } from "@/components/home/WorksIcon";
import { GuideVideo } from "@/components/seo/GuideVideo";
import { GuideQuickCheck } from "@/components/seo/GuideQuickCheck";
import { videoForGuide } from "@/data/seo/videos";
import { CITIES } from "@/data/seo/local";

export const dynamicParams = false;
export const generateStaticParams = () => GUIDES.map((g) => ({ slug: g.slug }));

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const g = guideBySlug((await params).slug);
  if (!g) return {};
  const url = `/${g.slug}/`;
  return {
    // suffixe « | Permizy » seulement s'il tient dans ~65 caractères (sinon tronqué par Google)
    title: g.title.length + " | Permizy".length > 65 ? { absolute: g.title } : g.title,
    description: g.description,
    alternates: { canonical: url },
    openGraph: { type: "article", url, title: g.title, description: g.description, modifiedTime: g.updated, locale: "fr_FR", siteName: "Permizy", images: [{ url: "/og.png", width: 1200, height: 630 }] },
  };
}

const fr = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

export default async function GuidePage({ params }: Props) {
  const g = guideBySlug((await params).slug);
  if (!g) notFound();
  const cluster = clusterOf(g.slug);
  const pillar = cluster && cluster.pillar !== g.slug ? guideBySlug(cluster.pillar) : undefined;
  const siblings = (cluster?.slugs ?? []).filter((x) => x !== g.slug).map((x) => guideBySlug(x)).filter(Boolean) as { slug: string; h1: string; title: string }[];
  const related = g.related.map((s) => (s === "tarifs" ? { slug: "tarifs", h1: "Nos tarifs : 49 €, 149 €, 239 €" } : guideBySlug(s))).filter(Boolean) as { slug: string; h1: string }[];
  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: g.h1,
    description: g.description,
    inLanguage: "fr-FR",
    dateModified: g.updated,
    mainEntityOfPage: abs(`/${g.slug}/`),
    author: { "@id": "https://permizy.com/#organization" },
    publisher: { "@id": "https://permizy.com/#organization" },
  };
  return (
    <div className="min-h-screen bg-cream text-ink">
      <JsonLd data={[article, faqLd(g.faq), breadcrumbLd([{ name: "Accueil", path: "/" }, { name: "Guides", path: "/guides/" }, ...(pillar ? [{ name: pillar.h1, path: `/${pillar.slug}/` }] : []), { name: g.h1, path: `/${g.slug}/` }]), ...(g.price ? [serviceLd] : [])]} />
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 pb-16 sm:px-10">
        <nav aria-label="Fil d'Ariane" className="text-sm text-muted">
          <Link href="/" className="hover:underline">Accueil</Link> › <Link href="/guides/" className="hover:underline">Guides</Link>
          {pillar && (
            <>
              {" › "}
              <Link href={`/${pillar.slug}/`} className="hover:underline">{cluster?.label}</Link>
            </>
          )}
        </nav>
        <article>
          <header className="mt-4">
            <WorksIcon works={g.works} className="h-14 w-14" />
            <h1 className="mt-4 text-4xl font-extrabold leading-tight sm:text-5xl">{g.h1}</h1>
            <p className="mt-4 text-lg leading-relaxed text-muted">{g.lead}</p>
            <p className="mt-2 text-xs text-muted">Mis à jour le {fr(g.updated)} · sources officielles en bas de page</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link href={g.cta.href} prefetch={false} className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-3 font-bold text-white" data-testid="guide-cta" data-track={`guide_cta:${g.slug.slice(0, 40)}`}>
                {g.cta.label} <ArrowRight className="h-4 w-4" />
              </Link>
              {g.price && (
                <span className="text-sm text-muted">
                  Vérification gratuite · {g.price.label} : <b className="text-ink">{g.price.amount} € TTC</b>
                </span>
              )}
            </div>
          </header>

          {videoForGuide(g.slug) && <GuideVideo v={videoForGuide(g.slug)!} />}

          {g.sections.map((s) => (
            <section key={s.h2} className="mt-10">
              <h2 className="text-2xl font-extrabold">{s.h2}</h2>
              {s.p?.map((t) => <p key={t} className="mt-3 leading-relaxed">{t}</p>)}
              {s.list && (
                <ul className="mt-3 list-disc space-y-1.5 pl-5 leading-relaxed">
                  {s.list.map((t) => <li key={t}>{t}</li>)}
                </ul>
              )}
              {s.table && (
                <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-white">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-mint">
                      <tr>{s.table.head.map((h) => <th key={h} scope="col" className="px-4 py-2.5 font-bold">{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {s.table.rows.map((r) => (
                        <tr key={r.join("|")} className="border-t border-line">
                          {r.map((c, i) => <td key={i} className="px-4 py-2.5">{c}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {s.figure && (
                <figure className="mt-4">
                  <picture>
                    {s.figure.mobile && <source media="(max-width: 640px)" srcSet={s.figure.mobile.src} width={s.figure.mobile.width} height={s.figure.mobile.height} />}
                    <img src={s.figure.src} alt={s.figure.alt} width={s.figure.width} height={s.figure.height} loading="lazy" decoding="async" className="h-auto w-full rounded-2xl border border-line" />
                  </picture>
                  <figcaption className="mt-1.5 text-xs text-muted">{s.figure.caption}</figcaption>
                </figure>
              )}
              {s.note?.map((t) => <p key={t} className="mt-3 text-sm leading-relaxed text-muted">{t}</p>)}
            </section>
          ))}

          {g.cta.href.startsWith("/verifier/") ? (
            <section className="mt-12">
              <GuideQuickCheck works={g.cta.href.includes("?w=") ? g.works : undefined} guide={g.slug} intent={g.cta.href.includes("intent=pc") ? "pc" : undefined} />
            </section>
          ) : (
            <section className="mt-12 rounded-3xl bg-ink p-6 text-white sm:p-8">
              <h2 className="text-2xl font-extrabold">Votre dossier, prêt à déposer</h2>
              <p className="mt-2 text-white/80">Saisissez votre adresse : Permizy lit le cadastre, le PLU et les périmètres protégés, dessine les plans, remplit le cerfa et prépare l&apos;envoi à votre mairie. Aucun envoi sans votre accord.</p>
              <Link href={g.cta.href} prefetch={false} data-track={`guide_cta:${g.slug.slice(0, 40)}`} className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-bold text-ink">
                {g.cta.label} <ArrowRight className="h-4 w-4" />
              </Link>
            </section>
          )}

          <section className="mt-12">
            <h2 className="text-2xl font-extrabold">Questions fréquentes</h2>
            <dl className="mt-4 divide-y divide-line rounded-2xl border border-line bg-white">
              {g.faq.map((f) => (
                <div key={f.q} className="p-5">
                  <dt className="font-bold">{f.q}</dt>
                  <dd className="mt-1.5 leading-relaxed text-muted">{f.a}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="mt-10">
            <h2 className="text-lg font-bold">Sources officielles</h2>
            <ul className="mt-2 space-y-1 text-sm">
              {g.sources.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-brand-700 underline">
                    {s.label} <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted">Ces informations générales ne remplacent pas le règlement d&apos;urbanisme de votre commune, que Permizy consulte pour votre adresse. La décision appartient à la mairie.</p>
          </section>

          {siblings.length > 0 && (
            <nav className="mt-10 rounded-3xl bg-white p-5" aria-label={`Guides : ${cluster?.label}`} data-testid="cluster-nav">
              <h2 className="text-lg font-bold">Dans le même thème : {cluster?.label.toLowerCase()}</h2>
              <ul className="mt-2 space-y-1.5 text-sm">
                {siblings.map((r) => (
                  <li key={r.slug}>
                    <Link href={`/${r.slug}/`} className="text-brand-700 underline-offset-2 hover:underline">{r.title}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          {g.slug === "declaration-prealable-travaux" && (
            <nav className="mt-10 text-sm" aria-label="Déclaration préalable par ville" data-testid="pillar-cities">
              <h2 className="text-lg font-bold">Déclaration préalable dans votre ville</h2>
              <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                {CITIES.map((c) => (
                  <Link key={c.slug} href={`/declaration-prealable/${c.slug}/`} className="text-brand-700 underline">{c.name}</Link>
                ))}
              </p>
            </nav>
          )}

          {related.length > 0 && (
            <section className="mt-10">
              <h2 className="text-lg font-bold">À lire aussi</h2>
              <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                {related.map((r) => (
                  <li key={r.slug}>
                    <Link href={`/${r.slug}/`} className="block rounded-2xl border border-line bg-white p-4 font-semibold hover:shadow">
                      {r.h1}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
