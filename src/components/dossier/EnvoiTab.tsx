"use client";
import { useState } from "react";
import { Mail, MonitorSmartphone, Send, Stamp } from "lucide-react";
import type { FilingMode } from "@/lib/types";
import { Badge, Button, Card, Field, Input, Modal } from "@/components/ui";
import { coverLetterEmail, gnauSteps, lrarLetter } from "@/lib/dossier/texts";
import { paperCopies, rulesetFor } from "@/lib/rules/engine";
import { buildEml, mailtoLink } from "@/lib/mail/eml";
import { annuaireSearchLink } from "@/lib/providers/annuaire";
import { uid } from "@/lib/project/factory";
import { builtCache, download } from "./DossierTab";
import type { ProjectBundle } from "./useProject";
import { useSaveProject } from "./useProject";

const MODES: { id: FilingMode; label: string; icon: typeof Mail; desc: string }[] = [
  { id: "teleservice", label: "Téléservice (GNAU / AD'AU)", icon: MonitorSmartphone, desc: "Obligatoire pour une personne morale dans les communes de plus de 3 500 habitants." },
  { id: "email", label: "Email à la mairie", icon: Mail, desc: "Si la mairie indique une adresse de dépôt." },
  { id: "lrar", label: "Lettre recommandée AR", icon: Stamp, desc: "Dossier papier en plusieurs exemplaires." },
  { id: "main_propre", label: "Dépôt en mairie", icon: Stamp, desc: "Contre récépissé." },
];

