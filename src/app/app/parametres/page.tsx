"use client";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Badge, Button, Card, Field, Input, Select } from "@/components/ui";
import type { Role } from "@/lib/types";
import { repo } from "@/lib/store/db";
import { useDbVersion, useSession } from "@/lib/store/hooks";
import { download } from "@/components/dossier/DossierTab";

function Settings() {
  useDbVersion();
  const { session } = useSession();
  const t = repo.tenant();
  const isAdmin = session?.role === "admin";
  const [m, setM] = useState({ email: "", fullName: "", role: "user" as Role, password: "" });
  const [msg, setMsg] = useState("");
  const upd = (k: keyof typeof t) => (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => repo.updateTenant({ [k]: e.target.value });

  return (
    <div className="space-y-4">
      <Card title="Entreprise (mentions des documents)">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Raison sociale"><Input defaultValue={t.name} onBlur={upd("name")} disabled={!isAdmin} /></Field>
          <Field label="SIRET"><Input defaultValue={t.siret} onBlur={upd("siret")} disabled={!isAdmin} /></Field>
          <Field label="Adresse"><Input defaultValue={t.address} onBlur={upd("address")} disabled={!isAdmin} /></Field>
          <Field label="Téléphone"><Input defaultValue={t.phone} onBlur={upd("phone")} disabled={!isAdmin} /></Field>
          <Field label="Email de contact"><Input defaultValue={t.email} onBlur={upd("email")} disabled={!isAdmin} /></Field>
          <Field label="Logo">
            <input
              type="file"
              accept="image/png,image/jpeg"
              disabled={!isAdmin}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const r = new FileReader();
                r.onload = () => repo.updateTenant({ logoDataUrl: String(r.result) });
                r.readAsDataURL(f);
              }}
            />
            {t.logoDataUrl && <img src={t.logoDataUrl} alt="Logo" className="mt-1 h-10" />}
          </Field>
          <div className="sm:col-span-2">
            <Field label="Mentions légales (pied des courriers)">
              <textarea className="h-20 w-full rounded-lg border border-stone-300 p-2 text-sm" defaultValue={t.legalMentions} onBlur={upd("legalMentions")} disabled={!isAdmin} />
            </Field>
          </div>
        </div>
      </Card>

      <Card title="Utilisateurs">
        <ul className="divide-y text-sm">
          {repo.members().map((x) => (
            <li key={x.userId} className="flex justify-between py-2">
              <span>{x.user.fullName} : {x.user.email}</span>
              <Badge>{x.role}</Badge>
            </li>
          ))}
        </ul>
        {isAdmin && (
          <form
            className="mt-3 grid gap-2 sm:grid-cols-5"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await repo.addMember(m.email, m.fullName, m.role, m.password);
                setMsg("Utilisateur ajouté.");
                setM({ email: "", fullName: "", role: "user", password: "" });
              } catch (err) {
                setMsg(err instanceof Error ? err.message : String(err));
              }
            }}
          >
            <Input placeholder="Nom" required value={m.fullName} onChange={(e) => setM({ ...m, fullName: e.target.value })} />
            <Input placeholder="Email" type="email" required value={m.email} onChange={(e) => setM({ ...m, email: e.target.value })} />
            <Input placeholder="Mot de passe" type="password" required minLength={8} value={m.password} onChange={(e) => setM({ ...m, password: e.target.value })} />
            <Select value={m.role} onChange={(e) => setM({ ...m, role: e.target.value as Role })}>
              <option value="user">Utilisateur</option>
              <option value="admin">Administrateur</option>
            </Select>
            <Button type="submit">Ajouter</Button>
          </form>
        )}
        {msg && <p className="mt-2 text-sm">{msg}</p>}
      </Card>

      <Card title="Données personnelles (RGPD)">
        <div className="space-y-3 text-sm">
          <Field label="Durée de conservation après clôture du dossier (mois)" help="Les dossiers clos (accord, refus, retiré) plus anciens sont supprimés lors de la purge.">
            <Input type="number" min={6} max={240} defaultValue={t.retentionMonths} disabled={!isAdmin} onBlur={(e) => repo.updateTenant({ retentionMonths: Number(e.target.value) })} />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={async () => download(new Blob([JSON.stringify(await repo.exportTenantData(), null, 2)], { type: "application/json" }), `export_rgpd_${new Date().toISOString().slice(0, 10)}.json`)}>
              Exporter toutes les données (JSON)
            </Button>
            <Button variant="outline" disabled={!isAdmin} onClick={async () => setMsg(`${await repo.applyRetention()} dossier(s) purgé(s).`)}>
              Appliquer la durée de conservation
            </Button>
          </div>
          <p className="text-xs text-stone-500">Effacement d&apos;un client : page Clients. Les données ne sont jamais envoyées à un service tiers sans action de votre part ; les appels aux API publiques ne transmettent que des coordonnées et codes communes.</p>
        </div>
      </Card>

      <Card title="Journal d'audit">
        <ul className="max-h-80 divide-y overflow-y-auto text-xs">
          {repo.audit().slice(0, 200).map((a) => (
            <li key={a.id} className="flex justify-between gap-2 py-1.5">
              <span>{a.action.replace(/_/g, " ")} {a.entity && <span className="text-stone-500">({a.entity})</span>}</span>
              <span className="shrink-0 text-stone-500">{new Date(a.at).toLocaleString("fr-FR")}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

export default function Page() {
  return (
    <AppShell title="Entreprise & RGPD">
      <Settings />
    </AppShell>
  );
}
