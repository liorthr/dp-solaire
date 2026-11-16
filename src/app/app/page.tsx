"use client";
import { worksSummary } from "@/lib/works/summary";
import Link from "next/link";
import { useEffect, useMemo } from "react";
import { AlertTriangle, CalendarClock, Clock, FilePlus2, Trophy } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge, Button, Card } from "@/components/ui";
import { isHomeowner, repo } from "@/lib/store/db";
import { useSession } from "@/lib/store/hooks";
import { journeySteps, nextStep } from "@/components/dossier/HomeownerJourney";
import { WorksIcon } from "@/components/home/WorksIcon";
import { useDbVersion } from "@/lib/store/hooks";
import { analyze, MANUAL_HOURS_PER_DOSSIER, STATUS_LABEL, STATUS_TONE } from "@/lib/project/status";
import { daysBetween, fr } from "@/lib/instruction/deadlines";

function Dashboard() {
  const v = useDbVersion();
  const today = new Date().toISOString().slice(0, 10);
  const rows = useMemo(() => {
    void v;
    const panels = repo.panels();
    return repo.projects().map((p) => ({ p, client: repo.client(p.clientId), a: analyze(p, repo.client(p.clientId), panels.find((x) => x.id === p.pv.panelId), today) }));
  }, [v, today]);
  const upcoming = rows
    .flatMap((r) => r.a.instruction.keyDates.filter((k) => k.kind === "echeance" && k.date >= today).map((k) => ({ ...k, p: r.p })))
    .sort((a, b) => a.date.localeCompare(b.date));
  const critical = upcoming.filter((u) => daysBetween(today, u.date) <= 7);
  const decided = rows.filter((r) => ["accord", "refus"].includes(r.a.status));
  const rate = decided.length ? Math.round((100 * decided.filter((r) => r.a.status === "accord").length) / decided.length) : null;
  const notifs = repo.notifications().filter((n) => !n.read);

  // notifications in-app : rappels J-7 et décisions tacites
  useEffect(() => {
    for (const r of rows) {
      for (const rem of r.a.instruction.reminders) if (rem.date <= today) repo.upsertNotification({ id: `${r.p.id}-${rem.code}`, projectId: r.p.id, date: rem.date, title: `${r.p.reference} : ${rem.label}` });
      if (r.a.instruction.tacitAcquired) repo.upsertNotification({ id: `${r.p.id}-tacite`, projectId: r.p.id, date: today, title: `${r.p.reference} : non-opposition tacite acquise : demandez le certificat` });
    }
  }, [rows, today]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold sm:text-2xl">Tableau de bord</h1>
        <Link href="/app/nouveau/">
          <Button size="lg">
            <FilePlus2 className="h-5 w-5" /> Nouveau dossier
          </Button>
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi icon={<Clock className="h-5 w-5" />} label="Dossiers en cours" value={rows.filter((r) => !["accord", "refus", "retire"].includes(r.a.status)).length} />
        <Kpi icon={<AlertTriangle className="h-5 w-5" />} label="Délais ≤ 7 jours" value={critical.length} tone={critical.length ? "text-red-700" : undefined} />
        <Kpi icon={<Trophy className="h-5 w-5" />} label="Taux d'acceptation" value={rate === null ? "–" : `${rate} %`} sub={`${decided.length} décision(s)`} />
        <Kpi icon={<CalendarClock className="h-5 w-5" />} label="Temps gagné (estimation)" value={`${rows.length * MANUAL_HOURS_PER_DOSSIER} h`} sub={`base ${MANUAL_HOURS_PER_DOSSIER} h/dossier manuel`} />
      </div>
      {notifs.length > 0 && (
        <Card title="Notifications">
          <ul className="space-y-2 text-sm">
            {notifs.slice(0, 6).map((n) => (
              <li key={n.id} className="flex items-start justify-between gap-2">
                <Link className="underline" href={`/app/dossier/?id=${n.projectId}&tab=suivi`}>{n.title}</Link>
                <button className="shrink-0 text-xs text-stone-500 underline" onClick={() => repo.markNotificationRead(n.id)}>Marquer lu</button>
              </li>
            ))}
          </ul>
        </Card>
      )}
      <Card title="Échéances à venir">
        {upcoming.length === 0 ? (
          <p className="text-sm text-stone-500">Aucune échéance : les délais apparaissent dès qu&apos;un dossier est déposé.</p>
        ) : (
          <ul className="divide-y text-sm">
            {upcoming.slice(0, 6).map((u) => (
              <li key={`${u.p.id}${u.code}`} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span>
                  <Link href={`/app/dossier/?id=${u.p.id}&tab=suivi`} className="font-medium underline">{u.p.reference}</Link> : {u.label}
                </span>
                <Badge tone={daysBetween(today, u.date) <= 7 ? "bloquant" : "neutral"}>{fr(u.date)} (J-{daysBetween(today, u.date)})</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card title={`Dossiers (${rows.length})`}>
        {rows.length === 0 ? (
          <p className="text-sm text-stone-500">Aucun dossier. Créez le premier en 4 étapes.</p>
        ) : (
          <ul className="divide-y">
            {rows.map(({ p, client, a }) => (
              <li key={p.id} className="py-3">
                <Link href={`/app/dossier/?id=${p.id}`} className="flex flex-wrap items-center justify-between gap-2 hover:bg-stone-50" data-testid="project-row">
                  <div className="min-w-0">
                    <p className="font-medium">
                      {p.reference} {p.demo && <Badge>démo</Badge>}
                    </p>
                    <p className="truncate text-sm text-stone-600">
                      {p.address?.label} : {client ? `${client.firstName} ${client.lastName}` : "client à renseigner"} : {worksSummary(p)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {a.facts["heritage.protected"] === true && <Badge tone="alerte">ABF</Badge>}
                    {a.evaluation.blocking.length > 0 && !p.events.length && <Badge tone="bloquant">{a.evaluation.blocking.length} bloquant(s)</Badge>}
                    <Badge tone={STATUS_TONE[a.status]}>{STATUS_LABEL[a.status]}</Badge>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Kpi({ icon, label, value, sub, tone }: { icon: React.ReactNode; label: string; value: React.ReactNode; sub?: string; tone?: string }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <div className="flex items-center gap-2 text-sm text-stone-600">
        {icon} {label}
      </div>
      <p className={`mt-1 text-2xl font-bold ${tone ?? ""}`}>{value}</p>
      {sub && <p className="text-xs text-stone-500">{sub}</p>}
    </div>
  );
}

/** « Mes projets » d'un particulier : une carte par projet, avec la prochaine étape bien visible */
function MyProjects() {
  const v = useDbVersion();
  const today = new Date().toISOString().slice(0, 10);
  const rows = useMemo(() => {
    void v;
    const panels = repo.panels();
    return repo.projects().map((p) => {
      const client = repo.client(p.clientId);
      const a = analyze(p, client, panels.find((x) => x.id === p.pv.panelId), today);
      return { p, b: { project: p, client, tenant: repo.tenant(), analysis: a } as unknown as Parameters<typeof journeySteps>[0] };
    });
  }, [v, today]);
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold sm:text-3xl">Mes projets</h1>
        <Link href="/verifier/">
          <Button size="lg">
            <FilePlus2 className="h-5 w-5" /> Nouveau projet
          </Button>
        </Link>
      </div>
      {rows.length === 0 ? (
        <Card>
          <p className="text-lg font-semibold">Vous n&apos;avez pas encore de projet.</p>
          <p className="mt-1 text-muted">Dites-nous ce que vous voulez faire : on vérifie les règles de votre commune en une minute.</p>
          <Link href="/verifier/" className="mt-4 inline-block">
            <Button size="lg">Commencer mon projet</Button>
          </Link>
        </Card>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {rows.map(({ p, b }) => {
            const steps = journeySteps(b);
            const n = nextStep(b);
            const done = steps.filter((s) => s.done).length;
            return (
              <li key={p.id} className="rounded-3xl border border-line bg-white p-5" data-testid="project-row">
                <div className="flex items-start gap-3">
                  <WorksIcon works={p.works ?? "pv"} className="h-12 w-12" />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{worksSummary(p)}</p>
                    <p className="truncate text-sm text-muted">{p.address?.label}</p>
                    <p className="text-xs text-muted">Réf. {p.reference}</p>
                  </div>
                </div>
                <div className="mt-4 flex gap-1" aria-label={`${done} étapes sur ${steps.length}`}>
                  {steps.map((s) => (
                    <i key={s.id} className={`h-1.5 flex-1 rounded ${s.done ? "bg-brand-600" : "bg-line"}`} />
                  ))}
                </div>
                <p className="mt-3 text-sm">
                  Prochaine étape : <b>{n.label}</b> <span className="text-muted">({n.hint.toLowerCase()})</span>
                </p>
                <Link href={`/app/dossier/?id=${p.id}&tab=${n.id}`} className="mt-3 inline-block">
                  <Button>Continuer</Button>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Home() {
  const { session } = useSession();
  return isHomeowner(session) ? <MyProjects /> : <Dashboard />;
}

export default function Page() {
  return (
    <AppShell>
      <Home />
    </AppShell>
  );
}
