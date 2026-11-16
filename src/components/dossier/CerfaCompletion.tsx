"use client";
// Complète ce qui manque au cerfa avant paiement / téléchargement, sans quitter l'étape.
import { useState } from "react";
import { ClipboardCheck } from "lucide-react";
import { Button, Field, Input } from "@/components/ui";
import { cerfaGaps } from "@/lib/dossier/cerfa";
import { repo } from "@/lib/store/db";
import type { ProjectBundle } from "./useProject";
import { useSaveProject } from "./useProject";

export function CerfaCompletion({ b, self }: { b: ProjectBundle; self: boolean }) {
  const { project: p, client } = b;
  const save = useSaveProject();
  const gaps = cerfaGaps(p, client);
  const [v, setV] = useState<Record<string, string>>({});
  const [err, setErr] = useState("");
  if (!gaps.length) return null;
  const required = gaps.filter((g) => g.required);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setV({ ...v, [k]: e.target.value });
  const who = self ? "vous joindre" : "joindre le déclarant";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    const missing = required.filter((g) => (g.id === "parcel" ? !(v.section?.trim() && v.numero?.trim()) : !v[g.id]?.trim()));
    if (missing.length) return setErr(`À compléter : ${missing.map((g) => g.label.toLowerCase()).join(", ")}.`);
    const patch: Record<string, string> = {};
    for (const k of ["lastName", "firstName", "birthDate", "birthPlace", "phone", "email"]) if (v[k]?.trim()) patch[k] = v[k].trim();
    let clientId = p.clientId;
    if (Object.keys(patch).length) {
      if (client) repo.saveClient({ ...client, ...patch });
      else clientId = repo.saveClient({ firstName: patch.firstName ?? "", lastName: patch.lastName ?? "", ...patch }).id;
    }
    const overrides = { ...p.overrides };
    // parcelle saisie à la main : uniquement pour le cerfa (les plans gardent la géométrie du cadastre)
    if (v.section?.trim() && v.numero?.trim()) overrides["cadastre.manual"] = { section: v.section.trim().toUpperCase(), numero: v.numero.trim().padStart(4, "0"), contenanceM2: Number(v.surface) || 0 };
    save({ ...p, clientId, overrides }, "cerfa_complete");
  };

  return (
    <form onSubmit={submit} className="rounded-2xl border-2 border-sun bg-sun-soft p-4" data-testid="cerfa-completion">
      <p className="flex items-center gap-2 font-bold">
        <ClipboardCheck className="h-5 w-5" /> {required.length ? "Il manque des informations au formulaire officiel (cerfa)" : "Pour un cerfa complet"}
      </p>
      <p className="mt-1 text-sm">
        {required.length ? `Sans elles, la mairie peut déclarer le dossier incomplet. Elles sont recopiées dans le cerfa à votre place.` : `Facultatif mais conseillé : la mairie pourra ${who} plus facilement.`}
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {gaps.map((g) =>
          g.id === "parcel" ? (
            <div key={g.id} className="grid grid-cols-3 gap-2 sm:col-span-2">
              <Field label="Section cadastrale" htmlFor="cg-section" help="2 lettres, sur l'avis de taxe foncière ou cadastre.gouv.fr">
                <Input id="cg-section" value={v.section ?? ""} onChange={set("section")} placeholder="AB" maxLength={2} />
              </Field>
              <Field label="Numéro de parcelle" htmlFor="cg-numero">
                <Input id="cg-numero" value={v.numero ?? ""} onChange={set("numero")} placeholder="0123" inputMode="numeric" />
              </Field>
              <Field label="Surface (m²)" htmlFor="cg-surface">
                <Input id="cg-surface" value={v.surface ?? ""} onChange={set("surface")} inputMode="numeric" />
              </Field>
            </div>
          ) : (
            <Field key={g.id} label={`${g.label}${g.required ? "" : " (facultatif)"}`} htmlFor={`cg-${g.id}`}>
              <Input id={`cg-${g.id}`} type={g.id === "birthDate" ? "date" : g.id === "phone" ? "tel" : g.id === "email" ? "email" : "text"} value={v[g.id] ?? ""} onChange={set(g.id)} />
            </Field>
          ),
        )}
      </div>
      {err && <p className="mt-2 text-sm text-red-800" role="alert">{err}</p>}
      <Button type="submit" className="mt-3" data-testid="cerfa-save">
        Enregistrer dans le cerfa
      </Button>
    </form>
  );
}
