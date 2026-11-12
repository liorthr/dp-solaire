"use client";
import { useMemo, useState } from "react";
import { Download, ExternalLink, FileArchive, Loader2, Zap } from "lucide-react";
import type { ElecInfo, InstructionEvent } from "@/lib/types";
import { Badge, Button, Card, Field, Input, Select, severityLabel, severityTone } from "@/components/ui";
import { SignaturePad } from "@/components/SignaturePad";
import { defaultElec } from "@/lib/elec/calc";
import { evaluateRaccordement } from "@/lib/elec/rules";
import { singleLineSvg } from "@/lib/elec/schema";
import { mandateRaccordementText } from "@/lib/elec/texts";
import { buildRaccordementPack, type RacFile } from "@/lib/elec/build";
import { simpleSignatureProvider } from "@/lib/providers/signature";
import { parcelRefs } from "@/lib/dossier/texts";
import { fr } from "@/lib/instruction/deadlines";
import { uid } from "@/lib/project/factory";
import { download } from "./DossierTab";
import type { ProjectBundle } from "./useProject";
import { useSaveProject } from "./useProject";

const STEPS: { type: InstructionEvent["type"]; label: string; group: "Enedis" | "Consuel" }[] = [
  { type: "rac_demande", label: "Demande de raccordement déposée (Enedis Connect)", group: "Enedis" },
  { type: "rac_complete", label: "Demande déclarée complète (fixe le tarif d'achat)", group: "Enedis" },
  { type: "rac_proposition", label: "Proposition / convention reçue", group: "Enedis" },
  { type: "rac_acceptation", label: "Proposition acceptée (et acompte réglé si demandé)", group: "Enedis" },
  { type: "consuel_demande", label: "Demande de visa Consuel envoyée", group: "Consuel" },
  { type: "consuel_visite", label: "Visite de contrôle Consuel", group: "Consuel" },
  { type: "consuel_vise", label: "Attestation visée (transmise au gestionnaire de réseau)", group: "Consuel" },
  { type: "rac_mise_en_service", label: "Mise en service (début du contrat d'achat)", group: "Enedis" },
];

