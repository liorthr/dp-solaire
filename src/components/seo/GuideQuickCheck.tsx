"use client";
// Encart de conversion des guides : adresse → vérification gratuite, sans quitter le contexte du guide.
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import type { AddressResult, WorksType } from "@/lib/types";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { QUICK_KEY, VERBS } from "@/components/home/SentenceBuilder";
import { track } from "@/lib/analytics";

export function GuideQuickCheck({ works: fixed, guide, intent }: { works?: WorksType; guide: string; intent?: "pc" }) {
  const router = useRouter();
  const [works, setWorks] = useState<WorksType>(fixed ?? "pv");
  const [address, setAddress] = useState<AddressResult>();
  const go = () => {
    track("guide_cta", guide.slice(0, 40));
    if (address) sessionStorage.setItem(QUICK_KEY, JSON.stringify({ works, address, intent }));
    router.push(`/verifier/?w=${works}${intent ? `&intent=${intent}` : ""}`);
  };
  return (
    <div className="rounded-3xl bg-ink p-6 text-white sm:p-8" data-testid="guide-quick-check">
      <h2 className="text-2xl font-extrabold">Et chez vous, que dit la règle&nbsp;?</h2>
      {!fixed && (
        <label className="mt-3 block text-sm">
          <span className="text-white/80">Vos travaux</span>
          <select value={works} onChange={(e) => setWorks(e.target.value as WorksType)} className="mt-1 w-full rounded-xl bg-white px-3 py-2 text-ink" data-testid="guide-quick-works">
            {Object.entries(VERBS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </option>
            ))}
          </select>
        </label>
      )}
      <p className="mt-2 text-white/80">
        {intent === "pc" ? "Vous préparez une demande de permis de construire : saisissez" : fixed ? `Vous voulez ${VERBS[works]} : saisissez` : "Saisissez"} votre adresse. Permizy lit le cadastre, le plan local d&apos;urbanisme et les périmètres protégés, puis vous dit gratuitement quelle autorisation demander.
      </p>
      <div className="mt-4 rounded-2xl bg-white p-3 text-ink">
        <AddressAutocomplete value={address} onSelect={setAddress} />
      </div>
      <button onClick={go} className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-bold text-ink" data-testid="guide-quick-go">
        Vérifier gratuitement <ArrowRight className="h-4 w-4" />
      </button>
      <p className="mt-2 text-xs text-white/60">Sans inscription. Rien n&apos;est envoyé à la mairie sans votre accord.</p>
    </div>
  );
}
