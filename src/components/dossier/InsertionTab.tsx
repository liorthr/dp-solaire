"use client";
import { useEffect, useRef, useState } from "react";
import { Plus, Sparkles, Trash2 } from "lucide-react";
import type { Insertion } from "@/lib/types";
import { Badge, Button, Card, Field, Input } from "@/components/ui";
import { PhotoInput } from "@/components/PhotoInput";
import { isConvexQuad, renderFacadeFinish, renderPacUnit, renderPanels, type Pt } from "@/lib/image/homography";
import { renderInsertionElements } from "@/lib/image/insertion";
import { blobToImage } from "@/lib/image/browser";
import { photoStore } from "@/lib/store/db";
import { JOINERY_KINDS } from "@/data/works";
import type { ProjectBundle } from "./useProject";
import { useSaveProject } from "./useProject";

const CORNERS = ["haut-gauche", "haut-droit", "bas-droit", "bas-gauche"];

/** quadrilatère proposé par défaut selon le type de travaux (fractions de l'image) */
function defaultQuad(works: string, w: number, h: number, i = 0): Pt[] {
  const r = (x0: number, y0: number, x1: number, y1: number): Pt[] => [[w * x0, h * y0], [w * x1, h * y0], [w * x1, h * y1], [w * x0, h * y1]];
  if (works === "pac") return r(0.62, 0.66, 0.74, 0.8);
  if (works === "ite") return r(0.2, 0.4, 0.8, 0.85);
  if (works === "menuiserie") return r(0.29 + 0.08 * i, 0.5, 0.36 + 0.08 * i, 0.59);
  if (works === "velux") return [[w * (0.4 + 0.1 * i), h * 0.27], [w * (0.46 + 0.1 * i), h * 0.27], [w * (0.465 + 0.1 * i), h * 0.36], [w * (0.395 + 0.1 * i), h * 0.36]];
  return [[w * 0.35, h * 0.28], [w * 0.65, h * 0.28], [w * 0.68, h * 0.42], [w * 0.32, h * 0.42]];
}

