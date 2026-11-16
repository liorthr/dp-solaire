"use client";
// Dépôt fait par le particulier lui-même : choix de la façon de déposer, pas à pas, puis « J'ai déposé ».
import { useState } from "react";
import { CheckCircle2, Mail, MonitorSmartphone, Stamp } from "lucide-react";
import type { FilingMode } from "@/lib/types";
import { Button, Card, Field, Input } from "@/components/ui";
import { coverLetterEmail, lrarLetter } from "@/lib/dossier/texts";
import { paperCopies, rulesetFor } from "@/lib/rules/engine";
import { buildEml } from "@/lib/mail/eml";
import { annuaireSearchLink } from "@/lib/providers/annuaire";
import { uid } from "@/lib/project/factory";
import { authorizationOf } from "@/lib/works/authorization";
import { cn } from "@/components/ui";
import { builtCache, download } from "./DossierTab";
import type { ProjectBundle } from "./useProject";
import { useSaveProject } from "./useProject";

const ADAU = "https://www.service-public.gouv.fr/particuliers/vosdroits/R52221";

export function HomeownerDeposit({ b, onDone }: { b: ProjectBundle; onDone: () => void }) {
  const { project: p, client, tenant, analysis } = b;
  const save = useSaveProject();
  const mairie = p.enrichment?.mairie;
  const auth = authorizationOf(p);
  const built = builtCache.get(p.id)?.result;
  const copies = paperCopies(analysis.facts, rulesetFor(p.works));
  const [mode, setMode] = useState<FilingMode>(mairie?.teleserviceUrl ? "teleservice" : mairie?.email ? "email" : "teleservice");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [number, setNumber] = useState("");
  const deposited = p.events.find((e) => e.type === "depot");
  const pieces = built?.pieces ?? [];
  const mail = coverLetterEmail(p, client, tenant, mairie, [...pieces, `cerfa ${auth.cerfa}`]);

  const markDeposited = () => {
    const events = [...p.events, { id: uid("evt"), type: "depot" as const, date, note: { teleservice: "Déposé en ligne", email: "Envoyé par email", lrar: "Envoyé en recommandé", main_propre: "Déposé en mairie" }[mode] }];
    if (number.trim()) events.push({ id: uid("evt"), type: "recepisse", date, note: `N° d'enregistrement : ${number.trim()}` });
    save({ ...p, filingMode: mode, status: "depose", events }, "depot_par_le_declarant");
    onDone();
  };

  if (!built)
    return (
      <Card title="Déposer votre dossier en mairie">
        <p className="text-sm">Téléchargez d&apos;abord votre dossier complet à l&apos;étape « Mon dossier » : vous en aurez besoin pour le déposer.</p>
      </Card>
    );

  if (deposited)
    return (
      <Card title="Dossier déposé">
        <p className="flex items-center gap-2 text-sm">
          <CheckCircle2 className="h-5 w-5 text-brand-600" /> Déposé le {new Date(deposited.date).toLocaleDateString("fr-FR")}. Suivez les délais à l&apos;étape « Suivi ».
        </p>
      </Card>
    );

  const options: { id: FilingMode; icon: typeof Mail; title: string; sub: string; reco?: boolean }[] = [
    { id: "teleservice", icon: MonitorSmartphone, title: "En ligne", sub: mairie?.teleserviceUrl ? "Sur le guichet en ligne de votre commune" : "Sur le service national AD'AU", reco: true },
    { id: "email", icon: Mail, title: "Par email", sub: mairie?.email ? `À ${mairie.email}` : "Si votre mairie l'accepte" },
    { id: "lrar", icon: Stamp, title: "Par courrier ou en mairie", sub: `${copies.copies} exemplaires papier` },
  ];

  return (
    <div className="space-y-4">
      <Card title={`Déposer votre ${auth.kind === "PC" ? "permis de construire" : "déclaration préalable"} en mairie`}>
        <p className="mb-3 text-sm text-muted">
          C&apos;est vous qui déposez : c&apos;est gratuit, et votre mairie ({mairie?.name ?? p.address?.city}) vous répond. Choisissez la façon qui vous convient.
        </p>
        <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Façon de déposer">
          {options.map((o) => (
            <button key={o.id} role="radio" aria-checked={mode === o.id} onClick={() => setMode(o.id)} className={cn("rounded-2xl border-2 p-4 text-left", mode === o.id ? "border-brand-600 bg-mint" : "border-line bg-white")} data-testid={`deposit-${o.id}`}>
              <o.icon className="h-5 w-5 text-brand-600" />
              <b className="mt-2 block">{o.title}</b>
              <span className="text-xs text-muted">{o.sub}</span>
              {o.reco && <span className="mt-1 block text-[11px] font-bold uppercase tracking-wider text-brand-600">Le plus simple</span>}
            </button>
          ))}
        </div>
      </Card>

      <Card title="Pas à pas">
        {mode === "teleservice" && (
          <ol className="list-decimal space-y-2 pl-5 text-sm">
            <li>
              Ouvrez{" "}
              <a className="font-medium text-brand-700 underline" href={mairie?.teleserviceUrl ?? ADAU} target="_blank" rel="noreferrer">
                {mairie?.teleserviceUrl ? "le guichet en ligne de votre commune" : "le service AD'AU (service-public.gouv.fr)"}
              </a>{" "}
              et créez votre compte (ou connectez-vous avec FranceConnect).
            </li>
            <li>Choisissez « {auth.kind === "PC" ? "Permis de construire une maison individuelle" : "Déclaration préalable"} ».</li>
            <li>Recopiez les informations du cerfa rempli (il est dans votre dossier), puis ajoutez chaque pièce avec son nom : {pieces.join(", ")}.</li>
            <li>Validez : vous recevez un accusé de réception avec un numéro d&apos;enregistrement. Notez-le ci-dessous.</li>
          </ol>
        )}
        {mode === "email" && (
          <div className="space-y-3 text-sm">
            <p>Le message est prêt, avec votre dossier en pièce jointe. Ouvrez-le avec votre messagerie, vérifiez-le et envoyez-le depuis votre adresse.</p>
            <Button
              onClick={() => {
                built.pdf.arrayBuffer().then((buf) => {
                  const full = buildEml({ to: mail.to, subject: mail.subject, body: mail.body, attachments: [{ name: `Dossier_${auth.short}_${p.reference}.pdf`, bytes: new Uint8Array(buf), type: "application/pdf" }] });
                  download(new Blob([full], { type: "message/rfc822" }), `Email_mairie_${p.reference}.eml`);
                });
              }}
              data-testid="homeowner-eml"
            >
              <Mail className="h-4 w-4" /> Télécharger l&apos;email prêt à envoyer
            </Button>
            {!mairie?.email && (
              <p className="text-xs text-muted">
                Adresse de la mairie inconnue : trouvez-la sur{" "}
                <a className="underline" href={annuaireSearchLink(p.address?.city ?? "")} target="_blank" rel="noreferrer">
                  l&apos;annuaire de l&apos;administration
                </a>
                .
              </p>
            )}
          </div>
        )}
        {(mode === "lrar" || mode === "main_propre") && (
          <div className="space-y-3 text-sm">
            <p>{copies.label}. Imprimez le dossier complet {copies.copies} fois, signez le cerfa, joignez le courrier ci-dessous et envoyez le tout en recommandé avec accusé de réception, ou déposez-le à l&apos;accueil de la mairie contre récépissé.</p>
            <Button
              variant="outline"
              onClick={() => download(new Blob([lrarLetter(p, client, tenant, mairie, [...pieces, `cerfa ${auth.cerfa}`], copies.copies)], { type: "text/plain;charset=utf-8" }), `Courrier_mairie_${p.reference}.txt`)}
            >
              <Stamp className="h-4 w-4" /> Télécharger le courrier d&apos;accompagnement
            </Button>
          </div>
        )}
      </Card>

      <Card title="Vous avez déposé ?">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Date du dépôt" htmlFor="dep-date">
            <Input id="dep-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Numéro d'enregistrement (facultatif)" htmlFor="dep-num" help="Il figure sur l'accusé de réception ou le récépissé de la mairie.">
            <Input id="dep-num" value={number} onChange={(e) => setNumber(e.target.value)} placeholder="ex. DP 080 632 26 X0042" />
          </Field>
        </div>
        <Button size="lg" className="mt-3" onClick={markDeposited} data-testid="homeowner-deposited">
          J&apos;ai déposé mon dossier
        </Button>
        <p className="mt-2 text-xs text-muted">Nous calculons alors la date limite de réponse de la mairie et vous la rappelons.</p>
      </Card>
    </div>
  );
}