export function RaccordementTab({ b }: { b: ProjectBundle }) {
  const { project: p, client, tenant, panel, inverter } = b;
  const save = useSaveProject();
  const e: ElecInfo = p.elec ?? defaultElec(p);
  const { calc: r, evaluation } = useMemo(() => evaluateRaccordement(p, panel, inverter), [p, panel, inverter]);
  const [busy, setBusy] = useState("");
  const [files, setFiles] = useState<{ files: RacFile[]; zip: Blob; warnings: string[] } | null>(null);
  const [sig, setSig] = useState<string | null>(null);
  const [stepDate, setStepDate] = useState(new Date().toISOString().slice(0, 10));

  const set = (patch: Partial<ElecInfo>) => save({ ...p, elec: { ...e, ...patch } }, "edition_raccordement");
  const num = (v: string) => (v === "" ? undefined : Number(v.replace(",", ".")));
  const issues = evaluation.results.filter((x) => x.severity !== "ok").sort((a, c) => ["bloquant", "alerte", "info"].indexOf(a.severity) - ["bloquant", "alerte", "info"].indexOf(c.severity));
  const svg = useMemo(
    () => singleLineSvg(p, e, r, panel, inverter, { reference: p.reference, address: p.address?.label ?? "", parcels: parcelRefs(p.enrichment), date: fr(new Date().toISOString().slice(0, 10)), company: tenant.name, client: client ? `${client.firstName} ${client.lastName}` : "" }),
    [p, e, r, panel, inverter, tenant.name, client],
  );

  const generate = async () => {
    setBusy("Préparation");
    try {
      setFiles(await buildRaccordementPack({ project: p, client, tenant, panel, inverter, onProgress: setBusy }));
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="space-y-4">
      <Card title={<span className="flex items-center gap-2"><Zap className="h-4 w-4" /> Raccordement Enedis & attestation Consuel</span>}>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Point de livraison (PDL/PRM)" help="14 chiffres, sur la facture d'électricité ou l'écran du compteur Linky (touche +).">
            <Input inputMode="numeric" data-testid="pdl" defaultValue={e.pdl ?? ""} placeholder="14 chiffres" onBlur={(ev) => set({ pdl: ev.target.value.replace(/\s/g, "") || undefined })} />
          </Field>
          <Field label="Puissance souscrite (kVA)">
            <Input type="number" defaultValue={e.subscribedKva ?? ""} onBlur={(ev) => set({ subscribedKva: num(ev.target.value) })} />
          </Field>
          <Field label="Réglage AGCP (A)" help="Calibre du disjoncteur de branchement Enedis (ex. 45 A en monophasé 9 kVA).">
            <Input type="number" defaultValue={e.agcpA ?? ""} onBlur={(ev) => set({ agcpA: num(ev.target.value) })} />
          </Field>
          <Field label="Réseau">
            <Select value={e.phase} onChange={(ev) => set({ phase: ev.target.value as ElecInfo["phase"] })}>
              <option value="mono">Monophasé</option>
              <option value="tri">Triphasé</option>
            </Select>
          </Field>
          <Field label="Valorisation" help="Surplus : autoconsommation et vente du surplus. Totale : vente de toute la production. Sans injection : autoconsommation totale (CACSI).">
            <Select value={e.injection} data-testid="injection" onChange={(ev) => set({ injection: ev.target.value as ElecInfo["injection"] })}>
              <option value="surplus">Autoconsommation + vente du surplus</option>
              <option value="sans">Autoconsommation totale (sans injection)</option>
              <option value="totale">Vente de la totalité</option>
            </Select>
          </Field>
          <Field label="Acheteur">
            <Select value={e.buyer} disabled={e.injection === "sans"} onChange={(ev) => set({ buyer: ev.target.value as ElecInfo["buyer"] })}>
              <option value="edf_oa">EDF Obligation d&apos;Achat</option>
              <option value="enedis">Cession gratuite à Enedis (jusqu&apos;à 3 kW)</option>
              <option value="autre">Autre acheteur</option>
            </Select>
          </Field>
          <Field label="Raccordement au tableau (SC 144)" help="Cas 1 : protection dédiée en dehors du tableau ; cas 2 : dans le tableau ; cas 3 : sans protection complémentaire ; cas 4 : autre (schéma + SC 144E).">
            <Select value={e.connectionCase} onChange={(ev) => set({ connectionCase: Number(ev.target.value) as ElecInfo["connectionCase"] })}>
              <option value={1}>Cas 1 : protection amont hors tableau</option>
              <option value={2}>Cas 2 : protection amont dans le tableau</option>
              <option value={3}>Cas 3 : sans protection complémentaire</option>
              <option value={4}>Cas 4 : autre configuration</option>
            </Select>
          </Field>
          <Field label="Tableau">
            <Select value={e.board} onChange={(ev) => set({ board: ev.target.value as ElecInfo["board"] })}>
              <option value="principal">Principal</option>
              <option value="divisionnaire">Divisionnaire</option>
            </Select>
          </Field>
          <Field label="Longueur câble AC (m)">
            <Input type="number" defaultValue={e.acCableLengthM} onBlur={(ev) => set({ acCableLengthM: num(ev.target.value) ?? 15 })} />
          </Field>
          <Field label="Section câble DC (mm²)">
            <Input type="number" defaultValue={e.dcCableSectionMm2} onBlur={(ev) => set({ dcCableSectionMm2: num(ev.target.value) ?? 4 })} />
          </Field>
          {!r.isMicro && (
            <>
              <Field label="Modules en série par chaîne">
                <Input type="number" defaultValue={e.modulesPerString ?? ""} placeholder={String(p.pv.panelCount)} onBlur={(ev) => set({ modulesPerString: num(ev.target.value) })} />
              </Field>
              <Field label="Nombre de chaînes">
                <Input type="number" defaultValue={e.strings ?? 1} onBlur={(ev) => set({ strings: num(ev.target.value) })} />
              </Field>
            </>
          )}
          <Field label="Batterie">
            <Select value={e.battery ? "oui" : "non"} onChange={(ev) => set({ battery: ev.target.value === "oui" })}>
              <option value="non">Non</option>
              <option value="oui">Oui</option>
            </Select>
          </Field>
          <Field label="Nom de l'électricien (dossier Consuel)">
            <Input defaultValue={e.installerName ?? ""} onBlur={(ev) => set({ installerName: ev.target.value || undefined })} />
          </Field>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Résultats">
          <ul className="space-y-1 text-sm" data-testid="elec-results">
            <li>Puissance de raccordement : <strong>{String(r.acPowerKva).replace(".", ",")} kVA</strong> ({r.isMicro ? `${r.microCount} micro-onduleurs` : "onduleur central"})</li>
            <li>Courant AC : {String(r.iAcA).replace(".", ",")} A : protection <strong>{r.breakerA} A</strong> + différentiel 30 mA</li>
            <li>Câble AC : <strong>{r.sectionMm2} mm²</strong> : chute de tension {String(r.dropPct).replace(".", ",")} %</li>
            <li>Iscmax : {r.iscMaxA !== undefined ? String(r.iscMaxA).replace(".", ",") : "?"} A : Uocmax : {r.uocMaxV !== undefined ? String(r.uocMaxV).replace(".", ",") : "?"} V</li>
            <li>
              Consuel : attestation <Badge tone={r.attestation === "bleue" ? "info" : "ia"}>{r.attestation}</Badge> ({r.attestationCerfa}) + <strong data-testid="consuel-form">{r.consuelForm}</strong>
              {r.extraForms.length > 0 && <> + {r.extraForms.join(" + ")}</>}{" "}
              <a className="text-brand-700 underline" href="https://www.consuel.com/dossiers-techniques/" target="_blank" rel="noreferrer">source</a>
            </li>
            {r.notes.map((n) => <li key={n} className="text-xs text-amber-800">{n}</li>)}
          </ul>
        </Card>
        <Card title={`Contrôles (${evaluation.blocking.length} bloquant(s), ${evaluation.warnings.length} alerte(s))`}>
          <ul className="divide-y" data-testid="rac-rules">
            {issues.map((x) => (
              <li key={x.code} className="py-2 text-sm">
                <div className="flex items-start gap-2">
                  <Badge tone={severityTone(x.severity)}>{severityLabel(x.severity)}</Badge>
                  <div>
                    <p className="font-medium">{x.title}</p>
                    <p className="text-stone-700">{x.message}</p>
                    {x.suggestion && <p className="text-stone-600">→ {x.suggestion}</p>}
                    <a href={x.source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-brand-700 underline">
                      {x.source_label} <ExternalLink className="h-3 w-3" />
                    </a>{" "}
                    {x.verification === "A_VERIFIER" && <Badge>À_VÉRIFIER</Badge>}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card title="Schéma unifilaire (aperçu)">
        <div className="overflow-hidden rounded border border-stone-200 [&>svg]:h-auto [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: svg }} />
      </Card>

      <Card title="Mandat du titulaire du compteur (Enedis, Consuel, contrat d'achat)">
        {e.mandate ? (
          <p className="text-sm">Signé par {e.mandate.signerName} le {new Date(e.mandate.signedAt).toLocaleString("fr-FR")} <Badge tone="ok">signé</Badge></p>
        ) : (
          <div className="space-y-2">
            <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded bg-stone-50 p-2 text-xs">{mandateRaccordementText(p, client, tenant, e)}</pre>
            <SignaturePad onChange={setSig} />
            <Button
              variant="outline"
              disabled={!sig || !client}
              onClick={async () => {
                const rec = await simpleSignatureProvider.sign({ signerName: `${client!.firstName} ${client!.lastName}`, document: mandateRaccordementText(p, client, tenant, e), imageDataUrl: sig! });
                set({ mandate: rec });
              }}
            >
              Le client signe le mandat
            </Button>
          </div>
        )}
      </Card>

      <Card title="Générer le pack Raccordement & Consuel">
        <p className="mb-2 text-sm text-stone-600">Schéma unifilaire, dossier technique Consuel pré-rempli, note de calcul, récapitulatif à saisir sur Enedis Connect, mandat et plan de situation.</p>
        <Button size="lg" variant="secondary" onClick={generate} disabled={Boolean(busy)} data-testid="generate-rac">
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Zap className="h-5 w-5" />} {busy ? `${busy}…` : "Générer le pack"}
        </Button>
        {files && (
          <div className="mt-3 space-y-2" data-testid="rac-downloads">
            <Button onClick={() => download(files.zip, `${p.reference}_Raccordement_Consuel.zip`)} data-testid="download-rac-zip">
              <FileArchive className="h-4 w-4" /> ZIP ({Math.round(files.zip.size / 1024)} Ko)
            </Button>
            <ul className="divide-y text-sm">
              {files.files.map((f) => (
                <li key={f.name} className="flex justify-between gap-2 py-1.5">
                  <span>{f.label}</span>
                  <button className="inline-flex items-center gap-1 text-xs text-brand-700 underline" onClick={() => download(new Blob([f.bytes as BlobPart], { type: "application/pdf" }), f.name)}>
                    <Download className="h-3 w-3" /> {f.name}
                  </button>
                </li>
              ))}
            </ul>
            {files.warnings.map((w) => <p key={w} className="text-xs text-amber-800">⚠ {w}</p>)}
          </div>
        )}
        <p className="mt-3 text-xs text-stone-500">
          Dépôt : demande en ligne sur <a className="underline" href="https://www.enedis.fr/" target="_blank" rel="noreferrer">Enedis Connect</a> (procédure Enedis-PRO-RAC_20E) ; visa sur <a className="underline" href="https://www.consuel.com/" target="_blank" rel="noreferrer">consuel.com</a>. Aucun dépôt n&apos;est fait automatiquement.
        </p>
      </Card>

      <Card title="Suivi raccordement & Consuel">
        <ol className="space-y-1.5 text-sm" data-testid="rac-steps">
          {STEPS.map((s) => {
            const ev = p.events.find((x) => x.type === s.type);
            return (
              <li key={s.type} className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  <Badge tone={ev ? "ok" : "neutral"}>{s.group}</Badge> {s.label}
                </span>
                {ev ? (
                  <span className="text-xs">
                    {fr(ev.date)}{" "}
                    <button className="text-stone-400 underline" onClick={() => save({ ...p, events: p.events.filter((x) => x.id !== ev.id) }, "suppression_etape_raccordement")}>annuler</button>
                  </span>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => save({ ...p, events: [...p.events, { id: uid("evt"), type: s.type, date: stepDate }] }, `etape_${s.type}`)}>
                    Fait le {fr(stepDate)}
                  </Button>
                )}
              </li>
            );
          })}
        </ol>
        <div className="mt-2 max-w-xs">
          <Field label="Date des étapes">
            <Input type="date" value={stepDate} onChange={(ev) => setStepDate(ev.target.value)} />
          </Field>
        </div>
        <p className="mt-2 text-xs text-stone-500">La date de demande complète fixe le tarif d&apos;achat ; le contrat d&apos;achat démarre à la mise en service (arrêté du 1er juin 2026). Les délais Enedis dépendent de la procédure et des travaux éventuels (À_VÉRIFIER).</p>
      </Card>
    </div>
  );
}
