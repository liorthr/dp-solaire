import Link from "next/link";
import { GreenStamp } from "@/components/Logo";
import { JsonLd } from "@/components/seo/JsonLd";
import { SiteFooter, SiteHeader } from "@/components/seo/SiteChrome";
import { faqLd, organizationLd, serviceLd, websiteLd } from "@/lib/seo/site";
import { GUIDES } from "@/data/seo/guides";
import { SentenceBuilder } from "@/components/home/SentenceBuilder";
import { WorksIcon } from "@/components/home/WorksIcon";
import type { WorksType } from "@/lib/types";

const AVAILABLE: { id: WorksType; title: string; desc: string }[] = [
  { id: "pv", title: "Panneaux solaires", desc: "DP, puis raccordement et Consuel" },
  { id: "pac", title: "Pompe à chaleur", desc: "Emplacement et bruit vérifiés" },
  { id: "menuiserie", title: "Fenêtres, portes, volets", desc: "Matériaux, couleurs, vues" },
  { id: "velux", title: "Fenêtres de toit", desc: "Combles et distances" },
  { id: "ite", title: "Isolation extérieure", desc: "Teinte, surplomb, ABF" },
  { id: "extension", title: "Agrandissement, garage, véranda", desc: "Déclaration ou permis de construire" },
];
/** offre agricole : exploitants et installateurs, parcours professionnel */
const AGRI_HREF = `/connexion/?mode=signup&pro=1&next=${encodeURIComponent("/app/nouveau/?works=pv_agri")}`;
export const metadata = { alternates: { canonical: "/" } };

const HOME_FAQ = [
  { q: "Qu'est-ce qu'une déclaration préalable de travaux ?", a: "C'est l'autorisation d'urbanisme demandée à la mairie pour des travaux de faible importance qui modifient l'aspect extérieur d'une maison : panneaux solaires, pompe à chaleur en façade, changement de fenêtres, isolation par l'extérieur, petite extension. La mairie répond en 1 mois dans le cas général." },
  { q: "Déclaration préalable ou permis de construire ?", a: "Le permis de construire concerne les projets plus importants, par exemple une extension de plus de 40 m² en zone urbaine d'un PLU, ou de plus de 20 m² ailleurs. Permizy lit le zonage de votre commune et vous indique la bonne démarche." },
  { q: "Combien coûte un dossier avec Permizy ?", a: "La vérification est gratuite. Le dossier complet coûte 49 € TTC pour une déclaration préalable, 149 € pour un permis de construire et 239 € pour le solaire agricole, payés une fois au téléchargement." },
  { q: "Permizy dépose-t-il le dossier à ma place ?", a: "Non : rien n'est envoyé sans votre accord. Permizy prépare le dossier complet, le courrier ou l'email pour la bonne mairie, et vous guide pour le déposer en ligne, par email ou en mairie." },
];

const SOON = [
  { title: "Piscine", desc: "Les règles : notre guide", href: "/declaration-prealable-piscine/" },
  { title: "Abri, carport, pergola", desc: "Les seuils : notre guide", href: "/pergola-carport-declaration-prealable/" },
  { title: "Clôture, mur", desc: "Selon votre commune : notre guide", href: "/cloture-declaration-prealable/" },
];

