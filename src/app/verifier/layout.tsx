import type { Metadata } from "next";
import Link from "next/link";
import { GUIDES } from "@/data/seo/guides";

export const metadata: Metadata = {
  title: { absolute: "Faut-il une déclaration préalable ? Vérification gratuite | Permizy" },
  description: "Votre adresse et vos travaux : en une minute, sachez s'il faut une déclaration préalable ou un permis de construire. Gratuit ; dossier dès 49 €.",
  alternates: { canonical: "/verifier/" },
};

const STEPS = [
  { t: "Vos travaux", d: "Panneaux solaires, pompe à chaleur, fenêtres, isolation, fenêtre de toit ou agrandissement." },
  { t: "Votre adresse", d: "Permizy lit le cadastre, le plan local d'urbanisme (Géoportail de l'Urbanisme) et les périmètres de monuments historiques." },
  { t: "Le verdict", d: "Déclaration préalable, permis de construire ou aucune formalité, avec le délai de réponse de la mairie et les sources officielles." },
];

/** explication rendue côté serveur, lisible sans JavaScript (moteurs de recherche, assistants IA) */
export default function Layout({ children }: { children: React.ReactNode }) {
  const guides = GUIDES.filter((g) => !g.slug.startsWith("raccordement")).slice(0, 8);
  return (
    <>
      {children}
      <section className="border-t border-line bg-white px-5 py-12" aria-labelledby="verif-how">
        <div className="mx-auto max-w-3xl">
          <h2 id="verif-how" className="text-2xl font-extrabold">Comment fonctionne la vérification gratuite ?</h2>
          <ol className="mt-4 space-y-3">
            {STEPS.map((s, i) => (
              <li key={s.t} className="flex gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-600 text-sm font-bold text-white">{i + 1}</span>
                <span>
                  <b>{s.t}</b> : <span className="text-muted">{s.d}</span>
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-sm text-muted">La vérification est gratuite et sans inscription. Le verdict est une aide fondée sur les règles officielles ; la décision appartient à la mairie.</p>
          <h3 className="mt-8 font-bold">Les règles par type de travaux</h3>
          <ul className="mt-2 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
            {guides.map((g) => (
              <li key={g.slug}>
                <Link href={`/${g.slug}/`} className="text-brand-700 underline">{g.h1}</Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
