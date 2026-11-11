"use client";
import { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import type { Insertion } from "@/lib/types";
import { Badge, Button, Card, Field, Input } from "@/components/ui";
import { PhotoInput } from "@/components/PhotoInput";
import { isConvexQuad, renderPanels, type Pt } from "@/lib/image/homography";
import { blobToImage } from "@/lib/image/browser";
import { photoStore } from "@/lib/store/db";
import type { ProjectBundle } from "./useProject";
import { useSaveProject } from "./useProject";

export function InsertionTab({ b }: { b: ProjectBundle }) {
  const { project: p, panel } = b;
  const save = useSaveProject();
  const facade = p.photos.find((x) => x.kind === "facade");
  const existing = p.insertions.find((i) => i.photoId === facade?.id);
  const layout = p.pv.layouts[0];
  const defRows = layout ? new Set(layout.panels.map((x) => x.y)).size : 2;
  const defCols = layout ? Math.max(...[...new Set(layout.panels.map((x) => x.y))].map((y) => layout.panels.filter((x) => x.y === y).length), 1) : 6;
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [quad, setQuad] = useState<Pt[]>((existing?.quad as Pt[]) ?? []);
  const [rows, setRows] = useState(existing?.rows ?? defRows);
  const [cols, setCols] = useState(existing?.cols ?? defCols);
  const [drag, setDrag] = useState<number | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!facade) return;
    photoStore.get(facade.blobKey).then(async (bl) => {
      if (!bl) return;
      const im = await blobToImage(bl);
      setImg(im);
      if (!existing) {
        const w = im.naturalWidth, h = im.naturalHeight;
        setQuad([[w * 0.35, h * 0.28], [w * 0.65, h * 0.28], [w * 0.68, h * 0.42], [w * 0.32, h * 0.42]]);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facade?.blobKey]);

  useEffect(() => {
    if (!img || !canvas.current) return;
    const c = canvas.current;
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const ctx = c.getContext("2d", { willReadFrequently: true })!;
    ctx.drawImage(img, 0, 0);
    if (quad.length === 4 && isConvexQuad(quad) && drag === null) renderPanels(ctx, quad, rows, cols, { frame: panel?.frameColor ?? "noir", cell: panel?.cellColor ?? "noir" });
  }, [img, quad, rows, cols, drag, panel]);

  const toImg = (e: React.PointerEvent): Pt => {
    const r = svgRef.current!.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * img!.naturalWidth, ((e.clientY - r.top) / r.height) * img!.naturalHeight];
  };
  const valid = quad.length === 4 && isConvexQuad(quad);
  const saved = existing && JSON.stringify(existing.quad) === JSON.stringify(quad) && existing.rows === rows && existing.cols === cols;
  const persist = () => {
    if (!facade || !valid) return;
    const ins: Insertion = { photoId: facade.id, quad, rows, cols };
    save({ ...p, insertions: [...p.insertions.filter((i) => i.photoId !== facade.id), ins] }, "insertion_visuelle");
  };

  if (!facade)
    return (
      <Card title="Photo de la façade requise">
        <PhotoInput kind="facade" onChange={(ph) => ph && save({ ...p, photos: [...p.photos.filter((x) => x.kind !== "facade"), ph] }, "ajout_photo")} />
      </Card>
    );

  return (
    <div className="space-y-4">
      <Card
        title="Insertion du champ de panneaux (DP5 / DP6)"
        actions={saved ? <Badge tone="ok">enregistré</Badge> : <Badge tone="alerte">non enregistré</Badge>}
      >
        <p className="mb-2 text-sm text-stone-600">Faites glisser les 4 coins orange sur le pan de toiture, dans l&apos;ordre haut-gauche, haut-droit, bas-droit, bas-gauche. Le rendu respecte la perspective (homographie).</p>
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
                setQuad((q) => q.map((x, i) => (i === drag ? pt : x)) as Pt[]);
              }}
              onPointerUp={() => setDrag(null)}
              onPointerLeave={() => setDrag(null)}
            >
              {quad.length === 4 && <polygon points={quad.map((q) => q.join(",")).join(" ")} fill="rgba(14,165,233,0.12)" stroke={valid ? "#f59e0b" : "#dc2626"} strokeWidth={img.naturalWidth / 400} />}
              {quad.map((q, i) => (
                <circle
                  key={i}
                  cx={q[0]}
                  cy={q[1]}
                  r={img.naturalWidth / 70}
                  fill="#f59e0b"
                  stroke="#fff"
                  strokeWidth={img.naturalWidth / 400}
                  className="cursor-grab"
                  tabIndex={0}
                  aria-label={`Coin ${["haut-gauche", "haut-droit", "bas-droit", "bas-gauche"][i]} : flèches pour déplacer`}
                  onPointerDown={(e) => {
                    (e.target as Element).setPointerCapture(e.pointerId);
                    setDrag(i);
                  }}
                  onKeyDown={(e) => {
                    const d = e.shiftKey ? 20 : 4;
                    const delta: Record<string, Pt> = { ArrowLeft: [-d, 0], ArrowRight: [d, 0], ArrowUp: [0, -d], ArrowDown: [0, d] };
                    if (delta[e.key]) {
                      e.preventDefault();
                      setQuad((qq) => qq.map((x, j) => (j === i ? [x[0] + delta[e.key][0], x[1] + delta[e.key][1]] : x)) as Pt[]);
                    }
                  }}
                />
              ))}
            </svg>
          )}
        </div>
        {!valid && <p className="mt-2 text-sm text-red-700">Les 4 coins doivent former un quadrilatère convexe (ordre : haut-gauche, haut-droit, bas-droit, bas-gauche).</p>}
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label="Rangées">
            <Input type="number" min={1} max={10} value={rows} onChange={(e) => setRows(Math.max(1, Number(e.target.value)))} />
          </Field>
          <Field label="Colonnes">
            <Input type="number" min={1} max={30} value={cols} onChange={(e) => setCols(Math.max(1, Number(e.target.value)))} />
          </Field>
          <div className="col-span-2 flex items-end gap-2">
            <Button onClick={persist} disabled={!valid} data-testid="save-insertion">
              Valider l&apos;insertion
            </Button>
            <Button variant="outline" disabled title="Nécessite le déploiement serveur et ANTHROPIC_API_KEY">
              <Sparkles className="h-4 w-4" /> Pré-détecter (IA)
            </Button>
          </div>
        </div>
        {rows * cols !== p.pv.panelCount && <p className="mt-2 text-xs text-amber-800">Le photomontage montre {rows * cols} panneaux pour {p.pv.panelCount} déclarés : ajustez rangées et colonnes pour rester cohérent avec les plans.</p>}
        <p className="mt-2 text-xs text-stone-500">La pré-détection IA (Claude vision) propose les 4 coins ; elle est toujours à valider manuellement.</p>
      </Card>
      <Card title="Photos">
        <div className="space-y-3">
          {(["facade", "proche", "lointain"] as const).map((k) => (
            <PhotoInput key={k} kind={k} photo={p.photos.find((x) => x.kind === k)} onChange={(ph) => ph && save({ ...p, photos: [...p.photos.filter((x) => x.kind !== k), ph], insertions: k === "facade" ? [] : p.insertions }, "ajout_photo")} />
          ))}
        </div>
      </Card>
    </div>
  );
}