export function InsertionTab({ b }: { b: ProjectBundle }) {
  const { project: p, panel } = b;
  const works = p.works ?? "pv";
  const multi = works === "menuiserie" || works === "velux";
  const save = useSaveProject();
  const facade = p.photos.find((x) => x.kind === "facade");
  const existing = p.insertions.find((i) => i.photoId === facade?.id);
  const layout = p.pv.layouts[0];
  const defRows = layout ? new Set(layout.panels.map((x) => x.y)).size : 2;
  const defCols = layout ? Math.max(...[...new Set(layout.panels.map((x) => x.y))].map((y) => layout.panels.filter((x) => x.y === y).length), 1) : 6;
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [quads, setQuads] = useState<Pt[][]>(existing ? ([existing.quad, ...(existing.extraQuads ?? [])] as Pt[][]) : []);
  const [active, setActive] = useState(0);
  const [rows, setRows] = useState(existing?.rows ?? defRows);
  const [cols, setCols] = useState(existing?.cols ?? defCols);
  const [drag, setDrag] = useState<[number, number] | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!facade) return;
    photoStore.get(facade.blobKey).then(async (bl) => {
      if (!bl) return;
      const im = await blobToImage(bl);
      setImg(im);
      if (!existing) setQuads([defaultQuad(works, im.naturalWidth, im.naturalHeight)]);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facade?.blobKey]);

  const allValid = quads.length > 0 && quads.every((q) => q.length === 4 && isConvexQuad(q));

  useEffect(() => {
    if (!img || !canvas.current) return;
    const c = canvas.current;
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const ctx = c.getContext("2d", { willReadFrequently: true })!;
    ctx.drawImage(img, 0, 0);
    if (drag !== null || !allValid) return;
    const quad = quads[0];
    if (multi) renderInsertionElements(ctx, p, { quad: quads[0], extraQuads: quads.slice(1) });
    else if (works === "pac") renderPacUnit(ctx, quad, Boolean(p.pac?.cover));
    else if (works === "ite") renderFacadeFinish(ctx, quad, p.ite?.colorHex ?? "#d8cbb3", p.ite?.finish ?? "enduit");
    else renderPanels(ctx, quad, rows, cols, { frame: panel?.frameColor ?? "noir", cell: panel?.cellColor ?? "noir" });
  }, [img, quads, rows, cols, drag, panel, works, multi, allValid, p]);

  const toImg = (e: React.PointerEvent): Pt => {
    const r = svgRef.current!.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * img!.naturalWidth, ((e.clientY - r.top) / r.height) * img!.naturalHeight];
  };
  const saved =
    existing && JSON.stringify([existing.quad, ...(existing.extraQuads ?? [])]) === JSON.stringify(quads) && (multi || (existing.rows === rows && existing.cols === cols));
  const persist = () => {
    if (!facade || !allValid) return;
    const ins: Insertion = { photoId: facade.id, quad: quads[0], rows, cols, ...(multi && quads.length > 1 ? { extraQuads: quads.slice(1) } : {}) };
    save({ ...p, insertions: [...p.insertions.filter((i) => i.photoId !== facade.id), ins] }, "insertion_visuelle");
  };
  const elementLabel = (i: number) => {
    if (works === "velux") return `Fenêtre de toit ${i + 1}`;
    const it = p.menuiserie?.items[i];
    return it ? `${JOINERY_KINDS[it.kind].label} ${i + 1}` : `Élément ${i + 1}`;
  };
  const expected = works === "velux" ? (p.velux?.items.length ?? 0) : works === "menuiserie" ? (p.menuiserie?.items.length ?? 0) : 1;

  if (!facade)
    return (
      <Card title={works === "velux" ? "Photo de la toiture requise" : "Photo de la façade requise"}>
        <PhotoInput kind="facade" onChange={(ph) => ph && save({ ...p, photos: [...p.photos.filter((x) => x.kind !== "facade"), ph] }, "ajout_photo")} />
      </Card>
    );

  const title = {
    pac: "Insertion de l'unité extérieure (DP5 / DP6)",
    ite: "Insertion de la façade isolée (DP5 / DP6)",
    menuiserie: "Insertion des menuiseries (DP5 / DP6)",
    velux: "Insertion des fenêtres de toit (DP5 / DP6)",
    pv: "Insertion du champ de panneaux (DP5 / DP6)",
  }[works];
  const where = {
    pac: "à l'emplacement de l'unité extérieure (à sa taille réelle, au pied du mur ou sur consoles)",
    ite: "sur la surface de mur à isoler",
    menuiserie: "sur chaque baie (fenêtre, porte, volet) : un cadre par menuiserie",
    velux: "à l'emplacement de chaque fenêtre de toit, en suivant la pente du toit",
    pv: "sur le pan de toiture",
  }[works];

  return (
    <div className="space-y-4">
      <Card title={title} actions={saved ? <Badge tone="ok">enregistré</Badge> : <Badge tone="alerte">non enregistré</Badge>}>
        <p className="mb-2 text-sm text-stone-600">
          Faites glisser les 4 coins orange {where}, dans l&apos;ordre haut-gauche, haut-droit, bas-droit, bas-gauche. Le rendu respecte la perspective (homographie).
        </p>
        <div className="relative w-full select-none">
          <canvas ref={canvas} className="h-auto w-full rounded-lg" aria-label="Photomontage" />
          {img && (
            <svg
              ref={svgRef}
              data-testid="insertion-editor"
              className="absolute inset-0 h-full w-full touch-none"
              viewBox={`0 0 ${img.naturalWidth} ${img.naturalHeight}`}
              onPointerMove={(e) => {
                if (drag === null) return;
                const pt = toImg(e);
                setQuads((qs) => qs.map((q, qi) => (qi === drag[0] ? (q.map((x, i) => (i === drag[1] ? pt : x)) as Pt[]) : q)));
              }}
              onPointerUp={() => setDrag(null)}
              onPointerLeave={() => setDrag(null)}
            >
              {quads.map((quad, qi) => (
                <g key={qi} opacity={multi && qi !== active ? 0.55 : 1}>
                  {quad.length === 4 && (
                    <polygon
                      points={quad.map((q) => q.join(",")).join(" ")}
                      fill="rgba(14,165,233,0.12)"
                      stroke={isConvexQuad(quad) ? "#f59e0b" : "#dc2626"}
                      strokeWidth={img.naturalWidth / 400}
                      onPointerDown={() => setActive(qi)}
                    />
                  )}
                  {quad.map((q, i) => (
                    <circle
                      key={i}
                      cx={q[0]}
                      cy={q[1]}
                      r={img.naturalWidth / (multi ? 110 : 70)}
                      fill="#f59e0b"
                      stroke="#fff"
                      strokeWidth={img.naturalWidth / 400}
                      className="cursor-grab"
                      tabIndex={0}
                      aria-label={`${multi ? elementLabel(qi) + " : " : ""}coin ${CORNERS[i]} : flèches pour déplacer`}
                      onPointerDown={(e) => {
                        (e.target as Element).setPointerCapture(e.pointerId);
                        setActive(qi);
                        setDrag([qi, i]);
                      }}
                      onKeyDown={(e) => {
                        const d = e.shiftKey ? 20 : 4;
                        const delta: Record<string, Pt> = { ArrowLeft: [-d, 0], ArrowRight: [d, 0], ArrowUp: [0, -d], ArrowDown: [0, d] };
                        if (delta[e.key]) {
                          e.preventDefault();
                          setQuads((qs) => qs.map((qq, qj) => (qj === qi ? (qq.map((x, j) => (j === i ? [x[0] + delta[e.key][0], x[1] + delta[e.key][1]] : x)) as Pt[]) : qq)));
                        }
                      }}
                    />
                  ))}
                </g>
              ))}
            </svg>
          )}
        </div>
        {!allValid && <p className="mt-2 text-sm text-red-700">Chaque cadre doit former un quadrilatère convexe (ordre : haut-gauche, haut-droit, bas-droit, bas-gauche).</p>}
        {multi && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            {quads.map((_, qi) => (
              <Button key={qi} size="sm" variant={qi === active ? "primary" : "outline"} onClick={() => setActive(qi)}>
                {elementLabel(qi)}
              </Button>
            ))}
            <Button
              size="sm"
              variant="outline"
              data-testid="add-element"
              onClick={() => {
                if (!img) return;
                setQuads((qs) => [...qs, defaultQuad(works, img.naturalWidth, img.naturalHeight, qs.length)]);
                setActive(quads.length);
              }}
            >
              <Plus className="h-4 w-4" /> Ajouter un élément
            </Button>
            {quads.length > 1 && (
              <Button
                size="sm"
                variant="ghost"
                aria-label="Supprimer l'élément sélectionné"
                onClick={() => {
                  setQuads((qs) => qs.filter((_, i) => i !== active));
                  setActive(0);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            {quads.length !== expected && expected > 0 && <span className="text-xs text-amber-800">{quads.length} élément(s) placé(s) pour {expected} déclaré(s).</span>}
          </div>
        )}
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {works === "pv" && (
            <>
              <Field label="Rangées">
                <Input type="number" min={1} max={10} value={rows} onChange={(e) => setRows(Math.max(1, Number(e.target.value)))} />
              </Field>
              <Field label="Colonnes">
                <Input type="number" min={1} max={30} value={cols} onChange={(e) => setCols(Math.max(1, Number(e.target.value)))} />
              </Field>
            </>
          )}
          <div className="col-span-2 flex items-end gap-2">
            <Button onClick={persist} disabled={!allValid} data-testid="save-insertion">
              Valider l&apos;insertion
            </Button>
            <Button variant="outline" disabled title="Nécessite le déploiement serveur et ANTHROPIC_API_KEY">
              <Sparkles className="h-4 w-4" /> Pré-détecter (IA)
            </Button>
          </div>
        </div>
        {works === "pv" && rows * cols !== p.pv.panelCount && (
          <p className="mt-2 text-xs text-amber-800">
            Le photomontage montre {rows * cols} panneaux pour {p.pv.panelCount} déclarés : ajustez rangées et colonnes pour rester cohérent avec les plans.
          </p>
        )}
        <p className="mt-2 text-xs text-stone-500">La pré-détection IA (Claude vision) propose les 4 coins ; elle est toujours à valider manuellement.</p>
      </Card>
      <Card title="Photos">
        <div className="space-y-3">
          {(["facade", "proche", "lointain"] as const).map((k) => (
            <PhotoInput
              key={k}
              kind={k}
              photo={p.photos.find((x) => x.kind === k)}
              onChange={(ph) => ph && save({ ...p, photos: [...p.photos.filter((x) => x.kind !== k), ph], insertions: k === "facade" ? [] : p.insertions }, "ajout_photo")}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}
