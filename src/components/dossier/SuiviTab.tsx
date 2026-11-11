"use client";
import { useState } from "react";
import { CalendarCheck, FileSearch, Trash2 } from "lucide-react";
import type { InstructionEvent } from "@/lib/types";
import { Badge, Button, Card, Field, Input, Select } from "@/components/ui";
import { daysBetween, fr } from "@/lib/instruction/deadlines";
import { analyzeLetter, type LetterAnalysis } from "@/lib/instruction/pieces";
import { piecesResponseLetter, tacitCertificateRequest } from "@/lib/dossier/texts";
import { uid } from "@/lib/project/factory";
import { STATUS_LABEL, STATUS_TONE } from "@/lib/project/status";
import { photoStore } from "@/lib/store/db";
import type { ProjectBundle } from "./useProject";
import { useSaveProject } from "./useProject";

const EVENT_LABEL: Record<InstructionEvent["type"], string> = {
  depot: "Dépôt",
  recepisse: "Récépissé / accusé de réception",
  notification_majoration: "Majoration du délai notifiée",
  demande_pieces: "Demande de pièces complémentaires",
  pieces_fournies: "Pièces complémentaires fournies",
  decision_accord: "Décision de non-opposition",
  decision_refus: "Décision d'opposition",
  retrait: "Dossier retiré",
  certificat_tacite: "Certificat de non-opposition reçu",
  daact: "DAACT déposée",
};

