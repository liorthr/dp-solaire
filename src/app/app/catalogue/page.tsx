"use client";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Badge, Button, Card, Field, Input, Select } from "@/components/ui";
import type { PanelModel } from "@/lib/types";
import { repo } from "@/lib/store/db";
import { useDbVersion } from "@/lib/store/hooks";

function Catalogue() {
  useDbVersion();
  const [f, setF] = useState<Omit<PanelModel, "id">>({ brand: "", model: "", powerWc: 430, widthMm: 1134, heightMm: 1722, thicknessMm: 30, frameColor: "noir", cellColor: "noir", fullBlack: true });
  const num = (k: keyof PanelModel) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: Number(e.target.value) });
  return (
    <div className="space-y-4">
      <Card title="Panneaux">
        <ul className="divide-y text-sm">
          {repo.panels().map((p) => (
            <li key={p.id} className="flex flex-wrap justify-between gap-2 py-2">
              <span>
                <strong>{p.brand}</strong> {p.model} : {p.powerWc} Wc : {p.widthMm}×{p.heightMm}×{p.thicknessMm} mm
              </span>
              <span>{p.fullBlack ? <Badge tone="ok">full black</Badge> : <Badge>cadre {p.frameColor}</Badge>}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-stone-500">Les modèles « Générique » sont des exemples : ajoutez les fiches techniques de vos fournisseurs.</p>
      </Card>
      <Card title="Ajouter un panneau">
        <form
          className="grid gap-3 sm:grid-cols-3"
          onSubmit={(e) => {
            e.preventDefault();
            repo.savePanel(f);
            setF({ ...f, brand: "", model: "" });
          }}
        >
          <Field label="Marque"><Input required value={f.brand} onChange={(e) => setF({ ...f, brand: e.target.value })} /></Field>
          <Field label="Modèle"><Input required value={f.model} onChange={(e) => setF({ ...f, model: e.target.value })} /></Field>
          <Field label="Puissance (Wc)"><Input type="number" value={f.powerWc} onChange={num("powerWc")} /></Field>
          <Field label="Largeur (mm)"><Input type="number" value={f.widthMm} onChange={num("widthMm")} /></Field>
          <Field label="Hauteur (mm)"><Input type="number" value={f.heightMm} onChange={num("heightMm")} /></Field>
          <Field label="Épaisseur (mm)"><Input type="number" value={f.thicknessMm} onChange={num("thicknessMm")} /></Field>
          <Field label="Cadre">
            <Select value={f.frameColor} onChange={(e) => setF({ ...f, frameColor: e.target.value as PanelModel["frameColor"] })}>
              <option value="noir">Noir</option>
              <option value="argent">Argent</option>
            </Select>
          </Field>
          <Field label="Cellules">
            <Select value={f.cellColor} onChange={(e) => setF({ ...f, cellColor: e.target.value as PanelModel["cellColor"], fullBlack: e.target.value === "noir" && f.frameColor === "noir" })}>
              <option value="noir">Noires</option>
              <option value="bleu">Bleues</option>
            </Select>
          </Field>
          <div className="flex items-end">
            <Button type="submit">Ajouter</Button>
          </div>
        </form>
      </Card>
      <Card title="Onduleurs">
        <ul className="divide-y text-sm">
          {repo.inverters().map((p) => (
            <li key={p.id} className="py-2">
              <strong>{p.brand}</strong> {p.model} : {p.kind} : {p.powerVa} VA
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

export default function Page() {
  return (
    <AppShell title="Catalogue matériel">
      <Catalogue />
    </AppShell>
  );
}
