"use client";
// « Je veux [travaux] chez moi, au [adresse] » : point d'entrée du parcours particulier.
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AddressResult, WorksType } from "@/lib/types";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";

export const VERBS: Record<WorksType, string> = {
  pv: "installer des panneaux solaires",
  pac: "installer une pompe à chaleur",
  menuiserie: "changer mes fenêtres, portes ou volets",
  velux: "poser des fenêtres de toit",
  ite: "isoler mes murs par l'extérieur",
  extension: "agrandir ma maison (extension, garage, véranda)",
};
export const QUICK_KEY = "permizy:quick";

/** entrée « demande de permis de construire » : parcours agrandissement, avec la question du type de projet */
const PERMIS = "permis";

export function SentenceBuilder() {
  const router = useRouter();
  const [works, setWorks] = useState<WorksType | typeof PERMIS>("pv");
  const [address, setAddress] = useState<AddressResult>();
  const go = () => {
    const pc = works === PERMIS;
    sessionStorage.setItem(QUICK_KEY, JSON.stringify({ works: pc ? "extension" : works, address, intent: pc ? "pc" : undefined }));
    router.push(pc ? "/verifier/?w=extension&intent=pc" : `/verifier/?w=${works}`);
  };
  return (
    <div className="rounded-[26px] border border-line bg-white p-5 shadow-[0_20px_50px_rgba(19,35,28,.10)] sm:p-7">
      <div className="text-xl font-semibold leading-relaxed sm:text-2xl sm:leading-[1.8]">
        <label htmlFor="works-verb" className="block">Je veux</label>
        <span className="relative mt-1 block w-full min-w-0">
          <select
            id="works-verb"
            value={works}
            onChange={(e) => setWorks(e.target.value as WorksType | typeof PERMIS)}
            className="block w-full min-w-0 max-w-full cursor-pointer appearance-none truncate rounded-2xl border-2 border-dashed border-brand-600 bg-mint py-1 pl-4 pr-10 text-brand-600"
            data-testid="home-works"
          >
            {Object.entries(VERBS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
            <option value={PERMIS}>faire une demande de permis de construire</option>
          </select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-brand-600">▾</span>
        </span>
        <span className="mt-1 block">chez moi, au&nbsp;:</span>
      </div>
      <div className="mt-3 text-base">
        <AddressAutocomplete value={address} onSelect={setAddress} />
      </div>
      <div className="mt-5 flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
        <span className="text-sm text-muted">Réponse immédiate · gratuit · sans inscription</span>
        <button onClick={go} className="rounded-full bg-brand-600 px-6 py-3.5 text-base font-bold text-white shadow-[0_8px_20px_rgba(31,107,74,.25)] hover:bg-brand-700" data-testid="home-check">
          Est-ce que j&apos;ai besoin d&apos;une autorisation&nbsp;? →
        </button>
      </div>
    </div>
  );
}
