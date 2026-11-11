import Link from "next/link";
import { HealthTable } from "@/components/HealthTable";

export const metadata = { title: "Santé des sources : DP Solaire" };

export default function Sante() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <Link href="/app/" className="text-sm text-brand-700 underline">← Application</Link>
      <h1 className="mt-3 text-2xl font-bold">Santé des sources de données</h1>
      <p className="mt-1 text-sm text-stone-600">Chaque source est isolée dans un adaptateur avec délai maximal, nouvelles tentatives, cache et repli (saisie manuelle, instantané). Le test ci-dessous est exécuté depuis votre navigateur.</p>
      <div className="mt-4 rounded-xl border border-stone-200 bg-white p-4">
        <HealthTable />
      </div>
    </main>
  );
}
