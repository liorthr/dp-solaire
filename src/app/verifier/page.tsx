"use client";
// Parcours particulier : questions une par une, analyse sur les sources officielles, verdict immédiat (sans inscription).
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import type { AddressResult, EnrichmentResult, WorksType } from "@/lib/types";
import { Logo } from "@/components/Logo";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { WorksIcon, WORKS_STYLE } from "@/components/home/WorksIcon";
import { QUICK_KEY } from "@/components/home/SentenceBuilder";
import { WORKS } from "@/data/works";
import { runEnrichment, STEPS, type StepId } from "@/lib/enrichment/run";
import { DRAFT_KEY, quickVerdict, type QuickAnswers, type QuickVerdict } from "@/lib/verdict/quick";
import { currentSession, isHomeowner } from "@/lib/store/db";
import { isCloudSession } from "@/lib/cloud/supabase";
import { cn } from "@/components/ui";


interface Question {
  id: keyof QuickAnswers;
  title: string;
  hint: string;
  options: { label: string; sub?: string; value: string | boolean | undefined }[];
  /** question à réponse chiffrée (m²) */
  number?: { unit: string; min: number; max: number; placeholder: string };
}

function questionsFor(works: WorksType): Question[] {
  const qs: Question[] = [];
  if (works === "extension") {
    qs.push({
      id: "extKind",
      title: "Qu'allez-vous construire ?",
      hint: "Accolé à la maison existante.",
      options: [
        { label: "Une pièce en plus", sub: "agrandissement, extension", value: "agrandissement" },
        { label: "Un garage accolé", value: "garage" },
        { label: "Une véranda", value: "veranda" },
      ],
    });
    qs.push({
      id: "extAreaM2",
      title: "Quelle surface allez-vous créer ?",
      hint: "L'emprise au sol, débords de toit compris. Une estimation suffit pour le verdict : vous préciserez ensuite.",
      options: [],
      number: { unit: "m²", min: 1, max: 300, placeholder: "ex. 25" },
    });
    qs.push({
      id: "extExistingM2",
      title: "Quelle est la surface actuelle de la maison ?",
      hint: "Surface de plancher (habitable) : elle figure sur l'acte de vente ou l'avis de taxe foncière. Au-delà de 150 m² après travaux, un architecte peut être obligatoire.",
      options: [{ label: "Je ne sais pas", sub: "on l'estime d'après le bâtiment", value: undefined }],
      number: { unit: "m²", min: 10, max: 1000, placeholder: "ex. 110" },
    });
  }
  if (works === "pac")
    qs.push({
      id: "pacPlacement",
      title: "Où sera posée l'unité extérieure ?",
      hint: "C'est le gros boîtier avec un ventilateur, installé dehors.",
      options: [
        { label: "Fixée sur un mur", sub: "sur des consoles", value: "facade" },
        { label: "Au sol, sur une dalle béton", value: "sol_dalle" },
        { label: "Au sol, sur des plots", sub: "sans dalle", value: "sol_sans_dalle" },
        { label: "Sur le toit", value: "toiture" },
      ],
    });
  if (works === "menuiserie")
    qs.push({
      id: "identical",
      title: "Les nouvelles menuiseries seront-elles identiques ?",
      hint: "Identique = même forme, même matériau et même couleur qu'aujourd'hui.",
      options: [
        { label: "Non, ça change", sub: "matériau, couleur, forme ou nouvelle ouverture", value: false },
        { label: "Oui, strictement à l'identique", value: true },
      ],
    });
  if (works === "velux")
    qs.push({
      id: "identical",
      title: "Vous créez une fenêtre de toit ou vous la remplacez ?",
      hint: "Remplacer par un modèle différent compte comme une modification.",
      options: [
        { label: "Je crée une ou plusieurs fenêtres", value: false },
        { label: "Je remplace par un autre modèle", value: false },
        { label: "Je remplace à l'identique", sub: "même taille, même aspect", value: true },
      ],
    });
  qs.push({
    id: "visible",
    title: works === "pv" ? "Votre toit est-il visible depuis la rue ?" : "Les travaux seront-ils visibles depuis la rue ?",
    hint: "Même partiellement, ou depuis un chemin public.",
    options: [
      { label: "Oui", value: true },
      { label: "Non, pas du tout", value: false },
      { label: "Je ne sais pas", sub: "on part du principe que oui", value: true },
    ],
  });
  qs.push({
    id: "copropriete",
    title: "Votre logement est-il en copropriété ?",
    hint: "Avec un syndic et un règlement de copropriété.",
    options: [
      { label: "Non, maison individuelle", value: false },
      { label: "Oui, copropriété", value: true },
    ],
  });
  return qs;
}