export function SuiviTab({ b }: { b: ProjectBundle }) {
  const { project: p, analysis, client, tenant } = b;
  const save = useSaveProject();
  const ins = analysis.instruction;
  const today = new Date().toISOString().slice(0, 10);
  const [type, setType] = useState<InstructionEvent["type"]>("recepisse");
  const [date, setDate] = useState(today);
  const [note, setNote] = useState("");
  const [months, setMonths] = useState(2);
  const [letter, setLetter] = useState("");
  const [result, setResult] = useState<LetterAnalysis | null>(null);
  const serverMode = process.env.NEXT_PUBLIC_DEPLOY_TARGET === "server";

  const addEvent = (e: Omit<InstructionEvent, "id">) => save({ ...p, events: [...p.events, { ...e, id: uid("evt") }] }, `evenement_${e.type}`);

  return (
    <div className="space-y-4">
      <Card title="Instruction" actions={<Badge tone={STATUS_TONE[analysis.status]}>{STATUS_LABEL[analysis.status]}</Badge>}>
        {ins.depositDate ? (
          <div className="space-y-3 text-sm">
            <div className="grid gap-3 sm:grid-cols-3">
              <Stat label="Dépôt" value={fr(ins.depositDate)} />
              <Stat label="Délai d'instruction" value={`${ins.instructionMonths} mois`} />
              <Stat label="Décision tacite au plus tard" value={ins.decisionDeadline ? fr(ins.decisionDeadline) : "suspendu"} sub={ins.decisionDeadline && ins.decisionDeadline >= today ? `J-${daysBetween(today, ins.decisionDeadline)}` : undefined} />
            </div>
            {ins.explanation.map((x) => (
              <p key={x} className="rounded bg-stone-50 p-2">{x}</p>
            ))}
            <h3 className="font-semibold">Dates clés</h3>
            <ul className="space-y-1" data-testid="key-dates">
              {ins.keyDates.map((k) => (
                <li key={k.code} className="flex flex-wrap justify-between gap-2">
                  <span>{k.label}</span>
                  <Badge tone={k.kind === "echeance" && k.date >= today && daysBetween(today, k.date) <= 7 ? "bloquant" : "neutral"}>{fr(k.date)}</Badge>
                </li>
              ))}
            </ul>
            {ins.reminders.length > 0 && <p className="text-xs text-stone-500">Rappels programmés (notification dans l&apos;application ; email de rappel avec le déploiement serveur) : {ins.reminders.map((r) => fr(r.date)).join(", ")}.</p>}
          </div>
        ) : (
          <p className="text-sm text-stone-600">Le suivi démarre lorsque le dépôt est enregistré (onglet Envoi).</p>
        )}
      </Card>

      <Card title="Historique">
        <ul className="space-y-2 text-sm">
          {[...p.events].sort((a, c) => a.date.localeCompare(c.date)).map((e) => (
            <li key={e.id} className="flex items-start justify-between gap-2 border-l-2 border-brand-600 pl-3">
              <span>
                <strong>{fr(e.date)}</strong> : {EVENT_LABEL[e.type]}
                {e.note && <span className="block text-xs text-stone-600">{e.note}</span>}
              </span>
              <button aria-label="Supprimer l'événement" onClick={() => save({ ...p, events: p.events.filter((x) => x.id !== e.id) }, "suppression_evenement")} className="text-stone-400 hover:text-red-700">
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-3 grid gap-2 sm:grid-cols-4">
          <Field label="Événement">
            <Select value={type} onChange={(e) => setType(e.target.value as InstructionEvent["type"])}>
              {Object.entries(EVENT_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Select>
          </Field>
          <Field label="Date">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          {type === "notification_majoration" ? (
            <Field label="Délai total notifié (mois)">
              <Input type="number" min={1} max={6} value={months} onChange={(e) => setMonths(Number(e.target.value))} />
            </Field>
          ) : (
            <Field label="Note (n° de dossier…)">
              <Input value={note} onChange={(e) => setNote(e.target.value)} />
            </Field>
          )}
          <div className="flex items-end">
            <Button onClick={() => addEvent({ type, date, note: note || undefined, payload: type === "notification_majoration" ? { totalMonths: months } : undefined })} data-testid="add-event">
              Ajouter
            </Button>
          </div>
        </div>
      </Card>

      <Card title={<span className="flex items-center gap-2"><FileSearch className="h-4 w-4" /> Courrier de la mairie : pièces complémentaires ou avis défavorable</span>}>
        <div className="space-y-3 text-sm">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-stone-300 px-3 py-1.5 font-medium hover:bg-stone-50">
            Joindre le courrier (PDF ou photo, archivé dans le dossier)
            <input
              type="file"
              accept="application/pdf,image/*,text/plain"
              className="sr-only"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const key = uid("blob");
                await photoStore.put(key, f);
                if (f.type === "text/plain") setLetter(await f.text());
                addEvent({ type: "demande_pieces", date: today, note: `Courrier joint : ${f.name}`, payload: { blobKey: key } });
              }}
            />
          </label>
          <Field label="Texte du courrier (copier-coller)" help="Collez le texte pour l'analyse automatique. Avec le déploiement serveur, l'IA lit directement le PDF ou la photo.">
            <textarea className="h-32 w-full rounded-lg border border-stone-300 p-2" value={letter} onChange={(e) => setLetter(e.target.value)} placeholder="Ex. : Votre dossier est incomplet. Veuillez fournir le plan de masse coté…" />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" disabled={!letter.trim()} onClick={() => setResult(analyzeLetter(letter))} data-testid="analyze-letter">
              Analyser (heuristique)
            </Button>
            <Button variant="outline" disabled={!serverMode} title="Nécessite le déploiement serveur et ANTHROPIC_API_KEY">
              Analyser avec l&apos;IA
            </Button>
          </div>
          {result && (
            <div className="space-y-2 rounded-lg border border-violet-200 bg-violet-50 p-3">
              <p>
                <Badge tone="ia">{result.method === "ia" ? "IA" : "Analyse automatique"} : à valider</Badge> Type : <strong>{result.kind.replace("_", " ")}</strong> : confiance {result.confidence}
                {result.deadlineMonths ? ` : délai mentionné : ${result.deadlineMonths} mois` : ""}
              </p>
              {result.requestedPieces.length > 0 && (
                <ul className="list-inside list-disc">
                  {result.requestedPieces.map((r) => (
                    <li key={r.code}>
                      <strong>{r.code}</strong> {r.label} <span className="text-xs text-stone-600">{r.evidence}</span>
                    </li>
                  ))}
                </ul>
              )}
              {result.motifs.length > 0 && <p>Motifs repérés : {result.motifs.join(" ; ")}</p>}
              {result.motifs.includes("Aspect / couleur des panneaux") && <p className="text-xs">Proposition : passer à des modules full black à cadre noir (onglet Projet / catalogue), regénérer DP4, DP5 et DP6.</p>}
              <details>
                <summary className="cursor-pointer font-medium">Projet de réponse</summary>
                <pre className="mt-1 whitespace-pre-wrap text-xs">{piecesResponseLetter(p, tenant, result.requestedPieces.map((r) => `${r.code} : ${r.label}`))}</pre>
              </details>
              <p className="text-xs text-stone-600">Régénérez les pièces corrigées dans l&apos;onglet Dossier, puis enregistrez l&apos;événement « Pièces complémentaires fournies » : le délai repart de cette date.</p>
            </div>
          )}
        </div>
      </Card>

      {ins.tacitAcquired && ins.decisionDeadline && (
        <Card title={<span className="flex items-center gap-2"><CalendarCheck className="h-4 w-4" /> Non-opposition tacite</span>}>
          <p className="mb-2 text-sm">Le délai est expiré sans décision : demandez le certificat de non-opposition (R*424-13). Modèle :</p>
          <pre className="whitespace-pre-wrap rounded bg-stone-50 p-3 text-xs">{tacitCertificateRequest(p, client, tenant, p.enrichment?.mairie, ins.depositDate!, ins.decisionDeadline)}</pre>
        </Card>
      )}
      {["accord"].includes(analysis.status) && (
        <Card title="Fin de procédure">
          <ul className="list-inside list-disc text-sm">
            <li>Affichez l&apos;autorisation sur le terrain (panneau &gt; 80 cm visible de la voie) pendant toute la durée du chantier ; le délai de recours des tiers (2 mois) court à partir du 1er jour d&apos;affichage.</li>
            <li>
              En fin de travaux : déclaration attestant l&apos;achèvement et la conformité des travaux (DAACT), cerfa 13408*14 :{" "}
              <a className="text-brand-700 underline" href="https://www.service-public.gouv.fr/particuliers/vosdroits/R1978" target="_blank" rel="noreferrer">formulaire officiel</a>.
            </li>
          </ul>
        </Card>
      )}
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg bg-stone-50 p-3">
      <p className="text-xs text-stone-500">{label}</p>
      <p className="text-lg font-bold">{value}</p>
      {sub && <p className="text-xs text-stone-600">{sub}</p>}
    </div>
  );
}
