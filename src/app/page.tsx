import Link from "next/link";
import { GreenStamp, Logo } from "@/components/Logo";
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
const SOON = [
  { title: "Piscine", desc: "Bassin, abri, plage" },
  { title: "Abri, carport, pergola", desc: "Surface et hauteur" },
  { title: "Clôture, portail", desc: "Selon votre commune" },
  { title: "Maison neuve", desc: "Permis de construire, avec votre architecte", green: true },
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
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-sun-soft font-extrabold text-[#b36b00]">8</span>
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
      <header className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-10">
        <Link href="/" aria-label="Permizy : accueil">
          <Logo />
        </Link>
        <nav className="hidden gap-8 font-medium text-muted lg:flex">
          <a href="#comment">Comment ça marche</a>
          <a href="#travaux">Vos travaux</a>
          <a href="#confiance">Vos garanties</a>
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

      <main>
        <section className="mx-auto grid max-w-7xl items-center gap-10 px-5 pb-16 pt-6 sm:px-10 lg:grid-cols-[1.15fr_.85fr]">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 rounded-full bg-mint px-3.5 py-2 text-xs font-bold text-brand-600 sm:text-sm">● Déclaration préalable · Permis de construire</span>
            <h1 className="mt-5 text-[42px] font-extrabold leading-[1.02] sm:text-6xl lg:text-[68px] xl:text-[76px]">
              Vos travaux.
              <br />
              Le <span className="highlight text-brand-600">oui</span> de la mairie.
              <br />
              Sans la paperasse.
            </h1>
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
              <Link href={AGRI_HREF} data-testid="home-agri" className="flex min-h-44 flex-col justify-between rounded-3xl border border-line bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
                <WorksIcon works="pv" className="h-14 w-14" />
                <span>
                  <b className="mt-4 block text-lg leading-tight">Solaire agricole</b>
                  <span className="text-sm text-muted">Hangar, stabulation : DP, raccordement fortes puissances</span>
                </span>
              </Link>
              {AVAILABLE.map((w) => (
                <Link key={w.id} href={`/verifier/?w=${w.id}`} className="flex min-h-44 flex-col justify-between rounded-3xl border border-line bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
                  <WorksIcon works={w.id} className="h-14 w-14" />
                  <span>
                    <b className="mt-4 block text-lg leading-tight">{w.title}</b>
                    <span className="text-sm text-muted">{w.desc}</span>
                  </span>
                </Link>
              ))}
              {SOON.map((w) => (
                <div key={w.title} className="flex min-h-44 flex-col justify-between rounded-3xl border border-dashed border-line p-5">
                  <span className={`self-start rounded-md px-2 py-1 text-[11px] font-extrabold uppercase tracking-wider ${w.green ? "bg-mint text-brand-600" : "bg-sun-soft text-[#b36b00]"}`}>Bientôt</span>
                  <span>
                    <b className="block text-lg leading-tight">{w.title}</b>
                    <span className="text-sm text-muted">{w.desc}</span>
                  </span>
                </div>
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
              { n: 2, bg: "bg-sun-soft", c: "text-[#b36b00]", i: "✎", t: "On prépare tout", d: "Cadastre, PLU, monuments historiques : vérifiés. Plans à l'échelle, photomontage et cerfa : générés. Vous relisez." },
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
      </main>

      <footer className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-8 text-sm text-muted sm:px-10">
        <Logo size="sm" />
        <span>
          <Link href="/cgu/" className="underline">
            Conditions et responsabilité
          </Link>{" "}
          · <Link href="/connexion/" className="underline">Espace professionnels</Link> · <Link href="/sante/" className="underline">État des sources</Link>
        </span>
      </footer>
    </div>
  );
}
