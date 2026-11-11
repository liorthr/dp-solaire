"use client";
import { ExternalLink, Landmark, MapPinned, ShieldAlert, Sparkles } from "lucide-react";
import { useState } from "react";
import { Badge, Button, Card, Disclaimer, severityLabel, severityTone } from "@/components/ui";
import { requiredPieces, ruleset } from "@/lib/rules/engine";
import { availablePieces } from "@/lib/rules/facts";
import { orientationLabel } from "@/lib/geo/roof";
import { STATUS_LABEL } from "@/lib/project/status";
import type { ProjectBundle } from "./useProject";
import { useSaveProject } from "./useProject";

const SUP_LABEL: Record<string, string> = { ac1: "Monument historique (abords)", ac2: "Site inscrit / classé", ac4: "Site patrimonial remarquable", pm1: "Plan de prévention des risques", i4: "Ligne électrique", el7: "Alignement", int1: "Cimetière", t1: "Voie ferrée", pt1: "Télécom", pt2: "Télécom", as1: "Captage d'eau" };

export function SyntheseTab({ b }: { b: ProjectBundle }) {
  const { project: p, analysis } = b;
  const save = useSaveProject();
  const e = p.enrichment;
  const ev = analysis.evaluation;
  const h = e?.heritage;
  const zone = e?.zones[0];
  const pieces = requiredPieces(analysis.facts).filter((x) => x.isRequired);
  const avail = new Set(availablePieces(p));
  const [aiMsg, setAiMsg] = useState("");
  const serverMode = process.env.NEXT_PUBLIC_DEPLOY_TARGET === "server";

  const setOverride = (k: string, v: unknown) => save({ ...p, overrides: { ...p.overrides, [k]: v } }, "correction_manuelle");

  const runAi = async () => {
    setAiMsg("Analyse en cours…");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/api/ai/plu`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ reglementUrl: zone?.reglementUrl, zone: zone?.libelle }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || res.statusText);
      save({ ...p, overrides: { ...p.overrides, aiPlu: j } }, "analyse_ia_plu");
      setAiMsg("");
    } catch (err) {
      setAiMsg(`IA indisponible : ${err instanceof Error ? err.message : err}`);
    }
  };
  const ai = p.overrides?.aiPlu as { constraints?: { text: string; page?: number; quote?: string }[]; model?: string } | undefined;

  return (
    <div className="space-y-4">
      {e?.notices?.map((n) => (
        <p key={n} className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900" data-testid="notice">
          {n}
        </p>
      ))}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2" title="Régime et conformité">
          <div className="space-y-3">
            <div className={`rounded-lg p-3 ${ev.regime.outcome === "DP" ? "bg-emerald-50" : "bg-red-50"}`}>
              <p className="font-semibold">{ev.regime.outcome === "DP" ? "Déclaration préalable" : ev.regime.outcome === "PC" ? "Permis de construire : hors périmètre DP" : ev.regime.outcome === "AUCUNE" ? "Aucune formalité d'urbanisme" : "Hors périmètre V1"}</p>
              <p className="text-sm">{ev.regime.message}</p>
              <a href={ev.regime.source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-brand-700 underline">
                Source : {ev.regime.source_label ?? ev.regime.source_url} <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <p className="text-xs text-stone-500">Probabilité de passage (indicative)</p>
                <p className="text-3xl font-bold" data-testid="score">{ev.blocking.length ? "–" : `${ev.score}/100`}</p>
              </div>
              <div className="text-sm">
                <p>
                  <Badge tone="bloquant">{ev.blocking.length} bloquant(s)</Badge> <Badge tone="alerte">{ev.warnings.length} alerte(s)</Badge>
                </p>
                <p className="mt-1 text-xs text-stone-500">
                  Statut : {STATUS_LABEL[analysis.status]} : règles v{ruleset.version}
                </p>
              </div>
            </div>
            {ev.scoreFactors.length > 0 && (
              <details className="text-sm">
                <summary className="cursor-pointer font-medium">Facteurs du score</summary>
                <ul className="mt-1 space-y-0.5">
                  {ev.scoreFactors.map((f) => (
                    <li key={f.label} className="flex justify-between">
                      <span>{f.label}</span>
                      <span className="font-mono">{f.impact}</span>
                    </li>
                  ))}
                </ul>
              </details>
            )}
            <ul className="divide-y" data-testid="rules">
              {ev.results
                .filter((r) => r.severity !== "ok")
                .sort((a, b) => ["bloquant", "alerte", "info"].indexOf(a.severity) - ["bloquant", "alerte", "info"].indexOf(b.severity))
                .map((r) => (
                  <li key={r.code} className="py-2.5">
                    <div className="flex items-start gap-2">
                      <Badge tone={severityTone(r.severity)}>{severityLabel(r.severity)}</Badge>
                      <div className="min-w-0 text-sm">
                        <p className="font-medium">{r.title}</p>
                        <p className="text-stone-700">{r.message}</p>
                        {r.suggestion && <p className="mt-0.5 text-stone-600">→ {r.suggestion}</p>}
                        <a href={r.source_url} target="_blank" rel="noreferrer" className="mt-0.5 inline-flex items-center gap-1 text-xs text-brand-700 underline">
                          {r.source_label ?? "Source"} <ExternalLink className="h-3 w-3" />
                        </a>{" "}
                        {r.verification === "A_VERIFIER" && <Badge tone="neutral">À_VÉRIFIER</Badge>}
                      </div>
                    </div>
                  </li>
                ))}
              <li className="py-2 text-xs text-stone-500">{ev.results.filter((r) => r.severity === "ok").length} contrôles conformes : {ev.results.filter((r) => r.severity === "ok").map((r) => r.title).join(" · ")}</li>
            </ul>
          </div>
        </Card>
        <Card title="Pièces requises">
          <ul className="space-y-1.5 text-sm">
            {pieces.map((pc) => (
              <li key={pc.code} className="flex items-start gap-2">
                <span className={avail.has(pc.code) ? "text-emerald-700" : "text-red-700"}>{avail.has(pc.code) ? "✔" : "✘"}</span>
                <span>
                  <strong>{pc.code}</strong> {pc.label}
                  <span className="block text-xs text-stone-500">{pc.why}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-stone-500">
            Délai d&apos;instruction attendu : <strong>{analysis.months.months} mois</strong> ({analysis.months.items.map((i) => i.label).join(" ; ")})
          </p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title={<span className="flex items-center gap-2"><Landmark className="h-4 w-4" /> Patrimoine et ABF</span>}>
          {h ? (
            <div className="space-y-2 text-sm">
              <p>
                Consultation de l&apos;ABF : <Badge tone={h.abfConsultation === "oui" ? "alerte" : h.abfConsultation === "probable" ? "alerte" : "ok"}>{h.abfConsultation.toUpperCase()}</Badge> : confiance <Badge>{h.confidence}</Badge>
              </p>
              <ul className="list-inside list-disc space-y-1 text-stone-700">
                {h.explanation.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
              {h.monuments.length > 0 && (
                <p className="text-xs text-stone-600">
                  Monuments proches : {h.monuments.map((m) => `${m.name} (${m.distanceM} m)`).join(" ; ")}
                </p>
              )}
              {h.divergences.map((d) => (
                <p key={d} className="rounded bg-amber-50 p-2 text-amber-900">
                  <ShieldAlert className="mr-1 inline h-4 w-4" /> Divergence : {d}
                </p>
              ))}
              <div className="flex flex-wrap items-center gap-2 border-t pt-2 text-xs">
                Correction manuelle (prioritaire) :
                <Button size="sm" variant={p.overrides["heritage.protected"] === true ? "primary" : "outline"} onClick={() => setOverride("heritage.protected", true)}>
                  Secteur protégé
                </Button>
                <Button size="sm" variant={p.overrides["heritage.protected"] === false ? "primary" : "outline"} onClick={() => setOverride("heritage.protected", false)}>
                  Non protégé
                </Button>
                {typeof p.overrides["heritage.protected"] === "boolean" && (
                  <Button size="sm" variant="ghost" onClick={() => setOverride("heritage.protected", undefined)}>
                    Revenir aux sources
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-stone-500">Analyse non disponible.</p>
          )}
        </Card>
        <Card title={<span className="flex items-center gap-2"><MapPinned className="h-4 w-4" /> Urbanisme</span>}>
          <div className="space-y-2 text-sm">
            {zone ? (
              <p>
                {zone.docType} <strong>{zone.docName}</strong> : zone <strong>{zone.libelle}</strong> {zone.libelong && `(${zone.libelong})`}
                {zone.reglementUrl && (
                  <a href={zone.reglementUrl} target="_blank" rel="noreferrer" className="ml-1 inline-flex items-center gap-1 text-brand-700 underline">
                    règlement <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </p>
            ) : (
              <p>{e?.rnu ? "Commune au règlement national d'urbanisme (RNU)." : "Aucun zonage trouvé sur le Géoportail de l'Urbanisme."}</p>
            )}
            {e?.servitudes.length ? (
              <ul className="space-y-1">
                {e.servitudes.slice(0, 8).map((s) => (
                  <li key={s.name + s.suptype}>
                    <Badge tone={["ac1", "ac2", "ac4"].includes(s.suptype) ? "alerte" : "neutral"}>{s.suptype.toUpperCase()}</Badge> {SUP_LABEL[s.suptype] ?? ""} : {s.name}
                    {s.actUrl && (
                      <a href={s.actUrl} target="_blank" rel="noreferrer" className="ml-1 text-xs text-brand-700 underline">
                        acte
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-stone-500">Aucune servitude d&apos;utilité publique publiée sur ce point.</p>
            )}
            {e?.risks.length ? <p className="text-xs text-stone-600">Risques connus sur la commune (Géorisques, informatif) : {e.risks.map((r) => r.label).join(", ")}.</p> : null}
            <div className="rounded-lg border border-violet-200 bg-violet-50 p-2">
              <p className="flex items-center gap-1 font-medium text-violet-900">
                <Sparkles className="h-4 w-4" /> Lecture du règlement par IA <Badge tone="ia">IA : à valider</Badge>
              </p>
              {ai?.constraints ? (
                <ul className="mt-1 list-inside list-disc text-xs">
                  {ai.constraints.map((c) => (
                    <li key={c.text}>
                      {c.text} {c.page && `(p. ${c.page})`} {c.quote && <q className="italic">{c.quote}</q>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-violet-900">
                  {serverMode ? "Extrait les règles du PLU relatives aux panneaux solaires, avec citations." : "Disponible avec le déploiement serveur et une clé ANTHROPIC_API_KEY (mode statique : lisez le règlement via le lien ci-dessus)."}
                </p>
              )}
              <Button size="sm" variant="outline" className="mt-1" disabled={!serverMode || !zone?.reglementUrl} onClick={runAi}>
                Analyser le règlement
              </Button>
              {aiMsg && <p className="text-xs">{aiMsg}</p>}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Terrain et bâtiment">
          <ul className="space-y-1 text-sm">
            <li>Adresse : {p.address?.label}</li>
            <li>Parcelle(s) : {e?.parcels.map((x) => `${x.section} ${x.numero} (${x.contenanceM2} m²)`).join(", ") || "non trouvée"}</li>
            {(() => {
              const bld = e?.buildings.find((x) => x.id === e.mainBuildingId);
              return bld ? <li>Bâtiment : emprise {bld.areaM2} m², hauteur {bld.heightM ?? "?"} m (BD TOPO)</li> : <li>Bâtiment : non identifié</li>;
            })()}
            <li>Pans : {p.pv.roofPlanes.map((r) => `${r.label} (${orientationLabel(r.azimuthDeg)}, ${r.tiltDeg}°, ${r.widthM} × ${r.slopeLengthM} m)`).join(" ; ")}</li>
            {e?.solar && <li>Productible estimé : {e.solar.annualKwh} kWh/an ({e.solar.method === "pvgis" ? "PVGIS" : "estimation"})</li>}
          </ul>
        </Card>
        <Card title="Sources interrogées">
          <ul className="space-y-1 text-sm">
            {Object.entries(e?.sources ?? {}).map(([k, s]) => (
              <li key={k} className="flex items-start gap-2">
                <Badge tone={s.status === "ok" ? "ok" : s.status === "degraded" ? "alerte" : "bloquant"}>{s.status === "ok" ? "OK" : s.status === "degraded" ? "dégradé" : "erreur"}</Badge>
                <span>
                  {k} {s.fromFixture && <span className="text-xs text-stone-500">(données enregistrées le 11/11/2026)</span>}
                  {s.message && <span className="block text-xs text-stone-600">{s.message}</span>}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-stone-500">Règle de priorité : saisie manuelle &gt; source réglementaire officielle (GPU) &gt; référentiel IGN &gt; calcul dérivé.</p>
        </Card>
      </div>
      <Disclaimer />
    </div>
  );
}
