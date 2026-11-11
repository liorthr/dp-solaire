"use client";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Button, Card } from "@/components/ui";
import { repo } from "@/lib/store/db";
import { useDbVersion } from "@/lib/store/hooks";

function Clients() {
  useDbVersion();
  const clients = repo.clients();
  const projects = repo.projects();
  return (
    <Card title={`Maîtres d'ouvrage (${clients.length})`}>
      <ul className="divide-y">
        {clients.map((c) => {
          const ps = projects.filter((p) => p.clientId === c.id);
          return (
            <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
              <div>
                <p className="font-medium">
                  {c.civility} {c.firstName} {c.lastName}
                </p>
                <p className="text-stone-600">
                  {c.email} {c.phone && `: ${c.phone}`}
                </p>
                <p className="text-xs text-stone-500">
                  Dossiers : {ps.map((p) => (
                    <Link key={p.id} className="mr-2 underline" href={`/app/dossier/?id=${p.id}`}>{p.reference}</Link>
                  ))}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-700"
                onClick={async () => {
                  if (window.confirm(`Droit à l'effacement : supprimer ${c.firstName} ${c.lastName} et ses ${ps.length} dossier(s) ?`)) await repo.purgeClientData(c.id);
                }}
              >
                Effacer (RGPD)
              </Button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

export default function Page() {
  return (
    <AppShell title="Clients">
      <Clients />
    </AppShell>
  );
}
