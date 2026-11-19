// En-tête et pied de page des pages publiques (accueil, guides, tarifs) : maillage interne vers tous les guides.
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { GUIDES } from "@/data/seo/guides";

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
        <Link href="/connexion/" className="rounded-full border-2 border-ink px-4 py-2 text-sm font-bold sm:px-5">
          Mon dossier
        </Link>
        <Link href="/verifier/" className="hidden rounded-full bg-ink px-5 py-2 text-sm font-bold text-white sm:inline-block">
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
        <nav aria-label="Guides" className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
          {GUIDES.map((g) => (
            <Link key={g.slug} href={`/${g.slug}/`} className="text-muted hover:text-ink hover:underline">
              {g.h1.replace(/ : .*$/, "")}
            </Link>
          ))}
          <Link href="/tarifs/" className="text-muted hover:text-ink hover:underline">Tarifs</Link>
        </nav>
      </div>
      <div className="mx-auto flex max-w-7xl flex-wrap gap-x-4 gap-y-1 px-5 pb-8 text-xs text-muted sm:px-10">
        <Link href="/cgu/" className="underline">Conditions et responsabilité</Link>
        <Link href="/connexion/" className="underline">Espace professionnels</Link>
        <Link href="/sante/" className="underline">État des sources</Link>
      </div>
    </footer>
  );
}