function HouseArt() {
  return (
    <div className="relative mx-auto h-[420px] w-full max-w-[520px] sm:h-[540px]" aria-hidden>
      <div className="absolute inset-x-4 bottom-0 top-10 overflow-hidden rounded-[40px] bg-sky">
        <svg viewBox="0 0 520 520" className="h-full w-full" preserveAspectRatio="xMidYMax slice">
          <circle cx="410" cy="110" r="46" fill="#ffb84d" />
          <rect x="0" y="400" width="520" height="120" fill="#9fd3a8" />
          <path d="M90 250 L260 120 L430 250 Z" fill="#c75b3f" />
          <path d="M165 192 L260 120 L355 192 L330 211 L260 158 L190 211 Z" fill="#203040" opacity=".9" />
          <rect x="120" y="250" width="280" height="160" fill="#fbf6ee" />
          <rect x="160" y="290" width="54" height="54" rx="4" fill="#9fc3e6" stroke="#1f6b4a" strokeWidth="6" />
          <rect x="306" y="290" width="54" height="54" rx="4" fill="#9fc3e6" stroke="#1f6b4a" strokeWidth="6" />
          <rect x="236" y="320" width="48" height="90" rx="4" fill="#1f6b4a" />
          <rect x="414" y="350" width="46" height="38" rx="6" fill="#fff" stroke="#13231c" strokeWidth="3" />
          <circle cx="431" cy="369" r="11" fill="none" stroke="#13231c" strokeWidth="3" />
          <circle cx="60" cy="350" r="44" fill="#2f8f63" />
          <rect x="54" y="380" width="12" height="30" fill="#7a5537" />
        </svg>
      </div>
      <GreenStamp className="absolute right-0 top-0 h-40 w-40 text-[15px] sm:h-52 sm:w-52 sm:text-[19px]" />
      <div className="absolute left-0 top-[52%] flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm shadow-xl">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-mint font-extrabold text-brand-600">1</span>
        <span>
          <b className="block">Déclaration préalable</b>Délai de la mairie : 1 mois
        </span>
      </div>
      <div className="absolute bottom-6 right-0 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm shadow-xl">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-sun-soft font-extrabold text-[#8a5200]">8</span>
        <span>
          <b className="block">Pièces générées</b>Plans, cerfa, photomontage
        </span>
      </div>
    </div>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-cream text-ink">
      <JsonLd data={[organizationLd, websiteLd, serviceLd, faqLd(HOME_FAQ)]} />
      <SiteHeader />

      <main>
        <section className="mx-auto grid max-w-7xl items-center gap-10 px-5 pb-16 pt-6 sm:px-10 lg:grid-cols-[1.2fr_.8fr] lg:gap-14">
          <div className="min-w-0">
            <h1 className="inline-flex items-center gap-2 rounded-full bg-mint px-3.5 py-2 text-xs font-bold text-brand-600 sm:text-sm"><span aria-hidden>●</span> Déclaration préalable et permis de construire en ligne</h1>
            <p className="mt-5 text-[42px] font-extrabold leading-[1.04] sm:text-6xl lg:text-[54px] xl:text-[62px]">
              Vos travaux.
              <br />
              Le <span className="highlight text-brand-600">oui</span> de la mairie.
              <br />
              Sans la paperasse.
            </p>
            <p className="mt-6 max-w-[640px] text-lg leading-relaxed text-muted sm:text-xl">
              Dites-nous ce que vous voulez faire. Permizy vérifie les règles de votre commune, dessine les plans, remplit le cerfa et prépare l&apos;envoi à la bonne mairie.
            </p>
            <div className="mt-8">
              <SentenceBuilder />
            </div>
            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-muted">
              <span>
                <b className="text-brand-600">✓</b> Règles officielles sourcées
              </span>
              <span>
                <b className="text-brand-600">✓</b> Vous validez avant tout envoi
              </span>
              <span>
                <b className="text-brand-600">✓</b> Vos données restent les vôtres
              </span>
            </div>
          </div>
          <HouseArt />
        </section>

        <section id="travaux" className="bg-white px-5 py-16 sm:px-10">
          <div className="mx-auto max-w-7xl">
            <span className="rounded-full bg-mint px-3.5 py-2 text-sm font-bold text-brand-600">Vos travaux</span>
            <h2 className="mt-4 text-4xl font-extrabold sm:text-[46px]">Un projet, un dossier prêt à déposer</h2>
            <p className="mt-2 text-lg text-muted">Permizy connaît les règles de chaque type de travaux : vous répondez à quelques questions, on fait le reste.</p>
            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
              <Link href={AGRI_HREF} prefetch={false} data-testid="home-agri" className="flex min-h-44 flex-col justify-between rounded-3xl border border-line bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
                <WorksIcon works="pv" className="h-14 w-14" />
                <span>
                  <b className="mt-4 block text-lg leading-tight">Solaire agricole</b>
                  <span className="text-sm text-muted">Hangar, stabulation : DP, raccordement fortes puissances</span>
                </span>
              </Link>
              <Link href="/verifier/?w=extension&intent=pc" prefetch={false} data-testid="home-permis" className="flex min-h-44 flex-col justify-between rounded-3xl border border-line bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
                <WorksIcon works="extension" className="h-14 w-14" />
                <span>
                  <b className="mt-4 block text-lg leading-tight">Demande de permis de construire</b>
                  <span className="text-sm text-muted">Extension, garage, véranda : cerfa 13406 et plans</span>
                </span>
              </Link>
              {AVAILABLE.map((w) => (
                <Link key={w.id} href={`/verifier/?w=${w.id}`} prefetch={false} className="flex min-h-44 flex-col justify-between rounded-3xl border border-line bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
                  <WorksIcon works={w.id} className="h-14 w-14" />
                  <span>
                    <b className="mt-4 block text-lg leading-tight">{w.title}</b>
                    <span className="text-sm text-muted">{w.desc}</span>
                  </span>
                </Link>
              ))}
              <Link href="/verifier/?w=extension&intent=pc" prefetch={false} data-track="home-maison-neuve" data-testid="home-maison-neuve" className="flex min-h-44 flex-col justify-between rounded-3xl border border-line bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
                <span className="self-start rounded-md bg-mint px-2 py-1 text-[11px] font-extrabold uppercase tracking-wider text-brand-600">Mise en relation</span>
                <span>
                  <b className="block text-lg leading-tight">Maison neuve</b>
                  <span className="text-sm text-muted">Permis de construire avec un architecte partenaire</span>
                </span>
              </Link>
              {SOON.map((w) => (
                <Link key={w.title} href={w.href} className="flex min-h-44 flex-col justify-between rounded-3xl border border-dashed border-line p-5 transition hover:border-brand-600">
                  <span className="self-start rounded-md bg-sun-soft px-2 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#8a5200]">Dossier bientôt</span>
                  <span>
                    <b className="block text-lg leading-tight">{w.title}</b>
                    <span className="text-sm text-muted">{w.desc}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section id="comment" className="mx-auto max-w-7xl px-5 py-16 sm:px-10">
          <span className="rounded-full bg-mint px-3.5 py-2 text-sm font-bold text-brand-600">Comment ça marche</span>
          <h2 className="mt-4 text-4xl font-extrabold sm:text-[46px]">Trois étapes, et c&apos;est la mairie qui travaille</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              { n: 1, bg: "bg-mint", c: "text-brand-600", i: "?", t: "Vous racontez votre projet", d: "5 minutes de questions simples, depuis votre téléphone. Trois photos de la maison, une signature." },
              { n: 2, bg: "bg-sun-soft", c: "text-[#8a5200]", i: "✎", t: "On prépare tout", d: "Cadastre, PLU, monuments historiques : vérifiés. Plans à l'échelle, photomontage et cerfa : générés. Vous relisez." },
              { n: 3, bg: "bg-sky", c: "text-[#2b5d8a]", i: "✓", t: "On suit jusqu'au feu vert", d: "Envoi à la bonne mairie après votre accord, rappels de délais, réponse aux demandes de pièces." },
            ].map((s) => (
              <div key={s.n} className={`relative rounded-[26px] p-7 ${s.bg}`}>
                <span className="absolute right-6 top-2 text-6xl font-black opacity-20">{s.n}</span>
                <span className={`grid h-10 w-10 place-items-center rounded-xl bg-white font-extrabold ${s.c}`}>{s.i}</span>
                <h3 className="mt-4 text-2xl font-bold">{s.t}</h3>
                <p className="mt-2 leading-relaxed opacity-80">{s.d}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="confiance" className="bg-ink px-5 py-16 text-white sm:px-10">
          <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-3">
            <div>
              <h2 className="text-3xl font-extrabold">Rien n&apos;est inventé.</h2>
              <p className="mt-3 text-white/80">Chaque règle affichée cite sa source officielle (service-public.fr, Géoportail de l&apos;Urbanisme, cadastre). Quand un point est incertain, on vous le dit.</p>
            </div>
            <div>
              <h2 className="text-3xl font-extrabold">Vous gardez la main.</h2>
              <p className="mt-3 text-white/80">Aucun envoi à la mairie et aucune signature sans votre clic de confirmation. Tout ce qui est proposé automatiquement reste modifiable.</p>
            </div>
            <div>
              <h2 className="text-3xl font-extrabold">Honnête sur l&apos;issue.</h2>
              <p className="mt-3 text-white/80">Permizy prépare un dossier complet et soigné ; la décision appartient à la mairie. Vous restez le déclarant.</p>
            </div>
          </div>
        </section>
        <section id="guides" className="bg-white px-5 py-16 sm:px-10">
          <div className="mx-auto max-w-7xl">
            <h2 className="text-4xl font-extrabold">Quelle autorisation pour vos travaux ?</h2>
            <p className="mt-2 text-lg text-muted">Nos guides, avec les sources officielles.</p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {GUIDES.map((g) => (
                <li key={g.slug}>
                  <Link href={`/${g.slug}/`} className="block h-full rounded-2xl border border-line p-4 font-semibold hover:shadow">
                    {g.h1}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="faq" className="px-5 py-16 sm:px-10">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-4xl font-extrabold">Questions fréquentes</h2>
            <dl className="mt-6 divide-y divide-line rounded-2xl border border-line bg-white">
              {HOME_FAQ.map((f) => (
                <div key={f.q} className="p-5">
                  <dt className="font-bold">{f.q}</dt>
                  <dd className="mt-1.5 leading-relaxed text-muted">{f.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
