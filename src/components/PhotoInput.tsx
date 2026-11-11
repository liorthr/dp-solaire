"use client";
import { useEffect, useState } from "react";
import { Camera, CheckCircle2, AlertTriangle } from "lucide-react";
import type { Photo } from "@/lib/types";
import { analyzePhoto, asset } from "@/lib/image/browser";
import { photoStore } from "@/lib/store/db";
import { uid } from "@/lib/project/factory";
import { Badge } from "./ui";

const GUIDE: Record<Photo["kind"], { title: string; tips: string; required: boolean; example: string }> = {
  facade: { title: "Façade avec la toiture", tips: "Face à la maison, depuis la rue, toute la toiture visible, en plein jour, format paysage.", required: true, example: "/demo/sans-contrainte-facade.jpg" },
  proche: { title: "Environnement proche (DP7)", tips: "Depuis la rue : la maison et ses voisines, les arbres, la clôture.", required: false, example: "/demo/sans-contrainte-proche.jpg" },
  lointain: { title: "Paysage lointain (DP8)", tips: "Prenez du recul (50 à 150 m) : la maison dans le quartier ou le paysage.", required: false, example: "/demo/sans-contrainte-lointain.jpg" },
};

export function PhotoInput({ kind, photo, onChange }: { kind: Photo["kind"]; photo?: Photo; onChange: (p: Photo | undefined) => void }) {
  const g = GUIDE[kind];
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let url: string | null = null;
    if (photo) photoStore.get(photo.blobKey).then((b) => {
      if (b) {
        url = URL.createObjectURL(b);
        setPreview(url);
      }
    });
    else setPreview(null);
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [photo]);

  const onFile = async (file?: File | null) => {
    if (!file) return;
    setBusy(true);
    try {
      const key = uid("blob");
      await photoStore.put(key, file);
      const { quality, width, height } = await analyzePhoto(file, kind);
      // géolocalisation optionnelle de la prise de vue (point de vue DP1/DP2)
      onChange({ id: photo?.id ?? uid("pho"), kind, blobKey: key, width, height, quality, caption: g.title });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-3">
      <div className="flex items-start gap-3">
        <img src={preview ?? asset(g.example)} alt={preview ? g.title : `Exemple : ${g.title}`} className={`h-20 w-28 shrink-0 rounded-md object-cover ${preview ? "" : "opacity-50 grayscale"}`} />
        <div className="min-w-0 flex-1">
          <p className="font-medium">
            {g.title} {g.required ? <Badge tone="alerte">obligatoire</Badge> : <Badge>recommandée</Badge>}
          </p>
          <p className="text-xs text-stone-600">{g.tips}</p>
          <label className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium hover:bg-stone-50">
            <Camera className="h-4 w-4" /> {photo ? "Remplacer" : "Prendre / choisir"}
            <input data-testid={`photo-${kind}`} type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
          </label>
          {busy && <span className="ml-2 text-xs text-stone-500">Analyse de la qualité…</span>}
        </div>
      </div>
      {photo?.quality && (
        <div className="mt-2 text-xs" aria-live="polite">
          {photo.quality.ok ? (
            <p className="flex items-center gap-1 text-emerald-800">
              <CheckCircle2 className="h-4 w-4" /> Qualité correcte ({photo.quality.megapixels} Mpx, luminosité {photo.quality.brightness}, netteté {photo.quality.sharpness})
            </p>
          ) : (
            <ul className="space-y-0.5 text-amber-900">
              {photo.quality.issues.map((i) => (
                <li key={i.code} className="flex items-start gap-1">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> <span>{i.message.charAt(0).toUpperCase() + i.message.slice(1)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
