"use client";
import { useState } from "react";
import { Download, FileArchive, FileText, Loader2 } from "lucide-react";
import { Badge, Button, Card, Disclaimer, Progress } from "@/components/ui";
import { SignaturePad } from "@/components/SignaturePad";
import { buildDossier, type BuildResult } from "@/lib/dossier/build";
import { simpleSignatureProvider } from "@/lib/providers/signature";
import { projectDescription } from "@/lib/dossier/texts";
import type { ProjectBundle } from "./useProject";
import { useSaveProject } from "./useProject";

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
    const rec = await simpleSignatureProvider.sign({ signerName: `${client.firstName} ${client.lastName}`, document: `Cerfa 16702*03 : ${p.reference} : ${projectDescription(p, panel)}`, imageDataUrl: sig });
    save({ ...p, declarationSignature: rec }, "signature_declaration");
  };

  if (ev.regime.outcome !== "DP")
    return (
      <Card title="Aucun dossier DP ne sera généré">
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
          <Button size="lg" variant="secondary" onClick={generate} disabled={Boolean(state)} data-testid="generate">
            {state ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileText className="h-5 w-5" />} {ev.blocking.length ? "Générer un brouillon (PDF + ZIP)" : "Générer le dossier (PDF + ZIP)"}
          </Button>
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
            <Button onClick={() => download(res.pdf, `Dossier_DP_${p.reference}.pdf`)} data-testid="download-pdf">
              <Download className="h-4 w-4" /> PDF unique ({Math.round(res.pdf.size / 1024)} Ko)
            </Button>
            <Button variant="outline" onClick={() => download(res.zip, `Dossier_DP_${p.reference}.zip`)} data-testid="download-zip">
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
