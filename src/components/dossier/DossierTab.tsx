"use client";
import { useEffect, useState } from "react";
import { Download, FileArchive, FileText, Loader2, Lock } from "lucide-react";
import { isPaid, OPTION_PRICES, offersRacOption, payDossier, paymentRequired, PRICE_LABELS, PRICES, priceKindOf } from "@/lib/cloud/payments";
import { Badge, Button, Card, Disclaimer, Progress } from "@/components/ui";
import { SignaturePad } from "@/components/SignaturePad";
import { buildDossier, type BuildResult } from "@/lib/dossier/build";
import { simpleSignatureProvider } from "@/lib/providers/signature";
import { projectDescription } from "@/lib/dossier/texts";
import type { ProjectBundle } from "./useProject";
import { useSaveProject } from "./useProject";
import { CerfaCompletion } from "./CerfaCompletion";
import { cerfaGaps } from "@/lib/dossier/cerfa";

/** dernier dossier généré, par projet (session courante) */
export const builtCache = new Map<string, { at: string; result: BuildResult }>();

export function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function DossierTab({ b }: { b: ProjectBundle }) {
  const { project: p, client, tenant, panel, inverter, analysis } = b;
  const save = useSaveProject();
  const [state, setState] = useState<{ label: string; pct: number } | null>(null);
  const [res, setRes] = useState<BuildResult | null>(builtCache.get(p.id)?.result ?? null);
  const [err, setErr] = useState("");
  const [sig, setSig] = useState<string | null>(null);
  const ev = analysis.evaluation;
  const kind = priceKindOf(p, ev.regime.outcome);
  const mustPay = paymentRequired();
  const cerfaMissing = cerfaGaps(p, client).filter((g) => g.required);
  // on ne fait pas payer un dossier qui ne peut pas être déposé en l'état
  const readyToPay = ev.blocking.length === 0 && cerfaMissing.length === 0;
  const [paid, setPaid] = useState<boolean | null>(mustPay ? null : true);
  useEffect(() => {
    if (!mustPay) return;
    isPaid(p.id)
      .then(setPaid)
      .catch(() => setPaid(false));
  }, [mustPay, p.id]);

  const generate = async () => {
    setErr("");
    setState({ label: "Préparation", pct: 2 });
    try {
      const r = await buildDossier({ project: p, client, tenant, panel, inverter, onProgress: (label, pct) => setState({ label, pct }) });
      builtCache.set(p.id, { at: p.updatedAt, result: r });
      setRes(r);
      save({ ...p, generatedAt: new Date().toISOString() }, "generation_dossier");
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setState(null);
    }
  };

  const signDeclaration = async () => {
    if (!sig || !client) return;
    const rec = await simpleSignatureProvider.sign({ signerName: `${client.firstName} ${client.lastName}`, document: `Cerfa ${ev.regime.outcome === "PC" ? "13406*17" : "16702*03"} : ${p.reference} : ${projectDescription(p, panel)}`, imageDataUrl: sig });
    save({ ...p, declarationSignature: rec }, "signature_declaration");
  };

  if (!ev.canGenerate)
    return (
      <Card title={ev.regime.outcome === "PC" ? "Permis de construire nécessaire (hors périmètre pour ces travaux)" : "Aucun dossier DP ne sera généré"}>
        <p className="text-sm">{ev.regime.message}</p>
        <a className="text-sm text-brand-700 underline" href={ev.regime.source_url} target="_blank" rel="noreferrer">Source</a>
      </Card>
    );

  return (
    <div className="space-y-4">
      <Card title="Générer le dossier complet">
        <div className="space-y-3">
          {ev.blocking.length > 0 ? (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-900">
              <p className="font-medium">{ev.blocking.length} point(s) bloquant(s) : le dossier peut être généré en brouillon mais ne doit pas être déposé en l&apos;état.</p>
              <ul className="mt-1 list-inside list-disc">{ev.blocking.map((x) => <li key={x.code}>{x.message}</li>)}</ul>
            </div>
          ) : (
            <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900">Aucun point bloquant : le dossier est prêt à être généré et déposé.</p>
          )}
          <CerfaCompletion b={b} self={Boolean(p.selfFiling)} />
          {paid === false && !readyToPay ? (
            <div className="rounded-3xl border-2 border-line bg-white p-5" data-testid="paywall">
              <p className="flex items-center gap-2 text-lg font-extrabold">
                <Lock className="h-5 w-5" /> Encore {ev.blocking.length + cerfaMissing.length} point(s) à régler avant le téléchargement
              </p>
              <p className="mt-1 text-sm">
                Corrigez {ev.blocking.length && cerfaMissing.length ? "les points en rouge et complétez le cerfa ci-dessus" : ev.blocking.length ? "les points en rouge ci-dessus (souvent les photos ou le photomontage)" : "le cerfa ci-dessus"} : vous paierez ensuite <b>{PRICES[kind]} €</b> TTC une seule fois, pour un dossier complet et prêt à déposer.
              </p>
            </div>
          ) : paid === false ? (
            <div className="rounded-3xl border-2 border-brand-600 bg-mint p-5" data-testid="paywall">
              <p className="flex items-center gap-2 text-lg font-extrabold">
                <Lock className="h-5 w-5" /> Votre dossier est prêt à être téléchargé
              </p>
              <p className="mt-1 text-sm">
                {PRICE_LABELS[kind]} : <b className="text-2xl">{PRICES[kind]} €</b> TTC, paiement unique pour ce dossier.
              </p>
              <ul className="mt-3 space-y-1 text-sm">
                <li>✓ Plans à l&apos;échelle, photomontage et notice</li>
                <li>✓ Cerfa officiel rempli, bordereau des pièces</li>
                <li>✓ Courrier ou email prêt pour votre mairie</li>
                <li>✓ Suivi des délais jusqu&apos;à la décision</li>
              </ul>
              <Button size="lg" className="mt-4 w-full sm:w-auto" onClick={() => payDossier(p, kind).catch((e) => setErr(e instanceof Error ? e.message : String(e)))} data-testid="pay">
                Payer {PRICES[kind]} € et télécharger
              </Button>
              {offersRacOption(p, kind) && (
                <p className="mt-3 rounded-xl bg-white p-3 text-sm" data-testid="rac-upsell">
                  ⚡ Sur la page de paiement, vous pourrez ajouter le <b>pack raccordement Enedis + Consuel</b> (+{OPTION_PRICES.RAC} €) : schéma unifilaire, dossier Consuel pré-rempli et récapitulatif de la demande Enedis.
                </p>
              )}
              <p className="mt-2 text-xs text-muted">Carte bancaire, Apple Pay ou Google Pay : paiement sécurisé par Stripe. Les aperçus des plans restent gratuits dans l&apos;onglet Plans.</p>
            </div>
          ) : paid === null ? (
            <p className="text-sm text-muted">Vérification du paiement…</p>
          ) : (
          <Button size="lg" variant="secondary" onClick={generate} disabled={Boolean(state)} data-testid="generate">
            {state ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileText className="h-5 w-5" />} {readyToPay ? "Générer le dossier (PDF + ZIP)" : "Générer un brouillon (PDF + ZIP)"}
          </Button>
          )}
          {state && (
            <div aria-live="polite">
              <Progress value={state.pct} label="Génération" />
              <p className="mt-1 text-xs text-stone-600">{state.label}…</p>
            </div>
          )}
          {err && <p className="text-sm text-red-700">{err}</p>}
        </div>
      </Card>

      {res && (
        <Card title="Dossier généré" actions={<Badge tone="ok">{(res.durationMs / 1000).toFixed(1)} s</Badge>}>
          <div className="flex flex-wrap gap-2" data-testid="downloads">
            <Button onClick={() => download(res.pdf, `Dossier_${ev.regime.outcome === "PC" ? "PC" : "DP"}_${p.reference}.pdf`)} data-testid="download-pdf">
              <Download className="h-4 w-4" /> PDF unique ({Math.round(res.pdf.size / 1024)} Ko)
            </Button>
            <Button variant="outline" onClick={() => download(res.zip, `Dossier_${ev.regime.outcome === "PC" ? "PC" : "DP"}_${p.reference}.zip`)} data-testid="download-zip">
              <FileArchive className="h-4 w-4" /> ZIP des pièces ({Math.round(res.zip.size / 1024)} Ko)
            </Button>
          </div>
          <ul className="mt-3 divide-y text-sm">
            {res.files.map((f) => (
              <li key={f.name} className="flex items-center justify-between gap-2 py-1.5">
                <span>
                  <strong>{f.code}</strong> : {f.label}
                </span>
                <button className="shrink-0 text-xs text-brand-700 underline" onClick={() => download(new Blob([f.bytes as BlobPart], { type: "application/pdf" }), f.name)}>
                  {f.name}
                </button>
              </li>
            ))}
          </ul>
          {res.warnings.length > 0 && (
            <ul className="mt-2 space-y-1 text-xs text-amber-900">
              {res.warnings.map((w) => <li key={w}>⚠ {w}</li>)}
            </ul>
          )}
        </Card>
      )}

      <Card title="Signature de la déclaration (cadre 7 du cerfa)">
        {p.declarationSignature ? (
          <p className="text-sm">
            Signée par {p.declarationSignature.signerName} le {new Date(p.declarationSignature.signedAt).toLocaleString("fr-FR")} : empreinte {p.declarationSignature.documentSha256.slice(0, 16)}… <Badge tone="ok">signée</Badge>
          </p>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-stone-600">Le déclarant ({client ? `${client.firstName} ${client.lastName}` : "client"}) atteste l&apos;exactitude des renseignements. Sans signature électronique, le cerfa est à signer à la main.</p>
            <SignaturePad onChange={setSig} />
            <Button variant="outline" disabled={!sig || !client} onClick={signDeclaration}>
              Je confirme la signature du déclarant
            </Button>
          </div>
        )}
      </Card>
      <Disclaimer />
    </div>
  );
}
