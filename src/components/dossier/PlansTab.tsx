"use client";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import type { Project, PvLayout, RoofPlane } from "@/lib/types";
import { Badge, Button, Card, Field, Input, Select } from "@/components/ui";
import { estimateRoof, orientationLabel } from "@/lib/geo/roof";
import { layoutCapacity } from "@/lib/geo/calepinage";
import { relayout } from "@/lib/project/factory";
import { runEnrichment } from "@/lib/enrichment/run";
import { dp2, dp4, type PlanContext } from "@/lib/plans/dp";
import { parcelRefs } from "@/lib/dossier/texts";
import { fr } from "@/lib/instruction/deadlines";
import type { ProjectBundle } from "./useProject";
import { useSaveProject } from "./useProject";

const MapView = dynamic(() => import("./MapView").then((m) => m.MapView), { ssr: false, loading: () => <div className="h-80 animate-pulse rounded-lg bg-stone-200" /> });

export function PlansTab({ b }: { b: ProjectBundle }) {
  const { project: p, panel, client, tenant } = b;
  const save = useSaveProject();
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<"dp2" | "dp4">("dp2");
  const site = useMemo(() => (p.overrides?.site as { lon: number; lat: number }) ?? { lon: p.address!.lon, lat: p.address!.lat }, [p.overrides?.site, p.address]);

  const pickBuilding = (id: string) => {
    const bld = p.enrichment?.buildings.find((x) => x.id === id);
    if (!bld || !panel) return;
    const est = estimateRoof(bld);
    let next: Project = { ...p, enrichment: { ...p.enrichment!, mainBuildingId: id }, pv: { ...p.pv, roofPlanes: est.planes, layouts: [] as PvLayout[] } };
    next = relayout(next, panel, [est.planes[0].id]);
    save(next, "choix_batiment");
  };
  const reanalyze = async (lon: number, lat: number) => {
    if (!window.confirm("Relancer l'analyse (cadastre, PLU, bâti…) sur le point cliqué ?")) return;
    setBusy(true);
    try {
      const e = await runEnrichment(p.address!, { lon, lat });
      const bld = e.buildings.find((x) => x.id === e.mainBuildingId);
      let next: Project = { ...p, enrichment: e, overrides: { ...p.overrides, site: { lon, lat } } };
      if (bld && panel) {
        const est = estimateRoof(bld);
        next = relayout({ ...next, pv: { ...next.pv, roofPlanes: est.planes, layouts: [] } }, panel, [est.planes[0].id]);
      }
      save(next, "relance_enrichissement");
    } finally {
      setBusy(false);
    }
  };

  const updatePlane = (id: string, patch: Partial<RoofPlane>) => {
    const planes = p.pv.roofPlanes.map((r) => (r.id === id ? { ...r, ...patch } : r));
    let next = { ...p, pv: { ...p.pv, roofPlanes: planes } };
    if (panel) next = relayout(next, panel);
    save(next, "edition_pan");
  };
  const toggleEquipped = (id: string, on: boolean) => {
    if (!panel) return;
    const ids = on ? [...p.pv.layouts.map((l) => l.roofPlaneId), id] : p.pv.layouts.map((l) => l.roofPlaneId).filter((x) => x !== id);
    save(relayout({ ...p, pv: { ...p.pv, layouts: p.pv.layouts.filter((l) => ids.includes(l.roofPlaneId)) } }, panel, ids), "edition_calepinage");
  };
  const setLayoutOpt = (id: string, patch: Partial<PvLayout>) => {
    if (!panel) return;
    const layouts = p.pv.layouts.map((l) => (l.roofPlaneId === id ? { ...l, ...patch } : l));
    save(relayout({ ...p, pv: { ...p.pv, layouts } }, panel, layouts.map((l) => l.roofPlaneId), {}), "edition_calepinage");
  };

  const ctx: PlanContext = useMemo(
    () => ({ project: p, panel, site, cartouche: { reference: p.reference, address: p.address?.label ?? "", parcels: parcelRefs(p.enrichment), date: fr(new Date().toISOString().slice(0, 10)), company: tenant.name, client: client ? `${client.firstName} ${client.lastName}` : "" } }),
    [p, panel, site, tenant.name, client],
  );
  const svg = useMemo(() => (preview === "dp2" ? dp2(ctx) : dp4(ctx)[0]), [ctx, preview]);
  const placed = p.pv.layouts.reduce((s, l) => s + l.panels.length, 0);

  return (
    <div className="space-y-4">
      <Card title="Carte : parcelle, bâtiment, panneaux" actions={busy ? <Badge>analyse…</Badge> : null}>
        <MapView project={p} onPickBuilding={pickBuilding} onPickPoint={reanalyze} />
        <p className="mt-2 text-xs text-stone-500">Cliquez sur un bâtiment pour le désigner comme bâtiment du projet ; cliquez ailleurs pour relancer l&apos;analyse sur ce point. Fonds © IGN.</p>
      </Card>
      <Card title={`Pans de toiture et calepinage : ${placed}/${p.pv.panelCount} panneaux placés`}>
        {placed !== p.pv.panelCount && <p className="mb-2 rounded bg-amber-50 p-2 text-sm text-amber-900">Tous les panneaux ne tiennent pas : équipez un autre pan, changez l&apos;orientation ou réduisez les marges.</p>}
        <div className="space-y-3">
          {p.pv.roofPlanes.map((rp) => {
            const l = p.pv.layouts.find((x) => x.roofPlaneId === rp.id);
            const cap = panel ? layoutCapacity(rp, panel, l).count : 0;
            return (
              <div key={rp.id} className="rounded-lg border border-stone-200 p-3">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <label className="flex items-center gap-2 font-medium">
                    <input type="checkbox" checked={Boolean(l)} onChange={(e) => toggleEquipped(rp.id, e.target.checked)} /> {rp.label} : {orientationLabel(rp.azimuthDeg)}
                  </label>
                  <span className="text-xs text-stone-500">
                    Capacité {cap} panneaux {l && `: ${l.panels.length} placés`}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  <Field label="Pente (°)">
                    <Input type="number" value={rp.tiltDeg} onChange={(e) => updatePlane(rp.id, { tiltDeg: Number(e.target.value) })} />
                  </Field>
                  <Field label="Azimut (°)" help="Orientation de la ligne de plus grande pente : 180 = plein sud, 90 = est, 270 = ouest.">
                    <Input type="number" value={rp.azimuthDeg} onChange={(e) => updatePlane(rp.id, { azimuthDeg: Number(e.target.value), label: `Pan ${orientationLabel(Number(e.target.value))}` })} />
                  </Field>
                  <Field label="Longueur égout (m)">
                    <Input type="number" step="0.1" value={rp.widthM} onChange={(e) => updatePlane(rp.id, { widthM: Number(e.target.value) })} />
                  </Field>
                  <Field label="Rampant (m)">
                    <Input type="number" step="0.1" value={rp.slopeLengthM} onChange={(e) => updatePlane(rp.id, { slopeLengthM: Number(e.target.value) })} />
                  </Field>
                  <Field label="Couverture">
                    <Select value={rp.covering} onChange={(e) => updatePlane(rp.id, { covering: e.target.value as RoofPlane["covering"] })}>
                      <option value="tuile_terre_cuite">Tuile terre cuite</option>
                      <option value="ardoise">Ardoise</option>
                      <option value="tuile_beton">Tuile béton</option>
                      <option value="bac_acier">Bac acier</option>
                      <option value="autre">Autre</option>
                    </Select>
                  </Field>
                </div>
                {l && (
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <Field label="Orientation des modules">
                      <Select value={l.orientation} onChange={(e) => setLayoutOpt(rp.id, { orientation: e.target.value as PvLayout["orientation"] })}>
                        <option value="portrait">Portrait</option>
                        <option value="paysage">Paysage</option>
                      </Select>
                    </Field>
                    <Field label="Marge rives (m)" help="Distance minimale entre les panneaux et les bords du pan (règle interne prudente, modifiable).">
                      <Input type="number" step="0.05" value={l.marginEdgeM} onChange={(e) => setLayoutOpt(rp.id, { marginEdgeM: Number(e.target.value) })} />
                    </Field>
                    <Field label="Marge égout (m)">
                      <Input type="number" step="0.05" value={l.marginGutterM} onChange={(e) => setLayoutOpt(rp.id, { marginGutterM: Number(e.target.value) })} />
                    </Field>
                    <Field label="Marge faîtage (m)">
                      <Input type="number" step="0.05" value={l.marginRidgeM} onChange={(e) => setLayoutOpt(rp.id, { marginRidgeM: Number(e.target.value) })} />
                    </Field>
                  </div>
                )}
              </div>
            );
          })}
          <Button variant="outline" onClick={() => panel && save(relayout(p, panel), "recalcul_calepinage")}>
            <RefreshCw className="h-4 w-4" /> Recalculer le placement automatique
          </Button>
        </div>
      </Card>
      <Card
        title="Aperçu des plans"
        actions={
          <div className="flex gap-1">
            <Button size="sm" variant={preview === "dp2" ? "primary" : "outline"} onClick={() => setPreview("dp2")}>DP2</Button>
            <Button size="sm" variant={preview === "dp4" ? "primary" : "outline"} onClick={() => setPreview("dp4")}>DP4</Button>
          </div>
        }
      >
        {/* SVG généré par l'application (textes échappés) */}
        <div className="overflow-hidden rounded border border-stone-200 [&>svg]:h-auto [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: svg }} />
      </Card>
    </div>
  );
}
