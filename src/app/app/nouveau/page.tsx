"use client";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Check, Loader2, AlertTriangle, XCircle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { SignaturePad } from "@/components/SignaturePad";
import { PhotoInput } from "@/components/PhotoInput";
import { Badge, Button, Card, Field, Input, Progress, Select, cn } from "@/components/ui";
import type { AddressResult, Client, MountingType, Photo, Project, ProjectAnswers } from "@/lib/types";
import { currentSession, repo } from "@/lib/store/db";
import { applyEnrichment, newProject, relayout } from "@/lib/project/factory";
import { runEnrichment, STEPS, type StepId } from "@/lib/enrichment/run";
import { simpleSignatureProvider } from "@/lib/providers/signature";
import { mandateText } from "@/lib/dossier/texts";

const STEP_LABELS = ["Adresse", "Client & mandat", "Projet", "Photos"];

function Wizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [address, setAddress] = useState<AddressResult>();
  const [answers, setAnswers] = useState<ProjectAnswers>({ visibleFromPublicSpace: true, inLotissement: "nsp", copropriete: false, buildingIsListedMH: false });
  const clients = repo.clients();
  const [clientId, setClientId] = useState<string>("");
  const [c, setC] = useState<Partial<Client>>({ civility: "Mme" });
  const [sig, setSig] = useState<string | null>(null);
  const [mandateOk, setMandateOk] = useState(false);
  const panels = repo.panels();
  const inverters = repo.inverters();
  const [panelId, setPanelId] = useState(panels[0]?.id ?? "");
  const [count, setCount] = useState(12);
  const panel = panels.find((p) => p.id === panelId);
  const computed = panel ? Math.round(count * panel.powerWc) / 1000 : 0;
  const [power, setPower] = useState<string>("");
  const [mounting, setMounting] = useState<MountingType>("surimposition");
  const [inverterId, setInverterId] = useState(inverters[0]?.id ?? "");
  const [photos, setPhotos] = useState<Partial<Record<Photo["kind"], Photo>>>({});
  const [progress, setProgress] = useState<Record<string, { status: string; message?: string }>>({});
  const [running, setRunning] = useState(false);
  const [err, setErr] = useState("");

  const existingClient = clients.find((x) => x.id === clientId);
  const canNext = useMemo(() => {
    if (step === 0) return Boolean(address);
    if (step === 1) return Boolean(existingClient || (c.lastName && c.firstName && (c.email || c.phone)));
    if (step === 2) return Boolean(panel && count > 0);
    return true;
  }, [step, address, existingClient, c, panel, count]);

  const create = async () => {
    if (!address) return;
    setRunning(true);
    setErr("");
    try {
      const s = repo.tenant();
      const client = existingClient ?? repo.saveClient({ civility: c.civility, firstName: c.firstName!, lastName: c.lastName!, email: c.email, phone: c.phone, birthDate: c.birthDate, birthPlace: c.birthPlace });
      let p: Project = newProject(s.id, currentSession()!.user.id, address);
      p.clientId = client.id;
      p.answers = answers;
      p.pv = { ...p.pv, panelId, panelCount: count, powerKwc: power ? Number(power.replace(",", ".")) : computed, mounting, inverterId };
      p.photos = Object.values(photos).filter(Boolean) as Photo[];
      if (sig && mandateOk) p.mandate = await simpleSignatureProvider.sign({ signerName: `${client.firstName} ${client.lastName}`, document: mandateText(p, client, s), imageDataUrl: sig });
      p = repo.saveProject(p);
      const enrichment = await runEnrichment(address, { lon: address.lon, lat: address.lat }, (id: StepId, status, message) => setProgress((pr) => ({ ...pr, [id]: { status, message } })), { snap: address.type !== "housenumber" && address.type !== "manual" });
      if (address.type === "manual") enrichment.notices = [...(enrichment.notices ?? []), "Adresse saisie manuellement : la position est provisoire (centre de la commune). Ouvrez l'onglet Plans et cliquez sur la maison pour relancer l'analyse au bon endroit."];
      const site = enrichment.site;
      p = applyEnrichment(p, enrichment);
      if (panel) p = relayout(p, panel);
      p.overrides = { ...p.overrides, site };
      repo.saveProject(p, "enrichissement");
      router.push(`/app/dossier/?id=${p.id}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      setRunning(false);
    }
  };

  if (running) {
    return (
      <Card title="Analyse automatique du terrain">
        <p className="mb-3 text-sm text-stone-600">Interrogation des sources officielles en parallèle. En cas d&apos;échec d&apos;une source, vous pourrez compléter à la main.</p>
        <ul className="space-y-2" aria-live="polite">
          {STEPS.map((s) => {
            const st = progress[s.id]?.status;
            return (
              <li key={s.id} className="flex items-start gap-2 text-sm">
                {st === "ok" ? <Check className="h-5 w-5 text-emerald-700" /> : st === "degraded" ? <AlertTriangle className="h-5 w-5 text-amber-600" /> : st === "error" ? <XCircle className="h-5 w-5 text-red-700" /> : <Loader2 className="h-5 w-5 animate-spin text-stone-400" />}
                <span>
                  {s.label}
                  {progress[s.id]?.message && <span className="block text-xs text-stone-500">{progress[s.id]?.message}</span>}
                </span>
              </li>
            );
          })}
        </ul>
        <div className="mt-4">
          <Progress value={(Object.values(progress).filter((p) => p.status !== "running").length / STEPS.length) * 100} label="Progression" />
        </div>
        {err && <p className="mt-3 text-sm text-red-700">{err}</p>}
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <ol className="flex gap-1" aria-label="Étapes">
        {STEP_LABELS.map((l, i) => (
          <li key={l} className="flex-1">
            <div className={cn("h-1.5 rounded-full", i <= step ? "bg-brand-600" : "bg-stone-200")} />
            <p className={cn("mt-1 text-xs", i === step ? "font-semibold text-brand-800" : "text-stone-500")}>
              {i + 1}. {l}
            </p>
          </li>
        ))}
      </ol>

      {step === 0 && (
        <Card title="Où se trouve le chantier ?">
          <div className="space-y-4">
            <Field label="Adresse du chantier" htmlFor="address" help="Tapez l'adresse : la Base Adresse Nationale propose les correspondances. Tout le reste (cadastre, PLU, monuments, mairie) est déduit automatiquement." example="Allée des Tilleuls 80480 Pont-de-Metz">
              <AddressAutocomplete value={address} onSelect={setAddress} />
            </Field>
            {address && (
              <p className="rounded-lg bg-brand-50 p-2 text-sm">
                <strong>{address.label}</strong> : commune INSEE {address.insee}
                {address.type === "gps" ? <span className="block text-xs text-emerald-800">Position GPS : le projet sera rattaché au bâtiment le plus proche du point.</span> : address.type === "manual" ? <span className="block text-xs text-amber-800">Adresse manuelle : vous désignerez la maison sur la carte.</span> : address.type !== "housenumber" && <span className="block text-xs text-amber-800">Adresse sans numéro : vous préciserez la maison sur la carte (onglet Plans).</span>}
              </p>
            )}
            <fieldset className="space-y-2 text-sm">
              <legend className="font-medium">Questions rapides (laisser par défaut si vous ne savez pas)</legend>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={answers.visibleFromPublicSpace !== false} onChange={(e) => setAnswers({ ...answers, visibleFromPublicSpace: e.target.checked })} /> La toiture est visible depuis la rue
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={Boolean(answers.copropriete)} onChange={(e) => setAnswers({ ...answers, copropriete: e.target.checked })} /> Bâtiment en copropriété
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={Boolean(answers.buildingIsListedMH)} onChange={(e) => setAnswers({ ...answers, buildingIsListedMH: e.target.checked })} /> Le bâtiment lui-même est classé ou inscrit monument historique
              </label>
              <label className="flex flex-wrap items-center gap-2">
                Terrain dans un lotissement :
                <Select className="h-9 w-auto" value={answers.inLotissement} onChange={(e) => setAnswers({ ...answers, inLotissement: e.target.value as ProjectAnswers["inLotissement"] })}>
                  <option value="nsp">Je ne sais pas</option>
                  <option value="oui">Oui</option>
                  <option value="non">Non</option>
                </Select>
              </label>
            </fieldset>
          </div>
        </Card>
      )}

      {step === 1 && (
        <Card title="Maître d'ouvrage (le client)">
          <div className="space-y-4">
            {clients.length > 0 && (
              <Field label="Client existant" htmlFor="client">
                <Select id="client" value={clientId} onChange={(e) => setClientId(e.target.value)}>
                  <option value="">Nouveau client</option>
                  {clients.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.lastName} {x.firstName}
                    </option>
                  ))}
                </Select>
              </Field>
            )}
            {!existingClient && (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Civilité" htmlFor="civ">
                  <Select id="civ" value={c.civility} onChange={(e) => setC({ ...c, civility: e.target.value as Client["civility"] })}>
                    <option>Mme</option>
                    <option>M.</option>
                  </Select>
                </Field>
                <Field label="Nom" htmlFor="ln" help="Nom du propriétaire du terrain, tel qu'il figurera au cerfa (cadre 1).">
                  <Input id="ln" value={c.lastName ?? ""} onChange={(e) => setC({ ...c, lastName: e.target.value })} />
                </Field>
                <Field label="Prénom" htmlFor="fn">
                  <Input id="fn" value={c.firstName ?? ""} onChange={(e) => setC({ ...c, firstName: e.target.value })} />
                </Field>
                <Field label="Email" htmlFor="em" example="client@example.org">
                  <Input id="em" type="email" value={c.email ?? ""} onChange={(e) => setC({ ...c, email: e.target.value })} />
                </Field>
                <Field label="Téléphone" htmlFor="ph">
                  <Input id="ph" type="tel" value={c.phone ?? ""} onChange={(e) => setC({ ...c, phone: e.target.value })} />
                </Field>
                <Field label="Date de naissance (facultatif)" htmlFor="bd" help="Demandée au cerfa pour un particulier ; peut être complétée plus tard.">
                  <Input id="bd" type="date" value={c.birthDate ?? ""} onChange={(e) => setC({ ...c, birthDate: e.target.value })} />
                </Field>
              </div>
            )}
            <div className="rounded-lg border border-stone-200 p-3">
              <p className="text-sm font-medium">Mandat de dépôt (signature du client)</p>
              <p className="mb-2 text-xs text-stone-600">Autorise votre entreprise à déposer la DP et à échanger avec la mairie. Le texte complet figure dans le dossier ; empreinte SHA-256 et horodatage enregistrés.</p>
              <SignaturePad onChange={setSig} />
              <label className="mt-2 flex items-start gap-2 text-sm">
                <input type="checkbox" checked={mandateOk} onChange={(e) => setMandateOk(e.target.checked)} data-testid="mandate-consent" /> Le client a lu le mandat et accepte de le signer électroniquement.
              </label>
              <p className="mt-1 text-xs text-stone-500">Vous pouvez aussi faire signer plus tard.</p>
            </div>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card title="Le projet photovoltaïque">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Modèle de panneau" htmlFor="panel" help="Catalogue de votre entreprise (Paramètres > Catalogue). Les dimensions servent au calepinage et aux plans.">
              <Select id="panel" value={panelId} onChange={(e) => setPanelId(e.target.value)}>
                {panels.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.brand} {p.model}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Nombre de panneaux" htmlFor="count" example="12">
              <Input id="count" type="number" inputMode="numeric" min={1} max={200} value={count} onChange={(e) => setCount(Number(e.target.value))} />
            </Field>
            <Field label="Puissance crête (kWc)" htmlFor="power" help="Calculée : nombre × puissance unitaire. Modifiez seulement si votre devis diffère : la même valeur sera reportée partout.">
              <Input id="power" inputMode="decimal" placeholder={String(computed).replace(".", ",")} value={power} onChange={(e) => setPower(e.target.value)} />
            </Field>
            <Field label="Type de pose" htmlFor="mount" help="Surimposition : panneaux posés au-dessus des tuiles. Intégration : les panneaux remplacent la couverture.">
              <Select id="mount" value={mounting} onChange={(e) => setMounting(e.target.value as MountingType)}>
                <option value="surimposition">Surimposition (toiture)</option>
                <option value="integration">Intégration au bâti (toiture)</option>
                <option value="ombriere">Ombrière (V1.5 : analyse seulement)</option>
                <option value="sol">Au sol (V1.5 : analyse seulement)</option>
              </Select>
            </Field>
            <Field label="Onduleur" htmlFor="inv">
              <Select id="inv" value={inverterId} onChange={(e) => setInverterId(e.target.value)}>
                {inverters.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.brand} {p.model}
                  </option>
                ))}
              </Select>
            </Field>
            {panel && (
              <div className="rounded-lg bg-stone-100 p-3 text-sm sm:col-span-2">
                {count} × {panel.powerWc} Wc = <strong>{String(computed).replace(".", ",")} kWc</strong> : surface ≈ {Math.round(((count * panel.widthMm * panel.heightMm) / 1e6) * 10) / 10} m² : {panel.fullBlack ? <Badge tone="ok">full black</Badge> : <Badge tone="alerte">cadre {panel.frameColor}</Badge>}
                <p className="mt-1 text-xs text-stone-600">Le pan de toiture et le placement sont proposés automatiquement à partir du bâtiment (BD TOPO) ; vous les ajusterez dans l&apos;onglet Plans.</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card title="Photos (guidées)">
          <div className="space-y-3">
            {(["facade", "proche", "lointain"] as const).map((k) => (
              <PhotoInput key={k} kind={k} photo={photos[k]} onChange={(ph) => setPhotos((x) => ({ ...x, [k]: ph }))} />
            ))}
            <p className="text-xs text-stone-500">Les photos peuvent être ajoutées plus tard. Elles restent dans votre espace (non publiées).</p>
          </div>
        </Card>
      )}

      <div className="flex justify-between gap-2">
        <Button variant="outline" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
          Retour
        </Button>
        {step < 3 ? (
          <Button disabled={!canNext} onClick={() => setStep((s) => s + 1)}>
            Continuer
          </Button>
        ) : (
          <Button variant="secondary" size="lg" onClick={create} data-testid="create-project">
            Créer le dossier et analyser
          </Button>
        )}
      </div>
      {err && <p className="text-sm text-red-700">{err}</p>}
    </div>
  );
}

export default function Page() {
  return (
    <AppShell title="Nouveau dossier">
      <Wizard />
    </AppShell>
  );
}
