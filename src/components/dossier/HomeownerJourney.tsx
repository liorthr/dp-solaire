"use client";
// Parcours guidé du particulier : une étape à la fois, avec la prochaine action toujours visible.
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button, cn } from "@/components/ui";
import { authorizationOf } from "@/lib/works/authorization";
import { fr } from "@/lib/instruction/deadlines";
import { SyntheseTab } from "./SyntheseTab";
import { PlansTab } from "./PlansTab";
import { InsertionTab } from "./InsertionTab";
import { DossierTab } from "./DossierTab";
import { SuiviTab } from "./SuiviTab";
import { RaccordementTab } from "./RaccordementTab";
import { HomeownerDeposit } from "./HomeownerDeposit";
import type { ProjectBundle } from "./useProject";

export type JourneyStep = "projet" | "plans" | "photos" | "dossier" | "depot" | "suivi" | "raccordement";

export function journeySteps(b: ProjectBundle) {
  const p = b.project;
  const hasFacade = p.photos.some((x) => x.kind === "facade");
  const steps: { id: JourneyStep; label: string; done: boolean; hint: string }[] = [
    { id: "projet", label: "Mon projet", done: true, hint: "Ce que dit la réglementation pour votre terrain" },
    { id: "plans", label: "Plans", done: Boolean(p.enrichment?.mainBuildingId), hint: "Vérifiez la maison et les dimensions" },
    { id: "photos", label: "Photos", done: hasFacade && p.insertions.some((i) => i.quad.length === 4) && p.photos.length >= 3, hint: "3 photos et le photomontage" },
    { id: "dossier", label: "Mon dossier", done: Boolean(p.generatedAt), hint: "Téléchargez le dossier complet" },
    { id: "depot", label: "Dépôt en mairie", done: p.events.some((e) => e.type === "depot"), hint: "Vous le déposez vous-même, on vous guide" },
    { id: "suivi", label: "Suivi", done: p.events.some((e) => e.type === "decision_accord" || e.type === "decision_refus" || e.type === "certificat_tacite"), hint: "Délais et réponse de la mairie" },
  ];
  if ((p.works ?? "pv") === "pv") steps.push({ id: "raccordement", label: "Raccordement", done: false, hint: "Après l'accord : Enedis et Consuel" });
  return steps;
}

export function nextStep(b: ProjectBundle) {
  const s = journeySteps(b);
  return s.find((x) => !x.done) ?? s[s.length - 1];
}

export function HomeownerJourney({ b, initial }: { b: ProjectBundle; initial?: string }) {
  const steps = journeySteps(b);
  const start = steps.find((s) => s.id === initial)?.id ?? nextStep(b).id;
  const [current, setCurrent] = useState<JourneyStep>(start);
  const i = steps.findIndex((s) => s.id === current);
  const step = steps[i];
  const go = (id: JourneyStep) => {
    setCurrent(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const auth = authorizationOf(b.project);
  const deadline = b.analysis.instruction.decisionDeadline;

  return (
    <div className="space-y-5">
      <nav aria-label="Étapes de votre projet" className="-mx-4 overflow-x-auto px-4">
        <ol className="flex min-w-max gap-2">
          {steps.map((s, k) => (
            <li key={s.id}>
              <button
                onClick={() => go(s.id)}
                aria-current={s.id === current ? "step" : undefined}
                className={cn("flex items-center gap-2 rounded-full border-2 px-3 py-1.5 text-sm font-semibold transition", s.id === current ? "border-ink bg-ink text-white" : s.done ? "border-brand-600 bg-mint text-brand-700" : "border-line bg-white text-muted")}
                data-testid={`step-${s.id}`}
              >
                <span className={cn("grid h-5 w-5 place-items-center rounded-full text-[11px]", s.id === current ? "bg-white text-ink" : s.done ? "bg-brand-600 text-white" : "bg-line text-muted")}>{s.done && s.id !== current ? <Check className="h-3 w-3" /> : k + 1}</span>
                {s.label}
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <header>
        <p className="text-sm font-semibold text-brand-700">
          Étape {i + 1} sur {steps.length}
        </p>
        <h2 className="text-2xl font-extrabold sm:text-3xl">{step.label}</h2>
        <p className="text-muted">{step.hint}</p>
      </header>

      {current === "projet" && (
        <div className="rounded-3xl bg-brand-600 p-5 text-white">
          <p className="text-sm opacity-85">{b.project.address?.label}</p>
          <p className="mt-1 text-xl font-extrabold">{b.analysis.evaluation.regime.outcome === "AUCUNE" ? "Aucune autorisation à demander." : `Votre démarche : ${auth.kind === "PC" ? "permis de construire" : "déclaration préalable"}.`}</p>
          <p className="mt-1 text-sm opacity-90">
            {b.analysis.months.months ? `Délai de réponse de la mairie : ${b.analysis.months.months} mois après le dépôt.` : ""} {deadline ? `Réponse attendue au plus tard le ${fr(deadline)}.` : ""}
          </p>
        </div>
      )}
      {(current === "photos" || current === "plans") && (
        <p className="rounded-2xl bg-sun-soft p-3 text-sm">
          💡 Vous pouvez faire une pause à tout moment : votre projet est enregistré. Revenez plus tard depuis « Mes projets » pour continuer là où vous en étiez.
        </p>
      )}

      {current === "projet" && <SyntheseTab b={b} />}
      {current === "plans" && <PlansTab b={b} />}
      {current === "photos" && <InsertionTab b={b} />}
      {current === "dossier" && <DossierTab b={b} />}
      {current === "depot" && <HomeownerDeposit b={b} onDone={() => go("suivi")} />}
      {current === "suivi" && <SuiviTab b={b} />}
      {current === "raccordement" && <RaccordementTab b={b} />}

      <div className="flex items-center justify-between gap-2 border-t border-line pt-4">
        <Button variant="outline" disabled={i === 0} onClick={() => go(steps[i - 1].id)}>
          <ArrowLeft className="h-4 w-4" /> Précédent
        </Button>
        {i < steps.length - 1 && (
          <Button onClick={() => go(steps[i + 1].id)} data-testid="journey-next">
            {steps[i + 1].label} <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
