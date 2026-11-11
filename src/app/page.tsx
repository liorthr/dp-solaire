import Link from "next/link";
import { pricing } from "@/data/pricing";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-800 to-brand-700 text-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <div className="flex items-center gap-2 text-lg font-bold">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-amber-400 text-stone-900">☀</span> DP Solaire
        </div>
        <Link href="/connexion/" className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-brand-800">Se connecter</Link>
      </header>
      <main className="mx-auto max-w-6xl px-4 pb-16">
        <section className="py-10 sm:py-16">
          <p className="mb-3 inline-block rounded-full bg-amber-400/20 px-3 py-1 text-sm text-amber-200">Pour les installateurs photovoltaïques</p>
          <h1 className="max-w-3xl text-3xl font-bold leading-tight sm:text-5xl">La déclaration préalable de vos chantiers solaires, prête en quelques minutes.</h1>
          <p className="mt-4 max-w-2xl text-lg text-emerald-50">
            Une adresse, le matériel et 3 photos. DP Solaire récupère cadastre, PLU, servitudes et monuments historiques, dessine les plans DP1 à DP8, remplit le cerfa 16702*03 et prépare l&apos;envoi à la bonne mairie. Vous gardez la main à chaque étape.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/connexion/" className="rounded-lg bg-amber-400 px-6 py-3 font-semibold text-stone-900 hover:bg-amber-300">Essayer la démo</Link>
            <a href="#transparence" className="rounded-lg border border-white/40 px-6 py-3 font-semibold hover:bg-white/10">Comment ça marche</a>
          </div>
        </section>
        <section id="transparence" className="grid gap-4 sm:grid-cols-3">
          {[
            ["Rapide et automatique", "Enrichissement depuis les API publiques (BAN, cadastre, Géoportail de l'Urbanisme, BD TOPO, Géorisques, Annuaire), plans vectoriels à l'échelle, PDF unique + ZIP, en moins d'une minute."],
            ["Règles transparentes", "Chaque contrôle cite sa source officielle (URL, date, statut vérifié / à vérifier). Le score est expliqué facteur par facteur, jamais présenté comme une garantie."],
            ["Suivi jusqu'à la décision", "Délais calculés (majoration ABF, suspension en cas de pièces demandées), rappels, réponse aux demandes de pièces, attestation de non-opposition tacite."],
          ].map(([t, d]) => (
            <div key={t} className="rounded-xl bg-white/10 p-5">
              <h2 className="text-lg font-semibold">{t}</h2>
              <p className="mt-2 text-sm text-emerald-50">{d}</p>
            </div>
          ))}
        </section>
        <section className="mt-12 rounded-2xl bg-white p-6 text-stone-900">
          <h2 className="text-xl font-bold">Tarifs (indicatifs, facturation en mode test)</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {pricing.map((p) => (
              <div key={p.id} className="rounded-xl border border-stone-200 p-4">
                <h3 className="font-semibold">{p.name}</h3>
                <p className="mt-1 text-2xl font-bold">{p.monthly ? `${p.monthly} € HT/mois` : "Sans abonnement"}</p>
                <p className="text-sm text-stone-600">{p.perDossier} € HT par dossier {p.included ? `au-delà de ${p.included} inclus` : ""}</p>
                <ul className="mt-2 list-inside list-disc text-sm text-stone-600">{p.features.map((f) => <li key={f}>{f}</li>)}</ul>
              </div>
            ))}
          </div>
        </section>
        <p className="mt-10 text-sm text-emerald-100">
          Le logiciel aide à constituer le dossier ; le déclarant reste responsable de son contenu. <Link href="/cgu/" className="underline">Conditions générales</Link> · <Link href="/sante/" className="underline">Santé des sources de données</Link>
        </p>
      </main>
    </div>
  );
}