export function EnvoiTab({ b, goTo }: { b: ProjectBundle; goTo: (tab: string) => void }) {
  const { project: p, client, tenant, analysis } = b;
  const save = useSaveProject();
  const mairie = { ...p.enrichment?.mairie, ...(p.overrides["mairie.email"] ? { email: String(p.overrides["mairie.email"]) } : {}) } as NonNullable<typeof p.enrichment>["mairie"];
  const [mode, setMode] = useState<FilingMode>(p.filingMode ?? (mairie?.email ? "email" : "teleservice"));
  const built = builtCache.get(p.id)?.result;
  const pieces = built?.pieces ?? [];
  const mail = coverLetterEmail(p, client, tenant, mairie, [...pieces, "cerfa 16702*03", "mandat"]);
  const [subject, setSubject] = useState(mail.subject);
  const [body, setBody] = useState(mail.body);
  const [to, setTo] = useState(mail.to);
  const [confirm, setConfirm] = useState(false);
  const [depositDate, setDepositDate] = useState(new Date().toISOString().slice(0, 10));
  const [sendMsg, setSendMsg] = useState("");
  const copies = paperCopies(analysis.facts, rulesetFor(b.project.works));
  const serverMail = process.env.NEXT_PUBLIC_DEPLOY_TARGET === "server";
  const deposited = p.events.some((e) => e.type === "depot");

  const markDeposited = () => {
    save({ ...p, filingMode: mode, status: "depose", events: [...p.events, { id: uid("evt"), type: "depot", date: depositDate, note: `Dépôt : ${MODES.find((m) => m.id === mode)?.label}` }] }, "depot_dossier");
    setConfirm(false);
    goTo("suivi");
  };

  const sendViaServer = async () => {
    if (!built) return;
    setSendMsg("Envoi…");
    try {
      const form = new FormData();
      form.append("to", to);
      form.append("subject", subject);
      form.append("body", body);
      form.append("pdf", built.pdf, `Dossier_DP_${p.reference}.pdf`);
      const r = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/api/mail/send`, { method: "POST", body: form });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setSendMsg(`Envoyé (id ${j.id}).`);
      markDeposited();
    } catch (e) {
      setSendMsg(`Échec : ${e instanceof Error ? e.message : e}`);
    }
  };

  return (
    <div className="space-y-4">
      <Card title="Destinataire : mairie compétente">
        {mairie?.name ? (
          <div className="space-y-1 text-sm">
            <p className="font-medium">{mairie.name}</p>
            {mairie.address && <p>{mairie.address}</p>}
            <p>
              Email : {mairie.email ? <strong data-testid="mairie-email">{mairie.email}</strong> : <Badge tone="alerte">non identifié</Badge>} {mairie.phone && <>: Tél. {mairie.phone}</>}
            </p>
            {mairie.hours && <p className="text-xs text-stone-600">Horaires : {mairie.hours}</p>}
            {mairie.sourceUrl && (
              <a href={mairie.sourceUrl} target="_blank" rel="noreferrer" className="text-xs text-brand-700 underline">
                Fiche Annuaire de l&apos;administration (source)
              </a>
            )}
            <p className="text-xs text-stone-500">Téléservice : {mairie.teleserviceUrl ? <a className="underline" href={mairie.teleserviceUrl}>{mairie.teleserviceUrl}</a> : "non référencé dans l'Annuaire : consultez le site de la mairie ou utilisez AD'AU."}</p>
          </div>
        ) : (
          <div className="space-y-2 text-sm">
            <p>Coordonnées non récupérées automatiquement. <a className="text-brand-700 underline" href={annuaireSearchLink(p.address?.city ?? "")} target="_blank" rel="noreferrer">Rechercher la mairie dans l&apos;Annuaire</a> puis saisissez l&apos;email :</p>
          </div>
        )}
        <div className="mt-2 max-w-sm">
          <Field label="Corriger l'email de dépôt" help="Certaines mairies ont une adresse dédiée à l'urbanisme : votre saisie est prioritaire sur l'Annuaire.">
            <Input type="email" defaultValue={String(p.overrides["mairie.email"] ?? "")} placeholder={mairie?.email ?? "urbanisme@mairie-exemple.fr"} onBlur={(e) => save({ ...p, overrides: { ...p.overrides, "mairie.email": e.target.value || undefined } }, "correction_mairie")} />
          </Field>
        </div>
      </Card>

      <Card title="Mode de dépôt">
        <div className="grid gap-2 sm:grid-cols-2">
          {MODES.map((m) => (
            <button key={m.id} onClick={() => setMode(m.id)} className={`flex items-start gap-2 rounded-lg border p-3 text-left text-sm ${mode === m.id ? "border-brand-700 bg-brand-50" : "border-stone-200"}`} aria-pressed={mode === m.id}>
              <m.icon className="mt-0.5 h-5 w-5 shrink-0" />
              <span>
                <strong>{m.label}</strong>
                <span className="block text-xs text-stone-600">{m.desc}</span>
              </span>
            </button>
          ))}
        </div>
        {!built && <p className="mt-3 rounded bg-amber-50 p-2 text-sm text-amber-900">Générez d&apos;abord le dossier (onglet Dossier) pour joindre les pièces.</p>}
      </Card>

      {mode === "email" && (
        <Card title="Email prêt à envoyer">
          <div className="space-y-3">
            {!to && <p className="rounded bg-amber-50 p-2 text-sm text-amber-900">Aucun email de mairie : utilisez le téléservice ou la lettre recommandée.</p>}
            <Field label="À">
              <Input value={to} onChange={(e) => setTo(e.target.value)} />
            </Field>
            <Field label="Objet">
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
            </Field>
            <Field label="Message">
              <textarea className="h-64 w-full rounded-lg border border-stone-300 p-3 text-sm" value={body} onChange={(e) => setBody(e.target.value)} />
            </Field>
            <p className="text-xs text-stone-600">Pièce jointe : Dossier_DP_{p.reference}.pdf {built && `(${Math.round(built.pdf.size / 1024)} Ko)`}</p>
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={!built || !to}
                onClick={async () => built && download(buildEml({ to, subject, body, attachments: [{ name: `Dossier_DP_${p.reference}.pdf`, bytes: new Uint8Array(await built.pdf.arrayBuffer()) }] }), `Email_mairie_${p.reference}.eml`)}
                data-testid="download-eml"
              >
                <Mail className="h-4 w-4" /> Télécharger l&apos;email (.eml avec PDF)
              </Button>
              <a className="inline-flex h-10 items-center rounded-lg border border-stone-300 bg-white px-4 text-sm font-medium" href={mailtoLink(to, subject, body)}>
                Ouvrir dans ma messagerie
              </a>
              <Button variant="secondary" disabled={!built || !to || !serverMail} onClick={() => setConfirm(true)} title={serverMail ? "" : "Envoi direct : déploiement serveur + RESEND_API_KEY requis"}>
                <Send className="h-4 w-4" /> Envoyer depuis DP Solaire
              </Button>
            </div>
            <p className="text-xs text-stone-500">Aucun email n&apos;est envoyé sans votre confirmation explicite. En mode démo (sans serveur), ouvrez le .eml dans votre messagerie puis cliquez « Envoyer ».</p>
            {sendMsg && <p className="text-sm">{sendMsg}</p>}
          </div>
        </Card>
      )}

      {mode === "teleservice" && (
        <Card title="Guide de dépôt en ligne">
          <ol className="list-inside list-decimal space-y-1.5 text-sm">
            {gnauSteps(mairie).map((s) => <li key={s}>{s}</li>)}
          </ol>
        </Card>
      )}

      {(mode === "lrar" || mode === "main_propre") && (
        <Card title={mode === "lrar" ? "Courrier recommandé avec AR" : "Dépôt en mairie"}>
          <p className="mb-2 text-sm">
            <Badge tone="info">{copies.label}</Badge>
          </p>
          <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-lg bg-stone-50 p-3 text-xs">{lrarLetter(p, client, tenant, mairie, [...pieces, "cerfa 16702*03", "mandat"], copies.copies)}</pre>
          <p className="mt-2 text-xs text-stone-500">Le courrier est aussi inclus dans le ZIP (Courrier_LRAR_mairie.pdf). Imprimez le PDF unique en {copies.copies} exemplaires.</p>
        </Card>
      )}

      <Card title="Enregistrer le dépôt">
        {deposited ? (
          <p className="text-sm">Dossier déposé : suivez l&apos;instruction dans l&apos;onglet Suivi.</p>
        ) : (
          <div className="flex flex-wrap items-end gap-2">
            <Field label="Date de dépôt (ou d'envoi)">
              <Input type="date" value={depositDate} onChange={(e) => setDepositDate(e.target.value)} />
            </Field>
            <Button onClick={() => setConfirm(true)} data-testid="mark-deposited">
              J&apos;ai déposé le dossier
            </Button>
          </div>
        )}
      </Card>

      <Modal open={confirm} onClose={() => setConfirm(false)} title="Confirmation">
        <p className="text-sm">
          Vous confirmez {mode === "email" && serverMail ? `l'envoi du dossier à ${to}` : "avoir déposé le dossier"} le {depositDate.split("-").reverse().join("/")} pour {p.address?.label} ? Le calcul des délais démarrera à cette date.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConfirm(false)}>
            Annuler
          </Button>
          {mode === "email" && serverMail && built ? (
            <Button onClick={sendViaServer}>Confirmer l&apos;envoi</Button>
          ) : (
            <Button onClick={markDeposited} data-testid="confirm-deposit">
              Confirmer
            </Button>
          )}
        </div>
      </Modal>
    </div>
  );
}