function Phone({ children, step, total, back }: { children: React.ReactNode; step?: number; total?: number; back?: () => void }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col px-5 pb-8 pt-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {back && (
            <button onClick={back} aria-label="Question précédente" className="rounded-full p-1.5 hover:bg-white">
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <Link href="/" aria-label="Permizy : accueil">
            <Logo size="sm" />
          </Link>
        </div>
        {step !== undefined && total !== undefined && <span className="text-sm text-muted">{Math.min(step + 1, total)} / {total}</span>}
      </div>
      {step !== undefined && total !== undefined && (
        <div className="mt-4 flex gap-1.5" aria-hidden>
          {Array.from({ length: total }, (_, i) => (
            <i key={i} className={cn("h-1.5 flex-1 rounded", i <= step ? "bg-brand-600" : "bg-line")} />
          ))}
        </div>
      )}
      <div className="mt-6 flex flex-1 flex-col">{children}</div>
    </div>
  );
}

const Bubble = ({ icon, children }: { icon: string; children: React.ReactNode }) => (
  <div className="mt-4 flex gap-2.5 rounded-[20px] rounded-bl-md bg-white p-4 text-[15px] leading-snug shadow-sm">
    <span aria-hidden>{icon}</span>
    <span>{children}</span>
  </div>
);

function Choice({ selected, onClick, children, icon, testid }: { selected?: boolean; onClick: () => void; children: React.ReactNode; icon?: React.ReactNode; testid?: string }) {
  return (
    <button onClick={onClick} data-testid={testid} className={cn("mt-3 flex w-full items-center gap-3.5 rounded-[18px] border-2 bg-white p-4 text-left font-semibold transition hover:border-brand-600", selected ? "border-brand-600 bg-mint" : "border-line")}>
      {icon}
      <span className="flex-1">{children}</span>
      {selected && <span className="text-xl text-brand-600">●</span>}
    </button>
  );
}

function Verifier() {
  const sp = useSearchParams();
  const router = useRouter();
  const [works, setWorks] = useState<WorksType | undefined>(() => {
    const w = sp.get("w");
    return WORKS.some((x) => x.id === w) ? (w as WorksType) : undefined;
  });
  const [address, setAddress] = useState<AddressResult>();
  const [answers, setAnswers] = useState<QuickAnswers>({});
  const [qi, setQi] = useState(0);
  const [stage, setStage] = useState<"works" | "address" | "questions" | "analyse" | "verdict">("works");
  const [progress, setProgress] = useState<Partial<Record<StepId, string>>>({});
  const [verdict, setVerdict] = useState<QuickVerdict>();
  const [enr, setEnr] = useState<EnrichmentResult>();
  const [error, setError] = useState("");

  // reprise de la phrase saisie sur l'accueil
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(QUICK_KEY);
      if (raw) {
        const q = JSON.parse(raw) as { works?: WorksType; address?: AddressResult };
        sessionStorage.removeItem(QUICK_KEY);
        if (q.works) setWorks(q.works);
        if (q.address) setAddress(q.address);
        setStage(q.address ? "questions" : q.works ? "address" : "works");
        return;
      }
    } catch {
      /* stockage indisponible */
    }
    if (works) setStage("address");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const qs = useMemo(() => (works ? questionsFor(works) : []), [works]);
  const total = 2 + qs.length;

  const analyse = async (a: QuickAnswers) => {
    if (!works || !address) return;
    setStage("analyse");
    setError("");
    try {
      const e = await runEnrichment(address, { lon: address.lon, lat: address.lat }, (id, status) => setProgress((p) => ({ ...p, [id]: status })), { snap: address.type !== "housenumber" && address.type !== "manual" });
      setEnr(e);
      setVerdict(quickVerdict(works, address, e, a));
      setStage("verdict");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const prepare = () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ works, address, answers, site: enr && "site" in enr ? (enr as { site: unknown }).site : undefined }));
    // la simulation est le parcours particulier : une session de démo « installateur » restée ouverte ne doit pas l'emporter
    const s = currentSession();
    router.push(s && (isHomeowner(s) || isCloudSession(s)) ? "/app/nouveau/?draft=1" : "/connexion/?mode=signup&next=draft");
  };

  if (stage === "works")
    return (
      <Phone step={0} total={total}>
        <h1 className="text-3xl font-extrabold leading-tight">Faut-il une déclaration préalable pour vos travaux&nbsp;?</h1>
        <Bubble icon="💬">Pas d&apos;inquiétude : choisissez ce qui ressemble le plus à votre projet, on affinera ensemble.</Bubble>
        {WORKS.map((w) => (
          <Choice key={w.id} selected={works === w.id} onClick={() => { setWorks(w.id); setStage("address"); }} icon={<WorksIcon works={w.id} className="h-11 w-11" size={22} />} testid={`quick-works-${w.id}`}>
            {w.label}
            <small className="block font-normal text-muted">{WORKS_STYLE[w.id].sub}</small>
          </Choice>
        ))}
        <div className="mt-3 rounded-[18px] border-2 border-dashed border-line p-4 text-sm text-muted">Piscine, extension, abri, permis de construire : bientôt disponibles.</div>
      </Phone>
    );

  if (stage === "address")
    return (
      <Phone step={1} total={total} back={() => setStage("works")}>
        <h1 className="text-3xl font-extrabold leading-tight">Où se trouve la maison&nbsp;?</h1>
        <Bubble icon="📍">On en a besoin pour lire le cadastre, le plan d&apos;urbanisme de votre commune et repérer les monuments historiques autour.</Bubble>
        <div className="mt-5">
          <AddressAutocomplete value={address} onSelect={setAddress} />
        </div>
        {address && <p className="mt-3 rounded-2xl bg-mint p-3 text-sm font-medium text-brand-700">✓ {address.label}</p>}
        <div className="mt-auto pt-8">
          <button disabled={!address} onClick={() => { setQi(0); setStage("questions"); }} className="w-full rounded-full bg-ink py-4 text-lg font-bold text-white disabled:opacity-40" data-testid="quick-next">
            Continuer
          </button>
        </div>
      </Phone>
    );

  if (stage === "questions" && works) {
    const q = qs[qi];
    const pick = (v: string | boolean | number | undefined) => {
      const a = { ...answers, [q.id]: v };
      setAnswers(a);
      if (qi + 1 < qs.length) setQi(qi + 1);
      else analyse(a);
    };
    return (
      <Phone step={2 + qi} total={total} back={() => (qi > 0 ? setQi(qi - 1) : setStage("address"))}>
        <h1 className="text-3xl font-extrabold leading-tight">{q.title}</h1>
        <Bubble icon="💬">{q.hint}</Bubble>
        {q.number && <NumberAnswer key={q.id} q={q} initial={answers[q.id] as number | undefined} onSubmit={(v) => pick(v)} />}
        {q.options.map((o) => (
          <Choice key={o.label} selected={answers[q.id] === o.value && o.label !== "Je ne sais pas"} onClick={() => pick(o.value)} testid={`quick-answer-${q.id}`}>
            {o.label}
            {o.sub && <small className="block font-normal text-muted">{o.sub}</small>}
          </Choice>
        ))}
      </Phone>
    );
  }

  if (stage === "analyse")
    return (
      <Phone>
        <h1 className="text-3xl font-extrabold leading-tight">On vérifie les règles de votre commune…</h1>
        <Bubble icon="🔎">Sources officielles : cadastre, Géoportail de l&apos;Urbanisme, base des monuments historiques, BD TOPO de l&apos;IGN.</Bubble>
        <ul className="mt-6 space-y-3" aria-live="polite">
          {STEPS.map((s) => {
            const st = progress[s.id];
            return (
              <li key={s.id} className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-sm">
                {st === "ok" || st === "degraded" ? <Check className="h-5 w-5 text-brand-600" /> : st === "error" ? <span className="text-red-700">!</span> : <Loader2 className="h-5 w-5 animate-spin text-muted" />}
                <span className="font-medium">{s.label}</span>
              </li>
            );
          })}
        </ul>
        {error && (
          <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm text-red-800">
            Une source n&apos;a pas répondu ({error}). <button className="underline" onClick={() => analyse(answers)}>Réessayer</button>
          </p>
        )}
      </Phone>
    );

  if (stage === "verdict" && verdict && works && address) {
    const pcOk = verdict.outcome === "PC" && works === "extension";
    const doable = verdict.outcome === "DP" || pcOk;
    const ok = verdict.outcome === "DP" || verdict.outcome === "AUCUNE" || pcOk;
    return (
      <Phone>
        <div className={cn("relative overflow-hidden rounded-[28px] p-6 text-white", verdict.outcome === "PC" ? (pcOk ? "bg-[#2b5d8a]" : "bg-[#9a3b2a]") : verdict.outcome === "HORS_PERIMETRE" ? "bg-ink" : "bg-brand-600")} data-testid="verdict">
          <div className="absolute -bottom-8 -right-7 grid h-32 w-32 rotate-[-14deg] place-items-center rounded-full border-[5px] border-white/35 text-2xl font-black text-white/55" aria-hidden>
            {ok ? "OUI" : "?"}
          </div>
          <span className="rounded-md bg-white/20 px-2 py-1 text-[11px] font-extrabold uppercase tracking-wider">{address.label}</span>
          <h1 className="mt-3 text-[28px] font-extrabold leading-tight">{verdict.headline}</h1>
          <p className="mt-2 leading-snug opacity-90">{verdict.message}</p>
        </div>
        {doable && (
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <Fact big={`${verdict.months} mois`} small="délai de la mairie" />
            <Fact big={`${verdict.pieces} pièces`} small="préparées par Permizy" />
            <Fact big={verdict.zone ?? "PLU ?"} small={verdict.zone ? "plan d'urbanisme" : "zonage non publié"} />
            <Fact big={verdict.protectedArea ? "Oui" : "Aucun"} small={verdict.protectedArea ? "avis de l'ABF (secteur protégé)" : "avis de l'ABF requis"} />
          </div>
        )}
        {verdict.alerts.length > 0 && (
          <div className="mt-4 space-y-2">
            {verdict.alerts.slice(0, 4).map((a) => (
              <div key={a.title} className="rounded-2xl border border-line bg-white p-3.5 text-sm">
                <b className="block">⚠️ {a.title}</b>
                <span className="text-muted">{a.message}</span>{" "}
                <a href={a.source_url} target="_blank" rel="noreferrer" className="text-brand-600 underline">
                  source
                </a>
              </div>
            ))}
          </div>
        )}
        {verdict.surfaces && (
          <p className="mt-3 text-xs text-muted">
            Calcul fait avec {verdict.surfaces.created} m² créés et {verdict.surfaces.existing} m² existants{verdict.surfaces.estimated ? " (surface actuelle estimée d'après le bâtiment : à confirmer)" : ""}. Les seuils de 20, 40 et 150 m² décident du régime : vérifiez vos mesures.
          </p>
        )}
        {doable && !verdict.architectRequired && (
          <div className="mt-4 rounded-2xl bg-sun-soft p-4 text-sm leading-relaxed">
            <b className="text-[15px]">Ce qu&apos;il nous faut de vous :</b>
            <br />📷 3 photos de la maison (on vous guide)
            <br />✍️ une signature sur le téléphone
            <br />⏱️ environ 5 minutes
          </div>
        )}
        {verdict.outcome === "AUCUNE" && <p className="mt-4 rounded-2xl bg-white p-4 text-sm">Pensez quand même à respecter le règlement de lotissement ou de copropriété, et les règles de voisinage. Bon chantier&nbsp;!</p>}
        {verdict.architectRequired && <p className="mt-4 rounded-2xl bg-white p-4 text-sm"><b>Un architecte est obligatoire</b> pour ce permis : la maison dépasserait 150 m² après travaux. Permizy peut lui transmettre l&apos;analyse du terrain ; c&apos;est lui qui signe les plans.</p>}
        {verdict.outcome === "PC" && !pcOk && <p className="mt-4 rounded-2xl bg-white p-4 text-sm">Le permis de construire pour ce type de travaux arrive bientôt sur Permizy. En attendant, le service urbanisme de votre mairie{verdict.mairie ? ` (${verdict.mairie})` : ""} peut vous accompagner.</p>}
        <p className="mt-3 text-xs text-muted">
          Source :{" "}
          <a href={verdict.source_url} target="_blank" rel="noreferrer" className="underline">
            {verdict.source_label ?? verdict.source_url}
          </a>
          . Verdict indicatif calculé à partir des données publiques ; la décision appartient à la mairie.
        </p>
        <div className="mt-auto pt-6">
          {doable && !verdict.architectRequired ? (
            <>
              <button onClick={prepare} className="w-full rounded-full bg-brand-600 py-4 text-lg font-bold text-white shadow-[0_8px_20px_rgba(31,107,74,.25)]" data-testid="quick-prepare">
                {pcOk ? "Préparer mon permis de construire →" : "Préparer mon dossier →"}
              </button>
              <p className="mt-2.5 text-center text-sm text-muted">Rien n&apos;est envoyé à la mairie sans votre accord.</p>
            </>
          ) : (
            <Link href="/" className="block w-full rounded-full border-2 border-ink py-4 text-center text-lg font-bold">
              Vérifier un autre projet
            </Link>
          )}
        </div>
      </Phone>
    );
  }
  return null;
}

