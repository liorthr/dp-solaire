"use client";
// Suivi façon « colis » : compte à rebours jusqu'à la décision tacite, étapes cochées, écran de réussite.
import type { Project } from "@/lib/types";
import type { InstructionState } from "@/lib/instruction/deadlines";
import { daysBetween, fr } from "@/lib/instruction/deadlines";
import { GreenStamp } from "@/components/Logo";
import { cn } from "@/components/ui";

export function Tracker({ p, ins, mairie }: { p: Project; ins: InstructionState; mairie?: string }) {
  const today = new Date().toISOString().slice(0, 10);
  const ev = (t: string) => p.events.find((e) => e.type === t);
  const accord = ev("decision_accord") ?? ev("certificat_tacite");
  const refus = ev("decision_refus");
  const tacit = ins.tacitAcquired && !refus;

  if (accord || tacit)
    return (
      <section className="overflow-hidden rounded-[28px] bg-brand-600 px-6 py-10 text-center text-white" data-testid="tracker-success">
        <GreenStamp className="mx-auto h-44 w-44 border-white bg-transparent text-[18px] text-white shadow-none" label="MAIRIE ✓" />
        <h2 className="mt-8 text-3xl font-extrabold leading-tight">
          C&apos;est accordé&nbsp;!
          <br />
          Vos travaux peuvent commencer.
        </h2>
        <p className="mx-auto mt-3 max-w-md opacity-85">
          {accord ? `Décision du ${fr(accord.date)}.` : `Accord tacite acquis le ${ins.decisionDeadline ? fr(ins.decisionDeadline) : "?"} : demandez le certificat de non-opposition (modèle dans l'onglet Suivi).`} Prochaine étape : afficher le panneau de chantier, visible depuis la rue, pendant toute la durée des travaux.
        </p>
      </section>
    );

  const depot = ev("depot");
  const recep = ev("recepisse");
  const pieces = ev("demande_pieces");
  const steps = [
    { done: Boolean(p.generatedAt), label: "Dossier prêt et validé par vous", sub: p.generatedAt ? fr(p.generatedAt.slice(0, 10)) : "à générer dans l'onglet Dossier" },
    { done: Boolean(depot), label: `Envoyé à la ${mairie ?? "mairie"}`, sub: depot ? `${fr(depot.date)}${depot.note ? ` · ${depot.note}` : ""}` : "après votre accord, onglet Envoi" },
    { done: Boolean(recep), label: "Récépissé reçu", sub: recep ? `${fr(recep.date)}${recep.note ? ` · ${recep.note}` : ""}` : "la mairie accuse réception" },
    { done: false, now: Boolean(depot) && !refus, label: pieces ? "La mairie demande des pièces" : "Instruction en cours", sub: pieces ? "voir ci-dessous : on vous aide à répondre" : depot ? "rien à faire de votre côté" : "" },
    { done: false, label: "Feu vert de la mairie", sub: "puis panneau de chantier et travaux" },
  ];
  const total = ins.depositDate && ins.decisionDeadline ? Math.max(1, daysBetween(ins.depositDate, ins.decisionDeadline)) : 30;
  const elapsed = ins.depositDate ? Math.max(0, daysBetween(ins.depositDate, today)) : 0;
  const ratio = Math.min(1, elapsed / total);
  return (
    <section className="space-y-3" data-testid="tracker">
      {ins.depositDate && !refus && (
        <div className="flex items-center gap-4 rounded-[26px] bg-ink p-5 text-white">
          <svg width="78" height="78" viewBox="0 0 80 80" aria-hidden className="flex-none">
            <circle cx="40" cy="40" r="32" stroke="#ffffff22" strokeWidth="9" fill="none" />
            <circle cx="40" cy="40" r="32" stroke="#ffb84d" strokeWidth="9" fill="none" strokeDasharray="201" strokeDashoffset={201 * (1 - ratio)} strokeLinecap="round" transform="rotate(-90 40 40)" />
            <text x="40" y="46" textAnchor="middle" fill="#fff" fontWeight="800" fontSize="17">
              J+{elapsed}
            </text>
          </svg>
          <div>
            <b className="block text-xl font-extrabold leading-tight">{ins.decisionDeadline ? `Feu vert au plus tard le ${fr(ins.decisionDeadline)}` : "Délai suspendu"}</b>
            <span className="text-sm opacity-80">{ins.decisionDeadline ? "Sans réponse de la mairie à cette date, l'accord est tacite. On vous prévient." : "Le délai repart quand les pièces demandées sont fournies."}</span>
          </div>
        </div>
      )}
      {refus && <div className="rounded-[26px] bg-[#9a3b2a] p-5 text-white">Décision d&apos;opposition du {fr(refus.date)} : consultez les motifs ; un recours gracieux ou un nouveau dossier corrigé est possible.</div>}
      <ol className="rounded-[26px] border border-line bg-white p-5">
        {steps.map((s, i) => (
          <li key={s.label} className="relative flex gap-3.5 pb-4 last:pb-0">
            {i < steps.length - 1 && <span className="absolute bottom-0 left-[15px] top-8 w-0.5 bg-line" aria-hidden />}
            <span className={cn("grid h-8 w-8 flex-none place-items-center rounded-full text-sm font-extrabold", s.done ? "bg-brand-600 text-white" : s.now ? "bg-sun text-ink shadow-[0_0_0_6px_var(--color-sun-soft)]" : "border-2 border-dashed border-[#c9bfae] bg-cream text-[#a99f8f]")}>{s.done ? "✓" : s.now ? "●" : "✓"}</span>
            <div>
              <b className="block text-[15px]">{s.label}</b>
              <span className="text-[13px] text-muted">{s.sub}</span>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
