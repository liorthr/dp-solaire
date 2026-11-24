"use client";
// Retour de Stripe après paiement : on attend l'enregistrement du paiement (webhook), puis on rouvre le dossier.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui";
import { paymentStatus, PENDING_KEY } from "@/lib/cloud/payments";
import { track } from "@/lib/analytics";

function Waiting() {
  const router = useRouter();
  const [state, setState] = useState<"wait" | "ok" | "late">("wait");
  const [projectId, setProjectId] = useState<string>();
  useEffect(() => {
    let alive = true;
    const pending = JSON.parse(localStorage.getItem(PENDING_KEY) ?? "null") as { projectId: string; kind?: string } | null;
    if (!pending) {
      setState("late");
      return;
    }
    setProjectId(pending.projectId);
    (async () => {
      for (let i = 0; i < 20 && alive; i++) {
        const st = await paymentStatus(pending.projectId).catch(() => ({ paid: false, options: [] as string[] }));
        // achat du pack seul : on attend l'option ; sinon le dossier (avec ou sans option)
        const done = pending.kind === "RAC" ? st.options.includes("RAC") : st.paid;
        if (done) {
          localStorage.removeItem(PENDING_KEY);
          track("paid", pending.kind === "RAC" ? "rac" : st.options.includes("RAC") ? "dossier-rac" : "dossier");
          setState("ok");
          router.replace(`/app/dossier/?id=${pending.projectId}&tab=${pending.kind === "RAC" ? "raccordement" : "dossier"}`);
          return;
        }
        await new Promise((r) => setTimeout(r, 2000));
      }
      if (alive) setState("late");
    })();
    return () => {
      alive = false;
    };
  }, [router]);
  return (
    <Card title="Paiement">
      {state === "wait" && (
        <p className="flex items-center gap-2" aria-live="polite">
          <Loader2 className="h-5 w-5 animate-spin" /> Merci ! Nous confirmons votre paiement…
        </p>
      )}
      {state === "ok" && <p>Paiement confirmé : ouverture de votre dossier…</p>}
      {state === "late" && (
        <p>
          La confirmation prend plus de temps que prévu. Votre paiement est bien enregistré par Stripe ; rouvrez votre dossier dans quelques minutes{projectId ? (
            <>
              {" "}: <Link className="underline" href={`/app/dossier/?id=${projectId}&tab=dossier`}>ouvrir le dossier</Link>
            </>
          ) : null}
          . En cas de souci, écrivez-nous depuis la page d&apos;aide.
        </p>
      )}
    </Card>
  );
}

export default function Page() {
  return (
    <AppShell title="Paiement">
      <Waiting />
    </AppShell>
  );
}