function NumberAnswer({ q, initial, onSubmit }: { q: Question; initial?: number; onSubmit: (v: number) => void }) {
  const [v, setV] = useState(initial ? String(initial) : "");
  const n = Number(v.replace(",", "."));
  const ok = v !== "" && n >= q.number!.min && n <= q.number!.max;
  return (
    <form
      className="mt-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (ok) onSubmit(n);
      }}
    >
      <label className="flex items-center gap-3 rounded-[18px] border-2 border-brand-600 bg-white p-4 text-2xl font-bold">
        <input autoFocus inputMode="decimal" value={v} onChange={(e) => setV(e.target.value)} placeholder={q.number!.placeholder} aria-label={q.title} className="w-full bg-transparent outline-none" data-testid={`quick-number-${q.id}`} />
        <span className="text-muted">{q.number!.unit}</span>
      </label>
      <button disabled={!ok} className="mt-3 w-full rounded-full bg-ink py-4 text-lg font-bold text-white disabled:opacity-40" data-testid={`quick-number-ok-${q.id}`}>
        Continuer
      </button>
    </form>
  );
}

const Fact = ({ big, small }: { big: string; small: string }) => (
  <div className="rounded-[18px] border border-line bg-white p-3.5">
    <b className="block text-xl font-extrabold leading-tight">{big}</b>
    <span className="text-[13px] text-muted">{small}</span>
  </div>
);

/** premier écran rendu au build (HTML statique) : identique au parcours, avant que JavaScript ne prenne le relais */
function FirstScreen() {
  return (
    <Phone step={0} total={3}>
      <h1 className="text-3xl font-extrabold leading-tight">Faut-il une déclaration préalable pour vos travaux&nbsp;?</h1>
      <p className="mt-3 text-muted">Choisissez vos travaux : on vérifie les règles de votre commune avec votre adresse, gratuitement.</p>
      <ul className="mt-4 space-y-2">
        {WORKS.map((w) => (
          <li key={w.id}>
            <a href={`?w=${w.id}`} className="flex items-center gap-3 rounded-[18px] border-2 border-line bg-white p-3 font-semibold">
              <WorksIcon works={w.id} className="h-11 w-11" size={22} />
              <span>
                {w.label}
                <small className="block font-normal text-muted">{WORKS_STYLE[w.id].sub}</small>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </Phone>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<FirstScreen />}>
      <Verifier />
    </Suspense>
  );
}
