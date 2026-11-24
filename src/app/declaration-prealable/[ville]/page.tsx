// Pages ville (SEO local) : données officielles datées et sourcées, aucune agence ni avis inventés.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ExternalLink } from "lucide-react";
import { CITIES, cityBySlug, docLabel, LOCAL_FETCHED_AT } from "@/data/seo/local";
import { breadcrumbLd, faqLd } from "@/lib/seo/site";
import { JsonLd } from "@/components/seo/JsonLd";
import { SiteFooter, SiteHeader } from "@/components/seo/SiteChrome";
import { GuideQuickCheck } from "@/components/seo/GuideQuickCheck";

export const dynamicParams = false;
export const generateStaticParams = () => CITIES.map((c) => ({ ville: c.slug }));
type Props = { params: Promise<{ ville: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = cityBySlug((await params).ville);
  if (!c) return {};
  const url = `/declaration-prealable/${c.slug}/`;
  const title = `Déclaration préalable à ${c.name} : mairie, PLU, dossier`;
  const description = `Déclaration préalable ou permis de construire à ${c.name} : mairie, ${c.plu.type ?? "document d'urbanisme"} en vigueur, secteurs protégés. Dossier complet dès 49 €.`;
  return { title: title.length + " | Permizy".length > 65 ? { absolute: title } : title, description, alternates: { canonical: url }, openGraph: { url, title, description, locale: "fr_FR", siteName: "Permizy", images: [{ url: "/og.png", width: 1200, height: 630 }] } };
}

const fr = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

export default async function CityPage({ params }: Props) {
  const c = cityBySlug((await params).ville);
  if (!c) notFound();
  const m = c.mairie;
  const p = c.plu;
  const paris = c.insee === "75056";
  const faq = [
    {
      q: `Où déposer une déclaration préalable à ${c.name} ?`,
      a: paris
        ? "À Paris, le dossier se dépose uniquement en ligne, au Bureau accueil et service à l'usager (BASU) de la Ville de Paris (service-public F36773)."
        : `À la mairie de ${c.name}${m?.address ? ` (${m.address})` : ""}, en ligne si la commune propose un téléservice, par lettre recommandée ou sur place.`,
    },
    {
      q: `Quel document d'urbanisme s'applique à ${c.name} ?`,
      a: p.type ? `Le ${docLabel(p.type)} « ${p.title} », publié sur le Géoportail de l'Urbanisme (version du ${fr(p.publication!)}).` : "Consultez le Géoportail de l'Urbanisme ou le service urbanisme de la mairie.",
    },
    {
      q: "Combien de temps la mairie a-t-elle pour répondre ?",
      a: "1 mois pour une déclaration préalable dans le cas général, 2 mois en secteur protégé ; 2 mois pour le permis de construire d'une maison individuelle (service-public).",
    },
  ];
  return (
    <div className="min-h-screen bg-cream text-ink">
      <JsonLd data={[faqLd(faq), breadcrumbLd([{ name: "Accueil", path: "/" }, { name: "Guides", path: "/guides/" }, { name: "Déclaration préalable", path: "/declaration-prealable-travaux/" }, { name: c.name, path: `/declaration-prealable/${c.slug}/` }])]} />
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 pb-16 sm:px-10">
        <nav aria-label="Fil d'Ariane" className="text-sm text-muted">
          <Link href="/" className="hover:underline">Accueil</Link> › <Link href="/declaration-prealable-travaux/" className="hover:underline">Déclaration préalable</Link> › {c.name}
        </nav>
        <h1 className="mt-4 text-4xl font-extrabold leading-tight sm:text-5xl">Déclaration préalable et permis de construire à {c.name}</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted">
          Panneaux solaires, pompe à chaleur, fenêtres, isolation, extension : à {c.name} comme partout en France, les seuils sont fixés par le code de l&apos;urbanisme, mais le règlement local décide de l&apos;aspect, des hauteurs et des distances. Voici les informations officielles utiles pour votre dossier.
        </p>
        <div className="mt-6">
          <GuideQuickCheck guide={`ville-${c.slug}`} />
        </div>

        <section className="mt-10">
          <h2 className="text-2xl font-bold">Où déposer votre dossier</h2>
          {paris ? (
            <p className="mt-3">À Paris, les déclarations préalables et permis de construire se déposent <b>uniquement en ligne</b>, auprès du Bureau accueil et service à l&apos;usager (BASU) de la Ville de Paris, sur son guichet électronique (source : service-public F36773 et F1997).</p>
          ) : (
            <p className="mt-3">Le dossier se dépose à la mairie de la commune où se trouve le terrain : par voie dématérialisée selon les dispositions prises par la commune, par lettre recommandée avec avis de réception ou sur place (service-public F17578).</p>
          )}
          {m && (
            <dl className="mt-4 grid gap-2 rounded-3xl bg-white p-5 text-sm sm:grid-cols-[10rem_1fr]" data-testid="city-mairie">
              <dt className="font-semibold">Mairie</dt>
              <dd>{m.name}</dd>
              {m.address && (<><dt className="font-semibold">Adresse</dt><dd>{m.address}</dd></>)}
              {m.phone && (<><dt className="font-semibold">Téléphone</dt><dd>{m.phone}</dd></>)}
              {m.website && (<><dt className="font-semibold">Site</dt><dd><a href={m.website} rel="nofollow noopener" target="_blank" className="text-brand-700 underline">{m.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}</a></dd></>)}
              <dt className="font-semibold">Source</dt>
              <dd><a href={m.source} rel="nofollow noopener" target="_blank" className="text-brand-700 underline">Annuaire de l&apos;administration (service-public)</a>, relevé le {fr(LOCAL_FETCHED_AT)}</dd>
            </dl>
          )}
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-bold">Le règlement d&apos;urbanisme applicable</h2>
          {p.rnu ? (
            <p className="mt-3">{c.name} relève du règlement national d&apos;urbanisme (RNU), selon le Géoportail de l&apos;Urbanisme.</p>
          ) : p.type ? (
            <>
              <p className="mt-3">
                {c.name} est couverte par le {docLabel(p.type)} <b>« {p.title} »</b>, publié sur le Géoportail de l&apos;Urbanisme (version du {fr(p.publication!)}). C&apos;est lui qui fixe, zone par zone, les règles d&apos;aspect extérieur, de hauteur et d&apos;implantation que votre projet doit respecter.
              </p>
              {p.url && (
                <a href={p.url} rel="nofollow noopener" target="_blank" className="mt-3 inline-flex items-center gap-1 text-brand-700 underline">
                  Consulter le document sur le Géoportail de l&apos;Urbanisme <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </>
          ) : (
            <p className="mt-3">Consultez le Géoportail de l&apos;Urbanisme ou le service urbanisme de la mairie pour connaître le document applicable.</p>
          )}
          {p.psmv && p.psmv.length > 0 && (
            <p className="mt-4 rounded-2xl bg-sun-soft p-4 text-sm">
              Une partie de {c.name} est couverte par un <b>plan de sauvegarde et de mise en valeur</b> (site patrimonial remarquable). Dans ce périmètre, l&apos;architecte des Bâtiments de France est consulté et le délai d&apos;instruction d&apos;une déclaration préalable passe à 2 mois. <Link href="/travaux-abords-monument-historique-abf/" className="underline">Voir notre guide ABF</Link>.
            </p>
          )}
          <p className="mt-4 text-sm text-muted">Permizy interroge ces sources pour votre adresse exacte : zone du PLU, abords de monuments historiques, servitudes, risques.</p>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-bold">Les démarches les plus fréquentes</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {[
              ["/declaration-prealable-panneaux-solaires/", "Panneaux solaires sur le toit"],
              ["/declaration-prealable-pompe-a-chaleur/", "Pompe à chaleur, climatisation"],
              ["/declaration-prealable-fenetres-portes-volets/", "Fenêtres, portes, volets"],
              ["/declaration-prealable-isolation-exterieure/", "Isolation par l'extérieur"],
              ["/permis-de-construire-extension-garage-veranda/", "Extension, garage, véranda"],
              ["/declaration-prealable-piscine/", "Piscine"],
            ].map(([href, label]) => (
              <li key={href}><Link href={href} className="block rounded-2xl border border-line bg-white p-4 font-semibold hover:shadow">{label}</Link></li>
            ))}
          </ul>
        </section>

        <section className="mt-10 rounded-3xl bg-white p-6">
          <h2 className="text-2xl font-bold">Votre dossier prêt à déposer à {c.name}</h2>
          <p className="mt-2">Vérification gratuite des règles de votre adresse, puis dossier complet (plans, photomontage, cerfa rempli) à partir de <b>49 €</b> pour une déclaration préalable, <b>149 €</b> pour un permis de construire. Rien n&apos;est envoyé à la mairie sans votre accord.</p>
          <Link href="/verifier/" prefetch={false} className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-3 font-bold text-white" data-track={`guide_cta:ville-${c.slug}`}>
            Vérifier mon adresse <ArrowRight className="h-4 w-4" />
          </Link>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-bold">Questions fréquentes</h2>
          {faq.map((f) => (
            <details key={f.q} className="mt-3 rounded-2xl bg-white p-4">
              <summary className="cursor-pointer font-semibold">{f.q}</summary>
              <p className="mt-2 text-sm">{f.a}</p>
            </details>
          ))}
        </section>

        <nav className="mt-10 text-sm" aria-label="Autres villes">
          <p className="font-bold">Autres villes</p>
          <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
            {CITIES.filter((x) => x.slug !== c.slug).map((x) => (
              <Link key={x.slug} href={`/declaration-prealable/${x.slug}/`} className="text-brand-700 underline">{x.name}</Link>
            ))}
          </p>
        </nav>
        <p className="mt-6 text-xs text-muted">Informations générales relevées le {fr(LOCAL_FETCHED_AT)} sur des sources publiques (Annuaire de l&apos;administration, Géoportail de l&apos;Urbanisme, service-public.fr). Elles ne remplacent pas le règlement d&apos;urbanisme de la commune ; la décision appartient à la mairie. Permizy n&apos;est pas un service de la mairie.</p>
      </main>
      <SiteFooter />
    </div>
  );
}
