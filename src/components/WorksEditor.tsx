"use client";
// Saisie des caractéristiques PAC / ITE (assistant de création et onglet Plans).
import type { IteInfo, PacInfo, WorksType } from "@/lib/types";
import { Field, Input, Select, cn } from "@/components/ui";
import { defaultPacUnits, ITE_COLORS, ITE_FINISHES, WORKS } from "@/data/works";
import type { Facade } from "@/lib/geo/facades";

export function WorksPicker({ value, onChange }: { value: WorksType; onChange: (w: WorksType) => void }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium">Type de travaux</legend>
      <div className="grid gap-2 sm:grid-cols-3" role="radiogroup">
        {WORKS.map((w) => (
          <label key={w.id} className={cn("flex cursor-pointer flex-col rounded-xl border p-3 text-sm transition", value === w.id ? "border-brand-600 bg-brand-50 ring-2 ring-brand-600" : "border-stone-200 hover:border-stone-400")}>
            <span className="flex items-center gap-2 font-semibold">
              <input type="radio" name="works" value={w.id} checked={value === w.id} onChange={() => onChange(w.id)} data-testid={`works-${w.id}`} />
              <span aria-hidden>{w.emoji}</span> {w.label}
            </span>
            <span className="mt-1 text-xs text-stone-600">{w.desc}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

const PLACEMENTS: { id: PacInfo["placement"]; label: string }[] = [
  { id: "facade", label: "Fixée en façade (consoles murales)" },
  { id: "sol_dalle", label: "Au sol sur dalle béton" },
  { id: "sol_sans_dalle", label: "Au sol sur plots (sans dalle)" },
  { id: "toiture", label: "En toiture" },
];

function FacadeSelect({ facades, value, onChange, id }: { facades: Facade[]; value: number; onChange: (i: number) => void; id: string }) {
  return (
    <Select id={id} value={value} onChange={(e) => onChange(Number(e.target.value))}>
      {facades.map((f) => (
        <option key={f.index} value={f.index}>
          {f.label} ({String(Math.round(f.lengthM * 10) / 10).replace(".", ",")} m)
        </option>
      ))}
    </Select>
  );
}

export function PacEditor({ value, onChange, facades }: { value: PacInfo; onChange: (v: PacInfo) => void; facades?: Facade[] }) {
  const u = defaultPacUnits.find((x) => x.id === value.unitId) ?? defaultPacUnits[0];
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Unité extérieure" htmlFor="pac-unit" help="Catalogue de départ générique : dimensions et puissance acoustique d'après la fiche fabricant (à remplacer par vos modèles).">
        <Select id="pac-unit" value={value.unitId} onChange={(e) => onChange({ ...value, unitId: e.target.value })}>
          {defaultPacUnits.map((x) => (
            <option key={x.id} value={x.id}>
              {x.model}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Emplacement" htmlFor="pac-place" help="Au sol sans dalle et hors secteur protégé : en principe aucune formalité (le dossier l'indiquera).">
        <Select id="pac-place" value={value.placement} onChange={(e) => onChange({ ...value, placement: e.target.value as PacInfo["placement"] })}>
          {PLACEMENTS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </Select>
      </Field>
      {facades && facades.length > 0 && (
        <>
          <Field label="Façade" htmlFor="pac-facade" help="Façades du bâtiment détectées (IGN BD TOPO). Évitez la façade côté voisin le plus proche (bruit).">
            <FacadeSelect id="pac-facade" facades={facades} value={value.facadeIndex} onChange={(i) => onChange({ ...value, facadeIndex: i })} />
          </Field>
          <Field label={`Position le long de la façade : ${Math.round(value.positionRatio * 100)} %`} htmlFor="pac-pos">
            <input id="pac-pos" type="range" min={5} max={95} value={Math.round(value.positionRatio * 100)} onChange={(e) => onChange({ ...value, positionRatio: Number(e.target.value) / 100 })} className="w-full" />
          </Field>
        </>
      )}
      {value.placement === "facade" && (
        <Field label="Hauteur de pose (m)" htmlFor="pac-h">
          <Input id="pac-h" type="number" step="0.1" min={0} max={6} value={value.mountHeightM} onChange={(e) => onChange({ ...value, mountHeightM: Number(e.target.value) })} />
        </Field>
      )}
      <label className="flex items-center gap-2 self-end text-sm">
        <input type="checkbox" checked={value.cover} onChange={(e) => onChange({ ...value, cover: e.target.checked })} /> Habillage décoratif (cache-PAC)
      </label>
      <p className="rounded-lg bg-stone-100 p-2 text-xs text-stone-700 sm:col-span-2">
        {u.widthMm} × {u.heightMm} × {u.depthMm} mm, {u.soundPowerDb} dB(A) (puissance acoustique). Le bruit est un point d&apos;attention fréquent : la distance au voisin est calculée automatiquement.
      </p>
    </div>
  );
}

export function IteEditor({ value, onChange, facades }: { value: IteInfo; onChange: (v: IteInfo) => void; facades?: Facade[] }) {
  const toggle = (i: number) => onChange({ ...value, facadeIndexes: value.facadeIndexes.includes(i) ? value.facadeIndexes.filter((x) => x !== i) : [...value.facadeIndexes, i].sort() });
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {facades && facades.length > 0 && (
        <fieldset className="sm:col-span-2">
          <legend className="mb-1 text-sm font-medium">Façades isolées</legend>
          <div className="flex flex-wrap gap-2">
            {facades.map((f) => (
              <label key={f.index} className={cn("flex items-center gap-2 rounded-lg border px-3 py-2 text-sm", value.facadeIndexes.includes(f.index) ? "border-orange-500 bg-orange-50" : "border-stone-200")}>
                <input type="checkbox" checked={value.facadeIndexes.includes(f.index)} onChange={() => toggle(f.index)} /> {f.label} ({String(Math.round(f.lengthM * 10) / 10).replace(".", ",")} m)
              </label>
            ))}
          </div>
        </fieldset>
      )}
      <Field label="Épaisseur totale ajoutée (cm)" htmlFor="ite-th" help="Isolant + finition. Sert aux plans et au calcul de la distance aux limites." example="14">
        <Input id="ite-th" type="number" min={4} max={40} value={value.thicknessCm} onChange={(e) => onChange({ ...value, thicknessCm: Number(e.target.value) })} />
      </Field>
      <Field label="Finition" htmlFor="ite-fin">
        <Select id="ite-fin" value={value.finish} onChange={(e) => onChange({ ...value, finish: e.target.value as IteInfo["finish"] })}>
          {Object.entries(ITE_FINISHES).map(([k, l]) => (
            <option key={k} value={k}>
              {l}
            </option>
          ))}
        </Select>
      </Field>
      <fieldset className="sm:col-span-2">
        <legend className="mb-1 text-sm font-medium">Teinte (rendu indicatif)</legend>
        <div className="flex flex-wrap gap-2">
          {ITE_COLORS.map((c) => (
            <button key={c.hex} type="button" onClick={() => onChange({ ...value, colorName: c.name, colorHex: c.hex })} aria-pressed={value.colorHex === c.hex} className={cn("flex items-center gap-2 rounded-lg border px-2 py-1 text-xs", value.colorHex === c.hex ? "border-stone-900 ring-2 ring-stone-900" : "border-stone-200")}>
              <span className="h-5 w-5 rounded border border-stone-300" style={{ background: c.hex }} /> {c.name}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="space-y-1 text-sm sm:col-span-2">
        <label className="flex items-start gap-2">
          <input type="checkbox" checked={value.overhangPublic} onChange={(e) => onChange({ ...value, overhangPublic: e.target.checked })} /> Une façade isolée donne directement sur le trottoir (surplomb du domaine public)
        </label>
        <label className="flex items-start gap-2">
          <input type="checkbox" checked={value.overhangNeighbor} onChange={(e) => onChange({ ...value, overhangNeighbor: e.target.checked })} /> Un mur est en limite de propriété (l&apos;isolant déborde chez le voisin)
        </label>
        <label className="flex items-start gap-2">
          <input type="checkbox" checked={value.derogation} onChange={(e) => onChange({ ...value, derogation: e.target.checked })} /> Demander une dérogation aux règles du PLU (implantation, hauteur) pour isoler : ajoute la note DP8-1
        </label>
      </div>
    </div>
  );
}
