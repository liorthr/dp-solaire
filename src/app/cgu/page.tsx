import Link from "next/link";

export const metadata = { title: "Conditions générales : DP Solaire" };

export default function CGU() {
  return (
    <main className="prose prose-stone mx-auto max-w-3xl px-4 py-10">
      <Link href="/" className="text-sm text-brand-700 underline">← Accueil</Link>
      <h1 className="mt-4 text-2xl font-bold">Conditions générales d&apos;utilisation (version de démonstration, 11/11/2026)</h1>
      <p className="mt-2 text-sm text-stone-500">Modèle à faire valider par un juriste avant toute exploitation commerciale.</p>
      <h2 className="mt-6 text-lg font-semibold">1. Objet</h2>
      <p>DP Solaire est un logiciel d&apos;aide à la constitution de dossiers de déclaration préalable de travaux pour des installations photovoltaïques. Il automatise la collecte de données publiques, la production de plans et de documents, et le suivi de l&apos;instruction.</p>
      <h2 className="mt-6 text-lg font-semibold">2. Responsabilité du déclarant</h2>
      <p>Le dossier est établi sous la <strong>seule responsabilité du déclarant</strong> (et de son mandataire), qui certifie l&apos;exactitude des informations (engagement du cerfa 16702*03). Les données issues des sources publiques (cadastre, Géoportail de l&apos;Urbanisme, BD TOPO, Annuaire de l&apos;administration…) peuvent être incomplètes, inexactes ou non à jour ; l&apos;utilisateur doit les vérifier. Les mesures (pentes, hauteurs, surfaces) sont des estimations à contrôler sur place.</p>
      <h2 className="mt-6 text-lg font-semibold">3. Absence de garantie de résultat</h2>
      <p>Le « score de passage » et les alertes sont des aides à la décision fondées sur des règles publiées et sourcées. Ils ne constituent ni un conseil juridique ni une garantie d&apos;obtention d&apos;une décision de non-opposition. L&apos;autorité compétente (et l&apos;Architecte des Bâtiments de France le cas échéant) apprécie souverainement chaque projet.</p>
      <h2 className="mt-6 text-lg font-semibold">4. Intelligence artificielle</h2>
      <p>Les extractions et suggestions produites par IA sont signalées comme telles, citent leur source et doivent être validées par l&apos;utilisateur. Aucune décision n&apos;est prise automatiquement.</p>
      <h2 className="mt-6 text-lg font-semibold">5. Envois et signatures</h2>
      <p>Aucun envoi à une mairie ni aucune signature n&apos;est réalisé sans action explicite de l&apos;utilisateur (bouton de confirmation). La signature électronique simple (tracé, horodatage, empreinte SHA-256) peut être remplacée par un prestataire de signature avancée.</p>
      <h2 className="mt-6 text-lg font-semibold">6. Données personnelles</h2>
      <p>L&apos;installateur est responsable du traitement des données de ses clients ; DP Solaire agit en sous-traitant (art. 28 RGPD). Minimisation, cloisonnement par entreprise, journal d&apos;audit, export et suppression sont disponibles dans « Entreprise & RGPD ». Durée de conservation configurable (60 mois par défaut après clôture). En mode démo, les données restent dans le navigateur.</p>
      <h2 className="mt-6 text-lg font-semibold">7. Sources et licences</h2>
      <p>Données publiques sous Licence Ouverte Etalab 2.0 (IGN, DGFiP, DILA, Géorisques), PVGIS (Commission européenne, JRC). Formulaire cerfa officiel : service-public.gouv.fr.</p>
    </main>
  );
}
