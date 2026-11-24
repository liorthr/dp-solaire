// En-tête et pied de page des pages publiques (accueil, guides, tarifs) : maillage interne vers tous les guides.
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { CLUSTERS, guideBySlug } from "@/data/seo/guides";
import { SOCIAL } from "@/lib/seo/site";

export function SiteHeader() {
  return (
    <header className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-10">
      <Link href="/" aria-label="Permizy : accueil">
        <Logo />
      </Link>
      <nav className="hidden gap-8 font-medium text-muted lg:flex" aria-label="Navigation du site">
        <Link href="/guides/">Guides</Link>
        <Link href="/tarifs/">Tarifs</Link>
        <Link href="/panneaux-solaires-agricoles-hangar/">Agricole</Link>
      </nav>
      <div className="flex gap-2">
        <Link href="/connexion/" prefetch={false} className="rounded-full border-2 border-ink px-4 py-2 text-sm font-bold sm:px-5">
          Mon dossier
        </Link>
        <Link href="/verifier/" prefetch={false} className="hidden rounded-full bg-ink px-5 py-2 text-sm font-bold text-white sm:inline-block">
          Commencer
        </Link>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 text-sm sm:px-10 md:grid-cols-[1fr_2fr]">
        <div>
          <Logo size="sm" />
          <p className="mt-3 max-w-xs text-muted">Déclaration préalable et permis de construire en ligne : règles de votre commune, plans, cerfa rempli et envoi à la mairie.</p>
        </div>
        <nav aria-label="Guides" className="grid gap-x-6 gap-y-6 sm:grid-cols-2">
          {CLUSTERS.map((c) => (
            <div key={c.id}>
              <p className="font-bold text-ink">{c.label}</p>
              <ul className="mt-2 space-y-1.5">
                {c.slugs.map((x) => {
                  const g = guideBySlug(x);
                  return g ? (
                    <li key={x}>
                      <Link href={`/${x}/`} className="text-muted hover:text-ink hover:underline">{g.h1.replace(/ : .*$/, "")}</Link>
                    </li>
                  ) : null;
                })}
              </ul>
            </div>
          ))}
          <div>
            <p className="font-bold text-ink">Permizy</p>
            <ul className="mt-2 space-y-1.5">
              <li><Link href="/verifier/" prefetch={false} className="text-muted hover:text-ink hover:underline">Vérification gratuite</Link></li>
              <li><Link href="/tarifs/" className="text-muted hover:text-ink hover:underline">Tarifs : dès 49 €</Link></li>
              <li><Link href="/guides/" className="text-muted hover:text-ink hover:underline">Tous les guides</Link></li>
              {SOCIAL.map((x) => (
                <li key={x.url}><a href={x.url} rel="me noopener" target="_blank" className="text-muted hover:text-ink hover:underline">{x.label}</a></li>
              ))}
            </ul>
          </div>
        </nav>
      </div>
      <div className="mx-auto flex max-w-7xl flex-wrap gap-x-4 gap-y-1 px-5 pb-8 text-xs text-muted sm:px-10">
        <Link href="/a-propos/" className="underline">À propos</Link>
        <Link href="/mentions-legales/" className="underline">Mentions légales</Link>
        <Link href="/cgu/" className="underline">Conditions et responsabilité</Link>
        <Link href="/connexion/" prefetch={false} className="underline">Espace professionnels</Link>
        <Link href="/sante/" className="underline">État des sources</Link>
      </div>
    </footer>
  );
}
