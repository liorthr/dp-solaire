"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge, Button, Tabs } from "@/components/ui";
import { useProject } from "@/components/dossier/useProject";
import { SyntheseTab } from "@/components/dossier/SyntheseTab";
import { PlansTab } from "@/components/dossier/PlansTab";
import { InsertionTab } from "@/components/dossier/InsertionTab";
import { DossierTab } from "@/components/dossier/DossierTab";
import { EnvoiTab } from "@/components/dossier/EnvoiTab";
import { SuiviTab } from "@/components/dossier/SuiviTab";
import { STATUS_LABEL, STATUS_TONE } from "@/lib/project/status";
import { repo } from "@/lib/store/db";

type Tab = "synthese" | "plans" | "insertion" | "dossier" | "envoi" | "suivi";

function DossierView() {
  const sp = useSearchParams();
  const router = useRouter();
  const id = sp.get("id");
  const [tab, setTab] = useState<Tab>((sp.get("tab") as Tab) || "synthese");
  const b = useProject(id);
  if (!b) return <p>Dossier introuvable. <Link className="underline" href="/app/">Retour</Link></p>;
  const { project: p, analysis } = b;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-xl font-bold sm:text-2xl" data-testid="project-title">{p.reference}</h1>
          <p className="text-sm text-stone-600">
            {p.address?.label} : {b.client ? `${b.client.firstName} ${b.client.lastName}` : "client ?"} : {p.pv.panelCount} panneaux, {String(p.pv.powerKwc).replace(".", ",")} kWc
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={STATUS_TONE[analysis.status]}>{STATUS_LABEL[analysis.status]}</Badge>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Supprimer le dossier"
            onClick={async () => {
              if (!window.confirm("Supprimer définitivement ce dossier et ses photos ?")) return;
              await repo.deleteProject(p.id);
              router.push("/app/");
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <Tabs<Tab>
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "synthese", label: "Synthèse", badge: analysis.evaluation.blocking.length ? <Badge tone="bloquant">{analysis.evaluation.blocking.length}</Badge> : undefined },
          { id: "plans", label: "Plans" },
          { id: "insertion", label: "Photos & insertion" },
          { id: "dossier", label: "Dossier" },
          { id: "envoi", label: "Envoi" },
          { id: "suivi", label: "Suivi" },
        ]}
      />
      {tab === "synthese" && <SyntheseTab b={b} />}
      {tab === "plans" && <PlansTab b={b} />}
      {tab === "insertion" && <InsertionTab b={b} />}
      {tab === "dossier" && <DossierTab b={b} />}
      {tab === "envoi" && <EnvoiTab b={b} goTo={(t) => setTab(t as Tab)} />}
      {tab === "suivi" && <SuiviTab b={b} />}
    </div>
  );
}

export default function Page() {
  return (
    <AppShell>
      <Suspense fallback={<p>Chargement…</p>}>
        <DossierView />
      </Suspense>
    </AppShell>
  );
}
