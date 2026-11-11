"use client";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Badge, Card, Tabs, severityTone } from "@/components/ui";
import { HealthTable } from "@/components/HealthTable";
import { ruleset } from "@/lib/rules/engine";
import { cerfaVersions } from "@/lib/dossier/cerfa";
import { useSession } from "@/lib/store/hooks";

function Admin() {
  const { session } = useSession();
  const [tab, setTab] = useState<"rules" | "cerfa" | "providers">("rules");
  if (!session?.user.isSuperAdmin) return <p>Accès réservé au super-administrateur.</p>;
  return (
    <div className="space-y-4">
      <p className="rounded bg-amber-50 p-2 text-sm text-amber-900">Les règles et mappings sont des données versionnées (fichiers JSON du dépôt, tables <code>regulation_rules</code> et <code>cerfa_versions</code> en base). En V1 la modification se fait par pull request revue ; l&apos;édition en ligne arrivera avec le driver Supabase.</p>
      <Tabs value={tab} onChange={setTab} tabs={[{ id: "rules", label: `Règles (${ruleset.rules.length})` }, { id: "cerfa", label: "Cerfa & mapping" }, { id: "providers", label: "Adaptateurs d'API" }]} />
      {tab === "rules" && (
        <Card title={`Jeu de règles ${ruleset.ruleset} v${ruleset.version} (publié le ${ruleset.published_at})`}>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b text-stone-500">
                <th className="py-1.5">Code</th>
                <th>Catégorie</th>
                <th>Sévérité</th>
                <th>Validité</th>
                <th>Statut</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {[...ruleset.regimes.map((r) => ({ ...r, category: "regime", severity: r.outcome, version: 1 })), ...ruleset.rules].map((r) => (
                <tr key={r.code} className="border-b align-top">
                  <td className="py-1.5 pr-2 font-mono">{r.code} v{r.version}</td>
                  <td className="pr-2">{r.category}</td>
                  <td className="pr-2"><Badge tone={severityTone(String(r.severity))}>{String(r.severity)}</Badge></td>
                  <td className="pr-2">{r.valid_from} → {r.valid_to ?? "…"}</td>
                  <td className="pr-2">{r.verification === "VERIFIE" ? <Badge tone="ok">vérifié</Badge> : <Badge tone="alerte">À_VÉRIFIER</Badge>}</td>
                  <td><a className="underline" href={r.source_url} target="_blank" rel="noreferrer">{r.source_label ?? "lien"}</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      {tab === "cerfa" &&
        cerfaVersions.map((c) => (
          <Card key={c.cerfa + c.version} title={`Cerfa ${c.cerfa}*${c.version} : valide depuis ${c.valid_from}`}>
            <p className="mb-2 text-xs"><a className="underline" href={c.source_url} target="_blank" rel="noreferrer">PDF officiel</a> : {c.fields.length} champs mappés</p>
            <table className="w-full text-left text-xs">
              <tbody>
                {c.fields.map((f) => (
                  <tr key={f.field} className="border-b">
                    <td className="py-1 pr-2 font-mono">{f.field}</td>
                    <td className="pr-2">{f.type}</td>
                    <td className="pr-2 font-mono">{f.value}</td>
                    <td>{f.label}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        ))}
      {tab === "providers" && (
        <Card title="Santé des adaptateurs">
          <HealthTable />
        </Card>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <AppShell title="Back-office super-admin">
      <Admin />
    </AppShell>
  );
}
