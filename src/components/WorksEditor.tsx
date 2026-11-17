"use client";
// Saisie des caractéristiques PAC / ITE (assistant de création et onglet Plans).
import type { AgriInfo, ExtensionInfo, IteInfo, JoineryInfo, JoineryItem, JoineryKind, JoineryMaterial, PacInfo, RoofPlane, RoofWindowInfo, WorksType } from "@/lib/types";
import { Field, Input, Select, cn } from "@/components/ui";
import { EXTENSION_KINDS, defaultPacUnits, ITE_COLORS, ITE_FINISHES, JOINERY_COLORS, JOINERY_KINDS, JOINERY_MATERIALS, ROOF_WINDOW_COLORS, ROOF_WINDOW_MODELS, WORK_CHOICES, AGRI_USES, type WorksChoice } from "@/data/works";
import { Button } from "@/components/ui";
import { orientationLabel } from "@/lib/geo/roof";
import type { Facade } from "@/lib/geo/facades";

export function WorksPicker({ value, onChange }: { value: WorksChoice; onChange: (w: WorksChoice) => void }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium">Type de travaux</legend>
      <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5" role="radiogroup">
        {WORK_CHOICES.map((w) => (
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

/** bâtiment agricole et déclarant (exploitant en nom propre ou société) */
export function AgriEditor({ value, onChange }: { value: AgriInfo; onChange: (v: AgriInfo) => void }) {
  const co = value.company;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Bâtiment" htmlFor="agri-building" help="Panneaux sur un bâtiment existant : déclaration préalable. Hangar construit pour porter les panneaux : permis de construire.">
        <Select id="agri-building" value={value.building} data-testid="agri-building" onChange={(e) => onChange({ ...value, building: e.target.value as AgriInfo["building"] })}>
          <option value="existant">Bâtiment existant</option>
          <option value="neuf">Hangar neuf (à construire)</option>
        </Select>
      </Field>
      <Field label="Usage du bâtiment" htmlFor="agri-use">
        <Select id="agri-use" value={value.use} onChange={(e) => onChange({ ...value, use: e.target.value as AgriInfo["use"] })}>
          {Object.entries(AGRI_USES).map(([k, l]) => (
            <option key={k} value={k}>
              {l}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Déclarant" htmlFor="agri-declarant" help="Société : la demande est faite au nom de la société (cerfa, rubrique « personne morale »), représentée par l'exploitant.">
        <Select id="agri-declarant" value={co ? "societe" : "nom_propre"} data-testid="agri-declarant" onChange={(e) => onChange({ ...value, company: e.target.value === "societe" ? { legalForm: "EARL", name: "", siret: "" } : undefined })}>
          <option value="nom_propre">Exploitant en nom propre</option>
          <option value="societe">Société (EARL, GAEC, SCEA…)</option>
        </Select>
      </Field>
      {co && (
        <>
          <Field label="Forme" htmlFor="agri-form">
            <Select id="agri-form" value={co.legalForm} onChange={(e) => onChange({ ...value, company: { ...co, legalForm: e.target.value } })}>
              {["EARL", "GAEC", "SCEA", "SARL", "SAS", "Autre"].map((f) => (
                <option key={f}>{f}</option>
              ))}
            </Select>
          </Field>
          <Field label="Nom de la société" htmlFor="agri-name">
            <Input id="agri-name" data-testid="agri-name" value={co.name} onChange={(e) => onChange({ ...value, company: { ...co, name: e.target.value } })} placeholder="EARL du Moulin" />
          </Field>
          <Field label="N° SIRET" htmlFor="agri-siret" help="14 chiffres (avis de situation INSEE).">
            <Input id="agri-siret" data-testid="agri-siret" inputMode="numeric" value={co.siret} onChange={(e) => onChange({ ...value, company: { ...co, siret: e.target.value } })} />
          </Field>
        </>
      )}
    </div>
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

const num = (v: string) => Math.round(Number(v.replace(",", ".")) * 100) / 100;

function ViewFields({ view, agreement, onChange, what }: { view: "droite" | "oblique" | "sans"; agreement: boolean; onChange: (v: { view?: "droite" | "oblique" | "sans"; neighborAgreement?: boolean }) => void; what: string }) {
  return (
    <>
      <Field label={`Vue sur le terrain voisin depuis ${what}`} htmlFor={`view-${what}`} help="Vue droite : on voit chez le voisin sans se pencher (1,90 m minimum à la limite). Vue oblique : en se penchant (0,60 m). Sans vue : vitrage translucide fixe, ou donne sur un mur.">
        <Select id={`view-${what}`} value={view} onChange={(e) => onChange({ view: e.target.value as "droite" | "oblique" | "sans" })}>
          <option value="droite">Vue droite (sans se pencher)</option>
          <option value="oblique">Vue oblique (en se penchant)</option>
          <option value="sans">Sans vue sur le voisin</option>
        </Select>
      </Field>
      <label className="flex items-center gap-2 self-end text-sm">
        <input type="checkbox" checked={agreement} onChange={(e) => onChange({ neighborAgreement: e.target.checked })} /> Accord écrit du voisin obtenu
      </label>
    </>
  );
}

function ColorSwatches({ colors, value, onPick }: { colors: { name: string; hex: string }[]; value: string; onPick: (c: { name: string; hex: string }) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {colors.map((c) => (
        <button key={c.hex} type="button" onClick={() => onPick(c)} aria-pressed={value === c.hex} className={cn("flex items-center gap-2 rounded-lg border px-2 py-1 text-xs", value === c.hex ? "border-stone-900 ring-2 ring-stone-900" : "border-stone-200")}>
          <span className="h-5 w-5 rounded border border-stone-300" style={{ background: c.hex }} /> {c.name}
        </button>
      ))}
    </div>
  );
}

export function JoineryEditor({ value, onChange, facades }: { value: JoineryInfo; onChange: (v: JoineryInfo) => void; facades?: Facade[] }) {
  const setItem = (id: string, patch: Partial<JoineryItem>) => onChange({ ...value, items: value.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) });
  const addItem = () => {
    const f = facades?.[0];
    const k = JOINERY_KINDS.fenetre;
    onChange({ ...value, items: [...value.items, { id: `j${Date.now().toString(36)}`, facadeIndex: f?.index ?? 0, kind: "fenetre", widthM: k.w, heightM: k.h, xM: 1, sillM: k.sill, isNew: false }] });
  };
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="flex items-start gap-2 text-sm sm:col-span-2">
        <input type="checkbox" checked={value.identical} onChange={(e) => onChange({ ...value, identical: e.target.checked })} data-testid="menu-identical" /> Remplacement strictement à l&apos;identique (même forme, même matériau, même couleur) : aucune formalité
      </label>
      <Field label="Matériau actuel" htmlFor="menu-before">
        <Select id="menu-before" value={value.materialBefore} onChange={(e) => onChange({ ...value, materialBefore: e.target.value as JoineryMaterial })}>
          {Object.entries(JOINERY_MATERIALS).map(([k, l]) => (
            <option key={k} value={k}>{l}</option>
          ))}
        </Select>
      </Field>
      <Field label="Matériau projeté" htmlFor="menu-after">
        <Select id="menu-after" value={value.materialAfter} onChange={(e) => onChange({ ...value, materialAfter: e.target.value as JoineryMaterial })}>
          {Object.entries(JOINERY_MATERIALS).map(([k, l]) => (
            <option key={k} value={k}>{l}</option>
          ))}
        </Select>
      </Field>
      <fieldset className="sm:col-span-2">
        <legend className="mb-1 text-sm font-medium">Teinte projetée (rendu indicatif)</legend>
        <ColorSwatches colors={JOINERY_COLORS} value={value.colorHex} onPick={(c) => onChange({ ...value, colorName: c.name, colorHex: c.hex })} />
      </fieldset>
      {facades && facades.length > 0 && (
        <div className="space-y-2 sm:col-span-2">
          <p className="text-sm font-medium">Menuiseries concernées (cotes en mètres, position depuis le coin gauche de la façade vue de dehors)</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm" data-testid="joinery-table">
              <thead>
                <tr className="text-left text-xs text-stone-500">
                  <th className="p-1">Façade</th>
                  <th className="p-1">Type</th>
                  <th className="p-1">Largeur</th>
                  <th className="p-1">Hauteur</th>
                  <th className="p-1">Position</th>
                  <th className="p-1">Allège</th>
                  <th className="p-1">Création</th>
                  <th className="p-1" />
                </tr>
              </thead>
              <tbody>
                {value.items.map((it) => (
                  <tr key={it.id} className="border-t border-stone-100">
                    <td className="p-1">
                      <Select aria-label="Façade" className="h-9" value={it.facadeIndex} onChange={(e) => setItem(it.id, { facadeIndex: Number(e.target.value) })}>
                        {facades.map((f) => (
                          <option key={f.index} value={f.index}>{f.label}</option>
                        ))}
                      </Select>
                    </td>
                    <td className="p-1">
                      <Select
                        aria-label="Type"
                        className="h-9"
                        value={it.kind}
                        onChange={(e) => {
                          const k = e.target.value as JoineryKind;
                          setItem(it.id, { kind: k, widthM: JOINERY_KINDS[k].w, heightM: JOINERY_KINDS[k].h, sillM: JOINERY_KINDS[k].sill });
                        }}
                      >
                        {Object.entries(JOINERY_KINDS).map(([k, d]) => (
                          <option key={k} value={k}>{d.label}</option>
                        ))}
                      </Select>
                    </td>
                    {(["widthM", "heightM", "xM", "sillM"] as const).map((key) => (
                      <td key={key} className="p-1">
                        <Input aria-label={key} className="h-9 w-20" type="number" step="0.05" min={0} value={it[key]} onChange={(e) => setItem(it.id, { [key]: num(e.target.value) })} />
                      </td>
                    ))}
                    <td className="p-1 text-center">
                      <input type="checkbox" aria-label="Ouverture créée" checked={it.isNew} onChange={(e) => setItem(it.id, { isNew: e.target.checked })} />
                    </td>
                    <td className="p-1">
                      <Button size="sm" variant="ghost" aria-label="Retirer" onClick={() => onChange({ ...value, items: value.items.filter((x) => x.id !== it.id) })}>
                        ✕
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button size="sm" variant="outline" onClick={addItem} data-testid="add-joinery">
            + Ajouter une menuiserie
          </Button>
        </div>
      )}
      {value.items.some((i) => i.isNew) && <ViewFields what="les ouvertures créées" view={value.view} agreement={value.neighborAgreement} onChange={(v) => onChange({ ...value, ...v })} />}
      <label className="flex items-start gap-2 text-sm sm:col-span-2">
        <input type="checkbox" checked={value.changeOfUse} onChange={(e) => onChange({ ...value, changeOfUse: e.target.checked })} /> Les travaux s&apos;accompagnent d&apos;un changement de destination (ex. garage ou commerce transformé en logement)
      </label>
    </div>
  );
}

export function VeluxEditor({ value, onChange, planes, onCount }: { value: RoofWindowInfo; onChange: (v: RoofWindowInfo) => void; planes?: RoofPlane[]; onCount?: (n: number) => void }) {
  const setItem = (id: string, patch: Partial<RoofWindowInfo["items"][number]>) => onChange({ ...value, items: value.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) });
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Dimensions (catalogue générique)" htmlFor="velux-model" help="Tailles courantes du marché ; remplacez-les par vos références fabricant.">
        <Select id="velux-model" value={value.modelId} onChange={(e) => onChange({ ...value, modelId: e.target.value })}>
          {ROOF_WINDOW_MODELS.map((m) => (
            <option key={m.id} value={m.id}>{m.label}</option>
          ))}
        </Select>
      </Field>
      <Field label="Coloris extérieur" htmlFor="velux-color">
        <Select id="velux-color" value={value.frameColor} onChange={(e) => onChange({ ...value, frameColor: e.target.value as RoofWindowInfo["frameColor"] })}>
          {Object.entries(ROOF_WINDOW_COLORS).map(([k, c]) => (
            <option key={k} value={k}>{c.label}</option>
          ))}
        </Select>
      </Field>
      {onCount && (
        <Field label="Nombre de fenêtres de toit" htmlFor="velux-count" help="Elles sont placées automatiquement sur le premier pan ; ajustez leur position dans l'onglet Plans.">
          <Input id="velux-count" type="number" min={1} max={12} value={value.items.length || 2} onChange={(e) => onCount(Math.max(1, Math.min(12, Number(e.target.value))))} />
        </Field>
      )}
      {planes && planes.length > 0 && (
        <div className="space-y-2 sm:col-span-2">
          <p className="text-sm font-medium">Position de chaque fenêtre sur le pan (m depuis la rive gauche et depuis l&apos;égout)</p>
          {value.items.map((it, i) => (
            <div key={it.id} className="flex flex-wrap items-end gap-2 text-sm">
              <span className="w-24 font-medium">Fenêtre {i + 1}</span>
              <Select aria-label="Pan" className="h-9 w-auto" value={it.roofPlaneId} onChange={(e) => setItem(it.id, { roofPlaneId: e.target.value })}>
                {planes.map((rp) => (
                  <option key={rp.id} value={rp.id}>{rp.label} ({orientationLabel(rp.azimuthDeg).toLowerCase()})</option>
                ))}
              </Select>
              <label className="flex items-center gap-1">
                x <Input aria-label={`Fenêtre ${i + 1} : distance à la rive`} className="h-9 w-20" type="number" step="0.1" min={0} value={it.x} onChange={(e) => setItem(it.id, { x: num(e.target.value) })} />
              </label>
              <label className="flex items-center gap-1">
                y <Input aria-label={`Fenêtre ${i + 1} : distance à l'égout`} className="h-9 w-20" type="number" step="0.1" min={0} value={it.y} onChange={(e) => setItem(it.id, { y: num(e.target.value) })} />
              </label>
              <Button size="sm" variant="ghost" aria-label="Retirer" onClick={() => onChange({ ...value, items: value.items.filter((x) => x.id !== it.id) })}>✕</Button>
            </div>
          ))}
          <Button size="sm" variant="outline" data-testid="add-velux" onClick={() => onChange({ ...value, items: [...value.items, { id: `w${Date.now().toString(36)}`, roofPlaneId: planes[0].id, x: 0.8, y: Math.round(planes[0].slopeLengthM * 0.3 * 10) / 10 }] })}>
            + Ajouter une fenêtre de toit
          </Button>
        </div>
      )}
      <ViewFields what="les fenêtres de toit" view={value.view} agreement={value.neighborAgreement} onChange={(v) => onChange({ ...value, ...v })} />
      <div className="space-y-1 text-sm sm:col-span-2">
        <label className="flex items-start gap-2">
          <input type="checkbox" checked={value.shutters} onChange={(e) => onChange({ ...value, shutters: e.target.checked })} /> Volets roulants extérieurs
        </label>
        <label className="flex items-start gap-2">
          <input type="checkbox" checked={value.identical} onChange={(e) => onChange({ ...value, identical: e.target.checked })} /> Remplacement par un modèle identique (même taille, même aspect)
        </label>
        <label className="flex items-start gap-2">
          <input type="checkbox" checked={value.attic} onChange={(e) => onChange({ ...value, attic: e.target.checked })} data-testid="velux-attic" /> Avec aménagement des combles (création de surface de plancher)
        </label>
        {value.attic && (
          <Field label="Surface de plancher créée (m²)" htmlFor="velux-area">
            <Input id="velux-area" type="number" min={0} value={value.atticAreaM2 ?? ""} onChange={(e) => onChange({ ...value, atticAreaM2: Number(e.target.value) })} />
          </Field>
        )}
        <label className="flex items-start gap-2">
          <input type="checkbox" checked={value.changeOfUse} onChange={(e) => onChange({ ...value, changeOfUse: e.target.checked })} /> Avec changement de destination (grange, commerce… transformé en logement)
        </label>
      </div>
    </div>
  );
}

const EXT_COLORS = [
  { name: "Ton pierre", hex: "#d8cbb3" },
  { name: "Sable", hex: "#e8dcc4" },
  { name: "Blanc cassé", hex: "#efeae0" },
  { name: "Gris clair", hex: "#c9c9c4" },
  { name: "Gris anthracite", hex: "#4a4d50" },
  { name: "Bois naturel", hex: "#a97c50" },
];

export function ExtensionEditor({ value, onChange, facades }: { value: ExtensionInfo; onChange: (v: ExtensionInfo) => void; facades?: Facade[] }) {
  const emprise = Math.round(value.widthM * value.depthM * 10) / 10;
  const set = (patch: Partial<ExtensionInfo>) => onChange({ ...value, ...patch });
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Type de construction" htmlFor="ext-kind">
        <Select
          id="ext-kind"
          value={value.kind}
          onChange={(e) => {
            const kind = e.target.value as ExtensionInfo["kind"];
            set({ kind, floorAreaCreatedM2: kind === "garage" ? 0 : Math.round(emprise * 0.85), wallFinish: kind === "veranda" ? "Structure aluminium vitrée" : "Enduit", roof: kind === "veranda" ? "monopente" : value.roof });
          }}
        >
          {Object.entries(EXTENSION_KINDS).map(([k, l]) => (
            <option key={k} value={k}>{l}</option>
          ))}
        </Select>
      </Field>
      {facades && facades.length > 0 && (
        <Field label="Contre quelle façade ?" htmlFor="ext-facade">
          <FacadeSelect id="ext-facade" facades={facades} value={value.facadeIndex} onChange={(i) => set({ facadeIndex: i })} />
        </Field>
      )}
      <Field label="Largeur le long de la façade (m)" htmlFor="ext-w">
        <Input id="ext-w" type="number" step="0.1" min={1} max={30} value={value.widthM} onChange={(e) => set({ widthM: Number(e.target.value) })} />
      </Field>
      <Field label="Profondeur (m)" htmlFor="ext-d">
        <Input id="ext-d" type="number" step="0.1" min={1} max={30} value={value.depthM} onChange={(e) => set({ depthM: Number(e.target.value) })} />
      </Field>
      {facades && facades.length > 0 && (
        <Field label={`Position le long de la façade : ${Math.round(value.positionRatio * 100)} %`} htmlFor="ext-pos">
          <input id="ext-pos" type="range" min={0} max={100} value={Math.round(value.positionRatio * 100)} onChange={(e) => set({ positionRatio: Number(e.target.value) / 100 })} className="w-full" />
        </Field>
      )}
      <Field label="Hauteur à l'égout (m)" htmlFor="ext-h" help="Hauteur du mur, du sol jusqu'au bas de la toiture.">
        <Input id="ext-h" type="number" step="0.1" min={2} max={9} value={value.heightM} onChange={(e) => set({ heightM: Number(e.target.value) })} />
      </Field>
      <Field label="Toiture" htmlFor="ext-roof">
        <Select id="ext-roof" value={value.roof} onChange={(e) => set({ roof: e.target.value as ExtensionInfo["roof"] })}>
          <option value="monopente">Monopente (appentis)</option>
          <option value="deux_pentes">Deux pentes</option>
          <option value="plat">Toit plat</option>
        </Select>
      </Field>
      {value.roof !== "plat" && (
        <Field label="Pente du toit (°)" htmlFor="ext-tilt">
          <Input id="ext-tilt" type="number" min={3} max={60} value={value.roofTiltDeg} onChange={(e) => set({ roofTiltDeg: Number(e.target.value) })} />
        </Field>
      )}
      <Field label="Surface de plancher créée (m²)" htmlFor="ext-sdp" help="Surface intérieure close et couverte de plus de 1,80 m de hauteur, mesurée au nu intérieur des murs. Pour un garage, les surfaces de stationnement ne sont en principe pas comptées.">
        <Input id="ext-sdp" type="number" step="0.5" min={0} value={value.floorAreaCreatedM2} onChange={(e) => set({ floorAreaCreatedM2: Number(e.target.value) })} />
      </Field>
      <Field label="Surface de plancher actuelle de la maison (m²)" htmlFor="ext-sdp0" help="Indiquée sur l'acte de vente ou la taxe foncière. Une estimation est proposée d'après l'emprise du bâtiment : corrigez-la, elle décide du recours à l'architecte (150 m²).">
        <Input id="ext-sdp0" type="number" step="1" min={0} value={value.floorAreaExistingM2} onChange={(e) => set({ floorAreaExistingM2: Number(e.target.value) })} />
      </Field>
      <Field label="Matériau des murs" htmlFor="ext-wall">
        <Input id="ext-wall" value={value.wallFinish} onChange={(e) => set({ wallFinish: e.target.value })} />
      </Field>
      <Field label="Couverture" htmlFor="ext-cover">
        <Input id="ext-cover" value={value.roofCovering} onChange={(e) => set({ roofCovering: e.target.value })} />
      </Field>
      <fieldset className="sm:col-span-2">
        <legend className="mb-1 text-sm font-medium">Teinte des murs (rendu indicatif)</legend>
        <ColorSwatches colors={EXT_COLORS} value={value.wallColorHex} onPick={(c) => set({ wallColorHex: c.hex })} />
      </fieldset>
      <label className="flex items-start gap-2 text-sm sm:col-span-2">
        <input type="checkbox" checked={value.architect} onChange={(e) => set({ architect: e.target.checked })} /> Un architecte établit le projet (obligatoire si la maison dépasse 150 m² de surface de plancher après travaux, en cas de permis)
      </label>
      <p className="rounded-lg bg-stone-100 p-2 text-sm text-stone-700 sm:col-span-2" data-testid="ext-summary">
        Emprise au sol créée : <b>{String(emprise).replace(".", ",")} m²</b> · surface de plancher après travaux : <b>{String(value.floorAreaExistingM2 + value.floorAreaCreatedM2).replace(".", ",")} m²</b>. Le régime (déclaration préalable ou permis) est calculé automatiquement.
      </p>
    </div>
  );
}
